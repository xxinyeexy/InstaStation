<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Parcel;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function student(): Response
    {
        $user = Auth::user();

        // Fetch only the logged-in student's parcels
        $parcels = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy'])
            ->where('student_id', optional($user)->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (Parcel $parcel) {
                return [
                    'parcel_id' => $parcel->parcel_id,
                    'student_id' => $parcel->student_id,
                    'tracking_no' => $parcel->tracking_no,
                    'parcel_status' => $parcel->parcel_status,
                    'days' => $parcel->days,
                    'sender' => $parcel->sender,
                    'size' => $parcel->size,
                    'location' => $parcel->location,
                    'qr_code' => $parcel->qr_code,
                    'schedule' => optional($parcel->schedule)?->toDateTimeString(),
                    'created_by' => $parcel->createdBy
                        ? [
                            'id' => $parcel->createdBy->id,
                            'name' => $parcel->createdBy->name,
                            'email' => $parcel->createdBy->email,
                        ]
                        : $parcel->created_by,
                    'last_edited_by' => $parcel->lastEditedBy
                        ? [
                            'id' => $parcel->lastEditedBy->id,
                            'name' => $parcel->lastEditedBy->name,
                            'email' => $parcel->lastEditedBy->email,
                        ]
                        : $parcel->last_edited_by,
                    'report_at' => optional($parcel->report_at)?->toDateTimeString(),
                    'created_at' => optional($parcel->created_at)?->toDateTimeString(),
                    'updated_at' => optional($parcel->updated_at)?->toDateTimeString(),
                    'student_user' => $parcel->studentUser
                        ? [
                            'id' => $parcel->studentUser->id,
                            'name' => $parcel->studentUser->name,
                            'matric' => $parcel->studentUser->matric,
                            'email' => $parcel->studentUser->email,
                        ]
                        : null,
                ];
            });

        return Inertia::render('student/parcel', [
            'parcels' => $parcels,
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
    public function show(Student $student)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Student $student)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Student $student)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student)
    {
        //
    }
}
