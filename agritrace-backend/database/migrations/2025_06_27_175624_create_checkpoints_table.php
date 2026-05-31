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
        Schema::create('checkpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade'); // Links to the product
            $table->foreignId('logistics_id')->constrained('users')->onDelete('cascade'); // Links to the Logistics user
            $table->string('location_address'); // Address part of the location
            $table->string('location_lat'); // Latitude
            $table->string('location_lon'); // Longitude
            $table->timestamp('scan_time')->useCurrent(); // Timestamp of the scan
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('checkpoints');
    }
};