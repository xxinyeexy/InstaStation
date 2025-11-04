<?php

namespace App\Notifications;

use App\Models\Parcel;
use Illuminate\Bus\Queueable;
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

        $mail = (new MailMessage)
            ->subject('Reminder: Parcel Ready for Collection')
            ->greeting('Hello ' . ($notifiable->name ?? ''))
            ->line("This is a reminder that your parcel ({$parcelCode}) is awaiting collection.")
            ->line('Location: ' . ($parcel->location ?? 'N/A'))
            ->line('Status: ' . ($parcel->parcel_status ?? 'N/A'));

        if ($collectionCode) {
            $mail->line('Collection Code: ' . $collectionCode);
        }

        $mail->action('View Parcel', $url)
            ->line('If you have already collected the parcel, please ignore this message.');

        return $mail;
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
            'sent_at' => now()->toDateTimeString(),
        ];
    }
}
