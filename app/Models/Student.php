<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;


class Student extends Model
{
    use HasFactory;

    /**
     * Get the user associated with this student
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    public function parcels()
    {

        return $this->hasMany(Parcel::class, 'student_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'student_id');
    }

    public function notifications()
    {
        return $this->morphMany(Notification::class, 'notifiable');
    }
}
