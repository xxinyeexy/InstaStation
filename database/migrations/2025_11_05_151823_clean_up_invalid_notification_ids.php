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
        // Delete notifications with invalid UUID format (UUIDs should be 36 characters with dashes)
        // These are corrupted notifications with IDs like "824049", "1", "2", etc.
        DB::table('notifications')
            ->whereRaw('LENGTH(id) < 36')
            ->delete();
            
        echo "Deleted invalid notifications\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse this operation
    }
};
