<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Parcel;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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
                    'time_slot' => $parcel->time_slot,
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

    /**
     * Display the specified parcel for student view.
     */
    public function viewParcel($id): Response
    {
        $user = Auth::user();

        // Fetch the specific parcel and ensure it belongs to the logged-in student
        $parcel = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy'])
            ->where('parcel_id', $id)
            ->where('student_id', $user->id)
            ->firstOrFail();

        // Generate tracking history based on parcel status and timestamps
        $trackingHistory = $this->generateTrackingHistory($parcel);

        // Format parcel data for the view
        $parcelData = [
            'id' => $parcel->parcel_id,
            'tracking_no' => $parcel->tracking_no,
            'status' => $parcel->parcel_status,
            'arrivalDate' => $parcel->created_at->format('Y-m-d'),
            'paymentStatus' => $this->getPaymentStatus($parcel->parcel_status),
            'size' => $parcel->size ?? 'N/A',
            'sender' => $parcel->sender ?? 'N/A',
            'location' => $parcel->location ?? 'N/A',
            'days' => $parcel->days ?? 0,
            'schedule' => $parcel->schedule ? $parcel->schedule->format('Y-m-d H:i:s') : null,
            'time_slot' => $parcel->time_slot,
            'created_at' => $parcel->created_at,
            'updated_at' => $parcel->updated_at,
            'student_user' => $parcel->studentUser ? [
                'id' => $parcel->studentUser->id,
                'name' => $parcel->studentUser->name,
                'matric' => $parcel->studentUser->matric,
                'email' => $parcel->studentUser->email,
            ] : null,
            'created_by' => $parcel->createdBy ? [
                'id' => $parcel->createdBy->id,
                'name' => $parcel->createdBy->name,
                'email' => $parcel->createdBy->email,
            ] : null,
            'last_edited_by' => $parcel->lastEditedBy ? [
                'id' => $parcel->lastEditedBy->id,
                'name' => $parcel->lastEditedBy->name,
                'email' => $parcel->lastEditedBy->email,
            ] : null,
        ];

        return Inertia::render('student/view-parcel', [
            'parcel' => $parcelData,
            'trackingHistory' => $trackingHistory,
        ]);
    }

    /**
     * Generate tracking history based on parcel status and timestamps.
     */
    private function generateTrackingHistory($parcel): array
    {
        $history = [];
        $createdTime = $parcel->created_at;
        $updatedTime = $parcel->updated_at;

        // Always add "Parcel Arrived" as the first event
        $history[] = [
            'id' => 1,
            'title' => 'Parcel Arrived',
            'description' => 'Parcel received at university mail center',
            'attribution' => $parcel->createdBy ? "by {$parcel->createdBy->name}" : 'by Mail Center Staff',
            'timestamp' => $createdTime->format('n/j/Y, g:i:s A'),
            'hasAttribution' => true,
            'icon' => 'package',
            'iconColor' => 'blue',
        ];

        // Add "Student Matched" event (15 minutes after arrival)
        $studentMatchedTime = $createdTime->copy()->addMinutes(15);
        $history[] = [
            'id' => 2,
            'title' => 'Student Matched',
            'description' => 'Automatically matched to registered student',
            'attribution' => null,
            'timestamp' => $studentMatchedTime->format('n/j/Y, g:i:s A'),
            'hasAttribution' => false,
            'icon' => 'clock',
            'iconColor' => 'orange',
        ];

        // Add payment-related events based on status
        // Only include payment events for approved statuses (ready for collection, collected, approved)
        // Exclude payment events for pending payment status
        if (in_array(strtolower($parcel->parcel_status), ['ready for collection', 'collected', 'approved'])) {
            // Payment Submitted (3 hours after arrival)
            $paymentSubmittedTime = $createdTime->copy()->addHours(3);
            $history[] = [
                'id' => 3,
                'title' => 'Payment Submitted',
                'description' => 'Student submitted payment proof via QR scan',
                'attribution' => $parcel->studentUser ? "by {$parcel->studentUser->name}" : 'by Student',
                'timestamp' => $paymentSubmittedTime->format('n/j/Y, g:i:s A'),
                'hasAttribution' => true,
                'icon' => 'credit-card',
                'iconColor' => 'green',
            ];

            // Payment Verified (1 hour after payment submitted)
            $paymentVerifiedTime = $paymentSubmittedTime->copy()->addHour();
            $history[] = [
                'id' => 4,
                'title' => 'Payment Verified',
                'description' => 'Payment verified and approved by staff',
                'attribution' => $parcel->lastEditedBy ? "by {$parcel->lastEditedBy->name}" : 'by Staff Member',
                'timestamp' => $paymentVerifiedTime->format('n/j/Y, g:i:s A'),
                'hasAttribution' => true,
                'icon' => 'credit-card',
                'iconColor' => 'green',
            ];

            // Ready for Collection (1 minute after payment verified)
            if (in_array(strtolower($parcel->parcel_status), ['ready for collection', 'collected'])) {
                $readyTime = $paymentVerifiedTime->copy()->addMinute();
                $history[] = [
                    'id' => 5,
                    'title' => 'Ready for Collection',
                    'description' => 'Parcel is ready for student collection',
                    'attribution' => 'by System',
                    'timestamp' => $readyTime->format('n/j/Y, g:i:s A'),
                    'hasAttribution' => true,
                    'icon' => 'package',
                    'iconColor' => 'blue',
                ];
            }

            // Collected (if status is collected)
            if (strtolower($parcel->parcel_status) === 'collected') {
                $collectedTime = $updatedTime;
                $history[] = [
                    'id' => 6,
                    'title' => 'Collected',
                    'description' => 'Parcel has been collected by student',
                    'attribution' => $parcel->studentUser ? "by {$parcel->studentUser->name}" : 'by Student',
                    'timestamp' => $collectedTime->format('n/j/Y, g:i:s A'),
                    'hasAttribution' => true,
                    'icon' => 'check-circle',
                    'iconColor' => 'green',
                ];
            }
        }

        return $history;
    }

    /**
     * Get payment status based on parcel status.
     */
    private function getPaymentStatus($parcelStatus): string
    {
        $status = strtolower($parcelStatus);

        if (in_array($status, ['ready for collection', 'collected', 'approved'])) {
            return 'Verified';
        } elseif ($status === 'pending payment') {
            return 'Pending';
        } else {
            return 'Unknown';
        }
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

    /**
     * Show schedule pickup page for a specific parcel.
     */
    public function schedulePickup($id): Response
    {
        $user = Auth::user();
        $parcel = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy'])
            ->where('parcel_id', $id)
            ->where('student_id', $user->id)
            ->firstOrFail();

        // Generate collection code (simple format: B + random 3 digits)
        $collectionCode = 'B' . str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);

        $parcelData = [
            'id' => $parcel->parcel_id,
            'tracking_no' => $parcel->tracking_no,
            'status' => $parcel->parcel_status,
            'collection_code' => $collectionCode,
            'sender' => $parcel->sender ?? 'N/A',
            'payment_status' => $this->getPaymentStatus($parcel->parcel_status),
            'student_user' => $parcel->studentUser ? [
                'id' => $parcel->studentUser->id,
                'name' => $parcel->studentUser->name,
                'matric' => $parcel->studentUser->matric,
                'email' => $parcel->studentUser->email,
            ] : null,
        ];

        return Inertia::render('student/schedule', [
            'parcel' => $parcelData,
        ]);
    }

    public function storeSchedule(Request $request, $id): JsonResponse
    {
        $user = Auth::user();

        // Validate the request
        $request->validate([
            'scheduled_datetime' => 'required|date|after:now',
            'time_slot' => 'required|string|max:50',
        ]);

        try {
            // Debug logging
            Log::info('Scheduling request received', [
                'parcel_id' => $id,
                'user_id' => $user->id,
                'scheduled_datetime' => $request->scheduled_datetime,
                'request_data' => $request->all()
            ]);

            // Find the parcel and ensure it belongs to the authenticated user
            $parcel = Parcel::where('parcel_id', $id)
                ->where('student_id', $user->id)
                ->firstOrFail();

            // Check if parcel is already scheduled
            if ($parcel->schedule) {
                return response()->json([
                    'message' => 'Parcel is already scheduled for pickup'
                ], 400);
            }

            // Update the parcel with the scheduled datetime, time slot, and change status to "Ready for Collection"
            $parcel->update([
                'schedule' => $request->scheduled_datetime,
                'time_slot' => $request->time_slot,
                'parcel_status' => 'Ready for Collection',
                'last_edited_by' => $user->id,
            ]);

            Log::info('Parcel scheduled successfully', [
                'parcel_id' => $parcel->parcel_id,
                'schedule' => $parcel->schedule,
                'status' => $parcel->parcel_status
            ]);

            return response()->json([
                'message' => 'Pickup scheduled successfully',
                'parcel' => [
                    'id' => $parcel->parcel_id,
                    'tracking_no' => $parcel->tracking_no,
                    'scheduled_datetime' => $parcel->schedule,
                ]
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Parcel not found or access denied'
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to schedule pickup. Please try again.'
            ], 500);
        }
    }
}
