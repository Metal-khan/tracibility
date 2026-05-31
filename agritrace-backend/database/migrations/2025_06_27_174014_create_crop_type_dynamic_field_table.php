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
        Schema::create('crop_type_dynamic_field', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dynamic_field_id')->constrained('dynamic_fields')->onDelete('cascade');
            $table->string('crop_type'); // The name of the crop type (e.g., 'Wheat')
            $table->unique(['dynamic_field_id', 'crop_type']); // Ensure a field is only linked once per crop type
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crop_type_dynamic_field');
    }
};