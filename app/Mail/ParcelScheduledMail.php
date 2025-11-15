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
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

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
    public $qrCodeBinary;
    public $qrCodeCid;
    public $embeddedQrCodeUrl;

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

        // Generate QR code on the fly if not exists, or use existing one
        // QR code contains only the parcel code
        $qrCodeData = $parcel->parcel_code ?? $parcel->tracking_no ?? (string)$parcel->parcel_id;

        // Generate a unique CID for the QR code image
        $this->qrCodeCid = 'qrcode-' . $parcel->parcel_id . '-' . time();

        try {
            // Try to use existing QR code file if it exists
            if ($parcel->qr_code && Storage::disk('public')->exists($parcel->qr_code)) {
                $this->qrCodePath = Storage::disk('public')->path($parcel->qr_code);
                $this->qrCodeMime = File::mimeType($this->qrCodePath) ?: 'image/png';

                // Read QR code binary data for embedded attachment
                $this->qrCodeBinary = Storage::disk('public')->get($parcel->qr_code);

                // Also keep base64 for fallback
                $this->qrCodeBase64 = base64_encode($this->qrCodeBinary);

                // Public absolute URL for email clients (preferred for Gmail)
                try {
                    $relativeUrl = Storage::url($parcel->qr_code);
                    $this->qrCodeUrl = URL::to($relativeUrl);
                } catch (\Exception $e) {
                    $this->qrCodeUrl = null;
                }
            } else {
                // Generate QR code on the fly as PNG (best email compatibility)
                try {
                    $this->qrCodeBinary = QrCode::format('png')
                        ->size(400)
                        ->margin(1)
                        ->errorCorrection('H')
                        ->generate($qrCodeData);

                    $this->qrCodeMime = 'image/png';
                    $this->qrCodeBase64 = base64_encode($this->qrCodeBinary);
                    $this->qrCodeUrl = null; // No URL for on-the-fly generated QR

                    Log::info('QR code generated on-the-fly for email', [
                        'parcel_id' => $parcel->parcel_id,
                        'collection_code' => $parcel->collection_code
                    ]);
                } catch (\Exception $e) {
                    // Fallback to SVG if PNG fails
                    try {
                        $this->qrCodeBinary = QrCode::format('svg')
                            ->size(400)
                            ->margin(1)
                            ->errorCorrection('H')
                            ->generate($qrCodeData);

                        $this->qrCodeMime = 'image/svg+xml';
                        $this->qrCodeBase64 = base64_encode($this->qrCodeBinary);
                        $this->qrCodeUrl = null;

                        Log::info('QR code generated as SVG for email', [
                            'parcel_id' => $parcel->parcel_id
                        ]);
                    } catch (\Exception $e2) {
                        Log::error('Failed to generate QR code for email', [
                            'parcel_id' => $parcel->parcel_id,
                            'error' => $e2->getMessage()
                        ]);
                        $this->qrCodeBinary = null;
                        $this->qrCodeBase64 = null;
                        $this->qrCodeUrl = null;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing QR code for email', [
                'parcel_id' => $parcel->parcel_id,
                'error' => $e->getMessage()
            ]);
            $this->qrCodeBinary = null;
            $this->qrCodeBase64 = null;
            $this->qrCodeUrl = null;
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
        $content = new Content(
            view: 'emails.parcel-scheduled-mail',
        );

        return $content->with([
            'embeddedQrCodeUrl' => $this->embeddedQrCodeUrl,
        ]);
    }

    /**
     * Build the message and embed the QR code.
     * This method is called by Laravel when sending the email.
     */
    public function build()
    {
        // Embed QR code as inline attachment if binary data is available
        if (!empty($this->qrCodeBinary)) {
            try {
                // Use embedData to create a CID attachment
                // This creates a Content-ID that can be referenced in the email HTML
                $this->embeddedQrCodeUrl = $this->embedData(
                    $this->qrCodeBinary,
                    'qrcode.png',
                    $this->qrCodeMime ?? 'image/png'
                );

                Log::info('QR code embedded in email', [
                    'parcel_id' => $this->parcel->parcel_id,
                    'parcel_code' => $this->parcelCode,
                    'embedded_url' => substr($this->embeddedQrCodeUrl, 0, 50) . '...'
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to embed QR code in email', [
                    'parcel_id' => $this->parcel->parcel_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $this->embeddedQrCodeUrl = null;
            }
        }

        return $this;
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        // No attachments - QR code will be embedded inline using embedData() in the view
        return [];
    }
}
