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

        // Total unclaimed parcels in the entire database (independent of search)
        $totalUnclaimed = Parcel::query()
            ->whereRaw('lower(parcel_status) = ?', ['unclaimed'])
            ->count();

        $parcels = collect();
        if ($q !== '') {
            $needle = mb_strtolower(trim($q));
            $needleNoSpaces = str_replace(' ', '', $needle);
            
            Log::info('Searching unclaimed parcels', ['q' => $q, 'needle' => $needle, 'needleNoSpaces' => $needleNoSpaces]);

            Log::info('Searching unclaimed parcels (PHP filtering)', ['q' => $q]);

            // Fetch all unclaimed parcels first
            $allParcels = Parcel::query()
                ->with('studentUser')
                ->whereRaw('lower(trim(parcel_status)) = ?', ['unclaimed'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Filter in PHP for precise control
            $parcels = $allParcels->filter(function ($p) use ($needle, $needleNoSpaces) {
                // 1. Tracking Number (Exact)
                if (mb_strtolower(trim($p->tracking_no ?? '')) === $needle) return true;

                // 2. Recipient Name (Exact)
                if (mb_strtolower(trim($p->recipient_name ?? '')) === $needle) return true;

                // 3. Recipient Matric (Exact & Robust)
                $pMatric = mb_strtolower(trim($p->recipient_matric ?? ''));
                if ($pMatric === $needle) return true;
                if (str_replace(' ', '', $pMatric) === $needleNoSpaces) return true;

                // 4. Linked Student Matric (Exact & Robust)
                if ($p->studentUser) {
                    $sMatric = mb_strtolower(trim($p->studentUser->matric ?? ''));
                    if ($sMatric === $needle) return true;
                    if (str_replace(' ', '', $sMatric) === $needleNoSpaces) return true;
                }

                return false;
            });
        }

        // Global stats across the entire database of unclaimed parcels
        $stats = [
            'unclaimed' => $totalUnclaimed,
            'highPriority' => Parcel::query()
                ->whereRaw('lower(parcel_status) = ?', ['unclaimed'])
                ->where('days', '>=', 7)
                ->count(),
            'avgDays' => (int) round(max(0, (float) (Parcel::query()
                ->whereRaw('lower(parcel_status) = ?', ['unclaimed'])
                ->avg('days') ?? 0))),
        ];

        return Inertia::render('public/unclaimed', [
            'parcels' => $parcels->values()->toArray(),
            'stats' => $stats,
            'filters' => ['q' => $q],
            'totalUnclaimed' => $totalUnclaimed,
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
        $redirectChoice = $request->get('redirect', 'login');
        $allowNewClaim = $redirectChoice === 'register';

        // Preserve search query so we can redirect back to the same search after login
        $searchQuery = $request->get('q', '');
        if ($searchQuery) {
            $request->session()->put('claim_search_query', $searchQuery);
        }

        // Build temporary signed URL valid for 15 minutes
        $signedUrl = URL::temporarySignedRoute(
            'claim.consume',
            now()->addMinutes(15),
            [
                'parcel_id' => $parcel->parcel_id,
                'allow_new' => $allowNewClaim ? 1 : 0,
                'redirect_type' => $redirectChoice, // Include redirect_type in the query params
            ]
        );

        // Store intended URL in both primary and backup session keys
        $request->session()->put('url.intended', $signedUrl);
        $request->session()->put('claim_intended_url', $signedUrl);
        $request->session()->put('claim_redirect_type', $redirectChoice); // Store redirect type in session
        
        // Debug logging to file
        $debugData = [
            'timestamp' => now()->toDateTimeString(),
            'action' => 'claim.start',
            'parcel_id' => $parcel->parcel_id,
            'redirect_choice' => $redirectChoice,
            'signed_url' => $signedUrl,
            'session_id' => $request->session()->getId(),
            'session_data' => [
                'url.intended' => $request->session()->get('url.intended'),
                'claim_intended_url' => $request->session()->get('claim_intended_url'),
                'claim_redirect_type' => $request->session()->get('claim_redirect_type'),
            ],
        ];
        file_put_contents(storage_path('logs/claim_debug.log'), json_encode($debugData, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);
        
        Log::info('ClaimController@start: Stored claim URLs in session', [
            'parcel_id' => $parcel->parcel_id,
            'redirect_choice' => $redirectChoice,
            'signed_url' => $signedUrl,
            'session_id' => $request->session()->getId(),
        ]);

        $target = $redirectChoice === 'register' ? route('register') : route('login');

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
        $parcelMatric = strtolower(trim((string) ($parcel->recipient_matric ?? '')));
        $userMatric = strtolower(trim((string) ($user->matric ?? '')));
        $redirectType = $request->get('redirect_type', $request->session()->get('claim_redirect_type', 'login'));
        $allowNewClaim = $redirectType === 'register';
        
        Log::info('ClaimController@consume: Processing claim', [
            'parcel_id' => $parcelId,
            'user_id' => $user->id,
            'user_matric' => $userMatric,
            'parcel_matric' => $parcelMatric,
            'redirect_type' => $redirectType,
            'allow_new_claim' => $allowNewClaim,
            'session_id' => $request->session()->getId(),
        ]);

        // Clear session keys after use
        $request->session()->forget(['url.intended', 'claim_intended_url', 'claim_redirect_type']);

        // For allow_new claims ("I'm new here"), link the parcel with basic validation
        if ($allowNewClaim) {
            // Safety check: if parcel has matric ID but no name, verify matric matches
            // This is a backup check since primary validation happens during registration
            $hasMatricOnly = $parcelMatric !== '' && trim((string) ($parcel->recipient_name ?? '')) === '';
            
            if ($hasMatricOnly && $userMatric !== '' && $parcelMatric !== $userMatric) {
                // This should rarely happen since we validate during registration
                // But keep as safety check in case someone bypasses registration flow
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()
                    ->route('public.unclaimed')
                    ->with('error', 'Matric ID mismatch. Please contact the parcel office.');
            }
            
            // Link the parcel to the student
            $parcel->student_id = $user->id;
            $parcel->recipient_name = $user->name;
            $parcel->recipient_matric = $user->matric;
            if (strtolower((string) $parcel->parcel_status) === 'unclaimed') {
                $parcel->parcel_status = 'Pending Payment';
            }
            $parcel->save();
            
            Log::info('Parcel linked via allow_new claim', [
                'parcel_id' => $parcel->parcel_id,
                'user_id' => $user->id,
                'user_matric' => $user->matric,
            ]);
            
            return redirect()->route('student.parcel')->with('status', 'Parcel linked to your account. Bring your student ID.');
        }

        // Only block if allow_new is false and there is a mismatch
        if ($parcelMatric !== '' && ($userMatric === '' || $parcelMatric !== $userMatric)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            $searchQuery = $request->session()->get('claim_search_query', $request->get('q', ''));
            $request->session()->forget('claim_search_query');

            return redirect()
                ->route('public.unclaimed', $searchQuery ? ['q' => $searchQuery] : [])
                ->with('error', 'Sorry, this parcel is tagged for a different matric ID. Please contact the parcel office.');
        }

        // Default linking for 'Yes, it's mine' (matric match)
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
