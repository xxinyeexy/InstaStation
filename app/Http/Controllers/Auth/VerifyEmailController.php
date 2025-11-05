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
        $user = $request->user();

        // Determine post-verification destination based on user role
        $roleTarget = ($user && method_exists($user, 'getAttribute') && $user->getAttribute('type') === 'staff')
            ? route('staff.dashboard')
            : route('student.parcel');

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended($roleTarget . '?verified=1');
        }

        if ($user->markEmailAsVerified()) {
            /** @var \Illuminate\Contracts\Auth\MustVerifyEmail $user */
            event(new Verified($user));
        }

        return redirect()->intended($roleTarget . '?verified=1');
    }
}
