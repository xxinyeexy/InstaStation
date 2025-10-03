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
     * Dashboard data for staff
     */
    public function dashboard(): Response
    {
        // Overview statistics
        $totalParcels = Parcel::count();
        $newlyArrived = Parcel::whereDate('created_at', today())->count();
        $readyForCollection = Parcel::where('parcel_status', 'Ready For Collection')->count();
        $unclaimed = Parcel::where('parcel_status', 'Unclaimed')->count();

        // Daily operations data for the current week
        $dailyOperations = [];
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for ($i = 0; $i < 7; $i++) {
            $date = now()->startOfWeek()->addDays($i);
            $lastYearDate = $date->copy()->subYear();
            
            $thisYear = Parcel::whereDate('created_at', $date)->count();
            $lastYear = Parcel::whereDate('created_at', $lastYearDate)->count();
            
            $dailyOperations[] = [
                'day' => $days[$i],
                'thisYear' => $thisYear,
                'lastYear' => $lastYear,
            ];
        }

        // Parcel senders distribution - get all senders
        $senders = Parcel::select('sender', DB::raw('COUNT(*) as count'))
            ->whereNotNull('sender')
            ->groupBy('sender')
            ->orderByDesc('count')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->sender,
                    'value' => $item->count,
                ];
            });

        // If no senders data, provide fallback
        if ($senders->isEmpty()) {
            $senders = collect([
                ['name' => 'Shopee', 'value' => 0],
                ['name' => 'Lazada', 'value' => 0],
                ['name' => 'Amazon', 'value' => 0],
                ['name' => 'Grab', 'value' => 0],
                ['name' => 'Taobao', 'value' => 0],
                ['name' => 'Zalora', 'value' => 0],
            ]);
        }

        // Parcel size distribution
        $sizeData = Parcel::select('size', DB::raw('COUNT(*) as count'))
            ->groupBy('size')
            ->get()
            ->map(function ($item) {
                $sizeMap = [
                    'small' => 'Small',
                    'medium' => 'Medium', 
                    'large' => 'Large'
                ];
                return [
                    'size' => $sizeMap[$item->size] ?? ucfirst($item->size),
                    'count' => $item->count,
                ];
            });

        // If no size data, provide fallback
        if ($sizeData->isEmpty()) {
            $sizeData = collect([
                ['size' => 'Small', 'count' => 0],
                ['size' => 'Medium', 'count' => 0],
                ['size' => 'Large', 'count' => 0],
            ]);
        }

        // Parcel status distribution
        $statusData = Parcel::select('parcel_status', DB::raw('COUNT(*) as count'))
            ->groupBy('parcel_status')
            ->get()
            ->map(function ($item) use ($totalParcels) {
                $statusMap = [
                    'Pending Payment' => 'Payment Verification',
                    'Ready For Collection' => 'Ready for Collection',
                    'Collected' => 'Collected',
                    'Unclaimed' => 'Unclaimed'
                ];
                return [
                    'name' => $statusMap[$item->parcel_status] ?? $item->parcel_status,
                    'value' => $totalParcels > 0 ? round(($item->count / $totalParcels) * 100, 1) : 0,
                    'color' => $this->getStatusColor($item->parcel_status),
                ];
            });

        // If no status data, provide fallback
        if ($statusData->isEmpty()) {
            $statusData = collect([
                ['name' => 'Payment Verification', 'value' => 0, 'color' => '#374151'],
                ['name' => 'Ready for Collection', 'value' => 0, 'color' => '#3B82F6'],
                ['name' => 'Collected', 'value' => 0, 'color' => '#10B981'],
                ['name' => 'Unclaimed', 'value' => 0, 'color' => '#14B8A6'],
            ]);
        }

        // Collection time distribution (based on collection times)
        $collectionTimeData = [];
        $hours = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'];
        
        foreach ($hours as $hour) {
            $hourValue = str_replace(['AM', 'PM'], '', $hour);
            $isPM = strpos($hour, 'PM') !== false;
            if ($isPM && $hourValue != '12') {
                $hourValue = (int)$hourValue + 12;
            }
            
            $count = Parcel::where('parcel_status', 'Collected')
                ->whereRaw('HOUR(updated_at) = ?', [$hourValue])
                ->count();
            
            $collectionTimeData[] = [
                'time' => $hour,
                'count' => $count,
            ];
        }

        // Ensure we always have collection time data
        if (empty($collectionTimeData)) {
            $collectionTimeData = [
                ['time' => '9AM', 'count' => 0],
                ['time' => '10AM', 'count' => 0],
                ['time' => '11AM', 'count' => 0],
                ['time' => '12PM', 'count' => 0],
                ['time' => '1PM', 'count' => 0],
                ['time' => '2PM', 'count' => 0],
                ['time' => '3PM', 'count' => 0],
                ['time' => '4PM', 'count' => 0],
            ];
        }

        return Inertia::render('staff/home', [
            'overview' => [
                'totalParcels' => $totalParcels,
                'newlyArrived' => $newlyArrived,
                'readyForCollection' => $readyForCollection,
                'unclaimed' => $unclaimed,
            ],
            'dailyOperations' => $dailyOperations,
            'parcelSenders' => $senders,
            'parcelSize' => $sizeData,
            'parcelStatus' => $statusData,
            'collectionTime' => $collectionTimeData,
        ]);
    }

    /**
     * Get color for parcel status
     */
    private function getStatusColor($status)
    {
        $colors = [
            'Pending Payment' => '#374151',
            'Ready For Collection' => '#3B82F6',
            'Collected' => '#10B981',
            'Unclaimed' => '#14B8A6'
        ];
        
        return $colors[$status] ?? '#6B7280';
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
