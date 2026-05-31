<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User; // CRITICAL FIX: Import the User model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash; // Ensure Hash is imported for register method

class AuthController extends Controller
{
    /**
     * Handle user login and token generation.
     */
    public function login(Request $request)
    {
        // Validate the incoming request data
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Attempt to authenticate the user
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid login credentials.'
            ], 401);
        }

        // If authentication is successful, get the authenticated user
        $user = $request->user();

        // Create a new Sanctum API token for the user
        $token = $user->createToken('auth-token')->plainTextToken;

        // Return a success response with the token
        // The mobile app requires the full 'user' object with 'role' and 'status'.
        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Login successful.'
        ]);
    }

    /**
     * Handle user logout and revoke the current token.
     */
    public function logout(Request $request)
    {
        // Revoke the token that was used to authenticate the current request
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', 'string', 'in:farmer,buyer,logistics'],
            
            // Farmer fields (New mobile app inputs)
            'farm_name' => 'nullable|string', 
            'contact_number' => 'nullable|string', 
            
            // Logistics fields (Original placeholders)
            'company_name' => 'nullable|string', 
            'contact_info' => 'nullable|string', 
            
            // Legacy/Optional fields from older schema/forms
            'farm_details' => 'nullable|string', 
            'certifications' => 'nullable|string',
        ]);

        // Determine initial status: Farmer/Logistics need approval, Buyer gets instant access.
        $initialStatus = ($request->role === 'farmer' || $request->role === 'logistics') ? 'pending' : 'approved';
        
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $initialStatus,
            
            // Map Farmer-specific fields (from the mobile app's updated form)
            'farm_name' => $request->role === 'farmer' ? $request->farm_name : null,
            'contact_number' => $request->role === 'farmer' ? $request->contact_number : null,
            
            // Map Logistics-specific fields
            'company_name' => $request->role === 'logistics' ? $request->company_name : null,
            'contact_info' => $request->role === 'logistics' ? $request->contact_info : null,

            // Legacy/Original fields (using null to prevent DB errors if not present)
            'farm_details' => $request->farm_details, 
            'certifications' => $request->certifications, 
        ]);
        
        $message = ($request->role === 'farmer' || $request->role === 'logistics')
            ? 'Registration successful. Account is pending approval/subscription.'
            : 'Registration successful. Please login.';

        return response()->json([
            'message' => $message,
            'user' => $user
        ], 201);
    }
}