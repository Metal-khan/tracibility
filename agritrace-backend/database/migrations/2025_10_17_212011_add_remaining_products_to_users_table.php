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
            // Subscription Plan and Dates (Checking for existence to prevent duplicate column errors)
            
            if (!Schema::hasColumn('users', 'subscription_plan')) {
                 $table->string('subscription_plan')->nullable()->after('status');
            }
            
            // CRITICAL FIX: Wrap the remaining_products column creation in a check
            if (!Schema::hasColumn('users', 'remaining_products')) {
                // We use 'status' or 'subscription_plan' for placement
                $table->integer('remaining_products')->default(0)->after('subscription_plan'); 
            }
            
            if (!Schema::hasColumn('users', 'subscription_start_date')) {
                $table->date('subscription_start_date')->nullable();
            }
            if (!Schema::hasColumn('users', 'subscription_end_date')) {
                $table->date('subscription_end_date')->nullable();
            }
            if (!Schema::hasColumn('users', 'last_payment_date')) {
                $table->date('last_payment_date')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop columns safely
            if (Schema::hasColumn('users', 'subscription_plan')) {
                $table->dropColumn('subscription_plan');
            }
            if (Schema::hasColumn('users', 'remaining_products')) {
                $table->dropColumn('remaining_products');
            }
            if (Schema::hasColumn('users', 'subscription_start_date')) {
                $table->dropColumn('subscription_start_date');
            }
            if (Schema::hasColumn('users', 'subscription_end_date')) {
                $table->dropColumn('subscription_end_date');
            }
            if (Schema::hasColumn('users', 'last_payment_date')) {
                $table->dropColumn('last_payment_date');
            }
        });
    }
};