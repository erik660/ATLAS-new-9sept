<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (! Auth::guard('admin')->check()) {
            return redirect()->route('login');
        }

        if (Auth::guard('admin')->user()->role !== 'admin') {
            return redirect()->route('login')->with('error', 'Akses ditolak. Silakan login dengan akun yang sesuai.');
        }

        return $next($request);
    }
}
