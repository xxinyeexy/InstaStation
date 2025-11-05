<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove the default value from read_at column
        Schema::table('notifications', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->default(null)->change();
        });
        
        // Set read_at to null for all unread notifications (that were incorrectly marked as read)
        // We'll keep notifications created more than 1 minute ago as unread
        DB::table('notifications')
            ->where('created_at', '>', now()->subMinutes(5))
            ->update(['read_at' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->default(DB::raw('CURRENT_TIMESTAMP'))->change();
        });
    }
};
