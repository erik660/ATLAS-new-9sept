<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CabangAuthController extends Controller
{
    public function showLogin()
    {
        return view('cabang.login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'kode_sap' => 'required|string',
        ]);

        $kodeSap = strtoupper(trim($data['kode_sap']));
        $user = User::where('kode_sap', $kodeSap)->first();

        if (! $user) {
            return back()->withErrors(['kode_sap' => 'Kode SAP tidak ditemukan.'])->withInput();
        }

        if ($user->role !== 'cabang') {
            return back()->withErrors(['kode_sap' => 'Akun bukan cabang.'])->withInput();
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended('/cabang/dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/cabang/login');
    }
}
