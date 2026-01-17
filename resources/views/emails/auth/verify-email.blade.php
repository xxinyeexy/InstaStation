<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
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
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi! {{ strtoupper($name) }}
                            </h2>

                            <p style="font-size: 16px; color: #4b5563; margin: 0 0 30px 0;">
                                You're almost done! Just click the button below to verify your email address.
                            </p>

                            <!-- Verify Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $verificationUrl }}"
                                            style="display: inline-block; background-color: #FF13A0; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 19, 160, 0.3);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px;">
                                Regards,<br>
                                UMPSA Parcel Centre
                            </p>

                            <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0;">
                                If you did not create an account, no further action is required.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                If you're having trouble clicking the "Verify Email Address" button, copy and paste the
                                URL below into your web browser:
                            </p>
                            <p
                                style="margin: 10px 0 0 0; word-break: break-all; color: #6b7280; font-size: 12px; text-align: center;">
                                <a href="{{ $verificationUrl }}"
                                    style="color: #FF13A0; text-decoration: none;">{{ $verificationUrl }}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
