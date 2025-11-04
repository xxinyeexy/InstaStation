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
            
            // Read QR code and convert to base64 for inline display
            $qrContent = Storage::disk('public')->get($parcel->qr_code);
            $this->qrCodeBase64 = base64_encode($qrContent);
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
        // No attachments - QR code is embedded inline only
        return [];
    }
}
