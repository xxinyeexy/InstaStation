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
        'publish_date' => 'date',
        'expiry_date'  => 'date',
    ];

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
}
