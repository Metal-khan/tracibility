<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductDynamicFieldValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'dynamic_field_id',
        'value',
    ];

    /**
     * Get the product that the value belongs to.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the dynamic field definition.
     */
    public function dynamicField(): BelongsTo
    {
        return $this->belongsTo(DynamicField::class);
    }
}