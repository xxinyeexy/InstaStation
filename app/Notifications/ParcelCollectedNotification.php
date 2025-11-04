<?php

namespace App\Notifications;

use App\Models\Parcel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Barryvdh\DomPDF\Facade\Pdf;

class ParcelCollectedNotification extends Notification
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
        $parcel = $this->parcel->load(['studentUser', 'payment', 'createdBy', 'lastEditedBy']);
        $parcelCode = $parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id;

        // Generate PDF receipt
        $pdf = Pdf::loadView('exports.parcel_report', [
            'parcel' => $parcel,
            'student' => $parcel->studentUser,
            'payment' => $parcel->payment,
        ]);

        $pdfContent = $pdf->output();
        $pdfFileName = 'eReceipt_' . ($parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id) . '.pdf';

        $collectedDate = $parcel->updated_at ? $parcel->updated_at->format('d/m/Y h:i A') : now()->format('d/m/Y h:i A');

        // Get the staff member who collected the parcel
        $staffName = $parcel->lastEditedBy ? strtoupper($parcel->lastEditedBy->name) : 'ZAIRY';

        return (new MailMessage)
            ->subject('Parcel ' . $parcelCode . ' has been Collected!')
            ->greeting('Hi! ' . strtoupper($notifiable->name ?? '') . ',')
            ->line('Your parcel **' . $parcelCode . '** has been successfully collected from **' . $staffName . '** on **' . $collectedDate . '**.')
            ->line('Attached to this email is a receipt for the Parcel Service Fee. Thank you.')
            ->line('')
            ->line('Best regards,  ')
            ->line('**' . $staffName . '** from UMPSA Parcel Centre')
            ->attachData($pdfContent, $pdfFileName, [
                'mime' => 'application/pdf',
            ]);
    }

    public function toDatabase($notifiable)
    {
        $parcel = $this->parcel;
        $parcelCode = $parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id;

        return [
            'title' => 'Parcel Collected',
            'message' => "Your parcel ({$parcelCode}) has been successfully collected. Check your email for the receipt.",
            'parcel_code' => $parcelCode,
            'parcel_id' => $parcel->parcel_id,
            'collected_at' => now()->toDateTimeString(),
        ];
    }
}
