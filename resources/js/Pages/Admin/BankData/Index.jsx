import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function BankDataIndex({ branches = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Sort ascending by unit_bisnis (A - Z), then kode_sap, then name
    const sortedBranches = useMemo(() => {
        return [...branches].sort((a, b) => {
            const ubA = (a.unit_bisnis || 'zzz').toLowerCase();
            const ubB = (b.unit_bisnis || 'zzz').toLowerCase();
            if (ubA !== ubB) return ubA.localeCompare(ubB);
            
            const sapA = (a.kode_sap || 'zzz').toLowerCase();
            const sapB = (b.kode_sap || 'zzz').toLowerCase();
            if (sapA !== sapB) return sapA.localeCompare(sapB);

            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [branches]);

    // Filter by search term or return all
    const filteredBranches = useMemo(() => {
        setCurrentPage(1); // Reset page on filter change
        if (!searchTerm.trim()) return sortedBranches;
        const q = searchTerm.toLowerCase().trim();
        return sortedBranches.filter(branch => 
            (branch.name && branch.name.toLowerCase().includes(q)) ||
            (branch.unit_bisnis && branch.unit_bisnis.toLowerCase().includes(q)) ||
            (branch.kode_sap && branch.kode_sap.toLowerCase().includes(q))
        );
    }, [sortedBranches, searchTerm]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredBranches.length / itemsPerPage) || 1;
    const paginatedBranches = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredBranches.slice(start, start + itemsPerPage);
    }, [filteredBranches, currentPage, itemsPerPage]);

    return (
        <AdminLayout 
            title="Arsip Cabang - KFA"
            pageTitle="Arsip Cabang"
            pageSubtitle="Direktori arsip legalitas dan perizinan apotek berdasarkan cabang"
        >
            <div className="container-fluid py-4">
                {/* SEARCH & STATS HEADER CARD */}
                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '14px' }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center g-3">
                            <div className="col-lg-6">
                                <h5 className="mb-1 fw-bold text-dark d-flex align-items-center">
                                    <i className="fas fa-archive me-2 text-primary"></i> Direktori Arsip Cabang
                                </h5>
                                <p className="text-muted small mb-0">
                                    Menampilkan seluruh unit bisnis terurut dari A - Z. Pilih cabang untuk melihat detail arsip.
                                </p>
                            </div>
                            <div className="col-lg-6">
                                <div className="input-group shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                                    <span className="input-group-text bg-white border-end-0 px-3">
                                        <i className="fas fa-search text-muted"></i>
                                    </span>
                                    <input 
                                        type="text" 
                                        className="form-control border-start-0 ps-0 py-2" 
                                        placeholder="Cari Unit Bisnis, Nama Cabang, atau Kode SAP..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ fontSize: '0.95rem' }}
                                    />
                                    {searchTerm && (
                                        <button 
                                            type="button" 
                                            className="btn btn-white bg-white border-start-0 text-muted"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLE LIST VIEW */}
                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                    <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                            <i className="fas fa-list me-2 text-primary"></i> Daftar Cabang
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill ms-2 px-3">
                                Total: {filteredBranches.length} Cabang
                            </span>
                        </div>
                        <div className="small text-muted">
                            Halaman {currentPage} dari {totalPages}
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 custom-list-table">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '60px' }} className="text-center">No</th>
                                    <th style={{ minWidth: '180px' }}>Unit Bisnis</th>
                                    <th style={{ minWidth: '250px' }}>Nama Cabang</th>
                                    <th style={{ width: '150px' }}>Kode SAP</th>
                                    <th style={{ width: '160px' }} className="text-center">Total Arsip Selesai</th>
                                    <th style={{ width: '130px' }} className="text-end pe-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBranches.length > 0 ? (
                                    paginatedBranches.map((branch, index) => {
                                        const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <tr 
                                                key={branch.id} 
                                                className="cursor-pointer"
                                                onClick={() => router.visit(`/admin/bank-data/${branch.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td className="text-center text-muted fw-bold small">
                                                    {globalIndex}
                                                </td>
                                                <td>
                                                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 fw-bold">
                                                        <i className="fas fa-building me-1"></i> {branch.unit_bisnis || 'Belum Diatur'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong className="text-dark d-block" style={{ fontSize: '0.95rem' }}>
                                                        {branch.name}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                                                        {branch.kode_sap || '-'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge rounded-pill px-3 py-2 fw-bold ${branch.perizinans_count > 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-muted border'}`}>
                                                        <i className={`fas ${branch.perizinans_count > 0 ? 'fa-check-circle' : 'fa-folder'} me-1`}></i>
                                                        {branch.perizinans_count || 0} Arsip
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4" onClick={(e) => e.stopPropagation()}>
                                                    <Link 
                                                        href={`/admin/bank-data/${branch.id}`} 
                                                        className="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow-sm"
                                                    >
                                                        Buka Arsip <i className="fas fa-chevron-right ms-1"></i>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-muted mb-2">
                                                <i className="fas fa-search fa-2x" style={{ opacity: 0.3 }}></i>
                                            </div>
                                            <h6 className="text-muted fw-bold">Cabang tidak ditemukan</h6>
                                            <p className="text-muted small mb-0">Coba ubah kata kunci pencarian Anda.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="card-footer bg-white py-3 px-4 d-flex flex-wrap justify-content-between align-items-center border-top">
                            <div className="small text-muted mb-2 mb-sm-0">
                                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredBranches.length)} dari {filteredBranches.length} data
                            </div>
                            <div className="d-flex gap-1">
                                <button 
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    <i className="fas fa-chevron-left me-1"></i> Sebelumnya
                                </button>
                                
                                <span className="btn btn-sm btn-light border disabled px-3">
                                    {currentPage} / {totalPages}
                                </span>

                                <button 
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Selanjutnya <i className="fas fa-chevron-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-list-table tbody tr {
                    transition: background-color 0.15s ease;
                }
                .custom-list-table tbody tr:hover {
                    background-color: #f8fafc;
                }
            `}</style>
        </AdminLayout>
    );
}
