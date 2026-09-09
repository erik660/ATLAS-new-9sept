<?php

namespace App\Http\Controllers;

use App\Models\Apj;
use App\Models\Perizinan;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $perizinans = Perizinan::where('user_id', Auth::id())
            ->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $revisionNotes = Perizinan::where('user_id', Auth::id())
            ->where('status', 'needs_revision')
            ->pluck('catatan_revisi')
            ->filter()
            ->unique();

        $tglExp = now()->addMonths(6);
        $expiringApjs = Apj::whereHas('perizinans', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->whereNotNull('masa_berlaku')
            ->whereDate('masa_berlaku', '<=', $tglExp)
            ->get();

        return view('dashboard', compact('perizinans', 'revisionNotes', 'expiringApjs', 'tglExp'));
    }
}
