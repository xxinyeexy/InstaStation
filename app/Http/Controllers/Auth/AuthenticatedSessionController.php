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

        $request->session()->regenerate();

        // Record last login timestamp
        $user = User::find(Auth::id());
        if ($user) {
            $user->last_login_at = now();
            $user->save();
        }

        // Preserve the intended URL if it exists (e.g., from parcel claim flow)
        $intendedUrl = $request->session()->get('url.intended');

        // If user hasn't verified email yet, preserve intended URL and redirect to verification notice
        // The intended URL will be used after email verification
        if ($user && method_exists($user, 'hasVerifiedEmail') && ! $user->hasVerifiedEmail()) {
            // Preserve intended URL for after verification
            if ($intendedUrl) {
                $request->session()->put('url.intended', $intendedUrl);
            }
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
