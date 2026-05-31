<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Checkpoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        // CRITICAL FIX 1: Change obsolete 'logistics_id' to generic 'user_id'
        'user_id', 
        
        // CRITICAL FIX 2: Ensure 'notes' and 'timestamp' are fillable
        'notes', 
        'timestamp',

        // Location fields
        'location_address',
        'location_lat',
        'location_lon',
    ];

    /**
     * Get the product that the checkpoint belongs to.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    
    /**
     * CRITICAL FIX 3: Get the User (Buyer or Logistics) who logged the checkpoint.
     */
    public function user(): BelongsTo
    {
        // Link user_id column to the User model
        return $this->belongsTo(User::class, 'user_id');
    }

    // REMOVED obsolete public function logistics(): BelongsTo
}