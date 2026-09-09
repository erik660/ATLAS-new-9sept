<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE perizinans SET status = 'submitted' WHERE status = 'pending'");
        DB::statement("UPDATE perizinans SET status = 'approved' WHERE status = 'disetujui'");
        DB::statement("UPDATE perizinans SET status = 'needs_revision' WHERE status = 'ditolak'");

        DB::statement("ALTER TABLE perizinans MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft'");

        Schema::table('perizinans', function (Blueprint $table) {
            if (! Schema::hasColumn('perizinans', 'catatan_revisi')) {
                $table->text('catatan_revisi')->nullable()->after('catatan_keputusan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            $table->dropColumn('catatan_revisi');
        });

        DB::statement("ALTER TABLE perizinans MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft'");
    }
};
