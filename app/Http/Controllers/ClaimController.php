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
                        ->orWhere('location', 'like', "%{$q}%");
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
            // Closest existing status to "claimed – awaiting pickup"
            if (strtolower((string) $parcel->parcel_status) === 'unclaimed') {
                $parcel->parcel_status = 'Ready For Collection';
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
        if (strtolower((string) $parcel->parcel_status) === 'unclaimed') {
            $parcel->parcel_status = 'Ready For Collection';
        }
        $parcel->save();

        return redirect()->route('student.parcel')->with('status', 'Parcel linked to your account. Bring your student ID.');
    }
}


