<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Announcement extends Model
{
    use HasFactory;

    protected $table = 'announcements';
    protected $primaryKey = 'announcement_id';

    protected $fillable = [
        'announcement_title',
        'announcement_content',
        'announcement_type',
        'announcement_image',
        'announcement_status',
        'publish_date',
        'expiry_date',
    ];

    protected $casts = [
        'publish_date' => 'datetime',
        'expiry_date'  => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        // Automatically check and update status based on expiry date
        static::saving(function ($announcement) {
            $now = now();

            // If announcement is Published and has passed expiry date, set to Draft
            if (
                $announcement->announcement_status === 'Published' &&
                $announcement->expiry_date &&
                $announcement->expiry_date->lt($now)
            ) {
                $announcement->announcement_status = 'Draft';
            }
        });
    }

    // Optional, but useful:
    public function scopePublished($q)
    {
        return $q->where('announcement_status', 'Published');
    }

    public function scopeActive($q)
    {
        $today = now()->toDateString();

        return $q->published()
            ->where(fn($qq) => $qq->whereNull('publish_date')->orWhere('publish_date', '<=', $today))
            ->where(fn($qq) => $qq->whereNull('expiry_date')->orWhere('expiry_date', '>=', $today));
    }

    /**
     * Check and update expired announcements
     * This should be called periodically (e.g., via cron job or scheduled task)
     */
    public static function checkAndUpdateExpired()
    {
        $now = now();

        // Find all published announcements that have passed their expiry date
        $expiredAnnouncements = static::where('announcement_status', 'Published')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', $now)
            ->get();

        // Update them to Draft status
        if ($expiredAnnouncements->count() > 0) {
            static::whereIn('announcement_id', $expiredAnnouncements->pluck('announcement_id'))
                ->update(['announcement_status' => 'Draft', 'updated_at' => $now]);
        }

        return $expiredAnnouncements->count();
    }
}
