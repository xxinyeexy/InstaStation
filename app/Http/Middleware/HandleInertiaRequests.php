<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Fetch unread notifications for authenticated users (students)
        $notifications = [];
        if ($request->user() && strtolower($request->user()->type) === 'student') {
            $rawNotifications = \App\Models\Notification::where('notifiable_id', $request->user()->id)
                ->where('notifiable_type', 'App\Models\User')
                ->whereNull('read_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $seen = [];
            $notifications = $rawNotifications->map(function ($notification) use (&$seen) {
                $data = json_decode($notification->data, true);
                
                // Filter out "Parcel Ready for Collection" notifications
                $title = strtolower($data['title'] ?? '');
                $message = strtolower($data['message'] ?? '');
                if (
                    strpos($title, 'ready for collection') !== false ||
                    strpos($message, 'ready for collection') !== false ||
                    strpos($message, 'scheduled for pickup') !== false
                ) {
                    return null; // Skip this notification
                }
                
                // Create a stable signature for deduplication: type + parcel_id + message
                $signature = ($notification->type ?? '') . '|' . ($data['parcel_id'] ?? '') . '|' . ($data['message'] ?? '');
                if (in_array($signature, $seen, true)) {
                    return null; // will be filtered out
                }
                $seen[] = $signature;

                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $data['title'] ?? 'Notification',
                    'message' => $data['message'] ?? '',
                    'parcel_code' => $data['parcel_code'] ?? null,
                    'parcel_id' => $data['parcel_id'] ?? null,
                    'rejected_by' => $data['rejected_by'] ?? null,
                    'rejected_at' => $data['rejected_at'] ?? null,
                    'created_at' => $notification->created_at->toDateTimeString(),
                    'read_at' => $notification->read_at ? $notification->read_at->toDateTimeString() : null,
                    'is_read' => $notification->read_at !== null,
                ];
            })->filter()->values();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => $notifications,
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
