<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful; // Only for API if needed

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Apply Sanctum's stateful middleware ONLY to the 'api' group
        // (or if explicitly building a SPA with session-based Sanctum API auth)
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        // Register our custom role middleware alias
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);

        // Laravel's default 'web' middleware group (session, CSRF, etc.)
        // is implicitly loaded unless you explicitly override it.
        // We do not need to add anything here for basic session auth.
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();