<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Parcel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Fetch student's parcels and compute payment status using latest payment state
        $parcels = Parcel::where('student_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (Parcel $p) {
                $arrival = $p->created_at ?? now();
                $daysSince = $arrival->diffInDays(now());
                $status = strtolower($p->parcel_status);

                // Determine latest payment for this parcel (if any)
                $latestPayment = Payment::where('parcel_id', $p->parcel_id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                // Payment state rules (priority: approved/verified payment -> Verified)
                $paymentState = 'Pending';
                if (($latestPayment && !empty($latestPayment->verified_by)) || in_array($status, ['approved', 'collected'])) {
                    $paymentState = 'Verified';
                } elseif ($status === 'pending payment') {
                    $paymentState = $daysSince >= 7 ? 'Overdue' : 'Pending';
                } else {
                    // For other statuses without verified payment, fall back to Pending
                    $paymentState = 'Pending';
                }

                return [
                    'parcel_id' => $p->parcel_id,
                    'parcel_code' => $p->parcel_code,
                    'sender' => $p->sender,
                    'amount' => 1.00,
                    'arrival' => $arrival->toDateString(),
                    'payment_state' => $paymentState,
                ];
            })->toArray();

        // Summary tiles
        $overdue = collect($parcels)->where('payment_state', 'Overdue')->count();
        $pending = collect($parcels)->where('payment_state', 'Pending')->count();
        $verified = collect($parcels)->where('payment_state', 'Verified')->count();
        $totalPaid = $verified * 1.00; // RM1 each

        // Payment history for this student (with proof image)
        $payments = Payment::query()
            ->whereHas('parcel', function ($q) use ($user) {
                $q->where('student_id', $user->id);
            })
            ->with('parcel')
            ->orderByDesc('created_at')
            ->get()
            ->unique('parcel_id')
            ->map(function (Payment $p) {
                return [
                    'payment_id' => $p->payment_id,
                    'parcel_code' => optional($p->parcel)->parcel_code,
                    'amount' => 1.00,
                    'status' => $p->verified_by ? 'Verified' : 'Pending',
                    'submitted_at' => optional($p->created_at)?->toDateString(),
                    'verified_at' => $p->verified_by ? optional($p->updated_at)?->toDateString() : null,
                    'proof_url' => $p->file_path ? Storage::url($p->file_path) : null,
                ];
            })->toArray();

        // Notifications are now provided globally via HandleInertiaRequests middleware
        return Inertia::render('student/payment', [
            'summary' => [
                'overdue' => $overdue,
                'pending' => $pending,
                'verified' => $verified,
                'total_paid' => $totalPaid,
            ],
            'rows' => $parcels,
            'payments' => $payments,
        ]);
    }

    public function history(): Response
    {
        $user = Auth::user();

        $payments = Payment::query()
            ->whereHas('parcel', function ($q) use ($user) {
                $q->where('student_id', $user->id);
            })
            ->with('parcel')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Payment $p) {
                return [
                    'payment_id' => $p->payment_id,
                    'parcel_code' => optional($p->parcel)->parcel_code,
                    'amount' => 1.00,
                    'status' => $p->verified_by ? 'Verified' : 'Pending',
                    'submitted_at' => optional($p->created_at)?->toDateString(),
                    'verified_at' => $p->verified_by ? optional($p->updated_at)?->toDateString() : null,
                    'proof_url' => $p->file_path ? Storage::url($p->file_path) : null,
                ];
            })->toArray();

        return Inertia::render('student/payment-history', [
            'payments' => $payments,
        ]);
    }

    public function showSubmit(int $id): Response
    {
        $userId = Auth::id();
        $parcel = Parcel::where('parcel_id', $id)->where('student_id', $userId)->firstOrFail();

        return Inertia::render('student/payment-submit', [
            'parcel' => [
                'parcel_id' => $parcel->parcel_id,
                'parcel_code' => $parcel->parcel_code,
                'tracking_no' => $parcel->tracking_no,
                'sender' => $parcel->sender,
                'arrival' => optional($parcel->created_at)?->toDateString(),
                'fee' => 1.00,
            ],
        ]);
    }

    public function storeStudentPayment(Request $request, int $id)
    {
        $userId = Auth::id();
        $parcel = Parcel::where('parcel_id', $id)->where('student_id', $userId)->firstOrFail();

        $validated = $request->validate([
            'proof' => [
                'required',
                File::image()->types(['png', 'jpg', 'jpeg'])->max('10mb'),
            ],
        ]);

        $path = $request->file('proof')->store('payment_proofs', 'public');

        // If a payment record already exists for this parcel, update it and replace the file
        $existing = Payment::where('parcel_id', $parcel->parcel_id)->orderByDesc('created_at')->first();
        if ($existing) {
            if (!empty($existing->file_path)) {
                try {
                    Storage::disk('public')->delete($existing->file_path);
                } catch (\Throwable $e) {
                }
            }
            $existing->file_path = $path;
            $existing->payment_date = now()->toDateString();
            $existing->verified_by = null; // reset verification on resubmission
            $existing->save();
        } else {
            $payment = new Payment();
            $payment->parcel_id = $parcel->parcel_id;
            $payment->file_path = $path;
            $payment->payment_date = now()->toDateString();
            // verified_by stays null until staff verifies
            $payment->save();
        }

        // Remove any payment rejection notifications for this parcel when resubmitting
        \App\Models\Notification::where('notifiable_id', $userId)
            ->where('notifiable_type', 'App\Models\User')
            ->where('type', 'payment_rejected')
            ->whereJsonContains('data->parcel_id', $parcel->parcel_id)
            ->delete();

        // Return success - let the frontend decide where to navigate
        return back();
    }

    public function staffIndex(Request $request): Response
    {
        $q = trim((string) $request->input('q'));
        $status = $request->input('status');

        // Build collection of latest payment per parcel
        $latest = Payment::with(['parcel.studentUser'])
            ->orderByDesc('created_at')
            ->get()
            ->unique('parcel_id')
            ->values();

        // Summary based on latest entries
        $pendingCount = $latest->whereNull('verified_by')->count();
        $verifiedToday = $latest->filter(fn($p) => $p->verified_by && optional($p->updated_at)?->toDateString() === now()->toDateString())->count();
        $totalRevenue = $latest->whereNotNull('verified_by')->count() * 1.00; // RM1 each
        $successRate = null;

        // Filter
        $filtered = $latest->filter(function (Payment $p) use ($q, $status) {
            $matchSearch = true;
            if ($q !== '') {
                $haystack = strtolower(trim(($p->parcel->parcel_code ?? '') . ' ' . ($p->parcel?->studentUser->name ?? '') . ' ' . ($p->parcel?->studentUser->matric ?? '')));
                $matchSearch = str_contains($haystack, strtolower($q));
            }
            $matchStatus = true;
            if (in_array($status, ['pending', 'verified'], true)) {
                $matchStatus = $status === 'verified' ? (bool) $p->verified_by : !$p->verified_by;
            }
            return $matchSearch && $matchStatus;
        });

        $rows = $filtered->map(function (Payment $p) {
            return [
                'payment_id' => $p->payment_id,
                'tracking_no' => optional($p->parcel)->parcel_code,
                'student' => optional($p->parcel?->studentUser)?->name,
                'student_matric' => optional($p->parcel?->studentUser)?->matric,
                'amount' => 1.00,
                'method' => 'bank transfer',
                'status' => $p->verified_by ? 'verified' : 'pending',
                'submitted_at' => optional($p->created_at)?->toDateString(),
                'created_at' => optional($p->created_at)?->toIso8601String(),
                'proof_url' => $p->file_path ? Storage::url($p->file_path) : null,
            ];
        })->values()->toArray();

        return Inertia::render('staff/verify-payment', [
            'summary' => [
                'pending' => $pendingCount,
                'verified_today' => $verifiedToday,
                'total_revenue' => $totalRevenue,
                'success_rate' => $successRate,
            ],
            'rows' => $rows,
            'filters' => [
                'q' => $q,
                'status' => $status,
            ],
        ]);
    }

    public function approvePayment(int $id)
    {
        try {
            $payment = Payment::findOrFail($id);

            // Check if already verified
            if ($payment->verified_by) {
                return back()->with('info', 'Payment already verified.');
            }

            $payment->verified_by = Auth::id();
            $payment->save();

            // When a payment is approved by staff, update parcel status appropriately
            if ($payment->parcel_id) {
                $parcel = Parcel::find($payment->parcel_id);
                if ($parcel) {
                    // If parcel already has a schedule, mark as Ready for Collection
                    // Otherwise, mark as Approved (payment verified, but no schedule yet)
                    if ($parcel->schedule) {
                        $parcel->parcel_status = 'Ready for Collection';
                    } else {
                        $parcel->parcel_status = 'Approved';
                    }

                    $parcel->last_edited_by = Auth::id();
                    $parcel->touch();
                    $parcel->save();

                    // Clean up any rejection notifications for this parcel when payment is approved
                    \App\Models\Notification::where('notifiable_id', $parcel->student_id)
                        ->where('notifiable_type', 'App\Models\User')
                        ->where('type', 'payment_rejected')
                        ->whereJsonContains('data->parcel_id', $parcel->parcel_id)
                        ->delete();
                }
            }
            return back()->with('success', 'Payment verified.');
        } catch (\Exception $e) {
            Log::error('Error approving payment: ' . $e->getMessage());
            return back()->with('error', 'Failed to verify payment. Please try again.');
        }
    }

    public function rejectPayment(int $id)
    {
        try {
            $payment = Payment::findOrFail($id);
            $parcelId = $payment->parcel_id;

            // Get the parcel and student info before deleting the payment
            $parcel = null;
            $student = null;
            if ($parcelId) {
                $parcel = Parcel::with('studentUser')->find($parcelId);
                $student = $parcel?->studentUser;
            }

            $payment->delete();

            // Keep parcel in Pending Payment so student can resubmit
            if ($parcel) {
                $parcel->parcel_status = 'Pending Payment';
                $parcel->last_edited_by = Auth::id();
                $parcel->touch();
                $parcel->save();

                // Create notification for the student
                if ($student) {
                    $notification = new \App\Models\Notification();
                    $notification->id = \Illuminate\Support\Str::uuid();
                    $notification->type = 'payment_rejected';
                    $notification->notifiable_id = $student->id;
                    $notification->notifiable_type = 'App\Models\User';
                    $notification->data = json_encode([
                        'title' => 'Payment Proof Rejected',
                        'message' => "Your payment proof for parcel {$parcel->parcel_code} has been rejected. Please resubmit a valid payment proof.",
                        'parcel_code' => $parcel->parcel_code,
                        'parcel_id' => $parcel->parcel_id,
                        'rejected_by' => Auth::user()->name,
                        'rejected_at' => now()->toDateTimeString(),
                    ]);
                    $notification->read_at = null; // Mark as unread
                    $notification->save();
                }
            }

            return back()->with('success', 'Payment rejected and removed.');
        } catch (\Exception $e) {
            Log::error('Error rejecting payment: ' . $e->getMessage());
            return back()->with('error', 'Failed to reject payment. Please try again.');
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Payment $payment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payment $payment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        //
    }
}
