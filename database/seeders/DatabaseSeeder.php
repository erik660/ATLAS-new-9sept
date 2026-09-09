<?php

namespace Database\Seeders;

use App\Models\Apj;
use App\Models\Perizinan;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        DB::table('perizinans')->truncate();
        DB::table('users')->truncate();

        Schema::enableForeignKeyConstraints();

        User::create([
            'kode_sap' => 'service',
            'name' => 'Service Admin',
            'email' => 'service@apotek.com',
            'password' => bcrypt('123'),
            'role' => 'admin',
        ]);

        User::create([
            'kode_sap' => 'admin',
            'name' => 'Super Admin',
            'email' => 'admin@apotek.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $csvFile = base_path('data_cabang.csv');
        if (file_exists($csvFile)) {
            $handle = fopen($csvFile, 'r');
            // skip header
            fgetcsv($handle, 0, ';');
            
            $emptyAddressBranches = [
                'arjawinangun',
                'bangkir',
                'padangbulan',
                'sibolga',
                'sultan abdurrahman',
                'gusti hamzah',
                'kolonel mahardi',
                'natuna'
            ];

            $defaultPassword = bcrypt('password');

            while (($data = fgetcsv($handle, 0, ';')) !== false) {
                if (count($data) < 6) continue;

                $kodeSap = trim($data[0]);
                // $kode4 = trim($data[1]);
                $unitBisnis = trim($data[2]);
                // $korwil = trim($data[3]);
                $namaApotek = trim($data[4]);
                $alamatRaw = trim($data[5]);

                $alamat = $alamatRaw;
                // Check if branch needs empty address
                $checkString = strtolower($namaApotek . ' ' . $unitBisnis);
                foreach ($emptyAddressBranches as $keyword) {
                    if (str_contains($checkString, $keyword)) {
                        $alamat = '';
                        break;
                    }
                }

                User::create([
                    'kode_sap' => $kodeSap,
                    'name' => $namaApotek,
                    'email' => strtolower($kodeSap) . '@apotek.com',
                    'password' => $defaultPassword,
                    'role' => 'cabang',
                    'unit_bisnis' => $unitBisnis,
                    'no_wa' => '628' . rand(100000000, 999999999), // Dummy WA
                    'alamat' => $alamat,
                ]);

                Apj::create([
                    'nama_apj' => 'APJ ' . $kodeSap,
                    'no_sip' => 'SIP' . $kodeSap,
                    'masa_berlaku' => now()->addMonths(rand(1, 15)),
                ]);
            }
            fclose($handle);
        }
    }
}
