<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Parcel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Fetch student's parcels and compute payment status
        $parcels = Parcel::where('student_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (Parcel $p) {
                $arrival = $p->created_at ?? now();
                $daysSince = $arrival->diffInDays(now());
                $status = strtolower($p->parcel_status);

                // Payment state rules
                $paymentState = 'Pending';
                if ($status === 'collected') {
                    $paymentState = 'Verified';
                } elseif ($daysSince >= 7 && $status === 'pending payment') {
                    $paymentState = 'Overdue';
                } elseif ($status === 'pending payment') {
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

        return redirect()->route('student.payment')->with('success', 'Payment submitted');
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
