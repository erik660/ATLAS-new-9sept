<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin(Request $request)
    {
        Auth::guard('admin')->logout();
        Auth::logout();
        
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $credentials = [
            'kode_sap' => $data['username'],
            'password' => $data['password'],
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $user = Auth::user();
            $request->session()->regenerate();

            if ($user->role === 'admin' || in_array($user->kode_sap, ['3113AM01', 'service'])) {
                Auth::guard('admin')->login($user);
                return redirect()->intended('/admin/dashboard');
            }

            return redirect()->intended('/cabang/dashboard');
        }

        return back()->withErrors(['username' => 'Kode SAP atau password salah.'])->withInput();
    }

    public function logout(Request $request)
    {
        Auth::guard('admin')->logout();
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }
}