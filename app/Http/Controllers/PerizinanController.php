<?php

namespace App\Http\Controllers;

use App\Models\Apj;
use App\Models\Perizinan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PerizinanController extends Controller
{
    public function index()
    {
        $perizinans = Perizinan::where('user_id', Auth::id())
            ->orderBy('tanggal_pengajuan', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return view('dashboard', compact('perizinans'));
    }

    public function create()
    {
        return view('perizinan.create');
    }

    public function store(Request $request)
    {
        $action = $request->input('action', 'draft');

        $data = $request->validate(array_merge([
            'jenis_perizinan' => 'required|string|max:50',
            'nama_apotek' => 'required|string|max:255',
            'tanggal_pengajuan' => 'required|date',
            'keterangan' => 'nullable|string',
            
            'kode_pos' => 'nullable|string|max:10',
            'alamat_lengkap' => 'nullable|string',
            'luas_lahan' => 'nullable|string|max:255',
            'nama_rencana_usaha' => 'nullable|string|max:255',
            'deskripsi_kegiatan' => 'nullable|string',
            'deskripsi_lokasi' => 'nullable|string',
            'lokasi_alamat_lengkap' => 'nullable|string',
            
            'bangunan_renovasi' => 'nullable|numeric',
            'mesin_peralatan' => 'nullable|numeric',
            'investasi_lain' => 'nullable|numeric',
            'modal_kerja' => 'nullable|numeric',
            'omzet_pertahun' => 'nullable|numeric',
            'sdm_laki' => 'nullable|integer',
            'sdm_perempuan' => 'nullable|integer',
            'sdm_tka' => 'nullable|integer',
        ], $this->fileValidationRules()));

        if ($action === 'submit' && $this->hasMissingFiles($request)) {
            return redirect()->back()
                ->withInput()
                ->withErrors(['action' => 'Semua dokumen wajib diisi sebelum mengajukan permohonan']);
        }

        $fileData = $this->handleFileUploads($request);
        $data = array_merge($data, $fileData);

        $data['user_id'] = Auth::id();
        $data['status'] = $action === 'submit' ? 'verifikasi_internal' : 'draft';
        $data['apj_id'] = null;

        Perizinan::create($data);

        $message = $action === 'submit' ? 'Perizinan berhasil diajukan.' : 'Perizinan berhasil disimpan sebagai draft.';
        return redirect('/dashboard')->with('success', $message);
    }

    public function show($id)
    {
        $perizinan = Perizinan::where('user_id', Auth::id())
            ->findOrFail($id);

        $apjs = Apj::all();

        return view('perizinan.show_edit', compact('perizinan', 'apjs'));
    }

    public function update(Request $request, $id)
    {
        $perizinan = Perizinan::where('user_id', Auth::id())
            ->findOrFail($id);

        if (! in_array($perizinan->status, ['draft', 'needs_revision'])) {
            return redirect()->back()->with('error', 'Perizinan tidak dapat diedit pada status saat ini.');
        }

        $action = $request->input('action', 'draft');

        $data = $request->validate(array_merge([
            'jenis_perizinan' => 'required|string|max:50',
            'nama_apotek' => 'required|string|max:255',
            'tanggal_pengajuan' => 'required|date',
            'keterangan' => 'nullable|string',
            
            'kode_pos' => 'nullable|string|max:10',
            'alamat_lengkap' => 'nullable|string',
            'luas_lahan' => 'nullable|string|max:255',
            'nama_rencana_usaha' => 'nullable|string|max:255',
            'deskripsi_kegiatan' => 'nullable|string',
            'deskripsi_lokasi' => 'nullable|string',
            'lokasi_alamat_lengkap' => 'nullable|string',
            
            'bangunan_renovasi' => 'nullable|numeric',
            'mesin_peralatan' => 'nullable|numeric',
            'investasi_lain' => 'nullable|numeric',
            'modal_kerja' => 'nullable|numeric',
            'omzet_pertahun' => 'nullable|numeric',
            'sdm_laki' => 'nullable|integer',
            'sdm_perempuan' => 'nullable|integer',
            'sdm_tka' => 'nullable|integer',
        ], $this->fileValidationRules()));

        if ($action === 'submit' && $this->hasMissingFiles($request, $perizinan)) {
            return redirect()->back()
                ->withInput()
                ->withErrors(['action' => 'Semua dokumen wajib diisi sebelum mengajukan permohonan']);
        }

        $oldFiles = json_decode($perizinan->old_files, true) ?? [];
        
        for ($i = 1; $i <= 15; $i++) {
            $field = 'file_' . $i;
            if ($request->hasFile($field) && $perizinan->$field) {
                $oldFiles[$field] = $perizinan->$field;
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

        $fileData = $this->handleFileUploads($request, $perizinan, false);
        $data = array_merge($data, $fileData);

        $data['old_files'] = json_encode($oldFiles);
        $data['status'] = $action === 'submit' ? 'verifikasi_internal' : 'draft';

        $perizinan->update($data);

        $message = $action === 'submit' ? 'Perizinan berhasil diajukan.' : 'Perizinan berhasil disimpan sebagai draft.';
        return redirect('/dashboard')->with('success', $message);
    }

    public function destroy($id)
    {
        $perizinan = Perizinan::where('user_id', Auth::id())
            ->findOrFail($id);

        $this->deleteAllFiles($perizinan);

        $perizinan->delete();

        return redirect('/dashboard')->with('success', 'Perizinan berhasil dihapus.');
    }

    private function fileValidationRules(): array
    {
        $rules = [];

        for ($i = 1; $i <= 15; $i++) {
            if ($i === 15) {
                $rules['file_' . $i] = 'nullable|file|mimes:zip,pdf|max:4096';
            } else {
                $rules['file_' . $i] = 'nullable|file|mimes:pdf|max:4096';
            }
        }

        return $rules;
    }

    private function handleFileUploads(Request $request, Perizinan $perizinan = null, $deleteOld = true): array
    {
        $saved = [];

        for ($i = 1; $i <= 15; $i++) {
            $field = 'file_' . $i;

            if ($request->hasFile($field)) {
                if ($deleteOld && $perizinan && $perizinan->$field) {
                    Storage::delete($perizinan->$field);
                }

                $saved[$field] = $request->file($field)->store('dokumen_perizinan');
            }
        }

        return $saved;
    }

    private function hasMissingFiles(Request $request, Perizinan $perizinan = null): bool
    {
        for ($i = 1; $i <= 15; $i++) {
            $field = 'file_' . $i;

            if ($request->hasFile($field)) {
                continue;
            }

            if ($perizinan && $perizinan->$field) {
                continue;
            }

            return true;
        }

        return false;
    }

    private function deleteAllFiles(Perizinan $perizinan): void
    {
        for ($i = 1; $i <= 15; $i++) {
            $field = 'file_' . $i;
            if ($perizinan->$field) {
                Storage::delete($perizinan->$field);
            }
        }

        if ($perizinan->file_path) {
            Storage::delete($perizinan->file_path);
        }
    }
}
