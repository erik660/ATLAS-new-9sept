<?php

namespace App\Http\Controllers;

use App\Models\Notifikasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotifikasiController extends Controller
{
    public function markAsRead($id)
    {
        $notifikasi = Notifikasi::findOrFail($id);
        
        if (Auth::check() && Auth::user()->kode_sap === $notifikasi->kode_sap) {
            $notifikasi->update(['is_read' => true]);
        }

        return redirect()->back();
    }
}
