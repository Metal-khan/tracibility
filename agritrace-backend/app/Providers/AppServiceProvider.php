<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Login/register only get the global 60/min API throttle otherwise,
        // which is far too loose for credential-guessing attempts. Keyed by
        // email+IP together so one bad actor can't lock out a real user by
        // hammering their email from a different address than the attacker
        // is throttled on.
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        // Separate bucket from 'auth' above — a real register-then-reset-
        // then-login sequence is 3+ requests against the same email in
        // quick succession, and sharing one budget with login/register
        // would let a legitimate user lock themselves out of their own
        // account recovery.
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });
    }
}
