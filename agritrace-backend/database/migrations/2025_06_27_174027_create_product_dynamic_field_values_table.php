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
        Schema::create('product_dynamic_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade'); // Link to the product
            $table->foreignId('dynamic_field_id')->constrained('dynamic_fields')->onDelete('cascade'); // Link to the field definition
            $table->text('value'); // The actual value of the dynamic field (e.g., '14.5%')
            $table->timestamps();
            $table->unique(['product_id', 'dynamic_field_id']); // Ensure only one value per product and field
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_dynamic_field_values');
    }
};