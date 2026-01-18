<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB;



class Parcel extends Model
{
    protected $table = 'parcels';
    protected $primaryKey = 'parcel_id';
    use HasFactory;
    protected $fillable = [
        'parcel_code',
        'tracking_no',
        'size',
        'sender',
        'location',
        'student_id',
        'recipient_name',
        'recipient_matric',
        'parcel_status',
        'days',
        'qr_code',
        'collection_code',
        'schedule',
        'time_slot',
        'created_by',
        'last_edited_by',
        'report_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'report_at' => 'datetime',
        'schedule' => 'date',
    ];

    /**
     * Get the number of days since the parcel arrived (created_at).
     * This overrides the static database column to ensure it's always up to date.
     */
    public function getDaysAttribute($value)
    {
        if (!$this->created_at) {
            return 0;
        }
        return (int) $this->created_at->diffInDays(now());
    }

    // Auto-generate parcel_code and auto-populate recipient fields
    protected static function boot()
{
    parent::boot();

    static::creating(function ($model) {
        DB::transaction(function () use ($model) {
            $prefix = "PCL";
            $yearMonth = now()->format('Ym');

            $latest = self::where('parcel_code', 'like', $prefix . $yearMonth . '%')
                          ->lockForUpdate()
                          ->orderBy('parcel_code', 'desc')
                          ->first();

            $newNumber = $latest
                ? str_pad((int) substr($latest->parcel_code, -4) + 1, 4, '0', STR_PAD_LEFT)
                : '0001';

            $model->parcel_code = $prefix . $yearMonth . $newNumber;
        });
        
        // Ensure report_at is set correctly - use sentinel date for unclaimed
        // Database has useCurrent() default, so we can't use null
        if (!$model->student_id) {
            // Use a sentinel date (2000-01-01) for unclaimed parcels
            $model->report_at = \Carbon\Carbon::parse('2000-01-01 00:00:00');
        } elseif ($model->student_id && !$model->report_at) {
            $model->report_at = now();
        }
    });
    
    // Auto-populate recipient fields when student_id is set
    static::saving(function ($model) {
        // Only populate if student_id is set and recipient_name is not explicitly set
        // or if student_id has changed
        if ($model->student_id && ($model->isDirty('student_id') || !$model->recipient_name)) {
            $student = \App\Models\User::find($model->student_id);
            if ($student) {
                $model->recipient_name = $student->name;
                $model->recipient_matric = $student->matric;
                
                // If student_id is being set for the first time (was null before)
                // and report_at is null or sentinel date, set it to now (this is a claim event)
                $sentinelDate = \Carbon\Carbon::parse('2000-01-01');
                $isSentinel = $model->report_at && $model->report_at->equalTo($sentinelDate);
                
                if ($model->isDirty('student_id') && $model->getOriginal('student_id') === null && (!$model->report_at || $isSentinel)) {
                    $model->report_at = now();
                }
            }
        }
    });
}
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

    /**
     * Accessor: Always return sender in uppercase.
     */
    public function getSenderAttribute($value)
    {
        return strtoupper((string) $value);
    }

    /**
     * Mutator: Always save sender in uppercase.
     */
    public function setSenderAttribute($value)
    {
        $this->attributes['sender'] = strtoupper((string) $value);
    }

    /**
     * Accessor: Always return recipient_matric in uppercase.
     */
    public function getRecipientMatricAttribute($value)
    {
        return strtoupper((string) $value);
    }

    /**
     * Mutator: Always save recipient_matric in uppercase.
     */
    public function setRecipientMatricAttribute($value)
    {
        $this->attributes['recipient_matric'] = strtoupper((string) $value);
    }
}
