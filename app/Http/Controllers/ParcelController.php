<?php

namespace App\Http\Controllers;

use App\Models\Parcel;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Staff;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ParcelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('staff/add-parcel');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
            $user = Auth::user(); 
        if (!$user || !$user->staff) {
        Log::error('Staff record not found for user ID: ' . ($user->id ?? 'N/A'));
        return redirect()->back()->withErrors(['auth' => 'Staff account not linked. Please contact admin.']);
    }


        $request->validate([
            'tracking_no' => 'required|unique:parcels,tracking_no|max:50',
            'size' => 'nullable|string',
            'sender' => 'required|string|max:50',
            'location' => 'nullable|string|max:100',
            'student_id' => 'required|exists:students,student_id',
            'qr_code' => 'nullable|unique:parcels,qr_code|max:255',
        ]);

        Parcel::create([
            'tracking_no' => $request->tracking_no,
            'size' => $request->size,
            'sender' => $request->sender,
            'location' => $request->location,
            'student_id' => $request->student_id,
            'parcel_status' => 'Pending Payment',
            'days' => null,
            'qr_code' => $request->qr_code,
            'schedule' => now(),
            'created_by' => Auth::user()->staff_id,
            'last_edited_by' => Auth::user()->staff_id,
        ]);

        return redirect()->back()->with('success', 'Parcel registered successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Parcel $parcel)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Parcel $parcel)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Parcel $parcel)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Parcel $parcel)
    {
        //
    }

    /**
     * Search for students by name
     */
    public function searchStudents(Request $request)
    {
        $query = $request->get('query');

        Log::info('Student search query: ' . $query);

        if (empty($query)) {
            return response()->json([]);
        }

        // Search in students table and join with users table to get matric ID
        $students = User::select('id as student_id', 'name as student_name', 'email', 'matric as matric_id')
            ->where('type', 'student')
            ->where('name', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get()
            ->map(function ($student) {
                return [
                    'student_id' => $student->student_id,
                    'student_name' => $student->student_name,
                    'matric_id' => $student->matric_id,
                    'email' => $student->email
                ];
            });

        Log::info('Student search results: ' . $students->count() . ' found');
        Log::info('Results: ' . $students->toJson());

        return response()->json($students);
    }
}
