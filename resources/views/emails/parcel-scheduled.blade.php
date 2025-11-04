@component('mail::message')
# Hi! {{ $studentName }} ,

Your parcel **{{ $parcelCode }}** is now available at **Parcel Center UMPSA**.

Please collect it today **{{ $scheduleDetails }}**. Thank you.

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
    <tr>
        <td style="text-align: center;">
            <h2 style="color: #4b5563; font-size: 18px; margin-bottom: 20px;">Please show this QR Code to the staff upon collection.</h2>
        </td>
    </tr>
</table>

@if($qrCodeCid)
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td style="text-align: center; padding: 20px; background-color: #f9fafb;">
            <div style="display: inline-block; border: 3px solid #d1d5db; border-radius: 12px; padding: 20px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <img src="cid:{{ $qrCodeCid }}" 
                     alt="QR Code: {{ $collectionCode }}" 
                     width="300" 
                     height="300"
                     style="display: block; max-width: 300px; width: 100%; height: auto;" />
            </div>
        </td>
    </tr>
</table>
@else
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td style="text-align: center; padding: 20px; background-color: #fee2e2; border: 2px solid #ef4444; border-radius: 8px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">QR Code could not be generated. Please use the collection code below.</p>
        </td>
    </tr>
</table>
@endif

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
    <tr>
        <td style="text-align: center; padding: 20px; background-color: #fef3c7; border: 3px solid #fbbf24; border-radius: 12px;">
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #78350f; letter-spacing: 3px;">
                Collection Code: {{ $collectionCode }}
            </p>
        </td>
    </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
    <tr>
        <td style="padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Note:</strong> If you cannot view the QR code above, please show the collection code to the staff. The QR code is also attached as a separate file in this email.
            </p>
        </td>
    </tr>
</table>

Thanks,<br>
**ZAIRY** from Parcel Center UMPSA

<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
    Powered by InstaStation
</div>
@endcomponent
