<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Apj;

class Perizinan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'jenis_perizinan',
        'nku',
        'apj_id',
        'nama_apotek',
        'status',
        'tanggal_pengajuan',
        'keterangan',
        'catatan_keputusan',
        'catatan_revisi',
        'status_dokumen',
        'catatan_dokumen',
        'surat_izin_final',
        'old_files',
        'file_path',
        'file_1',
        'file_2',
        'file_3',
        'file_4',
        'file_5',
        'file_6',
        'file_7',
        'file_8',
        'file_9',
        'file_10',
        'file_11',
        'file_12',
        'file_13',
        'file_14',
        'file_15',
        'file_16',
        'kode_pos',
        'alamat_lengkap',
        'luas_lahan',
        'bangunan_renovasi',
        'mesin_peralatan',
        'investasi_lain',
        'modal_kerja',
        'omzet_pertahun',
        'sdm_laki',
        'sdm_perempuan',
        'sdm_tka',
        'nama_rencana_usaha',
        'deskripsi_kegiatan',
        'deskripsi_lokasi',
        'lokasi_alamat_lengkap',
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function apj(): BelongsTo
    {
        return $this->belongsTo(Apj::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
