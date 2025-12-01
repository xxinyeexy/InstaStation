<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'type' => 'required|in:student,staff',
            'matric' => 'required_if:type,student|nullable|string|unique:users,matric',
            'department' => 'required_if:type,staff|nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'type' => $request->type,
            'matric' => $request->type === 'student' ? $request->matric : null,
            'department' => $request->type === 'staff' ? $request->department : null,
        ]);

        event(new Registered($user));

        // Always preserve the intended URL for parcel claim linking after registration
        $intendedUrl = $request->session()->get('url.intended');
        $claimIntendedUrl = $request->session()->get('claim_intended_url');
        $claimRedirectType = $request->session()->get('claim_redirect_type');

        // Return JSON response for axios requests
        if ($request->expectsJson()) {
            if ($intendedUrl) {
                $request->session()->put('url.intended', $intendedUrl);
            }
            if ($claimIntendedUrl) {
                $request->session()->put('claim_intended_url', $claimIntendedUrl);
            }
            if ($claimRedirectType) {
                $request->session()->put('claim_redirect_type', $claimRedirectType);
            }
            return response()->json([
                'message' => 'Account created successfully! Please check your email to verify your account.',
                'loginMessage' => 'You may proceed to login now!',
            ], 201);
        }

        // Redirect to login page after registration, preserving intended URL
        // The intended URL will be used after login and email verification
        if ($intendedUrl) {
            $request->session()->put('url.intended', $intendedUrl);
        }
        if ($claimIntendedUrl) {
            $request->session()->put('claim_intended_url', $claimIntendedUrl);
        }
        if ($claimRedirectType) {
            $request->session()->put('claim_redirect_type', $claimRedirectType);
        }
        
        // Debug logging to file
        $debugData = [
            'timestamp' => now()->toDateTimeString(),
            'action' => 'register.store',
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
        
        \Illuminate\Support\Facades\Log::info('RegisteredUserController: Preserved session after registration', [
            'user_id' => $user->id,
            'intended_url' => $intendedUrl,
            'claim_intended_url' => $claimIntendedUrl,
            'claim_redirect_type' => $claimRedirectType,
            'session_id' => $request->session()->getId(),
        ]);
        return redirect()->route('login')->with('status', 'You may proceed to login now!');
    }
}
