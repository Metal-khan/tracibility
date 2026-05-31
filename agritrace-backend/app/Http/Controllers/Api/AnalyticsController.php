<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Models\Checkpoint;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get product counts over time.
     * Accessible by Admin and Super Admin.
     */
    public function getProductCounts(Request $request)
    {
        // Get product counts grouped by date
        $productCounts = Product::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
                                ->groupBy('date')
                                ->orderBy('date')
                                ->get();

        return response()->json($productCounts);
    }

    /**
     * Get scan analytics and geolocation data.
     * Accessible by Admin and Super Admin.
     */
    public function getScanAnalytics(Request $request)
    {
        // Get scan data with product and user information
        $scanData = Checkpoint::with(['product', 'logistics'])
                                ->select('id', 'product_id', 'logistics_id', 'location_lat', 'location_lon', 'location_address', 'created_at')
                                ->orderBy('created_at', 'desc')
                                ->get();

        return response()->json($scanData);
    }

    /**
     * Get user activity reports.
     * Accessible by Admin and Super Admin.
     */
    public function getUserActivity(Request $request)
    {
        // Get user registration counts by role
        $userCounts = User::select('role', DB::raw('count(*) as count'))
                          ->groupBy('role')
                          ->get();

        // Get total reviews and their status
        $reviewCounts = Review::select('status', DB::raw('count(*) as count'))
                              ->groupBy('status')
                              ->get();

        return response()->json([
            'user_registrations_by_role' => $userCounts,
            'review_moderation_status' => $reviewCounts,
        ]);
    }
}