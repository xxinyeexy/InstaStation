<?php

namespace App\Notifications;

use App\Mail\ParcelScheduledMail;
use App\Models\Parcel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ParcelScheduledNotification extends Notification
{
    use Queueable;

    protected Parcel $parcel;

    public function __construct(Parcel $parcel)
    {
        $this->parcel = $parcel;
    }

    public function via($notifiable)
    {
        // Send email using Mailable, only use database for notification
        if ($notifiable->email) {
            try {
                Mail::to($notifiable->email)->send(
                    new ParcelScheduledMail($this->parcel, $notifiable->name ?? 'Student')
                );
                
                Log::info('Parcel scheduled email sent via Mailable', [
                    'parcel_id' => $this->parcel->parcel_id,
                    'recipient' => $notifiable->email
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send parcel scheduled email', [
                    'parcel_id' => $this->parcel->parcel_id,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        return ['database'];
    }

    public function toMail($notifiable)
    {
        // This won't be called anymore since we removed 'mail' from via()
        // Keeping it here for backward compatibility
        return null;
    }

    public function toDatabase($notifiable)
    {
        $parcel = $this->parcel;
        $parcelCode = $parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id;
        
        $scheduledDate = $parcel->schedule 
            ? \Carbon\Carbon::parse($parcel->schedule)->format('d/m/Y') 
            : 'Not set';

        return [
            'title' => 'Parcel Ready for Collection',
            'message' => "Your parcel ({$parcelCode}) is scheduled for pickup on {$scheduledDate}. Check your email for the QR code.",
            'parcel_code' => $parcelCode,
            'parcel_id' => $parcel->parcel_id,
            'scheduled_at' => $parcel->schedule,
            'collection_code' => $parcel->collection_code,
        ];
    }
}
