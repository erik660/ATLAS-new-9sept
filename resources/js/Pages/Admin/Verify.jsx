import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePage, router, Link, Head } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import Swal from 'sweetalert2';
import axios from 'axios';

const FileReviewCard = ({ num, label, perizinan, docStatus, setDocStatus, docNotes, setDocNotes, onPreview }) => {
    const fieldName = `file_${num}`;
    const fileUrl = perizinan[fieldName];
    const oldFiles = perizinan.old_files ? JSON.parse(perizinan.old_files) : {};
    const catatan = perizinan.catatan_dokumen ? (typeof perizinan.catatan_dokumen === 'string' ? JSON.parse(perizinan.catatan_dokumen) : perizinan.catatan_dokumen) : {};
    const isApproved = perizinan.status === 'approved' || perizinan.status === 'completed' || perizinan.status === 'terbit_verifikasi';

    if (!fileUrl) {
        return (
            <div className="col-md-6 mb-4">
                <div className="d-flex flex-column">
                    <label className="form-label-custom mb-2">{label} <span className="text-danger">*</span></label>
                    <div className="p-3 text-center align-items-center justify-content-center rounded" style={{ minHeight: '70px', border: '2px dashed #e5e7eb', background: '#f9fafb' }}>
                        <div className="fw-bold mb-2 text-muted" style={{ fontSize: '0.75rem' }}>Dokumen belum diunggah</div>
                        <button type="button" className="btn-modern btn-modern-outline shadow-sm bg-white" onClick={(e) => {
                            e.preventDefault();
                            Swal.fire({
                                title: 'Kirim Pengingat?',
                                text: `Anda akan mengirimkan notifikasi pengingat ke cabang untuk mengunggah ${label}.`,
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonText: 'Ya, Kirim',
                                cancelButtonText: 'Batal',
                                confirmButtonColor: '#dc3545'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    axios.post(`/admin/verify/${perizinan.id}/remind-document`, { document_name: label })
                                        .then(response => {
                                            Swal.fire('Terkirim!', 'Notifikasi pengingat berhasil dikirim ke cabang.', 'success');
                                        })
                                        .catch(error => {
                                            Swal.fire('Gagal!', 'Terjadi kesalahan saat mengirim pengingat.', 'error');
                                        });
                                }
                            });
                        }}>
                            <i className="fas fa-bell me-1 text-warning"></i> Kirim Pengingat
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentStatus = docStatus[num];
    const cardClass = currentStatus === 'revisi' ? 'is-revisi' : (currentStatus === 'sesuai' ? 'is-sesuai' : '');

    return (
        <div className="col-md-6 mb-4">
            <div className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label-custom mb-0">{label} <span className="text-danger">*</span></label>
                    {isApproved && (
                        <span className="badge bg-success rounded-pill px-3 shadow-sm"><i className="fas fa-check-circle me-1"></i> Sesuai</span>
                    )}
                </div>
                
                <div className="d-flex align-items-center gap-2 mb-2">
                    <button 
                        type="button" 
                        onClick={() => onPreview && onPreview({
                            url: `/storage/${fileUrl}`,
                            title: label,
                            ext: fileUrl.split('.').pop().toLowerCase()
                        })}
                        className="btn-modern btn-modern-primary flex-grow-1 text-center text-decoration-none shadow-sm py-2 d-flex align-items-center justify-content-center gap-1.5"
                    >
                        <i className="fas fa-eye me-1"></i> Lihat Dokumen
                    </button>

                    {oldFiles[fieldName] && (
                        <button 
                            type="button" 
                            onClick={() => onPreview && onPreview({
                                url: `/storage/${oldFiles[fieldName]}`,
                                title: `${label} (File Lama)`,
                                ext: oldFiles[fieldName].split('.').pop().toLowerCase()
                            })}
                            className="btn-modern shadow-sm py-2 px-3 d-flex align-items-center justify-content-center gap-1.5"
                            style={{ flexGrow: 0, whiteSpace: 'nowrap', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309', borderRadius: '12px', fontWeight: '600' }}
                            title="Lihat file versi sebelumnya"
                        >
                            <i className="fas fa-history"></i> File Lama
                        </button>
                    )}
                    
                    {!isApproved && (
                        <div className="status-toggle flex-grow-1 shadow-sm">
                            <input type="radio" className="btn-check" name={`doc_status[${num}]`} id={`doc_status_sesuai_${num}`} value="sesuai" checked={currentStatus === 'sesuai'} onChange={() => setDocStatus(prev => ({...prev, [num]: 'sesuai'}))} />
                            <label className="sesuai-label py-2" htmlFor={`doc_status_sesuai_${num}`}><i className="fas fa-check"></i> Sesuai</label>
                            
                            <input type="radio" className="btn-check" name={`doc_status[${num}]`} id={`doc_status_revisi_${num}`} value="revisi" checked={currentStatus === 'revisi'} onChange={() => setDocStatus(prev => ({...prev, [num]: 'revisi'}))} />
                            <label className="revisi-label py-2" htmlFor={`doc_status_revisi_${num}`}><i className="fas fa-times"></i> Revisi</label>
                        </div>
                    )}
                </div>

                {currentStatus === 'revisi' && (
                    <div className="mb-2">
                        <textarea 
                            className="form-control text-danger bg-white shadow-sm" 
                            style={{ borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '0.8rem' }}
                            rows="2" 
                            placeholder="Tulis catatan revisi untuk dokumen ini..."
                            value={docNotes[num] || ''}
                            onChange={(e) => setDocNotes(prev => ({...prev, [num]: e.target.value}))}
                        ></textarea>
                    </div>
                )}


            </div>
        </div>
    );
};

export default function Verify() {
    const { perizinan, flash, errors } = usePage().props;
    const isApproved = perizinan.status === 'approved' || perizinan.status === 'completed' || perizinan.status === 'terbit_verifikasi';
    const isRevisiMode = perizinan.status === 'needs_revision';
    
    // Modal preview state
    const [previewDoc, setPreviewDoc] = useState(null);

    // Initial State parsing
    const initialDocStatus = perizinan.status_dokumen ? (typeof perizinan.status_dokumen === 'string' ? JSON.parse(perizinan.status_dokumen) : perizinan.status_dokumen) : {};
    const initialDocNotes = perizinan.catatan_dokumen ? (typeof perizinan.catatan_dokumen === 'string' ? JSON.parse(perizinan.catatan_dokumen) : perizinan.catatan_dokumen) : {};
    
    const [docStatus, setDocStatus] = useState(() => {
        if (perizinan.status !== 'needs_revision') {
            const status = {};
            for (let i = 1; i <= 16; i++) {
                status[i] = 'sesuai';
            }
            status['bagian2'] = 'sesuai';
            status['bagian3'] = 'sesuai';
            return status;
        }

        const status = { ...initialDocStatus };
        delete status.revisi_fields;

        for (let i = 1; i <= 16; i++) {
            if (!status[i]) status[i] = 'sesuai';
        }
        if (!status['bagian2']) status['bagian2'] = 'sesuai';
        if (!status['bagian3']) status['bagian3'] = 'sesuai';
        return status;
    });

    const [docNotes, setDocNotes] = useState(initialDocNotes);
    
    const [revisiFields, setRevisiFields] = useState(() => {
        if (perizinan.status !== 'needs_revision') {
            return { bagian2: [], bagian3: [] };
        }
        return initialDocStatus.revisi_fields || { bagian2: [], bagian3: [] };
    });

    const [catatanKemenkes, setCatatanKemenkes] = useState(perizinan.catatan_kemenkes || '');
    const [nku, setNku] = useState(perizinan.nku || '');
    const [isSavingNku, setIsSavingNku] = useState(false);

    const [status, setStatus] = useState(perizinan.status === 'needs_revision' || perizinan.status === 'terbit_verifikasi' ? perizinan.status : '');

    const handleSaveNku = () => {
        setIsSavingNku(true);
        router.post(`/admin/update-nku/${perizinan.id}`, {
            _method: 'POST',
            nku: nku
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingNku(false);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'NKU berhasil disimpan',
                    showConfirmButton: false,
                    timer: 3000
                });
            },
            onError: () => {
                setIsSavingNku(false);
                Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan NKU', 'error');
            }
        });
    };

    const handleCheckboxChange = (bagian, field) => {
        setRevisiFields(prev => {
            const currentFields = prev[bagian] || [];
            if (currentFields.includes(field)) {
                return { ...prev, [bagian]: currentFields.filter(f => f !== field) };
            } else {
                return { ...prev, [bagian]: [...currentFields, field] };
            }
        });
    };

    const checkAllDocsStatus = () => {
        const hasRevisi = Object.values(docStatus).some(status => status === 'revisi');
        if (hasRevisi && status !== 'needs_revision') {
            setStatus('needs_revision');
        }
    };

    useEffect(() => {
        checkAllDocsStatus();
    }, [docStatus]);

    useEffect(() => {
        if (previewDoc) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && previewDoc) {
                setPreviewDoc(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [previewDoc]);

    const submitForm = (e) => {
        e.preventDefault();
        
        if (!status) {
            Swal.fire('Peringatan', 'Silakan pilih Keputusan Akhir Verifikasi.', 'warning');
            return;
        }

        if (status === 'needs_revision') {
            if (docStatus.bagian2 === 'revisi' && (!revisiFields.bagian2 || revisiFields.bagian2.length === 0)) {
                Swal.fire('Validasi Gagal', 'Anda memilih "Revisi" untuk Bagian 2, tapi tidak ada kolom yang dicentang.', 'error');
                return;
            }
            if (docStatus.bagian3 === 'revisi' && (!revisiFields.bagian3 || revisiFields.bagian3.length === 0)) {
                Swal.fire('Validasi Gagal', 'Anda memilih "Revisi" untuk Bagian 3, tapi tidak ada kolom yang dicentang.', 'error');
                return;
            }
        } else {
            const hasRevisi = Object.values(docStatus).some(s => s === 'revisi');
            if (hasRevisi) {
                Swal.fire('Peringatan', 'Masih ada dokumen yang ditandai "Revisi" (berwarna merah). Silakan ubah statusnya menjadi "Sesuai" terlebih dahulu sebelum memproses persetujuan.', 'warning');
                return;
            }
        }

        router.post(`/admin/update/${perizinan.id}`, {
            _method: 'POST',
            status: status,
            doc_status: docStatus,
            doc_notes: docNotes,
            revisi_fields: revisiFields,
        }, {
            preserveScroll: true,
            onError: (errors) => {
                const errorMessages = Object.values(errors).join('\n');
                Swal.fire('Validasi Gagal', errorMessages, 'error');
            }
        });
    };

    const formatNumber = (num) => {
        if (!num) return '';
        return parseInt(num).toLocaleString('id-ID');
    };

    const isInternal = perizinan.status === 'verifikasi_internal';

    return (
        <AdminLayout title="Verifikasi Perizinan - KFA" pageTitle="Verifikasi Pengajuan" pageSubtitle="Pemeriksaan Dokumen & Persetujuan SIA">
            <style>{`
                .gform-card { background: #ffffff; border-radius: 8px; border: 1px solid #eaeaea; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); margin-bottom: 16px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .gform-card:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }
                .gform-card-header { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; background-color: #ffffff; border-radius: 8px 8px 0 0; }
                .gform-section-title { font-size: 1rem; font-weight: 700; color: #111827; margin-bottom: 2px; letter-spacing: -0.3px; }
                .gform-section-desc { font-size: 0.8rem; color: #6b7280; margin-bottom: 0; }
                .gform-body { padding: 16px; }
                .form-label-custom { font-weight: 600; color: #374151; font-size: 0.8rem; margin-bottom: 4px; letter-spacing: -0.2px; }
                .input-group-text-custom { background-color: #f9fafb; border-color: #e5e7eb; color: #4b5563; font-weight: 600; font-size: 0.85rem; padding: 4px 8px; }
                .form-control, .form-select { font-size: 0.85rem; padding: 4px 8px; }
                
                .file-review-card { 
                    /* No longer used as wrapper, keep for fallback if needed */
                }
                
                /* Modern sleek buttons */
                .btn-modern {
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 0.75rem;
                    padding: 4px 10px;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .btn-modern-outline {
                    background: transparent;
                    border-color: #e5e7eb;
                    color: #4b5563;
                }
                .btn-modern-outline:hover {
                    background: #f9fafb;
                    border-color: #d1d5db;
                }
                .btn-modern-primary {
                    background: #2563eb;
                    color: white;
                    border: 1px solid #1d4ed8;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .btn-modern-primary:hover {
                    background: #1d4ed8;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.32);
                }
                .btn-modern-primary:hover i {
                    transform: scale(1.18);
                }
                .btn-modern-primary:active {
                    transform: translateY(0) scale(0.97);
                }

                /* Animated Download ZIP button */
                .btn-zip-download-hq {
                    background: #ffffff;
                    color: #2563eb !important;
                    border: 1.5px solid #2563eb;
                    border-radius: 50px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    padding: 8px 22px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none !important;
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    cursor: pointer;
                }
                .btn-zip-download-hq i {
                    color: #2563eb;
                    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.25s ease;
                }
                .btn-zip-download-hq:hover {
                    background: #2563eb;
                    color: #ffffff !important;
                    border-color: #1d4ed8;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 22px rgba(37, 99, 235, 0.32);
                }
                .btn-zip-download-hq:hover i {
                    transform: translateY(-1px) scale(1.2);
                    color: #ffffff !important;
                }
                .btn-zip-download-hq:active {
                    transform: translateY(0) scale(0.97);
                    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.18);
                }
                
                /* Custom segmented control for radio */
                .status-toggle {
                    display: flex;
                    background: #f3f4f6;
                    border-radius: 6px;
                    padding: 2px;
                    gap: 2px;
                }
                .status-toggle .btn-check + label {
                    flex: 1;
                    text-align: center;
                    border-radius: 4px;
                    border: none;
                    font-weight: 600;
                    font-size: 0.75rem;
                    color: #6b7280;
                    padding: 4px 8px;
                    transition: all 0.2s;
                    cursor: pointer;
                    background: transparent;
                    margin: 0;
                }
                .status-toggle .btn-check:checked + label.sesuai-label {
                    background: #ffffff;
                    color: #059669;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .status-toggle .btn-check:checked + label.revisi-label {
                    background: #ffffff;
                    color: #dc2626;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .status-toggle .btn-check:hover:not(:checked) + label {
                    color: #374151;
                }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 style={{ color: 'var(--hq-navy)', fontWeight: 800, letterSpacing: '-0.5px' }}>Verifikasi Perizinan</h2>
                    <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>{perizinan.nama_apotek} &middot; {perizinan.user?.name} ({perizinan.user?.kode_sap})</p>
                </div>
                <div className="d-flex gap-2">
                    <a href={`/admin/verify/${perizinan.id}/download-all`} className="btn-zip-download-hq">
                        <i className="fas fa-file-archive"></i>
                        <span>Unduh Semua Berkas (ZIP)</span>
                    </a>
                </div>
            </div>

            <div className="gform-card" style={{ borderTop: '8px solid var(--hq-navy)' }}>
                <div className="gform-card-header">
                    <h3 className="fw-bold mb-1" style={{ color: 'var(--hq-navy)' }}>Data Utama Pengajuan</h3>
                </div>
                <div className="gform-body bg-light bg-opacity-50">
                    <div className="row gx-3 gy-2">
                        <div className="col-md-4 d-flex flex-column">
                            <label className="form-label-custom">Jenis Perizinan</label>
                            <input type="text" readOnly className="form-control bg-white shadow-sm" value={perizinan.jenis_perizinan} />
                        </div>
                        <div className="col-md-4 d-flex flex-column">
                            <label className="form-label-custom">Nama Cabang / Unit Bisnis</label>
                            <input type="text" readOnly className="form-control bg-white shadow-sm" value={perizinan.nama_apotek} />
                        </div>
                        <div className="col-md-4 d-flex flex-column">
                            <label className="form-label-custom">Nomor Kegiatan Usaha (NKU)</label>
                            <div className="d-flex gap-2">
                                <input 
                                    type="text" 
                                    className="form-control bg-white shadow-sm" 
                                    value={nku} 
                                    onChange={(e) => setNku(e.target.value)} 
                                    placeholder="Masukkan NKU..."
                                />
                                <button type="button" onClick={handleSaveNku} className="btn-modern-primary" style={{ whiteSpace: 'nowrap' }} disabled={isSavingNku}>
                                    {isSavingNku ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {Object.keys(initialDocNotes).length > 0 && (
                <div className="alert shadow-sm mb-4 p-3" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b' }}>
                    <h6 className="alert-heading fw-bold mb-2" style={{ color: '#b45309' }}><i className="fas fa-history me-1"></i> Riwayat Revisi Sebelumnya</h6>
                    
                    <ul className="mb-0" style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', color: '#b45309' }}>
                        {Object.entries(initialDocNotes).map(([key, note]) => {
                            if (!note) return null;
                            
                            let label = '';
                            let fieldsStr = '';
                            let hasOldValue = false;
                            const oldFilesParsed = perizinan.old_files ? JSON.parse(perizinan.old_files) : {};
                            
                            let revisiFieldsList = [];
                            if (initialDocStatus && initialDocStatus.revisi_fields) {
                                if (Array.isArray(initialDocStatus.revisi_fields)) {
                                    revisiFieldsList = initialDocStatus.revisi_fields;
                                } else if (typeof initialDocStatus.revisi_fields === 'object') {
                                    Object.values(initialDocStatus.revisi_fields).forEach(arr => {
                                        if (Array.isArray(arr)) revisiFieldsList = revisiFieldsList.concat(arr);
                                    });
                                }
                            }
                            
                            if (key === 'bagian2') {
                                label = 'Bagian 2 (Alamat & Tata Ruang)';
                                if (revisiFieldsList.length > 0) {
                                    const b2Fields = revisiFieldsList.filter(f => ['nama_rencana_usaha', 'kode_pos', 'luas_lahan', 'alamat_lengkap', 'lokasi_alamat_lengkap', 'deskripsi_kegiatan', 'deskripsi_lokasi'].includes(f));
                                    if (b2Fields.length > 0) {
                                        fieldsStr = b2Fields.map(f => `${f.replace(/_/g, ' ').toUpperCase()}:::${oldFilesParsed[f] || '(Kosong)'}`).join('|||');
                                    }
                                }
                            } else if (key === 'bagian3') {
                                label = 'Bagian 3 (Finansial & SDM)';
                                if (revisiFieldsList.length > 0) {
                                    const b3Fields = revisiFieldsList.filter(f => ['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja', 'omzet_pertahun', 'sdm_laki', 'sdm_perempuan', 'sdm_tka'].includes(f));
                                    if (b3Fields.length > 0) {
                                        fieldsStr = b3Fields.map(f => {
                                            let val = oldFilesParsed[f];
                                            if (['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja', 'omzet_pertahun'].includes(f)) {
                                                val = val ? 'Rp ' + Number(val).toLocaleString('id-ID') : '(Kosong)';
                                            } else {
                                                val = val ? val + ' Orang' : '(Kosong)';
                                            }
                                            return `${f.replace(/_/g, ' ').toUpperCase()}:::${val}`;
                                        }).join('|||');
                                    }
                                }
                            } else {
                                const fileLabels = {
                                    '1': 'SIA Terakhir', '2': 'SIPA Terbaru', '3': 'Akta Sewa', '4': 'RTB/RIK', '5': 'Izin Lokasi OSS', '12': 'Sertifikat Tanah & IMB',
                                    '6': 'Polygon Lahan', '13': 'Kesesuaian Tata Ruang', '14': 'Peta Lokasi', '15': 'SHP Tapak Proyek',
                                    '7': 'Dokumen Administrasi', '8': 'Dokumen Lokasi', '9': 'Dokumen Bangunan', '10': 'Dokumen Sarana & Prasarana', '11': 'Dokumen SDM (STR, SIPA)', '16': 'BAP'
                                };
                                label = fileLabels[key] || 'File ' + key;
                                hasOldValue = !!oldFilesParsed['file_' + key];
                            }

                            return (
                                <li key={key} className="mb-2 pb-2 border-bottom border-warning border-opacity-25 text-dark" style={{ '&:last-child': { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } }}>
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <strong style={{ color: '#9a3412', fontSize: '0.9rem' }}>
                                            <i className="fas fa-file-alt me-2 opacity-75"></i>{label}
                                        </strong>
                                        {/* File Lama button removed from here, now in form directly */}
                                    </div>
                                    <div className="ps-4">
                                        <div className="mb-1" style={{ fontSize: '0.85rem' }}>
                                            <span className="fw-bold text-warning-emphasis me-1">Catatan:</span>
                                            <span className="fst-italic text-dark">{note}</span>
                                        </div>
                                        {/* Data Lama removed */}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <div className="gform-card">
                <div className="gform-card-header">
                    <h4 className="gform-section-title">Bagian 1: Persyaratan Dasar</h4>
                </div>
                <div className="gform-body">
                    <div className="row">
                        <FileReviewCard num="1" label="SIA Terakhir" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="2" label="SIPA Terbaru yang Masih Berlaku" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="3" label="Akta Perjanjian Sewa" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="4" label="Rencana Teknis Bangunan (RTB/RIK)" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="5" label="Izin Lokasi yang Diterbitkan OSS" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="12" label="Sertifikat Tanah dan IMB" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                    </div>
                </div>
            </div>

            {/* BAGIAN 2: ALAMAT */}
            <div className={`gform-card ${docStatus.bagian2 === 'revisi' ? 'border border-danger border-2' : ''}`}>
                <div className="gform-card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="gform-section-title">Bagian 2: Alamat, Geografis Lahan & Tata Ruang</h4>
                        <p className="gform-section-desc">Pemeriksaan isian alamat dan berkas lokasi.</p>
                    </div>
                    {!isApproved && (
                        <div className="status-toggle" style={{ minWidth: '180px' }}>
                            <input type="radio" className="btn-check" name="doc_status[bagian2]" id="status_bagian2_sesuai" value="sesuai" checked={docStatus.bagian2 === 'sesuai'} onChange={() => setDocStatus(prev => ({...prev, bagian2: 'sesuai'}))} />
                            <label className="sesuai-label" htmlFor="status_bagian2_sesuai">Sesuai</label>
                            
                            <input type="radio" className="btn-check" name="doc_status[bagian2]" id="status_bagian2_revisi" value="revisi" checked={docStatus.bagian2 === 'revisi'} onChange={() => setDocStatus(prev => ({...prev, bagian2: 'revisi'}))} />
                            <label className="revisi-label" htmlFor="status_bagian2_revisi">Revisi Isian</label>
                        </div>
                    )}
                </div>
                
                {docStatus.bagian2 === 'revisi' && (
                    <div className="bg-danger bg-opacity-10 p-2 border-bottom">
                        <label className="fw-bold text-danger mb-1" style={{fontSize: '0.8rem'}}>Centang isian yang salah:</label>
                        <div className="d-flex flex-wrap gap-2 mb-1">
                            {['nama_rencana_usaha', 'kode_pos', 'luas_lahan', 'alamat_lengkap', 'lokasi_alamat_lengkap', 'deskripsi_kegiatan', 'deskripsi_lokasi'].map(field => (
                                <div className="form-check" key={field}>
                                    <input className="form-check-input border-danger" type="checkbox" id={`rev_${field}`} checked={(revisiFields.bagian2 || []).includes(field)} onChange={() => handleCheckboxChange('bagian2', field)} />
                                    <label className="form-check-label text-danger small" htmlFor={`rev_${field}`}>{field.replace(/_/g, ' ').toUpperCase()}</label>
                                </div>
                            ))}
                        </div>
                        <textarea className="form-control form-control-sm border-danger text-danger bg-white" rows="2" placeholder="Tulis instruksi revisi untuk Bagian 2..." value={docNotes.bagian2 || ''} onChange={e => setDocNotes(prev => ({...prev, bagian2: e.target.value}))}></textarea>
                    </div>
                )}

                <div className="gform-body">
                    <div className="row gx-3 gy-2 mb-4">
                        <div className="col-md-6">
                            <label className="form-label-custom">Nama Rencana Usaha / Kegiatan</label>
                            <input type="text" readOnly className={`form-control bg-light ${docStatus.bagian2 === 'revisi' && revisiFields.bagian2?.includes('nama_rencana_usaha') ? 'border-danger' : ''}`} value={perizinan.nama_rencana_usaha || ''} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label-custom">Kode Pos</label>
                            <input type="text" readOnly className={`form-control bg-light ${docStatus.bagian2 === 'revisi' && revisiFields.bagian2?.includes('kode_pos') ? 'border-danger' : ''}`} value={perizinan.kode_pos || ''} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label-custom">Luas Lahan</label>
                            <div className="input-group">
                                <input type="text" readOnly className={`form-control bg-light ${docStatus.bagian2 === 'revisi' && revisiFields.bagian2?.includes('luas_lahan') ? 'border-danger' : ''}`} value={perizinan.luas_lahan || ''} />
                                <span className="input-group-text input-group-text-custom">m²</span>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label-custom">Alamat Lengkap Apotek</label>
                            <textarea readOnly style={{ resize: 'none' }} className={`form-control bg-light ${docStatus.bagian2 === 'revisi' && revisiFields.bagian2?.includes('alamat_lengkap') ? 'border-danger' : ''}`} rows="2" value={perizinan.alamat_lengkap || ''}></textarea>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-custom">Rincian Alamat Lokasi Kegiatan</label>
                            <textarea readOnly style={{ resize: 'none' }} className={`form-control bg-light ${docStatus.bagian2 === 'revisi' && revisiFields.bagian2?.includes('lokasi_alamat_lengkap') ? 'border-danger' : ''}`} rows="2" value={perizinan.lokasi_alamat_lengkap || ''}></textarea>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label-custom">Deskripsi Kegiatan Usaha</label>
                            <textarea readOnly style={{ resize: 'none' }} className={`form-control bg-light ${docStatus.bagian2 === 'revisi' && revisiFields.bagian2?.includes('deskripsi_kegiatan') ? 'border-danger' : ''}`} rows="2" value={perizinan.deskripsi_kegiatan || ''}></textarea>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label-custom">Deskripsi Kondisi Lokasi</label>
                            <textarea readOnly style={{ resize: 'none' }} className={`form-control bg-light ${docStatus.bagian2 === 'revisi' && revisiFields.bagian2?.includes('deskripsi_lokasi') ? 'border-danger' : ''}`} rows="2" value={perizinan.deskripsi_lokasi || ''}></textarea>
                        </div>
                    </div>
                    
                    <div className="row">
                        <FileReviewCard num="6" label="Peta Polygon Lahan" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="13" label="Data Kesesuaian Tata Ruang" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="14" label="Peta Lokasi" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="15" label="SHP Peta Tapak Proyek" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                    </div>
                </div>
            </div>

            {/* BAGIAN 3: FINANSIAL */}
            <div className={`gform-card ${docStatus.bagian3 === 'revisi' ? 'border border-danger border-2' : ''}`}>
                <div className="gform-card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="gform-section-title">Bagian 3: Finansial, Investasi & SDM</h4>
                        <p className="gform-section-desc">Pemeriksaan isian nilai finansial dan data SDM.</p>
                    </div>
                    {!isApproved && (
                        <div className="status-toggle" style={{ minWidth: '180px' }}>
                            <input type="radio" className="btn-check" name="doc_status[bagian3]" id="status_bagian3_sesuai" value="sesuai" checked={docStatus.bagian3 === 'sesuai'} onChange={() => setDocStatus(prev => ({...prev, bagian3: 'sesuai'}))} />
                            <label className="sesuai-label" htmlFor="status_bagian3_sesuai">Sesuai</label>
                            
                            <input type="radio" className="btn-check" name="doc_status[bagian3]" id="status_bagian3_revisi" value="revisi" checked={docStatus.bagian3 === 'revisi'} onChange={() => setDocStatus(prev => ({...prev, bagian3: 'revisi'}))} />
                            <label className="revisi-label" htmlFor="status_bagian3_revisi">Revisi Isian</label>
                        </div>
                    )}
                </div>

                {docStatus.bagian3 === 'revisi' && (
                    <div className="bg-danger bg-opacity-10 p-2 border-bottom">
                        <label className="fw-bold text-danger mb-1" style={{fontSize: '0.8rem'}}>Centang isian yang salah:</label>
                        <div className="d-flex flex-wrap gap-2 mb-1">
                            {['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja', 'omzet_pertahun', 'sdm_laki', 'sdm_perempuan', 'sdm_tka'].map(field => (
                                <div className="form-check" key={field}>
                                    <input className="form-check-input border-danger" type="checkbox" id={`rev_${field}`} checked={(revisiFields.bagian3 || []).includes(field)} onChange={() => handleCheckboxChange('bagian3', field)} />
                                    <label className="form-check-label text-danger small" htmlFor={`rev_${field}`}>{field.replace(/_/g, ' ').toUpperCase()}</label>
                                </div>
                            ))}
                        </div>
                        <textarea className="form-control form-control-sm border-danger text-danger bg-white" rows="2" placeholder="Tulis instruksi revisi untuk Bagian 3..." value={docNotes.bagian3 || ''} onChange={e => setDocNotes(prev => ({...prev, bagian3: e.target.value}))}></textarea>
                    </div>
                )}

                <div className="gform-body">
                    <div className="row gx-3 gy-2">
                        {['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja'].map(field => (
                            <div className="col-md-6" key={field}>
                                <label className="form-label-custom">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                                <div className="input-group">
                                    <span className="input-group-text input-group-text-custom">Rp</span>
                                    <input type="text" readOnly className={`form-control bg-light ${docStatus.bagian3 === 'revisi' && revisiFields.bagian3?.includes(field) ? 'border-danger' : ''}`} value={formatNumber(perizinan[field])} />
                                </div>
                            </div>
                        ))}
                        
                        <div className="col-md-12 mt-3">
                            <label className="form-label-custom">Nilai Kapasitas / Omzet per Tahun</label>
                            <div className="input-group">
                                <span className="input-group-text input-group-text-custom">Rp</span>
                                <input type="text" readOnly className={`form-control bg-light ${docStatus.bagian3 === 'revisi' && revisiFields.bagian3?.includes('omzet_pertahun') ? 'border-danger' : ''}`} value={formatNumber(perizinan.omzet_pertahun)} />
                            </div>
                        </div>

                        <div className="col-md-12 mt-4">
                            <label className="form-label-custom mb-2">Jumlah Personel SDM Apotek</label>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className={`p-3 rounded border text-center ${docStatus.bagian3 === 'revisi' && revisiFields.bagian3?.includes('sdm_laki') ? 'bg-danger bg-opacity-10 border-danger' : 'bg-light'}`}>
                                        <i className="fas fa-male fa-2x text-primary mb-2"></i>
                                        <label className="d-block small fw-bold text-dark mb-1">Laki-laki</label>
                                        <div className="fs-5 fw-bold">{perizinan.sdm_laki || 0} Orang</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className={`p-3 rounded border text-center ${docStatus.bagian3 === 'revisi' && revisiFields.bagian3?.includes('sdm_perempuan') ? 'bg-danger bg-opacity-10 border-danger' : 'bg-light'}`}>
                                        <i className="fas fa-female fa-2x text-danger mb-2"></i>
                                        <label className="d-block small fw-bold text-dark mb-1">Perempuan</label>
                                        <div className="fs-5 fw-bold">{perizinan.sdm_perempuan || 0} Orang</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className={`p-3 rounded border text-center ${docStatus.bagian3 === 'revisi' && revisiFields.bagian3?.includes('sdm_tka') ? 'bg-danger bg-opacity-10 border-danger' : 'bg-light'}`}>
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

            {/* BAGIAN 4 */}
            <div className="gform-card">
                <div className="gform-card-header">
                    <h4 className="gform-section-title">Bagian 4: Persyaratan Umum</h4>
                </div>
                <div className="gform-body">
                    <div className="row">
                        <FileReviewCard num="7" label="Dokumen Administrasi" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="8" label="Dokumen Lokasi" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="9" label="Dokumen Bangunan" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="10" label="Dokumen Sarana & Prasarana" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        <FileReviewCard num="11" label="Dokumen SDM (STR, KTP, SIPA, dll)" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                    </div>
                </div>
            </div>

            {/* BAGIAN 5 */}
            {!isApproved && (
                <div className="gform-card" style={{ borderTop: '4px solid var(--kfa-orange)' }}>
                    <div className="gform-card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                        <h5 className="mb-1 fw-bold" style={{ color: 'var(--kfa-navy)' }}>Bagian 5: Berita Acara Pemeriksaan (BAP)</h5>
                        <p className="text-muted small mb-0">Dokumen BAP (jika ada / menyusul). Anda dapat mengirimkan notifikasi pengingat ke cabang jika BAP belum diunggah.</p>
                    </div>
                    <div className="gform-body px-4 pb-4">
                        <div className="row gx-3 gy-2">
                            <FileReviewCard num="16" label="Dokumen Berita Acara Pemeriksaan (BAP)" perizinan={perizinan} docStatus={docStatus} setDocStatus={setDocStatus} docNotes={docNotes} setDocNotes={setDocNotes} onPreview={setPreviewDoc} />
                        </div>
                    </div>
                </div>
            )}

            {/* BAGIAN KEPUTUSAN */}
            {!isApproved ? (
                <form onSubmit={submitForm}>
                    <div className="card border-0 mb-5 mt-4" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div className="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                            <h5 className="mb-0 fw-bold" style={{ color: 'var(--primary-navy)' }}>Keputusan Verifikasi Berkas</h5>
                        </div>
                        <div className="card-body px-4 pb-4">
                            <div className="mb-3">
                                <label htmlFor="status" className="form-label fw-bold">Keputusan Akhir Verifikasi</label>
                                <select 
                                    id="status" 
                                    name="status" 
                                    className="form-select" 
                                    required 
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                >
                                    <option value="">-- Pilih Keputusan --</option>
                                    <option value="needs_revision">Revisi</option>
                                    <option value="verifikasi_internal" disabled={Object.values(docStatus).some(s => s === 'revisi')}>
                                        Verifikasi Internal {Object.values(docStatus).some(s => s === 'revisi') ? '(Terkunci: Ada Dokumen Revisi)' : ''}
                                    </option>
                                    <option value="verifikator_kemenkes" disabled={Object.values(docStatus).some(s => s === 'revisi')}>
                                        Verifikator Kemenkes {Object.values(docStatus).some(s => s === 'revisi') ? '(Terkunci: Ada Dokumen Revisi)' : ''}
                                    </option>
                                    <option value="persetujuan_kl" disabled={Object.values(docStatus).some(s => s === 'revisi')}>
                                        Proses Tahap Persetujuan KL {Object.values(docStatus).some(s => s === 'revisi') ? '(Terkunci: Ada Dokumen Revisi)' : ''}
                                    </option>
                                    <option value="terbit_verifikasi" disabled={Object.values(docStatus).some(s => s === 'revisi')}>
                                        Terbit Verifikasi {Object.values(docStatus).some(s => s === 'revisi') ? '(Terkunci: Ada Dokumen Revisi)' : ''}
                                    </option>
                                </select>
                            </div>

                            {/* Catatan Revisi Umum Removed */}                            <button type="submit" className="btn text-white btn-lg rounded-pill px-5 shadow-sm mt-2" style={{ backgroundColor: 'var(--kfa-orange)' }}>
                                <i className="fas fa-paper-plane me-2"></i> Kirim Keputusan Verifikasi
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="card border-0 mb-5 mt-4" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div className="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                        <h5 className="mb-0 fw-bold text-success">Pengajuan Selesai</h5>
                    </div>
                    <div className="card-body px-4 pb-4">
                        <p className="mb-0 text-success fw-bold">Pengajuan ini telah selesai diproses dan verifikasi telah terbit. Data telah dikunci.</p>
                    </div>
                </div>
            )}
            {/* MODAL PRATINJAU DOKUMEN (PORTAL TO BODY) */}
            {previewDoc && typeof document !== 'undefined' && createPortal(
                <div 
                    tabIndex="-1" 
                    style={{ 
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        boxSizing: 'border-box'
                    }}
                    onClick={() => setPreviewDoc(null)}
                >
                    <div 
                        style={{ 
                            width: '92vw',
                            maxWidth: '1050px',
                            height: '86vh',
                            maxHeight: '820px',
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div 
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#ffffff',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexShrink: 0
                            }}
                        >
                            <div className="d-flex align-items-center gap-2 overflow-hidden me-3">
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    <i className="fas fa-file-alt me-1"></i> {previewDoc.ext?.toUpperCase() || 'DOKUMEN'}
                                </span>
                                <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>
                                    {previewDoc.title}
                                </h6>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <a
                                    href={previewDoc.url}
                                    download
                                    className="btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
                                    style={{ borderRadius: '6px', fontSize: '0.8rem' }}
                                >
                                    <i className="fas fa-download"></i> Unduh File
                                </a>
                                <a
                                    href={previewDoc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline-secondary fw-semibold d-inline-flex align-items-center gap-1.5 px-3 py-1.5"
                                    style={{ borderRadius: '6px', fontSize: '0.8rem' }}
                                    title="Buka di tab browser baru"
                                >
                                    <i className="fas fa-external-link-alt"></i> Tab Baru
                                </a>
                                <button
                                    type="button"
                                    className="btn-close ms-2"
                                    onClick={() => setPreviewDoc(null)}
                                    aria-label="Close"
                                ></button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div 
                            style={{
                                flex: 1,
                                minHeight: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            {['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(previewDoc.ext) ? (
                                <div className="p-3 text-center w-100 h-100 d-flex align-items-center justify-content-center overflow-auto bg-dark">
                                    <img
                                        src={previewDoc.url}
                                        alt={previewDoc.title}
                                        className="img-fluid rounded shadow"
                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                            ) : previewDoc.ext === 'pdf' ? (
                                <iframe
                                    src={`${previewDoc.url}#toolbar=1`}
                                    title={previewDoc.title}
                                    style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff' }}
                                />
                            ) : ['doc', 'docx'].includes(previewDoc.ext) ? (
                                <div className="text-center p-5 bg-white rounded-3 shadow-sm m-4" style={{ maxWidth: '500px' }}>
                                    <i className="fas fa-file-word fa-4x text-primary mb-3"></i>
                                    <h5 className="fw-bold text-dark mb-1">{previewDoc.title}</h5>
                                    <p className="text-muted small mb-4">
                                        Format Word tidak dapat dipratinjau langsung di browser. Silakan unduh untuk memeriksa berkas.
                                    </p>
                                    <a href={previewDoc.url} download className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                                        <i className="fas fa-download me-1"></i> Unduh / Buka Dokumen Word
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center p-5 bg-white rounded-3 shadow-sm m-4" style={{ maxWidth: '500px' }}>
                                    <i className="fas fa-file-archive fa-4x text-warning mb-3"></i>
                                    <h5 className="fw-bold text-dark mb-1">{previewDoc.title}</h5>
                                    <p className="text-muted small mb-4">
                                        Format arsip (.{previewDoc.ext?.toUpperCase()}) tidak dapat dipratinjau langsung.
                                    </p>
                                    <a href={previewDoc.url} download className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm text-dark">
                                        <i className="fas fa-download me-1"></i> Unduh Berkas
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div 
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#ffffff',
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexShrink: 0
                            }}
                        >
                            <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                                <i className="fas fa-info-circle me-1 text-primary"></i>
                                Tekan tombol <kbd className="bg-secondary text-white px-1.5 py-0.5 rounded" style={{ fontSize: '0.72rem' }}>ESC</kbd> atau klik di luar untuk menutup
                            </small>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm rounded-pill px-4 fw-semibold"
                                onClick={() => setPreviewDoc(null)}
                            >
                                Tutup Pratinjau
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </AdminLayout>
    );
}
