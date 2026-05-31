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
        Schema::create('dynamic_fields', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('field_type'); // e.g., 'text', 'number', 'date', 'boolean', 'dropdown', 'multi-select' [cite: 14]
            $table->boolean('is_required')->default(false); // Field property: Required (yes/no) [cite: 14]
            $table->string('default_value')->nullable(); // Field property: Default Value [cite: 14]
            $table->json('selection_options')->nullable(); // Field property: Selection Options (if applicable) [cite: 14]
            $table->boolean('is_general')->default(false)->comment('If true, field applies to all crop types'); // General or specific to a crop 
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade'); // Link to the Admin/Super Admin who created it [cite: 5, 7]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dynamic_fields');
    }
};