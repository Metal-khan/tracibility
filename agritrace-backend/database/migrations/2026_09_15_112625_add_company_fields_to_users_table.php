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
        Schema::table('users', function (Blueprint $table) {
            // AuthController::register() has sent these for logistics
            // sign-ups since it was written, and RegisterScreen.tsx collects
            // them — but the columns never existed, so User::create()
            // silently dropped both on every logistics registration
            // (Eloquent mass-assignment drops unknown keys rather than
            // erroring). Same bug class as farm_name/contact_number, which
            // at least had their columns — just never made $fillable.
            $table->string('company_name')->nullable()->after('contact_number');
            $table->string('contact_info')->nullable()->after('company_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['company_name', 'contact_info']);
        });
    }
};
