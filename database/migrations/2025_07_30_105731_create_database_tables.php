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
        // 1. Users Table
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('type', ['student', 'staff', 'admin']);
            $table->string('matric')->nullable()->unique();
            $table->string('room_no', 12)->nullable();
            $table->string('phone_no', 15) ->nullable();
            $table->string('profile_pic', 500)->nullable();
            $table->enum('status', ['Active', 'Inactive'])->default('Active'); ;
            $table->string('department')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        // 2. Password Reset Tokens
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // 3. Sessions Table
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // 4. FAQs Table
        Schema::create('faqs', function (Blueprint $table) {
            $table->id('faq_id');
            $table->string('faq_question', 100);
            $table->string('faq_answer', 255);
            $table->string('category', 20);
            $table->enum('faq_status', ['Active', 'Inactive'])->default('Active');
            $table->timestamps();
        });

        // 5. Parcels Table
        Schema::create('parcels', function (Blueprint $table) {
            $table->id('parcel_id');
            $table->foreignId('student_id')->nullable()->constrained('users', 'id')->onDelete('cascade');
            $table->string('tracking_no', 50)->unique();
            $table->enum('parcel_status', ['Pending Payment', 'Approved', 'Ready For Collection', 'Collected', 'Unclaimed'])->default('Pending Payment');
            $table->integer('days')->nullable();
            $table->string('sender', 50);
            $table->text('size')->nullable();
            $table->string('location', 100)->nullable();
            $table->string('qr_code', 255)->unique()->nullable();
            $table->timestamp('schedule');
            $table->foreignId('created_by')->constrained('users', 'id')->onDelete('cascade');
            $table->foreignId('last_edited_by')->constrained('users', 'id')->onDelete('cascade');
            $table->timestamp('report_at')->useCurrent();
            $table->timestamps();
        });

        // 6. Payments Table
        Schema::create('payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->foreignId('parcel_id')->constrained('parcels', 'parcel_id')->onDelete('cascade');
            $table->text('payment')->nullable();
            $table->string('file_path', 255);
            $table->foreignId('verified_by')->constrained('users', 'id')->onDelete('cascade');
            $table->date('payment_date')->nullable();
            $table->timestamps();
        });

        // 7. Reports Table
        Schema::create('reports', function (Blueprint $table) {
            $table->id('report_id');
            $table->foreignId('parcel_id')->constrained('parcels', 'parcel_id')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users', 'id')->onDelete('cascade');
            $table->timestamps();
        });

        // 8. Notifications Table
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type')->nullable();
            $table->unsignedBigInteger('notifiable_id');
            $table->string('notifiable_type');
            $table->text('data');
            $table->timestamp('read_at')->nullable()->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('parcels');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
