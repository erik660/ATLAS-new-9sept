@extends('layouts.auth')

@section('title', 'Login Portal Admin Pusat (HQ) - KFA Sistem SIA')
@section('theme_class', 'theme-admin')

@section('header_icon')
    <div class="header-icon-circle rounded-circle d-flex align-items-center justify-content-center" style="background: #1E293B; color: #F59E0B; box-shadow: 0 4px 15px rgba(30, 41, 59, 0.4);">
        <i class="fas fa-user-shield"></i>
    </div>
@endsection

@section('header_badge')
    <span class="badge bg-white px-3 py-2 rounded-pill fw-bold mb-1 shadow-sm" style="color: #1E293B !important; border: 1.5px solid #1E293B; font-size: 0.78rem; letter-spacing: 0.5px;">
        <i class="fas fa-building me-1"></i> PORTAL ADMIN PUSAT (HQ)
    </span>
@endsection

@section('header_subtitle', 'Pusat kendali, otorisasi verifikasi akhir, dan pemantauan kepatuhan perizinan.')

@section('content')

    <form action="{{ route('admin.login.submit') }}" method="POST">
        @csrf
        <div class="mb-3">
            <label for="username" class="form-label fw-bold">Username Admin</label>
            <div class="input-group">
                <span class="input-group-text"><i class="fas fa-user-shield"></i></span>
                <input type="text" id="username" name="username" class="form-control" value="{{ old('username') }}" placeholder="Masukkan username Administrator" required autofocus autocomplete="username">
            </div>
        </div>

        <div class="mb-4">
            <label for="password" class="form-label fw-bold">Password</label>
            <div class="input-group">
                <span class="input-group-text"><i class="fas fa-key"></i></span>
                <input type="password" id="password" name="password" class="form-control" placeholder="Masukkan password" required autocomplete="current-password">
            </div>
        </div>

        <div class="mb-4 form-check">
            <input type="checkbox" class="form-check-input" id="remember" name="remember">
            <label class="form-check-label text-muted" style="font-size: 0.88rem;" for="remember">Ingat sesi login saya</label>
        </div>

        <button type="submit" class="btn btn-theme">
            <span>Masuk ke dashboard</span>
            <i class="fas fa-arrow-right ms-2 btn-icon"></i>
        </button>
    </form>
@endsection
