<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MasterCabangSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = base_path('master_cabang.csv');
        if (!file_exists($csvPath)) {
            if (isset($this->command)) {
                $this->command->error("File master_cabang.csv tidak ditemukan di " . $csvPath);
            }
            return;
        }

        if (isset($this->command)) {
            $this->command->info("Membaca data master cabang dari master_cabang.csv...");
        }
        
        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            if (isset($this->command)) {
                $this->command->error("Gagal membuka file master_cabang.csv");
            }
            return;
        }

        $rowNumber = 0;
        $imported = 0;
        $passwordHash = Hash::make('password123');

        DB::beginTransaction();
        try {
            while (($data = fgetcsv($handle, 10000, ",")) !== false) {
                $rowNumber++;
                if ($rowNumber === 1) {
                    // Skip header
                    continue;
                }

                $kodeSap = strtoupper(trim($data[0] ?? ''));
                $unitBisnis = trim($data[2] ?? '');
                $namaApotek = trim($data[3] ?? '');
                $alamat = trim($data[4] ?? '');

                if (empty($kodeSap)) {
                    continue;
                }

                $email = strtolower($kodeSap) . '@kimiafarma.co.id';

                $existingUser = User::where('kode_sap', $kodeSap)->orWhere('email', $email)->first();
                if ($existingUser) {
                    $existingUser->update([
                        'kode_sap' => $kodeSap,
                        'name' => !empty($namaApotek) ? $namaApotek : 'Apotek KF ' . $kodeSap,
                        'unit_bisnis' => $unitBisnis,
                        'alamat' => $alamat,
                        'email' => $email,
                        'password' => $passwordHash,
                        'role' => 'cabang',
                    ]);
                } else {
                    User::create([
                        'kode_sap' => $kodeSap,
                        'name' => !empty($namaApotek) ? $namaApotek : 'Apotek KF ' . $kodeSap,
                        'unit_bisnis' => $unitBisnis,
                        'alamat' => $alamat,
                        'email' => $email,
                        'password' => $passwordHash,
                        'role' => 'cabang',
                    ]);
                }

                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            if (isset($this->command)) {
                $this->command->error("Gagal seeding: " . $e->getMessage());
            }
            fclose($handle);
            return;
        }

        fclose($handle);
        if (isset($this->command)) {
            $this->command->info("Berhasil mengimpor/memperbarui " . $imported . " data cabang ke tabel users!");
        }
    }
}
