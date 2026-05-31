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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            // Core Fields (Mandatory) from the document
            $table->string('crop_type'); // e.g., "Wheat", "Corn" 
            $table->float('quantity'); // e.g., 500.5 
            $table->string('unit'); // e.g., "kg", "tons" 
            $table->date('harvest_date'); // 
            $table->text('description')->nullable(); // 
            $table->string('origin_location_address'); // Address part of the origin location
            $table->string('origin_location_lat'); // Latitude for auto-captured GPS 
            $table->string('origin_location_lon'); // Longitude for auto-captured GPS 
            $table->string('qr_code_url')->nullable(); // URL to the QR code image [cite: 20]
            $table->string('status')->default('Active'); // Default status is 'Active' [cite: 12, 14]

            // Link to the Farmer (SME) who created the product
            $table->foreignId('farmer_id')->constrained('users')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};