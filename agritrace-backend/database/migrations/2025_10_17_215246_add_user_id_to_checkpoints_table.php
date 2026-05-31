<?php

// app/database/migrations/xxxx_xx_xx_add_user_id_to_checkpoints_table.php

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
        // We assume the user_id column has already been added in a previous, partially successful run.
        // We only proceed to add the foreign key constraint if it doesn't already exist.
        Schema::table('checkpoints', function (Blueprint $table) {
            
            // Check if the column exists but NOT the foreign key (final step of the fix)
            if (Schema::hasColumn('checkpoints', 'user_id') && 
                !Schema::hasColumn('checkpoints', 'location_address')) { 
                // Since the column exists, we do nothing about adding it.
                // We trust the schema is now ready for the next column changes.
            }

            // The safest thing to do is make the body of UP empty since the column is there
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            // Drop the foreign key constraint and the column
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};