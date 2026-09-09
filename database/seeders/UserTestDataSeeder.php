<?php

namespace Database\Seeders;

use App\Models\Apj;
use App\Models\Perizinan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'kode_sap' => '3101AA02',
                'unit_bisnis' => 'Banda Aceh',
                'nama_apotek' => 'KF.0060 Arun',
                'masa_berlaku' => '2027-03-20',
            ],
            [
                'kode_sap' => '3101AA05',
                'unit_bisnis' => 'Banda Aceh',
                'nama_apotek' => 'KF.0161 Seutui',
                'masa_berlaku' => '2031-01-21',
            ],
            [
                'kode_sap' => '3101AA42',
                'unit_bisnis' => 'Banda Aceh',
                'nama_apotek' => 'KF Sultan Iskandar Muda',
                'masa_berlaku' => '2027-02-10',
            ],
            [
                'kode_sap' => '3103AC13',
                'unit_bisnis' => 'Bandung',
                'nama_apotek' => 'KF.0320 Amanah',
                'masa_berlaku' => '2029-07-30',
            ],
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

            // Buat perizinan dengan status approved (karena masuknya di tabel sepertinya izin yg sudah terbit)
            Perizinan::create([
                'user_id' => $user->id,
                'jenis_perizinan' => 'Perpanjangan',
                'apj_id' => $apj->id,
                'status' => 'approved',
                'is_legacy' => true,
                'tanggal_pengajuan' => Carbon::now()->subMonths(1),
                'nama_apotek' => $item['nama_apotek'],
                'keterangan' => 'Data testing ditambahkan via Seeder',
            ]);
        }

        $this->command->info('Data dari gambar berhasil dimasukkan!');
    }
}
