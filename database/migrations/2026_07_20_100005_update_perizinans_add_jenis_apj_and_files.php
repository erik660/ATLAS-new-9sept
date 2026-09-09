<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            $table->string('jenis_perizinan')->nullable()->after('user_id');
            $table->foreignId('apj_id')->nullable()->constrained('apjs')->nullOnDelete()->after('jenis_perizinan');
            $table->string('file_1')->nullable()->after('file_path');
            $table->string('file_2')->nullable()->after('file_1');
            $table->string('file_3')->nullable()->after('file_2');
            $table->string('file_4')->nullable()->after('file_3');
            $table->string('file_5')->nullable()->after('file_4');
            $table->string('file_6')->nullable()->after('file_5');
            $table->string('file_7')->nullable()->after('file_6');
            $table->string('file_8')->nullable()->after('file_7');
            $table->string('file_9')->nullable()->after('file_8');
            $table->string('file_10')->nullable()->after('file_9');
            $table->string('file_11')->nullable()->after('file_10');
            $table->string('file_12')->nullable()->after('file_11');
            $table->string('file_13')->nullable()->after('file_12');
            $table->string('file_14')->nullable()->after('file_13');
            $table->string('file_15')->nullable()->after('file_14');
            $table->string('file_16')->nullable()->after('file_15');
        });
    }

    public function down(): void
    {
        Schema::table('perizinans', function (Blueprint $table) {
            $table->dropForeign(['apj_id']);
            $table->dropColumn('apj_id');
            $table->dropColumn('jenis_perizinan');
            for ($i = 16; $i >= 1; $i--) {
                $table->dropColumn('file_' . $i);
            }
        });
    }
};
