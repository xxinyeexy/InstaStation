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
    protected int $reminderNumber;

    public function __construct(Parcel $parcel, int $reminderNumber)
    {
        $this->parcel = $parcel;
        $this->reminderNumber = $reminderNumber;
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

        $ordinal = match ($this->reminderNumber) {
            1 => 'First Reminder',
            2 => 'Second Reminder',
            3 => 'Third Reminder',
            default => $this->reminderNumber . 'th Reminder',
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

        return [
            'title' => 'Parcel Reminder',
            'message' => "Your parcel ({$parcelCode}) is ready for collection. Please collect it as soon as possible.",
            'parcel_code' => $parcelCode,
            'parcel_id' => $parcel->parcel_id,
            'reminder_number' => $this->reminderNumber,
            'sent_at' => now()->toDateTimeString(),
        ];
    }
}
