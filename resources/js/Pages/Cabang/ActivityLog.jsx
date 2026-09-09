import React, { useState } from 'react';
import CabangLayout from '@/Layouts/CabangLayout';
import { Head, router } from '@inertiajs/react';

export default function ActivityLog({ auth, perizinans, filters }) {
    const [statusFilter, setStatusFilter] = useState('');
    const [activeItem, setActiveItem] = useState(null);

    const statusColors = {
        'draft': 'secondary',
        'verifikasi_internal': 'info',
        'verifikasi_terkirim': 'primary',
        'needs_revision': 'danger',
        'sesuai': 'success',
        'verifikasi_kedua': 'warning',
    };

    const formatStatus = (status) => {
        if (!status) return '-';
        return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <CabangLayout title="Riwayat Aktivitas">
            <Head title="Riwayat Aktivitas" />
            
            <div className="container" style={{ maxWidth: '900px' }}>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 style={{ color: 'var(--hq-navy)', fontWeight: 800, letterSpacing: '-0.5px' }}>Riwayat Aktivitas</h2>
                    <p className="text-muted mb-0">Pantau pergerakan dan aktivitas pengajuan perizinan Anda.</p>
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                    <div className="row g-3">
                        <div className="col-12">
                            <select className="form-select bg-light" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="">Semua Aktivitas</option>
                                <option value="submit">Disubmit / Diajukan</option>
                                <option value="draft">Draft</option>
                                <option value="revisi">Revisi</option>
                                <option value="verifikasi">Verifikasi</option>
                                <option value="sesuai">Sesuai / Setuju</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card-body p-3">
                    {perizinans.data.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="display-1 text-muted mb-3"><i className="fas fa-history opacity-25"></i></div>
                            <h5>Belum Ada Aktivitas</h5>
                            <p className="text-muted">Tidak ada riwayat aktivitas yang ditemukan untuk kriteria pencarian ini.</p>
                        </div>
                    ) : (
                        <div className="accordion" id="activityAccordion">
                            {perizinans.data.map((perizinan, index) => (
                                <div className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden shadow-sm" key={perizinan.id}>
                                    <h2 className="accordion-header">
                                        <button 
                                            className={`accordion-button ${activeItem !== perizinan.id ? 'collapsed' : ''} bg-white shadow-none`} 
                                            type="button" 
                                            onClick={() => setActiveItem(activeItem === perizinan.id ? null : perizinan.id)}
                                        >
                                            <div className="d-flex w-100 justify-content-between align-items-center me-3">
                                                <div>
                                                    <span className="fw-bold fs-5 d-block text-dark">{perizinan.nama_apotek}</span>
                                                    <small className="text-muted"><i className="fas fa-user-md me-1"></i> APJ: {perizinan.apj?.nama_lengkap || '-'}</small>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`badge bg-${statusColors[perizinan.status?.toLowerCase()] || 'secondary'} rounded-pill px-3 py-2 mb-1`}>
                                                        {formatStatus(perizinan.status)}
                                                    </span>
                                                    <div className="small text-muted"><i className="far fa-clock me-1"></i> Terakhir Update: {new Date(perizinan.updated_at).toLocaleDateString('id-ID')}</div>
                                                </div>
                                            </div>
                                        </button>
                                    </h2>
                                    <div className={`accordion-collapse ${activeItem === perizinan.id ? 'd-block' : 'd-none'}`}>
                                        <div className="accordion-body bg-white pt-3 px-4 pb-0">
                                            {perizinan.activity_logs && perizinan.activity_logs.length > 0 ? (
                                                <div className="timeline position-relative ps-4 ms-2">
                                                    {/* Vertical line */}
                                                    <div className="position-absolute h-100 border-start border-2" style={{ left: '0', top: '10px', borderColor: '#e9ecef' }}></div>
                                                    
                                                    {perizinan.activity_logs.filter(log => statusFilter === '' || (log.action && log.action.toLowerCase().includes(statusFilter)) || (log.description && log.description.toLowerCase().includes(statusFilter))).length > 0 ? (
                                                        perizinan.activity_logs.filter(log => statusFilter === '' || (log.action && log.action.toLowerCase().includes(statusFilter)) || (log.description && log.description.toLowerCase().includes(statusFilter))).map((log) => {
                                                        const isSystem = log.user_id === null;
                                                        const isAdmin = !isSystem && log.user_id !== auth.user.id;
                                                        const isKfaOrange = isAdmin || (log.action && (log.action.includes('reject') || log.action.includes('revisi')));
                                                        const iconBg = isKfaOrange ? 'var(--kfa-orange)' : 'var(--kfa-navy)';
                                                        const icon = (log.action && log.action.includes('submit')) ? 'paper-plane' :
                                                                     (log.action && log.action.includes('update')) ? 'edit' :
                                                                     (log.action && log.action.includes('create')) ? 'plus' :
                                                                     (log.action && (log.action.includes('reject') || log.action.includes('revisi'))) ? 'times-circle' :
                                                                     (log.action && (log.action.includes('approve') || log.action.includes('sesuai'))) ? 'check-circle' : 'info-circle';
                                                                     
                                                        return (
                                                            <div className="mb-2 position-relative" key={log.id}>
                                                                <div className="position-absolute rounded-circle d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: iconBg, width: '28px', height: '28px', left: '-38px', top: '0', zIndex: 1, boxShadow: '0 0 0 4px #fff' }}>
                                                                    <i className={`fas fa-${icon}`} style={{ fontSize: '11px' }}></i>
                                                                </div>
                                                                <div className="bg-light px-3 py-1 rounded-3 shadow-sm border border-light">
                                                                    <div className="d-flex justify-content-between align-items-center mb-0">
                                                                        <div className="fw-bold small" style={{ color: iconBg }}>
                                                                            {formatStatus(log.action)}
                                                                        </div>
                                                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}><i className="far fa-calendar-alt me-1"></i> {new Date(log.created_at).toLocaleString('id-ID')}</small>
                                                                    </div>
                                                                    <p className="mb-0 text-dark" style={{ fontSize: '0.85rem' }}>{log.description}</p>
                                                                    <div className="mt-1 text-end">
                                                                        <span className="badge bg-white text-dark border" style={{ fontSize: '0.7rem' }}>
                                                                            <i className="fas fa-user-circle me-1"></i> {isAdmin ? 'Admin' : (isSystem ? 'Sistem' : 'Anda (Cabang)')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })) : (
                                                        <div className="text-muted text-center my-3"><small>Tidak ada aktivitas yang sesuai dengan filter.</small></div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-3">Belum ada rincian aktivitas.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                {perizinans.links && perizinans.links.length > 3 && (
                    <div className="card-footer bg-white border-top-0 pb-3 px-3">
                        <nav>
                            <ul className="pagination justify-content-center mb-0">
                                {perizinans.links.map((link, k) => (
                                    <li key={k} className={`page-item ${link.active ? 'active' : ''} ${link.url === null ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link shadow-none" 
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            style={link.active ? { backgroundColor: '#F26522', borderColor: '#F26522' } : {}}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                )}
            </div>
            
            </div>
        </CabangLayout>
    );
}
