<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Parcel;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\ParcelScheduledNotification;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    /**
     * Maximum allowed participants per time slot session
     */
    private const TIME_SLOT_CAPACITY = 20;

    /**
     * Time slot definitions: human label mapped to [start, end) 24h range.
     * Start inclusive, end exclusive.
     *
     * @var array<string, array{0: string, 1: string}>
     */
    private array $timeSlotRanges = [
        '9:00 AM - 10:00 AM' => ['09:00:00', '10:00:00'],
        '10:00 AM - 11:00 AM' => ['10:00:00', '11:00:00'],
        '11:00 AM - 12:00 PM' => ['11:00:00', '12:00:00'],
        '2:00 PM - 3:00 PM' => ['14:00:00', '15:00:00'],
        '3:00 PM - 4:00 PM' => ['15:00:00', '16:00:00'],
        '4:00 PM - 5:00 PM' => ['16:00:00', '17:00:00'],
    ];

    private function allowedTimeSlots(): array
    {
        return array_keys($this->timeSlotRanges);
    }
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
                    'parcel_code' => $parcel->parcel_code,
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
                    // Check if payment has been verified
                    'payment_verified' => (function () use ($parcel) {
                        try {
                            $p = \App\Models\Payment::where('parcel_id', $parcel->parcel_id)
                                ->orderBy('created_at', 'desc')
                                ->first();
                            return $p && !empty($p->verified_by);
                        } catch (\Exception $e) {
                            return false;
                        }
                    })(),
                    // include latest payment proof url for quick thumbnail in parcel list
                    'payment_proof_url' => (function () use ($parcel) {
                        try {
                            $p = \App\Models\Payment::where('parcel_id', $parcel->parcel_id)->orderBy('created_at', 'desc')->first();
                            return $p && $p->file_path ? Storage::url($p->file_path) : null;
                        } catch (\Exception $e) {
                            return null;
                        }
                    })(),
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

        // Notifications are now provided globally via HandleInertiaRequests middleware
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
            'parcel_code' => $parcel->parcel_code,
            'tracking_no' => $parcel->tracking_no,
            'status' => $parcel->parcel_status,
            'arrivalDate' => $parcel->created_at->format('Y-m-d'),
            'paymentStatus' => $this->getPaymentStatus($parcel->parcel_status),
            'size' => $parcel->size ?? 'N/A',
            'sender' => $parcel->sender ?? 'N/A',
            'location' => $parcel->location ?? 'N/A',
            'days' => $parcel->days ?? 0,
            'schedule' => optional($parcel->schedule)?->format('Y-m-d H:i:s'),
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

        // Get latest payment (if any) for proof image
        $payment = Payment::where('parcel_id', $parcel->parcel_id)
            ->orderBy('created_at', 'desc')
            ->first();

        // Mark any unread notifications related to this parcel as read so the
        // notification badge (red icon) disappears after the student views the
        // parcel detail page.
        try {
            $unread = \App\Models\Notification::where('notifiable_id', $user->id)
                ->where('notifiable_type', 'App\\Models\\User')
                ->whereNull('read_at')
                ->get();

            foreach ($unread as $notif) {
                $data = json_decode($notif->data, true);
                if (($data['parcel_id'] ?? null) == $parcel->parcel_id) {
                    $notif->read_at = now();
                    $notif->save();
                }
            }
        } catch (\Exception $e) {
            // Don't block the page render if notification marking fails; log and continue
            Log::warning('Failed to mark parcel notifications as read', ['parcel_id' => $parcel->parcel_id, 'error' => $e->getMessage()]);
        }

        return Inertia::render('student/view-parcel', [
            'parcel' => $parcelData,
            'trackingHistory' => $trackingHistory,
            // include latest payment proof url (if any) so the student view can show payment image
            'payment_proof_url' => $payment && $payment->file_path ? Storage::url($payment->file_path) : null,
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

        // 1) Parcel Arrived (from DB created_at)
        $history[] = [
            'id' => 1,
            'title' => 'Parcel Arrived',
            'description' => 'Parcel received at university mail center',
            'attribution' => $parcel->createdBy ? "by {$parcel->createdBy->name}" : 'by Mail Center Staff',
            'timestamp' => $createdTime?->format('n/j/Y, g:i:s A') ?? '',
            'hasAttribution' => true,
            'icon' => 'package',
            'iconColor' => 'blue',
        ];

        // 2) Student Matched — use the student's account creation time when available
        $matchedAt = optional($parcel->studentUser)->created_at ?: $createdTime;
        $history[] = [
            'id' => 2,
            'title' => 'Student Matched',
            'description' => 'Automatically matched to registered student',
            'attribution' => null,
            'timestamp' => $matchedAt?->format('n/j/Y, g:i:s A') ?? '',
            'hasAttribution' => false,
            'icon' => 'clock',
            'iconColor' => 'orange',
        ];

        // Fetch latest payment record for real timestamps
        $payment = Payment::where('parcel_id', $parcel->parcel_id)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($payment) {
            // 3) Payment Submitted (Payment.created_at)
            $history[] = [
                'id' => 3,
                'title' => 'Payment Submitted',
                'description' => 'Student submitted payment proof via QR scan',
                'attribution' => $parcel->studentUser ? "by {$parcel->studentUser->name}" : 'by Student',
                'timestamp' => optional($payment->created_at)?->format('n/j/Y, g:i:s A'),
                'hasAttribution' => true,
                'icon' => 'credit-card',
                'iconColor' => 'green',
            ];

            // 4) Payment Verified (when verified_by is set → Payment.updated_at, attribution from staff user)
            if ($payment->verified_by) {
                $staffName = optional(User::find($payment->verified_by))->name ?? 'Staff Member';
                $history[] = [
                    'id' => 4,
                    'title' => 'Payment Verified',
                    'description' => 'Payment verified and approved by staff',
                    'attribution' => "by {$staffName}",
                    'timestamp' => optional($payment->updated_at)?->format('n/j/Y, g:i:s A'),
                    'hasAttribution' => true,
                    'icon' => 'credit-card',
                    'iconColor' => 'green',
                ];
            }
        }

        // 5) Ready for Collection — timestamp is when the student scheduled (parcel updated_at at scheduling)
        if (in_array(strtolower($parcel->parcel_status), ['ready for collection', 'collected']) && $parcel->schedule) {
            $history[] = [
                'id' => 5,
                'title' => 'Ready for Collection',
                'description' => 'Parcel is ready for student collection',
                'attribution' => 'by System',
                'timestamp' => optional($updatedTime)?->format('n/j/Y, g:i:s A'),
                'hasAttribution' => true,
                'icon' => 'package',
                'iconColor' => 'blue',
            ];
        }

        // 6) Collected (use parcel.updated_at at time of collection)
        if (strtolower($parcel->parcel_status) === 'collected') {
            $history[] = [
                'id' => 6,
                'title' => 'Collected',
                'description' => 'Parcel has been collected by student',
                'attribution' => $parcel->studentUser ? "by {$parcel->studentUser->name}" : 'by Student',
                'timestamp' => $updatedTime?->format('n/j/Y, g:i:s A') ?? '',
                'hasAttribution' => true,
                'icon' => 'check-circle',
                'iconColor' => 'green',
            ];
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
    public function schedulePickup($id)
    {
        $user = Auth::user();
        $parcel = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy', 'payment'])
            ->where('parcel_id', $id)
            ->where('student_id', $user->id)
            ->firstOrFail();

        // Check if payment has been verified
        $latestPayment = \App\Models\Payment::where('parcel_id', $parcel->parcel_id)
            ->orderBy('created_at', 'desc')
            ->first();

        $isPaymentVerified = $latestPayment && !empty($latestPayment->verified_by);
        $parcelStatusLower = strtolower($parcel->parcel_status);

        // Prevent scheduling if payment is not verified (unless status is already Approved or Ready for Collection)
        if (!$isPaymentVerified && !in_array($parcelStatusLower, ['approved', 'ready for collection'])) {
            // Redirect back to parcel page with error message
            return redirect()->route('student.parcel')
                ->with('error', 'Payment must be verified before you can schedule pickup. Please wait for staff to verify your payment.');
        }

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

    /**
     * Get availability for each time slot for a given date.
     */
    public function timeSlotAvailability(Request $request, $id): JsonResponse
    {
        $user = Auth::user();

        // ensure parcel belongs to the user (prevents guessing IDs)
        Parcel::where('parcel_id', $id)
            ->where('student_id', $user->id)
            ->firstOrFail();

        $request->validate([
            'date' => 'required|date', // YYYY-MM-DD
        ]);

        // Parse as a plain date to avoid timezone shifts
        $date = Carbon::createFromFormat('Y-m-d', $request->get('date'))->toDateString();

        $slots = [];
        foreach ($this->allowedTimeSlots() as $label) {
            [$start, $end] = $this->timeSlotRanges[$label];

            // Count unique students (not parcels) in this time slot
            // This ensures multiple parcels from the same student only count as one booking
            $count = Parcel::whereDate('schedule', $date)
                ->where(function ($q) use ($label, $start, $end) {
                    $q->where('time_slot', $label)
                        ->orWhere(function ($qq) use ($start, $end) {
                            $qq->whereNull('time_slot')
                                ->whereTime('schedule', '>=', $start)
                                ->whereTime('schedule', '<', $end);
                        });
                })
                ->distinct('student_id')
                ->count('student_id');

            $slots[] = [
                'label' => $label,
                'count' => $count,
                'full' => $count >= self::TIME_SLOT_CAPACITY,
            ];
        }

        // Compute recommended slots (lowest load among not-full)
        $minCount = null;
        foreach ($slots as $s) {
            if ($s['full']) {
                continue;
            }
            if ($minCount === null || $s['count'] < $minCount) {
                $minCount = $s['count'];
            }
        }

        $slots = array_map(function ($s) use ($minCount) {
            $s['recommended'] = !$s['full'] && $minCount !== null && $s['count'] === $minCount;
            return $s;
        }, $slots);

        return response()->json([
            'date' => $date,
            'capacity' => self::TIME_SLOT_CAPACITY,
            'slots' => $slots,
        ]);
    }

    public function storeSchedule(Request $request, $id): JsonResponse
    {
        $user = Auth::user();

        // Validate the request
        $request->validate([
            'scheduled_datetime' => 'required|date|after:now',
            'time_slot' => 'required|string|in:' . implode(',', $this->allowedTimeSlots()),
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

            // Enforce capacity: max N participants per slot per date
            // Count unique students (excluding current user if they already have a booking in this slot)
            $desiredDate = Carbon::parse($request->scheduled_datetime)->toDateString();
            [$start, $end] = $this->timeSlotRanges[$request->time_slot];
            
            // Count unique students in this time slot (same user with multiple parcels counts as 1)
            $existingCount = Parcel::whereDate('schedule', $desiredDate)
                ->where(function ($q) use ($request, $start, $end) {
                    $q->where('time_slot', $request->time_slot)
                        ->orWhere(function ($qq) use ($start, $end) {
                            $qq->whereNull('time_slot')
                                ->whereTime('schedule', '>=', $start)
                                ->whereTime('schedule', '<', $end);
                        });
                })
                ->where('student_id', '!=', $user->id) // Exclude current user
                ->distinct('student_id')
                ->count('student_id');

            if ($existingCount >= self::TIME_SLOT_CAPACITY) {
                return response()->json([
                    'message' => 'Selected time slot is full. Please choose another slot.',
                ], 400);
            }

            // Check if payment has been verified before allowing status change
            $latestPayment = \App\Models\Payment::where('parcel_id', $parcel->parcel_id)
                ->orderBy('created_at', 'desc')
                ->first();

            $isPaymentVerified = $latestPayment && !empty($latestPayment->verified_by);

            // Only allow scheduling if payment is verified OR parcel status is already Approved
            if (!$isPaymentVerified && !in_array(strtolower($parcel->parcel_status), ['approved', 'ready for collection'])) {
                return response()->json([
                    'message' => 'Payment must be verified before scheduling pickup. Please complete payment verification first.',
                ], 400);
            }

            // Generate collection code: alphabet + 3 numbers
            $alphabet = chr(rand(65, 90)); // Random uppercase letter A-Z
            $numbers = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
            $collectionCode = $alphabet . $numbers;

            // Generate QR code immediately and save it
            try {
                $qrCodeSvg = QrCode::format('svg')
                    ->size(400)
                    ->margin(1)
                    ->errorCorrection('H')
                    ->generate($collectionCode);
                
                // Save QR code to storage
                $qrFileName = 'qr_' . $id . '_' . time() . '.svg';
                $qrFilePath = 'qrcodes/' . $qrFileName;
                Storage::disk('public')->put($qrFilePath, $qrCodeSvg);
                
                Log::info('QR Code generated and saved during scheduling', [
                    'parcel_id' => $id,
                    'collection_code' => $collectionCode,
                    'qr_path' => $qrFilePath
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to generate QR code during scheduling', [
                    'parcel_id' => $id,
                    'error' => $e->getMessage()
                ]);
                $qrFilePath = null;
            }

            // Update parcel for schedule. Do NOT change last_edited_by here (students shouldn't overwrite staff editor)
            // Only change status to 'Ready for Collection' if payment is verified
            $updateData = [
                'schedule' => $request->scheduled_datetime,
                'time_slot' => $request->time_slot,
                'collection_code' => $collectionCode,
                'qr_code' => $qrFilePath, // Save the QR code path
            ];

            // Set status to Ready for Collection only if payment is verified
            if ($isPaymentVerified) {
                $updateData['parcel_status'] = 'Ready for Collection';
            }

            $parcel->update($updateData);

            Log::info('Parcel scheduled successfully', [
                'parcel_id' => $parcel->parcel_id,
                'schedule' => $parcel->schedule,
                'status' => $parcel->parcel_status
            ]);

            // Send email notification with QR code and collection code to student
            if ($parcel->studentUser && $parcel->studentUser->email) {
                try {
                    $parcel->refresh(); // Reload parcel with updated data
                    $parcel->studentUser->notify(new ParcelScheduledNotification($parcel));
                    Log::info('Parcel scheduled notification sent', [
                        'parcel_id' => $parcel->parcel_id,
                        'parcel_code' => $parcel->parcel_code,
                        'student_email' => $parcel->studentUser->email,
                        'collection_code' => $parcel->collection_code,
                        'schedule' => $parcel->schedule,
                        'time_slot' => $parcel->time_slot
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send parcel scheduled notification', [
                        'parcel_id' => $parcel->parcel_id,
                        'error' => $e->getMessage()
                    ]);
                    // Don't fail the whole request if email fails
                }
            }

            return response()->json([
                'message' => 'Pickup scheduled successfully',
                'parcel' => [
                    'id' => $parcel->parcel_id,
                    'tracking_no' => $parcel->tracking_no,
                    'scheduled_datetime' => $parcel->schedule,
                    'time_slot' => $parcel->time_slot,
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

    /**
     * Test QR code generation
     */
    public function testQRCode(): JsonResponse
    {
        try {
            Log::info('Testing QR code generation');

            $testData = 'TEST123';
            $qrCodeImage = QrCode::format('svg')
                ->size(300)
                ->margin(10)
                ->errorCorrection('H')
                ->generate($testData);

            $qrCodeBase64 = base64_encode($qrCodeImage);

            Log::info('QR code test successful', ['data' => $testData, 'size' => strlen($qrCodeBase64)]);

            return response()->json([
                'success' => true,
                'test_data' => $testData,
                'qr_code_image' => 'data:image/svg+xml;base64,' . $qrCodeBase64,
            ]);
        } catch (Exception $e) {
            Log::error('QR code test failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'QR code test failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate QR code for a scheduled parcel
     */
    public function generateQRCode($id): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            Log::info('Generating QR code for parcel', ['parcel_id' => $id, 'user_id' => $user->id]);

            $parcel = Parcel::where('parcel_id', $id)
                ->where('student_id', $user->id)
                ->first();

            if (!$parcel) {
                Log::warning('Parcel not found for QR generation', ['parcel_id' => $id, 'user_id' => $user->id]);
                return response()->json(['error' => 'Parcel not found'], 404);
            }

            // Check if parcel is scheduled for pickup
            if (!$parcel->schedule || !$parcel->time_slot) {
                Log::warning('Parcel not scheduled for pickup', ['parcel_id' => $id, 'schedule' => $parcel->schedule, 'time_slot' => $parcel->time_slot]);
                return response()->json(['error' => 'Parcel is not scheduled for pickup'], 400);
            }

            // Generate collection code if not already exists
            if (!$parcel->collection_code) {
                $alphabet = chr(rand(65, 90)); // Random uppercase letter A-Z
                $numbers = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
                $collectionCode = $alphabet . $numbers;
                $parcel->update(['collection_code' => $collectionCode]);
                Log::info('Generated new collection code', ['parcel_id' => $id, 'collection_code' => $collectionCode]);
            } else {
                $collectionCode = $parcel->collection_code;
                Log::info('Using existing collection code', ['parcel_id' => $id, 'collection_code' => $collectionCode]);
            }

            // Generate QR code image as base64 - QR code contains only the parcel code
            Log::info('Generating QR code image', ['parcel_id' => $id, 'parcel_code' => $parcel->parcel_code]);

            $qrCodeImage = QrCode::format('svg')
                ->size(200) // Reduced from 300 to 200 for faster generation
                ->margin(5) // Reduced from 10 to 5 for smaller file size
                ->errorCorrection('M') // Changed from 'H' to 'M' for faster generation
                ->generate($parcel->parcel_code);

            $qrCodeBase64 = base64_encode($qrCodeImage);

            Log::info('QR code generated successfully', ['parcel_id' => $id, 'qr_size' => strlen($qrCodeBase64)]);

            $response = response()->json([
                'qr_code' => $parcel->parcel_code, // QR code content is the parcel code
                'collection_code' => $collectionCode,
                'parcel_code' => $parcel->parcel_code,
                'schedule' => $parcel->schedule,
                'time_slot' => $parcel->time_slot,
                'qr_code_image' => 'data:image/svg+xml;base64,' . $qrCodeBase64,
            ]);

            // Add caching headers for better performance
            $response->header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
            $response->header('ETag', md5($qrCodeBase64));

            return $response;
        } catch (Exception $e) {
            Log::error('Error generating QR code', [
                'parcel_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to generate QR code: ' . $e->getMessage()], 500);
        }
    }
}
