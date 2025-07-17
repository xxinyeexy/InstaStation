<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Staff extends Model
{
    use HasFactory;
    public function createdParcels()
    {
        return $this->hasMany(Parcel::class, 'created_by');
    }

    public function editedParcels()
    {
        return $this->hasMany(Parcel::class, 'last_edited_by');
    }

    public function verifiedPayments()
    {
        return $this->hasMany(Payment::class, 'verified_by');
    }

    public function notifications()
    {
        return $this->morphMany(Notification::class, 'notifiable');
    }
}
