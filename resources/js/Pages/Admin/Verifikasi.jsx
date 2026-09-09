import React, { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../../css/verifikasi.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Select from 'react-select';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? '#3b82f6' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.15)' : 'none',
        borderRadius: '0.375rem',
        minHeight: '38px',
        height: '38px',
        fontSize: '0.88rem'
    }),
    valueContainer: base => ({
        ...base,
        height: '38px',
        padding: '0 8px'
    }),
    indexes: base => ({
        ...base,
        height: '38px'
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 })
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'verifikasi_internal':
            return { text: 'Verifikasi Internal', icon: 'fas fa-search', bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' };
        case 'verifikator_kemenkes':
            return { text: 'Verifikator Kemenkes', icon: 'fas fa-hospital-user', bg: '#ECFEFF', color: '#0E7490', border: '#A5F3FC' };
        case 'persetujuan_kl':
            return { text: 'Persetujuan KL', icon: 'fas fa-handshake', bg: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' };
        case 'terbit_verifikasi':
            return { text: 'Terbit Verifikasi', icon: 'fas fa-certificate', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
        case 'submitted':
        default:
            return { text: 'Menunggu Verifikasi', icon: 'fas fa-clock', bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' };
    }
};

export default function Verifikasi() {
    const { 
        perizinans, 
        branches, 
        unitBisnisOptions, 
        jenisOptions, 
        filters, 
        pengajuanProses, 
        pengajuanDisetujui, 
        pengajuanRevisi, 
        jenisStats, 
        unitStats
    } = usePage().props;

    // Filter Table State (Atas)
    const [tableUnit, setTableUnit] = useState(filters?.unit_bisnis || '');
    const [tableKodeSap, setTableKodeSap] = useState(filters?.kode_sap || '');
    const [tableJenis, setTableJenis] = useState(filters?.jenis || '');

    // Filter Laporan State (Bawah)
    const [laporanStartDate, setLaporanStartDate] = useState(filters?.start_date || '');
    const [laporanEndDate, setLaporanEndDate] = useState(filters?.end_date || '');
    const [laporanUnit, setLaporanUnit] = useState(filters?.unit_bisnis || '');
    const [laporanKodeSap, setLaporanKodeSap] = useState(filters?.kode_sap || '');
    const [laporanJenis, setLaporanJenis] = useState(filters?.jenis || '');

    // Form Handlers
    const handleApplyTableFilter = (e) => {
        e.preventDefault();
        router.get('/admin/verifikasi', {
            unit_bisnis: tableUnit,
            kode_sap: tableKodeSap,
            jenis: tableJenis
        }, { preserveState: true });
    };

    const handleApplyLaporanFilter = (e) => {
        e.preventDefault();
        router.get('/admin/verifikasi', {
            unit_bisnis: laporanUnit,
            kode_sap: laporanKodeSap,
            jenis: laporanJenis,
            start_date: laporanStartDate,
            end_date: laporanEndDate
        }, { preserveState: true });
    };

    const handleMarkCompleted = (id) => {
        if (window.confirm('Apakah Anda yakin pengajuan ini sudah selesai? Pengajuan akan dipindahkan ke Riwayat.')) {
            router.post(`/admin/completed/${id}`);
        }
    };

    const handleCetakLaporan = () => {
        const query = new URLSearchParams({
            unit_bisnis: laporanUnit,
            kode_sap: laporanKodeSap,
            jenis: laporanJenis,
            start_date: laporanStartDate,
            end_date: laporanEndDate
        }).toString();
        window.open(`/admin/laporan/cetak?${query}`, '_blank');
    };

    const handleDownloadCsv = () => {
        const query = new URLSearchParams({
            unit_bisnis: laporanUnit,
            kode_sap: laporanKodeSap,
            jenis: laporanJenis,
            start_date: laporanStartDate,
            end_date: laporanEndDate
        }).toString();
        window.open(`/admin/laporan/csv?${query}`, '_blank');
    };

    const pieData = {
        labels: ['Proses', 'Selesai', 'Revisi'],
        datasets: [{
            data: [pengajuanProses || 0, pengajuanDisetujui || 0, pengajuanRevisi || 0],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const pieOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                align: 'center',
                labels: {
                    boxWidth: 10,
                    padding: 8,
                    font: { size: 11, weight: '500' }
                }
            }
        },
        maintainAspectRatio: false,
        layout: { padding: { bottom: 0 } }
    };

    const jenisPieData = {
        labels: Object.keys(jenisStats || {}),
        datasets: [{
            data: Object.values(jenisStats || {}),
            backgroundColor: ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const unitBarData = {
        labels: Object.keys(unitStats || {}),
        datasets: [{
            label: 'Pengajuan',
            data: Object.values(unitStats || {}),
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4
        }]
    };

    const barOptions = {
        plugins: { legend: { display: false } },
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } },
            x: { ticks: { font: { size: 10 } } }
        }
    };

    // Derived Data
    const tableBranches = tableUnit ? (branches || []).filter(b => b.unit_bisnis === tableUnit) : (branches || []);
    const laporanBranches = laporanUnit ? (branches || []).filter(b => b.unit_bisnis === laporanUnit) : (branches || []);

    const ubOptions = [{ value: '', label: '-- Semua Unit Bisnis --' }, ...(unitBisnisOptions || []).map(ub => ({ value: ub, label: ub }))];
    const jenisOptionsMapped = [{ value: '', label: '-- Semua Jenis Perizinan --' }, ...(jenisOptions || []).map(j => ({ value: j, label: j }))];
    const tableCabangOptions = [{ value: '', label: '-- Semua Cabang --' }, ...tableBranches.map(b => ({ value: b.kode_sap, label: `${b.name} (${b.kode_sap})` }))];

    return (
        <AdminLayout title="Verifikasi Pengajuan - HQ Authority" pageTitle="Verifikasi Pengajuan" pageSubtitle="Pemeriksaan Dokumen & Persetujuan Surat Izin Apotek (SIA)">
            <div>
                {/* ======================================================== */}
                {/* 1. FILTER TOOLBAR (FULL WIDTH - RAMPING 1 BARIS)         */}
                {/* ======================================================== */}
                <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: '12px', background: '#FFFFFF' }}>
                    <div className="card-body p-3">
                        <form onSubmit={handleApplyTableFilter}>
                            <div className="row g-2 align-items-center">
                                <div className="col-12 col-md-3">
                                    <label className="form-label text-muted small fw-bold mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.3px' }}>Unit Bisnis</label>
                                    <Select
                                        id="table_unit_bisnis"
                                        options={ubOptions}
                                        value={ubOptions.find(o => o.value === tableUnit) || ubOptions[0]}
                                        onChange={(sel) => { setTableUnit(sel.value); setTableKodeSap(''); }}
                                        styles={customSelectStyles}
                                        isSearchable
                                        placeholder="-- Semua Unit Bisnis --"
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                <div className="col-12 col-md-3">
                                    <label className="form-label text-muted small fw-bold mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.3px' }}>Cabang / Apotek</label>
                                    <Select
                                        id="table_kode_sap"
                                        options={tableCabangOptions}
                                        value={tableCabangOptions.find(o => o.value === tableKodeSap) || tableCabangOptions[0]}
                                        onChange={(sel) => setTableKodeSap(sel.value)}
                                        styles={customSelectStyles}
                                        isSearchable
                                        placeholder="-- Semua Cabang --"
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                <div className="col-12 col-md-3">
                                    <label className="form-label text-muted small fw-bold mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.3px' }}>Jenis Pengajuan</label>
                                    <Select
                                        id="table_jenis"
                                        options={jenisOptionsMapped}
                                        value={jenisOptionsMapped.find(o => o.value === tableJenis) || jenisOptionsMapped[0]}
                                        onChange={(sel) => setTableJenis(sel.value)}
                                        styles={customSelectStyles}
                                        isSearchable
                                        placeholder="-- Semua Jenis Pengajuan --"
                                        menuPortalTarget={document.body}
                                    />
                                </div>

                                <div className="col-12 col-md-3 d-flex flex-column">
                                    <label className="form-label d-none d-md-block mb-1 small fw-bold" style={{ fontSize: '0.72rem' }}>&nbsp;</label>
                                    <div className="d-flex gap-1.5">
                                        <button type="submit" className="btn btn-primary fw-bold flex-grow-1 shadow-sm d-flex align-items-center justify-content-center gap-1.5" style={{ height: '38px', borderRadius: '6px', fontSize: '0.88rem' }}>
                                            <i className="fas fa-filter"></i> Terapkan
                                        </button>
                                        {(tableUnit || tableKodeSap || tableJenis) && (
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-secondary px-2.5 shadow-sm fw-semibold"
                                                style={{ height: '38px', borderRadius: '6px' }}
                                                title="Reset Filter"
                                                onClick={() => {
                                                    setTableUnit('');
                                                    setTableKodeSap('');
                                                    setTableJenis('');
                                                    router.get('/admin/verifikasi', {}, { preserveState: true });
                                                }}
                                            >
                                                <i className="fas fa-undo"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* 2. EXECUTIVE BANNER & TOTAL                              */}
                {/* ======================================================== */}
                <div className="alert alert-primary d-flex align-items-center justify-content-between py-2.5 px-3 mb-3 border-0 shadow-sm" style={{ borderRadius: '10px', background: '#EFF6FF', color: '#1E40AF' }}>
                    <div className="d-flex align-items-start gap-2">
                        <i className="fas fa-clipboard-check text-primary fs-5 mt-1"></i>
                        <span style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>
                            <strong>Antrean Verifikasi:</strong> Klik tombol <strong>Verifikasi</strong> pada tabel di bawah untuk memeriksa berkas dan memproses keputusan.
                        </span>
                    </div>
                    <span className="badge bg-primary px-3 py-1.5 rounded-pill shadow-xs" style={{ fontSize: '0.82rem' }}>
                        Total: {perizinans?.total || 0} Pengajuan
                    </span>
                </div>

                {/* ======================================================== */}
                {/* 3. TABEL DAFTAR PENGAJUAN (100% FULL WIDTH, NO SCROLL)   */}
                {/* ======================================================== */}
                {!perizinans || !perizinans.data || perizinans.data.length === 0 ? (
                    <div className="card border-0 shadow-sm text-center py-4 mb-4" style={{ borderRadius: '12px', background: '#FFFFFF' }}>
                        <div className="card-body">
                            <div className="fs-2 text-muted mb-2"><i className="fas fa-folder-open"></i></div>
                            <h6 className="fw-bold text-dark mb-1">Tidak Ada Antrean Pengajuan</h6>
                            <p className="m-0 text-muted small">Tidak ada pengajuan perizinan baru yang sesuai dengan filter saat ini.</p>
                        </div>
                    </div>
                ) : (
                    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '14px', background: '#FFFFFF', overflow: 'hidden' }}>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ width: '100%' }}>
                                <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                                    <tr style={{ color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <th className="py-3 px-3">Nama Apotek</th>
                                        <th className="py-3 px-3">Kode SAP</th>
                                        <th className="py-3 px-3">Unit Bisnis</th>
                                        <th className="py-3 px-3">Jenis Perizinan</th>
                                        <th className="py-3 px-3">Tanggal Pengajuan</th>
                                        <th className="py-3 px-3">Status Verifikasi</th>
                                        <th className="py-3 px-3 text-center">Aksi HQ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {perizinans.data.map(perizinan => (
                                        <tr key={perizinan.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td className="py-3 px-3">
                                                <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{perizinan.nama_apotek}</strong>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="badge bg-light text-dark border px-2 py-1 fw-bold font-monospace" style={{ fontSize: '0.8rem' }}>
                                                    {perizinan.user?.kode_sap || '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-secondary fw-semibold" style={{ fontSize: '0.85rem' }}>
                                                    {perizinan.user?.unit_bisnis || '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fw-semibold" style={{ fontSize: '0.82rem' }}>
                                                    {perizinan.jenis_perizinan}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3" style={{ whiteSpace: 'nowrap' }}>
                                                <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.85rem' }}>
                                                    <i className="far fa-calendar-alt text-primary"></i>
                                                    <span className="fw-semibold text-dark">
                                                        {new Date(perizinan.tanggal_pengajuan).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        }).replace(/\//g, ' / ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3" style={{ whiteSpace: 'nowrap' }}>
                                                {perizinan.status === 'approved' ? (
                                                    perizinan.surat_izin_final ? (
                                                        <span className="badge-status-hq" style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                                                            <i className="fas fa-check-double text-success"></i> Izin Terbit (Selesai)
                                                        </span>
                                                    ) : (
                                                        <div className="dropdown">
                                                            <button className="badge-status-hq" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', cursor: 'pointer' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                <i className="fas fa-building text-primary"></i> Proses Kemenkes <i className="fas fa-chevron-down ms-1" style={{ fontSize: '0.65rem' }}></i>
                                                            </button>
                                                            <ul className="dropdown-menu shadow-sm border-0" style={{ borderRadius: '8px', overflow: 'hidden', minWidth: '170px' }}>
                                                                <li>
                                                                    <button onClick={() => handleMarkCompleted(perizinan.id)} className="dropdown-item text-success fw-bold py-1.5 w-100 text-start border-0 bg-transparent small">
                                                                        <i className="fas fa-check-double me-1.5"></i> Tandai Selesai
                                                                    </button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    )
                                                ) : perizinan.status === 'needs_revision' ? (
                                                    <span className="badge-status-hq fw-semibold px-3 py-1.5 rounded-pill" style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
                                                        Perlu Revisi
                                                    </span>
                                                ) : (
                                                    (() => {
                                                        const badge = getStatusBadge(perizinan.status);
                                                        return (
                                                            <span className="badge-status-hq fw-semibold px-3 py-1.5 rounded-pill" style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                                                {badge.text}
                                                            </span>
                                                        );
                                                    })()
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center" style={{ whiteSpace: 'nowrap' }}>
                                                <div className="d-flex align-items-center justify-content-center gap-1.5">
                                                    {perizinan.status === 'approved' ? (
                                                        <a className="btn-detail-hq" href={`/admin/verify/${perizinan.id}`} title="Lihat Detail Pengajuan" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                                                            <i className="fas fa-eye me-1"></i>
                                                            <span>Detail</span>
                                                        </a>
                                                    ) : (
                                                        <a className="btn-verify-hq" href={`/admin/verify/${perizinan.id}`} title="Buka dan Periksa Dokumen Pengajuan" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                                                            <i className="fas fa-clipboard-check me-1"></i>
                                                            <span>Verifikasi</span>
                                                        </a>
                                                    )}
                                                    <a className="btn-zip-hq" href={`/admin/verify/${perizinan.id}/download-all`} title="Unduh Semua Berkas (ZIP)" style={{ padding: '6px 10px', fontSize: '0.82rem' }}>
                                                        <i className="fas fa-file-archive text-secondary me-1"></i>
                                                        <span>ZIP</span>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {perizinans?.links && perizinans.links.length > 3 && (
                    <div className="d-flex justify-content-center mb-4">
                        <nav>
                            <ul className="pagination pagination-sm m-0">
                                {perizinans.links.map((link, i) => (
                                    <li key={i} className={`page-item ${link.active ? 'active' : ''} ${link.url === null ? 'disabled' : ''}`}>
                                        <Link className="page-link" href={link.url || '#'} dangerouslySetInnerHTML={{ __html: link.label }}></Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                )}

                {/* ======================================================== */}
                {/* 4. STATISTIK & LAPORAN (KOMPAK 1 BARIS - 3 GRAFIK)       */}
                {/* ======================================================== */}
                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '14px', background: '#FFFFFF' }}>
                    <div className="card-header bg-white border-0 py-3 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
                        <h6 className="m-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                            <i className="fas fa-chart-pie text-primary"></i> Statistik & Laporan Pengajuan
                        </h6>

                        {/* Inline Report Filter & Export Toolbar */}
                        <form onSubmit={handleApplyLaporanFilter} className="d-flex flex-wrap align-items-center gap-2 ms-auto">
                            <div className="input-group input-group-sm" style={{ width: '230px' }}>
                                <input type="date" value={laporanStartDate} onChange={(e) => setLaporanStartDate(e.target.value)} className="form-control" title="Tanggal Mulai" />
                                <span className="input-group-text bg-white px-1 text-muted">-</span>
                                <input type="date" value={laporanEndDate} onChange={(e) => setLaporanEndDate(e.target.value)} className="form-control" title="Tanggal Akhir" />
                            </div>

                            <button type="submit" className="btn btn-sm btn-primary fw-semibold px-2.5 shadow-xs" title="Terapkan Periode Tanggal">
                                <i className="fas fa-filter"></i>
                            </button>

                            <div className="dropdown">
                                <button className="btn btn-sm btn-outline-secondary bg-white fw-semibold text-dark px-2.5 d-flex align-items-center gap-1.5 shadow-xs" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ border: '1px solid #CBD5E1' }}>
                                    <i className="fas fa-file-export text-primary"></i> Ekspor <i className="fas fa-chevron-down" style={{ fontSize: '0.65em', opacity: 0.7 }}></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: '8px', minWidth: '160px' }}>
                                    <li>
                                        <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-1.5 small fw-semibold text-secondary" onClick={handleCetakLaporan}>
                                            <i className="fas fa-file-pdf text-danger fs-6"></i> PDF Laporan
                                        </button>
                                    </li>
                                    <li><hr className="dropdown-divider my-1" /></li>
                                    <li>
                                        <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-1.5 small fw-semibold text-secondary" onClick={handleDownloadCsv}>
                                            <i className="fas fa-file-excel text-success fs-6"></i> Excel (CSV)
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </form>
                    </div>

                    <div className="card-body p-3">
                        <div className="row g-3">
                            {/* Chart 1: Donut Status */}
                            <div className="col-lg-3 col-md-6">
                                <div className="p-3 border rounded-3 text-center h-100 bg-light-subtle">
                                    <div className="small fw-bold text-muted mb-2 text-uppercase" style={{ fontSize: '0.75rem' }}>Status Pengajuan</div>
                                    <div style={{ height: '175px', width: '100%', position: 'relative' }}>
                                        {(pengajuanProses || pengajuanDisetujui || pengajuanRevisi) ? (
                                            <Pie data={pieData} options={pieOptions} />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Belum ada data</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chart 2: Donut Jenis */}
                            <div className="col-lg-3 col-md-6">
                                <div className="p-3 border rounded-3 text-center h-100 bg-light-subtle">
                                    <div className="small fw-bold text-muted mb-2 text-uppercase" style={{ fontSize: '0.75rem' }}>Jenis Perizinan</div>
                                    <div style={{ height: '175px', width: '100%', position: 'relative' }}>
                                        {Object.keys(jenisStats || {}).length > 0 ? (
                                            <Pie data={jenisPieData} options={pieOptions} />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Belum ada data</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chart 3: Bar Sebaran Unit Bisnis */}
                            <div className="col-lg-6 col-md-12">
                                <div className="p-3 border rounded-3 text-center h-100 bg-light-subtle">
                                    <div className="small fw-bold text-muted mb-2 text-uppercase" style={{ fontSize: '0.75rem' }}>Sebaran Per Unit Bisnis</div>
                                    <div style={{ height: '175px', width: '100%', position: 'relative' }}>
                                        {Object.keys(unitStats || {}).length > 0 ? (
                                            <Bar data={unitBarData} options={barOptions} />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">Belum ada data</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
