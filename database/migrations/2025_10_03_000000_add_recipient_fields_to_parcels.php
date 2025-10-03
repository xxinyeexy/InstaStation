<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->string('recipient_name', 150)->nullable()->after('student_id');
            $table->string('recipient_matric', 50)->nullable()->after('recipient_name');
        });
    }

    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->dropColumn(['recipient_name', 'recipient_matric']);
        });
    }
};


