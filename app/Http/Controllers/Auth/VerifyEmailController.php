<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(Request $request, $id, $hash): RedirectResponse
    {
        // Find the user by ID
        $user = User::findOrFail($id);

        // Verify the hash matches
        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect()->route('login')->with('error', 'Invalid verification link.');
        }

        // Check if signature is valid
        if (! $request->hasValidSignature()) {
            return redirect()->route('login')->with('error', 'Verification link has expired.');
        }

        // Determine post-verification destination based on user role
        $roleTarget = ($user && $user->type === 'staff')
            ? route('staff.dashboard')
            : route('student.parcel');

        // If already verified, log them in and redirect
        if ($user->hasVerifiedEmail()) {
            // Log the user in if not already authenticated
            if (!Auth::check()) {
                Auth::login($user);
            }
            return redirect()->intended($roleTarget)->with('status', 'Email already verified!');
        }

        // Mark email as verified
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // Log the user in automatically after verification
        Auth::login($user);

        return redirect()->intended($roleTarget)->with('status', 'Email verified successfully!');
    }
}
