<?php

namespace Database\Seeders;

use App\Models\Apj;
use App\Models\Perizinan;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PerizinanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            ['kode_sap' => '3113AM02', 'unit' => 'Depok', 'nama_apotek' => 'KF.0202', 'masa_berlaku' => now()->addMonths(3)],
            ['kode_sap' => '3113AM03', 'unit' => 'Depok', 'nama_apotek' => 'KF.0352 Margonda', 'masa_berlaku' => now()->addMonths(3)],
            ['kode_sap' => '3113AM04', 'unit' => 'Depok', 'nama_apotek' => 'KF.0366 Maharaja', 'masa_berlaku' => now()->addMonths(3)],
            ['kode_sap' => '3113AM06', 'unit' => 'Depok', 'nama_apotek' => 'KF.0382 K2', 'masa_berlaku' => now()->addMonths(3)],
            ['kode_sap' => '3113AM07', 'unit' => 'Depok', 'nama_apotek' => 'KF.0389', 'masa_berlaku' => now()->addMonths(3)],
            ['kode_sap' => '3113AM08', 'unit' => 'Depok', 'nama_apotek' => 'KF.0391', 'masa_berlaku' => now()->addMonths(3)],
            ['kode_sap' => '3113AM10', 'unit' => 'Depok', 'nama_apotek' => 'KF.0456 Cinere', 'masa_berlaku' => now()->addMonths(3)],
            ['kode_sap' => '3113AM12', 'unit' => 'Depok', 'nama_apotek' => 'KF.0491 Sawangan', 'masa_berlaku' => now()->addMonths(3)],

            ['kode_sap' => '3113AM14', 'unit' => 'Depok', 'nama_apotek' => 'KF.0696 Yusuf Depok', 'masa_berlaku' => now()->addMonths(9)],
            ['kode_sap' => '3113AM15', 'unit' => 'Depok', 'nama_apotek' => 'KF.0801 Sentosa', 'masa_berlaku' => now()->addMonths(9)],
            ['kode_sap' => '3113AM16', 'unit' => 'Depok', 'nama_apotek' => 'KF.0802 T Iskandar', 'masa_berlaku' => now()->addMonths(9)],
            ['kode_sap' => '3113AM17', 'unit' => 'Depok', 'nama_apotek' => 'KF.0757', 'masa_berlaku' => now()->addMonths(9)],
            ['kode_sap' => '3113AM18', 'unit' => 'Depok', 'nama_apotek' => 'KF.0739 Pekapuran', 'masa_berlaku' => now()->addMonths(9)],
            ['kode_sap' => '3113AM19', 'unit' => 'Depok', 'nama_apotek' => 'KF.0902 Radar Auri', 'masa_berlaku' => now()->addMonths(9)],
            ['kode_sap' => '3113AM20', 'unit' => 'Depok', 'nama_apotek' => 'KF.0937 Raya Bogor', 'masa_berlaku' => now()->addMonths(9)],
            ['kode_sap' => '3113AM21', 'unit' => 'Depok', 'nama_apotek' => 'KF.1031 Cileungsi', 'masa_berlaku' => now()->addMonths(9)],

            ['kode_sap' => '3113AM22', 'unit' => 'Depok', 'nama_apotek' => 'KF.1070 Kukusan', 'masa_berlaku' => now()->addMonths(18)],
            ['kode_sap' => '3113AM24', 'unit' => 'Depok', 'nama_apotek' => 'KF. Ratu Jaya', 'masa_berlaku' => now()->addMonths(18)],
            ['kode_sap' => '3113AM25', 'unit' => 'Depok', 'nama_apotek' => 'KF. Pondok Duta', 'masa_berlaku' => now()->addMonths(18)],
            ['kode_sap' => '3113AM27', 'unit' => 'Depok', 'nama_apotek' => 'KF. Adelina Sawangan', 'masa_berlaku' => now()->addMonths(18)],
            ['kode_sap' => '3113AM28', 'unit' => 'Depok', 'nama_apotek' => 'KF. Boulevard GDC', 'masa_berlaku' => now()->addMonths(18)],
            ['kode_sap' => '3113AM31', 'unit' => 'Depok', 'nama_apotek' => 'KF. Adelina Tanah Baru', 'masa_berlaku' => now()->addMonths(18)],
            ['kode_sap' => '3113AM32', 'unit' => 'Depok', 'nama_apotek' => 'KF. Telanggung', 'masa_berlaku' => now()->addMonths(18)],
        ];

        $submittedBranches = [
            '3113AM02',
            '3113AM14',
            '3113AM22',
        ];

        foreach ($branches as $index => $branch) {
            // Create or update user for the branch, keep unit information
            $user = User::updateOrCreate(
                ['kode_sap' => $branch['kode_sap']],
                [
                    'name' => $branch['nama_apotek'],
                    'email' => strtolower($branch['kode_sap']) . '@apotek.com',
                    'password' => bcrypt('password123'),
                    'role' => 'cabang',
                    'unit_bisnis' => $branch['unit'] ?? null,
                ]
            );

            // Create or update APJ record
            Apj::updateOrCreate(
                ['nama_apj' => 'APJ ' . $branch['kode_sap']],
                [
                    'no_sip' => 'SIP' . $branch['kode_sap'],
                    'masa_berlaku' => $branch['masa_berlaku'],
                ]
            );

            // NOTE: Intentionally NOT creating any Perizinan records here.
            // Seeder will only populate users and APJ so branches can login with empty perizinan history.
        }
    }
}
