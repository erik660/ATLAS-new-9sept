<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CabangMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }

        if (Auth::user()->role !== 'cabang') {
            return redirect()->route('login')->with('error', 'Akses ditolak. Silakan login dengan akun yang sesuai.');
        }

        return $next($request);
    }
}
