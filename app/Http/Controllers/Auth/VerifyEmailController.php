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
        $intendedUrl = $request->session()->get('url.intended') ?: $request->session()->get('claim_intended_url');

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
            // Debug logging to file
            $debugData = [
                'timestamp' => now()->toDateTimeString(),
                'action' => 'verify.email',
                'user_id' => $user->id,
                'user_email' => $user->email,
                'session_id' => $request->session()->getId(),
                'intended_url' => $intendedUrl,
                'redirecting_to' => $intendedUrl,
            ];
            file_put_contents(storage_path('logs/claim_debug.log'), json_encode($debugData, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);
            
            \Illuminate\Support\Facades\Log::info('VerifyEmailController: Redirecting to intended URL after verification', [
                'user_id' => $user->id,
                'intended_url' => $intendedUrl,
                'session_id' => $request->session()->getId(),
            ]);
            
            // Clear both session keys after using the intended URL
            $request->session()->forget(['url.intended', 'claim_intended_url']);
            return redirect($intendedUrl)->with('status', 'Email verified successfully!');
        }
        
        // Debug logging when no intended URL found
        $debugData = [
            'timestamp' => now()->toDateTimeString(),
            'action' => 'verify.email.no_intended',
            'user_id' => $user->id,
            'user_email' => $user->email,
            'session_id' => $request->session()->getId(),
            'session_data' => [
                'url.intended' => $request->session()->get('url.intended'),
                'claim_intended_url' => $request->session()->get('claim_intended_url'),
                'claim_redirect_type' => $request->session()->get('claim_redirect_type'),
            ],
            'redirecting_to' => $roleTarget,
        ];
        file_put_contents(storage_path('logs/claim_debug.log'), json_encode($debugData, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);
        
        \Illuminate\Support\Facades\Log::warning('VerifyEmailController: No intended URL found, redirecting to role target', [
            'user_id' => $user->id,
            'role_target' => $roleTarget,
            'session_id' => $request->session()->getId(),
        ]);

        return redirect($roleTarget)->with('status', 'Email verified successfully!');
    }
}
