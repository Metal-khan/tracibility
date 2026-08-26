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
    protected $appends = ['qr_code_html', 'qr_code_url', 'qr_code_data_uri', 'photos_urls_array'];

    /**
     * Where this product's QR code SVG lives on the private 'local' disk.
     * A pure function of the product's own ID — no need to store or
     * recompute anything, unlike the signed token *inside* the QR image
     * (see ResolvesTraceTokens), which can't be recomputed since encrypting
     * the same ID twice produces a different ciphertext each time.
     */
    public function qrCodeStoragePath(): string
    {
        return 'qrcodes/qr-'.$this->id.'.svg';
    }

    /**
     * URL for fetching this product's QR code image — routed through an
     * authenticated endpoint rather than a public storage URL, so it isn't
     * openly world-readable. Overrides the raw 'qr_code_url' column
     * whenever the model is read or serialized (see $appends above);
     * nothing needs to be stored in that column anymore.
     */
    public function getQrCodeUrlAttribute(): ?string
    {
        if (!$this->id || !Storage::disk('local')->exists($this->qrCodeStoragePath())) {
            return null;
        }

        return URL::to('/api/products/'.$this->id.'/qr-image');
    }

    /**
     * Product photo URLs, routed through an authenticated endpoint instead
     * of the old public storage URLs — same reasoning as qr_code_url above.
     */
    public function getPhotosUrlsArrayAttribute(): array
    {
        if (!is_array($this->photos_urls)) {
            return [];
        }

        return collect($this->photos_urls)
            ->map(fn ($relativePath) => URL::to('/api/products/'.$this->id.'/photo/'.basename($relativePath)))
            ->all();
    }

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
     * The QR code SVG as an inline data: URI, so it can be embedded directly
     * (WebView html, <img src>, or decoded back to raw SVG bytes for a
     * download/share/print flow) without a second authenticated request
     * back to qrImage() — the mobile app fetches the product/QR data once
     * with its auth header and everything needed to render or export the
     * code travels with that one response.
     */
    public function getQrCodeDataUriAttribute(): ?string
    {
        $qrCodePathInStorage = $this->qrCodeStoragePath();

        if (!Storage::disk('local')->exists($qrCodePathInStorage)) {
            return null;
        }

        $svgContent = Storage::disk('local')->get($qrCodePathInStorage);

        return 'data:image/svg+xml;base64,' . base64_encode($svgContent);
    }

    /**
     * Accessor to generate the QR code HTML directly from the model.
     * This will be included in the JSON response when the model is serialized.
     */
    public function getQrCodeHtmlAttribute(): string
    {
        try {
            $dataUri = $this->qr_code_data_uri;

            if (!$dataUri) {
                // Fallback HTML if the file itself is not found on disk
                return '<!DOCTYPE html><html><body><p style="text-align:center; color: red;">Error: Barcode file not found on disk or inaccessible.</p></body></html>';
            }

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
                <img src="' . $dataUri . '" alt="Barcode" />
            </body>
            </html>';
        } catch (\Exception $e) {
            // Return an error HTML if any exception occurs during this process
            return '<!DOCTYPE html><html><body><p style="text-align:center; color: red;">Server Error: ' . htmlspecialchars($e->getMessage()) . '</p></body></html>';
        }
    }
}