<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CropTypeDynamicField extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'crop_type_dynamic_field';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'dynamic_field_id',
        'crop_type',
    ];

    public $timestamps = false; // This table does not need timestamps

    /**
     * Get the dynamic field definition that the pivot record belongs to.
     */
    public function dynamicField(): BelongsTo
    {
        return $this->belongsTo(DynamicField::class);
    }
}