<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Checkpoint; // Ensure Checkpoint model is imported
use Illuminate\Http\Request;

class ScanController extends Controller
{
    /**
     * Handle a QR code scan request.
     * This endpoint is public and does not require authentication.
     */
    public function scan(string $productId)
    {
        $product = Product::with(['farmer', 'reviews.buyer', 'dynamicFieldValues.dynamicField'])->find($productId);

        if (!$product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        // Return all product details
        return response()->json([
            'message' => 'Product details retrieved successfully.',
            'product' => $product,
        ]);
    }

    /**
     * Log a checkpoint scan for a Logistics user.
     * This endpoint requires authentication with the 'logistics' role.
     */
    public function logCheckpoint(Request $request, string $productId)
    {
        // 1. Validate the incoming request data (Validation remains correct for payload)
        $request->validate([
            'location_lat' => 'required|numeric',
            'location_lon' => 'required|numeric',
            'location_address' => 'required|string',
            'notes' => 'nullable|string', // Ensure notes is nullable if not required
        ]);

        // 2. Find the product
        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        // 3. Create the checkpoint record
        // CRITICAL FIX: Link to 'user_id' instead of the incorrect 'logistics_id'
        // CRITICAL FIX: Ensure 'notes' and 'timestamp' are included if they are fillable/required
        $checkpoint = Checkpoint::create([
            'product_id' => $product->id,
            'user_id' => $request->user()->id, // Use the authenticated user's ID
            'location_address' => $request->location_address,
            'location_lat' => $request->location_lat,
            'location_lon' => $request->location_lon,
            'notes' => $request->notes ?? 'No notes provided.', // Use provided notes or default
            'timestamp' => now(), // Add timestamp field
        ]);

        return response()->json(['message' => 'Checkpoint logged successfully.', 'checkpoint' => $checkpoint], 201);
    }
}