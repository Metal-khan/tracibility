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
            // dropConstrainedForeignId() drops both the foreign key constraint
            // and the column itself in one step. A second, separate
            // dropColumn('logistics_id') call right after this — even guarded
            // by the same hasColumn() check — queues a duplicate drop of a
            // column that's already gone by the time SQLite's ALTER TABLE
            // rebuild runs, which fails migrations on a fresh database with
            // "no such column: logistics_id". Drop it once.
            if (Schema::hasColumn('checkpoints', 'logistics_id')) {
                $table->dropConstrainedForeignId('logistics_id');
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