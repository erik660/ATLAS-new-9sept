import React, { useState, useRef } from 'react';
import { usePage, Link, Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Swal from 'sweetalert2';

const FileReviewCard = ({ num, label, perizinan, onPreview }) => {
    const fieldName = `file_${num}`;
    const fileUrl = perizinan[fieldName];
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelected = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            Swal.fire('File Terlalu Besar', 'Ukuran berkas maksimal adalah 10 MB.', 'warning');
            e.target.value = '';
            return;
        }

        Swal.fire({
            title: 'Unggah / Ganti Dokumen?',
            text: `Anda akan memperbarui berkas untuk "${label}".`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Unggah File',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#2563EB',
            cancelButtonColor: '#6B7280'
        }).then((result) => {
            if (result.isConfirmed) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('field', fieldName);
                formData.append('document', file);

                router.post(`/admin/bank-data/arsip/${perizinan.id}/upload-doc`, formData, {
                    forceFormData: true,
                    preserveScroll: true,
                    onFinish: () => {
                        setIsUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                });
            } else {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    return (
        <div className="col-md-6 mb-4">
            <div className="d-flex flex-column h-100 p-3 rounded border bg-white shadow-sm hover-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label-custom mb-0 fw-bold">{label}</label>
                    <span className={`badge ${fileUrl ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-muted border'}`} style={{ fontSize: '0.7rem' }}>
                        {fileUrl ? 'Tersedia' : 'Belum Ada'}
                    </span>
                </div>

                {fileUrl ? (
                    <div className="d-flex align-items-center gap-2 mt-auto pt-2">
                        <button
                            type="button"
                            onClick={() => onPreview && onPreview({
                                url: `/storage/${fileUrl}`,
                                title: label,
                                ext: fileUrl.split('.').pop().toLowerCase()
                            })}
                            className="btn btn-sm btn-outline-primary flex-grow-1 text-center rounded-pill py-1 fw-bold"
                        >
                            <i className="fas fa-eye me-1"></i> Pratinjau Dokumen
                        </button>
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-bold"
                            title="Ganti / Upload Berkas Baru"
                        >
                            {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-upload me-1"></i> Ganti</>}
                        </button>
                    </div>
                ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center p-3 text-center rounded border border-dashed mt-auto" style={{ background: '#f9fafb', borderColor: '#d1d5db' }}>
                        <small className="text-muted mb-2">Dokumen belum diunggah</small>
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-bold"
                        >
                            {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-plus me-1"></i> Upload Dokumen</>}
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.zip"
                    onChange={handleFileSelected}
                />
            </div>
        </div>
    );
};

export default function Arsip() {
    const { perizinan } = usePage().props;
    const [previewDoc, setPreviewDoc] = useState(null);

    const formatNumber = (num) => {
        if (!num) return '0';
        return parseInt(num).toLocaleString('id-ID');
    };

    return (
        <AdminLayout title="Arsip Cabang" pageTitle="Arsip Pengajuan" pageSubtitle="Data Final Legalitas Perizinan">
            <style>{`
                .gform-card { background: #ffffff; border-radius: 12px; border: 1px solid #eaeaea; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); margin-bottom: 20px; }
                .gform-card-header { padding: 14px 20px; border-bottom: 1px solid #f0f0f0; background-color: #ffffff; border-radius: 12px 12px 0 0; }
                .gform-section-title { font-size: 1.05rem; font-weight: 700; color: #111827; margin-bottom: 2px; }
                .gform-section-desc { font-size: 0.82rem; color: #6b7280; margin-bottom: 0; }
                .gform-body { padding: 20px; }
                .form-label-custom { font-weight: 600; color: #374151; font-size: 0.85rem; margin-bottom: 4px; }
                .input-group-text-custom { background-color: #f9fafb; border-color: #e5e7eb; color: #4b5563; font-weight: 600; font-size: 0.85rem; padding: 6px 12px; }
                .hover-card { transition: transform 0.2s, box-shadow 0.2s; }
                .hover-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08)!important; }
            `}</style>

            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h2 style={{ color: 'var(--hq-navy)', fontWeight: 800, letterSpacing: '-0.5px' }}>Arsip Data Perizinan</h2>
                    <p className="text-muted mb-0" style={{ fontSize: '1.05rem' }}>
                        {perizinan.nama_apotek} &middot; {perizinan.user?.name} ({perizinan.user?.kode_sap})
                    </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <a
                        href={`/admin/verify/${perizinan.id}/download-all`}
                        className="btn-zip-download-hq"
                    >
                        <i className="fas fa-file-archive"></i>
                        <span>Unduh Semua Berkas (ZIP)</span>
                    </a>
                </div>
            </div>

            {/* DATA UTAMA PENGAJUAN */}
            <div className="gform-card" style={{ borderTop: '8px solid var(--hq-navy)' }}>
                <div className="gform-card-header d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--hq-navy)' }}>Data Utama Pengajuan & Legalitas</h4>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold">
                        <i className="fas fa-check-circle me-1"></i> Terbit & Tersimpan di Arsip
                    </span>
                </div>
                <div className="gform-body bg-light bg-opacity-50">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label-custom">Jenis Perizinan</label>
                            <input type="text" readOnly className="form-control bg-white shadow-sm fw-bold text-dark" value={perizinan.jenis_perizinan} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-custom">Nama Apotek Terbit</label>
                            <input type="text" readOnly className="form-control bg-white shadow-sm fw-bold text-dark" value={perizinan.nama_apotek} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label-custom">Nama Apoteker (APJ)</label>
                            <input type="text" readOnly className="form-control bg-white shadow-sm" value={perizinan.apj?.nama_apj || '-'} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label-custom">Nomor SIPA</label>
                            <input type="text" readOnly className="form-control bg-white shadow-sm" value={perizinan.apj?.no_sip || '-'} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label-custom">Masa Berlaku SIPA</label>
                            <input
                                type="text"
                                readOnly
                                className="form-control bg-white shadow-sm fw-bold text-primary"
                                value={perizinan.apj?.masa_berlaku ? new Date(perizinan.apj.masa_berlaku).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* BAGIAN 1: PERSYARATAN DASAR */}
            <div className="gform-card">
                <div className="gform-card-header">
                    <h4 className="gform-section-title">Bagian 1: Persyaratan Dasar & Dokumen Utama</h4>
                    <p className="gform-section-desc">Berkas izin, sewa, dan teknis bangunan.</p>
                </div>
                <div className="gform-body">
                    <div className="row">
                        <FileReviewCard num="1" label="SIA Terakhir" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="2" label="SIPA Terbaru yang Masih Berlaku" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="3" label="Akta Perjanjian Sewa" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="4" label="Rencana Teknis Bangunan (RTB/RIK)" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="5" label="Izin Lokasi yang Diterbitkan OSS" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="12" label="Sertifikat Tanah dan IMB" perizinan={perizinan} onPreview={setPreviewDoc} />
                    </div>
                </div>
            </div>

            {/* BAGIAN 2: ALAMAT & TATA RUANG */}
            <div className="gform-card">
                <div className="gform-card-header">
                    <h4 className="gform-section-title">Bagian 2: Alamat, Geografis Lahan & Tata Ruang</h4>
                    <p className="gform-section-desc">Isian lokasi dan dokumen peta tata ruang.</p>
                </div>

                <div className="gform-body">
                    <div className="row g-3 mb-4">
                        <div className="col-md-6">
                            <label className="form-label-custom">Nama Rencana Usaha / Kegiatan</label>
                            <input type="text" readOnly className="form-control bg-light" value={perizinan.nama_rencana_usaha || ''} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label-custom">Kode Pos</label>
                            <input type="text" readOnly className="form-control bg-light" value={perizinan.kode_pos || ''} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label-custom">Luas Lahan</label>
                            <div className="input-group">
                                <input type="text" readOnly className="form-control bg-light" value={perizinan.luas_lahan || ''} />
                                <span className="input-group-text input-group-text-custom">m²</span>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label-custom">Alamat Lengkap Apotek</label>
                            <textarea readOnly style={{ resize: 'none' }} className="form-control bg-light" rows="2" value={perizinan.alamat_lengkap || ''}></textarea>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-custom">Rincian Alamat Lokasi Kegiatan</label>
                            <textarea readOnly style={{ resize: 'none' }} className="form-control bg-light" rows="2" value={perizinan.lokasi_alamat_lengkap || ''}></textarea>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label-custom">Deskripsi Kegiatan Usaha</label>
                            <textarea readOnly style={{ resize: 'none' }} className="form-control bg-light" rows="2" value={perizinan.deskripsi_kegiatan || ''}></textarea>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-custom">Deskripsi Kondisi Lokasi</label>
                            <textarea readOnly style={{ resize: 'none' }} className="form-control bg-light" rows="2" value={perizinan.deskripsi_lokasi || ''}></textarea>
                        </div>
                    </div>

                    <div className="row">
                        <FileReviewCard num="6" label="Peta Polygon Lahan (ZIP)" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="13" label="Data Kesesuaian Tata Ruang" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="14" label="Peta Lokasi" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="15" label="SHP Peta Tapak Proyek (ZIP)" perizinan={perizinan} onPreview={setPreviewDoc} />
                    </div>
                </div>
            </div>

            {/* BAGIAN 3: FINANSIAL & SDM */}
            <div className="gform-card">
                <div className="gform-card-header">
                    <h4 className="gform-section-title">Bagian 3: Finansial, Investasi & SDM</h4>
                    <p className="gform-section-desc">Nilai investasi serta data jumlah tenaga kerja.</p>
                </div>

                <div className="gform-body">
                    <div className="row g-3">
                        {['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja'].map(field => (
                            <div className="col-md-6" key={field}>
                                <label className="form-label-custom">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                                <div className="input-group">
                                    <span className="input-group-text input-group-text-custom">Rp</span>
                                    <input type="text" readOnly className="form-control bg-light" value={formatNumber(perizinan[field])} />
                                </div>
                            </div>
                        ))}

                        <div className="col-md-12 mt-3">
                            <label className="form-label-custom">Nilai Kapasitas / Omzet per Tahun</label>
                            <div className="input-group">
                                <span className="input-group-text input-group-text-custom">Rp</span>
                                <input type="text" readOnly className="form-control bg-light" value={formatNumber(perizinan.omzet_pertahun)} />
                            </div>
                        </div>

                        <div className="col-md-12 mt-4">
                            <label className="form-label-custom mb-2">Jumlah Personel SDM Apotek</label>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <div className="p-3 rounded border text-center bg-light">
                                        <i className="fas fa-male fa-2x text-primary mb-2"></i>
                                        <label className="d-block small fw-bold text-dark mb-1">Laki-laki</label>
                                        <div className="fs-5 fw-bold">{perizinan.sdm_laki || 0} Orang</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 rounded border text-center bg-light">
                                        <i className="fas fa-female fa-2x text-danger mb-2"></i>
                                        <label className="d-block small fw-bold text-dark mb-1">Perempuan</label>
                                        <div className="fs-5 fw-bold">{perizinan.sdm_perempuan || 0} Orang</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="p-3 rounded border text-center bg-light">
                                        <i className="fas fa-globe-asia fa-2x text-success mb-2"></i>
                                        <label className="d-block small fw-bold text-dark mb-1">Tenaga Kerja Asing</label>
                                        <div className="fs-5 fw-bold">{perizinan.sdm_tka || 0} Orang</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BAGIAN 4: PERSYARATAN UMUM */}
            <div className="gform-card">
                <div className="gform-card-header">
                    <h4 className="gform-section-title">Bagian 4: Persyaratan Umum</h4>
                </div>
                <div className="gform-body">
                    <div className="row">
                        <FileReviewCard num="7" label="Dokumen Administrasi" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="8" label="Dokumen Lokasi" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="9" label="Dokumen Bangunan" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="10" label="Dokumen Sarana & Prasarana" perizinan={perizinan} onPreview={setPreviewDoc} />
                        <FileReviewCard num="11" label="Dokumen SDM (STR, KTP, SIPA, dll)" perizinan={perizinan} onPreview={setPreviewDoc} />
                    </div>
                </div>
            </div>

            {/* BAGIAN 5: BAP */}
            <div className="gform-card" style={{ borderTop: '4px solid var(--kfa-orange)' }}>
                <div className="gform-card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                    <h5 className="mb-1 fw-bold" style={{ color: 'var(--kfa-navy)' }}>Bagian 5: Berita Acara Pemeriksaan (BAP)</h5>
                </div>
                <div className="gform-body px-4 pb-4">
                    <div className="row gx-3 gy-2">
                        <FileReviewCard num="16" label="Dokumen Berita Acara Pemeriksaan (BAP)" perizinan={perizinan} onPreview={setPreviewDoc} />
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
