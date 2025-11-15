<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parcel Scheduled</title>
</head>

<body
    style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f3f4f6; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                    style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
                    <!-- Header -->
                    <tr>
                        <td
                            style="background: linear-gradient(135deg, #FF13A0 0%, #269850 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">InstaStation</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi! {{ $studentName }}
                            </h2>

                            <p style="font-size: 16px; color: #4b5563; margin: 0 0 20px 0;">
                                Your parcel <strong>{{ $parcelCode }}</strong> is now available at <strong>UMPSA
                                    Parcel Centre</strong>.
                            </p>

                            <p style="font-size: 16px; color: #4b5563; margin: 0 0 30px 0;">
                                Please collect it today <strong>{{ $scheduleDetails }}</strong>. Thank you.
                            </p>

                            <h3 style="color: #4b5563; font-size: 18px; margin: 30px 0 20px 0; text-align: center;">
                                Please show this QR Code to the staff upon collection.
                            </h3>

                            @if (!empty($qrCodeBase64))
                                <!-- QR Code Section: Inline base64 image (no attachment, works in most email clients) -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center"
                                            style="padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                                            <div style="display: inline-block; background: #fef3c7; padding: 20px;">
                                                <img src="data:{{ $qrCodeMime ?? 'image/png' }};base64,{{ $qrCodeBase64 }}"
                                                    alt="QR Code: {{ $parcelCode }}" width="300" height="300"
                                                    style="display: block; width: 300px; height: 300px; max-width: 300px; border: 0;" />
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            @elseif (!empty($qrCodeUrl))
                                <!-- Fallback: Hosted URL (if CID and base64 not available) -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center"
                                            style="padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                                            <div style="display: inline-block; background: #fef3c7; padding: 20px;">
                                                <img src="{{ $qrCodeUrl }}" alt="QR Code: {{ $collectionCode }}"
                                                    width="300" height="300"
                                                    style="display: block; width: 300px; height: 300px; max-width: 300px; border: 0;" />
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            @else
                                <!-- Fallback if QR code not available -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center"
                                            style="padding: 20px; background-color: #fee2e2; border: 2px solid #ef4444; border-radius: 8px;">
                                            <p style="margin: 0; color: #991b1b; font-weight: bold;">QR Code could not
                                                be generated. Please use the collection code below.</p>
                                        </td>
                                    </tr>
                                </table>
                            @endif

                            <!-- Collection Code -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center"
                                        style="padding: 20px; background-color: #fef3c7; border: 3px solid #fbbf24; border-radius: 12px;">
                                        <p
                                            style="margin: 0; font-size: 24px; font-weight: bold; color: #78350f; letter-spacing: 3px;">
                                            Collection Code: {{ $collectionCode }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size: 16px; color: #4b5563; margin: 30px 0 10px 0;">
                                Regards,<br>
                                UMPSA Parcel Centre
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Powered by InstaStation
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
