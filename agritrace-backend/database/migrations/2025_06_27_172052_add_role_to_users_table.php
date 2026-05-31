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
            // Add the 'role' column as a string after the 'password' column
            // We'll give it a default value of 'buyer' since that's a self-registration role [cite: 10]
            $table->string('role')->after('password')->default('buyer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // This is for rolling back the change; it will remove the 'role' column
            $table->dropColumn('role');
        });
    }
};