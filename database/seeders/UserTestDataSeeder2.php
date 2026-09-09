<?php

namespace Database\Seeders;

use App\Models\Apj;
use App\Models\Perizinan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserTestDataSeeder2 extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'kode_sap' => '3113AM16',
                'unit_bisnis' => 'Depok',
                'nama_apotek' => 'KF 0802 T Iskandar',
                'masa_berlaku' => '2025-07-19', // Urgent (Red)
            ],
            [
                'kode_sap' => '3126AZ01',
                'unit_bisnis' => 'Gorontalo',
                'nama_apotek' => 'KF.0251',
                'masa_berlaku' => '2026-08-07', // Warning (Yellow)
            ]
        ];

        foreach ($data as $item) {
            // Buat atau cari user cabang
            $user = User::firstOrCreate(
                ['kode_sap' => $item['kode_sap']],
                [
                    'name' => $item['nama_apotek'],
                    'unit_bisnis' => $item['unit_bisnis'],
                    'email' => strtolower(str_replace([' ', '.'], '', $item['nama_apotek'])) . '@example.com',
                    'role' => 'cabang',
                    'password' => Hash::make('password123'),
                ]
            );

            // Buat data APJ sesuai masa berlaku di tabel
            $apj = Apj::create([
                'nama_apj' => 'APJ ' . $item['nama_apotek'],
                'no_sip' => 'SIP-' . $item['kode_sap'] . '-' . rand(100, 999),
                'masa_berlaku' => Carbon::parse($item['masa_berlaku']),
            ]);

            // Buat perizinan dengan status approved
            Perizinan::create([
                'user_id' => $user->id,
                'jenis_perizinan' => 'Baru',
                'apj_id' => $apj->id,
                'status' => 'approved',
                'is_legacy' => true,
                'tanggal_pengajuan' => Carbon::now()->subMonths(1),
                'nama_apotek' => $item['nama_apotek'],
                'keterangan' => 'Data testing ditambahkan via Seeder',
            ]);
        }

        $this->command->info('Data tambahan untuk uji coba berhasil dimasukkan!');
    }
}
