<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Report extends Model
{
    use HasFactory;
    public function parcel()
    {
        return $this->belongsTo(Parcel::class, 'parcel_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
