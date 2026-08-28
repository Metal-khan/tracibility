<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * List a product's approved reviews plus the aggregate rating, for
     * display on the buyer-facing Reviews & Ratings screen. Also returns
     * the requesting user's own review (any status), so the mobile app can
     * show "you already reviewed this" instead of a second submission form.
     */
    public function index(Request $request, Product $product)
    {
        $approved = $product->reviews()
            ->where('status', 'approved')
            ->with('buyer:id,name')
            ->latest()
            ->get(['id', 'buyer_id', 'rating', 'comment', 'status', 'created_at']);

        $myReview = $product->reviews()
            ->where('buyer_id', $request->user()->id)
            ->first();

        return response()->json([
            'reviews' => $approved,
            'average_rating' => round((float) $approved->avg('rating'), 1),
            'review_count' => $approved->count(),
            'my_review' => $myReview,
        ]);
    }

    /**
     * Store a new review from a Buyer.
     * This is used by the Buyer role.
     */
    public function store(Request $request, Product $product)
    {
        // Validate the review data
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        // One review per buyer per product — resubmitting would otherwise
        // silently let a buyer pad/spam a product's rating.
        $existing = $product->reviews()->where('buyer_id', $request->user()->id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'You have already reviewed this product.',
                'review' => $existing,
            ], 409);
        }

        // Create the review with 'pending' status [cite: 17]
        $review = $product->reviews()->create([
            'buyer_id' => $request->user()->id, // Link to the authenticated Buyer
            'rating' => $request->rating,
            'comment' => $request->comment,
            'status' => 'pending', // Awaiting moderation [cite: 7, 17]
        ]);

        return response()->json([
            'message' => 'Review submitted successfully. Awaiting moderation.',
            'review' => $review,
        ], 201);
    }

    /**
     * Moderate a review by an Admin.
     * This is used by the Admin role.
     */
    public function moderate(Request $request, Review $review)
    {
        // Validate the moderation action
        $request->validate([
            'action' => 'required|in:approve,reject,hide', // [cite: 16]
        ]);

        // Update the review status based on the admin's action [cite: 9]
        if ($request->action === 'approve') {
            $review->status = 'approved'; // Make the review public
        } elseif ($request->action === 'reject' || $request->action === 'hide') {
            $review->status = $request->action; // Hide temporarily or reject permanently [cite: 21]
        }

        $review->save();

        return response()->json(['message' => 'Review moderated successfully.', 'review' => $review]);
    }
}