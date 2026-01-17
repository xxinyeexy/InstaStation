<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Parcel Reminder</title>
</head>

<body
    style="margin:0;padding:0;background:#f5f7fa;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fa;padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0"
                    style="width:600px;max-width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <tr>
                        <td
                            style="background:linear-gradient(135deg,#FF13A0 0%,#269850 100%);padding:30px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:0.5px;">
                                InstaStation</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 40px;font-size:15px;line-height:1.6;color:#333333;">
                            <p style="margin:0 0 16px 0;font-size:18px;font-weight:600;">
                                {{ $greeting ?? 'Hello ' . ($studentName ?? '') }}</p>
                            <p style="margin:0 0 12px 0;">This is your <strong>{{ $ordinal ?? 'Reminder' }}</strong>
                                that parcel <strong>{{ $parcelCode }}</strong> is ready for collection.</p>
                            @if (!empty($scheduled))
                                <p style="margin:0 0 12px 0;">Scheduled collection: <strong>{{ $scheduled }}</strong>
                                    @if (!empty($timeSlot))
                                        ({{ $timeSlot }})
                                    @endif
                                </p>
                            @endif
                            @if (!empty($collectionCode))
                                <p style="margin:0 0 12px 0;">Collection Code: <strong>{{ $collectionCode }}</strong>
                                </p>
                            @endif
                            <p style="margin:0 0 20px 0;">Please collect it as soon as possible to avoid delays.</p>

                            <p style="margin:24px 0 0 0;">
                                Regards,<br>
                                UMPSA Parcel Centre
                            </p>

                            <p style="margin:24px 0 0 0;font-size:13px;color:#666;">If you have already collected the
                                parcel, you can ignore this email.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f0f2f6;padding:20px;text-align:center;font-size:12px;color:#6b7280;">
                            &copy; {{ date('Y') }} InstaStation. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
