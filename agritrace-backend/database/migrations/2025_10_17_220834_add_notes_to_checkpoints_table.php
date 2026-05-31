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
        Schema::table('checkpoints', function (Blueprint $table) {
            // CRITICAL FIX: Add the missing 'notes' column
            if (!Schema::hasColumn('checkpoints', 'notes')) {
                $table->text('notes')->nullable()->after('location_lon');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            if (Schema::hasColumn('checkpoints', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};