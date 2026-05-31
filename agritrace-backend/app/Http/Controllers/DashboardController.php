<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use App\Models\DynamicField; 
use App\Models\Review;
use App\Models\Checkpoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class DashboardController extends Controller
{
    public function index()
    {
        // Fetch all user counts and roles (Used for Quick Stats)
        $userCounts = User::select('role', DB::raw('count(*) as count'))->groupBy('role')->get();
        
        // Fetch pending user counts specifically
        $pendingUsersCount = User::where('status', 'pending')->count(); // <--- NEW DYNAMIC DATA
        
        // Fetch review pending counts
        $reviewCounts = Review::select('status', DB::raw('count(*) as count'))->groupBy('status')->get();
        $pendingReviewsCount = $reviewCounts->firstWhere('status', 'pending')->count ?? 0; // <--- DYNAMIC DATA
        
        $totalProducts = Product::count();
        $scanData = Checkpoint::with(['product', 'user'])->orderBy('created_at', 'desc')->get();
        
        // --- Data for Chart Mockup (For a specific Farmer ID, e.g., ID 2) ---
        $sampleFarmer = User::where('role', 'farmer')->first();
        $remainingQuota = $sampleFarmer->remaining_products ?? 0;
        $totalQuota = $sampleFarmer->subscription_plan === 'UNLIMITED' ? 100 : 25; // Use a reasonable total for display
        $usedQuota = $totalQuota - $remainingQuota;
        if ($remainingQuota === 9999) {
            $totalQuota = 1; $usedQuota = 0; // Handle unlimited visual case
        }
        // ----------------------------------------------------------------------

        return view('dashboard', [
            'userCounts' => $userCounts,
            'reviewCounts' => $reviewCounts,
            'totalProducts' => $totalProducts,
            'scanData' => $scanData,
            'pendingUsersCount' => $pendingUsersCount, // <-- PASS TO BLADE
            'pendingReviewsCount' => $pendingReviewsCount, // <-- PASS TO BLADE
            'quotaChartData' => [ // <-- PASS TO BLADE FOR CHART
                'used' => $usedQuota,
                'remaining' => $remainingQuota,
                'total' => $totalQuota,
            ],
        ]);
    }

    public function users()
    {
        // Fetch all users that an Admin can see, including the new subscription fields
        $users = User::whereIn('role', ['farmer', 'buyer', 'logistics', 'admin', 'super_admin'])->get();

        return view('users_management', ['users' => $users]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function createUserForm()
    {
        return view('create_user');
    }

    /**
     * Handles the POST request to store a new user created by the admin.
     */
    public function storeUser(Request $request)
    {
        try {
            // 1. Validation 
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email', 
                'password' => 'required|string|min:8',
                'role' => 'required|string|in:farmer,buyer,logistics,admin,super_admin',
                'status' => 'required|string|in:pending,approved,suspended',
                
                'farm_name' => 'nullable|string|max:255',
                'contact_number' => 'nullable|string|max:255',
            ]);

            // 2. Create the user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password), 
                'role' => $request->role,
                'status' => $request->status,
                
                // Set business details conditionally
                'farm_name' => ($request->role === 'farmer' || $request->role === 'logistics') ? $request->farm_name : null,
                'contact_number' => ($request->role === 'farmer' || $request->role === 'logistics') ? $request->contact_number : null,
                
                // Initialize subscription fields for Farmers/Logistics
                'remaining_products' => ($request->role === 'farmer') ? 0 : null,
                'subscription_plan' => ($request->role === 'farmer') ? 'N/A' : null,
            ]);

            return redirect()->route('dashboard.users')->with('success', 'User account created successfully.');

        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'An unexpected error occurred during user creation.');
        }
    }


    /**
     * Handles the PUT request to update a user's details from the admin dashboard.
     */
    public function updateUser(Request $request, User $user)
    {
        try {
            // 1. Validation 
            $request->validate([
                'name' => 'required|string|max:255',
                'contact_number' => 'nullable|string',
                'farm_name' => 'nullable|string',
                'status' => 'required|string|in:pending,approved,suspended',
            ]);

            // 2. Update user data
            $user->name = $request->name;
            $user->status = $request->status;
            
            // Update role-specific fields (farm name and contact number)
            if (in_array($user->role, ['farmer', 'logistics'])) {
                $user->contact_number = $request->contact_number;
                $user->farm_name = $request->farm_name;
            }

            // 3. Save to database
            $user->save();

            return redirect()->route('dashboard.users.edit', $user->id)
                             ->with('success', 'User profile updated successfully.');

        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'An unexpected error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Handles the PUT request to update a product's details and status during moderation.
     */
    public function updateProduct(Request $request, Product $product)
    {
        try {
            // 1. Validation 
            $request->validate([
                'status' => 'required|string|in:Active,Pending Approval,Rejected,Suspended,Edited Pending Approval',
                'quality_grade' => 'nullable|string',
                'crop_type' => 'required|string',
                'variety' => 'required|string',
                'farming_method' => 'required|string',
                'harvest_date' => 'required|date',
                'packaging_type' => 'required|string',
                'weight_per_unit' => 'required|numeric',
                'origin_location_address' => 'required|string',
                'special_remarks' => 'nullable|string',
                'contact_number' => 'nullable|string',
            ]);

            // 2. Update product data
            $product->status = $request->status;
            $product->quality_grade = $request->quality_grade;
            $product->crop_type = $request->crop_type;
            $product->variety = $request->variety;
            $product->farming_method = $request->farming_method;
            $product->harvest_date = $request->harvest_date;
            $product->packaging_type = $request->packaging_type;
            $product->weight_per_unit = $request->weight_per_unit;
            $product->origin_location_address = $request->origin_location_address;
            $product->special_remarks = $request->special_remarks;
            $product->contact_number = $request->contact_number;
            
            // Re-calculate total weight (optional, but good practice)
            // Assuming quantity is implicitly derived or available. For now, we skip total weight update unless needed.

            // 3. Save to database
            $product->save();

            return redirect()->route('dashboard.products.view', $product->id)
                             ->with('success', 'Product details and status updated successfully.');

        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'An unexpected error occurred during product update: ' . $e->getMessage());
        }
    }

    /**
     * Show a single product's details page (View Product).
     */
    public function viewProductDetails(Product $product)
    {
        // Load relationships for complete data display
        $product->load(['farmer', 'reviews.user', 'checkpoints.user', 'dynamicFieldValues.dynamicField']); 
        
        return view('view_product', ['product' => $product]);
    }

    /**
     * CRITICAL FIX: Show the form for editing a product (Edit Product).
     */
    public function editProductForm(Product $product)
    {
        // Load relationships needed for form pre-population (Farmer contact, etc.)
        $product->load('farmer'); 
        
        // Dynamic Fields are no longer used, so we only pass the product
        
        return view('edit_product', [
            'product' => $product,
        ]);
    }

    public function products()
    {
        // Fetch all products with their farmer relationship
        $products = Product::with('farmer')->get();

        return view('product_moderation', ['products' => $products]);
    }

    public function dynamicFields()
    {
        // Dynamic Fields removed: return an empty view or redirect (for now, we pass data)
        $fields = DynamicField::all();
        return view('dynamic_fields', ['fields' => $fields]);
    }


    public function reviews()
    {
        // Fetch all reviews, eager loading product and user (buyer) details
        $reviews = Review::with(['product', 'user'])->latest()->get(); 

        return view('review_moderation', ['reviews' => $reviews]);
    }
    
    // =================================================================
    // SUBSCRIPTION MANAGEMENT METHODS
    // =================================================================
    
    /**
     * Display the list of farmer subscriptions (GET /admin/subscriptions).
     */
    public function subscriptionManagement() 
    {
        // Fetch only users with 'farmer' role, retrieving all subscription and profile fields
        $farmers = User::where('role', 'farmer')->get();
        return view('subscription_management', ['farmers' => $farmers]);
    }
    
    /**
     * Show a single farmer's subscription detail page (GET /admin/subscriptions/detail/{farmer}).
     */
    public function subscriptionDetail(User $farmer)
    {
        // The User model automatically retrieves all subscription fields
        return view('subscription_detail', ['farmer' => $farmer]);
    }
    
    /**
     * Update a farmer's status, plan, and end date (PUT /admin/subscriptions/update/status/{farmer}).
     */
    public function updateSubscriptionStatus(Request $request, User $farmer)
    {
        try {
            $request->validate([
                'new_status' => 'required|string|in:pending,approved,suspended',
                'subscription_plan' => 'nullable|string', 
                'subscription_end_date' => 'nullable|date', 
            ]);
            
            // 1. Update Status
            $farmer->status = $request->new_status;
            
            // 2. Update Plan and Dates if provided
            if ($request->filled('subscription_plan')) {
                 $farmer->subscription_plan = $request->subscription_plan;
            }
            if ($request->filled('subscription_end_date')) {
                 $farmer->subscription_end_date = $request->subscription_end_date;
            }
            
            // 3. Save all changes
            $farmer->save();
            
            return redirect()->route('admin.subscriptions.detail', $farmer->id)->with('success', 'Account status and plan updated successfully.');
            
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        }
    }
    
    /**
     * Update a farmer's remaining product quota (PUT /admin/subscriptions/update/quota/{farmer}).
     */
    public function updateSubscriptionQuota(Request $request, User $farmer)
    {
        try {
            // NOTE: Validation allows negative numbers for subtraction
            $request->validate(['products_to_add' => 'required|integer|numeric']);
            
            $productsToChange = (int)$request->products_to_add;
            
            // 1. Handle Unlimited plan case (9999)
            if ($farmer->remaining_products === 9999) {
                 return redirect()->route('admin.subscriptions.detail', $farmer->id)->with('warning', 'Quota is UNLIMITED and cannot be manually adjusted.');
            }
            
            // 2. Check for subtraction and prevent negative quotas
            if (($farmer->remaining_products + $productsToChange) < 0) {
                 return redirect()->back()->withErrors(['products_to_add' => 'Quota deduction failed. The remaining product count cannot be negative.']);
            }
            
            // 3. Perform the calculation
            $currentQuota = $farmer->remaining_products ?? 0;
            $farmer->remaining_products = $currentQuota + $productsToChange;
            $farmer->save();
            
            $message = $productsToChange >= 0 
                ? "Successfully added {$productsToChange} products to quota."
                : "Successfully deducted " . abs($productsToChange) . " products from quota.";
            
            return redirect()->route('admin.subscriptions.detail', $farmer->id)->with('success', $message);
            
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        }
    }
}