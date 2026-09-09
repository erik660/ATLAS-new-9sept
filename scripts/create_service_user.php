<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$kode = 'service';
$password = '123';

$user = User::where('kode_sap', $kode)->first();

if (! $user) {
    $user = new User();
    $user->kode_sap = $kode;
    $user->name = 'Service Account';
    $user->email = 'service@example.local';
    $user->role = 'admin';
    $user->password = $password; // will be hashed by cast
    $user->save();
    echo "Created user: {$user->kode_sap} / password: {$password}\n";
} else {
    $user->password = $password;
    $user->role = 'admin';
    $user->name = $user->name ?: 'Service Account';
    $user->email = $user->email ?: 'service@example.local';
    $user->save();
    echo "Updated user: {$user->kode_sap} / password set to: {$password}\n";
}
