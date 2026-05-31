<?php

// In the file 2025_10_17_221312_drop_logistics_id_from_checkpoints_table.php

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
            
            // 1. CRITICAL FIX: Conditionally drop the foreign key constraint
            // This checks if the column exists AND drops the associated FK constraint
            if (Schema::hasColumn('checkpoints', 'logistics_id')) {
                 $table->dropConstrainedForeignId('logistics_id'); // Recommended method in newer Laravel versions
            }

            // 2. Conditionally drop the column itself (if it somehow still exists)
            if (Schema::hasColumn('checkpoints', 'logistics_id')) {
                $table->dropColumn('logistics_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            // Re-add the column as nullable if rolling back
            if (!Schema::hasColumn('checkpoints', 'logistics_id')) {
                $table->foreignId('logistics_id')->nullable()->after('product_id')->constrained('users'); 
            }
        });
    }
};