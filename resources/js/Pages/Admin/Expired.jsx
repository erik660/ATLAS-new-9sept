import React, { useState } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import '../../../css/verifikasi.css';
import Select from 'react-select';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
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

export default function Expired() {
    const { perizinans, allPerizinans, branches, jenisOptions, unitBisnisOptions } = usePage().props;

    const [selectedPieUnit, setSelectedPieUnit] = useState(null);

    // Parse filters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const [unitBisnis, setUnitBisnis] = useState(urlParams.get('unit_bisnis') || '');
    const [kodeSap, setKodeSap] = useState(urlParams.get('kode_sap') || '');
    const [jenis, setJenis] = useState(urlParams.get('jenis') || '');
    const [tableStatusFilter, setTableStatusFilter] = useState('');


    const handleFilterJenis = (e) => {
        e.preventDefault();
        router.get('/admin/expired', { unit_bisnis: unitBisnis, kode_sap: kodeSap, jenis: jenis }, { preserveState: true });
    };

    const handleSendReminder = (id) => {
        if (window.confirm('Kirim notifikasi pengingat ke portal cabang?')) {
            router.post(`/admin/reminder/${id}`);
        }
    };

    const currentBranches = unitBisnis ? (branches || []).filter(b => b.unit_bisnis === unitBisnis) : (branches || []);

    const ubOptions = [{ value: '', label: '-- Semua Unit Bisnis --' }, ...(unitBisnisOptions || []).map(ub => ({ value: ub, label: ub }))];
    const jenisOptionsMapped = [{ value: '', label: '-- Semua Jenis Perizinan --' }, ...(jenisOptions || []).map(j => ({ value: j, label: j }))];
    const cabangOptions = [{ value: '', label: '-- Semua Cabang --' }, ...currentBranches.map(b => ({ value: b.kode_sap, label: `${b.name} (${b.kode_sap})` }))];

    const getStatusInfo = (masaBerlaku) => {
        if (!masaBerlaku) return null;
        const diffTime = Math.abs(new Date(masaBerlaku) - new Date());
        const sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isPast = new Date(masaBerlaku) < new Date();
        const actualSisaHari = isPast ? -sisaHari : sisaHari;

        if (actualSisaHari <= 180) {
            return { badgeClass: 'badge-urgent', text: `Urgent (${actualSisaHari} hari)`, icon: 'fas fa-exclamation-circle animate-pulse', showReminder: true };
        } else if (actualSisaHari <= 365) {
            return { badgeClass: 'badge-warning', text: `Warning (${actualSisaHari} hari)`, icon: 'fas fa-clock', showReminder: false };
        } else {
            return { badgeClass: 'badge-safe', text: `Aman (${actualSisaHari} hari)`, icon: 'fas fa-check-circle', showReminder: false };
        }
    };

    const activeUnit = selectedPieUnit || unitBisnis;

    // Calculate National Totals for consistent percentages and summary widget
    let trueTotalUrgentNasional = 0;
    let trueTotalWarningNasional = 0;
    let trueTotalAmanNasional = 0;

    (allPerizinans || perizinans || []).forEach(p => {
        const status = getStatusInfo(p.apj?.masa_berlaku);
        if (status) {
            if (status.badgeClass === 'badge-urgent') trueTotalUrgentNasional++;
            else if (status.badgeClass === 'badge-warning') trueTotalWarningNasional++;
            else trueTotalAmanNasional++;
        }
    });

    // Calculate Chart Stats (Filtered Data)
    const urgentPerizinans = (perizinans || []).filter(p => {
        const status = getStatusInfo(p.apj?.masa_berlaku);
        return status && status.badgeClass === 'badge-urgent';
    });

    const unitUrgentStats = {};
    let totalUrgentFiltered = 0;

    urgentPerizinans.forEach(p => {
        const unit = p.user?.unit_bisnis || 'Tidak Diketahui';
        if (!unitUrgentStats[unit]) {
            unitUrgentStats[unit] = 0;
        }
        unitUrgentStats[unit]++;
        totalUrgentFiltered++;
    });

    const sortedUnits = Object.keys(unitUrgentStats).sort((a, b) => unitUrgentStats[b] - unitUrgentStats[a]);

    const pieLabels = [];
    const pieDataValues = [];
    const pieColors = [];

    const colorPalette = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
        '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', 
        '#14B8A6', '#6366F1', '#84CC16', '#D946EF',
        '#EAB308', '#0EA5E9', '#F43F5E', '#10B981'
    ];

    sortedUnits.forEach((unit, index) => {
        const count = unitUrgentStats[unit];
        const pct = trueTotalUrgentNasional > 0 ? Math.round((count / trueTotalUrgentNasional) * 100) : 0;
        pieLabels.push(`${unit} (${pct}% - ${count})`);
        pieDataValues.push(count);
        pieColors.push(colorPalette[index % colorPalette.length]);
    });

    const pieData = {
        labels: pieLabels,
        datasets: [{
            data: pieDataValues,
            backgroundColor: pieColors,
            borderWidth: 1,
            borderColor: '#ffffff',
            hoverOffset: 4
        }]
    };

    const pieOptions = {
        plugins: { 
            legend: { 
                display: false,
                position: 'right',
                align: 'center',
                onClick: () => {},
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: { size: 11 }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value} Apotek Urgent`;
                    }
                }
            }
        },
        maintainAspectRatio: false,
        layout: { padding: { bottom: 10 } },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const clickedUnit = sortedUnits[index];
                setSelectedPieUnit(clickedUnit);
            }
        }
    };

    let barData = null;
    let barOptions = null;
    let totalBar = 0;

    if (activeUnit) {
        let countUrgent = 0;
        let countWarning = 0;
        let countAman = 0;
        
        (allPerizinans || []).forEach(p => {
            if ((p.user?.unit_bisnis || 'Tidak Diketahui') === activeUnit) {
                const status = getStatusInfo(p.apj?.masa_berlaku);
                if (status) {
                    if (status.badgeClass === 'badge-urgent') countUrgent++;
                    else if (status.badgeClass === 'badge-warning') countWarning++;
                    else countAman++;
                }
            }
        });

        totalBar = countUrgent + countWarning + countAman;

        barData = {
            labels: ['Urgent', 'Warning', 'Aman'],
            datasets: [{
                label: `Total`,
                data: [countUrgent, countWarning, countAman],
                backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
                borderWidth: 0,
                borderRadius: 6
            }]
        };

        barOptions = {
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.raw} Apotek`;
                        }
                    }
                }
            },
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        };
    }

    const displayedPerizinans = (perizinans || []).filter(p => {
        const matchUnit = selectedPieUnit ? (p.user?.unit_bisnis || 'Tidak Diketahui') === selectedPieUnit : true;
        const statusInfo = getStatusInfo(p.apj?.masa_berlaku);
        const pStatus = statusInfo ? statusInfo.badgeClass : '';
        let matchStatus = true;
        if (tableStatusFilter === 'urgent') matchStatus = pStatus === 'badge-urgent';
        else if (tableStatusFilter === 'warning') matchStatus = pStatus === 'badge-warning';
        else if (tableStatusFilter === 'aman') matchStatus = pStatus === 'badge-safe';
        return matchUnit && matchStatus;
    });


    return (
        <AdminLayout title="Monitoring Masa Berlaku - HQ Authority" pageTitle="Monitoring Masa Berlaku" pageSubtitle="Sistem Pantau Real-Time Kedaluwarsa & Notifikasi Otomatis Cabang">
            <div>
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="d-flex align-items-center mb-2">
                            <h4 className="m-0 fw-bold" style={{ color: 'var(--hq-slate)' }}>
                                <i className="fas fa-chart-pie me-2 text-primary"></i> Dashboard Kedaluwarsa
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mb-4">
                    <div className="col-lg-4 col-md-12 d-flex flex-column gap-3">
                        <div className="filter-section">
                            {/* Filter Wilayah */}
                            <div className="filter-card-hq wilayah">
                                <h5 className="fw-bold d-flex align-items-center mb-4" style={{ color: '#0F172A', fontSize: '1.05rem' }}>
                                    <i className="fas fa-map-marked-alt text-primary me-2 fs-5"></i> Filter Wilayah
                                </h5>
                                <div>
                                    <div className="mb-1">
                                        <label htmlFor="unit_bisnis" className="form-label-hq">Unit Bisnis</label>
                                        <Select
                                            id="unit_bisnis"
                                            options={ubOptions}
                                            value={ubOptions.find(o => o.value === unitBisnis) || ubOptions[0]}
                                            onChange={(sel) => { 
                                                setUnitBisnis(sel.value); 
                                                setKodeSap(''); 
                                                setSelectedPieUnit(null);
                                                router.get('/admin/expired', { unit_bisnis: sel.value, kode_sap: '', jenis: jenis }, { preserveState: true });
                                            }}
                                            styles={customSelectStyles}
                                            isSearchable
                                            menuPortalTarget={document.body}
                                            placeholder="-- Semua Unit Bisnis --"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="info-banner-hq">
                            <div className="d-flex align-items-center gap-3">
                                <div className="fs-2 text-primary d-none d-sm-block" style={{ color: '#2563EB' }}>
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-1" style={{ color: '#1E3A8A', fontSize: '0.95rem' }}>
                                        <i className="fas fa-info-circle me-1 d-sm-none"></i> Monitoring & Notifikasi HQ
                                    </h6>
                                    <p className="m-0" style={{ color: '#1E40AF', fontSize: '0.82rem', lineHeight: '1.4' }}>
                                        Halaman ini memantau secara real-time masa berlaku SIA.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ringkasan Data Nasional */}
                        <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                            <div className="card-body p-3">
                                <h6 className="fw-bold mb-3 text-muted text-center" style={{ fontSize: '0.85rem' }}>Status Seluruh Apotek (Nasional)</h6>
                                <div className="row g-2 text-center">
                                    <div className="col-4">
                                        <div className="p-2 rounded bg-danger bg-opacity-10">
                                            <h5 className="fw-bold text-danger mb-0">{trueTotalUrgentNasional}</h5>
                                            <small className="text-muted" style={{fontSize: '0.7rem'}}>Urgent</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                                            <h5 className="fw-bold mb-0" style={{ color: '#d97706' }}>{trueTotalWarningNasional}</h5>
                                            <small className="text-muted" style={{fontSize: '0.7rem'}}>Warning</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-2 rounded bg-success bg-opacity-10">
                                            <h5 className="fw-bold text-success mb-0">{trueTotalAmanNasional}</h5>
                                            <small className="text-muted" style={{fontSize: '0.7rem'}}>Aman</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-8 col-md-12">
                        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '16px' }}>
                            <div className="card-body p-4">
                                <div className="row h-100 align-items-center">
                                    <div className={activeUnit ? "col-md-6" : "col-12"}>
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                            <h5 className="fw-bold text-danger mb-4 text-center">Distribusi Unit Bisnis Kritis (Urgent)</h5>
                                            <div className={activeUnit ? "d-flex flex-column w-100" : "d-flex flex-row align-items-center w-100 justify-content-center"}>
                                                <div style={{ height: '300px', width: activeUnit ? '100%' : '45%', position: 'relative' }}>
                                                {totalUrgentFiltered > 0 ? (
                                                    <Pie data={pieData} options={pieOptions} style={{cursor: 'pointer'}} />
                                                ) : (
                                                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">Semua Unit Bisnis Aman!</div>
                                                )}
                                                </div>
                                                
                                                {/* Custom HTML Legend */}
                                                {totalUrgentFiltered > 0 && (
                                                    <div className={activeUnit ? "mt-4 w-100 px-2" : "ms-4 w-50 pe-2"} style={{ maxHeight: activeUnit ? '160px' : '280px', overflowY: 'auto' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: activeUnit ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                                                            {pieLabels.map((label, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    className="d-flex align-items-center legend-item-hover" 
                                                                    style={{ fontSize: '0.85rem', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px' }}
                                                                    onClick={() => setSelectedPieUnit(sortedUnits[i])}
                                                                >
                                                                    <span className="me-2 flex-shrink-0 rounded-sm" style={{ width: '14px', height: '14px', backgroundColor: pieColors[i], display: 'inline-block' }}></span>
                                                                    <span className="text-truncate" style={{ color: '#475569' }} title={label}>{label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {!activeUnit && (
                                                <small className="text-muted mt-4"><i className="fas fa-hand-pointer me-1"></i> Klik pada irisan grafik untuk melihat detail perizinan dari unit bisnis tersebut pada tabel di bawah.</small>
                                            )}
                                        </div>
                                    </div>

                                    {activeUnit && (
                                        <div className="col-md-6 border-start">
                                            <div className="d-flex flex-column align-items-center justify-content-center h-100 ps-md-3 mt-4 mt-md-0">
                                                <h5 className="fw-bold mb-4 text-center" style={{ color: '#0F172A' }}>Rincian Status: <span className="text-primary">{activeUnit}</span></h5>
                                                <div style={{ height: '380px', width: '100%', position: 'relative' }}>
                                                    {totalBar > 0 ? (
                                                        <Bar data={barData} options={barOptions} />
                                                    ) : (
                                                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">Tidak ada data untuk unit ini.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-12 d-flex flex-column">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h4 className="m-0 fw-bold d-flex align-items-center" style={{ color: '#0F172A', fontSize: '1.15rem' }}>
                                <div><i className="fas fa-list-alt text-primary me-2"></i> Daftar Masa Berlaku Perizinan</div>
                                {selectedPieUnit && (
                                    <span className="ms-3 badge bg-danger d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                                        <i className="fas fa-filter me-1"></i> Filter: {selectedPieUnit}
                                        <button onClick={() => setSelectedPieUnit(null)} className="btn btn-sm btn-link text-white ms-2 p-0 text-decoration-none" title="Hapus Filter">
                                            <i className="fas fa-times-circle fs-6"></i>
                                        </button>
                                    </span>
                                )}
                            </h4>
                            <div className="d-flex align-items-center gap-3">
                                <select 
                                    className="form-select form-select-sm shadow-sm border-0" 
                                    style={{ minWidth: '150px', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: '600', borderRadius: '6px', cursor: 'pointer' }}
                                    value={tableStatusFilter}
                                    onChange={(e) => setTableStatusFilter(e.target.value)}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="urgent">🔴 Urgent</option>
                                    <option value="warning">🟠 Warning</option>
                                    <option value="aman">🟢 Aman</option>
                                </select>
                                <span className="badge fw-semibold px-3 py-2 shadow-sm" style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.82rem' }}>
                                    <i className="fas fa-file-invoice text-muted me-1.5"></i> Total: {displayedPerizinans.length} Data
                                </span>
                            </div>
                        </div>

                        {displayedPerizinans.length === 0 ? (
                            <div className="no-data-card flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
                                <div className="fs-1 text-muted mb-3"><i className="fas fa-check-circle text-success"></i></div>
                                <h5 className="fw-bold text-dark">Tidak Ada Data</h5>
                                <p className="m-0 text-muted">Saat ini tidak ada data perizinan yang sesuai dengan filter.</p>
                            </div>
                        ) : (
                            <div className="table-container-hq flex-grow-1 mb-4">
                                <div className="table-responsive">
                                    <table className="table-hq" style={{ minWidth: '1000px' }}>
                                        <thead>
                                            <tr>
                                                <th>Nama Apotek</th>
                                                <th>Unit Bisnis & SAP</th>
                                                <th>Jenis Perizinan</th>
                                                <th>Masa Berlaku</th>
                                                <th style={{ width: '220px' }}>Status Kedaluwarsa</th>
                                                <th className="text-center">Aksi HQ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedPerizinans.map(perizinan => {
                                                const status = getStatusInfo(perizinan.apj?.masa_berlaku);
                                                return (
                                                    <tr key={perizinan.id}>
                                                        <td>
                                                            <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{perizinan.nama_apotek}</strong>
                                                        </td>
                                                        <td>
                                                            <span className="text-muted d-block mb-1" style={{ fontSize: '0.8rem' }}>{perizinan.user?.unit_bisnis || '-'}</span>
                                                            <span className="badge bg-light text-dark border px-2 py-1 fw-bold font-monospace">{perizinan.user?.kode_sap}</span>
                                                        </td>
                                                        <td>
                                                            <span className="text-secondary fw-semibold" style={{ fontSize: '0.85rem' }}>SIA (Surat Izin Apotek)</span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <i className="far fa-calendar-alt text-muted"></i>
                                                                <span className="fw-semibold text-dark">
                                                                    {perizinan.apj?.masa_berlaku ? new Date(perizinan.apj.masa_berlaku).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ') : '-'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {status ? (
                                                                <span className="badge-status-hq" style={{ 
                                                                    backgroundColor: status.badgeClass === 'badge-urgent' ? '#FEF2F2' : (status.badgeClass === 'badge-warning' ? '#FFFBEB' : '#ECFDF5'), 
                                                                    color: status.badgeClass === 'badge-urgent' ? '#991B1B' : (status.badgeClass === 'badge-warning' ? '#B45309' : '#047857'),
                                                                    border: `1px solid ${status.badgeClass === 'badge-urgent' ? '#FECACA' : (status.badgeClass === 'badge-warning' ? '#FDE68A' : '#A7F3D0')}`,
                                                                    display: 'inline-block',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    <i className={`${status.icon} ${status.badgeClass === 'badge-urgent' ? 'text-danger' : ''}`}></i> {status.text}
                                                                </span>
                                                            ) : (
                                                                <span className="badge-status-hq" style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', display: 'inline-block', whiteSpace: 'nowrap' }}>
                                                                    <i className="fas fa-check-circle text-success"></i> Aman
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-center">
                                                            {status?.showReminder ? (
                                                                <button onClick={() => handleSendReminder(perizinan.id)} className="btn-verify-hq" style={{ border: 'none', background: status.badgeClass === 'badge-urgent' ? '#DC2626' : '#F59E0B' }} title="Kirim Notifikasi Peringatan">
                                                                    <i className="fas fa-bell me-1.5"></i>
                                                                    <span>Kirim Peringatan</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted small"><i className="fas fa-check me-1"></i> Tidak perlu</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
