<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->get('q', ''));
        $type = trim((string) $request->get('type', ''));

        $query = Announcement::query();
        if ($q !== '') {
            $query->where(function ($qb) use ($q) {
                $qb->where('announcement_title', 'like', "%$q%")
                    ->orWhere('announcement_content', 'like', "%$q%");
            });
        }
        if ($type !== '') {
            if (Schema::hasColumn('announcements', 'announcement_type')) {
                $query->where('announcement_type', $type);
            } elseif (Schema::hasColumn('announcements', 'type')) {
                $query->where('type', $type);
            } elseif (Schema::hasColumn('announcements', 'category')) {
                $query->where('category', $type);
            }
        }

        $rows = $query->orderByDesc('created_at')->get();

        // Build categories list depending on existing schema
        if (Schema::hasColumn('announcements', 'announcement_type')) {
            $categories = Announcement::query()->select('announcement_type')->distinct()->pluck('announcement_type')->filter()->values();
        } elseif (Schema::hasColumn('announcements', 'type')) {
            $categories = Announcement::query()->select('type')->distinct()->pluck('type')->filter()->values();
        } elseif (Schema::hasColumn('announcements', 'category')) {
            $categories = Announcement::query()->select('category')->distinct()->pluck('category')->filter()->values();
        } else {
            $categories = collect(['General', 'Holiday', 'Maintenance', 'Policy']);
        }

        return Inertia::render('staff/announcement', [
            'rows' => $rows,
            'summary' => [
                'total' => $rows->count(),
                'published' => $rows->where('announcement_status', 'Published')->count(),
                'total_views' => 0,
            ],
            'categories' => $categories,
            'filters' => ['q' => $q, 'category' => $type],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'content' => 'required|string',
            'type' => 'nullable|string|max:50',
            'status' => 'required|string|max:50',
            'publish_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:publish_date',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('announcements', 'public');
            $data['image_path'] = $path;
        }

        $incomingType = $data['type'] ?? 'General';
        $data['created_by'] = optional($request->user())->id;
        // Map status (UI uses Draft/Published or Active/Inactive) to DB
        $status = $data['status'];
        if (in_array($status, ['Active', 'Inactive'])) {
            $status = $status === 'Active' ? 'Published' : 'Draft';
        }

        // Build payload matching existing columns (announcement_*)
        $payload = [
            'announcement_title' => $data['title'],
            'announcement_content' => $data['content'],
            'announcement_type' => $incomingType,
            'announcement_status' => $status,
            'publish_date' => $data['publish_date'] ?? null,
            'expiry_date' => $data['expiry_date'] ?? null,
        ];
        if (!empty($data['image_path'])) {
            $payload['announcement_image'] = $data['image_path'];
        }

        $ann = Announcement::create($payload);

        return response()->json(['success' => true, 'announcement' => $ann]);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'content' => 'sometimes|string',
            'type' => 'sometimes|nullable|string|max:50',
            'status' => 'sometimes|string|max:50',
            'publish_date' => 'sometimes|nullable|date',
            'expiry_date' => 'sometimes|nullable|date|after_or_equal:publish_date',
            'image' => 'sometimes|nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('announcements', 'public');
            $data['image_path'] = $path;
        }

        $payload = [];
        if (array_key_exists('title', $data)) $payload['announcement_title'] = $data['title'];
        if (array_key_exists('content', $data)) $payload['announcement_content'] = $data['content'];
        if (array_key_exists('type', $data)) $payload['announcement_type'] = $data['type'];
        if (array_key_exists('publish_date', $data)) $payload['publish_date'] = $data['publish_date'];
        if (array_key_exists('expiry_date', $data)) $payload['expiry_date'] = $data['expiry_date'];
        if (array_key_exists('image_path', $data)) $payload['announcement_image'] = $data['image_path'];

        if (array_key_exists('status', $data)) {
            $status = $data['status'];
            if (in_array($status, ['Active', 'Inactive'])) {
                $status = $status === 'Active' ? 'Published' : 'Draft';
            }
            $payload['announcement_status'] = $status;
        }

        $announcement->update($payload);

        return response()->json(['success' => true, 'announcement' => $announcement->fresh()]);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['success' => true]);
    }

    public function publish(Request $request, Announcement $announcement)
    {
        $data = $request->validate([
            'publish_date' => 'sometimes|nullable|date',
        ]);

        $publishDate = $data['publish_date'] ?? ($announcement->publish_date ?: now()->toISOString());
        $announcement->update([
            'announcement_status' => 'Published',
            'publish_date' => $publishDate,
            'updated_at' => now(),
        ]);
        return response()->json(['success' => true, 'announcement' => $announcement->fresh()]);
    }

    public function unpublish(Announcement $announcement)
    {
        $announcement->update([
            'announcement_status' => 'Draft',
            'updated_at' => now(),
        ]);
        return response()->json(['success' => true, 'announcement' => $announcement->fresh()]);
    }
}
