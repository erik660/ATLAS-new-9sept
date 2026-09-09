<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('catatan_keputusan');
        });
    }

    public function down(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            $table->dropColumn('file_path');
        });
    }
};
