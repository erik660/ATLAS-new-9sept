<?php

namespace App\Http\Controllers;

use App\Models\Perizinan;
use App\Models\User;
use App\Models\Notifikasi;
use App\Models\ActivityLog;
use App\Models\Apj;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        return redirect()->route('admin.verifikasi');
    }

    public function verifikasi(Request $request)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $aggregateQuery = Perizinan::where('is_legacy', false)->where('status', '!=', 'arsip_admin');
        $baseQuery = Perizinan::where('is_legacy', false)->whereNotIn('status', ['completed', 'terbit_verifikasi', 'arsip_admin', 'approved']);
        
        if ($startDate && $endDate) {
            $baseQuery->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $aggregateQuery->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        } elseif ($startDate) {
            $baseQuery->where('created_at', '>=', $startDate . ' 00:00:00');
            $aggregateQuery->where('created_at', '>=', $startDate . ' 00:00:00');
        } elseif ($endDate) {
            $baseQuery->where('created_at', '<=', $endDate . ' 23:59:59');
            $aggregateQuery->where('created_at', '<=', $endDate . ' 23:59:59');
        }

        
        $unit = $request->input('unit_bisnis');
        $kodeSap = $request->input('kode_sap');
        $jenis = $request->input('jenis');

        if ($unit && $unit !== '') {
            $baseQuery->whereHas('user', function ($q) use ($unit) {
                $q->where('unit_bisnis', $unit);
            });
            $aggregateQuery->whereHas('user', function ($q) use ($unit) {
                $q->where('unit_bisnis', $unit);
            });
        }

        if ($kodeSap && $kodeSap !== '') {
            $baseQuery->whereHas('user', function ($q) use ($kodeSap) {
                $q->where('kode_sap', $kodeSap);
            });
            $aggregateQuery->whereHas('user', function ($q) use ($kodeSap) {
                $q->where('kode_sap', $kodeSap);
            });
        }

        if ($jenis && $jenis !== '') {
            $baseQuery->where('jenis_perizinan', $jenis);
            $aggregateQuery->where('jenis_perizinan', $jenis);
        }

        $totalPengajuan = (clone $aggregateQuery)->whereRaw('LOWER(status) != ?', ['draft'])->count();
        
        $pengajuanProses = (clone $aggregateQuery)
            ->whereNotIn('status', ['draft', 'needs_revision', 'terbit_verifikasi', 'completed'])
            ->count();
            
        $pengajuanDisetujui = (clone $aggregateQuery)
            ->whereIn('status', ['terbit_verifikasi', 'completed'])
            ->count();
            
        $pengajuanRevisi = (clone $aggregateQuery)->where('status', 'needs_revision')->count();

        $tglExp = now()->addMonths(6);
        $expiringCount = Perizinan::with(['apj'])
            ->whereHas('apj', function ($q) use ($tglExp) {
                $q->whereNotNull('masa_berlaku')
                    ->whereDate('masa_berlaku', '<=', $tglExp);
            })
            ->count();


        $query = Perizinan::with(['user', 'apj'])
                          ->where('is_legacy', false)
                          ->whereNotIn('status', ['completed', 'terbit_verifikasi', 'arsip_admin', 'approved'])
                          ->whereRaw('LOWER(status) != ?', ['draft']);

        $unit = $request->input('unit_bisnis');
        $kodeSap = $request->input('kode_sap');
        $jenis = $request->input('jenis');

        if ($unit && $unit !== '') {
            $query->whereHas('user', function ($q) use ($unit) {
                $q->where('unit_bisnis', $unit);
            });
        }

        if ($kodeSap && $kodeSap !== '') {
            $query->whereHas('user', function ($q) use ($kodeSap) {
                $q->where('kode_sap', $kodeSap);
            });
        }

        if ($jenis && $jenis !== '') {
            $query->where('jenis_perizinan', $jenis);
        }

        $perizinans = $query->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(25)
            ->withQueryString();

        $branches = User::where('role', 'cabang')
            ->orderBy('unit_bisnis')
            ->orderBy('name')
            ->select('id', 'kode_sap', 'name', 'unit_bisnis')
            ->get();

        $unitBisnisOptions = User::where('role', 'cabang')
            ->whereNotNull('unit_bisnis')
            ->where('unit_bisnis', '!=', '')
            ->distinct()
            ->orderBy('unit_bisnis')
            ->pluck('unit_bisnis');

        $jenisOptions = collect([
            'Perubahan APJ',
            'Perpanjangan & Perubahan APJ',
            'Perpanjangan SIA (Belum OSS)',
            'Perpanjangan SIA (Sudah OSS)',
        ]);

        $jenisStats = (clone $aggregateQuery)
            ->whereNotIn('status', ['draft', 'completed', 'terbit_verifikasi'])
            ->selectRaw('jenis_perizinan, count(*) as total')
            ->groupBy('jenis_perizinan')
            ->pluck('total', 'jenis_perizinan')
            ->toArray();

        $unitStats = (clone $aggregateQuery)
            ->whereNotIn('perizinans.status', ['draft', 'completed', 'terbit_verifikasi'])
            ->join('users', 'perizinans.user_id', '=', 'users.id')
            ->selectRaw('COALESCE(users.unit_bisnis, "Lainnya") as unit_bisnis_name, count(perizinans.id) as total')
            ->groupBy('unit_bisnis_name')
            ->pluck('total', 'unit_bisnis_name')
            ->toArray();

        return \Inertia\Inertia::render('Admin/Verifikasi', [
            'perizinans' => $perizinans,
            'branches' => $branches,
            'jenisOptions' => $jenisOptions,
            'jenisStats' => $jenisStats,
            'unitStats' => $unitStats,
            'unitBisnisOptions' => $unitBisnisOptions,
            'totalPengajuan' => $totalPengajuan,
            'pengajuanProses' => $pengajuanProses,
            'pengajuanDisetujui' => $pengajuanDisetujui,
            'pengajuanRevisi' => $pengajuanRevisi,
            'expiringCount' => $expiringCount,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'unit_bisnis' => $unit,
                'kode_sap' => $kodeSap,
                'jenis' => $jenis,
            ]
        ]);
    }

    public function printLaporan(Request $request)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        $query = Perizinan::with(['user', 'apj', 'activityLogs' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->where('is_legacy', false)
          ->whereNotIn('status', ['draft', 'arsip_admin']);

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        } elseif ($startDate) {
            $query->where('created_at', '>=', $startDate . ' 00:00:00');
        } elseif ($endDate) {
            $query->where('created_at', '<=', $endDate . ' 23:59:59');
        }

        $unit = $request->input('unit_bisnis');
        $kodeSap = $request->input('kode_sap');
        $jenis = $request->input('jenis');

        if ($unit && $unit !== '') {
            $query->whereHas('user', function ($q) use ($unit) {
                $q->where('unit_bisnis', $unit);
            });
        }

        if ($kodeSap && $kodeSap !== '') {
            $query->whereHas('user', function ($q) use ($kodeSap) {
                $q->where('kode_sap', $kodeSap);
            });
        }

        if ($jenis && $jenis !== '') {
            $query->where('jenis_perizinan', $jenis);
        }

        $perizinans = $query->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return \Inertia\Inertia::render('Admin/PrintLaporan', [
            'perizinans' => $perizinans,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'unit' => $unit,
            'kodeSap' => $kodeSap,
            'jenis' => $jenis
        ]);
    }

    public function downloadCsv(Request $request)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        $query = Perizinan::with(['user', 'activityLogs' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->where('is_legacy', false)
          ->whereNotIn('status', ['draft', 'arsip_admin']);

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        } elseif ($startDate) {
            $query->where('created_at', '>=', $startDate . ' 00:00:00');
        } elseif ($endDate) {
            $query->where('created_at', '<=', $endDate . ' 23:59:59');
        }

        $unit = $request->input('unit_bisnis');
        $kodeSap = $request->input('kode_sap');
        $jenis = $request->input('jenis');

        if ($unit && $unit !== '') {
            $query->whereHas('user', function ($q) use ($unit) {
                $q->where('unit_bisnis', $unit);
            });
        }

        if ($kodeSap && $kodeSap !== '') {
            $query->whereHas('user', function ($q) use ($kodeSap) {
                $q->where('kode_sap', $kodeSap);
            });
        }

        if ($jenis && $jenis !== '') {
            $query->where('jenis_perizinan', $jenis);
        }

        $perizinans = $query->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $fileName = 'Laporan_Pengajuan_SIA_' . date('Ymd_His') . '.csv';

        $headers = array(
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        );

        $columns = ['ID', 'Nama Apotek', 'Kode SAP', 'Unit Bisnis', 'Jenis Perizinan', 'Status', 'Tanggal Pengajuan', 'Update Terakhir'];

        $callback = function() use($perizinans, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($perizinans as $p) {
                $statusLabel = 'DRAFT';
                if (in_array(strtolower($p->status), ['completed', 'terbit_verifikasi'])) {
                    $statusLabel = 'SELESAI (TERBIT)';
                } else if ($p->status === 'needs_revision') {
                    $statusLabel = 'REVISI CABANG';
                } else if ($p->status !== 'draft') {
                    $statusLabel = 'PROSES (' . strtoupper(str_replace('_', ' ', $p->status)) . ')';
                }
                
                $lastUpdate = ($p->activityLogs && count($p->activityLogs) > 0)
                    ? $p->activityLogs[0]->created_at 
                    : $p->updated_at;

                $tglPengajuan = $p->tanggal_pengajuan ? $p->tanggal_pengajuan->format('d/m/Y') : ($p->created_at ? $p->created_at->format('d/m/Y') : '-');
                $tglUpdate = $lastUpdate ? $lastUpdate->format('d/m/Y H:i') : '-';

                fputcsv($file, [
                    '#' . $p->id,
                    $p->nama_apotek,
                    optional($p->user)->kode_sap ?? '-',
                    optional($p->user)->unit_bisnis ?? '-',
                    $p->jenis_perizinan,
                    $statusLabel,
                    $tglPengajuan,
                    $tglUpdate
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function expired(Request $request)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $baseQuery = Perizinan::with(['user', 'apj'])->where('status', 'approved')
            ->whereHas('apj', function ($q) {
                $q->whereNotNull('masa_berlaku');
            });

        $allPerizinans = (clone $baseQuery)->get();

        $query = clone $baseQuery;

        $unit = $request->input('unit_bisnis');
        $kodeSap = $request->input('kode_sap');
        $jenis = $request->input('jenis');

        if ($unit && $unit !== '') {
            $query->whereHas('user', function ($q) use ($unit) {
                $q->where('unit_bisnis', $unit);
            });
        }

        if ($kodeSap && $kodeSap !== '') {
            $query->whereHas('user', function ($q) use ($kodeSap) {
                $q->where('kode_sap', $kodeSap);
            });
        }

        if ($jenis && $jenis !== '') {
            $query->where('jenis_perizinan', $jenis);
        }

        // Conditions are already on $baseQuery

        $perizinans = $query->get()
            ->sortBy(function($item) {
                return $item->apj->masa_berlaku;
            })->values();

        $branches = User::where('role', 'cabang')
            ->orderBy('unit_bisnis')
            ->orderBy('name')
            ->select('id', 'kode_sap', 'name', 'unit_bisnis')
            ->get();

        $unitBisnisOptions = User::where('role', 'cabang')
            ->whereNotNull('unit_bisnis')
            ->where('unit_bisnis', '!=', '')
            ->distinct()
            ->orderBy('unit_bisnis')
            ->pluck('unit_bisnis');

        $jenisOptions = collect([
            'Perubahan APJ',
            'Perpanjangan & Perubahan APJ',
            'Perpanjangan SIA (Belum OSS)',
            'Perpanjangan SIA (Sudah OSS)',
        ]);

        return \Inertia\Inertia::render('Admin/Expired', [
            'perizinans' => $perizinans,
            'allPerizinans' => $allPerizinans,
            'branches' => $branches,
            'jenisOptions' => $jenisOptions,
            'unitBisnisOptions' => $unitBisnisOptions,
        ]);
    }

    public function show($id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::with(['user', 'apj'])->findOrFail($id);

        return \Inertia\Inertia::render('Admin/Verify', [
            'perizinan' => $perizinan
        ]);
    }

    public function downloadAll($id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::with(['user', 'apj'])->findOrFail($id);

        $labels = [
            'file_1' => '01_Surat_Permohonan_SIA',
            'file_2' => '02_STR_Apoteker_STRA',
            'file_3' => '03_SIP_Apoteker_SIPA',
            'file_4' => '04_Denah_Bangunan_Apotek',
            'file_5' => '05_Izin_Lokasi_OSS',
            'file_12' => '12_Sertifikat_Tanah_IMB',
            'file_6' => '06_Peta_Polygon_Lahan',
            'file_13' => '13_Kesesuaian_Tata_Ruang',
            'file_14' => '14_Peta_Lokasi',
            'file_15' => '15_SHP_Peta_Tapak',
            'file_7' => '07_Dokumen_Administrasi',
            'file_8' => '08_Dokumen_Lokasi',
            'file_9' => '09_Dokumen_Bangunan',
            'file_10' => '10_Dokumen_Sarana_Prasarana',
            'file_11' => '11_Dokumen_SDM_Lengkap',
            'file_16' => '16_Berita_Acara_Pemeriksaan_BAP',
        ];

        $tempDirName = 'temp_zip_' . $perizinan->id . '_' . uniqid();
        $tempDirPath = storage_path('app/public/' . $tempDirName);
        if (!file_exists($tempDirPath)) {
            mkdir($tempDirPath, 0777, true);
        }

        $docCount = 0;
        for ($i = 1; $i <= 16; $i++) {
            $field = 'file_' . $i;
            if (!empty($perizinan->$field)) {
                $filePath = storage_path('app/public/' . $perizinan->$field);
                if (file_exists($filePath)) {
                    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
                    $baseName = $labels[$field] ?? ("Dokumen_" . $i);
                    copy($filePath, $tempDirPath . '/' . $baseName . '.' . $ext);
                    $docCount++;
                }
            }
        }

        if (!empty($perizinan->file_path)) {
            $filePath = storage_path('app/public/' . $perizinan->file_path);
            if (file_exists($filePath)) {
                $ext = pathinfo($filePath, PATHINFO_EXTENSION);
                copy($filePath, $tempDirPath . '/Dokumen_Utama_Pengajuan.' . $ext);
                $docCount++;
            }
        }

        if ($docCount === 0) {
            @rmdir($tempDirPath);
            return redirect()->back()->with('error', 'Belum ada berkas fisik yang diunggah oleh cabang pada pengajuan ini.');
        }

        if (!empty($perizinan->surat_izin_final)) {
            $filePath = storage_path('app/public/' . $perizinan->surat_izin_final);
            if (file_exists($filePath)) {
                $ext = pathinfo($filePath, PATHINFO_EXTENSION);
                copy($filePath, $tempDirPath . '/Surat_Izin_Kemenkes_Final_HQ.' . $ext);
            }
        }

        $readmeText = "KIMIA FARMA APOTEK - SISTEM INFORMASI PERIZINAN APOTEK (SIA)\n";
        $readmeText .= "============================================================\n\n";
        $readmeText .= "ID Pengajuan    : #" . $perizinan->id . "\n";
        $readmeText .= "Nama Apotek     : " . $perizinan->nama_apotek . "\n";
        $readmeText .= "Kode SAP Cabang : " . optional($perizinan->user)->kode_sap . "\n";
        $readmeText .= "Unit Bisnis     : " . optional($perizinan->user)->unit_bisnis . "\n";
        $readmeText .= "Jenis Perizinan : " . $perizinan->jenis_perizinan . "\n";
        $readmeText .= "Tanggal Ajuan   : " . ($perizinan->tanggal_pengajuan ? $perizinan->tanggal_pengajuan->format('d-m-Y') : '-') . "\n";
        $readmeText .= "Status Terkini  : " . strtoupper($perizinan->status) . "\n";
        $readmeText .= "Apoteker (APJ)  : " . optional($perizinan->apj)->nama_apj . "\n";
        $readmeText .= "No. SIP APJ     : " . optional($perizinan->apj)->no_sip . "\n";
        $readmeText .= "\nDiunduh oleh Admin Pusat (HQ) pada: " . now()->format('d-m-Y H:i:s') . " WIB\n";

        file_put_contents($tempDirPath . '/INFO_PENGAJUAN.txt', $readmeText);

        $cleanName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $perizinan->nama_apotek);
        $fileName = 'Berkas_SIA_' . $cleanName . '_ID' . $perizinan->id . '_' . date('Ymd_His') . '.zip';
        $zipPath = storage_path('app/public/' . $fileName);
        if (file_exists($zipPath)) {
            @unlink($zipPath);
        }

        if (class_exists('ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
                $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($tempDirPath, \RecursiveDirectoryIterator::SKIP_DOTS), \RecursiveIteratorIterator::LEAVES_ONLY);
                foreach ($files as $file) {
                    if (!$file->isDir()) {
                        $filePath = $file->getRealPath();
                        $relativePath = substr($filePath, strlen($tempDirPath) + 1);
                        $zip->addFile($filePath, $relativePath);
                    }
                }
                $zip->close();
            }
        }

        if (!file_exists($zipPath)) {
            if (PHP_OS_FAMILY === 'Windows' || stripos(PHP_OS, 'WIN') === 0) {
                $winTempDir = str_replace('/', '\\', $tempDirPath);
                $winZipPath = str_replace('/', '\\', $zipPath);
                $cmd = 'powershell -NoProfile -Command "Compress-Archive -Path \'' . $winTempDir . '\\*\' -DestinationPath \'' . $winZipPath . '\' -Force"';
                exec($cmd);
            } else {
                $cmd = 'cd "' . $tempDirPath . '" && zip -q -r "' . $zipPath . '" .';
                exec($cmd);
            }
        }

        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($tempDirPath, \RecursiveDirectoryIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($files as $fileinfo) {
            $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
            @$todo($fileinfo->getRealPath());
        }
        @rmdir($tempDirPath);

        if (!file_exists($zipPath)) {
            return redirect()->back()->with('error', 'Gagal membuat file ZIP. Pastikan server memiliki izin penulisan file.');
        }

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'download_zip',
            'description' => 'Admin Pusat mengunduh seluruh arsip berkas (' . $docCount . ' dokumen) dalam format ZIP untuk ' . $perizinan->nama_apotek,
        ]);

        return response()->download($zipPath, $fileName)->deleteFileAfterSend(true);
    }

    public function updateNku(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $request->validate([
            'nku' => 'nullable|string|max:255',
        ]);

        $perizinan = Perizinan::findOrFail($id);
        $perizinan->nku = $request->input('nku');
        $perizinan->save();

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'update_nku',
            'description' => 'Admin Pusat memperbarui Nomor Kegiatan Usaha (NKU) menjadi ' . ($perizinan->nku ?: 'kosong') . ' untuk ' . $perizinan->nama_apotek,
        ]);

        return redirect()->back()->with('success', 'Nomor Kegiatan Usaha (NKU) berhasil disimpan.');
    }

    public function updateStatus(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::findOrFail($id);

        $rules = [
            'status' => 'required|in:needs_revision,verifikasi_internal,verifikator_kemenkes,persetujuan_kl,terbit_verifikasi',
            'catatan_keputusan' => 'nullable|string|max:500',
            'doc_status' => 'nullable|array',
            'doc_status.*' => 'in:sesuai,revisi',
            'doc_notes' => 'nullable|array',
            'doc_notes.*' => 'nullable|string',
            'revisi_fields' => 'nullable|array',
            'revisi_fields.*' => 'array',
            'revisi_fields.*.*' => 'string',
        ];

        $messages = [];

        $data = $request->validate($rules, $messages);

        if ($data['status'] !== 'needs_revision' && !empty($data['doc_status']) && in_array('revisi', $data['doc_status'])) {
            return redirect()->back()->withErrors(['status' => 'Tidak dapat memilih keputusan positif karena terdapat dokumen yang ditandai "Perlu Revisi". Silakan pilih "Kembalikan untuk Revisi".'])->withInput();
        }

        if ($data['status'] === 'needs_revision' && !empty($data['doc_status'])) {
            if (isset($data['doc_status']['bagian2']) && $data['doc_status']['bagian2'] === 'revisi') {
                if (empty($data['revisi_fields']['bagian2'])) {
                    return redirect()->back()->withErrors(['revisi_fields_bagian2' => 'Anda memilih "Revisi" untuk Bagian 2, tetapi tidak ada kolom yang dipilih. Silakan pilih kolom yang perlu direvisi.'])->withInput();
                }
            }
            if (isset($data['doc_status']['bagian3']) && $data['doc_status']['bagian3'] === 'revisi') {
                if (empty($data['revisi_fields']['bagian3'])) {
                    return redirect()->back()->withErrors(['revisi_fields_bagian3' => 'Anda memilih "Revisi" untuk Bagian 3, tetapi tidak ada kolom yang dipilih. Silakan pilih kolom yang perlu direvisi.'])->withInput();
                }
            }
        }

        if ($data['status'] === 'needs_revision') {
            $hasRevisi = !empty($data['doc_status']) && in_array('revisi', $data['doc_status']);
            
            if (!$hasRevisi) {
                return redirect()->back()->withErrors(['status' => 'Tidak ada dokumen yang ditandai revisi. Silakan tandai minimal satu dokumen yang perlu direvisi.'])->withInput();
            }

            $documentNames = [
                1 => 'SIA Terakhir',
                2 => 'SIPA Terbaru yang Masih Berlaku',
                3 => 'Akta Perjanjian Sewa',
                4 => 'Rencana Teknis Bangunan/Rencana Induk Kawasan (RTB/RIK)',
                5 => 'Izin Lokasi yang Diterbitkan OSS',
                12 => 'Sertifikat Tanah dan IMB',
                13 => 'Data Kesesuaian Tata Ruang',
                14 => 'Peta Lokasi',
                6 => 'Peta Polygon Lahan',
                15 => 'SHP Peta Tapak Proyek',
                11 => 'Dokumen SDM Lengkap (Surat STR, KTP, SIPA, dll)',
                7 => 'Dokumen Administrasi',
                8 => 'Dokumen Lokasi',
                9 => 'Dokumen Bangunan',
                10 => 'Dokumen Sarana & Prasarana',
                16 => 'Berita Acara Pemeriksaan (BAP)'
            ];

            $fieldNames = [
                'nama_rencana_usaha' => 'Nama Rencana Usaha / Kegiatan',
                'kode_pos' => 'Kode Pos',
                'luas_lahan' => 'Luas Lahan',
                'lintang_bujur' => 'Garis Lintang & Bujur',
                'batasan_utara' => 'Batasan Utara',
                'batasan_selatan' => 'Batasan Selatan',
                'batasan_timur' => 'Batasan Timur',
                'batasan_barat' => 'Batasan Barat',
                'bangunan_renovasi' => 'Renovasi/Bangunan Baru',
                'nilai_bangunan' => 'Rincian Nilai Bangunan',
                'modal_kerja' => 'Modal Kerja',
                'modal_operasional' => 'Modal Operasional',
                'sdm_laki' => 'SDM Laki-laki',
                'sdm_perempuan' => 'SDM Perempuan',
                'sdm_tka' => 'SDM TKA'
            ];

            $docNotes = [];
            if (!empty($data['doc_status'])) {
                foreach ($data['doc_status'] as $index => $status) {
                    if ($status === 'revisi') {
                        $noteText = !empty($data['doc_notes'][$index]) ? trim($data['doc_notes'][$index]) : 'Perlu diperbaiki / diunggah ulang.';
                        
                        if ($index === 'bagian2' || $index === 'bagian3') {
                            $docName = $index === 'bagian2' ? 'Bagian 2 (Alamat & Tata Ruang)' : 'Bagian 3 (Finansial, Investasi & SDM)';
                            if (!empty($data['revisi_fields'][$index])) {
                                $selectedFields = array_map(function($field) use ($fieldNames) {
                                    return $fieldNames[$field] ?? $field;
                                }, $data['revisi_fields'][$index]);
                                $docName .= ' [Kolom: ' . implode(', ', $selectedFields) . ']';
                            }
                        } else {
                            $docName = $documentNames[$index] ?? "Dokumen $index";
                        }
                        
                        $docNotes[] = "- " . $docName . ": " . $noteText;
                    }
                }
            }
            
            $catatan_revisi = count($docNotes) > 0 ? implode("\n", $docNotes) : '';
        } else {
            $catatan_revisi = '';
        }

        $perizinan->status = $data['status'];

        if ($data['status'] !== 'needs_revision') {
            $perizinan->catatan_keputusan = $data['catatan_keputusan'] ?? null;
            $perizinan->status_dokumen = null;
        } else {
            $perizinan->catatan_revisi = $catatan_revisi;
            $perizinan->catatan_keputusan = $data['catatan_keputusan'] ?? null;
            
            $docStatus = $data['doc_status'] ?? [];
            if (!empty($data['revisi_fields'])) {
                $docStatus['revisi_fields'] = $data['revisi_fields'];
            }
            $perizinan->status_dokumen = !empty($docStatus) ? json_encode($docStatus) : null;
            
            $perizinan->catatan_dokumen = !empty($data['doc_notes']) ? json_encode($data['doc_notes']) : null;
        }

        $perizinan->save();
        
        $actionName = $data['status'];
        
        $statusLabels = [
            'needs_revision' => 'Kembalikan untuk Revisi',
            'verifikasi_internal' => 'Verifikasi Internal',
            'verifikator_kemenkes' => 'Verifikator Kemenkes',
            'persetujuan_kl' => 'Proses Tahap Persetujuan KL',
            'terbit_verifikasi' => 'Terbit Verifikasi',
        ];
        $label = $statusLabels[$data['status']] ?? $data['status'];

        $desc = $data['status'] !== 'needs_revision' 
            ? 'Admin Pusat memperbarui status pengajuan menjadi: ' . $label . '.' 
            : 'Admin Pusat mengembalikan pengajuan untuk direvisi: ' . $catatan_revisi;

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => $actionName,
            'description' => $desc,
        ]);

        $isRevision = $data['status'] === 'needs_revision';
        $judulNotif = !$isRevision ? 'Status Pengajuan Diperbarui' : 'Pengajuan Perlu Revisi';
        $pesanNotif = !$isRevision 
            ? 'Pengajuan perizinan ' . $perizinan->jenis_perizinan . ' untuk ' . $perizinan->nama_apotek . ' telah diperbarui menjadi tahap: ' . $label . '.'
            : 'Pengajuan perizinan ' . $perizinan->jenis_perizinan . ' untuk ' . $perizinan->nama_apotek . ' dikembalikan karena: ' . $catatan_revisi;

        Notifikasi::create([
            'kode_sap' => $perizinan->user->kode_sap,
            'judul' => $judulNotif,
            'pesan' => $pesanNotif,
            'is_read' => false,
        ]);

        $message = !$isRevision
            ? 'Status pengajuan berhasil diperbarui menjadi ' . $label . '!'
            : 'Perizinan berhasil dikembalikan untuk revisi. Cabang akan menerima notifikasi.';

        return redirect()->route('admin.verifikasi')->with('success', $message);
    }


    public function remindDocument(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::with('user')->findOrFail($id);
        $documentName = $request->input('document_name', 'Dokumen');
        
        $userKodeSap = $perizinan->user->kode_sap;
        
        Notifikasi::create([
            'kode_sap' => $userKodeSap,
            'judul' => 'Peringatan Kelengkapan Dokumen',
            'pesan' => 'Mohon segera mengunggah kelengkapan dokumen: ' . $documentName . ' untuk pengajuan perizinan ' . $perizinan->jenis_perizinan . ' (Apotek ' . $perizinan->nama_apotek . ').',
            'is_read' => false,
        ]);

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'Kirim Peringatan Dokumen',
            'description' => 'Admin Pusat mengirimkan peringatan untuk mengunggah dokumen ' . $documentName,
        ]);

        return response()->json(['success' => true, 'message' => 'Notifikasi berhasil dikirim ke cabang.']);
    }

    public function sendReminder(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::with('user')->findOrFail($id);

        $perizinan->reminder_sent_at = now();
        $note = sprintf("Reminder dikirim oleh admin pada %s", now()->toDateTimeString());
        $perizinan->catatan_admin = $perizinan->catatan_admin ? ($perizinan->catatan_admin . "\n" . $note) : $note;
        $perizinan->save();

        $userKodeSap = $perizinan->user->kode_sap;
        $masaBerlakuDate = optional($perizinan->apj)->masa_berlaku ? \Carbon\Carbon::parse($perizinan->apj->masa_berlaku)->format('d/m/Y') : 'Tanggal tidak tersedia';
        
        Notifikasi::create([
            'kode_sap' => $userKodeSap,
            'judul' => 'Peringatan Masa Berlaku Izin',
            'pesan' => 'Peringatan: Masa berlaku perizinan ' . $perizinan->jenis_perizinan . ' untuk ' . $perizinan->nama_apotek . ' akan segera habis pada ' . $masaBerlakuDate . '. Mohon segera ajukan perpanjangan.',
            'is_read' => false,
        ]);

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'send_reminder',
            'description' => 'Admin Pusat mengirimkan peringatan masa berlaku izin (reminder) ke Cabang.',
        ]);

        return redirect()->back()->with('success', 'Pengingat berhasil dikirim.');
    }

    public function markCompleted(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::with('user')->findOrFail($id);
        $perizinan->status = 'completed';
        $perizinan->save();

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'completed',
            'description' => 'Admin Pusat menyelesaikan proses pengajuan. Pengajuan dipindahkan ke Riwayat.',
        ]);

        Notifikasi::create([
            'kode_sap' => $perizinan->user->kode_sap,
            'judul' => 'Surat Izin Telah Terbit (Selesai)',
            'pesan' => 'Pengajuan perizinan ' . $perizinan->jenis_perizinan . ' untuk ' . $perizinan->nama_apotek . ' telah selesai diproses. Surat Izin baru telah diterbitkan oleh Kemenkes.',
            'is_read' => false,
        ]);

        return redirect()->back()->with('success', 'Pengajuan berhasil diselesaikan dan dipindahkan ke Riwayat.');
    }

    public function bankData(Request $request)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $branches = User::where('role', 'cabang')
            ->withCount(['perizinans' => function ($query) {
                $query->whereIn('status', ['completed', 'terbit_verifikasi', 'arsip_admin']);
            }])
            ->orderBy('unit_bisnis')
            ->orderBy('name')
            ->get();

        return \Inertia\Inertia::render('Admin/BankData/Index', [
            'branches' => $branches
        ]);
    }

    public function bankDataDetail($id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $branch = User::where('role', 'cabang')->findOrFail($id);

        // Riwayat Pengajuan Perizinan Resmi yang Selesai
        $perizinans = Perizinan::where('user_id', $branch->id)
            ->whereIn('status', ['completed', 'terbit_verifikasi'])
            ->orderBy('tanggal_pengajuan', 'desc')
            ->get();

        // Berkas & Catatan Bebas Pegangan Admin
        $adminNotes = Perizinan::where('user_id', $branch->id)
            ->where('status', 'arsip_admin')
            ->orderBy('created_at', 'desc')
            ->get();

        return \Inertia\Inertia::render('Admin/BankData/Detail', [
            'branch' => $branch,
            'perizinans' => $perizinans,
            'adminNotes' => $adminNotes,
        ]);
    }

    public function bankDataCreate($id)
    {
        return redirect()->route('admin.bank_data.catatan', $id);
    }

    public function bankDataCatatan($id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $branch = User::where('role', 'cabang')->findOrFail($id);

        $adminNotes = Perizinan::where('user_id', $branch->id)
            ->where('status', 'arsip_admin')
            ->orderBy('created_at', 'desc')
            ->get();

        return \Inertia\Inertia::render('Admin/BankData/Catatan', [
            'branch' => $branch,
            'adminNotes' => $adminNotes,
        ]);
    }

    public function bankDataCatatanStore(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $branch = User::where('role', 'cabang')->findOrFail($id);

        $request->validate([
            'judul_dokumen' => 'required|string|max:255',
            'catatan' => 'nullable|string',
            'tanggal' => 'nullable|date',
            'file_dokumen' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,zip,doc,docx,xls,xlsx|max:15360',
        ]);

        $filePath = null;
        if ($request->hasFile('file_dokumen')) {
            $filePath = $request->file('file_dokumen')->store('berkas', 's3');
        }

        $perizinan = Perizinan::create([
            'user_id' => $branch->id,
            'jenis_perizinan' => $request->input('judul_dokumen'),
            'nama_apotek' => $branch->name,
            'status' => 'arsip_admin',
            'tanggal_pengajuan' => $request->input('tanggal', now()->toDateString()),
            'keterangan' => $request->input('catatan', '-'),
            'file_1' => $filePath,
            'alamat_lengkap' => $branch->alamat,
            'kode_pos' => $branch->kode_pos,
        ]);

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'Admin Upload Dokumen Pegangan',
            'description' => 'Admin Pusat mengunggah dokumen/catatan "' . $request->input('judul_dokumen') . '" untuk cabang ' . $branch->name,
        ]);

        return redirect()->route('admin.bank_data.catatan', $branch->id)
            ->with('success', 'Dokumen & catatan berhasil disimpan.');
    }

    public function bankDataCatatanDelete($id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $doc = Perizinan::where('status', 'arsip_admin')->findOrFail($id);
        $branchId = $doc->user_id;

        if ($doc->file_1 && \Illuminate\Support\Facades\Storage::disk('s3')->exists($doc->file_1)) {
            \Illuminate\Support\Facades\Storage::disk('s3')->delete($doc->file_1);
        }

        $doc->delete();

        return redirect()->route('admin.bank_data.catatan', $branchId)
            ->with('success', 'Dokumen/catatan pegangan berhasil dihapus.');
    }

    public function bankDataStore(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $branch = User::where('role', 'cabang')->findOrFail($id);

        $request->validate([
            'judul_dokumen' => 'required|string|max:255',
            'catatan' => 'nullable|string',
            'tanggal' => 'nullable|date',
            'file_dokumen' => 'nullable|file|mimes:pdf,jpg,jpeg,png,webp,zip,doc,docx,xls,xlsx|max:15360',
        ]);

        $filePath = null;
        if ($request->hasFile('file_dokumen')) {
            $filePath = $request->file('file_dokumen')->store('berkas', 's3');
        }

        $perizinan = Perizinan::create([
            'user_id' => $branch->id,
            'jenis_perizinan' => $request->input('judul_dokumen'),
            'nama_apotek' => $branch->name,
            'status' => 'arsip_admin',
            'tanggal_pengajuan' => $request->input('tanggal', now()->toDateString()),
            'keterangan' => $request->input('catatan', '-'),
            'file_1' => $filePath,
            'alamat_lengkap' => $branch->alamat,
            'kode_pos' => $branch->kode_pos,
        ]);

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'Admin Upload Dokumen Pegangan',
            'description' => 'Admin Pusat mengunggah dokumen/catatan "' . $request->input('judul_dokumen') . '" untuk cabang ' . $branch->name,
        ]);

        return redirect()->route('admin.bank_data.detail', $branch->id)
            ->with('success', 'Dokumen & catatan berhasil disimpan.');
    }

    public function bankDataDeleteDoc($id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $doc = Perizinan::where('status', 'arsip_admin')->findOrFail($id);
        $branchId = $doc->user_id;

        if ($doc->file_1 && \Illuminate\Support\Facades\Storage::disk('s3')->exists($doc->file_1)) {
            \Illuminate\Support\Facades\Storage::disk('s3')->delete($doc->file_1);
        }

        $doc->delete();

        return redirect()->route('admin.bank_data.detail', $branchId)
            ->with('success', 'Dokumen/catatan pegangan berhasil dihapus.');
    }

    public function bankDataArsip($id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::with(['user', 'apj'])->findOrFail($id);

        $jenisOptions = [
            'SIA Baru (Belum OSS)',
            'SIA Baru (Sudah OSS)',
            'Perubahan APJ',
            'Perpanjangan & Perubahan APJ',
            'Perpanjangan SIA (Belum OSS)',
            'Perpanjangan SIA (Sudah OSS)',
        ];

        return \Inertia\Inertia::render('Admin/BankData/Arsip', [
            'perizinan' => $perizinan,
            'jenisOptions' => $jenisOptions,
        ]);
    }

    public function bankDataArsipUpdate(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::with(['user', 'apj'])->findOrFail($id);

        $request->validate([
            'jenis_perizinan' => 'required|string|max:150',
            'nama_apotek' => 'required|string|max:255',
            'tanggal_pengajuan' => 'nullable|date',
            'nama_apj' => 'nullable|string|max:255',
            'no_sip' => 'nullable|string|max:100',
            'masa_berlaku' => 'nullable|date',
        ]);

        if ($perizinan->apj) {
            $perizinan->apj->update([
                'nama_apj' => $request->input('nama_apj', $perizinan->apj->nama_apj),
                'no_sip' => $request->input('no_sip', $perizinan->apj->no_sip),
                'masa_berlaku' => $request->input('masa_berlaku', $perizinan->apj->masa_berlaku),
            ]);
        } elseif ($request->filled('nama_apj') || $request->filled('no_sip') || $request->filled('masa_berlaku')) {
            $apj = Apj::create([
                'nama_apj' => $request->input('nama_apj', '-'),
                'no_sip' => $request->input('no_sip', '-'),
                'masa_berlaku' => $request->input('masa_berlaku'),
            ]);
            $perizinan->apj_id = $apj->id;
        }

        $perizinan->update([
            'jenis_perizinan' => $request->input('jenis_perizinan', $perizinan->jenis_perizinan),
            'nama_apotek' => $request->input('nama_apotek', $perizinan->nama_apotek),
            'tanggal_pengajuan' => $request->input('tanggal_pengajuan', $perizinan->tanggal_pengajuan),
            'kode_pos' => $request->input('kode_pos', $perizinan->kode_pos),
            'alamat_lengkap' => $request->input('alamat_lengkap', $perizinan->alamat_lengkap),
            'luas_lahan' => $request->input('luas_lahan', $perizinan->luas_lahan),
            'bangunan_renovasi' => $request->input('bangunan_renovasi', $perizinan->bangunan_renovasi),
            'mesin_peralatan' => $request->input('mesin_peralatan', $perizinan->mesin_peralatan),
            'investasi_lain' => $request->input('investasi_lain', $perizinan->investasi_lain),
            'modal_kerja' => $request->input('modal_kerja', $perizinan->modal_kerja),
            'omzet_pertahun' => $request->input('omzet_pertahun', $perizinan->omzet_pertahun),
            'sdm_laki' => $request->input('sdm_laki', $perizinan->sdm_laki),
            'sdm_perempuan' => $request->input('sdm_perempuan', $perizinan->sdm_perempuan),
            'sdm_tka' => $request->input('sdm_tka', $perizinan->sdm_tka),
            'nama_rencana_usaha' => $request->input('nama_rencana_usaha', $perizinan->nama_rencana_usaha),
            'deskripsi_kegiatan' => $request->input('deskripsi_kegiatan', $perizinan->deskripsi_kegiatan),
            'deskripsi_lokasi' => $request->input('deskripsi_lokasi', $perizinan->deskripsi_lokasi),
            'lokasi_alamat_lengkap' => $request->input('lokasi_alamat_lengkap', $perizinan->lokasi_alamat_lengkap),
        ]);

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'Admin Edit Arsip',
            'description' => 'Admin Pusat memperbarui data teks arsip perizinan ID #' . $perizinan->id,
        ]);

        return redirect()->back()->with('success', 'Data arsip berhasil diperbarui.');
    }

    public function bankDataUploadDoc(Request $request, $id)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $perizinan = Perizinan::findOrFail($id);
        $field = $request->input('field');

        if (!in_array($field, array_map(fn($i) => "file_$i", range(1, 16)))) {
            return redirect()->back()->with('error', 'Field berkas tidak valid.');
        }

        $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png,webp,zip|max:10240',
        ]);

        $path = $request->file('document')->store('berkas', 's3');
        $perizinan->$field = $path;
        $perizinan->save();

        ActivityLog::create([
            'user_id' => Auth::guard('admin')->id(),
            'perizinan_id' => $perizinan->id,
            'action' => 'Admin Update Dokumen',
            'description' => 'Admin Pusat mengunggah / mengganti dokumen ' . $field . ' pada arsip ID #' . $perizinan->id,
        ]);

        return redirect()->back()->with('success', 'Dokumen berhasil diperbarui.');
    }

    public function activityLog(Request $request)
    {
        if (Auth::guard('admin')->user()->role !== 'admin') {
            abort(403);
        }

        $query = Perizinan::with(['user', 'apj', 'activityLogs' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }])->whereIn('status', ['completed', 'terbit_verifikasi']);

        $unit = $request->input('unit_bisnis');
        $jenis = $request->input('jenis_perizinan');
        $search = $request->input('search');

        if ($unit && $unit !== '') {
            $query->whereHas('user', function ($q) use ($unit) {
                $q->where('unit_bisnis', $unit);
            });
        }

        if ($jenis && $jenis !== '') {
            $query->where('jenis_perizinan', $jenis);
        }

        if ($search && $search !== '') {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'LIKE', '%' . $search . '%')
                  ->orWhere('kode_sap', 'LIKE', '%' . $search . '%');
            });
        }

        $perizinans = $query->orderBy('updated_at', 'desc')->paginate(30)->withQueryString();

        $unitBisnisOptions = User::where('role', 'cabang')
            ->whereNotNull('unit_bisnis')
            ->where('unit_bisnis', '!=', '')
            ->distinct()
            ->orderBy('unit_bisnis')
            ->pluck('unit_bisnis');

        $jenisOptions = collect([
            'Perubahan APJ',
            'Perpanjangan & Perubahan APJ',
            'Perpanjangan SIA (Belum OSS)',
            'Perpanjangan SIA (Sudah OSS)',
        ]);

        $branches = User::where('role', 'cabang')
            ->orderBy('unit_bisnis')
            ->orderBy('name')
            ->select('id', 'kode_sap', 'name', 'unit_bisnis')
            ->get();

        return \Inertia\Inertia::render('Admin/ActivityLog', [
            'perizinans' => $perizinans,
            'unitBisnisOptions' => $unitBisnisOptions,
            'jenisOptions' => $jenisOptions,
            'branches' => $branches,
            'filters' => $request->only(['unit_bisnis', 'kode_sap', 'jenis_perizinan'])
        ]);
    }
}

