<?php

namespace App\Http\Controllers;

use App\Models\Parcel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Jobs\SendParcelReminder;
use App\Notifications\ParcelCollectedNotification;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ParcelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $parcels = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy'])  // Updated relationship names
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate stats
        $stats = [
            'newlyArrived' => $parcels->where('created_at', '>=', today())->count(),
            'pendingPayments' => $parcels->where('parcel_status', 'Pending Payment')->count(),
            'readyForCollection' => $parcels->where('parcel_status', 'Ready For Collection')->count(),
            'todayCollection' => $parcels->where('parcel_status', 'Collected')->where('updated_at', '>=', today())->count(),
            'totalRevenue' => $parcels->where('parcel_status', 'Collected')->count(), // RM1 per collected parcel
            'paymentVerified' => $parcels->where('parcel_status', 'Approved')->count(),
        ];

        return Inertia::render('staff/parcel', [  // Make sure this matches your component path
            'parcels' => $parcels->toArray(),
            'stats' => $stats

        ]);
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
        if (!$user || $user->type !== 'staff') {
            Log::error('User is not staff', ['user_id' => ($user->id ?? 'N/A'), 'user_type' => ($user->type ?? 'N/A')]);
            return response()->json(['message' => 'Access denied. Staff account required.'], 403);
        }

        try {
            // Log the incoming request for debugging
            Log::info('Parcel registration request received', [
                'user_id' => $user->id,
                'request_data' => $request->all()
            ]);

            $validatedData = $request->validate([
                'tracking_no' => 'required|unique:parcels,tracking_no|max:50',
                'size' => 'nullable|string',
                'sender' => 'required|string|max:50',
                'location' => 'nullable|string|max:100',
                // student is optional; can be matric or user id
                'student_id' => 'nullable|string',
                'recipient_name' => 'nullable|string|max:150',
                'recipient_matric' => 'nullable|string|max:50',
                'qr_code' => 'nullable|string|max:255',
            ]);

            Log::info('Validation passed', ['validated_data' => $validatedData]);

            // Try resolve student if provided; else allow null and mark Unclaimed
            $student_user = null;
            if ($request->filled('student_id')) {
                $student_user = User::where('type', 'student')
                    ->where(function ($q) use ($request) {
                        $q->where('matric', $request->student_id)
                            ->orWhere('id', $request->student_id);
                    })
                    ->first();

                if (!$student_user) {
                    Log::warning('Student not found, proceeding as Unclaimed', ['student_id' => $request->student_id]);
                }
            }

            if ($student_user) {
                Log::info('Student user found', [
                    'student_user_id' => $student_user->id,
                    'student_matric' => $student_user->matric,
                    'student_name' => $student_user->name
                ]);
            }

            Log::info('Staff user authenticated', [
                'staff_user_id' => $user->id,
                'staff_name' => $user->name
            ]);

            // Create the parcel - if no student, mark as Unclaimed
            $parcel = Parcel::create([
                'tracking_no' => $validatedData['tracking_no'],
                'size' => $validatedData['size'],
                'sender' => $validatedData['sender'],
                'location' => $validatedData['location'],
                'student_id' => $student_user?->id, // May be null
                // Save fallback recipient details when student is not linked
                'recipient_name' => $student_user ? null : ($validatedData['recipient_name'] ?? null),
                'recipient_matric' => $student_user ? null : ($validatedData['recipient_matric'] ?? ($request->student_id ?: null)),
                'parcel_status' => $student_user ? 'Pending Payment' : 'Unclaimed',
                'days' => null,
                'qr_code' => $validatedData['qr_code'],
                'schedule' => null, // Schedule should be null initially
                'time_slot' => null, // Time slot should be null initially
                'created_by' => $user->id, // Reference to users table (staff)
                'last_edited_by' => $user->id, // Reference to users table (staff)
            ]);

            Log::info('Parcel created successfully', [
                'parcel_id' => $parcel->id,
                'tracking_no' => $parcel->tracking_no,
                'student_id' => $parcel->student_id,
                'created_by' => $parcel->created_by
            ]);

            return response()->json([
                'message' => 'Parcel registered successfully',
                'parcel' => $parcel,
                'student' => [
                    'name' => $student_user->name ?? null,
                    'matric' => $student_user->matric ?? null,
                    'email' => $student_user->email ?? null
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Parcel registration error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }
    // In your controller
    public function markAsCollected($id)
    {
        try {
            $parcel = \App\Models\Parcel::with(['studentUser'])->findOrFail($id);
            $currentUser = Auth::user();

            // Check if parcel is already collected to prevent duplicate emails
            $wasAlreadyCollected = $parcel->parcel_status === 'Collected';

            $parcel->update([
                'parcel_status' => 'Collected',
                'last_edited_by' => $currentUser->id,
                'updated_at' => now()
            ]);

            // Send email notification with receipt to student ONLY if status changed to Collected
            if (!$wasAlreadyCollected && $parcel->studentUser && $parcel->studentUser->email) {
                try {
                    $parcel->studentUser->notify(new ParcelCollectedNotification($parcel));
                    Log::info('Parcel collected notification sent', [
                        'parcel_id' => $parcel->parcel_id,
                        'parcel_code' => $parcel->parcel_code,
                        'student_email' => $parcel->studentUser->email,
                        'collected_by' => $currentUser->name
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send parcel collected notification', [
                        'parcel_id' => $parcel->parcel_id,
                        'error' => $e->getMessage()
                    ]);
                    // Don't fail the whole request if email fails
                }
            } elseif ($wasAlreadyCollected) {
                Log::info('Parcel already collected, skipping notification', [
                    'parcel_id' => $parcel->parcel_id,
                    'parcel_code' => $parcel->parcel_code
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Parcel marked as collected successfully',
                'parcel' => $parcel->load(['createdBy', 'lastEditedBy'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark parcel as collected'
            ], 500);
        }
    }
    /**
     * Display the specified resource.
     */
    public function show(Parcel $parcel)
    {
        //
    }

    /**
     * Get detailed parcel information for the view modal
     */
    public function getParcelDetails($id)
    {
        try {
            Log::info('Fetching parcel details for ID: ' . $id);
            $parcel = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy'])->findOrFail($id);
            Log::info('Parcel found with status: ' . $parcel->parcel_status);

            $parcelDetails = [
                'parcel_id' => $parcel->parcel_id,
                'tracking_no' => $parcel->tracking_no,
                'parcel_status' => $parcel->parcel_status,
                'sender' => $parcel->sender,
                'size' => $parcel->size,
                'location' => $parcel->location,
                'days' => $parcel->days,
                'qr_code' => $parcel->qr_code,
                'schedule' => $parcel->schedule,
                'created_at' => $parcel->created_at,
                'updated_at' => $parcel->updated_at,
                'student_id' => $parcel->student_id,
                'created_by' => $parcel->created_by,
                'last_edited_by' => $parcel->last_edited_by,
                'student_user' => $parcel->studentUser ? [
                    'id' => $parcel->studentUser->id,
                    'name' => $parcel->studentUser->name,
                    'matric' => $parcel->studentUser->matric,
                    'email' => $parcel->studentUser->email,
                ] : null,
                'weight' => 'N/A',
                'dimensions' => $parcel->size ?? 'N/A',
                'description' => 'N/A',
                'sender_address' => 'N/A',
                'fee' => 1.00,
            ];

            return response()->json([
                'success' => true,
                'parcel' => $parcelDetails
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch parcel details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Find a parcel by its parcel_code and return details (for QR scan)
     */
    public function getParcelByCode(string $code)
    {
        try {
            $cleanCode = trim($code);
            $normalized = strtolower(preg_replace('/\s+/', '', $cleanCode));

            $parcel = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy'])
                ->where(function ($q) use ($cleanCode, $normalized) {
                    $q->where('parcel_code', $cleanCode)
                        ->orWhere('tracking_no', $cleanCode)
                        ->orWhere('parcel_id', $cleanCode)
                        ->orWhereRaw('REPLACE(LOWER(parcel_code), " ", "") = ?', [$normalized])
                        ->orWhereRaw('REPLACE(LOWER(tracking_no), " ", "") = ?', [$normalized]);
                })
                ->first();

            if (!$parcel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parcel not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'parcel' => [
                    'parcel_id' => $parcel->parcel_id,
                    'parcel_code' => $parcel->parcel_code,
                    'tracking_no' => $parcel->tracking_no,
                    'parcel_status' => $parcel->parcel_status,
                    'sender' => $parcel->sender,
                    'size' => $parcel->size,
                    'location' => $parcel->location,
                    'days' => $parcel->days,
                    'qr_code' => $parcel->qr_code,
                    'schedule' => $parcel->schedule,
                    'time_slot' => $parcel->time_slot,
                    'created_at' => $parcel->created_at,
                    'updated_at' => $parcel->updated_at,
                    'student_id' => $parcel->student_id,
                    'created_by' => $parcel->created_by,
                    'last_edited_by' => $parcel->last_edited_by,
                    'student_user' => $parcel->studentUser ? [
                        'id' => $parcel->studentUser->id,
                        'name' => $parcel->studentUser->name,
                        'matric' => $parcel->studentUser->matric,
                        'email' => $parcel->studentUser->email,
                    ] : null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch parcel by code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send reminder notifications for parcels.
     * Accepts JSON body { parcel_ids: [1,2,3] } or { parcel_ids: 'all' }
     */
    public function remind(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || ($user->type ?? '') !== 'staff') {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $payload = $request->all();
            if (!array_key_exists('parcel_ids', $payload)) {
                return response()->json(['success' => false, 'message' => 'parcel_ids is required'], 422);
            }

            $parcelIds = $payload['parcel_ids'];
            $today = now()->toDateString();

            // Build base query for eligible parcels (uncollected statuses)
            $baseQuery = Parcel::whereIn('parcel_status', ['Ready For Collection', 'Ready to Collect', 'Unclaimed', 'Pending Payment'])
                ->where(function ($q) use ($today) {
                    $q->whereNull('reminder_sent_at')
                        ->orWhereDate('reminder_sent_at', '<', $today);
                });

            if ($parcelIds === 'all') {
                $parcels = $baseQuery->get();
            } elseif (is_array($parcelIds)) {
                $parcels = $baseQuery->whereIn('parcel_id', $parcelIds)->get();
            } else {
                return response()->json(['success' => false, 'message' => 'parcel_ids must be array or "all"'], 422);
            }

            $queued = 0;
            $skipped = 0;
            foreach ($parcels as $parcel) {
                // only notify if parcel has an associated student with email
                if ($parcel->studentUser && !empty($parcel->studentUser->email)) {
                    SendParcelReminder::dispatch($parcel);
                    $queued++;
                } else {
                    Log::info('Skipping reminder: no student/email', ['parcel_id' => $parcel->parcel_id]);
                    $skipped++;
                }
            }

            // Determine how many requested but skipped due to already reminded today
            $requestedCount = ($parcelIds === 'all') ? Parcel::whereIn('parcel_status', ['Ready For Collection', 'Ready to Collect', 'Unclaimed', 'Pending Payment'])->count() : count($parcelIds);
            $skipped_due_to_recent = max(0, $requestedCount - $queued - $skipped);

            return response()->json([
                'success' => true,
                'message' => 'Reminders processed',
                'queued' => $queued,
                'skipped_no_contact' => $skipped,
                'skipped_recently' => $skipped_due_to_recent,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue reminders: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Failed to queue reminders'], 500);
        }
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
    public function update(Request $request, $id)
    {
        try {
            $parcel = Parcel::findOrFail($id);
            $user = Auth::user();

            // Validate the request
            $validatedData = $request->validate([
                'tracking_no' => 'sometimes|string|max:50',
                'parcel_status' => 'sometimes|string|in:Pending Payment,Ready for Collection,Collected,Unclaimed',
                'sender' => 'sometimes|string|max:50',
                'size' => 'sometimes|nullable|string',
                'location' => 'sometimes|nullable|string|max:100',
                'sender_name' => 'sometimes|string|max:50',
                'sender_address' => 'sometimes|nullable|string',
                'weight' => 'sometimes|nullable|string',
                'dimensions' => 'sometimes|nullable|string',
                'fee' => 'sometimes|numeric|min:0',
                'description' => 'sometimes|nullable|string',
            ]);

            // Map form fields to database fields
            $updateData = [
                'last_edited_by' => $user->id,
                'updated_at' => now(),
            ];

            // Map validated data to database fields
            if (isset($validatedData['tracking_no'])) $updateData['tracking_no'] = $validatedData['tracking_no'];
            if (isset($validatedData['parcel_status'])) $updateData['parcel_status'] = $validatedData['parcel_status'];
            if (isset($validatedData['sender'])) $updateData['sender'] = $validatedData['sender'];
            if (isset($validatedData['sender_name'])) $updateData['sender'] = $validatedData['sender_name'];
            if (isset($validatedData['size'])) $updateData['size'] = $validatedData['size'];
            if (isset($validatedData['dimensions'])) $updateData['size'] = $validatedData['dimensions'];
            if (isset($validatedData['location'])) $updateData['location'] = $validatedData['location'];

            // Update the parcel
            $parcel->update($updateData);

            // Refresh the model to get latest values after update
            $parcel->refresh();

            // Ensure that parcels marked as Ready for Collection have a collection_code
            try {
                $statusNormalized = strtolower($parcel->parcel_status ?? '');
                if (in_array($statusNormalized, ['ready for collection', 'ready to collect']) && !$parcel->collection_code) {
                    // Generate collection code: alphabet + 3 numbers (e.g., A123)
                    $alphabet = chr(rand(65, 90)); // Random uppercase letter A-Z
                    $numbers = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
                    $collectionCode = $alphabet . $numbers;

                    // Persist collection code
                    $parcel->update(['collection_code' => $collectionCode]);
                    Log::info('Generated collection code for parcel during status update', ['parcel_id' => $parcel->parcel_id, 'collection_code' => $collectionCode]);

                    // Refresh again so returned parcel contains the new code
                    $parcel->refresh();
                }
            } catch (\Exception $e) {
                // Log but don't fail the whole request if collection code generation fails
                Log::error('Failed to generate collection code on parcel update', ['parcel_id' => $parcel->parcel_id ?? $id, 'error' => $e->getMessage()]);
            }

            // Load relationships for response
            $parcel->load(['studentUser', 'createdBy', 'lastEditedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Parcel updated successfully',
                'parcel' => $parcel
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update parcel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $parcel = Parcel::findOrFail($id);
        $parcel->delete();

        return response()->json(['message' => 'Parcel deleted']);
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

        // Search in users table for students
        $students = User::select('id as student_id', 'name as student_name', 'email', 'matric as matric_id')
            ->where('type', 'student')
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                    ->orWhere('matric', 'LIKE', "%{$query}%")
                    ->orWhere('email', 'LIKE', "%{$query}%");
            })
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

        return response()->json($students);
    }
    public function history()
    {
        $user = Auth::user();

        $parcels = Parcel::where('student_id', $user->id)
            ->whereRaw('LOWER(parcel_status) = ?', ['collected'])
            ->orderByDesc('schedule')
            ->get()
            ->map(function ($p) {
                return [
                    // Frontend expects `id` to be the primary key used by routes (parcel_id)
                    'id' => $p->parcel_id,
                    'parcel_code' => $p->parcel_code,
                    'collected_at' => optional($p->schedule)->toDateString(),
                    // Fee is RM1.00 per collected parcel
                    'fee' => 1.00,
                    'status' => 'Completed',
                ];
            });

        $total_collections = $parcels->count();
        $collections_this_year = $parcels->where('collected_at', '>=', now()->startOfYear()->toDateString())->count();
        // Total fees reflect RM1 per collected parcel
        $total_fees = $total_collections * 1.00;

        return Inertia::render('student/history', [
            'total_collections' => $total_collections,
            'collections_this_year' => $collections_this_year,
            'total_fees' => $total_fees,
            'parcels' => $parcels,
        ]);
    }

    public function export($id)
    {
        // Preview page rendered via Inertia React page
        $parcel = Parcel::with(['studentUser', 'payment', 'createdBy', 'lastEditedBy'])
            ->where('parcel_id', $id)
            ->firstOrFail();

        return Inertia::render('student/report', [
            'parcel' => $parcel,
            'student' => $parcel->studentUser,
            'payment' => $parcel->payment,
        ]);
    }

    public function exportDownload($id)
    {
        $parcel = Parcel::with(['studentUser', 'payment', 'createdBy', 'lastEditedBy'])
            ->where('parcel_id', $id)
            ->firstOrFail();

        $pdf = Pdf::loadView('exports.parcel_report', [
            'parcel' => $parcel,
            'student' => $parcel->studentUser,
            'payment' => $parcel->payment,
        ]);

        return $pdf->download('parcel_report_' . ($parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id) . '.pdf');
    }
}
