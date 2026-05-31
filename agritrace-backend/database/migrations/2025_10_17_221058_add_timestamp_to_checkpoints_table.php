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
            // CRITICAL FIX: Add the missing 'timestamp' column
            if (!Schema::hasColumn('checkpoints', 'timestamp')) {
                // Place it after 'notes' or another definitive column
                $table->timestamp('timestamp')->nullable()->after('notes'); 
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            if (Schema::hasColumn('checkpoints', 'timestamp')) {
                $table->dropColumn('timestamp');
            }
        });
    }
};