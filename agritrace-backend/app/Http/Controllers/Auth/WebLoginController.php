<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WebLoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Attempt to authenticate the user using the 'web' guard
        if (Auth::guard('web')->attempt($credentials)) {
            $request->session()->regenerate();
            // Check if the authenticated user has the 'admin' or 'super_admin' role
            if ($request->user()->role === 'admin' || $request->user()->role === 'super_admin') {
                return redirect()->intended('/dashboard');
            }

            // If not an admin, log them out and redirect to login
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'email' => 'You do not have administrative access.',
            ])->onlyInput('email');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }
}