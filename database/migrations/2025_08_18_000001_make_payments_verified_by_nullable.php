<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make verified_by nullable so student submissions can be pending
        try {
            DB::statement('ALTER TABLE payments MODIFY verified_by BIGINT UNSIGNED NULL');
        } catch (\Throwable $e) {
            // ignore if already nullable
        }
    }

    public function down(): void
    {
        // Revert to NOT NULL only if desired; keep nullable for safety
    }
};
