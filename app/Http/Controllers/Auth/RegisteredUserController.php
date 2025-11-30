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

        // Preserve the intended URL if it exists (e.g., from parcel claim flow)
        // This ensures the parcel linking happens after login and verification
        $intendedUrl = $request->session()->get('url.intended');
        
        // Return JSON response for axios requests
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Account created successfully! Please check your email to verify your account.',
                'loginMessage' => 'You may proceed to login now!',
            ], 201);
        }

        // Redirect to login page after registration, preserving intended URL
        // The intended URL will be used after login and email verification
        $redirect = redirect()->route('login')->with('status', 'You may proceed to login now!');
        
        // If there was an intended URL, preserve it in the session
        if ($intendedUrl) {
            $request->session()->put('url.intended', $intendedUrl);
        }
        
        return $redirect;
    }
}
