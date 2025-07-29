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
        Schema::table('parcels', function (Blueprint $table) {
            // Drop the existing foreign key constraints that reference staff table
            $table->dropForeign(['created_by']);
            $table->dropForeign(['last_edited_by']);
            
            // Add new foreign key constraints that reference users table
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('last_edited_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            // Drop the foreign keys that reference users
            $table->dropForeign(['created_by']);
            $table->dropForeign(['last_edited_by']);
            
            // Restore the original foreign keys that reference staff table
            $table->foreign('created_by')->references('staff_id')->on('staff')->onDelete('cascade');
            $table->foreign('last_edited_by')->references('staff_id')->on('staff')->onDelete('cascade');
        });
    }
};
