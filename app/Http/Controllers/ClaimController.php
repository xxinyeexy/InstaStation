<?php

namespace App\Http\Controllers;

use App\Models\Parcel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class ClaimController extends Controller
{
    /**
     * Public page: list/search unclaimed parcels.
     */
    public function unclaimed(Request $request)
    {
        $q = (string) $request->get('q', '');

        $parcels = collect();
        if ($q !== '') {
            $parcels = Parcel::query()
                ->with('studentUser')
                ->whereRaw('lower(parcel_status) = ?', ['unclaimed'])
                ->where(function ($qq) use ($q) {
                    $qq->where('tracking_no', 'like', "%{$q}%")
                        ->orWhere('sender', 'like', "%{$q}%")
                        ->orWhere('location', 'like', "%{$q}%")
                        ->orWhere('recipient_name', 'like', "%{$q}%")
                        ->orWhere('recipient_matric', 'like', "%{$q}%");
                })
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // Stats only for the current result set
        $stats = [
            'unclaimed' => $parcels->count(),
            'highPriority' => $parcels->where('days', '>=', 7)->count(),
            'avgDays' => (int) round(max(0, $parcels->avg('days') ?? 0)),
        ];

        return Inertia::render('public/unclaimed', [
            'parcels' => $parcels->values()->toArray(),
            'stats' => $stats,
            'filters' => ['q' => $q],
        ]);
    }

    /**
     * Start a claim. If authenticated, immediately link; otherwise set intended URL to a
     * signed consume endpoint and send the user to login/registration.
     */
    public function start(Request $request)
    {
        $request->validate([
            'parcel_id' => 'required|integer|exists:parcels,parcel_id',
            'redirect' => 'nullable|in:login,register',
        ]);

        $parcel = Parcel::findOrFail($request->integer('parcel_id'));

        if (Auth::check()) {
            $user = Auth::user();

            // Only link if it's still unclaimed or not assigned
            $parcel->student_id = $user->id;
            // Persist recipient details on the row for quick reference
            $parcel->recipient_name = $user->name;
            $parcel->recipient_matric = $user->matric;
            // Claimed – awaiting pickup maps to Pending Payment in your lifecycle
            if (strtolower((string) $parcel->parcel_status) === 'unclaimed') {
                $parcel->parcel_status = 'Pending Payment';
            }
            $parcel->save();

            return back()->with('status', 'Claim recorded. Bring your student ID.');
        }

        // Build temporary signed URL valid for 15 minutes
        $signedUrl = URL::temporarySignedRoute(
            'claim.consume',
            now()->addMinutes(15),
            ['parcel_id' => $parcel->parcel_id]
        );

        // After auth, redirect to consume URL automatically
        $request->session()->put('url.intended', $signedUrl);

        $target = $request->get('redirect', 'login') === 'register' ? route('register') : route('login');

        return redirect()->to($target)->with('status', 'Please sign in to link the parcel.');
    }

    /**
     * Consume a signed claim after auth. Links parcel to the authenticated student.
     */
    public function consume(Request $request)
    {
        if (! $request->hasValidSignature()) {
            return redirect()->route('home')->with('status', 'Session expired. Please try again or visit the parcel office.');
        }

        if (! Auth::check()) {
            // If somehow not logged in yet, send back to login and keep the same intended
            $request->session()->put('url.intended', $request->fullUrl());
            return redirect()->route('login');
        }

        $parcelId = (int) $request->get('parcel_id');
        $parcel = Parcel::find($parcelId);
        if (! $parcel) {
            return redirect()->route('home')->with('status', 'Parcel not found.');
        }

        $user = Auth::user();
        $parcel->student_id = $user->id;
        $parcel->recipient_name = $user->name;
        $parcel->recipient_matric = $user->matric;
        if (strtolower((string) $parcel->parcel_status) === 'unclaimed') {
            $parcel->parcel_status = 'Pending Payment';
        }
        $parcel->save();

        return redirect()->route('student.parcel')->with('status', 'Parcel linked to your account. Bring your student ID.');
    }

    /**
     * Public search API: tracking number + name/matric → fuzzy match and guidance.
     * Returns JSON for frontend to render decision UI.
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:255', // single search box: tracking/matric/name
            'tracking_no' => 'nullable|string|max:50', // legacy support
            'name' => 'nullable|string|max:255',
            'matric' => 'nullable|string|max:50',
        ]);

        $q = trim((string) ($validated['q'] ?? ''));
        $trackingNo = trim((string) ($validated['tracking_no'] ?? ''));
        $inputName = trim((string) ($validated['name'] ?? ''));
        $inputMatric = trim((string) ($validated['matric'] ?? ''));

        // If unified input provided, fan-out
        if ($q !== '') {
            if (preg_match('/^[A-Z0-9-]{6,}$/i', $q)) {
                $trackingNo = $trackingNo ?: $q;
            }
            // Heuristic: CB12345 like matric
            if ($inputMatric === '' && preg_match('/^[A-Za-z]{1,3}\d{3,}$/', $q)) {
                $inputMatric = $q;
            }
            if ($inputName === '' && !preg_match('/^[A-Za-z]{1,3}\d{3,}$/', $q)) {
                $inputName = $q;
            }
        }

        // First, try by tracking number (primary)
        $parcel = null;
        if ($trackingNo !== '') {
            $parcel = Parcel::query()->with('studentUser')->where('tracking_no', $trackingNo)->first();
        }

        // If not found and have matric/name, search parcels joined to users
        if (! $parcel && ($inputMatric !== '' || $inputName !== '')) {
            $parcel = Parcel::query()
                ->with('studentUser')
                ->when($inputMatric !== '', function ($q2) use ($inputMatric) {
                    $q2->whereHas('studentUser', function ($uq) use ($inputMatric) {
                        $uq->where('matric', 'like', "%{$inputMatric}%");
                    });
                })
                ->when($inputName !== '', function ($q2) use ($inputName) {
                    $q2->whereHas('studentUser', function ($uq) use ($inputName) {
                        $uq->where('name', 'like', "%{$inputName}%");
                    });
                })
                // Also consider parcels that store recipient_name/matric directly (unclaimed)
                ->orWhere(function ($qq) use ($inputName, $inputMatric) {
                    if ($inputName !== '') {
                        $qq->where('recipient_name', 'like', "%{$inputName}%");
                    }
                    if ($inputMatric !== '') {
                        $qq->orWhere('recipient_matric', 'like', "%{$inputMatric}%");
                    }
                })
                ->orderByDesc('created_at')
                ->first();
        }

        if (! $parcel) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'Tracking number not found. Please verify or visit the parcel office.',
            ], 404);
        }

        // Build candidate users to compare names against
        $candidates = collect();
        if ($parcel->student_id) {
            $candidates->push($parcel->studentUser);
        }
        if ($inputMatric !== '') {
            $u = \App\Models\User::query()->where('matric', $inputMatric)->first();
            if ($u) $candidates->push($u);
        }
        if ($inputName !== '') {
            $namePart = preg_replace('/\s+/', ' ', $inputName);
            $byName = \App\Models\User::query()
                ->where('type', 'student')
                ->where('name', 'like', "%{$namePart}%")
                ->limit(5)
                ->get();
            $candidates = $candidates->merge($byName);
        }

        // De-duplicate by id
        $candidates = $candidates->filter()->unique('id')->values();

        // Score candidates
        $scored = $candidates->map(function ($u) use ($inputName) {
            $score = $this->fuzzyScore($inputName, (string) $u->name);
            return [
                'user_id' => $u->id,
                'name' => $u->name,
                'initials' => $this->initials($u->name),
                'matric' => $u->matric,
                'score' => $score,
            ];
        })->sortByDesc('score')->values();

        $best = $scored->first();
        $bestScore = (int) ($best['score'] ?? 0);

        // Decide message by confidence
        $confidence = $inputName === '' && $inputMatric === ''
            ? 'borderline' // if user didn't provide identity info, keep message softer
            : ($bestScore >= 80 ? 'high' : ($bestScore >= 70 ? 'borderline' : 'low'));
        $message = $confidence === 'low'
            ? 'No clear match found. Please visit the parcel office to verify.'
            : ("We found a parcel for a similar name: '" . ($best['initials'] ?? '') . "'. Is this yours?");

        // Prepare ambiguous list (top 3)
        $top = $scored->take(3)->map(function ($c) {
            return [
                'label' => $c['initials'] . ' — ' . (int) $c['score'],
                'score' => (int) $c['score'],
                'user_id' => $c['user_id'],
            ];
        })->values();

        return response()->json([
            'status' => 'ok',
            'parcel' => [
                'parcel_id' => $parcel->parcel_id,
                'tracking_no' => $parcel->tracking_no,
                'sender' => $parcel->sender,
                'location' => $parcel->location,
                'size' => $parcel->size,
                'days' => $parcel->days,
                'parcel_status' => $parcel->parcel_status,
                // Expose recipient details if parcel is already associated
                'recipient_name' => optional($parcel->studentUser)->name,
                'recipient_matric' => optional($parcel->studentUser)->matric,
            ],
            'confidence' => $confidence,
            'message' => $message,
            'best' => $best,
            'candidates' => $top,
            'actions' => [
                'login' => route('login'),
                'register' => route('register'),
                'claim_start_login' => route('claim.start'),
                'claim_start_register' => route('claim.start'),
            ],
        ]);
    }

    private function fuzzyScore(string $a, string $b): int
    {
        $a = trim(mb_strtolower($a));
        $b = trim(mb_strtolower($b));
        if ($a === '' || $b === '') {
            return 0;
        }

        // Use similar_text for a quick percentage and normalize length differences a bit
        similar_text($a, $b, $percent);
        // Weight with token overlap
        $tokensA = collect(preg_split('/\s+/', $a))->filter();
        $tokensB = collect(preg_split('/\s+/', $b))->filter();
        $overlap = $tokensA->intersect($tokensB)->count();
        $tokenBoost = min(20, $overlap * 10);
        $score = (int) round(min(100, $percent + $tokenBoost));
        return $score;
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name));
        if (!$parts || count($parts) === 0) return '';
        if (count($parts) === 1) return $parts[0];
        $first = mb_substr($parts[0], 0, 1);
        $last = end($parts);
        return $first . '. ' . $last;
    }
}


