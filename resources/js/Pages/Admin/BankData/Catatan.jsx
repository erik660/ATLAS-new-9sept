import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Swal from 'sweetalert2';

export default function BankDataCatatan({ branch, adminNotes = [] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        judul_dokumen: '',
        catatan: '',
        tanggal: new Date().toISOString().split('T')[0],
        file_dokumen: null,
    });

    const [previewDoc, setPreviewDoc] = useState(null); // { url, title, notes, date }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 15 * 1024 * 1024) {
                Swal.fire('File Terlalu Besar', 'Ukuran file maksimal adalah 15 MB.', 'warning');
                e.target.value = '';
                setData('file_dokumen', null);
                return;
            }
            setData('file_dokumen', file);
        } else {
            setData('file_dokumen', null);
        }
    };

    const handleUploadSubmit = (e) => {
        e.preventDefault();
        if (!data.judul_dokumen.trim()) {
            Swal.fire('Perhatian', 'Harap isi nama atau judul dokumen terlebih dahulu.', 'warning');
            return;
        }

        post(`/admin/bank-data/${branch.id}/catatan/store`, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                const fileInput = document.getElementById('page-file-upload');
                if (fileInput) fileInput.value = '';
                Swal.fire('Berhasil', 'Dokumen / catatan berhasil disimpan.', 'success');
            }
        });
    };

    const handleDeleteNote = (e, noteId, noteTitle) => {
        e.stopPropagation();
        Swal.fire({
            title: 'Hapus Dokumen / Catatan?',
            text: `Yakin ingin menghapus berkas/catatan "${noteTitle}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/bank-data/catatan/${noteId}`, {
                    onSuccess: () => {
                        Swal.fire('Terhapus', 'Dokumen/catatan berhasil dihapus.', 'success');
                    }
                });
            }
        });
    };

    const getFileExtension = (filename) => {
        if (!filename) return '';
        return filename.split('.').pop().toLowerCase();
    };

    return (
        <AdminLayout
            title={`Berkas & Catatan Internal - ${branch.name}`}
            pageTitle="Berkas & Catatan Internal Admin"
            pageSubtitle={`Cabang: ${branch.name} (${branch.unit_bisnis || '-'}) | SAP: ${branch.kode_sap || '-'}`}
        >
            <div className="container-fluid py-4" style={{ maxWidth: '980px' }}>

                {/* CARD 1: FORM TAMBAH BERKAS / CATATAN BARU */}
                <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '14px' }}>
                    <div className="card-header bg-white py-3 border-bottom">
                        <h5 className="fw-bold mb-0 text-primary d-flex align-items-center">
                            <i className="fas fa-plus-circle me-2"></i> Tambah Berkas / Catatan Baru
                        </h5>
                    </div>
                    <div className="card-body p-4">
                        <form onSubmit={handleUploadSubmit}>
                            <div className="row g-3">
                                <div className="col-md-7">
                                    <label className="form-label fw-bold small text-dark">
                                        Nama / Judul Dokumen <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Contoh: Surat Izin Dinkes 2026, Foto Denah Baru, SIPA Revisi..."
                                        value={data.judul_dokumen}
                                        onChange={(e) => setData('judul_dokumen', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label fw-bold small text-dark">
                                        Pilih Berkas File <span className="text-muted fw-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="file"
                                        id="page-file-upload"
                                        className="form-control"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp,.zip,.doc,.docx,.xls,.xlsx"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-bold small text-dark">
                                        Catatan / Keterangan File <span className="text-muted fw-normal">(Opsional)</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Tuliskan catatan penjelasan mengenai file ini untuk pegangan admin..."
                                        value={data.catatan}
                                        onChange={(e) => setData('catatan', e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold small text-dark">Tanggal Dokumen</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={data.tanggal}
                                        onChange={(e) => setData('tanggal', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-8 d-flex justify-content-end align-items-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                                    >
                                        {processing ? (
                                            <><i className="fas fa-spinner fa-spin me-2"></i> Menyimpan...</>
                                        ) : (
                                            <><i className="fas fa-upload me-2"></i> Simpan Catatan / Berkas</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* CARD 2: DAFTAR BERKAS & CATATAN TERSIMPAN */}
                <div className="card shadow-sm border-0" style={{ borderRadius: '14px' }}>
                    <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
                            <i className="fas fa-list-ul me-2 text-secondary"></i> Daftar Berkas & Catatan Tersimpan
                        </h5>
                        <span className="badge bg-secondary rounded-pill px-3 py-1">
                            {adminNotes.length} Berkas
                        </span>
                    </div>
                    <div className="card-body p-0">
                        {adminNotes.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }} className="text-center">No</th>
                                            <th>Nama / Judul Dokumen</th>
                                            <th>Catatan Keterangan</th>
                                            <th>Tanggal</th>
                                            <th>File Dokumen</th>
                                            <th style={{ width: '80px' }} className="text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminNotes.map((note, idx) => {
                                            const tgl = note.tanggal_pengajuan ? new Date(note.tanggal_pengajuan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                            return (
                                                <tr key={note.id}>
                                                    <td className="text-center text-muted fw-bold small">{idx + 1}</td>
                                                    <td>
                                                        <strong className="text-dark">{note.jenis_perizinan}</strong>
                                                    </td>
                                                    <td>
                                                        <span className="text-muted">{note.keterangan || '-'}</span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-dark border">{tgl}</span>
                                                    </td>
                                                    <td>
                                                        {note.file_1 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setPreviewDoc({
                                                                    url: `/storage/${note.file_1}`,
                                                                    title: note.jenis_perizinan,
                                                                    notes: note.keterangan,
                                                                    date: tgl,
                                                                    ext: getFileExtension(note.file_1)
                                                                })}
                                                                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
                                                            >
                                                                <i className="fas fa-eye me-1"></i> Pratinjau
                                                            </button>
                                                        ) : (
                                                            <span className="badge bg-light text-muted border">Tanpa File</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger rounded-circle"
                                                            title="Hapus Catatan/Dokumen Ini"
                                                            onClick={(e) => handleDeleteNote(e, note.id, note.jenis_perizinan)}
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <i className="fas fa-folder-open fa-3x text-muted mb-3" style={{ opacity: 0.3 }}></i>
                                <h6 className="text-muted fw-bold">Belum ada berkas atau catatan tersimpan</h6>
                                <p className="text-muted small mb-0">Gunakan form di atas untuk menambahkan berkas atau catatan pegangan untuk cabang ini.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* MODAL PRATINJAU DOKUMEN */}
            {previewDoc && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-bottom py-3 bg-white" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                <div>
                                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                                        <i className="fas fa-file-alt text-primary me-2"></i> {previewDoc.title}
                                    </h5>
                                    <div className="text-muted small d-flex gap-3 mt-1">
                                        <span><i className="fas fa-calendar-alt me-1"></i> {previewDoc.date}</span>
                                        {previewDoc.notes && previewDoc.notes !== '-' && (
                                            <span><i className="fas fa-comment-alt me-1 text-warning"></i> {previewDoc.notes}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setPreviewDoc(null)}
                                ></button>
                            </div>

                            <div className="modal-body p-0 d-flex justify-content-center align-items-center bg-dark" style={{ minHeight: '65vh' }}>
                                {['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(previewDoc.ext) ? (
                                    <div className="p-3 text-center w-100">
                                        <img
                                            src={previewDoc.url}
                                            alt={previewDoc.title}
                                            className="img-fluid rounded shadow"
                                            style={{ maxHeight: '75vh', objectFit: 'contain' }}
                                        />
                                    </div>
                                ) : previewDoc.ext === 'pdf' ? (
                                    <iframe
                                        src={previewDoc.url}
                                        title={previewDoc.title}
                                        style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
                                    />
                                ) : ['doc', 'docx'].includes(previewDoc.ext) ? (
                                    <div className="text-center p-5 bg-white rounded shadow-sm m-4 w-100" style={{ maxWidth: '520px' }}>
                                        <i className="fas fa-file-word fa-5x text-primary mb-3"></i>
                                        <h5 className="fw-bold text-dark mb-1">{previewDoc.title}</h5>
                                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 mb-3">
                                            Dokumen Microsoft Word (.{previewDoc.ext?.toUpperCase()})
                                        </span>
                                        {previewDoc.notes && previewDoc.notes !== '-' && (
                                            <div className="alert alert-light border text-start py-2 px-3 small text-muted mb-3">
                                                <strong className="text-dark"><i className="fas fa-sticky-note text-warning me-1"></i> Catatan:</strong> {previewDoc.notes}
                                            </div>
                                        )}
                                        <p className="text-muted small mb-4">
                                            Format Word tidak dapat dipratinjau langsung di browser. Klik tombol di bawah untuk membuka/mengunduh berkas.
                                        </p>
                                        <a href={previewDoc.url} download className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                                            <i className="fas fa-download me-1"></i> Unduh / Buka Dokumen Word
                                        </a>
                                    </div>
                                ) : ['xls', 'xlsx'].includes(previewDoc.ext) ? (
                                    <div className="text-center p-5 bg-white rounded shadow-sm m-4 w-100" style={{ maxWidth: '520px' }}>
                                        <i className="fas fa-file-excel fa-5x text-success mb-3"></i>
                                        <h5 className="fw-bold text-dark mb-1">{previewDoc.title}</h5>
                                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 mb-3">
                                            Dokumen Microsoft Excel (.{previewDoc.ext?.toUpperCase()})
                                        </span>
                                        <p className="text-muted small mb-4">
                                            Format Excel tidak dapat dipratinjau langsung di browser. Klik tombol di bawah untuk membuka/mengunduh berkas.
                                        </p>
                                        <a href={previewDoc.url} download className="btn btn-success rounded-pill px-4 fw-bold shadow-sm">
                                            <i className="fas fa-download me-1"></i> Unduh / Buka File Excel
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center p-5 bg-white rounded shadow-sm m-4 w-100" style={{ maxWidth: '520px' }}>
                                        <i className="fas fa-file-archive fa-5x text-warning mb-3"></i>
                                        <h5 className="fw-bold text-dark mb-1">{previewDoc.title}</h5>
                                        <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-3 py-1 mb-3">
                                            Berkas Arsip (.{previewDoc.ext?.toUpperCase()})
                                        </span>
                                        <div className="mt-3">
                                            <a href={previewDoc.url} download className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm text-dark">
                                                <i className="fas fa-download me-1"></i> Unduh Berkas
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer border-top py-2 bg-light d-flex justify-content-between" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                                <a
                                    href={previewDoc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                >
                                    <i className="fas fa-external-link-alt me-1"></i> Buka di Tab Baru
                                </a>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm rounded-pill px-4"
                                    onClick={() => setPreviewDoc(null)}
                                >
                                    Tutup Pratinjau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
