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
            // Array of {name, certifying_body, certificate_number} objects —
            // a batch can legitimately hold several certifications at once
            // (e.g. Phytosanitary + Halal + GLOBALG.A.P. for one shipment),
            // so this isn't a single column like quality_grade.
            $table->json('certifications')->nullable()->after('photos_urls');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('certifications');
        });
    }
};
