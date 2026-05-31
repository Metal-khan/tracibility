<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string[]  $roles  The roles allowed to access this route (e.g., 'buyer', 'logistics').
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1. Check if the user is authenticated.
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // 2. Get the authenticated user
        $user = Auth::user();

        // 3. CRITICAL FIX: Explicitly cast the user's role to a string before checking the array.
        // This prevents type-mismatch errors that often occur when retrieving user attributes from the DB.
        $userRole = (string)$user->role;

        // 4. Check if the user's role is NOT in the list of allowed roles.
        // $roles is an array passed from api.php (e.g., ['buyer', 'logistics'])
        if (!in_array($userRole, $roles)) {
            // This line generates the "Unauthorized access. You do not have the required role." error.
            return response()->json(['message' => 'Unauthorized access. You do not have the required role.'], 403);
        }

        // If the role is authorized, proceed with the request.
        return $next($request);
    }
}