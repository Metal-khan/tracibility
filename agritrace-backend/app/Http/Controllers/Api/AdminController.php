<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DynamicField;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB; // Make sure DB is imported for analytics methods

class AdminController extends Controller
{
    // --- User Management Methods ---

    /**
     * Get a list of all users.
     * Accessible by Super Admin and Admin.
     */
    public function getUsers(Request $request)
    {
        // Admins can manage Farmers, Buyers, Logistics. Super Admins can manage everyone.
        if ($request->user()->role === 'admin') {
            $users = User::whereIn('role', ['farmer', 'buyer', 'logistics'])->get();
        } else {
            // Super Admin can see all users, including other Admins
            $users = User::all();
        }

        return response()->json($users);
    }

    /**
     * Get a specific user's data.
     * Accessible by Admin and Super Admin.
     */
    public function showUser(User $user)
    {
        return response()->json(['user' => $user]); // <-- Changed here
    }

    /**
     * Update a user's details.
     * Accessible by Admin and Super Admin.
     */
    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['sometimes', 'string', 'in:farmer,buyer,logistics,admin,super_admin'],
            'status' => ['sometimes', 'string', 'in:approved,pending,inactive'],
        ]);

        // Security check: Admins cannot update Super Admins
        if ($request->user()->role === 'admin' && $user->role === 'super_admin') {
            return response()->json(['message' => 'You are not authorized to update a Super Admin.'], 403);
        }

        // Security check: A user cannot update their own role
        if ($user->id === $request->user()->id && $request->has('role') && $request->role !== $user->role) {
            return response()->json(['message' => 'You cannot change your own role.'], 403);
        }

        $user->update($request->only(['name', 'email', 'role', 'status']));

        // Handle password update if provided
        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:8']);
            $user->password = Hash::make($request->password);
            $user->save();
        }

        return response()->json(['message' => 'User updated successfully!', 'user' => $user]);
    }

    /**
     * Delete a user.
     * Accessible by Admin (for Farmer/Buyer/Logistics) and Super Admin (for all).
     */
    public function destroyUser(Request $request, User $user)
    {
        // Security check: Prevent a user from deleting themselves
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 403);
        }

        // Security check: Admins can't delete other Admins or Super Admins
        if ($request->user()->role === 'admin' && ($user->role === 'admin' || $user->role === 'super_admin')) {
            return response()->json(['message' => 'You are not authorized to delete this user.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    /**
     * Store a new user created via the dashboard.
     * Accessible by Admin and Super Admin.
     */
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', 'string', 'in:farmer,buyer,logistics,admin,super_admin'], // Allow super_admin here for actual SuperAdmin
            'status' => ['required', 'string', 'in:approved,pending,inactive'],
        ]);

        // Security check: Admins cannot create Super Admins
        if ($request->user()->role === 'admin' && $request->role === 'super_admin') {
            return response()->json(['message' => 'You are not authorized to create a Super Admin.'], 403);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'User created successfully!',
            'user' => $user
        ], 201);
    }

    /**
     * Update a user's status (e.g., approved, pending, inactive).
     * Accessible by Admin and Super Admin.
     */
    public function updateUserStatus(Request $request, User $user)
    {
        $request->validate([
            'status' => ['required', 'string', 'in:approved,pending,inactive'],
        ]);

        // Security check: Admins cannot change Super Admin status
        if ($request->user()->role === 'admin' && $user->role === 'super_admin') {
            return response()->json(['message' => 'You are not authorized to update a Super Admin.'], 403);
        }

        $user->status = $request->status;
        $user->save();

        return response()->json(['message' => 'User status updated successfully.', 'user' => $user]);
    }

    // --- Product Moderation Methods ---

    /**
     * Approve or reject a product edit.
     * Accessible by Admin.
     */
    public function moderateProductEdit(Request $request, Product $product)
    {
        $request->validate(['action' => 'required|in:approve,reject']);

        if ($request->action === 'approve') {
            $product->status = 'Active';
            $message = 'Product edit approved.';
        } else {
            $product->status = 'Active'; // Revert to Active if rejected
            $message = 'Product edit rejected.';
        }

        $product->save();

        return response()->json(['message' => $message]);
    }

    /**
     * Delete a product.
     * Only accessible by Super Admin.
     */
    public function deleteProduct(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    // --- Dynamic Field Management Methods ---

    /**
     * Get a list of all dynamic fields.
     * Accessible by Super Admin and Admin.
     */
    public function getDynamicFields()
    {
        $fields = DynamicField::all();

        return response()->json($fields);
    }

    /**
     * Create a new dynamic field.
     * Accessible by Super Admin and Admin.
     */
    public function createDynamicField(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:dynamic_fields,name',
                'field_type' => ['required', 'string', Rule::in(['Text', 'Number', 'Date', 'Boolean', 'Dropdown', 'Multi-select'])],
                'is_required' => 'boolean',
                'default_value' => 'nullable|string',
                'selection_options' => 'nullable|array',
                'is_general' => 'boolean',
                'crop_types' => 'array',
            ]);

            $field = DynamicField::create([
                'name' => $request->name,
                'field_type' => $request->field_type,
                'is_required' => $request->is_required ?? false,
                'default_value' => $request->default_value,
                'selection_options' => $request->selection_options,
                'is_general' => $request->is_general ?? false,
                'created_by' => $request->user()->id,
            ]);

            // Link the field to specific crop types
            if (!$field->is_general && !empty($request->crop_types)) {
                foreach ($request->crop_types as $cropType) {
                    $field->cropTypes()->create(['crop_type' => $cropType]);
                }
            }

            return response()->json([
                'message' => 'Dynamic field created successfully.',
                'field' => $field,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    /**
     * Update an existing dynamic field.
     * Accessible by Super Admin and Admin.
     */
    public function updateDynamicField(Request $request, DynamicField $dynamicField)
    {
        try {
            $request->validate([
                'name' => ['sometimes', 'string', Rule::unique('dynamic_fields', 'name')->ignore($dynamicField->id)],
                'field_type' => ['sometimes', 'string', Rule::in(['Text', 'Number', 'Date', 'Boolean', 'Dropdown', 'Multi-select'])],
                'is_required' => 'sometimes|boolean',
                'default_value' => 'nullable|string',
                'selection_options' => 'nullable|array',
                'is_general' => 'sometimes|boolean',
                'crop_types' => 'array',
            ]);

            $dynamicField->update($request->all());

            return response()->json(['message' => 'Dynamic field updated successfully.']);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    /**
     * Delete a dynamic field.
     * Accessible by Super Admin and Admin.
     */
    public function deleteDynamicField(DynamicField $dynamicField)
    {
        $dynamicField->delete();

        return response()->json(['message' => 'Dynamic field deleted successfully.']);
    }

    /**
     * Get details of a specific dynamic field.
     * Accessible by Super Admin and Admin.
     */
    public function showDynamicField(DynamicField $dynamicField)
    {
        $dynamicField->load('cropTypes'); // Load the associated crop types

        return response()->json($dynamicField);
    }

    public function updateSubscription(Request $request, User $user)
    {
        // Only allow updating subscription for 'farmer' role
        if ($user->role !== 'farmer') {
            return response()->json(['message' => 'Subscription management is only for Farmer users.'], 400);
        }

        $request->validate([
            'subscription_status' => ['required', 'string', 'in:active,inactive,trial,expired,cancelled'],
            'subscription_plan' => 'nullable|string',
            'subscription_start_date' => 'nullable|date',
            'subscription_end_date' => 'nullable|date|after_or_equal:subscription_start_date',
            'last_payment_date' => 'nullable|date',
        ]);

        $user->fill($request->only([
            'subscription_status',
            'subscription_plan',
            'subscription_start_date',
            'subscription_end_date',
            'last_payment_date',
        ]));
        $user->save();

        return response()->json(['message' => 'Farmer subscription updated successfully.', 'user' => $user]);
    }
}