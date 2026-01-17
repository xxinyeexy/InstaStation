<?php

namespace App\Models;

use App\Notifications\CustomVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'matric',
        'department',
        'phone_no',
        'room_no',
        'profile_pic',
        'has_completed_tour',
    ];
    public function staff()
    {
        return $this->hasOne(Staff::class, 'user_id');
    }
    public function parcels()
    {
        return $this->hasMany(Parcel::class, 'student_id');
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'has_completed_tour' => 'boolean',
        ];
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new CustomVerifyEmail);
    }

    /**
     * Accessor: Always return matric in uppercase.
     */
    public function getMatricAttribute($value)
    {
        return strtoupper((string) $value);
    }

    /**
     * Mutator: Always save matric in uppercase.
     */
    public function setMatricAttribute($value)
    {
        $this->attributes['matric'] = strtoupper((string) $value);
    }
}
