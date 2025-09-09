<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Parcel;
use App\Models\User;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function staff()
    {
        // Reserved
    }

    /**
     * Manage users (students) dashboard
     */
    public function manageUsers(Request $request): Response
    {
        // We treat students as users with type = 'student'
        $query = User::query()->where('type', 'student');

        $search = (string) $request->get('q', '');
        $status = (string) $request->get('status', '');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('matric', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($status !== '') {
            $query->where('status', $status);
        }

        $students = $query->orderBy('name')->get();

        // Preload parcel aggregates
        $studentIds = $students->pluck('id')->all();

        $parcelAgg = Parcel::select(
            'student_id',
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN lower(parcel_status) = 'pending payment' THEN 1 ELSE 0 END) as pending"),
            DB::raw('MAX(created_at) as last_activity')
        )
            ->whereIn('student_id', $studentIds)
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        // Spent based on approved or collected parcel count (RM1 each)
        $spentAgg = Parcel::select('student_id', DB::raw("SUM(CASE WHEN lower(parcel_status) IN ('approved','collected') THEN 1 ELSE 0 END) as spent_cnt"))
            ->whereIn('student_id', $studentIds)
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $rows = $students->map(function (User $s) use ($parcelAgg, $spentAgg) {
            $agg = isset($parcelAgg[$s->id]) ? $parcelAgg[$s->id] : null;
            $spent = isset($spentAgg[$s->id]) ? $spentAgg[$s->id] : null;
            return [
                'student_id' => $s->id,
                'name' => $s->name,
                'matric' => $s->matric ?? '',
                'email' => $s->email,
                'phone' => $s->phone_no ?? null,
                'parcels_total' => $agg && isset($agg->total) ? $agg->total : 0,
                'parcels_pending' => $agg && isset($agg->pending) ? $agg->pending : 0,
                'spent' => (float) ($spent && isset($spent->spent_cnt) ? $spent->spent_cnt : 0),
                'status' => $s->status ?? 'active',
                // Use last_login_at if set, else null
                'last_activity' => ($s->last_login_at !== null) ? $s->last_login_at->toDateTimeString() : null,
            ];
        })->values();

        // Summary tiles
        $totalStudents = User::where('type', 'student')->count();
        $activeStudents = User::where('type', 'student')->where('status', 'active')->count();
        $avgParcels = Parcel::count() > 0 ? round(Parcel::count() / max(1, $totalStudents)) : 0;
        $totalRevenue = Payment::whereNotNull('verified_by')->count() * 1.00;

        return Inertia::render('staff/manage-user', [
            'summary' => [
                'total' => $totalStudents,
                'active' => $activeStudents,
                'avg_per_student' => $avgParcels,
                'total_revenue' => $totalRevenue,
            ],
            'rows' => $rows,
            'filters' => [
                'q' => $search,
                'status' => $status,
            ],
        ]);
    }
    public function index()
    {
        //
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
    public function show(Staff $staff)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Staff $staff)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Staff $staff)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Staff $staff)
    {
        //
    }
}
