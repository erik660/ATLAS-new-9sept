<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Apj;
use App\Models\Perizinan;
use Carbon\Carbon;

class ImportSiaExcel extends Command
{
    protected $signature = 'import:sia-excel';
    protected $description = 'Import data SIA from JSON (converted from Excel)';

    public function handle()
    {
        $path = base_path('apotek_data.json');
        if (!file_exists($path)) {
            $this->error('File apotek_data.json tidak ditemukan!');
            return 1;
        }

        $json = file_get_contents($path);
        $data = json_decode($json, true);

        $cutoffDate = Carbon::parse('2026-09-04');
        $insertedCount = 0;
        $skippedCount = 0;

        foreach ($data as $row) {
            $sap = $row['sap'];
            $unit = $row['unit'];
            $apotek = $row['apotek'];
            $masa = $row['masa'];

            if (empty($masa) || $masa === 'nan' || $masa === '0') {
                $skippedCount++;
                continue;
            }

            // Coba parse tanggal
            $parsedDate = null;
            try {
                // jika formatnya 22/07/2025
                if (strpos($masa, '/') !== false) {
                    $parsedDate = Carbon::createFromFormat('d/m/Y', explode(' ', $masa)[0]);
                } else {
                    $parsedDate = Carbon::parse($masa);
                }
            } catch (\Exception $e) {
                // jika teks (e.g. "Pergantian/Perpanjangan SIA")
                $skippedCount++;
                continue;
            }

            if (!$parsedDate) {
                $skippedCount++;
                continue;
            }

            // Jika sebelum 4 September 2026 -> skip
            if ($parsedDate->startOfDay()->lt($cutoffDate->startOfDay())) {
                $skippedCount++;
                continue;
            }

            // Jika lolos semua kondisi, masukkan ke DB.
            // 1. Cek atau buat User
            $user = User::firstOrCreate(
                ['kode_sap' => $sap],
                [
                    'unit_bisnis' => $unit,
                    'name' => $apotek,
                    'email' => strtolower($sap) . '@kimiafarma.co.id',
                    'password' => bcrypt('password123'),
                    'role' => 'cabang',
                    'alamat' => '-'
                ]
            );

            // 2. Buat Apj
            $apj = Apj::create([
                'nama_apj' => 'APJ ' . $apotek,
                'no_sip' => 'SIP-' . $sap,
                'masa_berlaku' => $parsedDate
            ]);

            // 3. Buat Perizinan
            Perizinan::create([
                'user_id' => $user->id,
                'apj_id' => $apj->id,
                'jenis_perizinan' => 'SIA',
                'nama_apotek' => $apotek,
                'status' => 'approved',
                'tanggal_pengajuan' => Carbon::now(),
            ]);

            $insertedCount++;
        }

        $this->info("Import Selesai! Berhasil masuk: $insertedCount, Di-skip: $skippedCount");
        return 0;
    }
}
