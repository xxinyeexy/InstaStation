<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Parcel;
use Illuminate\Console\Command;

class CleanupOrphanedNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up orphaned payment rejection notifications for parcels that are already verified';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Cleaning up orphaned notifications...');

        // Get all payment rejection notifications
        $rejectionNotifications = Notification::where('type', 'payment_rejected')
            ->where('notifiable_type', 'App\Models\User')
            ->get();

        $cleanedCount = 0;

        foreach ($rejectionNotifications as $notification) {
            $data = json_decode($notification->data, true);
            $parcelId = $data['parcel_id'] ?? null;

            if ($parcelId) {
                // Check if the parcel exists and is already verified/approved
                $parcel = Parcel::find($parcelId);
                if ($parcel && in_array(strtolower($parcel->parcel_status), ['approved', 'verified'])) {
                    $this->line("Removing notification for parcel {$parcel->parcel_code} (status: {$parcel->parcel_status})");
                    $notification->delete();
                    $cleanedCount++;
                }
            }
        }

        $this->info("Cleaned up {$cleanedCount} orphaned notifications.");
        return 0;
    }
}
