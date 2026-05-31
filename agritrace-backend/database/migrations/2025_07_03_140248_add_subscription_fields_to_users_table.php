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
            // Subscription-related fields
            $table->string('subscription_status')->default('inactive')->after('status')->comment('e.g., active, inactive, trial, expired, cancelled');
            $table->string('subscription_plan')->nullable()->after('subscription_status')->comment('e.g., basic, premium');
            $table->date('subscription_start_date')->nullable()->after('subscription_plan');
            $table->date('subscription_end_date')->nullable()->after('subscription_start_date');
            $table->date('last_payment_date')->nullable()->after('subscription_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_status',
                'subscription_plan',
                'subscription_start_date',
                'subscription_end_date',
                'last_payment_date',
            ]);
        });
    }
};