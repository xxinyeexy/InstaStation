<?php

namespace App\Http\Controllers;

use App\Models\Parcel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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
                'student_id' => 'required|string',
                'qr_code' => 'nullable|string|max:255',
            ]);

            Log::info('Validation passed', ['validated_data' => $validatedData]);

            // Find the student user by matric ID or user ID
            $student_user = User::where('matric', $request->student_id)
                ->orWhere('id', $request->student_id)
                ->where('type', 'student')
                ->first();

            if (!$student_user) {
                Log::error('Student not found in users table', ['student_id' => $request->student_id]);
                return response()->json(['message' => 'Student not found with ID: ' . $request->student_id], 404);
            }

            Log::info('Student user found', [
                'student_user_id' => $student_user->id,
                'student_matric' => $student_user->matric,
                'student_name' => $student_user->name
            ]);

            Log::info('Staff user authenticated', [
                'staff_user_id' => $user->id,
                'staff_name' => $user->name
            ]);

            // Create the parcel - both student_id and staff IDs reference the users table
            $parcel = Parcel::create([
                'tracking_no' => $validatedData['tracking_no'],
                'size' => $validatedData['size'],
                'sender' => $validatedData['sender'],
                'location' => $validatedData['location'],
                'student_id' => $student_user->id, // Reference to users table
                'parcel_status' => 'Pending Payment',
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
                'message' => 'Parcel registered successfully.',
                'parcel' => $parcel,
                'student' => [
                    'name' => $student_user->name,
                    'matric' => $student_user->matric,
                    'email' => $student_user->email
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
            $parcel = \App\Models\Parcel::findOrFail($id);
            $currentUser = Auth::user();

            $parcel->update([
                'parcel_status' => 'Collected',
                'last_edited_by' => $currentUser->id,
                'updated_at' => now()
            ]);

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
            $parcel = Parcel::with(['studentUser', 'createdBy', 'lastEditedBy'])->findOrFail($id);

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
}
