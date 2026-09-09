<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $adminNotifications = null;
        if (\Illuminate\Support\Facades\Auth::guard('admin')->check()) {
            $pendingQuery = \App\Models\Perizinan::with('user')
                ->where('is_legacy', false)
                ->whereNotIn('status', ['completed', 'terbit_verifikasi', 'arsip_admin', 'approved'])
                ->whereRaw('LOWER(status) != ?', ['draft'])
                ->orderBy('updated_at', 'desc');

            $count = (clone $pendingQuery)->count();
            $items = $pendingQuery->take(8)->get()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'nama_apotek' => $p->nama_apotek,
                    'kode_sap' => optional($p->user)->kode_sap ?? '-',
                    'unit_bisnis' => optional($p->user)->unit_bisnis ?? '-',
                    'jenis_perizinan' => $p->jenis_perizinan,
                    'status' => $p->status,
                    'waktu' => $p->updated_at ? $p->updated_at->diffForHumans() : ($p->created_at ? $p->created_at->diffForHumans() : '-'),
                    'tanggal' => $p->updated_at ? $p->updated_at->format('d/m/Y H:i') : '-',
                ];
            });

            $tglUrgent = now()->addMonths(3);
            $expiredQuery = \App\Models\Perizinan::with(['user', 'apj'])
                ->where('status', 'approved')
                ->whereHas('apj', function ($q) use ($tglUrgent) {
                    $q->whereNotNull('masa_berlaku')
                      ->whereDate('masa_berlaku', '<=', $tglUrgent);
                })
                ->whereDoesntHave('user.perizinans', function ($q) {
                    $q->whereNotIn('status', ['draft', 'approved', 'arsip_admin', 'completed']);
                });
            
            $expiredUrgentCount = (clone $expiredQuery)->count();
            
            $expiredItems = $expiredQuery->take(5)->get()->map(function ($p) {
                $sisaHari = optional($p->apj)->masa_berlaku ? (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($p->apj->masa_berlaku)->startOfDay(), false) : 0;
                return [
                    'id' => $p->id,
                    'nama_apotek' => $p->nama_apotek,
                    'kode_sap' => optional($p->user)->kode_sap ?? '-',
                    'unit_bisnis' => optional($p->user)->unit_bisnis ?? '-',
                    'masa_berlaku' => optional($p->apj)->masa_berlaku ? \Carbon\Carbon::parse($p->apj->masa_berlaku)->format('d/m/Y') : '-',
                    'sisa_hari' => $sisaHari,
                    'status_expired' => $sisaHari < 0 ? 'Expired' : ($sisaHari <= 30 ? 'Kritis' : 'Warning')
                ];
            });

            $adminNotifications = [
                'unread_count' => $count,
                'items' => $items,
                'expired_urgent_count' => $expiredUrgentCount,
                'expired_items' => $expiredItems,
            ];
        }

        $urgentWarning = null;
        if ($request->user()) {
            $hasActiveApp = \App\Models\Perizinan::where('user_id', $request->user()->id)
                ->whereNotIn('status', ['draft', 'approved', 'arsip_admin', 'completed'])
                ->exists();

            if (!$hasActiveApp) {
                $warning = \App\Models\Notifikasi::where('kode_sap', $request->user()->kode_sap)
                    ->where('judul', 'Peringatan Masa Berlaku Izin')
                    ->where('created_at', '>=', now()->subMonths(6))
                    ->latest()
                    ->first();

                if ($warning && !session('urgent_warning_shown')) {
                    $urgentWarning = $warning;
                    session()->put('urgent_warning_shown', true);
                }
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'admin' => \Illuminate\Support\Facades\Auth::guard('admin')->user(),
                'urgentWarning' => $urgentWarning,
            ],
            'adminNotifications' => $adminNotifications,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'status' => $request->session()->get('status'),
            ],
        ];
    }
}
