<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        // Ensure user is authenticated
        if (!$request->user()) {
            return redirect()->route('login')->with('error', 'Please log in to verify your email.');
        }

        // Get the authenticated user
        $user = $request->user();

        // Preserve the intended URL if it exists (e.g., from parcel claim flow)
        // This ensures parcel linking happens after verification
        $intendedUrl = $request->session()->get('url.intended');

        // Determine post-verification destination based on user role (fallback)
        $roleTarget = ($user->type === 'staff')
            ? route('staff.dashboard')
            : route('student.parcel');

        // If already verified, redirect to intended URL or role-based target
        if ($user->hasVerifiedEmail()) {
            // If there's an intended URL (e.g., parcel claim), use it; otherwise use role target
            if ($intendedUrl) {
                return redirect($intendedUrl)->with('status', 'Email already verified!');
            }
            return redirect($roleTarget)->with('status', 'Email already verified!');
        }

        // Mark email as verified
        if ($request->fulfill()) {
            event(new Verified($user));
        }

        // After verification, redirect to intended URL (e.g., parcel claim consume) or role-based target
        if ($intendedUrl) {
            // Clear the intended URL from session after using it
            $request->session()->forget('url.intended');
            return redirect($intendedUrl)->with('status', 'Email verified successfully!');
        }

        return redirect($roleTarget)->with('status', 'Email verified successfully!');
    }
}
