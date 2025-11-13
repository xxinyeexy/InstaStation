<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Parcels Export</title>
    <style>
        body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 11px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e5e5; padding: 6px 8px; }
        th { background: #f5f5f5; text-align: left; }
        tr:nth-child(even) td { background: #fafafa; }
    </style>
</head>
<body>
    <h1>Parcels Export</h1>
    <div class="meta">Generated at: {{ $generatedAt }}</div>
    <table>
        <thead>
            <tr>
                @foreach($columns as $col)
                    <th>{{ $col['label'] ?? $col['key'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    @foreach($columns as $col)
                        <td>{{ $row[$col['key']] ?? '' }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
