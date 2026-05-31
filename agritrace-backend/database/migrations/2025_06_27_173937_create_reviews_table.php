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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade'); // Link to the product being reviewed
            $table->foreignId('buyer_id')->constrained('users')->onDelete('cascade'); // Link to the buyer (end-user)
            $table->unsignedTinyInteger('rating')->comment('1-5 star rating'); // Star rating
            $table->text('comment')->nullable(); // Optional text comment
            $table->string('status')->default('pending')->comment('pending, approved, rejected'); // Review moderation status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};