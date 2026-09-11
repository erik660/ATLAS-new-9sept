<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PerizinanController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\CabangAuthController;
use App\Http\Controllers\CabangController;


Route::get('/', function () {
    return redirect('/login');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Portal Admin
Route::prefix('admin')->group(function () {
    Route::get('/', function () {
        return redirect()->route('admin.dashboard');
    });

    Route::get('/login', function () {
        return redirect()->route('login');
    })->name('admin.login');
    
    Route::post('/logout', [AuthController::class, 'logout'])->name('admin.logout');

    Route::middleware(['admin'])->group(function () {
        Route::get('/dashboard', [AdminController::class, 'index'])->name('admin.dashboard');
        Route::get('/verifikasi', [AdminController::class, 'verifikasi'])->name('admin.verifikasi');
        Route::get('/laporan/cetak', [AdminController::class, 'printLaporan'])->name('admin.laporan.cetak');
        Route::get('/laporan/csv', [AdminController::class, 'downloadCsv'])->name('admin.laporan.csv');
        Route::get('/expired', [AdminController::class, 'expired'])->name('admin.expired');
        Route::get('/log', [AdminController::class, 'activityLog'])->name('admin.activity_log');
        Route::get('/verify/{id}', [AdminController::class, 'show'])->name('admin.perizinan.verify');
        Route::get('/verify/{id}/download-all', [AdminController::class, 'downloadAll'])->name('admin.perizinan.download_all');
        Route::post('/update/{id}', [AdminController::class, 'updateStatus'])->name('admin.perizinan.update');
        Route::post('/update-nku/{id}', [AdminController::class, 'updateNku'])->name('admin.perizinan.update_nku');
        Route::post('/completed/{id}', [AdminController::class, 'markCompleted'])->name('admin.perizinan.completed');

        Route::post('/verify/{id}/remind-document', [AdminController::class, 'remindDocument'])->name('admin.perizinan.remind_document');
        Route::post('/reminder/{id}', [AdminController::class, 'sendReminder'])->name('admin.perizinan.reminder');

        Route::get('/bank-data', [AdminController::class, 'bankData'])->name('admin.bank_data');
        Route::get('/bank-data/{id}/catatan', [AdminController::class, 'bankDataCatatan'])->name('admin.bank_data.catatan');
        Route::post('/bank-data/{id}/catatan/store', [AdminController::class, 'bankDataCatatanStore'])->name('admin.bank_data.catatan.store');
        Route::delete('/bank-data/catatan/{id}', [AdminController::class, 'bankDataCatatanDelete'])->name('admin.bank_data.catatan.delete');
        Route::get('/bank-data/{id}/create', [AdminController::class, 'bankDataCreate'])->name('admin.bank_data.create');
        Route::post('/bank-data/{id}/store', [AdminController::class, 'bankDataStore'])->name('admin.bank_data.store');
        Route::delete('/bank-data/arsip-admin/{id}', [AdminController::class, 'bankDataDeleteDoc'])->name('admin.bank_data.delete_doc');
        Route::get('/bank-data/arsip/{id}', [AdminController::class, 'bankDataArsip'])->name('admin.bank_data.arsip');
        Route::post('/bank-data/arsip/{id}/update', [AdminController::class, 'bankDataArsipUpdate'])->name('admin.bank_data.arsip.update');
        Route::post('/bank-data/arsip/{id}/upload-doc', [AdminController::class, 'bankDataUploadDoc'])->name('admin.bank_data.arsip.upload_doc');
        Route::get('/bank-data/{id}', [AdminController::class, 'bankDataDetail'])->name('admin.bank_data.detail');
    });
});

// Portal Cabang
use App\Http\Controllers\NotifikasiController;

Route::patch('/notifikasi/{id}/read', [NotifikasiController::class, 'markAsRead'])->name('notifikasi.read')->middleware('auth');

Route::prefix('cabang')->group(function () {
    Route::get('/', function () {
        return redirect()->route('cabang.dashboard');
    });

    Route::get('/login', function () {
        return redirect()->route('login');
    })->name('cabang.login');

    Route::post('/logout', [AuthController::class, 'logout'])->name('cabang.logout');

    Route::middleware(['cabang'])->group(function () {
        Route::get('/dashboard', [CabangController::class, 'index'])->name('cabang.dashboard');
        Route::get('/pengajuan/create', [CabangController::class, 'create'])->name('cabang.pengajuan.create');
        Route::post('/pengajuan', [CabangController::class, 'store'])->name('cabang.pengajuan.store');
        Route::get('/riwayat', [CabangController::class, 'riwayat'])->name('cabang.riwayat');
        Route::get('/activity-log', [CabangController::class, 'activityLog'])->name('cabang.activity-log');
        Route::get('/pengajuan/{id}', [CabangController::class, 'show'])->name('cabang.pengajuan.show');
        Route::get('/pengajuan/{id}/edit', [CabangController::class, 'edit'])->name('cabang.pengajuan.edit');
        Route::put('/pengajuan/{id}', [CabangController::class, 'update'])->name('cabang.pengajuan.update');
        Route::delete('/pengajuan/{id}', [CabangController::class, 'destroy'])->name('cabang.pengajuan.destroy');
    });
});


Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/perizinan/create', [PerizinanController::class, 'create'])->name('perizinan.create');
    Route::post('/perizinan/store', [PerizinanController::class, 'store'])->name('perizinan.store');
    Route::get('/perizinan', [PerizinanController::class, 'index']);
    Route::get('/perizinan/{id}', [PerizinanController::class, 'show'])->name('perizinan.show');
    Route::get('/perizinan/{id}/edit', [PerizinanController::class, 'show'])->name('perizinan.edit');
    Route::put('/perizinan/{id}', [PerizinanController::class, 'update'])->name('perizinan.update');
    Route::delete('/perizinan/{id}', [PerizinanController::class, 'destroy'])->name('perizinan.destroy');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});
// MinIO Storage Interceptor
Route::get('/storage/{path}', function ($path) {
    if (env('FILESYSTEM_DISK') === 's3') {
        return redirect(\Illuminate\Support\Facades\Storage::disk('s3')->url($path));
    }
    return response()->file(storage_path('app/public/' . $path));
})->where('path', '.*');
