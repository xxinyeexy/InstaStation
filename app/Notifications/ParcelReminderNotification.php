<?php

namespace App\Notifications;

use App\Models\Parcel;
use Illuminate\Bus\Queueable;
use App\Models\Notification as DBNotification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ParcelReminderNotification extends Notification
{
    use Queueable;

    protected Parcel $parcel;

    public function __construct(Parcel $parcel)
    {
        $this->parcel = $parcel;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $parcel = $this->parcel;
        $parcelCode = $parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id;
        $collectionCode = $parcel->collection_code ?? null;

        $url = url('/student/parcel/' . $parcel->parcel_id);

        // Determine reminder count for this parcel to this student
        $previousCount = 0;
        try {
            $previousCount = DBNotification::where('notifiable_id', $notifiable->id)
                ->where('type', self::class)
                ->where('data->parcel_id', $parcel->parcel_id)
                ->count();
        } catch (\Throwable $e) {
            // Fallback: ignore counting issues
            $previousCount = 0;
        }

        $reminderNumber = $previousCount + 1; // number for this send
        $ordinal = match ($reminderNumber) {
            1 => 'First Reminder',
            2 => 'Second Reminder',
            3 => 'Third Reminder',
            default => $reminderNumber . 'th Reminder',
        };

        // Prepare view variables
        $scheduled = null;
        if (!empty($parcel->schedule)) {
            try {
                $scheduled = \Carbon\Carbon::parse($parcel->schedule)->format('d/m/Y (D)');
            } catch (\Throwable $e) {
                $scheduled = null;
            }
        }

        return (new MailMessage)
            ->subject($ordinal . ': Parcel Ready for Collection (' . $parcelCode . ')')
            ->view('emails.parcel-reminder', [
                'ordinal' => $ordinal,
                'studentName' => $notifiable->name ?? '',
                'parcelCode' => $parcelCode,
                'collectionCode' => $collectionCode,
                'status' => $parcel->parcel_status ?? 'N/A',
                'scheduled' => $scheduled,
                'timeSlot' => $parcel->time_slot ?? '',
                'actionUrl' => $url,
            ]);
    }

    public function toDatabase($notifiable)
    {
        $parcel = $this->parcel;
        $parcelCode = $parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id;

        // Compute and store reminder number for reference
        $previousCount = 0;
        try {
            $previousCount = DBNotification::where('notifiable_id', $notifiable->id)
                ->where('type', self::class)
                ->where('data->parcel_id', $parcel->parcel_id)
                ->count();
        } catch (\Throwable $e) {
            $previousCount = 0;
        }

        return [
            'title' => 'Parcel Reminder',
            'message' => "Your parcel ({$parcelCode}) is ready for collection. Please collect it as soon as possible.",
            'parcel_code' => $parcelCode,
            'parcel_id' => $parcel->parcel_id,
            'reminder_number' => $previousCount + 1,
            'sent_at' => now()->toDateTimeString(),
        ];
    }
}
