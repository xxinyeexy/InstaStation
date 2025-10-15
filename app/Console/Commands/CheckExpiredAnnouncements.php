<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use Illuminate\Console\Command;

class CheckExpiredAnnouncements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'announcements:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and update expired announcements to draft status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired announcements...');

        $expiredCount = Announcement::checkAndUpdateExpired();

        if ($expiredCount > 0) {
            $this->info("Updated {$expiredCount} expired announcement(s) to draft status.");
        } else {
            $this->info('No expired announcements found.');
        }

        return Command::SUCCESS;
    }
}
