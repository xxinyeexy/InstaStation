<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            // Change date columns to datetime
            $table->datetime('publish_date')->nullable()->change();
            $table->datetime('expiry_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            // Revert back to date columns
            $table->date('publish_date')->nullable()->change();
            $table->date('expiry_date')->nullable()->change();
        });
    }
};
