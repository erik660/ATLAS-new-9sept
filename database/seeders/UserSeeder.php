<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::updateOrCreate(
            ['email' => '3113AM01@apotek.com'],
            [
                'kode_sap' => '3113AM01',
                'name' => 'User Depok',
                'password' => bcrypt('password123'),
                'role' => 'admin',
            ]
        );
    }
}
