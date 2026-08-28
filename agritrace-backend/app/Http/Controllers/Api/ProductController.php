<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesTraceTokens;
use App\Models\Product;
use App\Models\ProductDynamicFieldValue;
use App\Models\Checkpoint;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    use ResolvesTraceTokens;

    /**
     * Display a listing of products.
     * This will show products created by the authenticated farmer.
     */
    public function index(Request $request)
    {
        // Get products created by the logged-in user
        // photos_urls_array and qr_code_url are computed accessors on the
        // Product model (see app/Models/Product.php) — nothing to build here.
        $products = $request->user()->products()->get();

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

            // 9999 is the sentinel for an unlimited/admin-granted quota (see
            // DashboardController::updateSubscription) — everyone else must
            // have at least one product left. This was previously enforced
            // nowhere: a farmer's remaining_products count never actually
            // blocked or decremented on product creation, so the mobile
            // subscription screen's "N of M remaining" never changed.
            if ($user->remaining_products !== 9999 && $user->remaining_products <= 0) {
                return response()->json([
                    'message' => 'You have no products remaining on your current plan. Please upgrade to add more.',
                ], 403);
            }

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

            if ($user->remaining_products !== 9999) {
                $user->decrement('remaining_products');
            }

            // 3. Handle image uploads — stored on the private 'local' disk
            // (not under 'public/'), so they're never directly reachable by
            // URL; served only through the authenticated photo() route below.
            $photoPaths = [];
            foreach ($request->file('photos') as $photo) {
                $photoPaths[] = $photo->store('products/photos');
            }
            $product->photos_urls = $photoPaths; // plain array — the model's 'array' cast handles JSON encoding; json_encode()ing it here too double-encoded it, which is why photos_urls_array came back empty
            $product->save();

            // 4. Generate and save the QR code
            $productId = $product->id;

            $datePart = now()->format('dmy');
            $paddedProductId = str_pad($productId, 2, '0', STR_PAD_LEFT);
            $humanIdentifier = "AGRI000{$datePart}{$paddedProductId}";

            // The QR code encodes a signed, opaque token — not the raw
            // sequential product ID — so it can't be enumerated/guessed.
            // See makeTraceToken()/resolveTraceToken() above. The SVG file
            // itself lives on the private disk at a path derived purely
            // from the product ID (see Product::qrCodeStoragePath()) —
            // that's just local bookkeeping and unrelated to what the QR
            // image encodes; it's served only through the authenticated
            // qrImage() route below, never a public storage URL.
            $traceToken = $this->makeTraceToken($productId);
            $qrDirectory = 'qrcodes';

            if (!Storage::disk('local')->exists($qrDirectory)) {
                Storage::disk('local')->makeDirectory($qrDirectory);
            }

            $qrSvg = QrCode::format('svg')->size(300)->generate($traceToken);

            Storage::disk('local')->put($product->qrCodeStoragePath(), $qrSvg);

            $product->barcode_text = $humanIdentifier;
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
            $resolvedId = $this->resolveTraceToken((string) $productId);

            if ($resolvedId === null) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            // 2. Fetch the Product
            $product = Product::with([
                'farmer' => function ($query) {
                    $query->select('id', 'name', 'email', 'farm_name', 'contact_number', 'status');
                },
                'reviews.buyer',
                'dynamicFieldValues.dynamicField'
            ])->find($resolvedId);

            if (!$product) {
                return response()->json(['message' => 'Product not found.'], 404);
            }

            // 3. Fetch the Checkpoints (Trace History)
            $checkpoints = Checkpoint::where('product_id', $resolvedId)
                                     ->orderBy('created_at', 'asc')
                                     ->get();

            // 4. Aggregate stats for the farmer's Company Profile screen —
            // previously hardcoded mock values on the mobile side.
            $farmerStats = null;
            if ($product->farmer) {
                $farmerProductIds = Product::where('farmer_id', $product->farmer_id)->pluck('id');
                $approvedReviews = Review::whereIn('product_id', $farmerProductIds)->where('status', 'approved');

                $farmerStats = [
                    'total_products_posted' => $farmerProductIds->count(),
                    'overall_review_rating' => round((float) $approvedReviews->avg('rating'), 1),
                    'review_count' => $approvedReviews->count(),
                ];
            }

            // 5. Return the data the mobile app expects
            return response()->json([
                'product' => $product,
                'checkpoints' => $checkpoints,
                'farmer_stats' => $farmerStats,
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
                    $photoPaths[] = $photo->store('products/photos');
                }
                $product->photos_urls = $photoPaths; // plain array — the model's 'array' cast handles JSON encoding; json_encode()ing it here too double-encoded it, which is why photos_urls_array came back empty
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
        // qr_code_data_uri/qr_code_html let the mobile app render, download,
        // share, and print the code from this one authenticated response —
        // no follow-up request to qrImage() needed.
        return response()->json([
            'qr_code_url' => $product->qr_code_url,
            'qr_code_data_uri' => $product->qr_code_data_uri,
            'qr_code_html' => $product->qr_code_html,
            'barcode_text' => $product->barcode_text,
            'product_id' => $product->id,
        ]);
    }

    /**
     * Serve a product's QR code SVG. Gated by the same auth+role
     * requirement as viewing the product's data at all (see /scan/{id} and
     * this route's middleware in routes/api.php) — not a public storage URL.
     */
    public function qrImage(Product $product)
    {
        $path = $product->qrCodeStoragePath();

        if (!Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return Storage::disk('local')->response($path, null, [
            'Content-Type' => 'image/svg+xml',
        ]);
    }

    /**
     * Serve one of a product's photos. Gated the same way as qrImage()
     * above. $filename must match the basename of one of this product's
     * own stored photos_urls entries — otherwise 404, rather than trusting
     * the path segment to read an arbitrary file off the private disk.
     */
    public function photo(Product $product, string $filename)
    {
        $photos = is_array($product->photos_urls) ? $product->photos_urls : [];

        $relativePath = collect($photos)->first(fn ($stored) => basename($stored) === $filename);

        if (!$relativePath || !Storage::disk('local')->exists($relativePath)) {
            abort(404);
        }

        return Storage::disk('local')->response($relativePath);
    }
}