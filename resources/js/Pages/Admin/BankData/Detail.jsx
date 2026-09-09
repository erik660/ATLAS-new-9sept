import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function BankDataDetail({ branch, perizinans = [], adminNotes = [] }) {

    return (
        <AdminLayout
            title={`Arsip Cabang - ${branch.name}`}
            pageTitle={`Arsip Cabang: ${branch.name}`}
            pageSubtitle={`Cabang: ${branch.unit_bisnis || '-'} | SAP: ${branch.kode_sap || '-'}`}
        >
            <div className="container-fluid py-4">

                {/* HEADER INFO CABANG */}
                <div className="card-hq shadow-sm mb-4 border-0">
                    <div className="card-body">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center">
                                <div className="avatar-hq rounded-circle bg-light-primary text-primary d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {branch.name ? branch.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div>
                                    <h4 className="mb-1 fw-bold">{branch.name}</h4>
                                    <div className="text-muted d-flex flex-wrap gap-3">
                                        <span><i className="fas fa-building me-1"></i> {branch.unit_bisnis || 'Belum Diatur'}</span>
                                        <span><i className="fas fa-hashtag me-1"></i> SAP: {branch.kode_sap || '-'}</span>
                                        <span><i className="fas fa-file-invoice me-1"></i> Total Perizinan Selesai: {perizinans.length}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Link 
                                    href={`/admin/bank-data/${branch.id}/catatan`} 
                                    className="btn btn-outline-primary rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2"
                                >
                                    <i className="fas fa-folder-open text-primary"></i> 
                                    <span>Catatan & Berkas Internal Admin</span>
                                    {adminNotes.length > 0 && (
                                        <span className="badge bg-primary text-white ms-1 rounded-pill px-2">
                                            {adminNotes.length}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABEL UTAMA: HANYA RIWAYAT PERIZINAN RESMI CABANG */}
                <div className="card shadow-sm border-0" style={{ borderRadius: '14px' }}>
                    <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0 text-primary d-flex align-items-center">
                            <i className="fas fa-file-signature me-2"></i> Riwayat Perizinan Selesai
                        </h5>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1">
                            {perizinans.length} Pengajuan Selesai
                        </span>
                    </div>
                    <div className="card-body p-0">
                        {perizinans.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }} className="text-center">No</th>
                                            <th>Jenis Perizinan</th>
                                            <th>Nama Apotek</th>
                                            <th>Tgl Pengajuan</th>
                                            <th>Tgl Selesai</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {perizinans.map((p, index) => {
                                            const tglSelesai = p.updated_at ? new Date(p.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                            const tglAjuan = p.tanggal_pengajuan ? new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

                                            return (
                                                <tr
                                                    key={p.id}
                                                    onClick={() => router.visit(`/admin/bank-data/arsip/${p.id}`)}
                                                    style={{ cursor: 'pointer' }}
                                                    className="clickable-row"
                                                >
                                                    <td className="text-center text-muted fw-bold small">{index + 1}</td>
                                                    <td><strong>{p.jenis_perizinan}</strong></td>
                                                    <td>{p.nama_apotek}</td>
                                                    <td>{tglAjuan}</td>
                                                    <td><span className="text-success fw-bold"><i className="fas fa-check-circle me-1"></i> {tglSelesai}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <i className="fas fa-folder-open fa-3x text-muted mb-3" style={{ opacity: 0.4 }}></i>
                                <h6 className="text-muted fw-bold">Belum ada pengajuan perizinan selesai</h6>
                                <p className="text-muted small mb-0">Cabang ini belum memiliki data perizinan resmi yang berstatus selesai/terbit.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <style>{`
                .bg-light-primary {
                    background-color: rgba(13, 110, 253, 0.1);
                }
            `}</style>
        </AdminLayout>
    );
}
