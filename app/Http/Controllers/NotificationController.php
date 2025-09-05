<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
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
    public function show(Notification $notification)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Notification $notification)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Notification $notification)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Notification $notification)
    {
        //
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $id)
    {
        $user = Auth::user();

        // Check if user is authenticated
        if (!$user) {
            Log::warning('No authenticated user for mark as read request', ['notification_id' => $id]);
            return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
        }

        // Debug: Log the request
        Log::info('Mark as read request', [
            'notification_id' => $id,
            'user_id' => $user->id,
            'user_type' => get_class($user)
        ]);

        $notification = Notification::where('id', $id)
            ->where('notifiable_id', $user->id)
            ->where('notifiable_type', 'App\Models\User')
            ->first();

        // Debug: Log the query result
        Log::info('Notification query result', [
            'notification_found' => $notification ? true : false,
            'notification_id' => $notification ? $notification->id : null,
            'notifiable_id' => $notification ? $notification->notifiable_id : null,
            'notifiable_type' => $notification ? $notification->notifiable_type : null
        ]);

        if ($notification) {
            $notification->read_at = now();
            $notification->save();

            Log::info('Notification marked as read successfully', ['notification_id' => $id]);
            return response()->json(['success' => true]);
        }

        Log::warning('Notification not found for mark as read', [
            'notification_id' => $id,
            'user_id' => $user->id
        ]);
        return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
    }
}
