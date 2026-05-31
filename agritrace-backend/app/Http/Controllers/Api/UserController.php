<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Product; 
use App\Models\Checkpoint;

class UserController extends Controller
{
    /**
     * Updates the user's subscription status and remaining products.
     * Accessible only by the Farmer role after selecting a plan.
     */
    public function updateSubscription(Request $request)
    {
        $user = $request->user();

        // 1. Validate the incoming plan data
        $request->validate([
            'plan_id' => 'required|string',
            'products_count' => 'required|integer',
            'payment_successful' => 'required|boolean',
            'status' => 'required|string|in:approved', // Expecting 'approved' status
        ]);

        if (!$request->payment_successful) {
            return response()->json(['message' => 'Payment was not confirmed.'], 400);
        }

        // 2. Ensure user is the expected role (extra safety check)
        if ($user->role !== 'farmer') {
             return response()->json(['message' => 'Only Farmer accounts require subscription activation.'], 403);
        }
        
        // 3. Update the user's status and subscription details
        // NOTE: You must ensure 'remaining_products' column exists on the 'users' table.
        $user->subscription_plan = $request->plan_id;
        $user->subscription_start_date = now();
        $user->subscription_end_date = now()->addYear(); // Set subscription for one year
        $user->status = 'approved'; // Set status to approved/active
        $user->remaining_products = $request->products_count; // Store product count
        $user->save();

        return response()->json([
            'message' => 'Subscription activated successfully. Welcome!',
            'status' => $user->status,
        ]);
    }

    /**
     * Allows a user to update their own profile information.
     * Requires authentication.
     */
    public function update(Request $request, User $user)
    {
        // Policy check: Ensure the user is updating their own record
        if ($request->user()->id !== $user->id) {
            return response()->json(['message' => 'You can only update your own profile.'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_number' => 'sometimes|string|nullable',
            // Add other updatable fields as necessary
        ]);

        $user->update($request->only(['name', 'contact_number']));

        return response()->json(['message' => 'Profile updated successfully.', 'user' => $user]);
    }
    /**
     * Fetches scan history based on the user's role.
     * Buyer: Fetches products they have scanned (by checking checkpoints).
     * Farmer: Fetches the products they created and provides scan analytics.
     */
    public function getScanHistory(Request $request, string $role)
    {
        $user = $request->user();

        // Safety check to ensure the requested role matches the authenticated user's role
        if ($user->role !== $role) {
             return response()->json(['message' => 'Role mismatch. Cannot fetch history for another role.'], 403);
        }

        if ($role === 'buyer') {
            // Logic for Buyer (End User)
            
            // CRITICAL FIX: Changed 'location' column to 'location_address'
            $history = Checkpoint::where('user_id', $user->id)
                ->where('location_address', 'LIKE', '%Consumer Scan%') // Use the correct column name
                ->selectRaw('product_id, MAX(created_at) as scan_timestamp')
                ->groupBy('product_id')
                ->with(['product:id,crop_type,variety']) // Load product name details
                ->orderByDesc('scan_timestamp')
                ->get();

            // Map results for the mobile app
            $mappedHistory = $history->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    // Check if product relationship is loaded before accessing
                    'product_name' => $item->product ? ($item->product->crop_type . ' - ' . $item->product->variety) : 'Unknown Product',
                    'scan_timestamp' => $item->scan_timestamp,
                    'type' => 'Scanned', // Default status for buyer's own history
                ];
            });

            return response()->json(['history' => $mappedHistory]);
            
        } elseif ($role === 'farmer') {
            // Logic for Farmer (SME)
            // 1. Find all products created by this farmer.
            // 2. Count total scans/checkpoints for each product.

            $products = Product::where('farmer_id', $user->id)
                ->withCount('checkpoints') // Assumes a 'checkpoints' relationship exists on the Product model
                ->get();
            
            // Map results for the mobile app
            $mappedHistory = $products->map(function ($product) {
                // Fetch the latest checkpoint location/time for display purposes
                $latestCheckpoint = Checkpoint::where('product_id', $product->id)
                                              ->orderByDesc('created_at')
                                              ->first();

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->crop_type . ' - ' . $product->variety,
                    'scan_timestamp' => $latestCheckpoint->created_at ?? $product->created_at,
                    'type' => 'Created', // Base status
                    'total_scans' => $product->checkpoints_count, // Display total scans
                ];
            });

            return response()->json(['history' => $mappedHistory]);

        } else {
            return response()->json(['message' => 'History retrieval not implemented for this role.'], 403);
        }
    }
}