<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\WebAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Public route for the web dashboard login page
Route::get('/admin-login', function () {
    return view('admin_login');
})->name('login');
Route::post('/admin-login', [WebAuthController::class, 'login']);

// Protected routes for the web dashboard (Admin/Super Admin only)
Route::middleware(['auth', 'role:admin,super_admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // --- User Management ---
    Route::get('/dashboard/users', [DashboardController::class, 'users'])->name('dashboard.users');
    Route::get('/dashboard/users/create', [DashboardController::class, 'createUserForm'])->name('dashboard.users.create');
    
    // CRITICAL FIX: POST route to handle new user creation submission
    Route::post('/dashboard/users/create', [DashboardController::class, 'storeUser'])->name('dashboard.users.store');

    Route::get('/dashboard/users/{user}/edit', [DashboardController::class, 'editUserForm'])->name('dashboard.users.edit');
    Route::put('/dashboard/users/{user}/edit', [DashboardController::class, 'updateUser'])->name('dashboard.users.update');

    // --- Product Management ---
    Route::get('/dashboard/products', [DashboardController::class, 'products'])->name('dashboard.products');
    Route::get('/dashboard/products/{product}/view', [DashboardController::class, 'viewProductDetails'])->name('dashboard.products.view');
    Route::get('/dashboard/products/{product}/edit', [DashboardController::class, 'editProductForm'])->name('dashboard.products.edit');

    // CRITICAL FIX: PUT route to handle product update submission
    Route::put('/dashboard/products/{product}/edit', [DashboardController::class, 'updateProduct'])->name('dashboard.products.update');

    // --- Dynamic Field Management ---
    Route::get('/dashboard/dynamic-fields', [DashboardController::class, 'dynamicFields'])->name('dashboard.dynamic-fields');

    // --- Review Moderation Pages ---
    Route::get('/dashboard/reviews', [DashboardController::class, 'reviews'])->name('dashboard.reviews');

    // --- SUBSCRIPTION MANAGEMENT & ACTIONS ---
    Route::get('/dashboard/subscriptions', [DashboardController::class, 'subscriptionManagement'])->name('admin.subscriptions');
    Route::get('/dashboard/subscriptions/detail/{farmer}', [DashboardController::class, 'subscriptionDetail'])->name('admin.subscriptions.detail');
    Route::put('/dashboard/subscriptions/update/status/{farmer}', [DashboardController::class, 'updateSubscriptionStatus'])->name('admin.subscriptions.update_status');
    Route::put('/dashboard/subscriptions/update/quota/{farmer}', [DashboardController::class, 'updateSubscriptionQuota'])->name('admin.subscriptions.update_quota');
});

// Logout route for the web dashboard
Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('login');
})->name('logout');

// Redirect the root URL to the login page
Route::get('/', function () {
    return redirect()->route('login');
});