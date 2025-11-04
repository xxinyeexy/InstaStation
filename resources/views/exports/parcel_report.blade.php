<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Parcel Collection Receipt</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #111;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }

        .header h1 {
            margin: 0;
            font-size: 20px;
            color: #2d3748;
        }

        .header p {
            margin: 5px 0 0 0;
            font-size: 11px;
            color: #666;
        }

        .meta {
            margin-bottom: 15px;
            background: #f7fafc;
            padding: 12px;
            border-radius: 5px;
        }

        .meta div {
            margin: 4px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
        }

        th {
            background: #f2f2f2;
            font-weight: bold;
        }

        .section-title {
            margin-top: 18px;
            font-weight: bold;
            font-size: 14px;
            color: #2d3748;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #888;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        }

        .highlight {
            background: #d4edda;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Official Parcel Collection Receipt</h1>
        <p> UNIVERSITI MALAYSIA PAHANG AL-SULTAN ABDULLAH </p>
        <p style="font-size: 10px;">This receipt is computer generated and no signature is required.</p>
    </div>

    <div class="meta">
        <div><strong>Parcel Code:</strong> <span class="highlight">{{ $parcel->parcel_code ?? '-' }}</span></div>
        <div><strong>Tracking No:</strong> {{ $parcel->tracking_no ?? '-' }}</div>
        <div><strong>Status:</strong> <span
                style="color: #38a169; font-weight: bold;">{{ $parcel->parcel_status ?? '-' }}</span></div>
        <div><strong>Collection Date:</strong>
            {{ $parcel->updated_at ? $parcel->updated_at->format('d/m/Y h:i A') : '-' }}</div>
    </div>

    <div class="section-title">Student Information</div>
    <table>
        <tr>
            <th>Name</th>
            <td>{{ strtoupper($student->name ?? '-') }}</td>
        </tr>
        <tr>
            <th>Matric ID</th>
            <td>{{ $student->matric ?? '-' }}</td>
        </tr>
        <tr>
            <th>Email Address</th>
            <td>{{ $student->email ?? '-' }}</td>
        </tr>
    </table>

    <div class="section-title">Parcel Details</div>
    <table>
        <tr>
            <th>Sender</th>
            <td>{{ $parcel->sender ?? '-' }}</td>
        </tr>
        <tr>
            <th>Size / Dimensions</th>
            <td>{{ $parcel->size ?? '-' }}</td>
        </tr>
        <tr>
            <th>Location</th>
            <td>{{ $parcel->location ?? '-' }}</td>
        </tr>
        <tr>
            <th>Collection Code</th>
            <td>{{ $parcel->collection_code ?? '-' }}</td>
        </tr>
    </table>

    <div class="section-title">Payment Information</div>
    <table>
        <tr>
            <th>Service Fee</th>
            <td>
                <strong style="color: #38a169;">RM 1.00</strong>
            </td>
        </tr>
        <tr>
            <th>Payment Status</th>
            <td>{{ $payment && $payment->verified_by ? 'Verified' : 'Paid' }}</td>
        </tr>
        @if ($payment && $payment->payment_date)
            <tr>
                <th>Payment Date</th>
                <td>{{ \Carbon\Carbon::parse($payment->payment_date)->format('d/m/Y') }}</td>
            </tr>
        @endif
    </table>

    <div class="footer">
        <p><strong>Thank you for using our parcel collection service.</strong></p>
        <p>© {{ date('Y') }} UMPSA Parcel Centre. All rights reserved.</p>
        <p>Powered by InstaStation</p>
    </div>
</body>

</html>
