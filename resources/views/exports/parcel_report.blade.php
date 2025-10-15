<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Parcel Report</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #111;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h1 {
            margin: 0;
            font-size: 20px;
        }

        .meta {
            margin-bottom: 12px;
        }

        .meta div {
            margin: 2px 0;
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
        }

        .section-title {
            margin-top: 18px;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Official Parcel Collection Receipt</h1>
        <div>This receipt is computer generated and no signature is required.</div>
    </div>

    <div class="meta">
        <div><strong>Parcel Code:</strong> {{ $parcel->parcel_code ?? '-' }}</div>
        <div><strong>Tracking No:</strong> {{ $parcel->tracking_no ?? '-' }}</div>
        <div><strong>Status:</strong> {{ $parcel->parcel_status ?? '-' }}</div>
        <div><strong>Collected Date:</strong> {{ optional($parcel->schedule)->format('Y-m-d') }}</div>
    </div>

    <div class="section-title">Student</div>
    <table>
        <tr>
            <th>Name</th>
            <td>{{ $student->name ?? '-' }}</td>
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
        
    </table>

    <div class="section-title">Payment</div>
    <table>
        <tr>
            <th>Service Fee</th>
            <td>
                @php $fee = $parcel->fee ?? ($payment->amount ?? 1.00); @endphp
                RM{{ number_format($fee, 2) }}
            </td>
        </tr>
        <tr>
            <th>Payment Status</th>
            <td>{{ $payment && $payment->verified_by ? 'Verified' : 'Pending/Unverified' }}</td>
        </tr>
    </table>

    <p style="margin-top: 20px;">Thank you.</p>
</body>

</html>

<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Parcel Report - {{ $parcel->parcel_code ?? $parcel->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #222;
        }

        .header {
            margin-bottom: 10px;
        }

        .section {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 16px;
        }

        .row {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 6px;
        }

        .col {
            flex: 1 1 200px;
            margin-right: 16px;
        }

        .label {
            font-size: 13px;
            color: #555;
        }

        .value {
            font-size: 15px;
            font-weight: 500;
        }

        .footer {
            font-size: 12px;
            color: #888;
            margin-top: 24px;
        }

        .icon {
            margin-right: 4px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>Parcel Report - {{ $parcel->parcel_code ?? $parcel->id }}</h2>
        <div style="font-size:13px;color:#888;">Detailed report for parcel {{ $parcel->parcel_code ?? $parcel->id }}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Parcel Information</div>
        <div class="row">
            <div class="col"><span class="label">Parcel ID:</span> <span
                    class="value">{{ $parcel->parcel_code ?? $parcel->id }}</span></div>
            <div class="col"><span class="label">Recipient:</span> <span
                    class="value">{{ $parcel->user->name ?? '-' }}</span></div>
        </div>
        <div class="row">
            <div class="col"><span class="label">Tracking ID:</span> <span
                    class="value">{{ $parcel->tracking_no ?? '-' }}</span></div>
            <div class="col"><span class="label">Matric ID:</span> <span
                    class="value">{{ $parcel->user->matric ?? '-' }}</span></div>
        </div>
        <div class="row">
            <div class="col"><span class="label">Arrival Date:</span> <span
                    class="value">{{ $parcel->created_at ? $parcel->created_at->toDateString() : '-' }}</span></div>
            <div class="col"><span class="label">Location:</span> <span
                    class="value">{{ $parcel->location ?? '-' }}</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Package Details</div>
        <div>Sender: {{ $parcel->sender ?? '-' }}</div>
        <div>Size: {{ $parcel->size ?? '-' }}</div>
    </div>

    <div class="section">
        <div class="section-title">Payment Information</div>
        <div>Payment Status: {{ $parcel->payment->status ?? 'Approved' }}</div>
        <div>Amount: RM{{ number_format($parcel->fee ?? 1.0, 2) }}</div>
    </div>

    <div class="section">
        <div class="section-title">Collection Information</div>
        <div>Collection Date: {{ $parcel->schedule ? \Carbon\Carbon::parse($parcel->schedule)->toDateString() : '-' }}
        </div>
        <div>Collection Status: {{ ucfirst($parcel->parcel_status ?? 'Collected') }}</div>
    </div>

    <div class="footer">
        Report generated on {{ now()->format('n/j/Y \a\t g:i:s A') }}
    </div>
</body>

</html>
