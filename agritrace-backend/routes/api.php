<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ScanController; 
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

// Public routes
Route::middleware('throttle:auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// Protected routes 
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Core Authenticated Routes
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::put('/user/{user}', [UserController::class, 'update']);
    
    // SCAN HISTORY ROUTE 
    Route::middleware('role:buyer,farmer,logistics,admin,super_admin')->group(function () {
        Route::get('/history/{role}', [UserController::class, 'getScanHistory']); 
    });

    // Trace View 
    Route::middleware('role:buyer,logistics,farmer,admin,super_admin')->group(function () {
        Route::get('/scan/{productId}', [ProductController::class, 'scan']); 
    });

    // Checkpoint Logging 
    Route::middleware('role:logistics,buyer')->group(function () {
        Route::post('/checkpoints/{productId}', [ScanController::class, 'logCheckpoint']);
    });
    
    // Buyer specific actions
    Route::middleware('role:buyer')->group(function () {
        Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);
    });
    
    // Farmer/Subscription Actions
    Route::middleware('role:farmer')->group(function () {
        Route::post('/update-subscription', [UserController::class, 'updateSubscription']); 
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/my', [ProductController::class, 'index']);
    });

    // Product Update & General View
    Route::middleware('role:farmer,super_admin')->group(function () {
        Route::post('/products/{product}', [ProductController::class, 'update']);
    });

    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/products/{product}/qrcode', [ProductController::class, 'downloadQRCode']);

    // Web Dashboard Routes 
    Route::middleware('role:admin,super_admin')->group(function () {
        // User Management
        Route::get('/admin/users', [AdminController::class, 'getUsers']);
        Route::post('/admin/users', [AdminController::class, 'storeUser']);
        Route::post('/admin/users/{user}/update-status', [AdminController::class, 'updateUserStatus']);
        Route::get('/admin/users/{user}', [AdminController::class, 'showUser']);
        Route::put('/admin/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{user}', [AdminController::class, 'destroyUser']);
        // Product Moderation
        Route::post('/admin/products/{product}/moderate', [AdminController::class, 'moderateProductEdit']);
        Route::delete('/admin/products/{product}', [AdminController::class, 'deleteProduct']);
        // Dynamic Field Management
        Route::get('/admin/dynamic-fields', [AdminController::class, 'getDynamicFields']);
        Route::post('/admin/dynamic-fields', [AdminController::class, 'createDynamicField']);
        Route::get('/admin/dynamic-fields/{dynamicField}', [AdminController::class, 'showDynamicField']);
        Route::put('/admin/dynamic-fields/{dynamicField}', [AdminController::class, 'updateDynamicField']);
        Route::delete('/admin/dynamic-fields/{dynamicField}', [AdminController::class, 'deleteDynamicField']);
        // Analytics Dashboard Routes
        Route::get('/analytics/product-counts', [AnalyticsController::class, 'getProductCounts']);
        Route::get('/analytics/scans', [AnalyticsController::class, 'getScanAnalytics']);
        Route::get('/analytics/user-activity', [AnalyticsController::class, 'getUserActivity']);
        // Review Moderation Routes
        Route::post('/reviews/{review}/moderate', [ReviewController::class, 'moderate']);
    });
});