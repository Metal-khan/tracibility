<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'user_id', // Changed from buyer_id to user_id in migration/logic
        'rating',
        'comment',
        'status',
    ];

    /**
     * Get the product that the review belongs to.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    
    /**
     * CRITICAL FIX: Get the User (Buyer) who wrote the review.
     */
    public function user(): BelongsTo
    {
        // Assumes 'user_id' is the foreign key in the 'reviews' table
        return $this->belongsTo(User::class, 'user_id'); 
    }

    /*
     * NOTE: If your database still uses a 'buyer_id' column, 
     * this relationship should be public function user(): BelongsTo { return $this->belongsTo(User::class, 'buyer_id'); }
     * However, we are using the generalized 'user_id' logic from the checkpoint fixes.
     */
}