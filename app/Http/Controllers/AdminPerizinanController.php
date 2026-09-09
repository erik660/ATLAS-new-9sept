<?php

namespace App\Http\Controllers;

use App\Models\Perizinan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminPerizinanController extends Controller
{
    public function index()
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinans = Perizinan::with('user')
            ->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return view('dashboard_admin', compact('perizinans'));
    }

    public function updateStatus(Request $request, Perizinan $perizinan)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $rules = [
            'status' => 'required|in:approved,needs_revision',
            'catatan_keputusan' => 'nullable|string|max:500',
        ];

        if ($request->input('status') === 'needs_revision') {
            $rules['catatan_revisi'] = 'required|string|max:1000';
        } else {
            $rules['catatan_revisi'] = 'nullable|string|max:1000';
        }

        $data = $request->validate($rules);

        $perizinan->status = $data['status'];
        
        if ($data['status'] === 'approved') {
            $perizinan->catatan_keputusan = $data['catatan_keputusan'] ?? 'Disetujui oleh pusat.';
            $perizinan->catatan_revisi = null;
        } else {
            $perizinan->catatan_revisi = $data['catatan_revisi'];
            $perizinan->catatan_keputusan = $data['catatan_keputusan'] ?? null;
        }

        $perizinan->save();

        $message = $data['status'] === 'approved' 
            ? 'Perizinan berhasil disetujui.' 
            : 'Perizinan berhasil dikembalikan untuk revisi. Cabang akan menerima notifikasi.';

        return redirect('/admin/dashboard')->with('success', $message);
    }
}
