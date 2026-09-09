<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Perizinan;
use App\Models\User;

echo "Perizinan count: " . Perizinan::count() . PHP_EOL;
echo "User count: " . User::count() . PHP_EOL;
$svc = User::where('kode_sap', 'service')->first();
if ($svc) {
    echo "Service user:\n";
    print_r($svc->toArray());
} else {
    echo "Service user: not found\n";
}
