<?php

namespace Database\Seeders;

use App\Models\Apj;
use App\Models\Perizinan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DummyExpiredSeeder extends Seeder
{
    public function run(): void
    {
        $jenisList = [
            'Perpanjangan',
            'Perubahan APJ',
            'Perpanjangan & Perubahan APJ',
        ];

        $cabangs = User::where('role', 'cabang')->get();
        $counter = 0;

        foreach ($cabangs as $cabang) {
            $jenisRandom = $jenisList[array_rand($jenisList)];
            
            // 4 pertama merah (< 6 bulan)
            if ($counter < 4) {
                $masaBerlaku = Carbon::now()->addMonths(rand(1, 5));
            } 
            // 6 berikutnya kuning (6 - 12 bulan)
            elseif ($counter >= 4 && $counter < 10) {
                $masaBerlaku = Carbon::now()->addMonths(rand(7, 11));
            } 
            // sisanya hijau (> 12 bulan)
            else {
                $masaBerlaku = Carbon::now()->addMonths(rand(13, 24));
            }

            $apj = Apj::create([
                'nama_apj' => 'APJ ' . $cabang->kode_sap,
                'no_sip' => 'SIP' . $cabang->kode_sap . time(),
                'masa_berlaku' => $masaBerlaku,
            ]);

            Perizinan::create([
                'user_id' => $cabang->id,
                'jenis_perizinan' => $jenisRandom,
                'apj_id' => $apj->id,
                'status' => 'approved',
                'tanggal_pengajuan' => Carbon::now()->subMonths(rand(1, 6)),
                'nama_apotek' => $cabang->name,
                'keterangan' => 'Simulasi monitoring expired - ' . $cabang->unit_bisnis,
            ]);

            $counter++;
        }

        $this->command->info('Dummy expired data seeded successfully!');
    }
}
