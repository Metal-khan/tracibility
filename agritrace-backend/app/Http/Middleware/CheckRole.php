<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if the user is authenticated and their role is one of the allowed roles
        if (! $request->user() || ! in_array($request->user()->role, $roles)) {
            return response()->json([
                'message' => 'Unauthorized access. You do not have the required role.'
            ], 403); // 403 means Forbidden
        }

        return $next($request);
    }
}