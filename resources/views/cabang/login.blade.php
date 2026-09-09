@extends('layouts.auth')

@section('title', 'Login Portal Cabang - KFA Sistem SIA')
@section('theme_class', 'theme-cabang')

@section('header_icon')
    <div class="header-icon-circle rounded-circle d-flex align-items-center justify-content-center" style="background: #F26522; color: #ffffff; box-shadow: 0 4px 15px rgba(242, 101, 34, 0.4);">
        <i class="fas fa-store"></i>
    </div>
@endsection

@section('header_badge')
    <span class="badge bg-white px-3 py-2 rounded-pill fw-bold mb-1 shadow-sm" style="color: #F26522 !important; border: 1.5px solid #F26522; font-size: 0.78rem; letter-spacing: 0.5px;">
        <i class="fas fa-store-alt me-1"></i> PORTAL CABANG APOTEK
    </span>
@endsection

@section('header_subtitle', 'Login dengan Kode SAP untuk mengelola dokumen dan izin cabang apotek.')

@section('content')
    <div class="helper-callout callout-cabang">
        <i class="fas fa-lightbulb fs-5 me-2 mt-1" style="color: #F26522;"></i>
        <div>
            <strong>Akses Operasional:</strong> Gunakan Kode SAP resmi apotek cabang Anda tanpa spasi.
        </div>
    </div>

    <form action="{{ route('cabang.login.submit') }}" method="POST">
        @csrf
        <div class="mb-3">
            <label for="kode_sap" class="form-label fw-bold">Kode SAP Cabang</label>
            <div class="input-group">
                <span class="input-group-text"><i class="fas fa-store" style="color: #F26522;"></i></span>
                <input type="text" id="kode_sap" name="kode_sap" class="form-control" value="{{ old('kode_sap') }}" placeholder="Contoh: 1154" required autofocus autocomplete="username">
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
