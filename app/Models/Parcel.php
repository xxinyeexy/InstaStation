<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Parcel extends Model
{
    protected $fillable = [
    'tracking_number',
    'sender',
    'size',
    'location',
    'student_name',
    'matric_id',
];
    use HasFactory;
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(Staff::class, 'created_by');
    }

    public function lastEditedBy()
    {
        return $this->belongsTo(Staff::class, 'last_edited_by');
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
