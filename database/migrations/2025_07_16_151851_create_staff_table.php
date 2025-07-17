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
        Schema::create('staff', function (Blueprint $table) {
            $table->id('staff_id');
            $table->string('staff_name', 50);
            $table->string('phone_no', 15);
            $table->string('email', 100)->unique();
            $table->string('password', 255);
            $table->string('profile_pic', 500)->nullable();
            $table->string('department', 50)->nullable();
            $table->enum('user_type', ['Standard', 'Admin']);
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
        Schema::dropIfExists('staff');
    }
};
