<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DynamicField extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'field_type',
        'is_required',
        'default_value',
        'selection_options',
        'is_general',
        'created_by'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'is_required' => 'boolean',
        'is_general' => 'boolean',
        'selection_options' => 'array', // Casts the JSON to a PHP array
    ];

    /**
     * Get the crop types linked to this dynamic field.
     */
    public function cropTypes(): HasMany
    {
        return $this->hasMany(\App\Models\CropTypeDynamicField::class);
    }
}