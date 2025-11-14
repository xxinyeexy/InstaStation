<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

echo "Current week data:\n";
echo "Today is: " . now()->format('Y-m-d (l)') . "\n";
echo "Week starts: " . now()->startOfWeek()->format('Y-m-d (l)') . "\n\n";

for ($i = 0; $i < 7; $i++) {
    $date = now()->startOfWeek()->addDays($i);
    
    $arrivals = \App\Models\Parcel::whereDate('created_at', $date)->count();
    $collected = \App\Models\Parcel::whereDate('updated_at', $date)
        ->whereRaw("lower(parcel_status) = 'collected'")
        ->count();
    
    echo $days[$i] . ' (' . $date->format('Y-m-d') . '): ' . $arrivals . ' arrivals, ' . $collected . ' collected' . "\n";
}
