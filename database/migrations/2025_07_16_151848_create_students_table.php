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
        Schema::create('students', function (Blueprint $table) {
            $table->id('student_id');
            $table->string('student_name', 50);
            $table->string('phone_no', 15);
            $table->string('room_no', 12)->nullable();
            $table->string('matric', 10)->unique();
            $table->string('email', 255)->unique();
            $table->string('password', 255);
            $table->string('profile_pic', 500)->nullable();
            $table->enum('status', ['Active', 'Inactive']);
            $table->rememberToken();
            $table->string('reset_password_token', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
