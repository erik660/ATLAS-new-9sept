<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            if (! Schema::hasColumn('perizinans', 'catatan_admin')) {
                $table->text('catatan_admin')->nullable()->after('catatan_keputusan');
            }

            if (! Schema::hasColumn('perizinans', 'reminder_sent_at')) {
                $table->timestamp('reminder_sent_at')->nullable()->after('catatan_admin');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            if (Schema::hasColumn('perizinans', 'reminder_sent_at')) {
                $table->dropColumn('reminder_sent_at');
            }

            if (Schema::hasColumn('perizinans', 'catatan_admin')) {
                $table->dropColumn('catatan_admin');
            }
        });
    }
};
