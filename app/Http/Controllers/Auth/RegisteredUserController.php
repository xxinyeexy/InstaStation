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

        // Check if this is a parcel claim registration for "I'm new here" flow
        $claimIntendedUrl = $request->session()->get('claim_intended_url');
        $claimRedirectType = $request->session()->get('claim_redirect_type');
        
        if ($request->type === 'student' && $claimRedirectType === 'register' && $claimIntendedUrl) {
            // Extract parcel_id from the claim URL
            parse_str(parse_url($claimIntendedUrl, PHP_URL_QUERY), $queryParams);
            $parcelId = $queryParams['parcel_id'] ?? null;
            
            if ($parcelId) {
                $parcel = \App\Models\Parcel::find($parcelId);
                
                if ($parcel) {
                    $parcelMatric = strtolower(trim((string) ($parcel->recipient_matric ?? '')));
                    $parcelName = trim((string) ($parcel->recipient_name ?? ''));
                    $studentMatric = strtolower(trim((string) ($request->matric ?? '')));
                    
                    // Check if parcel has matric ID but no student name (staff entered only matric)
                    $hasMatricOnly = $parcelMatric !== '' && $parcelName === '';
                    
                    if ($hasMatricOnly && $parcelMatric !== $studentMatric) {
                        // Matric ID mismatch - reject registration
                        return back()->withErrors([
                            'matric' => 'This parcel is for matric ID: ' . strtoupper($parcel->recipient_matric) . '. Please register with the correct matric ID or contact the parcel office.',
                        ])->withInput();
                    }
                }
            }
        }

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
        
        // IMPORTANT: Store parcel claim info more persistently
        // Extract parcel_id from claim URL and store it for later retrieval
        if ($claimIntendedUrl) {
            parse_str(parse_url($claimIntendedUrl, PHP_URL_QUERY), $queryParams);
            $parcelId = $queryParams['parcel_id'] ?? null;
            
            if ($parcelId) {
                // Store in multiple places to ensure it survives session changes
                $request->session()->put('pending_parcel_claim', $parcelId);
                $request->session()->put('pending_claim_redirect_type', $claimRedirectType);
                
                // CRITICAL: Link the parcel to the new user IMMEDIATELY in the database.
                // This ensures the link is preserved even if they switch devices for verification.
                $pendingParcel = \App\Models\Parcel::find($parcelId);
                if ($pendingParcel && $pendingParcel->student_id === null) {
                    $pendingParcel->student_id = $user->id;
                    $pendingParcel->recipient_name = $user->name;
                    $pendingParcel->recipient_matric = $user->matric;
                    // Only change status to Pending Payment if it was Unclaimed
                    if (strtolower((string) $pendingParcel->parcel_status) === 'unclaimed') {
                        $pendingParcel->parcel_status = 'Pending Payment';
                    }
                    $pendingParcel->save();
                    
                    \Illuminate\Support\Facades\Log::info('RegisteredUserController: Immediately linked parcel to new student', [
                        'user_id' => $user->id,
                        'parcel_id' => $parcelId,
                    ]);
                }
                
                // Also store in user's session data (Laravel's session table)
                $request->session()->save();
                
                \Illuminate\Support\Facades\Log::info('Stored pending parcel claim info for new user', [
                    'user_id' => $user->id,
                    'parcel_id' => $parcelId,
                    'redirect_type' => $claimRedirectType,
                    'session_id' => $request->session()->getId(),
                ]);
            }
        }

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
            $request->session()->save(); // Ensure session is saved
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
        $request->session()->save(); // Explicitly save session
        
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
        // Don't redirect here - let the frontend handle the success message and redirect
        // This allows the Inertia.js onSuccess callback to show the notification
        return back();
    }
}
