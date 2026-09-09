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
        Route::get('/laporan/csv', [AdminController::class, 'downloadCsv'])->name('admin.laporan.csv');
        Route::get('/expired', [AdminController::class, 'expired'])->name('admin.expired');
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
