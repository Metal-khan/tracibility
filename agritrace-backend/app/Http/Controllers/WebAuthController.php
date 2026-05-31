<?php

namespace App\Http\Controllers;

use App\Models\User; // Make sure this is used
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash; // Make sure this is used

class WebAuthController extends Controller
{
    /**
     * Show the admin login form.
     */
    public function showLoginForm()
    {
        return view('admin_login');
    }

    /**
     * Handle web login for admin users.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Attempt to authenticate the user using the 'web' guard (session-based)
        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            // Check if the user has the required admin role
            if ($user->role === 'admin' || $user->role === 'super_admin') {
                $request->session()->regenerate();
                return redirect()->intended('/dashboard');
            } else {
                // Log out non-admin users and show an error
                Auth::logout();
                return back()->withErrors([
                    'email' => 'You do not have administrative access.',
                ])->onlyInput('email');
            }
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }
}