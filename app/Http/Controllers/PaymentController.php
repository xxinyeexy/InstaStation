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
            ->map(function (Parcel $p) use ($user) {
                $arrival = $p->created_at ?? now();
                $daysSince = $arrival->diffInDays(now());
                $status = strtolower($p->parcel_status);

                // Determine latest payment for this parcel (if any)
                $latestPayment = Payment::where('parcel_id', $p->parcel_id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                // Determine if there's an active rejection notification for this parcel
                $rejectionNotification = \App\Models\Notification::where('notifiable_id', $user->id)
                    ->where('type', 'payment_rejected')
                    ->whereJsonContains('data->parcel_id', $p->parcel_id)
                    ->orderByDesc('created_at')
                    ->first();

                $isRejected = $rejectionNotification !== null;

                $rejectionReason = null;
                $rejectionDate = null;
                if ($rejectionNotification) {
                    $data = is_array($rejectionNotification->data) ? $rejectionNotification->data : json_decode($rejectionNotification->data, true);
                    $rejectionReason = $data['reason'] ?? null;
                    $rejectionDate = $rejectionNotification->created_at->format('d/m/Y, g:i A');
                }

                // Payment state rules (priority: approved/verified payment -> Verified)
                $paymentState = 'Pending';
                if (($latestPayment && !empty($latestPayment->verified_by)) || in_array($status, ['approved', 'collected'])) {
                    $paymentState = 'Verified';
                } elseif ($isRejected) {
                    $paymentState = 'Rejected';
                } elseif ($latestPayment && empty($latestPayment->verified_by)) {
                    // Has a submission waiting for verification
                    $paymentState = 'Processing';
                } elseif ($status === 'pending payment') {
                    // No submission yet, check if it's already overdue
                    $paymentState = $daysSince >= 3 ? 'Overdue' : 'Pending';
                } else {
                    // For other statuses without verified payment, fall back to Pending
                    $paymentState = 'Pending';
                }

                return [
                    'parcel_id' => $p->parcel_id,
                    'parcel_code' => $p->parcel_code,
                    'tracking_no' => $p->tracking_no,
                    'sender' => $p->sender,
                    'amount' => 1.00,
                    'arrival' => $arrival->format('d/m/Y'),
                    'payment_state' => $paymentState,
                    'rejection_reason' => $rejectionReason,
                    'rejection_date' => $rejectionDate,
                    'proof_url' => $latestPayment ? Storage::url($latestPayment->file_path) : null,
                    'submitted_at' => $latestPayment ? $latestPayment->created_at->format('d/m/Y, g:i A') : null,
                ];
            })->toArray();

        // Summary tiles
        $overdue = collect($parcels)->where('payment_state', 'Overdue')->count();
        $pending = collect($parcels)->whereIn('payment_state', ['Pending', 'Rejected'])->count();
        $verified = collect($parcels)->where('payment_state', 'Verified')->count();
        $totalPaid = $verified * 1.00; // RM1 each

        // Filter rows to only show parcels requiring payment (exclude Verified)
        $rowsRequiringPayment = collect($parcels)
            ->whereIn('payment_state', ['Pending', 'Overdue', 'Rejected'])
            ->values()
            ->toArray();

        // Payment history for this student (with proof image)
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
                    'submitted_at' => optional($p->created_at)->format('Y-m-d H:i:s'),
                    'submitted_at_formatted' => optional($p->created_at)->format('d/m/Y, g:i:s A'),
                    'verified_at' => $p->verified_by ? optional($p->updated_at)->format('d/m/Y, g:i:s A') : null,
                    'proof_url' => $p->file_path ? Storage::url($p->file_path) : null,
                    'parcel_id' => $p->parcel_id,
                ];
            });

        // Fetch rejections from notifications to show in history
        $rejectionHistory = \App\Models\Notification::where('notifiable_id', $user->id)
            ->where('type', 'payment_rejected')
            ->get()
            ->map(function ($n) use ($payments) {
                $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                $parcel = Parcel::find($data['parcel_id'] ?? null);
                return [
                    'payment_id' => 'rej_' . $n->id,
                    'parcel_code' => $parcel?->parcel_code ?? 'N/A',
                    'amount' => 1.00,
                    'status' => 'Rejected',
                    'submitted_at' => $n->created_at->format('Y-m-d H:i:s'),
                    'submitted_at_formatted' => $n->created_at->format('d/m/Y, g:i:s A'),
                    'verified_at' => null,
                    'proof_url' => isset($data['file_path']) ? Storage::url($data['file_path']) : ($payments->firstWhere('parcel_id', $data['parcel_id'] ?? null)['proof_url'] ?? null),
                    'parcel_id' => $data['parcel_id'] ?? null,
                    'reason' => $data['reason'] ?? null,
                ];
            });

        $payments = $payments->concat($rejectionHistory)
            ->sortByDesc('submitted_at')
            ->unique('parcel_id') // Keeps only the latest status for each parcel in the quick history
            ->map(function ($p) {
                // Ensure we return the formatted date as submitted_at for the frontend
                $p['submitted_at'] = $p['submitted_at_formatted'];
                unset($p['submitted_at_formatted']);
                return $p;
            })
            ->values()
            ->toArray();

        // Notifications are now provided globally via HandleInertiaRequests middleware
        return Inertia::render('student/payment', [
            'summary' => [
                'overdue' => $overdue,
                'pending' => $pending,
                'verified' => $verified,
                'total_paid' => $totalPaid,
            ],
            'rows' => $rowsRequiringPayment,
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
                    'submitted_at' => optional($p->created_at)->format('Y-m-d H:i:s'),
                    'submitted_at_formatted' => optional($p->created_at)->format('d/m/Y, g:i:s A'),
                    'verified_at' => $p->verified_by ? optional($p->updated_at)->format('d/m/Y, g:i:s A') : null,
                    'proof_url' => $p->file_path ? Storage::url($p->file_path) : null,
                ];
            });

        $rejectionHistory = \App\Models\Notification::where('notifiable_id', $user->id)
            ->where('type', 'payment_rejected')
            ->get()
            ->map(function ($n) use ($payments) {
                $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                $parcel = Parcel::find($data['parcel_id'] ?? null);
                return [
                    'payment_id' => 'rej_' . $n->id,
                    'parcel_code' => $parcel?->parcel_code ?? 'N/A',
                    'amount' => 1.00,
                    'status' => 'Rejected',
                    'submitted_at' => $n->created_at->format('Y-m-d H:i:s'),
                    'submitted_at_formatted' => $n->created_at->format('d/m/Y, g:i:s A'),
                    'verified_at' => null,
                    'proof_url' => isset($data['file_path']) ? Storage::url($data['file_path']) : ($payments->firstWhere('parcel_code', $parcel?->parcel_code)['proof_url'] ?? null),
                    'reason' => $data['reason'] ?? null,
                ];
            });

        $payments = $payments->concat($rejectionHistory)
            ->sortByDesc('submitted_at')
            ->map(function ($p) {
                $p['submitted_at'] = $p['submitted_at_formatted'];
                unset($p['submitted_at_formatted']);
                return $p;
            })
            ->values()
            ->toArray();

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
                'arrival' => optional($parcel->created_at)?->format('d/m/Y'),
                'fee' => 1.00,
            ],
            'existing_payment' => (function () use ($parcel, $userId) {
                $p = Payment::where('parcel_id', $parcel->parcel_id)->orderByDesc('created_at')->first();
                if (!$p) return null;

                $notification = \App\Models\Notification::where('notifiable_id', $userId)
                    ->where('type', 'payment_rejected')
                    ->whereJsonContains('data->parcel_id', $parcel->parcel_id)
                    ->orderByDesc('created_at')
                    ->first();

                $reason = null;
                if ($notification) {
                    $data = is_array($notification->data) ? $notification->data : json_decode($notification->data, true);
                    $reason = $data['reason'] ?? null;
                }

                return [
                    'proof_url' => Storage::url($p->file_path),
                    'submitted_at' => $p->created_at->format('d/m/Y, g:i A'),
                    'rejection_reason' => $reason,
                ];
            })(),
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
        $originalFileName = $request->file('proof')->getClientOriginalName();

        // If a payment record already exists for this parcel, update it and replace the file
        $existing = Payment::where('parcel_id', $parcel->parcel_id)->orderByDesc('created_at')->first();
        if ($existing) {
            if (!empty($existing->file_path)) {
                try {
                    Storage::disk('public')->delete($existing->file_path);
                } catch (\Throwable $e) {
                }
            }
            $existing->payment = $originalFileName;
            $existing->file_path = $path;
            $existing->payment_date = now()->format('Y-m-d');
            $existing->created_at = now(); // Reset timestamp to now so history reflects latest submission
            $existing->verified_by = null; // reset verification on resubmission
            $existing->save();
        } else {
            $payment = new Payment();
            $payment->parcel_id = $parcel->parcel_id;
            $payment->payment = $originalFileName;
            $payment->file_path = $path;
            $payment->payment_date = now()->format('Y-m-d');
            // verified_by stays null until staff verifies
            $payment->save();
        }

        // Remove any payment rejection notifications for this parcel when resubmitting
        // We fetch and filter in PHP to ensure compatibility with different DB drivers (text vs json columns)
        \App\Models\Notification::where('notifiable_id', $userId)
            ->where('notifiable_type', 'App\Models\User')
            ->where('type', 'payment_rejected')
            ->get()
            ->filter(function ($n) use ($parcel) {
                $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                return ($data['parcel_id'] ?? null) == $parcel->parcel_id;
            })
            ->each->delete();

        // Return success and redirect back
        return back()->with('success', 'Payment proof uploaded successfully! Staff will verify within 24 hours.');
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

        // Get latest rejection date for each parcel to determine if it should be hidden from staff
        $latestRejections = \App\Models\Notification::where('type', 'payment_rejected')
            ->get()
            ->groupBy(function ($n) {
                $data = is_array($n->data) ? $n->data : json_decode($n->data, true);
                return $data['parcel_id'] ?? null;
            })
            ->map(fn($group) => $group->max('created_at'));

        // Filter out rejected payments until they are resubmitted.
        // A payment is considered "rejected and hidden" only if the rejection notification
        // is newer than the latest submission timestamp.
        $latest = $latest->reject(function ($p) use ($latestRejections) {
            if ($p->verified_by) return false;

            $rejectionDate = $latestRejections->get($p->parcel_id);
            if (!$rejectionDate) return false;

            // If the rejection happened AFTER this submission, it's still rejected.
            // If this submission is NEWER than the rejection, it's a resubmission and should be shown.
            return $rejectionDate->gt($p->created_at);
        });

        // Summary based on latest entries
        $pendingCount = $latest->whereNull('verified_by')->count();
        $verifiedToday = $latest->filter(fn($p) => $p->verified_by && optional($p->updated_at)?->format('d/m/Y') === now()->format('d/m/Y'))->count();
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
                'submitted_at_date' => optional($p->created_at)?->format('d/m/Y, g:i:s A'),
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
                        $parcel->parcel_status = 'Ready For Collection';
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

    public function rejectPayment(Request $request, int $id)
    {
        try {
            $payment = Payment::findOrFail($id);
            $parcelId = $payment->parcel_id;
            $reason = trim($request->input('reason', 'None provided.'));

            // Get the parcel and student info before deleting the payment
            $parcel = null;
            $student = null;
            if ($parcelId) {
                $parcel = Parcel::with('studentUser')->find($parcelId);
                $student = $parcel?->studentUser;
            }

            // We no longer delete the payment record so that the history and file path are preserved.
            // $payment->delete();

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
                        'reason' => $reason,
                        'parcel_code' => $parcel->parcel_code,
                        'parcel_id' => $parcel->parcel_id,
                        'rejected_by' => Auth::user()->name,
                        'rejected_at' => now()->toDateTimeString(),
                        'file_path' => $payment->file_path,
                        'original_filename' => $payment->payment,
                    ]);
                    $notification->read_at = null; // Mark as unread
                    $notification->save();
                }
            }

            return back()->with('success', 'Payment rejected. Student will need to resubmit a new proof.');
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
