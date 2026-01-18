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
     * Boot method to handle user deletion
     */
    protected static function boot()
    {
        parent::boot();

        // Before a user is deleted, check and preserve information
        static::deleting(function ($user) {
            // For staff/admin: PREVENT deletion if they have created or edited parcels
            // This ensures staff names remain in the system
            if (in_array($user->type, ['staff', 'admin'])) {
                $createdCount = \App\Models\Parcel::where('created_by', $user->id)->count();
                $editedCount = \App\Models\Parcel::where('last_edited_by', $user->id)->count();
                
                if ($createdCount > 0 || $editedCount > 0) {
                    throw new \Exception(
                        "Cannot delete this staff member. They have created {$createdCount} parcel(s) " .
                        "and edited {$editedCount} parcel(s). Please reassign these parcels first or " .
                        "deactivate the account instead of deleting it."
                    );
                }
            }
            
            // For students: preserve their name and matric in parcel records
            if ($user->type === 'student') {
                // ALWAYS update recipient info for all parcels belonging to this student
                // This ensures the name is preserved even if it was set before
                \App\Models\Parcel::where('student_id', $user->id)
                    ->update([
                        'recipient_name' => $user->name,
                        'recipient_matric' => $user->matric
                    ]);
            }
        });
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
