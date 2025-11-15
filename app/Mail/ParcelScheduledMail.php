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
            // Always generate QR code fresh to ensure it contains the parcel code
            // Generate QR code on the fly as PNG (best email compatibility)
            try {
                $this->qrCodeBinary = QrCode::format('png')
                    ->size(400)
                    ->margin(1)
                    ->errorCorrection('H')
                    ->generate($qrCodeData);

                $this->qrCodeMime = 'image/png';
                // Encode to base64 - ensure clean string without line breaks for email compatibility
                $this->qrCodeBase64 = base64_encode($this->qrCodeBinary);

                // Create a temporary file for embedding (required for $message->embed())
                $tempDir = sys_get_temp_dir();
                $tempFile = $tempDir . '/qrcode_' . $parcel->parcel_id . '_' . time() . '.png';

                if (file_put_contents($tempFile, $this->qrCodeBinary) !== false) {
                    $this->qrCodePath = $tempFile;
                    Log::info('QR code temp file created for email', [
                        'parcel_id' => $parcel->parcel_id,
                        'parcel_code' => $this->parcelCode,
                        'temp_file' => $tempFile
                    ]);
                } else {
                    Log::warning('Failed to create temp file for QR code', [
                        'parcel_id' => $parcel->parcel_id
                    ]);
                    $this->qrCodePath = null;
                }

                // Public absolute URL for email clients (fallback)
                try {
                    if ($parcel->qr_code && Storage::disk('public')->exists($parcel->qr_code)) {
                        $relativeUrl = Storage::url($parcel->qr_code);
                        $this->qrCodeUrl = URL::to($relativeUrl);
                    } else {
                        $this->qrCodeUrl = null;
                    }
                } catch (\Exception $e) {
                    $this->qrCodeUrl = null;
                }

                Log::info('QR code generated on-the-fly for email', [
                    'parcel_id' => $parcel->parcel_id,
                    'parcel_code' => $this->parcelCode,
                    'qr_data' => $qrCodeData
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
                    // Encode to base64 - ensure clean string without line breaks for email compatibility
                    $this->qrCodeBase64 = base64_encode($this->qrCodeBinary);

                    $tempDir = sys_get_temp_dir();
                    $tempFile = $tempDir . '/qrcode_' . $parcel->parcel_id . '_' . time() . '.svg';

                    if (file_put_contents($tempFile, $this->qrCodeBinary) !== false) {
                        $this->qrCodePath = $tempFile;
                    } else {
                        $this->qrCodePath = null;
                    }

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
                    $this->qrCodePath = null;
                    $this->qrCodeUrl = null;
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing QR code for email', [
                'parcel_id' => $parcel->parcel_id,
                'error' => $e->getMessage()
            ]);
            $this->qrCodeBinary = null;
            $this->qrCodeBase64 = null;
            $this->qrCodePath = null;
            $this->qrCodeUrl = null;
        }
    }

    /**
     * Build the message using the old-style approach for better compatibility.
     * No attachments - QR code is embedded inline using base64.
     */
    public function build()
    {
        // Set subject
        $this->subject('New Parcel ' . $this->parcelCode . ' Available!');

        // Return view - QR code will be displayed using base64 (no attachments)
        return $this->view('emails.parcel-scheduled-mail');
    }
}
