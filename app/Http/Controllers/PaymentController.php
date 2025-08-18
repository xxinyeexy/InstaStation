<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Parcel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

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

        return Inertia::render('student/payment', [
            'summary' => [
                'overdue' => $overdue,
                'pending' => $pending,
                'verified' => $verified,
                'total_paid' => $totalPaid,
            ],
            'rows' => $parcels,
        ]);
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
