<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Models\User;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $id = $request->route('id');
        $hash = (string) $request->route('hash');
        
        // Find the user by ID from the route
        $user = User::findOrFail($id);

        // Verify the hash manually as we are no longer using EmailVerificationRequest's authorize method
        if (!hash_equals($hash, sha1($user->getEmailForVerification()))) {
            \Illuminate\Support\Facades\Log::warning('VerifyEmailController: Hash mismatch', [
                'user_id' => $id,
                'provided_hash' => $hash,
                'expected_hash' => sha1($user->getEmailForVerification()),
            ]);
            abort(403, 'This action is unauthorized.');
        }

        // Optimization: If already verified, move on to session processing
        if ($user->hasVerifiedEmail()) {
            return $this->handlePostVerificationRedirect($request, $user, 'Email already verified!');
        }

        // Mark email as verified
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return $this->handlePostVerificationRedirect($request, $user, 'Email verified successfully!');
    }

    /**
     * Handle redirections after successful verification.
     */
    protected function handlePostVerificationRedirect(Request $request, User $user, string $status): \Illuminate\Http\RedirectResponse
    {
        // Get various session variables for parcel linking flow
        $intendedUrl = $request->session()->get('url.intended') ?: $request->session()->get('claim_intended_url');
        $pendingParcelClaim = $request->session()->get('pending_parcel_claim');
        $pendingClaimRedirectType = $request->session()->get('pending_claim_redirect_type');
        
        \Illuminate\Support\Facades\Log::info('VerifyEmailController: Processing post-verification', [
            'user_id' => $user->id,
            'session_id' => $request->session()->getId(),
            'intended_url' => $intendedUrl,
        ]);

        // If we have a pending parcel claim but no intended URL, reconstruct it
        if (!$intendedUrl && $pendingParcelClaim) {
            $redirectType = $pendingClaimRedirectType ?? 'register';
            $intendedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'claim.consume',
                now()->addMinutes(15),
                [
                    'parcel_id' => $pendingParcelClaim,
                    'allow_new' => $redirectType === 'register' ? 1 : 0,
                    'redirect_type' => $redirectType,
                ]
            );
        }

        // Student logic: check for ALL unclaimed parcels matching matric
        // This ensures that any parcels waiting for this specific student are linked
        if ($user->type === 'student' && $user->matric) {
            // Priority 1: Link the specific parcel from the "I'm new here" flow if it exists
            if ($pendingParcelClaim) {
                $specificParcel = \App\Models\Parcel::find($pendingParcelClaim);
                if ($specificParcel && $specificParcel->student_id === null) {
                    $specificParcel->student_id = $user->id;
                    $specificParcel->recipient_name = $user->name;
                    $specificParcel->recipient_matric = $user->matric;
                    if (strtolower((string) $specificParcel->parcel_status) === 'unclaimed') {
                        $specificParcel->parcel_status = 'Pending Payment';
                    }
                    $specificParcel->save();
                    
                    \Illuminate\Support\Facades\Log::info('VerifyEmailController: Linked specific pending claim', [
                        'user_id' => $user->id,
                        'parcel_id' => $specificParcel->parcel_id,
                    ]);
                }
            }

            // Priority 2: Sweep for any OTHER parcels matching the matric ID
            $unclaimedParcels = \App\Models\Parcel::where(function($q) use ($user) {
                    $q->where('recipient_matric', $user->matric)
                      ->orWhereRaw('LOWER(recipient_matric) = ?', [strtolower($user->matric)]);
                })
                ->whereRaw('lower(parcel_status) = ?', ['unclaimed'])
                ->whereNull('student_id')
                ->get();
            
            foreach ($unclaimedParcels as $unclaimedParcel) {
                // Auto-link the parcel
                $unclaimedParcel->student_id = $user->id;
                $unclaimedParcel->recipient_name = $user->name;
                $unclaimedParcel->recipient_matric = $user->matric; // Ensure it's the correct one
                $unclaimedParcel->parcel_status = 'Pending Payment';
                $unclaimedParcel->save();
                
                \Illuminate\Support\Facades\Log::info('VerifyEmailController: Auto-linked additional parcel during verification', [
                    'user_id' => $user->id,
                    'parcel_id' => $unclaimedParcel->parcel_id,
                ]);
            }
        }

        // Store intended URL back into the session just in case logout/invalidation clears it
        // and we want it to be available after the user manually logs in.
        if ($intendedUrl) {
            $request->session()->put('url.intended', $intendedUrl);
        }

        // As requested: user MUST return to login page even if they were logged in.
        // We log them out to ensure they "finish fill up all the login details".
        if (\Illuminate\Support\Facades\Auth::check()) {
            \Illuminate\Support\Facades\Auth::logout();
            // We don't invalidate the session here so we keep the status message and intended URL
        }

        return redirect()->route('login')->with('status', $status . ' Please log in to continue.');
    }
}
