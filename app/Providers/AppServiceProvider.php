<?php

namespace App\Providers;

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
        if (
            config('app.env') !== 'local' || 
            request()->header('x-forwarded-proto') === 'https' || 
            request()->server('HTTP_X_FORWARDED_PROTO') === 'https' || 
            str_contains(request()->getHost(), 'ngrok') ||
            str_contains(request()->getHost(), 'trycloudflare') ||
            str_contains(request()->getHost(), 'localtunnel') ||
            str_contains(request()->getHost(), 'pinggy')
        ) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
