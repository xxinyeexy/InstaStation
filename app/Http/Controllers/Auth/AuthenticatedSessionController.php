<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        // CRITICAL: Retrieve session data BEFORE regenerating session
        // Session regeneration creates a new session ID, and the old session data might be lost
        $intendedUrl = $request->session()->get('url.intended');
        $claimIntendedUrl = $request->session()->get('claim_intended_url');
        $claimRedirectType = $request->session()->get('claim_redirect_type');

        $request->session()->regenerate();

        // Record last login timestamp
        $user = User::find(Auth::id());
        if ($user) {
            $user->last_login_at = now();
            $user->save();
        }

        // Restore the session data after regeneration
        if ($intendedUrl) {
            $request->session()->put('url.intended', $intendedUrl);
        }
        if ($claimIntendedUrl) {
            $request->session()->put('claim_intended_url', $claimIntendedUrl);
        }
        if ($claimRedirectType) {
            $request->session()->put('claim_redirect_type', $claimRedirectType);
        }

        // If user hasn't verified email yet, preserve intended URL and redirect to verification notice
        // The intended URL will be used after email verification
        if ($user && method_exists($user, 'hasVerifiedEmail') && ! $user->hasVerifiedEmail()) {
            // Session data already restored above, just log and redirect
            
            // Debug logging to file
            $debugData = [
                'timestamp' => now()->toDateTimeString(),
                'action' => 'login.store',
                'user_id' => $user->id,
                'user_email' => $user->email,
                'session_id' => $request->session()->getId(),
                'session_data_before' => [
                    'url.intended' => $intendedUrl,
                    'claim_intended_url' => $claimIntendedUrl,
                    'claim_redirect_type' => $claimRedirectType,
                ],
                'session_data_after' => [
                    'url.intended' => $request->session()->get('url.intended'),
                    'claim_intended_url' => $request->session()->get('claim_intended_url'),
                    'claim_redirect_type' => $request->session()->get('claim_redirect_type'),
                ],
            ];
            file_put_contents(storage_path('logs/claim_debug.log'), json_encode($debugData, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);
            
            \Illuminate\Support\Facades\Log::info('AuthenticatedSessionController: Preserved session before email verification', [
                'user_id' => $user->id,
                'intended_url' => $intendedUrl,
                'claim_intended_url' => $claimIntendedUrl,
                'claim_redirect_type' => $claimRedirectType,
                'session_id' => $request->session()->getId(),
            ]);
            
            return redirect()->intended(route('verification.notice'));
        }

        // If user is verified, redirect to intended URL or default based on role
        if ($user->type === 'staff') {
            return redirect()->intended(route('staff.dashboard'));
        }

        // Redirect students to intended URL (e.g., parcel claim consume) or default parcel page
        return redirect()->intended(route('student.parcel'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
