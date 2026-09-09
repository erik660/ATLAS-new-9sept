import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import CabangLayout from '../../Layouts/CabangLayout';
import dayjs from 'dayjs';

export default function Dashboard() {
    const { auth, perizinans = [], notifikasis = [] } = usePage().props;
    const [filter, setFilter] = useState('all');

    const handleReadNotif = (id) => {
        router.post(`/notifikasi/${id}/read`, { _method: 'PATCH' });
    };

    const getStatusLabel = (status) => {
        const s = status.toLowerCase();
        if (s === 'draft') return <span className="badge bg-secondary"><i className="fas fa-file-alt me-1"></i> Draft</span>;
        if (s === 'needs_revision') return <span className="badge bg-warning text-dark"><i className="fas fa-exclamation-triangle me-1"></i> Revisi</span>;
        if (s === 'verifikasi_internal') return <span className="badge bg-primary"><i className="fas fa-search me-1"></i> Verifikasi Internal</span>;
        if (s === 'verifikator_kemenkes') return <span className="badge bg-info"><i className="fas fa-user-md me-1"></i> Verifikator Kemenkes</span>;
        if (s === 'persetujuan_kl') return <span className="badge bg-warning text-dark"><i className="fas fa-file-signature me-1"></i> Proses Tahap Persetujuan KL</span>;
        if (['terbit_verifikasi', 'approved', 'completed'].includes(s)) return <span className="badge bg-success"><i className="fas fa-check-double me-1"></i> Terbit Verifikasi</span>;
        return <span className="badge bg-secondary">{status}</span>;
    };

    const getNormalizedStatus = (status) => {
        const s = status.toLowerCase();
        if (['terbit_verifikasi', 'approved', 'completed'].includes(s)) return 'terbit_verifikasi';
        return s;
    };

    const filteredPerizinans = perizinans.filter(p => filter === 'all' || getNormalizedStatus(p.status) === filter);

    const filterCounts = {
        draft: perizinans.filter(p => getNormalizedStatus(p.status) === 'draft').length,
        verifikasi_internal: perizinans.filter(p => getNormalizedStatus(p.status) === 'verifikasi_internal').length,
        verifikator_kemenkes: perizinans.filter(p => getNormalizedStatus(p.status) === 'verifikator_kemenkes').length,
        persetujuan_kl: perizinans.filter(p => getNormalizedStatus(p.status) === 'persetujuan_kl').length,
        needs_revision: perizinans.filter(p => getNormalizedStatus(p.status) === 'needs_revision').length,
        terbit_verifikasi: perizinans.filter(p => getNormalizedStatus(p.status) === 'terbit_verifikasi').length,
    };

    return (
        <CabangLayout title="Beranda - KFA" pageTitle={`Selamat Datang di Portal Cabang, ${auth?.user?.name || 'Cabang'}`}>
            {notifikasis.length > 0 && (
                <div className="mb-4">
                    {notifikasis.map(notif => {
                        const judul = (notif.judul || '').toLowerCase();
                        const isSuccess = judul.includes('disetujui') || judul.includes('selesai');
                        const isWarning = judul.includes('revisi') || judul.includes('peringatan');
                        const alertClass = isSuccess ? 'alert-success' : (isWarning ? 'alert-danger' : 'alert-info');
                        const iconClass = isSuccess ? 'fa-check-circle' : (isWarning ? 'fa-exclamation-triangle' : 'fa-info-circle');

                        // Hide close button if there is an active revision for this branch
                        let hideCloseBtn = false;
                        if (isWarning && judul.includes('revisi')) {
                            const hasActiveRevision = perizinans.some(p => {
                                if (p.status !== 'needs_revision') return false;
                                const pesanLower = notif.pesan.toLowerCase();
                                return pesanLower.includes(p.jenis_perizinan.toLowerCase()) &&
                                    pesanLower.includes(p.nama_apotek.toLowerCase());
                            });
                            if (hasActiveRevision) {
                                hideCloseBtn = true;
                            }
                        }

                        // Parse revision messages for better formatting
                        const renderPesan = (pesan) => {
                            if (pesan && pesan.includes('dikembalikan karena:')) {
                                const parts = pesan.split('dikembalikan karena:');
                                const header = parts[0] + 'dikembalikan karena:';
                                let reasons = (parts[1] || '').trim();
                                
                                if (reasons.includes('- ')) {
                                    const listItems = reasons.split('- ').filter(r => r.trim() !== '');
                                    return (
                                        <div className="mt-1">
                                            <span>{header}</span>
                                            <ul className="mb-0 mt-2 ps-4" style={{ fontSize: '0.9rem' }}>
                                                {listItems.map((item, idx) => (
                                                    <li key={idx} className="mb-1">{item.trim()}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                }
                            }
                            return <span>: {notif.pesan}</span>;
                        };

                        return (
                            <div key={notif.id} className={`alert ${alertClass} ${!hideCloseBtn ? 'alert-dismissible' : ''} fade show shadow-sm`} role="alert">
                                <strong><i className={`fas ${iconClass} me-2`}></i>{notif.judul || 'Notifikasi'}</strong>
                                {renderPesan(notif.pesan)}
                                {!hideCloseBtn && (
                                    <button type="button" className="btn-close" aria-label="Tutup" onClick={() => handleReadNotif(notif.id)}></button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="card border-0 shadow-lg mb-4 mt-3" style={{ background: 'linear-gradient(135deg, #F26522, #d8541a)', borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-body p-4 p-md-5 text-white d-flex flex-column flex-md-row align-items-center justify-content-between text-center text-md-start">
                    <div className="mb-3 mb-md-0 me-md-4">
                        <h3 className="fw-bold mb-2 display-6"><i className="fas fa-file-signature me-2"></i> Buat Pengajuan Perizinan Baru</h3>
                        <p className="mb-0 fs-5 text-white-50">Lengkapi berkas dan Ajukan perizinan apotek anda</p>
                    </div>
                    <div>
                        <Link href="/cabang/pengajuan/create" className="btn btn-light btn-lg px-4 py-3 fw-bold shadow text-nowrap d-inline-flex align-items-center justify-content-center" style={{ color: '#F26522', fontSize: '1.15rem', borderRadius: '12px', transition: 'all 0.3s', textDecoration: 'none' }}>
                            <i className="fas fa-plus-circle me-2 fs-3"></i> MULAI PENGAJUAN BARU
                        </Link>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0 mb-5">
                <div className="card-header bg-white py-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                    <h5 className="mb-0 fw-bold text-secondary">
                        {filter === 'all' && <><i className="fas fa-list me-2"></i> Semua Pengajuan Anda</>}
                        {filter === 'draft' && <><i className="fas fa-file-alt me-2"></i> Draft</>}
                        {filter === 'needs_revision' && <><i className="fas fa-exclamation-triangle me-2"></i> Revisi</>}
                        {filter === 'verifikasi_internal' && <><i className="fas fa-search me-2"></i> Verifikasi Internal</>}
                        {filter === 'verifikator_kemenkes' && <><i className="fas fa-user-md me-2"></i> Verifikator Kemenkes</>}
                        {filter === 'persetujuan_kl' && <><i className="fas fa-file-signature me-2"></i> Proses Tahap Persetujuan KL</>}
                        {filter === 'terbit_verifikasi' && <><i className="fas fa-check-double me-2"></i> Terbit Verifikasi</>}
                    </h5>
                    <div className="d-flex align-items-center">
                        <i className="fas fa-filter text-secondary me-2"></i>
                        <select className="form-select form-select-sm shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto', cursor: 'pointer' }}>
                            <option value="all">Semua Pengajuan</option>
                            <option value="draft">Draft ({filterCounts.draft})</option>
                            <option value="verifikasi_internal">Verifikasi Internal ({filterCounts.verifikasi_internal})</option>
                            <option value="verifikator_kemenkes">Verifikator Kemenkes ({filterCounts.verifikator_kemenkes})</option>
                            <option value="persetujuan_kl">Persetujuan KL ({filterCounts.persetujuan_kl})</option>
                            <option value="needs_revision">Revisi ({filterCounts.needs_revision})</option>
                            <option value="terbit_verifikasi">Selesai ({filterCounts.terbit_verifikasi})</option>
                        </select>
                    </div>
                </div>
                {perizinans.length > 0 ? (
                    filteredPerizinans.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">Jenis Perizinan</th>
                                        <th>Tanggal</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPerizinans.map(p => (
                                        <tr key={p.id}>
                                            <td className="ps-4 fw-medium">{p.jenis_perizinan}</td>
                                            <td>{dayjs(p.tanggal_pengajuan).format('DD/MM/YYYY')}</td>
                                            <td>{getStatusLabel(p.status)}</td>
                                            <td className="text-end pe-4">
                                                {['draft', 'needs_revision'].includes(p.status.toLowerCase()) ? (
                                                    <Link href={`/cabang/pengajuan/${p.id}`} className="btn btn-sm btn-primary">
                                                        <i className="fas fa-edit me-1"></i> Lanjutkan
                                                    </Link>
                                                ) : (
                                                    <Link href={`/cabang/pengajuan/${p.id}`} className="btn btn-sm btn-outline-secondary">
                                                        <i className="fas fa-eye me-1"></i> Detail
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="mb-3 text-muted opacity-50"><i className="fas fa-search fa-3x"></i></div>
                            <h5 className="fw-bold text-secondary">Tidak ada pengajuan</h5>
                            <p className="text-muted">Tidak ada pengajuan yang sesuai dengan filter yang dipilih.</p>
                        </div>
                    )
                ) : (
                    <div className="text-center py-5">
                        <div className="mb-3 text-muted opacity-50"><i className="fas fa-folder-open fa-3x"></i></div>
                        <h5 className="fw-bold text-secondary">Belum Ada Pengajuan Aktif</h5>
                        <p className="text-muted">Anda belum memiliki pengajuan perizinan. Silakan buat pengajuan baru.</p>
                    </div>
                )}
            </div>
        </CabangLayout>
    );
}
