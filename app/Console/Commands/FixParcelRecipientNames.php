<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Parcel;
use App\Models\User;

class FixParcelRecipientNames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'parcels:fix-recipient-names';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix parcels with student_id but missing recipient_name by populating from user data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Finding parcels with student_id but missing recipient_name...');
        
        // Find all parcels with student_id but no recipient_name
        $parcels = Parcel::whereNotNull('student_id')
            ->where(function($query) {
                $query->whereNull('recipient_name')
                      ->orWhere('recipient_name', '');
            })
            ->with('studentUser')
            ->get();
        
        $this->info("Found {$parcels->count()} parcels to fix.");
        
        $fixed = 0;
        $skipped = 0;
        
        foreach ($parcels as $parcel) {
            if ($parcel->studentUser) {
                $parcel->recipient_name = $parcel->studentUser->name;
                $parcel->recipient_matric = $parcel->studentUser->matric;
                $parcel->save();
                $fixed++;
                $this->line("✓ Fixed parcel {$parcel->parcel_code} - {$parcel->studentUser->name}");
            } else {
                $skipped++;
                $this->warn("✗ Skipped parcel {$parcel->parcel_code} - Student already deleted");
            }
        }
        
        $this->newLine();
        $this->info("Summary:");
        $this->info("- Fixed: {$fixed} parcels");
        $this->warn("- Skipped (student deleted): {$skipped} parcels");
        $this->newLine();
        $this->info('Done!');
        
        return 0;
    }
}
