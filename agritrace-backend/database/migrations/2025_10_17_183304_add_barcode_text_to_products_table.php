<?php

// database/migrations/xxxx_xx_xx_xxxxxx_add_barcode_text_to_products_table.php

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
        Schema::table('products', function (Blueprint $table) {
            // Add the new column to store the visible barcode text
            $table->string('barcode_text')->nullable()->after('qr_code_url'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop the column if rolling back the migration
            $table->dropColumn('barcode_text');
        });
    }
};