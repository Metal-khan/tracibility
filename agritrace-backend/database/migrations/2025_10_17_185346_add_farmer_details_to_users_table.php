<?php

// database/migrations/xxxx_xx_xx_xxxxxx_add_farmer_details_to_users_table.php

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
        Schema::table('users', function (Blueprint $table) {
            // These columns are required for the Company Profile screen
            $table->string('farm_name')->nullable()->after('role');
            $table->string('contact_number')->nullable()->after('farm_name');
            // Assuming 'status' (approved/pending) already exists, but we add it if it doesn't
            // We use the existing 'status' if it's already there, but ensuring these exist:
            // $table->string('status')->default('pending')->after('contact_number'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the columns if rolling back the migration
            $table->dropColumn(['farm_name', 'contact_number']);
            // If you created status, drop it too, but we will assume it exists from your previous code
            // $table->dropColumn('status');
        });
    }
};
