<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$deleted = $app->make('db')->table('perizinans')->where('keterangan', 'like', '%Dummy perizinan%')->delete();

echo "deleted: " . $deleted . PHP_EOL;
