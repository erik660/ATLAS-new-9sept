<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            $table->string('kode_pos')->nullable()->after('file_16');
            $table->text('alamat_lengkap')->nullable()->after('kode_pos');
            $table->string('luas_lahan')->nullable()->after('alamat_lengkap');
            $table->string('bangunan_renovasi')->nullable()->after('luas_lahan');
            $table->string('mesin_peralatan')->nullable()->after('bangunan_renovasi');
            $table->string('investasi_lain')->nullable()->after('mesin_peralatan');
            $table->string('modal_kerja')->nullable()->after('investasi_lain');
            $table->string('omzet_pertahun')->nullable()->after('modal_kerja');
            $table->integer('sdm_laki')->nullable()->default(0)->after('omzet_pertahun');
            $table->integer('sdm_perempuan')->nullable()->default(0)->after('sdm_laki');
            $table->integer('sdm_tka')->nullable()->default(0)->after('sdm_perempuan');
            $table->string('nama_rencana_usaha')->nullable()->after('sdm_tka');
            $table->text('deskripsi_kegiatan')->nullable()->after('nama_rencana_usaha');
            $table->text('deskripsi_lokasi')->nullable()->after('deskripsi_kegiatan');
            $table->text('lokasi_alamat_lengkap')->nullable()->after('deskripsi_lokasi');
        });
    }

    public function down(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
