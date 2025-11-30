<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        
        // If already verified, redirect to intended URL or default
        if ($user->hasVerifiedEmail()) {
            $intendedUrl = $request->session()->get('url.intended');
            if ($intendedUrl) {
                $request->session()->forget('url.intended');
                return redirect($intendedUrl);
            }
            return redirect()->intended(route('dashboard', absolute: false));
        }
        
        // Preserve intended URL in session for after verification
        // This ensures parcel linking happens after email verification
        $intendedUrl = $request->session()->get('url.intended');
        if ($intendedUrl) {
            $request->session()->put('url.intended', $intendedUrl);
        }
        
        return Inertia::render('auth/verify-email', ['status' => $request->session()->get('status')]);
    }
}
