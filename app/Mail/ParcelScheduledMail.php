<?php

namespace App\Mail;

use App\Models\Parcel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\URL;

class ParcelScheduledMail extends Mailable
{
    use Queueable, SerializesModels;

    public $parcel;
    public $parcelCode;
    public $scheduledDate;
    public $timeSlot;
    public $scheduleDetails;
    public $collectionCode;
    public $studentName;
    public $qrCodePath;
    public $qrCodeBase64;
    public $qrCodeMime;
    public $qrCodeUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Parcel $parcel, $studentName)
    {
        $this->parcel = $parcel;
        $this->studentName = strtoupper($studentName);
        $this->parcelCode = $parcel->parcel_code ?? $parcel->tracking_no ?? $parcel->parcel_id;
        $this->collectionCode = $parcel->collection_code ?? 'N/A';

        $this->scheduledDate = $parcel->schedule
            ? \Carbon\Carbon::parse($parcel->schedule)->format('d/m/Y (D)')
            : 'Not set';

        $this->timeSlot = $parcel->time_slot ?? 'Not set';

        $this->scheduleDetails = $this->scheduledDate;
        if ($parcel->time_slot) {
            $this->scheduleDetails .= ' from ' . $parcel->time_slot;
        }

        // Get QR code path and convert to base64
        if ($parcel->qr_code && Storage::disk('public')->exists($parcel->qr_code)) {
            $this->qrCodePath = Storage::disk('public')->path($parcel->qr_code);
            $this->qrCodeMime = File::mimeType($this->qrCodePath) ?: 'image/png';

            // Read QR code and convert to base64 for inline display
            $qrContent = Storage::disk('public')->get($parcel->qr_code);
            $this->qrCodeBase64 = base64_encode($qrContent);

            // Public absolute URL for email clients (preferred for Gmail)
            try {
                $relativeUrl = Storage::url($parcel->qr_code); // e.g., /storage/qrcodes/qr_xxx.png
                $this->qrCodeUrl = URL::to($relativeUrl);
            } catch (\Exception $e) {
                $this->qrCodeUrl = null;
            }
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Parcel ' . $this->parcelCode . ' Available!',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.parcel-scheduled-mail',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        // No attachments — per requirement, show QR inside email only
        return [];
    }
}
