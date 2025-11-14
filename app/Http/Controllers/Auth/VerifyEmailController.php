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

        // Determine post-verification destination based on user role
        $roleTarget = ($user->type === 'staff')
            ? route('staff.dashboard')
            : route('student.parcel');

        // If already verified, redirect
        if ($user->hasVerifiedEmail()) {
            return redirect()->intended($roleTarget)->with('status', 'Email already verified!');
        }

        // Mark email as verified
        if ($request->fulfill()) {
            event(new Verified($user));
        }

        return redirect()->intended($roleTarget)->with('status', 'Email verified successfully!');
    }
}
