<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            if (!Schema::hasColumn('perizinans', 'status_dokumen')) {
                $table->text('status_dokumen')->nullable()->after('catatan_revisi');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            if (Schema::hasColumn('perizinans', 'status_dokumen')) {
                $table->dropColumn('status_dokumen');
            }
        });
    }
};
