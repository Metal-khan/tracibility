<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Role is correctly fillable
        'status',
        'subscription_status',
        'subscription_plan',
        'subscription_start_date',
        'subscription_end_date',
        'last_payment_date',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'subscription_start_date' => 'date',
        'subscription_end_date' => 'date',
        'last_payment_date' => 'date',
    ];

    // =============================================================
    // CRITICAL FIX: Explicit Role Accessor
    // This ensures the custom RoleMiddleware gets a clean string value.
    // =============================================================
    public function getRoleAttribute($value)
    {
        return strtolower($value);
    }
    // =============================================================


    /**
     * Get the products created by the user (if they are a Farmer).
     */
    public function products(): HasMany
    {
        // NOTE: Ensure Product model is imported if you use this in the app.
        return $this->hasMany(Product::class, 'farmer_id'); 
    }

    /**
     * Get the reviews left by the user (if they are a Buyer).
     */
    public function reviews(): HasMany
    {
        // NOTE: Ensure Review model is imported if you use this in the app.
        return $this->hasMany(Review::class, 'buyer_id');
    }
}