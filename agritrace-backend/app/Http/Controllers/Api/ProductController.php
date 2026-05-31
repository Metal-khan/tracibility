<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductDynamicFieldValue;
use App\Models\Checkpoint; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

// CRITICAL BARCODE IMPORT: Assumes milon/barcode package is installed
use DNS1D; 

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     * This will show products created by the authenticated farmer.
     */
    public function index(Request $request)
    {
        // Get products created by the logged-in user
        $products = $request->user()->products()->get();

        $products->each(function ($product) {
            if (is_array($product->photos_urls)) {
                $photos = $product->photos_urls;
                $absolutePhotos = [];
                foreach ($photos as $photoUrl) {
                    // CRITICAL FIX: Use the confirmed local network IP (192.168.1.6)
                    $absolutePhotos[] = 'http://192.168.1.6:8000' . str_replace(URL::to('/'), '', $photoUrl); 
                }
                $product->photos_urls_array = $absolutePhotos;
            } else {
                $product->photos_urls_array = [];
            }
        });

        return response()->json($products);
    }

    /**
     * Store a newly created product in storage.
     * This is used by the Farmer role.
     */
    public function store(Request $request)
    {
        $user = Auth::user(); 
        try {
            // 1. Validation (Validation code remains unchanged)
            $request->validate([
                'farm_name' => 'nullable|string',
                'contact_number' => 'required|string',
                'origin_location_lat' => 'required|numeric',
                'origin_location_lon' => 'required|numeric',
                'origin_location_address' => 'required|string',
                'province' => 'required|string',
                'district' => 'required|string',
                'village' => 'nullable|string',
                'land_area' => 'required|numeric',
                'land_area_unit' => 'required|string',
                'crop_type' => 'required|string',
                'variety' => 'required|string',
                'farming_method' => 'required|string',
                'season' => 'required|string',
                'sowing_date' => 'nullable|date',
                'harvest_date' => 'required|date',
                'estimated_yield' => 'required|numeric',
                'actual_yield' => 'nullable|numeric',
                'quality_grade' => 'required|string',
                'weather_condition' => 'nullable|string',
                'temperature' => 'nullable|numeric',
                'humidity' => 'nullable|numeric',
                'collection_date' => 'required|date',
                'storage_method' => 'required|string',
                'packaging_type' => 'required|string',
                'num_packages' => 'required|integer',
                'weight_per_unit' => 'required|numeric',
                'special_remarks' => 'nullable|string',
                'photos' => 'required|array',
                'photos.*' => 'image|max:2048',
                'quantity' => 'nullable|numeric',
                'unit' => 'nullable|string',
            ]);

            // 2. Create the product record and save to get ID
            $product = new Product();
            $product->farmer_id = $request->user()->id;
            $product->farm_name = $request->farm_name;
            $product->contact_number = $request->contact_number;
            $product->origin_location_lat = $request->origin_location_lat;
            $product->origin_location_lon = $request->origin_location_lon;
            $product->origin_location_address = $request->origin_location_address;
            $product->province = $request->province;
            $product->district = $request->district;
            $product->village = $request->village;
            $product->land_area = $request->land_area;
            $product->land_area_unit = $request->land_area_unit;
            $product->crop_type = $request->crop_type;
            $product->variety = $request->variety;
            $product->farming_method = $request->farming_method;
            $product->season = $request->season;
            $product->sowing_date = $request->sowing_date;
            $product->harvest_date = $request->harvest_date;
            $product->estimated_yield = $request->estimated_yield;
            $product->actual_yield = $request->actual_yield;
            $product->quality_grade = $request->quality_grade;
            $product->weather_condition = $request->weather_condition;
            $product->temperature = $request->temperature;
            $product->humidity = $request->humidity;
            $product->collection_date = $request->collection_date;
            $product->storage_method = $request->storage_method;
            $product->packaging_type = $request->packaging_type;
            $product->num_packages = $request->num_packages;
            $product->weight_per_unit = $request->weight_per_unit;
            $product->special_remarks = $request->special_remarks;
            $product->status = 'Active';
            $product->quantity = $request->num_packages;
            $product->unit = $request->packaging_type;
            $product->total_weight = $request->num_packages * $request->weight_per_unit;
            $product->save(); // Save to obtain the product ID

            // 3. Handle image uploads
            $photoPaths = [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('public/products/photos');
                $photoPaths[] = Storage::url($path);
            }
            $product->photos_urls = json_encode($photoPaths);
            $product->save();

            // 4. Generate and save the BARCODE (CRITICAL CHANGE)
            $productId = $product->id;
            
            // --- NEW IDENTIFIER FORMAT LOGIC ---
            $datePart = now()->format('dmy'); 
            $paddedProductId = str_pad($productId, 2, '0', STR_PAD_LEFT);
            $humanIdentifier = "AGRI000{$datePart}{$paddedProductId}"; 
            
            // The value encoded in the barcode should be the simple ID for scanning consistency
            $barcodeIdentifier = $productId; 
            $barcodeType = 'C128'; 
            $barcodeFileName = 'barcode-' . $barcodeIdentifier . '.svg';
            $barcodeDirectory = 'public/barcodes';
            $barcodePath = $barcodeDirectory . '/' . $barcodeFileName;

            if (!Storage::disk('local')->exists($barcodeDirectory)) {
                Storage::disk('local')->makeDirectory($barcodeDirectory);
            }

            // CRITICAL FIX: Cast the identifier to a string to prevent the DNS1D bug
            $barcodeData = DNS1D::getBarcodeSVG((string)$barcodeIdentifier, $barcodeType);

            Storage::put($barcodePath, $barcodeData); 

            // Add the unique identifier text below the barcode
            $product->barcode_text = $humanIdentifier; 
            $product->qr_code_url = URL::to('/') . Storage::url($barcodePath); // Store the barcode URL
            $product->save();

            return response()->json([
                'message' => 'Product created successfully!',
                'product' => $product,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Product store error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
            return response()->json(['message' => 'An error occurred during product storage. Please check logs.'], 500);
        }
    }

    /**
     * Handles product scanning (viewing details and trace history).
     * This route is protected by 'role:buyer,logistics,farmer,admin,super_admin' middleware.
     */
    public function scan($productId)
    {
        try {
            // 2. Fetch the Product
            $product = Product::with([
                'farmer' => function ($query) {
                    $query->select('id', 'name', 'email', 'farm_name', 'contact_number', 'status');
                },
                'reviews.buyer', 
                'dynamicFieldValues.dynamicField'
            ])->find($productId);

            if (!$product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            // 3. Fetch the Checkpoints (Trace History)
            $checkpoints = Checkpoint::where('product_id', $productId)
                                     ->orderBy('created_at', 'asc')
                                     ->get();

            // 4. Return the data the mobile app expects
            return response()->json([
                'product' => $product,
                'checkpoints' => $checkpoints
            ]);

        } catch (\Exception $e) {
            Log::error("Scan retrieval error for Product ID $productId: " . $e->getMessage());
            return response()->json(['message' => 'An internal error occurred during scan retrieval.'], 500);
        }
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        try {
            $product->load(['farmer', 'reviews.buyer', 'dynamicFieldValues.dynamicField']);

            if (is_array($product->photos_urls)) {
                $photos = $product->photos_urls;
                $absolutePhotos = [];
                foreach ($photos as $photoUrl) {
                    // CRITICAL FIX: Use the confirmed local network IP (192.168.1.6)
                    $absolutePhotos[] = 'http://192.168.1.6:8000' . str_replace(URL::to('/'), '', $photoUrl); 
                }
                $product->photos_urls_array = $absolutePhotos;
            } else {
                $product->photos_urls_array = [];
            }

            return response()->json(['product' => $product]);
        } catch (\Exception $e) {
            Log::error("Product show error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
            return response()->json(['message' => 'An error occurred while fetching product details. Please check server logs.'], 500);
        }
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product)
    {
        $user = Auth::user();
        if ($user->role === 'farmer' && $product->farmer_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only edit your own products.'
            ], 403);
        }

        try {
            $request->validate([
                'farm_name' => 'nullable|string',
                'contact_number' => 'required|string',
                'origin_location_lat' => 'sometimes|numeric',
                'origin_location_lon' => 'sometimes|numeric',
                'origin_location_address' => 'sometimes|string',
                'province' => 'sometimes|string',
                'district' => 'sometimes|string',
                'village' => 'nullable|string',
                'land_area' => 'sometimes|numeric',
                'land_area_unit' => 'sometimes|string',
                'crop_type' => 'sometimes|string',
                'variety' => 'sometimes|string',
                'farming_method' => 'sometimes|string',
                'season' => 'sometimes|string',
                'sowing_date' => 'nullable|date',
                'harvest_date' => 'sometimes|date',
                'estimated_yield' => 'sometimes|numeric',
                'actual_yield' => 'nullable|numeric',
                'quality_grade' => 'sometimes|string',
                'weather_condition' => 'nullable|string',
                'temperature' => 'nullable|numeric',
                'humidity' => 'nullable|numeric',
                'collection_date' => 'sometimes|date',
                'storage_method' => 'sometimes|string',
                'packaging_type' => 'sometimes|string',
                'num_packages' => 'sometimes|integer',
                'weight_per_unit' => 'sometimes|numeric',
                'special_remarks' => 'nullable|string',
                'photos' => 'sometimes|array',
                'photos.*' => 'image|max:2048',
                'quantity' => 'sometimes|numeric',
                'unit' => 'sometimes|string',
            ]);

            $product->farm_name = $request->farm_name;
            $product->contact_number = $request->contact_number;
            $product->origin_location_lat = $request->origin_location_lat;
            $product->origin_location_lon = $request->origin_location_lon;
            $product->origin_location_address = $request->origin_location_address;
            $product->province = $request->province;
            $product->district = $request->district;
            $product->village = $request->village;
            $product->land_area = $request->land_area;
            $product->land_area_unit = $request->land_area_unit;
            $product->crop_type = $request->crop_type;
            $product->variety = $request->variety;
            $product->farming_method = $request->farming_method;
            $product->season = $request->season;
            $product->sowing_date = $request->sowing_date;
            $product->harvest_date = $request->harvest_date;
            $product->estimated_yield = $request->estimated_yield;
            $product->actual_yield = $request->actual_yield;
            $product->quality_grade = $request->quality_grade;
            $product->weather_condition = $request->weather_condition;
            $product->temperature = $request->temperature;
            $product->humidity = $request->humidity;
            $product->collection_date = $request->collection_date;
            $product->storage_method = $request->storage_method;
            $product->packaging_type = $request->packaging_type;
            $product->num_packages = $request->num_packages;
            $product->weight_per_unit = $request->weight_per_unit;
            $product->special_remarks = $request->special_remarks;
            $product->quantity = $request->quantity;
            $product->unit = $request->unit;
            $product->total_weight = $request->num_packages * $request->weight_per_unit;

            if ($user->role === 'farmer') {
                $product->status = 'Edited Pending Approval'; 
            }
            $product->save();

            if ($request->hasFile('photos')) {
                $photoPaths = [];
                foreach ($request->file('photos') as $photo) {
                    $path = $photo->store('public/products/photos');
                    $photoPaths[] = Storage::url($path);
                }
                $product->photos_urls = json_encode($photoPaths);
                $product->save();
            }

            if ($request->has('dynamic_fields')) {
                $dynamicFields = is_string($request->dynamic_fields) ? json_decode($request->dynamic_fields, true) : $request->dynamic_fields;

                if (is_array($dynamicFields)) {
                    foreach ($dynamicFields as $fieldId => $fieldValue) {
                        ProductDynamicFieldValue::updateOrCreate(
                            ['product_id' => $product->id, 'dynamic_field_id' => $fieldId],
                            ['value' => $fieldValue]
                        );
                    }
                }
            }

            return response()->json([
                'message' => 'Product updated successfully.' . ($user->role === 'super_admin' ? ' Super Admin can directly edit. Current status is ' . $product->status : ' Awaiting admin approval.'),
                'product' => $product,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Product update error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
            return response()->json(['message' => 'An error occurred during product update. Please check logs.'], 500);
        }
    }

    /**
     * Download the QR code for a product.
     */
    public function downloadQRCode(Product $product)
    {
        // For simplicity, we just return the URL and the barcode text
        return response()->json([
            'qr_code_url' => $product->qr_code_url,
            'barcode_text' => $product->barcode_text,
            'product_id' => $product->id,
        ]);
    }
}