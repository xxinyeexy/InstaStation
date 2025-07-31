<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Parcel extends Model
{
     protected $table = 'parcels';
    protected $primaryKey = 'parcel_id';
     use HasFactory;
    protected $fillable = [
        'tracking_no',
        'size',
        'sender',
        'location',
        'student_id',
        'parcel_status',
        'days',
        'qr_code',
        'schedule',
        'created_by',
        'last_edited_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'report_at' => 'datetime',
        'schedule' => 'datetime',
    ];

    // Relationships
    public function studentUser()
    {
        return $this->belongsTo(User::class, 'student_id');
    }


   
    

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lastEditedBy()
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'parcel_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'parcel_id');
    }
}
