import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import '../../css/auth.css'; // specific auth styles

export default function AuthLayout({
    title = 'Login - KFA Sistem SIA',
    themeClass = 'theme-cabang',
    headerIcon,
    headerBadge,
    headerSubtitle = 'SISTEM INFORMASI PERIZINAN APOTEK',
    children
}) {
    const { flash = {}, errors = {} } = usePage().props;

    useEffect(() => {
        document.body.className = `auth-page ${themeClass}`;
        return () => { document.body.className = ''; }
    }, [themeClass]);

    return (
        <>
            <Head title={title} />
            <div className="container d-flex justify-content-center">
                <div className="login-card">
                    {/* Header */}
                    <div className="login-header d-flex flex-column align-items-center" style={{ padding: 0 }}>
                        <div className="w-100" style={{ zIndex: 2 }}>
                            <img src="/ATLAS.PNG" alt="Logo ATLAS" style={{ width: '100%', display: 'block' }} />
                        </div>

                        {headerBadge && (
                            <div className="pb-3" style={{ zIndex: 2 }}>
                                {headerBadge}
                            </div>
                        )}

                        {headerSubtitle && (
                            <small className="header-subtitle pb-3">
                                {headerSubtitle}
                            </small>
                        )}
                    </div>

                    {/* Body */}
                    <div className="login-body">
                        {Object.keys(errors).length > 0 && (
                            <div className="alert alert-danger shadow-sm border-0 mb-4 d-flex align-items-center" style={{ borderLeft: '4px solid #dc3545', borderRadius: '8px', fontSize: '0.88rem' }}>
                                <i className="fas fa-exclamation-circle fs-5 me-3 text-danger"></i>
                                <div className="flex-grow-1">
                                    {Object.values(errors).map((error, index) => (
                                        <div key={index} className="fw-semibold">{error}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {flash?.success && (
                            <div className="alert alert-success shadow-sm border-0 mb-4 d-flex align-items-center" style={{ borderLeft: '4px solid #10b981', borderRadius: '8px', fontSize: '0.88rem' }}>
                                <i className="fas fa-check-circle fs-5 me-3 text-success"></i>
                                <div className="fw-semibold">{flash.success}</div>
                            </div>
                        )}

                        {flash?.error && (
                            <div className="alert alert-danger shadow-sm border-0 mb-4 d-flex align-items-center" style={{ borderLeft: '4px solid #dc3545', borderRadius: '8px', fontSize: '0.88rem' }}>
                                <i className="fas fa-exclamation-triangle fs-5 me-3 text-danger"></i>
                                <div className="fw-semibold">{flash.error}</div>
                            </div>
                        )}

                        {flash?.status && (
                            <div className="alert alert-info shadow-sm border-0 mb-4 d-flex align-items-center" style={{ borderLeft: '4px solid #3b82f6', borderRadius: '8px', fontSize: '0.88rem' }}>
                                <i className="fas fa-info-circle fs-5 me-3 text-info"></i>
                                <div className="fw-semibold">{flash.status}</div>
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
