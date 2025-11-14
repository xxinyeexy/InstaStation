<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Sample of recent parcels:\n";
echo str_repeat('-', 80) . "\n";

$parcels = \App\Models\Parcel::orderBy('created_at', 'desc')->limit(5)->get();

foreach ($parcels as $parcel) {
    echo "Created: " . $parcel->created_at->format('Y-m-d H:i') . 
         " | Updated: " . $parcel->updated_at->format('Y-m-d H:i') . 
         " | Status: " . $parcel->parcel_status . "\n";
}

echo "\nParcels by creation date:\n";
echo str_repeat('-', 80) . "\n";

$stats = \App\Models\Parcel::selectRaw('DATE(created_at) as date, COUNT(*) as count')
    ->groupBy('date')
    ->orderBy('date', 'desc')
    ->limit(10)
    ->get();

foreach ($stats as $stat) {
    echo $stat->date . ': ' . $stat->count . ' parcels\n';
}

echo "\nCollected parcels by update date:\n";
echo str_repeat('-', 80) . "\n";

$collected = \App\Models\Parcel::selectRaw('DATE(updated_at) as date, COUNT(*) as count')
    ->whereRaw("lower(parcel_status) = 'collected'")
    ->groupBy('date')
    ->orderBy('date', 'desc')
    ->limit(10)
    ->get();

foreach ($collected as $c) {
    echo $c->date . ': ' . $c->count . ' parcels collected\n';
}
