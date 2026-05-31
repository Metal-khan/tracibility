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
        Schema::table('products', function (Blueprint $table) {
            // Farmer / SME Information
            // The existing farmer_id is enough for this section
            $table->string('farm_name')->nullable()->after('farmer_id');
            $table->string('contact_number')->nullable()->after('farm_name');

            // Farm Location
            // The existing origin_location_lat/lon/address are enough
            $table->string('province')->nullable()->after('origin_location_address');
            $table->string('district')->nullable()->after('province');
            $table->string('village')->nullable()->after('district');
            $table->decimal('land_area', 8, 2)->nullable()->after('village');
            $table->string('land_area_unit')->nullable()->after('land_area');

            // Crop Details
            // The existing crop_type, quantity, harvest_date are enough
            $table->string('variety')->nullable()->after('crop_type');
            $table->string('farming_method')->nullable()->after('variety');
            $table->string('season')->nullable()->after('farming_method');
            $table->date('sowing_date')->nullable()->after('harvest_date');
            $table->decimal('estimated_yield', 8, 2)->nullable()->after('sowing_date');
            $table->decimal('actual_yield', 8, 2)->nullable()->after('estimated_yield');
            $table->string('quality_grade')->nullable()->after('actual_yield');

            // Environmental & Weather
            $table->string('weather_condition')->nullable()->after('quality_grade');
            $table->decimal('temperature', 8, 2)->nullable()->after('weather_condition');
            $table->decimal('humidity', 8, 2)->nullable()->after('temperature');

            // Post-Harvest Handling
            $table->date('collection_date')->nullable()->after('humidity');
            $table->string('storage_method')->nullable()->after('collection_date');
            $table->string('packaging_type')->nullable()->after('storage_method');
            $table->integer('num_packages')->nullable()->after('packaging_type');
            $table->decimal('weight_per_unit', 8, 2)->nullable()->after('num_packages');
            $table->decimal('total_weight', 8, 2)->nullable()->after('weight_per_unit');

            // Additional Notes
            $table->text('special_remarks')->nullable()->after('qr_code_url');

            // For "Farm Images" and "Document Upload", we can repurpose the 'photos_urls'
            // column and add a 'documents_urls' column if needed, but for simplicity
            // we will stick to one JSON column for now.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'farm_name', 'contact_number', 'province', 'district', 'village', 'land_area', 'land_area_unit',
                'variety', 'farming_method', 'season', 'sowing_date', 'estimated_yield', 'actual_yield', 'quality_grade',
                'weather_condition', 'temperature', 'humidity', 'collection_date', 'storage_method',
                'packaging_type', 'num_packages', 'weight_per_unit', 'total_weight', 'special_remarks',
            ]);
        });
    }
};