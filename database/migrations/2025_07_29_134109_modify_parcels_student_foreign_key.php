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
            // Drop the existing foreign key constraint that references students table
            $table->dropForeign(['student_id']);
            
            // Add new foreign key constraint that references users table
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            // Drop the foreign key that references users
            $table->dropForeign(['student_id']);
            
            // Restore the original foreign key that references students table
            $table->foreign('student_id')->references('student_id')->on('students')->onDelete('cascade');
        });
    }
};
