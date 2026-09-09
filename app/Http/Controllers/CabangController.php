<?php

namespace App\Http\Controllers;

use App\Models\Perizinan;
use App\Models\Notifikasi;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CabangController extends Controller
{
    public function index()
    {
        $perizinans = Perizinan::where('user_id', Auth::id())
            ->where('is_legacy', false)
            ->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $notifikasis = Notifikasi::where('kode_sap', Auth::user()->kode_sap)
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get();

        $activityLogs = ActivityLog::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function($log) {
                return \Carbon\Carbon::parse($log->created_at)->format('Y-m-d');
            });

        return \Inertia\Inertia::render('Cabang/Dashboard', [
            'perizinans' => $perizinans,
            'notifikasis' => $notifikasis,
            'activityLogs' => $activityLogs
        ]);
    }

    public function create()
    {
        return \Inertia\Inertia::render('Cabang/Create');
    }

    public function riwayat()
    {
        $perizinans = Perizinan::where('user_id', Auth::id())
            ->where('is_legacy', false)
            ->with(['activityLogs' => function ($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return \Inertia\Inertia::render('Cabang/Riwayat', [
            'perizinans' => $perizinans
        ]);
    }

    public function store(Request $request)
    {
        $action = $request->input('action', 'draft');
        $data = $request->validate(array_merge($this->formValidationRules($action), $this->fileValidationRules()), $this->fileValidationMessages());

        $fileData = $this->handleFileUploads($request);
        $data = array_merge($data, $fileData);

        $data['sdm_laki'] = (int) $request->input('sdm_laki', 0);
        $data['sdm_perempuan'] = (int) $request->input('sdm_perempuan', 0);
        $data['sdm_tka'] = (int) $request->input('sdm_tka', 0);

        $allFilesComplete = $this->areAllRequiredFilesPresent($request);

        if ($action === 'submit' && $allFilesComplete) {
            $status = 'verifikasi_internal';
            $message = 'Pengajuan berhasil disubmit dan sedang diproses!';
        } elseif ($action === 'submit' && !$allFilesComplete) {
            return redirect()->back()->with('error', 'Semua isian formulir dan dokumen persyaratan wajib diisi untuk melakukan Submit Pengajuan!')->withInput();
        } else {
            $status = 'draft';
            $message = 'Pengajuan disimpan sebagai Draft.';
        }

        $data['user_id'] = Auth::id();
        $data['status'] = $status;
        $data['apj_id'] = null;

        $perizinan = Perizinan::create($data);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'perizinan_id' => $perizinan->id,
            'action' => $status === 'verifikasi_internal' ? 'submit_pengajuan' : 'create_draft',
            'description' => $status === 'verifikasi_internal' 
                ? 'Cabang mensubmit pengajuan baru'
                : 'Cabang membuat draft pengajuan baru',
        ]);

        return redirect()->route('cabang.dashboard')->with('success', $message);
    }

    public function show($id)
    {
        $perizinan = Perizinan::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        if (strtolower($perizinan->status) === 'draft') {
            return redirect()->route('cabang.pengajuan.edit', $id);
        }

        return \Inertia\Inertia::render('Cabang/ShowEdit', ['perizinan' => $perizinan]);
    }

    public function edit($id)
    {
        $perizinan = Perizinan::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $editableStatuses = ['draft', 'needs_revision'];
        $isBapPending = (strtolower($perizinan->status) === 'approved' && empty($perizinan->file_16));
        if (!in_array(strtolower($perizinan->status), $editableStatuses) && !$isBapPending) {
            return redirect()->route('cabang.pengajuan.show', $id)
                ->with('error', 'Data dengan status saat ini tidak bisa diedit. Status dapat diedit hanya pada Draft, Revisi, atau saat mengunggah BAP Menyusul.');
        }

        return \Inertia\Inertia::render('Cabang/ShowEdit', ['perizinan' => $perizinan]);
    }

    public function update(Request $request, $id)
    {
        $perizinan = Perizinan::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        $editableStatuses = ['draft', 'needs_revision'];
        $isBapPending = (strtolower($perizinan->status) === 'approved' && empty($perizinan->file_16));
        $isSubmitBap = $request->has('submit_bap');
        
        if (!$isSubmitBap && !in_array(strtolower($perizinan->status), $editableStatuses) && !$isBapPending) {
            return redirect()->route('cabang.pengajuan.show', $id)
                ->with('error', 'Data dengan status saat ini tidak bisa diedit. Status dapat diedit hanya pada Draft, Revisi, atau saat mengunggah BAP Menyusul.');
        }

        if ($request->has('submit_bap') || (strtolower($perizinan->status) === 'approved' && empty($perizinan->file_16))) {
            if ($request->hasFile('file_16')) {
                $request->validate(['file_16' => 'file|mimes:pdf|max:5120']);
                $updateData = ['file_16' => $request->file('file_16')->store('berkas')];
                if ($perizinan->file_16) {
                    $oldFiles = $perizinan->old_files ? json_decode($perizinan->old_files, true) : [];
                    $oldFiles['file_16'] = $perizinan->file_16;
                    $updateData['old_files'] = json_encode($oldFiles);
                }
                
                // Clear revisi status for BAP after upload
                if ($perizinan->status_dokumen) {
                    $statusDokumen = json_decode($perizinan->status_dokumen, true);
                    if (isset($statusDokumen['16']) && $statusDokumen['16'] === 'revisi') {
                        $statusDokumen['16'] = 'diperbarui';
                        $updateData['status_dokumen'] = json_encode($statusDokumen);
                    }
                }
                
                $perizinan->update($updateData);
                return redirect()->route('cabang.pengajuan.show', $id)
                    ->with('success', 'Berita Acara Pemeriksaan (BAP) berhasil diunggah.');
            }
            return redirect()->route('cabang.pengajuan.show', $id)
                ->with('error', 'Tidak ada dokumen BAP baru yang diunggah.');
        }

        $action = $request->input('action', 'draft');
        $data = $request->validate(array_merge($this->formValidationRules($action), $this->fileValidationRules()), $this->fileValidationMessages());

        $fileData = $this->handleFileUploads($request, $perizinan);
        
        foreach ($this->requiredFileFields() as $field) {
            if (!$request->hasFile($field)) {
                unset($data[$field]);
            }
        }

        $data = array_merge($data, $fileData);

        $data['sdm_laki'] = (int) $request->input('sdm_laki', $perizinan->sdm_laki ?? 0);
        $data['sdm_perempuan'] = (int) $request->input('sdm_perempuan', $perizinan->sdm_perempuan ?? 0);
        $data['sdm_tka'] = (int) $request->input('sdm_tka', $perizinan->sdm_tka ?? 0);

        $oldFiles = json_decode($perizinan->old_files, true) ?? [];
        
        foreach ($this->requiredFileFields() as $field) {
            if ($request->hasFile($field) && $perizinan->$field) {
                if (strtolower($perizinan->status) === 'needs_revision') {
                    $oldFiles[$field] = $perizinan->$field;
                } else {
                    \Illuminate\Support\Facades\Storage::delete($perizinan->$field);
                }
            }
        }
        
        $statusDokumen = json_decode($perizinan->status_dokumen, true) ?? [];
        $revisiFields = $statusDokumen['revisi_fields'] ?? [];
        
        $flatRevisiFields = [];
        if (isset($revisiFields['bagian2'])) $flatRevisiFields = array_merge($flatRevisiFields, $revisiFields['bagian2']);
        if (isset($revisiFields['bagian3'])) $flatRevisiFields = array_merge($flatRevisiFields, $revisiFields['bagian3']);
        
        foreach ($flatRevisiFields as $field) {
            if (array_key_exists($field, $data)) {
                if (!isset($oldFiles[$field])) {
                    $oldFiles[$field] = $perizinan->$field;
                }
            }
        }

        $data['old_files'] = json_encode($oldFiles);

        $allFilesComplete = $this->areAllRequiredFilesPresent($request, $perizinan);

        if ($action === 'submit' && $allFilesComplete) {
            $status = 'verifikasi_internal';
            $message = 'Pengajuan berhasil disubmit dan sedang diproses!';
        } elseif ($action === 'submit' && !$allFilesComplete) {
            return redirect()->back()->with('error', 'Semua dokumen persyaratan wajib diunggah untuk melakukan Submit Pengajuan!')->withInput();
        } else {
            if (strtolower($perizinan->status) === 'needs_revision') {
                $status = 'needs_revision';
                $message = 'Perubahan revisi berhasil disimpan. Jangan lupa Submit jika sudah selesai.';
            } elseif (strtolower($perizinan->status) === 'verifikasi_internal') {
                $status = 'verifikasi_internal';
                $message = 'Pembaruan dokumen berhasil disimpan.';
            } else {
                $status = 'draft';
                $message = 'Pengajuan disimpan sebagai Draft.';
            }
        }

        $data['status'] = $status;

        $perizinan->update($data);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'perizinan_id' => $perizinan->id,
            'action' => $status === 'verifikasi_internal' ? 'submit_pengajuan' : 'update_draft',
            'description' => $status === 'verifikasi_internal' 
                ? 'Cabang mensubmit pengajuan yang sebelumnya berstatus draft atau revisi'
                : 'Cabang memperbarui data/berkas pada draft pengajuan',
        ]);

        return redirect()->route('cabang.dashboard')->with('success', $message);
    }

    public function destroy($id)
    {
        $perizinan = Perizinan::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        if (strtolower($perizinan->status) !== 'draft') {
            return redirect()->back()->with('error', 'Hanya pengajuan Draft yang bisa dihapus!');
        }

        foreach ($this->requiredFileFields() as $field) {
            if ($perizinan->$field) {
                Storage::delete($perizinan->$field);
            }
        }

        $perizinanId = $perizinan->id;
        $perizinan->delete();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'perizinan_id' => null,
            'action' => 'delete_draft',
            'description' => 'Cabang menghapus draft pengajuan dengan ID ' . $perizinanId,
        ]);

        return redirect()->route('cabang.dashboard')->with('success', 'Draft berhasil dihapus.');
    }

    private function formValidationRules($action = 'draft'): array
    {
        $req = $action === 'submit' ? 'required' : 'nullable';
        
        return [
            'jenis_perizinan' => 'required|string|max:100',
            'nama_apotek' => 'required|string|max:255',
            'tanggal_pengajuan' => 'required|date',
            'keterangan' => 'nullable|string',
            'kode_pos' => $req . '|string|max:20',
            'alamat_lengkap' => 'nullable|string',
            'luas_lahan' => $req . '|string|max:100',
            'bangunan_renovasi' => $req . '|string|max:100',
            'mesin_peralatan' => $req . '|string|max:100',
            'investasi_lain' => $req . '|string|max:100',
            'modal_kerja' => $req . '|string|max:100',
            'omzet_pertahun' => $req . '|string|max:100',
            'sdm_laki' => $req . '|integer',
            'sdm_perempuan' => $req . '|integer',
            'sdm_tka' => $req . '|integer',
            'nama_rencana_usaha' => $req . '|string|max:255',
            'deskripsi_kegiatan' => $req . '|string',
            'deskripsi_lokasi' => $req . '|string',
            'lokasi_alamat_lengkap' => $req . '|string',
        ];
    }

    private function fileValidationRules(): array
    {
        $rules = [];

        foreach ($this->requiredFileFields() as $field) {
            if ($field === 'file_15' || $field === 'file_6') {
                $rules[$field] = 'nullable|file|mimes:zip|max:5120';
            } else {
                $rules[$field] = 'nullable|file|mimes:pdf|max:5120';
            }
        }

        return $rules;
    }

    private function fileValidationMessages(): array
    {
        $messages = [];
        $labels = [
            'file_1' => 'SIA terakhir',
            'file_2' => 'SIPA Terbaru yang masih berlaku',
            'file_3' => 'Akta perjanjian sewa',
            'file_4' => 'Rencana Teknis Bangunan/Rencana Induk Kawasan (RTB/RIK)',
            'file_5' => 'Izin lokasi yang diterbitkan OSS',
            'file_6' => 'Peta polygon (ZIP)',
            'file_7' => 'Administrasi',
            'file_8' => 'Lokasi',
            'file_9' => 'Bangunan',
            'file_10' => 'Sarpras',
            'file_11' => 'SDM Lengkap',
            'file_12' => 'Sertifikat dan IMB',
            'file_13' => 'Data kesesuaian tata ruang',
            'file_14' => 'Peta lokasi',
            'file_15' => 'SHP peta tapak proyek (ZIP)',
            'file_16' => 'Berita Acara Pemeriksaan (BAP)',
        ];

        foreach ($this->requiredFileFields() as $field) {
            $label = $labels[$field] ?? 'Dokumen';
            if ($field === 'file_15' || $field === 'file_6') {
                $messages[$field . '.max'] = "Ukuran file untuk [{$label}] terlalu besar! Maksimal adalah 4 MB. Mohon kompres file ZIP Anda.";
                $messages[$field . '.mimes'] = "Format file untuk [{$label}] tidak sesuai (wajib berformat ZIP).";
            } else {
                $messages[$field . '.max'] = "Ukuran file untuk [{$label}] terlalu besar! Maksimal adalah 4 MB. Mohon kompres atau perkecil file PDF Anda.";
                $messages[$field . '.mimes'] = "Format file untuk [{$label}] tidak sesuai (wajib berformat PDF saja, format JPG atau lainnya tidak diperbolehkan).";
            }
            $messages[$field . '.file'] = "Dokumen [{$label}] harus berupa file yang valid.";
            $messages[$field . '.required'] = "Dokumen [{$label}] wajib diunggah.";
        }

        return $messages;
    }

    private function requiredFileFields(): array
    {
        $fields = [];

        for ($i = 1; $i <= 16; $i++) {
            $fields[] = 'file_' . $i;
        }

        return $fields;
    }

    private function areAllRequiredFilesPresent(Request $request, Perizinan $perizinan = null): bool
    {
        $statusDokumen = [];
        if ($perizinan && $perizinan->status_dokumen) {
            $statusDokumen = is_string($perizinan->status_dokumen) ? json_decode($perizinan->status_dokumen, true) : $perizinan->status_dokumen;
        }

        foreach ($this->requiredFileFields() as $field) {
            if ($field === 'file_16') {
                continue;
            }

            if ($request->hasFile($field)) {
                continue;
            }

            $index = str_replace('file_', '', $field);
            $isRevisi = isset($statusDokumen[$index]) && $statusDokumen[$index] === 'revisi';

            if ($perizinan && $perizinan->$field && !$isRevisi) {
                continue;
            }

            return false;
        }

        return true;
    }

    private function handleFileUploads(Request $request, Perizinan $perizinan = null): array
    {
        $saved = [];
        $oldFiles = $perizinan && $perizinan->old_files ? json_decode($perizinan->old_files, true) : [];
        $hasOldFilesUpdate = false;

        foreach ($this->requiredFileFields() as $field) {
            if ($request->hasFile($field)) {
                if ($perizinan && $perizinan->$field) {
                    $oldFiles[$field] = $perizinan->$field;
                    $hasOldFilesUpdate = true;
                }

                $saved[$field] = $request->file($field)->store('berkas');
            }
        }
        
        if ($hasOldFilesUpdate) {
            $saved['old_files'] = json_encode($oldFiles);
        }

        return $saved;
    }

    public function activityLog(Request $request)
    {
        $query = Perizinan::where('user_id', Auth::id())
            ->with(['apj', 'activityLogs' => function ($q) {
                $q->latest();
            }]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_apotek', 'like', "%{$search}%")
                  ->orWhereHas('apj', function ($q2) use ($search) {
                      $q2->where('nama_lengkap', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perizinans = $query->latest()->paginate(10)->withQueryString();

        return inertia('Cabang/ActivityLog', [
            'perizinans' => $perizinans,
            'filters' => $request->only(['search', 'status']),
        ]);
    }
}
