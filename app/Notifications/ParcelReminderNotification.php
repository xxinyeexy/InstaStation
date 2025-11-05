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

        $mail = (new MailMessage)
            ->subject($ordinal . ': Parcel Ready for Collection (' . $parcelCode . ')')
            ->greeting('Hello ' . ($notifiable->name ?? ''))
            ->line("This is a reminder that your parcel ({$parcelCode}) is awaiting collection.")
            ->line('Location: ' . ($parcel->location ?? 'N/A'))
            ->line('Status: ' . ($parcel->parcel_status ?? 'N/A'));

        // Include schedule/time slot details if available
        if (!empty($parcel->schedule)) {
            try {
                $date = \Carbon\Carbon::parse($parcel->schedule)->format('d/m/Y (D)');
                $slot = $parcel->time_slot ? ' from ' . $parcel->time_slot : '';
                $mail->line('Scheduled collection: ' . $date . $slot);
            } catch (\Throwable $e) {
                // ignore parse errors
            }
        }

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
