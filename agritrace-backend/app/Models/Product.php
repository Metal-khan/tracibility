<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

// CRITICAL FIX: Import Checkpoint model to define relationship
use App\Models\Checkpoint; 

class Product extends Model
{
    use HasFactory;

    protected $guarded = ['id']; // Allows all fields to be mass assignable, except 'id'

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'harvest_date' => 'date',
        'sowing_date' => 'date', 
        'collection_date' => 'date', 
        'photos_urls' => 'array', 
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['qr_code_html'];

    /**
     * Get the farmer that owns the product.
     */
    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    /**
     * Get the reviews for the product.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
    
    /**
     * CRITICAL FIX: Get the checkpoints (scan history) associated with the product.
     */
    public function checkpoints(): HasMany
    {
        return $this->hasMany(Checkpoint::class);
    }

    /**
     * Get the dynamic field values for the product.
     */
    public function dynamicFieldValues(): HasMany
    {
        return $this->hasMany(ProductDynamicFieldValue::class);
    }

    /**
     * Accessor to generate the QR code HTML directly from the model.
     * This will be included in the JSON response when the model is serialized.
     */
    public function getQrCodeHtmlAttribute(): string
    {
        try {
            if (!$this->qr_code_url) {
                return '<!DOCTYPE html><html><body><p style="text-align:center; color: red;">Error: Barcode URL not stored for this product.</p></body></html>';
            }

            // Convert full URL back to storage path
            $qrCodePathInStorage = str_replace(URL::to('/storage/'), 'public/', $this->qr_code_url); 
            
            if (str_starts_with($this->qr_code_url, '/storage/')) {
                $qrCodePathInStorage = 'public/' . substr($this->qr_code_url, 9);
            }

            // Check if the actual SVG file exists in storage
            if (Storage::exists($qrCodePathInStorage)) {
                $svgContent = Storage::get($qrCodePathInStorage);
                $encodedSvg = base64_encode($svgContent);
                
                // Return HTML containing the Base64 encoded SVG image
                return '<!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: white; }
                        img { width: 100%; height: 100%; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <img src="data:image/svg+xml;base64,' . $encodedSvg . '" alt="Barcode" />
                </body>
                </html>';
            } else {
                // Fallback HTML if the file itself is not found on disk
                return '<!DOCTYPE html><html><body><p style="text-align:center; color: red;">Error: Barcode file not found on disk or inaccessible.</p></body></html>';
            }
        } catch (\Exception $e) {
            // Return an error HTML if any exception occurs during this process
            return '<!DOCTYPE html><html><body><p style="text-align:center; color: red;">Server Error: ' . htmlspecialchars($e->getMessage()) . '</p></body></html>';
        }
    }
}