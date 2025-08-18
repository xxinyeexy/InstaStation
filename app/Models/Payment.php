<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class Payment extends Model
{
    use HasFactory;
    protected $primaryKey = 'payment_id';
    protected $fillable = [
        'parcel_id',
        'payment',
        'file_path',
        'verified_by',
        'payment_date',
    ];
    public function parcel()
    {
        return $this->belongsTo(Parcel::class, 'parcel_id');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(Staff::class, 'verified_by');
    }
}
