import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import CabangLayout from '../../Layouts/CabangLayout';
import dayjs from 'dayjs';

export default function Riwayat() {
    const { perizinans = [] } = usePage().props;
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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

    return (
        <CabangLayout title="Riwayat & Log - KFA" pageTitle="Riwayat Pengajuan & Log Aktivitas">
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header card-header-kfa py-3">
                    <h5 className="mb-0"><i className="fas fa-list me-2"></i> Semua Pengajuan Anda</h5>
                </div>
                <div className="card-body p-4">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Jenis</th>
                                    <th>Status</th>
                                    <th>Tanggal Pengajuan</th>
                                    <th>Keterangan</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perizinans.length > 0 ? perizinans.map(p => (
                                    <React.Fragment key={p.id}>
                                        <tr>
                                            <td>{p.id}</td>
                                            <td>{p.jenis_perizinan}</td>
                                            <td>
                                                {getStatusLabel(p.status)}
                                                {p.status.toLowerCase() === 'needs_revision' && p.catatan_revisi && (
                                                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#ff6b6b', marginTop: '4px' }}>
                                                        <i className="fas fa-exclamation-circle"></i> Ada catatan revisi dari admin
                                                    </span>
                                                )}
                                            </td>
                                            <td>{p.tanggal_pengajuan ? dayjs(p.tanggal_pengajuan).format('DD-MM-YYYY') : ''}</td>
                                            <td>{p.keterangan || '-'}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => toggleRow(p.id)} title="Lihat Histori">
                                                        <i className="fas fa-history"></i> Histori
                                                    </button>
                                                    <Link href={`/cabang/pengajuan/${p.id}`} className="btn btn-sm btn-outline-info">
                                                        <i className="fas fa-search"></i> Lihat Detail
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows[p.id] && (
                                            <tr className="bg-light">
                                                <td colSpan="6" className="p-0 border-0">
                                                    <div className="p-4" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #0d6efd' }}>
                                                        <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-clipboard-list me-2"></i>Histori & Timeline Pengajuan</h6>
                                                        {p.activity_logs && p.activity_logs.length > 0 ? (
                                                            <div className="table-responsive">
                                                                <table className="table table-sm table-bordered bg-white mb-0" style={{ fontSize: '0.9rem' }}>
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th style={{ width: '15%' }}>Tanggal & Waktu</th>
                                                                            <th style={{ width: '20%' }}>Status / Tahap</th>
                                                                            <th style={{ width: '65%' }}>Keterangan & Catatan</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {p.activity_logs.map(log => (
                                                                            <tr key={log.id}>
                                                                                <td className="align-middle">
                                                                                    <div className="fw-bold">{dayjs(log.created_at).format('DD/MM/YYYY')}</div>
                                                                                    <div className="text-muted small">{dayjs(log.created_at).format('HH:mm:ss')}</div>
                                                                                </td>
                                                                                <td className="align-middle">
                                                                                    {['approved', 'submit_pengajuan', 'terbit_verifikasi', 'persetujuan_kl', 'verifikator_kemenkes', 'verifikasi_internal'].includes(log.action) ? (
                                                                                        <span className="badge bg-success shadow-sm">{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                                                                                    ) : log.action === 'needs_revision' ? (
                                                                                        <span className="badge bg-warning text-dark shadow-sm">REVISI</span>
                                                                                    ) : (
                                                                                        <span className="badge bg-secondary shadow-sm">{log.action.toUpperCase()}</span>
                                                                                    )}
                                                                                </td>
                                                                                <td style={{ whiteSpace: 'pre-wrap' }}>
                                                                                    {log.description}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div className="alert alert-secondary mb-0 p-3"><i className="fas fa-info-circle me-2"></i> Belum ada log aktivitas.</div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted py-4">
                                            <i className="fas fa-folder-open mb-2 fs-3"></i><br />
                                            Belum ada riwayat pengajuan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </CabangLayout>
    );
}
