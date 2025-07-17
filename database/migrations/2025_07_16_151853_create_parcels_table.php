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
        Schema::create('parcels', function (Blueprint $table) {
            $table->id('parcel_id');
            $table->foreignId('student_id')->constrained('students', 'student_id');
            $table->string('tracking_no', 50)->unique();
            $table->enum('parcel_status', ['Pending Payment', 'Approved', 'Ready To Collect', 'Collected']);
            $table->integer('days')->nullable();
            $table->string('sender', 50);
            $table->text('size')->nullable();
            $table->string('location', 100)->nullable();
            $table->string('qr_code', 255)->unique()->nullable();
            $table->timestamp('schedule');
            $table->foreignId('created_by')->constrained('staff', 'staff_id');
            $table->foreignId('last_edited_by')->constrained('staff', 'staff_id');
            $table->timestamp('report_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parcels');
    }
};
