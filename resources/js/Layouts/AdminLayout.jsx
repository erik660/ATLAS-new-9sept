import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import '../../css/admin.css'; // specific admin styles

export default function AdminLayout({
    title = 'Admin HQ Dashboard - KFA',
    pageTitle = 'Selamat Datang',
    pageSubtitle = 'Sistem Informasi Perizinan Apotek (SIA) - Executive HQ',
    children
}) {
    const { auth, flash, adminNotifications } = usePage().props;
    const admin = auth?.admin;
    const { post } = useForm();

    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);

    const unreadCount = adminNotifications?.unread_count || 0;
    const notifItems = adminNotifications?.items || [];

    useEffect(() => {
        document.body.className = 'admin-layout';
        return () => {
            document.body.className = '';
        };
    }, []);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        };

        if (notifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [notifOpen]);

    // Flash Messages handler with SweetAlert2
    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: flash.success,
                showConfirmButton: true,
                confirmButtonText: 'Tutup',
                confirmButtonColor: '#10B981',
                timer: 5000,
                timerProgressBar: true
            });
        }
        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: flash.error,
                showConfirmButton: true,
                confirmButtonText: 'Tutup',
                confirmButtonColor: '#EF4444'
            });
        }
    }, [flash]);

    const handleLogout = (e) => {
        e.preventDefault();
        post('/admin/logout');
    };

    const handleNotifClick = (notifId) => {
        setNotifOpen(false);
        router.visit(`/admin/verify/${notifId}`);
    };

    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="admin-app-container">
            <Head title={title} />

            {/* Left Sidebar */}
            <aside className="sidebar-hq">
                <div className="sidebar-header d-flex align-items-center justify-content-between px-3 py-3" style={{ backgroundColor: 'white', borderBottom: '3px solid var(--kfa-orange)' }}>
                    <Link href="/admin/dashboard" className="sidebar-brand flex-grow-1 text-decoration-none" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", padding: '0', borderBottom: 'none', backgroundColor: 'transparent' }}>
                        <div className="d-flex flex-column text-nowrap">
                            <div className="d-flex align-items-center text-nowrap" style={{ lineHeight: 1 }}>
                                <span style={{ color: 'var(--kfa-orange)', fontWeight: 900, fontStyle: 'italic', fontSize: '1.25rem', whiteSpace: 'nowrap' }}>kimia farma</span>
                                <span style={{ color: 'var(--kfa-navy)', fontWeight: 900, marginLeft: '4px', fontSize: '1.25rem', fontStyle: 'normal', whiteSpace: 'nowrap' }}>Apotek</span>
                            </div>
                            <small className="fw-bold text-nowrap" style={{ color: 'var(--kfa-navy)', letterSpacing: '1px', fontSize: '0.6rem', marginTop: '2px' }}>PORTAL ADMIN</small>
                        </div>
                    </Link>

                    <div className="position-relative ms-2" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => setNotifOpen(!notifOpen)}
                            className={`btn-notification-bell ${notifOpen ? 'active' : ''}`}
                            title="Notifikasi General"
                            id="admin-notif-bell-btn"
                            style={{ width: '36px', height: '36px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', padding: 0 }}
                        >
                            <i className="fas fa-bell" style={{ fontSize: '1.1rem' }}></i>
                            {(unreadCount + (adminNotifications?.expired_urgent_count || 0)) > 0 && (
                                <span className="notification-badge-pulse" style={{ transform: 'scale(0.85) translate(25%, -25%)' }}>
                                    {(unreadCount + (adminNotifications?.expired_urgent_count || 0)) > 99 ? '99+' : (unreadCount + (adminNotifications?.expired_urgent_count || 0))}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown Panel (Summary Mode) */}
                        {notifOpen && (
                            <div className="notification-dropdown-menu shadow-lg" style={{ position: 'absolute', top: 'calc(100% + 5px)', left: '-150px', right: 'auto', zIndex: 1050, width: '340px', borderRadius: '12px', overflow: 'hidden' }}>
                                <div className="notif-header bg-light border-bottom px-3 py-3 d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold" style={{ color: '#0F172A' }}>
                                        <i className="fas fa-bell text-warning me-2"></i>Notifikasi
                                    </h6>
                                    <span className="badge bg-primary rounded-pill">
                                        {(unreadCount > 0 || (adminNotifications?.expired_urgent_count || 0) > 0) ? 'Ada Pembaruan' : 'Kosong'}
                                    </span>
                                </div>

                                <div className="notif-list bg-white">
                                    {unreadCount > 0 && (
                                        <Link href="/admin/verifikasi" className="text-decoration-none text-dark d-flex align-items-center px-3 py-3 border-bottom notif-item-hover">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                                                <i className="fas fa-clipboard-check fs-5"></i>
                                            </div>
                                            <div className="ms-3">
                                                <h6 className="mb-1 fw-bold" style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>Verifikasi Pengajuan</h6>
                                                <p className="mb-0 text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>Terdapat <strong>{unreadCount}</strong> pengajuan baru yang menunggu verifikasi Anda.</p>
                                            </div>
                                        </Link>
                                    )}

                                    {(adminNotifications?.expired_urgent_count || 0) > 0 && (
                                        <Link href="/admin/expired" className="text-decoration-none text-dark d-flex align-items-center px-3 py-3 border-bottom notif-item-hover">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }}>
                                                <i className="fas fa-exclamation-triangle fs-5"></i>
                                            </div>
                                            <div className="ms-3">
                                                <h6 className="mb-1 fw-bold text-danger" style={{ fontSize: '0.9rem' }}>Peringatan Kedaluwarsa</h6>
                                                <p className="mb-0 text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>Terdapat <strong>{adminNotifications.expired_urgent_count}</strong> cabang dengan status perizinan URGENT.</p>
                                            </div>
                                        </Link>
                                    )}

                                    {unreadCount === 0 && (adminNotifications?.expired_urgent_count || 0) === 0 && (
                                        <div className="py-5 text-center bg-white">
                                            <i className="fas fa-check-circle text-success fs-1 mb-2 opacity-50"></i>
                                            <p className="mb-0 fw-medium text-muted" style={{ fontSize: '0.85rem' }}>Semua aman, tidak ada notifikasi baru!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <ul className="sidebar-menu">
                    <li>
                        <Link href="/admin/verifikasi" className={`sidebar-link ${currentUrl.includes('/admin/verifikasi') ? 'active' : ''}`}>
                            <i className="fas fa-clipboard-check"></i> Verifikasi Pengajuan
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/expired" className={`sidebar-link ${currentUrl.includes('/admin/expired') ? 'active' : ''}`}>
                            <i className="fas fa-clock"></i> Monitoring Kedaluwarsa
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/bank-data" className={`sidebar-link ${currentUrl.includes('/admin/bank-data') ? 'active' : ''}`}>
                            <i className="fas fa-archive"></i> Arsip Cabang
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/log" className={`sidebar-link ${currentUrl.includes('/admin/log') ? 'active' : ''}`}>
                            <i className="fas fa-history"></i> Riwayat Aktivitas
                        </Link>
                    </li>
                </ul>
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            {admin?.name ? admin.name.substring(0, 1) : 'A'}
                        </div>
                        <div className="sidebar-user-info">
                            <strong>{admin?.name || 'Admin Kimia Farma'}</strong>
                        </div>
                    </div>
                    <form onSubmit={handleLogout} className="m-0 mt-2">
                        <button type="submit" className="btn-logout-sidebar" title="Keluar">
                            <i className="fas fa-power-off"></i> Logout
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-container fade-in-up">
                <div className="main-content-wrapper">

                    {/* Command Center Header Banner */}
                    <div className="page-header-hq">
                        <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #0B132B, #1C2541)', color: '#F59E0B', fontSize: '1.5rem', flexShrink: 0 }}>
                                    {currentUrl.includes('/verifikasi') && <i className="fas fa-clipboard-check"></i>}
                                    {currentUrl.includes('/expired') && <i className="fas fa-clock"></i>}
                                    {currentUrl.includes('/bank-data') && <i className="fas fa-archive"></i>}
                                    {currentUrl.includes('/log') && <i className="fas fa-history"></i>}
                                    {!currentUrl.includes('/verifikasi') && !currentUrl.includes('/expired') && !currentUrl.includes('/bank-data') && !currentUrl.includes('/log') && <i className="fas fa-chart-pie"></i>}
                                </div>
                                <header className="header-hq d-flex align-items-center">
                                    <div className="header-title mb-0">
                                        <h2 className="mb-1">{pageTitle}</h2>
                                        <p className="mb-0">{pageSubtitle}</p>
                                    </div>
                                </header>
                            </div>

                            {/* Header Actions (Notification Bell & Back Button) */}
                            <div className="d-flex align-items-center gap-3 ms-auto">

                                {/* Notification Bell Removed from Header */}

                                {![
                                    '/admin/dashboard',
                                    '/admin/verifikasi',
                                    '/admin/expired',
                                    '/admin/bank-data',
                                    '/admin/log'
                                ].includes(currentUrl) && (
                                        <button onClick={() => window.history.back()} className="btn btn-outline-secondary rounded-pill px-4 shadow-sm" style={{ fontWeight: '600', height: 'fit-content' }} title="Kembali">
                                            <i className="fas fa-arrow-left me-2"></i> Kembali
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Render View Content */}
                    {children}

                </div>

                <footer className="text-center py-4 text-muted mt-5" style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '0.85rem' }}>
                    <div className="text-center text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--hq-slate)' }}>PT Kimia Farma Apotek</strong><br />
                        Sistem Informasi Perizinan Apotek &copy; {new Date().getFullYear()}<br />
                        <div className="mt-2" style={{ fontSize: '0.75rem', color: '#999' }}>
                            Developed by <strong>Muhammad Erico Revaldo</strong><br />
                            Internship Service & Quality Assurance
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
