import React, { useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function CabangLayout({ children, title, pageTitle, onBackClick }) {
    const { auth, flash } = usePage().props;
    const { url } = usePage();

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/cabang/logout');
    };

    useEffect(() => {
        if (auth?.urgentWarning) {
            let timerInterval;
            Swal.fire({
                title: 'PERINGATAN MASA BERLAKU IZIN',
                html: auth.urgentWarning.pesan + '<br><br><b>Anda baru bisa menutup peringatan ini dalam <span>5</span> detik.</b>',
                icon: 'warning',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: true,
                confirmButtonText: 'Saya Mengerti (5)',
                confirmButtonColor: '#d33',
                didOpen: () => {
                    const confirmBtn = Swal.getConfirmButton();
                    confirmBtn.disabled = true;
                    const b = Swal.getHtmlContainer().querySelector('span');
                    let timer = 5;
                    timerInterval = setInterval(() => {
                        timer--;
                        if (b) b.textContent = timer;
                        confirmBtn.textContent = `Saya Mengerti (${timer})`;
                        if (timer <= 0) {
                            clearInterval(timerInterval);
                            confirmBtn.disabled = false;
                            confirmBtn.textContent = 'Saya Mengerti';
                            if (b && b.parentElement) {
                                b.parentElement.innerHTML = 'Silakan klik tombol di bawah untuk menutup peringatan.';
                            }
                        }
                    }, 1000);
                },
                willClose: () => {
                    clearInterval(timerInterval);
                }
            }).then((result) => {
                // Backend session handles showing it once per login
            });
        }
    }, [auth?.urgentWarning]);

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            <Head title={title || 'Cabang Dashboard - KFA'} />
            <style>{`
                :root {
                    --kfa-navy: #002B5B;
                    --kfa-orange: #F26522;
                }
                .navbar-kfa {
                    background-color: white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    border-bottom: 3px solid var(--kfa-orange);
                }
                .navbar-brand {
                    color: var(--kfa-orange) !important;
                    font-weight: 800;
                    font-style: italic;
                    font-size: 1.5rem;
                }
                .navbar-brand span {
                    color: var(--kfa-navy);
                    font-style: normal;
                }
                .nav-link {
                    color: #495057 !important;
                    font-weight: 600;
                    padding: 10px 15px !important;
                    transition: all 0.3s;
                    border-radius: 5px;
                    margin: 0 5px;
                }
                .nav-link:hover, .nav-link.active {
                    color: var(--kfa-orange) !important;
                    background-color: #fff3ed;
                }
                .footer-kfa {
                    background-color: white;
                    border-top: 1px solid #e9ecef;
                    padding: 20px 0;
                    text-align: center;
                    color: #6c757d;
                    font-size: 0.9rem;
                }
                input::placeholder,
                textarea::placeholder,
                .form-control::placeholder {
                    font-style: italic !important;
                    color: #94a3b8 !important;
                    opacity: 0.75 !important;
                    font-weight: 400 !important;
                }
            `}</style>

            <nav className="navbar navbar-expand navbar-light navbar-kfa sticky-top bg-white">
                <div className="container">
                    <Link className="navbar-brand text-decoration-none" href="/cabang/dashboard" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                        <div className="d-flex flex-column text-nowrap">
                            <div className="d-flex align-items-center text-nowrap" style={{ lineHeight: 1 }}>
                                <span style={{ color: 'var(--kfa-orange)', fontWeight: 900, fontStyle: 'italic', fontSize: '1.45rem', whiteSpace: 'nowrap' }}>kimia farma</span>
                                <span style={{ color: 'var(--kfa-navy)', fontWeight: 900, marginLeft: '6px', fontSize: '1.45rem', fontStyle: 'normal', whiteSpace: 'nowrap' }}>Apotek</span>
                            </div>
                            <small className="fw-bold text-nowrap" style={{ color: 'var(--kfa-navy)', letterSpacing: '1.5px', fontSize: '0.65rem', marginTop: '2px' }}>PORTAL CABANG</small>
                        </div>
                    </Link>

                    <div className="d-flex align-items-center w-100 ms-4">
                        <ul className="navbar-nav flex-row gap-3 me-auto mb-0">
                            <li className="nav-item">
                                <Link className={`nav-link px-2 ${url?.startsWith('/cabang/dashboard') ? 'active fw-bold' : ''}`} href="/cabang/dashboard">
                                    <i className="fas fa-home me-1"></i> Beranda
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`nav-link px-2 ${url?.startsWith('/cabang/activity-log') ? 'active fw-bold' : ''}`} href="/cabang/activity-log">
                                    <i className="fas fa-list-alt me-1"></i> Riwayat Aktivitas
                                </Link>
                            </li>
                        </ul>

                        <div className="d-flex align-items-center ms-auto">
                            <div className="me-3 text-end d-none d-sm-block">
                                <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{auth?.user?.name || 'Cabang'}</div>
                            </div>
                            <form onSubmit={handleLogout} className="m-0">
                                <button type="submit" className="btn btn-outline-danger btn-sm rounded-pill px-3 text-nowrap">
                                    <i className="fas fa-sign-out-alt"></i> Keluar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ minHeight: '80vh', paddingTop: '30px', paddingBottom: '50px' }}>
                <div className="mb-4 d-flex align-items-center">
                    {url !== '/cabang/dashboard' && !url.startsWith('/cabang/dashboard?') && (
                        <button onClick={onBackClick ? onBackClick : () => window.history.back()} className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm me-3" style={{ fontWeight: '600' }} title="Kembali">
                            <i className="fas fa-arrow-left me-1"></i> Kembali
                        </button>
                    )}
                    <h2 className="fw-bold mb-0" style={{ color: 'var(--kfa-navy)' }}>{pageTitle || 'Dashboard Cabang'}</h2>
                </div>

                {flash?.success && (
                    <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert" style={{ borderLeft: '5px solid #28a745' }}>
                        <i className="fas fa-check-circle me-1"></i> {flash.success}
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => router.reload({ only: ['flash'] })}></button>
                    </div>
                )}
                {flash?.error && (
                    <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert" style={{ borderLeft: '5px solid #dc3545' }}>
                        <i className="fas fa-exclamation-triangle me-1"></i> {flash.error}
                        <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => router.reload({ only: ['flash'] })}></button>
                    </div>
                )}

                {children}
            </div>

            <footer className="text-center py-4 text-muted mt-5" style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '0.85rem' }}>
                <div className="text-center text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                    <strong style={{ color: 'var(--kfa-navy)' }}>PT Kimia Farma Apotek</strong><br />
                    Sistem Informasi Perizinan Apotek &copy; {new Date().getFullYear()}<br />
                    <div className="mt-2" style={{ fontSize: '0.75rem', color: '#999' }}>
                        Developed by <strong>Muhammad Erico Revaldo</strong><br />
                        Internship Service & Quality Assurance
                    </div>
                </div>
            </footer>
        </div>
    );
}
