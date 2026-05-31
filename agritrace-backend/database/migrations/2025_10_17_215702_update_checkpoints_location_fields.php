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
            
            // 1. Drop the original 'location' column if it still exists (and is now obsolete)
            if (Schema::hasColumn('checkpoints', 'location')) {
                $table->dropColumn('location');
            }
            
            // 2. Add the new detailed columns (Checking existence to prevent error)
            if (!Schema::hasColumn('checkpoints', 'location_address')) {
                // Place it after user_id (which was added in the previous migration)
                $table->string('location_address')->nullable()->after('user_id'); 
            }
            if (!Schema::hasColumn('checkpoints', 'location_lat')) {
                $table->decimal('location_lat', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('checkpoints', 'location_lon')) {
                $table->decimal('location_lon', 10, 7)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkpoints', function (Blueprint $table) {
            if (Schema::hasColumn('checkpoints', 'location_address')) {
                $table->dropColumn(['location_address', 'location_lat', 'location_lon']);
            }
            
            // Re-add the simple location column for safe rollback
            if (!Schema::hasColumn('checkpoints', 'location')) {
                 $table->string('location')->nullable()->after('user_id');
            }
        });
    }
};