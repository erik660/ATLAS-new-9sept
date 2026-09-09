import React, { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../../css/verifikasi.css';
import Select from 'react-select';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? '#3b82f6' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
        borderRadius: '0.375rem',
        minHeight: '40px',
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 })
};

export default function ActivityLog() {
    const { perizinans, branches, unitBisnisOptions, jenisOptions, filters } = usePage().props;
    
    const [unitBisnis, setUnitBisnis] = useState(filters?.unit_bisnis || '');
    const [kodeSap, setKodeSap] = useState(filters?.kode_sap || '');
    const [jenis, setJenis] = useState(filters?.jenis || '');
    const [openHistoryId, setOpenHistoryId] = useState(null);

    const handleFilterWilayah = (e) => {
        e.preventDefault();
        router.get('/admin/log', { unit_bisnis: unitBisnis, kode_sap: kodeSap, jenis_perizinan: jenis }, { preserveState: true });
    };

    const handleFilterJenis = (e) => {
        e.preventDefault();
        router.get('/admin/log', { unit_bisnis: unitBisnis, kode_sap: kodeSap, jenis_perizinan: jenis }, { preserveState: true });
    };

    const currentBranches = unitBisnis ? (branches || []).filter(b => b.unit_bisnis === unitBisnis) : (branches || []);

    const ubOptions = [{ value: '', label: '-- Pilih Unit Bisnis --' }, ...(unitBisnisOptions || []).map(ub => ({ value: ub, label: ub }))];
    const jenisOptionsMapped = [{ value: '', label: '-- Semua Jenis Perizinan --' }, ...(jenisOptions || []).map(j => ({ value: j, label: j }))];
    const cabangOptions = [{ value: '', label: '-- Semua Cabang --' }, ...currentBranches.map(b => ({ value: b.kode_sap, label: `${b.name} (${b.kode_sap})` }))];

    const toggleHistory = (id) => {
        setOpenHistoryId(openHistoryId === id ? null : id);
    };

    return (
        <AdminLayout title="Riwayat Aktivitas - HQ Authority" pageTitle="Riwayat Aktivitas" pageSubtitle="Daftar Pengajuan Selesai & Lacak Timeline Perizinan">
            <div className="filter-section">
                {/* Filter Wilayah */}
                <div className="filter-card-hq wilayah">
                    <h5 className="fw-bold d-flex align-items-center">
                        <i className="fas fa-map-marked-alt text-warning me-2 fs-5"></i> Filter Berdasarkan Wilayah
                    </h5>
                    <form onSubmit={handleFilterWilayah}>
                        <div className="mb-3">
                            <label htmlFor="unit_bisnis" className="form-label-hq">Unit Bisnis</label>
                            <Select 
                                id="unit_bisnis"
                                options={ubOptions}
                                value={ubOptions.find(o => o.value === unitBisnis) || ubOptions[0]}
                                onChange={(sel) => { setUnitBisnis(sel.value); setKodeSap(''); }}
                                styles={customSelectStyles}
                                isSearchable
                                menuPortalTarget={document.body}
                                placeholder="-- Pilih Unit Bisnis --"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="kode_sap" className="form-label-hq">Cabang / Apotek</label>
                            <Select 
                                id="kode_sap"
                                options={cabangOptions}
                                value={cabangOptions.find(o => o.value === kodeSap) || cabangOptions[0]}
                                onChange={(sel) => setKodeSap(sel.value)}
                                styles={customSelectStyles}
                                isSearchable
                                menuPortalTarget={document.body}
                                placeholder="-- Semua Cabang --"
                            />
                        </div>

                        <button type="submit" className="btn-hq-primary w-100 shadow-sm">
                            <i className="fas fa-filter"></i> Terapkan Filter Wilayah
                        </button>
                    </form>
                </div>

                {/* Filter Jenis */}
                <div className="filter-card-hq jenis">
                    <h5 className="fw-bold d-flex align-items-center">
                        <i className="fas fa-layer-group text-warning me-2 fs-5"></i> Filter Jenis Perizinan
                    </h5>
                    <form onSubmit={handleFilterJenis}>
                        <div className="mb-4">
                            <label htmlFor="jenis" className="form-label-hq">Jenis Perizinan SIA</label>
                            <Select 
                                id="jenis"
                                options={jenisOptionsMapped}
                                value={jenisOptionsMapped.find(o => o.value === jenis) || jenisOptionsMapped[0]}
                                onChange={(sel) => setJenis(sel.value)}
                                styles={customSelectStyles}
                                isSearchable
                                menuPortalTarget={document.body}
                                placeholder="-- Semua Jenis Perizinan --"
                            />
                        </div>

                        <button type="submit" className="btn-hq-accent w-100 shadow-sm" style={{ marginTop: '54px' }}>
                            <i className="fas fa-search"></i> Terapkan Filter Jenis
                        </button>
                    </form>
                </div>
            </div>

            <div className="info-banner-hq">
                <div className="d-flex align-items-center gap-3">
                    <div className="fs-2 text-primary d-none d-sm-block" style={{ color: '#2563EB' }}>
                        <i className="fas fa-clipboard-check"></i>
                    </div>
                    <div>
                        <h6 className="fw-bold mb-1" style={{ color: '#1E3A8A', fontSize: '1.05rem' }}>
                            <i className="fas fa-info-circle me-1 d-sm-none"></i> Riwayat Pengajuan Selesai
                        </h6>
                        <p className="m-0" style={{ color: '#1E40AF', fontSize: '0.92rem', lineHeight: '1.5' }}>
                            Daftar di bawah ini menampilkan pengajuan izin dari cabang apotek yang telah <strong>selesai</strong> dan telah diterbitkan izinnya oleh Kemenkes. Anda dapat mengunduh berkas lengkap atau melihat detail arsip.
                        </p>
                    </div>
                </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-3 mt-4">
                <h4 className="m-0 fw-bold" style={{ color: 'var(--hq-slate)' }}><i className="fas fa-list-alt text-warning me-2"></i> Daftar Riwayat Pengajuan</h4>
                <span className="badge rounded-pill bg-dark text-warning fw-bold px-3 py-2 shadow-sm" style={{ fontSize: '0.85rem' }}>
                    Total: {perizinans?.total || 0} Pengajuan
                </span>
            </div>

            {!perizinans || !perizinans.data || perizinans.data.length === 0 ? (
                <div className="no-data-card">
                    <div className="fs-1 text-muted mb-3"><i className="fas fa-folder-open"></i></div>
                    <h5 className="fw-bold text-dark">Tidak Ada Antrean Pengajuan</h5>
                    <p className="m-0 text-muted">Tidak ada pengajuan perizinan baru yang sesuai dengan filter atau antrean verifikasi saat ini.</p>
                </div>
            ) : (
                <div className="table-container-hq">
                    <div className="table-responsive">
                        <table className="table-hq">
                            <thead>
                                <tr>
                                    <th>Nama Apotek</th>
                                    <th>Kode SAP</th>
                                    <th>Jenis Perizinan</th>
                                    <th>Tanggal Pengajuan</th>
                                    <th>Status Verifikasi</th>
                                    <th className="text-center">Aksi HQ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perizinans.data.map(perizinan => (
                                    <React.Fragment key={perizinan.id}>
                                        <tr>
                                            <td><strong style={{ color: 'var(--hq-slate)', fontSize: '0.95rem' }}>{perizinan.nama_apotek}</strong></td>
                                            <td><span className="badge bg-light text-dark border px-2 py-1 fw-bold font-monospace">{perizinan.user?.kode_sap}</span></td>
                                            <td><span className="text-secondary fw-semibold">{perizinan.jenis_perizinan}</span></td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="far fa-calendar-alt text-muted"></i>
                                                    <span className="fw-bold text-dark">
                                                        {new Date(perizinan.tanggal_pengajuan).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        }).replace(/\//g, ' / ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge-status-hq" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
                                                    <i className="fas fa-check-double"></i> Izin Terbit (Selesai)
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-2">
                                                    <button onClick={() => toggleHistory(perizinan.id)} type="button" className="btn btn-sm fw-bold px-3 py-2 d-flex align-items-center gap-1 shadow-sm" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #BFDBFE', borderRadius: '10px' }} title="Lihat Histori">
                                                        <i className="fas fa-history"></i> Histori
                                                    </button>
                                                    <a className="btn-detail-hq" href={`/admin/verify/${perizinan.id}`} title="Lihat Detail">
                                                        <i className="fas fa-eye"></i>
                                                        <span>Lihat Detail</span>
                                                    </a>
                                                    <a className="btn-zip-hq" href={`/admin/verify/${perizinan.id}/download-all`} title="Unduh Semua Berkas (ZIP)">
                                                        <i className="fas fa-file-archive text-warning"></i>
                                                        <span>ZIP</span>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                        {openHistoryId === perizinan.id && (
                                            <tr className="bg-light">
                                                <td colSpan="6" className="p-0 border-0">
                                                    <div className="p-4" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3B82F6' }}>
                                                        <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-clipboard-list me-2"></i>Histori & Timeline Pengajuan</h6>
                                                        {perizinan.activity_logs && perizinan.activity_logs.length > 0 ? (
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
                                                                        {perizinan.activity_logs.map(log => (
                                                                            <tr key={log.id}>
                                                                                <td className="align-middle">
                                                                                    <div className="fw-bold">{new Date(log.created_at).toLocaleDateString('id-ID')}</div>
                                                                                    <div className="text-muted small">{new Date(log.created_at).toLocaleTimeString('id-ID')}</div>
                                                                                </td>
                                                                                <td className="align-middle">
                                                                                    <span className={`badge shadow-sm ${['approved', 'submit_pengajuan', 'terbit_verifikasi', 'persetujuan_kl', 'verifikator_kemenkes', 'verifikasi_internal'].includes(log.action) ? 'bg-success' : log.action === 'needs_revision' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                                                        {log.action === 'needs_revision' ? 'REVISI' : log.action.replace('_', ' ').toUpperCase()}
                                                                                    </span>
                                                                                </td>
                                                                                <td>{log.description}</td>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {perizinans?.links && perizinans.links.length > 3 && (
                <div className="d-flex justify-content-center mt-4">
                    <nav>
                        <ul className="pagination">
                            {perizinans.links.map((link, i) => (
                                <li key={i} className={`page-item ${link.active ? 'active' : ''} ${link.url === null ? 'disabled' : ''}`}>
                                    <Link className="page-link" href={link.url || '#'} dangerouslySetInnerHTML={{ __html: link.label }}></Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
        </AdminLayout>
    );
}
