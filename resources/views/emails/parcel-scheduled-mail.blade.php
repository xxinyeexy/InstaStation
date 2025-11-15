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

                            <!-- QR Code Section Header -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0 20px 0;">
                                <tr>
                                    <td align="center">
                                        <div
                                            style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px 24px; border-radius: 50px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                                            <h3
                                                style="color: #ffffff; font-size: 16px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
                                                📱 Scan QR Code for Collection
                                            </h3>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            @if (!empty($qrCodeBase64))
                                <!-- QR Code Section: Premium Design with Decorative Frame -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center" style="padding: 0;">
                                            <!-- Outer decorative frame -->
                                            <table cellpadding="0" cellspacing="0"
                                                style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%); border-radius: 20px; padding: 8px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.25);">
                                                <tr>
                                                    <td style="background: #ffffff; border-radius: 16px; padding: 6px;">
                                                        <!-- Inner frame with gradient border effect -->
                                                        <table cellpadding="0" cellspacing="0"
                                                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 14px; padding: 4px;">
                                                            <tr>
                                                                <td align="center"
                                                                    style="background: #ffffff; border-radius: 12px; padding: 24px;">
                                                                    <!-- QR Code Image with shadow effect -->
                                                                    <div
                                                                        style="display: inline-block; background: #ffffff; padding: 16px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 0 0 2px #f3f4f6;">
                                                                        <img src="data:{{ $qrCodeMime ?? 'image/png' }};base64,{{ $qrCodeBase64 }}"
                                                                            alt="QR Code: {{ $parcelCode }}"
                                                                            width="280" height="280"
                                                                            style="display: block; width: 280px; height: 280px; max-width: 280px; border: 0; border-radius: 8px;" />
                                                                    </div>
                                                                    <!-- Parcel Code Label -->
                                                                    <div
                                                                        style="margin-top: 16px; padding: 8px 16px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 8px; display: inline-block;">
                                                                        <p
                                                                            style="margin: 0; font-size: 14px; font-weight: 600; color: #4b5563; letter-spacing: 1px; font-family: 'Courier New', monospace;">
                                                                            {{ $parcelCode }}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            @elseif (!empty($qrCodeUrl))
                                <!-- Fallback: Hosted URL with same premium design -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center" style="padding: 0;">
                                            <table cellpadding="0" cellspacing="0"
                                                style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%); border-radius: 20px; padding: 8px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.25);">
                                                <tr>
                                                    <td style="background: #ffffff; border-radius: 16px; padding: 6px;">
                                                        <table cellpadding="0" cellspacing="0"
                                                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 14px; padding: 4px;">
                                                            <tr>
                                                                <td align="center"
                                                                    style="background: #ffffff; border-radius: 12px; padding: 24px;">
                                                                    <div
                                                                        style="display: inline-block; background: #ffffff; padding: 16px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 0 0 2px #f3f4f6;">
                                                                        <img src="{{ $qrCodeUrl }}"
                                                                            alt="QR Code: {{ $collectionCode }}"
                                                                            width="280" height="280"
                                                                            style="display: block; width: 280px; height: 280px; max-width: 280px; border: 0; border-radius: 8px;" />
                                                                    </div>
                                                                    <div
                                                                        style="margin-top: 16px; padding: 8px 16px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 8px; display: inline-block;">
                                                                        <p
                                                                            style="margin: 0; font-size: 14px; font-weight: 600; color: #4b5563; letter-spacing: 1px; font-family: 'Courier New', monospace;">
                                                                            {{ $parcelCode }}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
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

                            <!-- Collection Code - Enhanced Design -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0 30px 0;">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <!-- Premium badge design -->
                                        <table cellpadding="0" cellspacing="0"
                                            style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 16px; padding: 6px; box-shadow: 0 6px 20px rgba(251, 191, 36, 0.35);">
                                            <tr>
                                                <td
                                                    style="background: #ffffff; border-radius: 12px; padding: 20px 32px;">
                                                    <div style="text-align: center;">
                                                        <p
                                                            style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 1.5px;">
                                                            Collection Code
                                                        </p>
                                                        <p
                                                            style="margin: 0; font-size: 32px; font-weight: 800; color: #78350f; letter-spacing: 4px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(120, 53, 15, 0.1);">
                                                            {{ $collectionCode }}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
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
