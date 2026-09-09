import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import CabangLayout from '../../Layouts/CabangLayout';
import Swal from 'sweetalert2';

export default function ShowEdit({ perizinan }) {
    const { auth, flash, errors: pageErrors } = usePage().props;
    const isCabang = auth.user.role === 'cabang';

    // Parse status dokumen if available
    let statusDokumen = {};
    let catatanDokumen = {};
    let oldFiles = {};
    let revisiFields = [];

    try {
        if (perizinan.status_dokumen) statusDokumen = JSON.parse(perizinan.status_dokumen) || {};
        if (perizinan.catatan_dokumen) catatanDokumen = JSON.parse(perizinan.catatan_dokumen) || {};
        if (perizinan.old_files) oldFiles = JSON.parse(perizinan.old_files) || {};

        if (statusDokumen.revisi_fields) {
            if (Array.isArray(statusDokumen.revisi_fields)) {
                revisiFields = statusDokumen.revisi_fields;
            } else if (typeof statusDokumen.revisi_fields === 'object') {
                Object.values(statusDokumen.revisi_fields).forEach(arr => {
                    if (Array.isArray(arr)) revisiFields = revisiFields.concat(arr);
                });
            }
        }
    } catch (e) {
        console.error('Error parsing JSON from perizinan', e);
    }

    const perizinanStatus = perizinan.status ? perizinan.status.toLowerCase() : '';
    const isLocked = ['completed', 'approved', 'verifikasi_internal', 'verifikator_kemenkes', 'persetujuan_kl', 'terbit_verifikasi'].includes(perizinanStatus);
    const isRevisiMode = perizinanStatus === 'needs_revision';

    // Check if form should be shown (in Blade it hides the main form in certain conditions)
    let showMainForm = true;
    if (isRevisiMode) {
        showMainForm = false;
        for (const [key, status] of Object.entries(statusDokumen)) {
            if (key !== '16' && status === 'revisi') {
                showMainForm = true;
                break;
            }
        }
    } else if (perizinanStatus === 'approved') {
        showMainForm = false;
    }

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        jenis_perizinan: perizinan.jenis_perizinan || '',
        tanggal_pengajuan: perizinan.tanggal_pengajuan || new Date().toISOString().split('T')[0],
        nama_apotek: perizinan.nama_apotek || `${auth.user.name} (KFA ${auth.user.unit_bisnis || ''})`,
        kode_pos: perizinan.kode_pos || '',
        luas_lahan: perizinan.luas_lahan || '',
        alamat_lengkap: perizinan.alamat_lengkap || '',
        lokasi_alamat_lengkap: perizinan.lokasi_alamat_lengkap || '',
        deskripsi_kegiatan: perizinan.deskripsi_kegiatan || '',
        deskripsi_lokasi: perizinan.deskripsi_lokasi || '',
        nama_rencana_usaha: perizinan.nama_rencana_usaha || '',
        bangunan_renovasi: perizinan.bangunan_renovasi || '',
        mesin_peralatan: perizinan.mesin_peralatan || '',
        investasi_lain: perizinan.investasi_lain || '',
        modal_kerja: perizinan.modal_kerja || '',
        omzet_pertahun: perizinan.omzet_pertahun || '',
        sdm_laki: perizinan.sdm_laki || 0,
        sdm_perempuan: perizinan.sdm_perempuan || 0,
        sdm_tka: perizinan.sdm_tka || 0,
        keterangan: perizinan.keterangan || '',
        file_1: null, file_2: null, file_3: null, file_4: null, file_5: null,
        file_6: null, file_7: null, file_8: null, file_9: null, file_10: null,
        file_11: null, file_12: null, file_13: null, file_14: null, file_15: null
    });

    const { data: bapData, setData: setBapData, post: postBap, processing: processingBap } = useForm({
        _method: 'PUT',
        submit_bap: '1',
        file_16: null
    });

    const [actionType, setActionType] = useState('draft');

    const handleBapFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire('File Terlalu Besar', 'Ukuran file BAP maksimal adalah 5 MB.', 'error');
                e.target.value = '';
                setBapData('file_16', null);
                return;
            }
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                Swal.fire('Format File Salah', 'Harap unggah file BAP dengan format PDF.', 'error');
                e.target.value = '';
                setBapData('file_16', null);
                return;
            }
            setBapData('file_16', file);
        } else {
            setBapData('file_16', null);
        }
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire('File Terlalu Besar', 'Ukuran file maksimal adalah 5 MB.', 'error');
                e.target.value = '';
                setData(field, null);
                return;
            }

            const isZipField = field === 'file_6' || field === 'file_15';
            const expectedExt = isZipField ? '.zip' : '.pdf';
            const fileName = file.name.toLowerCase();

            if (!fileName.endsWith(expectedExt)) {
                Swal.fire('Format File Salah', `Harap unggah file dengan format ${expectedExt.toUpperCase()}.`, 'error');
                e.target.value = '';
                setData(field, null);
                return;
            }

            setData(field, file);
        } else {
            setData(field, null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(`/cabang/pengajuan/${perizinan.id}?action=${actionType}`, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil!',
                    text: actionType === 'draft' ? 'Draft berhasil disimpan.' : 'Pengajuan berhasil dikirim.',
                    icon: 'success',
                    confirmButtonColor: '#F26522'
                }).then(() => {
                });
            },
            onError: (err) => {
                console.error(err);
                Swal.fire({
                    title: 'Oops!',
                    text: 'Terdapat kesalahan pada isian form. Silakan periksa kembali.',
                    icon: 'error',
                    confirmButtonColor: '#F26522'
                });
            }
        });
    };

    const handleBapSubmit = (e) => {
        e.preventDefault();
        if (!bapData.file_16 && !perizinan.file_16) {
            Swal.fire('File Kosong', 'Silakan pilih file BAP terlebih dahulu.', 'warning');
            return;
        }

        postBap(`/cabang/pengajuan/${perizinan.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'BAP berhasil diunggah.',
                    icon: 'success',
                    confirmButtonColor: '#F26522'
                });
            },
            onError: (err) => {
                console.error(err);
                Swal.fire({
                    title: 'Oops!',
                    text: 'Terjadi kesalahan saat mengunggah BAP.',
                    icon: 'error',
                    confirmButtonColor: '#F26522'
                });
            }
        });
    };

    const handleBackClick = () => {
        if (isLocked) {
            window.history.back();
            return;
        }

        Swal.fire({
            title: 'Keluar dari halaman?',
            text: 'Perubahan atau berkas yang belum disimpan akan hilang. Apakah Anda ingin menyimpan sebagai draft?',
            icon: 'warning',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '<i class="fas fa-save me-1"></i> Simpan Draft',
            denyButtonText: '<i class="fas fa-sign-out-alt me-1"></i> Keluar',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#F26522',
            denyButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
        }).then((result) => {
            if (result.isConfirmed) {
                setActionType('draft');
                setTimeout(() => {
                    post(`/cabang/pengajuan/${perizinan.id}?action=draft`, {
                        forceFormData: true,
                    });
                }, 100);
            } else if (result.isDenied) {
                window.history.back();
            }
        });
    };

    const renderInputBadge = (fieldName) => {
        if (isRevisiMode && revisiFields.includes(fieldName)) {
            return <span className="badge bg-danger ms-1" style={{ fontSize: '0.7rem' }}><i className="fas fa-exclamation-circle"></i> Wajib Direvisi</span>;
        }
        return null;
    };

    const renderOldValue = (fieldName) => {
        return null;
    };

    const isFieldHidden = (fieldName) => {
        if (!isRevisiMode) return false;
        if (fieldName === 'keterangan') return false;
        return !revisiFields.includes(fieldName);
    };

    const isSectionHidden = (sectionName) => {
        if (!isRevisiMode) return false;

        if (sectionName === 'bagian1') {
            return !['1', '2', '3', '4', '5', '12'].some(f => statusDokumen[f] === 'revisi');
        }
        if (sectionName === 'bagian2') {
            const hasFields = revisiFields.some(f => ['nama_rencana_usaha', 'kode_pos', 'luas_lahan', 'alamat_lengkap', 'lokasi_alamat_lengkap', 'deskripsi_kegiatan', 'deskripsi_lokasi'].includes(f));
            const hasFiles = ['6', '13', '14', '15'].some(f => statusDokumen[f] === 'revisi');
            return !hasFields && !hasFiles;
        }
        if (sectionName === 'bagian3') {
            const hasFields = revisiFields.some(f => ['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja', 'omzet_pertahun', 'sdm_laki', 'sdm_perempuan', 'sdm_tka'].includes(f));
            return !hasFields;
        }
        if (sectionName === 'bagian4') {
            return !['7', '8', '9', '10', '11'].some(f => statusDokumen[f] === 'revisi');
        }
        if (sectionName === 'bap') {
            return statusDokumen['16'] !== 'revisi';
        }
        return false;
    };

    const renderFileField = (id, label, accept, format) => {
        const fileIdNum = id.replace('file_', '');
        const isRevisi = statusDokumen[fileIdNum] === 'revisi';
        const isSesuai = statusDokumen[fileIdNum] === 'sesuai';

        if (isRevisiMode && isSesuai) return null; // Hide if already accepted during revision

        return (
            <div className="col-md-6">
                <label className="form-label-custom text-dark mb-1">
                    <i className="fas fa-paperclip text-secondary me-2"></i> {label} <span className="text-danger">*</span>
                </label>
                <div>
                    <div className={`file-drop-box ${data[id] ? 'has-file' : ''}`} style={{
                        borderColor: isRevisi ? '#dc3545' : '',
                        backgroundColor: isRevisi ? '#fff8f8' : '',
                        opacity: isLocked ? '0.5' : '1',
                        pointerEvents: isLocked ? 'none' : 'auto'
                    }}>
                        {isRevisi && <div className="badge bg-danger px-3 py-2" style={{ position: 'absolute', top: 0, right: 0, fontSize: '13px', zIndex: 10, borderRadius: '0 8px 0 8px' }}><i className="fas fa-times-circle me-1"></i> WAJIB DIREVISI</div>}
                        <input type="file" className="form-control bg-white shadow-sm mb-2" onChange={e => handleFileChange(e, id)} accept={accept} disabled={isLocked} />
                        <small className="text-muted d-block mt-1">Format: Khusus {format} - Maks. 5 MB</small>
                    </div>

                    {perizinan[id] && !isRevisi && (
                        <div className="mt-2 text-success small fw-bold">
                            <i className="fas fa-check-circle me-1"></i> File tersimpan:
                            <a href={`/storage/${perizinan[id].replace('public/', '')}`} target="_blank" className="text-success text-decoration-underline ms-1">Lihat File</a>
                            {!isLocked && <><br /><span className="text-muted fw-normal" style={{ fontSize: '0.8rem' }}>*Unggah file baru jika ingin mengganti</span></>}
                        </div>
                    )}
                    
                    {perizinan[id] && isRevisi && (
                        <div className="mt-2 text-danger small fw-bold">
                            <i className="fas fa-history me-1"></i> Berkas yang ditolak:
                            <a href={`/storage/${perizinan[id].replace('public/', '')}`} target="_blank" className="text-danger text-decoration-underline ms-1">Lihat File Lama</a>
                        </div>
                    )}
                </div>
                {errors[id] && <div className="text-danger small mt-1">{errors[id]}</div>}
            </div>
        );
    };

    return (
        <CabangLayout title={`${isCabang ? 'Edit' : 'Detail'} Pengajuan - KFA`} pageTitle={isCabang ? 'Edit / Revisi Pengajuan Perizinan' : 'Detail Pengajuan Perizinan'} onBackClick={handleBackClick}>
            <style>{`
                .gform-card { background: #ffffff; border-radius: 12px; border: none; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); margin-bottom: 12px; position: relative; overflow: hidden; transition: box-shadow 0.3s ease; }
                .gform-card-header { border-top: 6px solid var(--kfa-orange); padding: 12px 20px 8px 20px; border-bottom: 1px solid #f0f0f0; background-color: #fafbfc; }
                .gform-section-title { font-size: 1.25rem; font-weight: 700; color: var(--kfa-navy); margin-bottom: 4px; }
                .gform-section-desc { font-size: 0.9rem; color: #6c757d; margin-bottom: 0; }
                .gform-body { padding: 16px 20px; }
                .form-label-custom { font-weight: 600; color: #2c3e50; font-size: 0.88rem; margin-bottom: 4px; }
                .file-drop-box { background-color: #f8f9fa; border: 2px dashed #dce1e5; border-radius: 8px; padding: 8px 10px; transition: all 0.3s ease; position: relative; overflow: hidden; }
                .file-drop-box.has-file { border-color: #10B981; background-color: #ECFDF5; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1); }
                .file-drop-box.has-file::before { background-color: #10B981; }
                .file-drop-box input[type="file"] { font-size: 0.88rem; }
                .input-group-text-custom { background-color: #f1f3f5; border-color: #ced4da; color: #495057; font-weight: 600; }
                .btn-submit-gform { background: linear-gradient(135deg, #F26522, #d8541a); color: white; font-weight: 700; font-size: 1.1rem; padding: 14px 32px; border-radius: 50px; border: none; box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3); transition: all 0.3s; }
                .btn-draft-gform { background-color: #ffffff; color: #495057; font-weight: 600; font-size: 1rem; padding: 14px 28px; border-radius: 50px; border: 2px solid #dee2e6; transition: all 0.3s; }
                input::placeholder, textarea::placeholder, .form-control::placeholder { font-style: italic !important; color: #94a3b8 !important; opacity: 0.75 !important; font-weight: 400 !important; }
            `}</style>

            <div className="row justify-content-center">
                <div className="col-lg-10 col-xl-9">
                    {/* Activity Log / Timeline */}
                    {perizinan.activity_logs && perizinan.activity_logs.length > 0 && (
                        <div className="gform-card mb-4">
                            <div className="gform-card-header bg-light">
                                <h5 className="mb-0 fw-bold"><i className="fas fa-history text-secondary me-2"></i>Histori & Timeline Pengajuan</h5>
                            </div>
                            <div className="gform-body">
                                <div className="timeline-wrapper">
                                    {perizinan.activity_logs.map((log, index) => (
                                        <div className="timeline-item pb-3 border-bottom mb-3" key={log.id}>
                                            <div className="d-flex justify-content-between mb-1">
                                                <strong className="text-dark">{log.action}</strong>
                                                <small className="text-muted">{new Date(log.created_at).toLocaleString('id-ID')}</small>
                                            </div>
                                            <div className="small text-secondary">
                                                Oleh: <b>{log.user ? log.user.name : 'Sistem'}</b> | {log.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {isLocked && isCabang && (
                        <div className="alert alert-info shadow-sm border-0 mb-4 rounded-3 p-4">
                            <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-lock fs-4 me-3 text-info"></i>
                                <h5 className="fw-bold mb-0 text-dark">Data Pengajuan Terkunci</h5>
                            </div>
                            <p className="mb-0 text-dark">Pengajuan Anda sedang diproses atau sudah selesai. Anda tidak dapat mengubah isian formulir.</p>
                        </div>
                    )}

                    {isRevisiMode && Object.keys(catatanDokumen).length > 0 && (
                        <div className="alert shadow-sm mb-4 p-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderLeft: '4px solid #ef4444' }}>
                            <h6 className="alert-heading fw-bold mb-2" style={{ color: '#b91c1c' }}><i className="fas fa-exclamation-triangle me-1"></i> Catatan Revisi dari Admin</h6>
                            <ul className="mb-0" style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', color: '#b91c1c' }}>
                                {Object.entries(statusDokumen).map(([key, status]) => {
                                    if (!catatanDokumen[key] || status !== 'revisi') return null;
                                    
                                    let label = '';
                                    let fieldsStr = '';
                                    let hasOldValue = false;
                                    
                                    if (key === 'bagian2') {
                                        label = 'Bagian 2 (Alamat & Tata Ruang)';
                                        if (revisiFields && revisiFields.length > 0) {
                                            const b2Fields = revisiFields.filter(f => ['nama_rencana_usaha', 'kode_pos', 'luas_lahan', 'alamat_lengkap', 'lokasi_alamat_lengkap', 'deskripsi_kegiatan', 'deskripsi_lokasi'].includes(f));
                                            if (b2Fields.length > 0) {
                                                fieldsStr = b2Fields.map(f => `${f.replace(/_/g, ' ').toUpperCase()}:::${perizinan[f] || '(Kosong)'}`).join('|||');
                                            } else if (isRevisiMode) {
                                                // If in revisi mode and no fields selected, hide it
                                                return null;
                                            }
                                        } else if (isRevisiMode) {
                                            return null;
                                        }
                                    } else if (key === 'bagian3') {
                                        label = 'Bagian 3 (Finansial & SDM)';
                                        if (revisiFields && revisiFields.length > 0) {
                                            const b3Fields = revisiFields.filter(f => ['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja', 'omzet_pertahun', 'sdm_laki', 'sdm_perempuan', 'sdm_tka'].includes(f));
                                            if (b3Fields.length > 0) {
                                                fieldsStr = b3Fields.map(f => {
                                                    let val = perizinan[f];
                                                    if (['bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja', 'omzet_pertahun'].includes(f)) {
                                                        val = val ? 'Rp ' + Number(val).toLocaleString('id-ID') : '(Kosong)';
                                                    } else {
                                                        val = val ? val + ' Orang' : '(Kosong)';
                                                    }
                                                    return `${f.replace(/_/g, ' ').toUpperCase()}:::${val}`;
                                                }).join('|||');
                                            } else if (isRevisiMode) {
                                                return null;
                                            }
                                        } else if (isRevisiMode) {
                                            return null;
                                        }
                                    } else {
                                        const fileLabels = {
                                            '1': 'SIA Terakhir', '2': 'SIPA Terbaru', '3': 'Akta Sewa', '4': 'RTB/RIK', '5': 'Izin Lokasi OSS', '12': 'Sertifikat Tanah & IMB',
                                            '6': 'Polygon Lahan', '13': 'Kesesuaian Tata Ruang', '14': 'Peta Lokasi', '15': 'SHP Tapak Proyek',
                                            '7': 'Dokumen Administrasi', '8': 'Dokumen Lokasi', '9': 'Dokumen Bangunan', '10': 'Dokumen Sarana & Prasarana', '11': 'Dokumen SDM (STR, SIPA)', '16': 'BAP'
                                        };
                                        label = fileLabels[key] || 'File ' + key;
                                        hasOldValue = !!oldFiles['file_' + key];
                                    }

                                    return (
                                        <li key={key} className="mb-2 pb-2 border-bottom border-danger border-opacity-25 text-dark" style={{ '&:last-child': { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } }}>
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <strong style={{ color: '#991b1b', fontSize: '0.9rem' }}>
                                                    <i className="fas fa-file-alt me-2 opacity-75"></i>{label}
                                                </strong>
                                                {hasOldValue && (
                                                    <a href={`/storage/${oldFiles['file_' + key]}`} target="_blank" className="btn btn-sm btn-outline-danger text-danger py-0 px-2 d-inline-flex align-items-center" style={{ fontSize: '0.75rem', backgroundColor: '#fef2f2' }}>
                                                        <i className="fas fa-file-pdf me-1"></i> File Lama
                                                    </a>
                                                )}
                                            </div>
                                            <div className="ps-4">
                                                <div className="mb-1" style={{ fontSize: '0.85rem' }}>
                                                    <span className="fw-bold text-danger me-1">Catatan:</span>
                                                    <span className="fst-italic text-dark">{catatanDokumen[key] || 'Tidak ada catatan.'}</span>
                                                </div>
                                                {fieldsStr && (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <span className="fw-bold text-danger me-2">Data Lama:</span>
                                                        {fieldsStr.split('|||').map((fStr, idx) => {
                                                            const [fName, fVal] = fStr.split(':::');
                                                            return (
                                                                <span key={idx} className="me-3 d-inline-block mb-1">
                                                                    <span className="text-muted fw-bold me-1">{fName}:</span> 
                                                                    <span className="text-danger text-decoration-line-through">{fVal}</span>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger shadow-sm rounded-3 mb-4 border-0" style={{ borderLeft: '5px solid #dc3545 !important' }}>
                            <h6 className="fw-bold mb-1"><i className="fas fa-exclamation-triangle me-2"></i> Gagal Menyimpan Data</h6>
                            <p className="mb-0 small">Mohon periksa kembali formulir di bawah. Terdapat isian yang tidak valid.</p>
                        </div>
                    )}

                    {showMainForm && (
                        <form onSubmit={handleSubmit} id="form-pengajuan">
                            {/* BAGIAN 0 */}
                            <div className="gform-card" style={{ borderTop: '8px solid var(--kfa-navy)', display: isFieldHidden('jenis_perizinan') ? 'none' : 'block' }}>
                                <div className="gform-card-header" style={{ backgroundColor: '#fff' }}>
                                    <h3 className="fw-bold mb-1" style={{ color: 'var(--kfa-navy)' }}>Data Utama Pengajuan Perizinan</h3>
                                </div>
                                <div className="gform-body bg-light bg-opacity-50">
                                    <div className="row gx-3 gy-2">
                                        <div className="col-md-6 d-flex flex-column">
                                            <label className="form-label-custom">Jenis Perizinan Yang Diajukan {renderInputBadge('jenis_perizinan')} <span className="text-danger">*</span></label>
                                            <select className={`form-select form-select-lg border-secondary shadow-sm ${revisiFields.includes('jenis_perizinan') ? 'is-invalid border-danger' : ''}`} value={data.jenis_perizinan} onChange={e => setData('jenis_perizinan', e.target.value)} disabled={isLocked} required style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--kfa-navy)' }}>
                                                <option value="">-- Klik untuk Memilih --</option>
                                                <option value="Perubahan APJ">Perubahan APJ</option>
                                                <option value="Perpanjangan & Perubahan APJ">Perpanjangan dan Perubahan APJ</option>
                                                <option value="Perpanjangan SIA (Belum OSS)">Perpanjangan SIA (SIA Lama Belum OSS)</option>
                                                <option value="Perpanjangan SIA (Sudah OSS)">Perpanjangan SIA (SIA Lama Sudah OSS)</option>
                                            </select>
                                            {errors.jenis_perizinan && <div className="text-danger small mt-1">{errors.jenis_perizinan}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BAGIAN 1 */}
                            {!isSectionHidden('bagian1') && (
                                <div className="gform-card">
                                <div className="gform-card-header">
                                    <h4 className="gform-section-title">Bagian 1: Persyaratan Dasar</h4>
                                </div>
                                <div className="gform-body">
                                    <div className="row gx-3 gy-2">
                                        {renderFileField('file_1', 'SIA Terakhir', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_2', 'SIPA Terbaru yang Masih Berlaku', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_3', 'Akta Perjanjian Sewa', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_4', 'Rencana Teknis Bangunan (RTB/RIK)', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_5', 'Izin Lokasi yang Diterbitkan OSS', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_12', 'Sertifikat Tanah dan IMB', '.pdf', 'PDF (.pdf)')}
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* BAGIAN 2 */}
                            {!isSectionHidden('bagian2') && (
                                <div className="gform-card">
                                <div className="gform-card-header">
                                    <h4 className="gform-section-title">Bagian 2: Alamat, Geografis Lahan & Tata Ruang</h4>
                                </div>
                                <div className="gform-body">
                                    <div className="row gx-3 gy-2">
                                        {!isFieldHidden('nama_rencana_usaha') && (
                                            <div className="col-md-6 d-flex flex-column">
                                                <label className="form-label-custom">Nama Rencana Usaha / Kegiatan {renderInputBadge('nama_rencana_usaha')}</label>
                                                <input type="text" className={`form-control border-secondary-subtle bg-light mt-auto ${revisiFields.includes('nama_rencana_usaha') ? 'is-invalid border-danger' : ''}`} value={data.nama_rencana_usaha} onChange={e => setData('nama_rencana_usaha', e.target.value)} placeholder="Masukkan nama rencana usaha di sini..." disabled={isLocked} />
                                            </div>
                                        )}

                                        {!isFieldHidden('kode_pos') && (
                                            <div className="col-md-3 d-flex flex-column">
                                                <label className="form-label-custom">Kode Pos {renderInputBadge('kode_pos')}</label>
                                                <input type="text" className={`form-control border-secondary-subtle mt-auto ${revisiFields.includes('kode_pos') ? 'is-invalid border-danger' : ''}`} value={data.kode_pos} onChange={e => setData('kode_pos', e.target.value.replace(/\D/g, ''))} placeholder="Masukkan kode pos..." disabled={isLocked} />
                                            </div>
                                        )}

                                        {!isFieldHidden('luas_lahan') && (
                                            <div className="col-md-3 d-flex flex-column">
                                                <label className="form-label-custom">Luas Lahan {renderInputBadge('luas_lahan')}</label>
                                                <div className="input-group mt-auto">
                                                    <input type="text" className={`form-control border-secondary-subtle mt-auto ${revisiFields.includes('luas_lahan') ? 'is-invalid border-danger' : ''}`} value={data.luas_lahan} onChange={e => setData('luas_lahan', e.target.value.replace(/\D/g, ''))} placeholder="Masukkan luas lahan..." disabled={isLocked} />
                                                    <span className="input-group-text input-group-text-custom">m²</span>
                                                </div>
                                            </div>
                                        )}

                                        {!isFieldHidden('alamat_lengkap') && (
                                            <div className="col-md-6 d-flex flex-column">
                                                <label className="form-label-custom">Alamat Lengkap Apotek {renderInputBadge('alamat_lengkap')}</label>
                                                <textarea style={{ resize: "none" }} className={`form-control border-secondary-subtle bg-light mt-auto ${revisiFields.includes('alamat_lengkap') ? 'is-invalid border-danger' : ''}`} rows="2" value={data.alamat_lengkap} onChange={e => setData('alamat_lengkap', e.target.value)} placeholder="Masukkan alamat lengkap apotek di sini..." disabled={isLocked}></textarea>
                                            </div>
                                        )}

                                        {!isFieldHidden('lokasi_alamat_lengkap') && (
                                            <div className="col-md-6 d-flex flex-column">
                                                <label className="form-label-custom">Rincian Alamat Lokasi Kegiatan {renderInputBadge('lokasi_alamat_lengkap')}</label>
                                                <textarea style={{ resize: "none" }} className={`form-control border-secondary-subtle bg-light mt-auto ${revisiFields.includes('lokasi_alamat_lengkap') ? 'is-invalid border-danger' : ''}`} rows="2" value={data.lokasi_alamat_lengkap} onChange={e => setData('lokasi_alamat_lengkap', e.target.value)} placeholder="Masukkan rincian alamat lokasi di sini..." disabled={isLocked}></textarea>
                                            </div>
                                        )}

                                        {!isFieldHidden('deskripsi_kegiatan') && (
                                            <div className="col-md-6 d-flex flex-column">
                                                <label className="form-label-custom">Deskripsi Kegiatan Usaha {renderInputBadge('deskripsi_kegiatan')}</label>
                                                <textarea style={{ resize: "none" }} className={`form-control border-secondary-subtle mt-auto ${revisiFields.includes('deskripsi_kegiatan') ? 'is-invalid border-danger' : ''}`} rows="2" value={data.deskripsi_kegiatan} onChange={e => setData('deskripsi_kegiatan', e.target.value)} placeholder="Masukkan deskripsi kegiatan di sini..." disabled={isLocked}></textarea>
                                            </div>
                                        )}

                                        {!isFieldHidden('deskripsi_lokasi') && (
                                            <div className="col-md-6 d-flex flex-column">
                                                <label className="form-label-custom">Deskripsi Kondisi Lokasi {renderInputBadge('deskripsi_lokasi')}</label>
                                                <textarea style={{ resize: "none" }} className={`form-control border-secondary-subtle mt-auto ${revisiFields.includes('deskripsi_lokasi') ? 'is-invalid border-danger' : ''}`} rows="2" value={data.deskripsi_lokasi} onChange={e => setData('deskripsi_lokasi', e.target.value)} placeholder="Masukkan deskripsi kondisi lokasi di sini..." disabled={isLocked}></textarea>
                                            </div>
                                        )}

                                        {renderFileField('file_6', 'Peta Polygon Lahan', '.zip', 'ZIP (.zip)')}
                                        {renderFileField('file_13', 'Data Kesesuaian Tata Ruang', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_14', 'Peta Lokasi', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_15', 'SHP Peta Tapak Proyek', '.zip', 'ZIP (.zip)')}
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* BAGIAN 3 */}
                            {!isSectionHidden('bagian3') && (
                                <div className="gform-card">
                                <div className="gform-card-header">
                                    <h4 className="gform-section-title">Bagian 3: Finansial, Investasi & SDM</h4>
                                </div>
                                <div className="gform-body">
                                    <div className="row gx-3 gy-2">
                                        {[
                                            { id: 'bangunan_renovasi', label: 'Bangunan / Gedung Renovasi', placeholder: 'Masukkan nominal...' },
                                            { id: 'mesin_peralatan', label: 'Mesin / Peralatan Dalam Negeri', placeholder: 'Masukkan nominal...' },
                                            { id: 'investasi_lain', label: 'Investasi Lain-lain', placeholder: 'Masukkan nominal...' },
                                            { id: 'modal_kerja', label: 'Modal Kerja 3 Bulan - Stok Opname', placeholder: 'Masukkan nominal...' },
                                        ].map(field => !isFieldHidden(field.id) && (
                                            <div className="col-md-6 d-flex flex-column" key={field.id}>
                                                <label className="form-label-custom">{field.label} {renderInputBadge(field.id)}</label>
                                                <div className="input-group mt-auto">
                                                    <span className="input-group-text input-group-text-custom">Rp</span>
                                                    <input type="text" className={`form-control border-secondary-subtle mt-auto ${revisiFields.includes(field.id) ? 'is-invalid border-danger' : ''}`} value={data[field.id]} onChange={e => setData(field.id, e.target.value.replace(/\D/g, ''))} placeholder={field.placeholder} disabled={isLocked} />
                                                </div>
                                            </div>
                                        ))}

                                        {!isFieldHidden('omzet_pertahun') && (
                                            <div className="col-md-12 d-flex flex-column">
                                                <label className="form-label-custom">Nilai Kapasitas / Omzet per Tahun {renderInputBadge('omzet_pertahun')}</label>
                                                <div className="input-group mt-auto">
                                                    <span className="input-group-text input-group-text-custom">Rp</span>
                                                    <input type="text" className={`form-control border-secondary-subtle mt-auto ${revisiFields.includes('omzet_pertahun') ? 'is-invalid border-danger' : ''}`} value={data.omzet_pertahun} onChange={e => setData('omzet_pertahun', e.target.value.replace(/\D/g, ''))} placeholder="Masukkan nominal omzet..." disabled={isLocked} />
                                                </div>
                                            </div>
                                        )}

                                        {(!isFieldHidden('sdm_laki') || !isFieldHidden('sdm_perempuan') || !isFieldHidden('sdm_tka')) && (
                                            <div className="col-md-12 d-flex flex-column">
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <label className="form-label-custom mb-0">
                                                        Jumlah Personel SDM Apotek <span className="text-danger">*</span>
                                                    </label>
                                                    {!isLocked && (
                                                        <small className="text-muted"><i className="fas fa-info-circle me-1"></i>Ketik angka atau gunakan tombol <strong>+</strong> / <strong>-</strong></small>
                                                    )}
                                                </div>
                                                <div className="row gx-3 gy-3">
                                                    {/* SDM Laki-laki */}
                                                    <div className="col-md-4">
                                                        <div className={`p-3 bg-white rounded-3 shadow-sm border text-center ${revisiFields.includes('sdm_laki') ? 'border-2 border-danger' : ''}`} style={{ borderColor: '#E2E8F0' }}>
                                                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
                                                                    <i className="fas fa-male fs-5"></i>
                                                                </div>
                                                                <label className="fw-bold text-dark mb-0 small">Laki-laki {renderInputBadge('sdm_laki')}</label>
                                                            </div>
                                                            <div className="input-group input-group-sm mb-2" style={{ maxWidth: '170px', margin: '0 auto' }}>
                                                                {!isLocked && (
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-outline-secondary px-2 fw-bold" 
                                                                        style={{ borderRadius: '8px 0 0 8px', borderColor: '#CBD5E1' }}
                                                                        onClick={() => setData('sdm_laki', Math.max(0, (parseInt(data.sdm_laki) || 0) - 1))}
                                                                        disabled={isLocked}
                                                                        title="Kurangi"
                                                                    >
                                                                        <i className="fas fa-minus"></i>
                                                                    </button>
                                                                )}
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control text-center fw-bold bg-white" 
                                                                    value={data.sdm_laki} 
                                                                    onChange={e => setData('sdm_laki', e.target.value.replace(/\D/g, ''))} 
                                                                    disabled={isLocked} 
                                                                    placeholder="0"
                                                                    style={{ fontSize: '1.05rem', borderColor: '#CBD5E1', color: '#0F172A', borderRadius: isLocked ? '8px' : undefined }}
                                                                />
                                                                {!isLocked && (
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-outline-secondary px-2 fw-bold" 
                                                                        style={{ borderRadius: '0 8px 8px 0', borderColor: '#CBD5E1' }}
                                                                        onClick={() => setData('sdm_laki', (parseInt(data.sdm_laki) || 0) + 1)}
                                                                        disabled={isLocked}
                                                                        title="Tambah"
                                                                    >
                                                                        <i className="fas fa-plus"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="badge bg-light text-secondary border px-2 py-1 fw-normal" style={{ fontSize: '0.75rem' }}>
                                                                <i className="fas fa-user me-1 text-primary"></i> <strong>{data.sdm_laki || 0}</strong> Orang
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* SDM Perempuan */}
                                                    <div className="col-md-4">
                                                        <div className={`p-3 bg-white rounded-3 shadow-sm border text-center ${revisiFields.includes('sdm_perempuan') ? 'border-2 border-danger' : ''}`} style={{ borderColor: '#E2E8F0' }}>
                                                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                                                                    <i className="fas fa-female fs-5"></i>
                                                                </div>
                                                                <label className="fw-bold text-dark mb-0 small">Perempuan {renderInputBadge('sdm_perempuan')}</label>
                                                            </div>
                                                            <div className="input-group input-group-sm mb-2" style={{ maxWidth: '170px', margin: '0 auto' }}>
                                                                {!isLocked && (
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-outline-secondary px-2 fw-bold" 
                                                                        style={{ borderRadius: '8px 0 0 8px', borderColor: '#CBD5E1' }}
                                                                        onClick={() => setData('sdm_perempuan', Math.max(0, (parseInt(data.sdm_perempuan) || 0) - 1))}
                                                                        disabled={isLocked}
                                                                        title="Kurangi"
                                                                    >
                                                                        <i className="fas fa-minus"></i>
                                                                    </button>
                                                                )}
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control text-center fw-bold bg-white" 
                                                                    value={data.sdm_perempuan} 
                                                                    onChange={e => setData('sdm_perempuan', e.target.value.replace(/\D/g, ''))} 
                                                                    disabled={isLocked} 
                                                                    placeholder="0"
                                                                    style={{ fontSize: '1.05rem', borderColor: '#CBD5E1', color: '#0F172A', borderRadius: isLocked ? '8px' : undefined }}
                                                                />
                                                                {!isLocked && (
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-outline-secondary px-2 fw-bold" 
                                                                        style={{ borderRadius: '0 8px 8px 0', borderColor: '#CBD5E1' }}
                                                                        onClick={() => setData('sdm_perempuan', (parseInt(data.sdm_perempuan) || 0) + 1)}
                                                                        disabled={isLocked}
                                                                        title="Tambah"
                                                                    >
                                                                        <i className="fas fa-plus"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="badge bg-light text-secondary border px-2 py-1 fw-normal" style={{ fontSize: '0.75rem' }}>
                                                                <i className="fas fa-user me-1 text-danger"></i> <strong>{data.sdm_perempuan || 0}</strong> Orang
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* SDM TKA */}
                                                    <div className="col-md-4">
                                                        <div className={`p-3 bg-white rounded-3 shadow-sm border text-center ${revisiFields.includes('sdm_tka') ? 'border-2 border-danger' : ''}`} style={{ borderColor: '#E2E8F0' }}>
                                                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                                                                    <i className="fas fa-globe-asia fs-5"></i>
                                                                </div>
                                                                <label className="fw-bold text-dark mb-0 small">TKA {renderInputBadge('sdm_tka')}</label>
                                                            </div>
                                                            <div className="input-group input-group-sm mb-2" style={{ maxWidth: '170px', margin: '0 auto' }}>
                                                                {!isLocked && (
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-outline-secondary px-2 fw-bold" 
                                                                        style={{ borderRadius: '8px 0 0 8px', borderColor: '#CBD5E1' }}
                                                                        onClick={() => setData('sdm_tka', Math.max(0, (parseInt(data.sdm_tka) || 0) - 1))}
                                                                        disabled={isLocked}
                                                                        title="Kurangi"
                                                                    >
                                                                        <i className="fas fa-minus"></i>
                                                                    </button>
                                                                )}
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control text-center fw-bold bg-white" 
                                                                    value={data.sdm_tka} 
                                                                    onChange={e => setData('sdm_tka', e.target.value.replace(/\D/g, ''))} 
                                                                    disabled={isLocked} 
                                                                    placeholder="0"
                                                                    style={{ fontSize: '1.05rem', borderColor: '#CBD5E1', color: '#0F172A', borderRadius: isLocked ? '8px' : undefined }}
                                                                />
                                                                {!isLocked && (
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn btn-outline-secondary px-2 fw-bold" 
                                                                        style={{ borderRadius: '0 8px 8px 0', borderColor: '#CBD5E1' }}
                                                                        onClick={() => setData('sdm_tka', (parseInt(data.sdm_tka) || 0) + 1)}
                                                                        disabled={isLocked}
                                                                        title="Tambah"
                                                                    >
                                                                        <i className="fas fa-plus"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="badge bg-light text-secondary border px-2 py-1 fw-normal" style={{ fontSize: '0.75rem' }}>
                                                                <i className="fas fa-globe me-1 text-success"></i> <strong>{data.sdm_tka || 0}</strong> Orang
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* BAGIAN 4 */}
                            {!isSectionHidden('bagian4') && (
                                <div className="gform-card">
                                <div className="gform-card-header">
                                    <h4 className="gform-section-title">Bagian 4: Persyaratan Umum</h4>
                                </div>
                                <div className="gform-body">
                                    <div className="row gx-3 gy-2">
                                        {renderFileField('file_7', 'Dokumen Administrasi', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_8', 'Dokumen Lokasi', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_9', 'Dokumen Bangunan', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_10', 'Dokumen Sarana & Prasarana', '.pdf', 'PDF (.pdf)')}
                                        {renderFileField('file_11', 'Dokumen SDM (STR, KTP, SIPA, dll)', '.pdf', 'PDF (.pdf)')}
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* BAGIAN TAMBAHAN */}
                            {!isLocked && (
                                <div className="gform-card" style={{ borderTop: '6px solid #6c757d' }}>
                                    <div className="gform-body">
                                        <div className="mb-4">
                                            <label className="form-label-custom fs-6">Keterangan / Catatan Tambahan (Opsional)</label>
                                            <textarea style={{ resize: "none" }} className="form-control border-secondary-subtle mt-auto" rows="2" value={data.keterangan} onChange={e => setData('keterangan', e.target.value)} disabled={isLocked}></textarea>
                                        </div>
                                        <div className="d-flex flex-column flex-md-row gap-3 justify-content-end align-items-center bg-light p-3 rounded border">
                                            <button type="submit" className="btn btn-draft-gform w-100" style={{ maxWidth: '250px' }} onClick={() => setActionType('draft')} disabled={processing}>
                                                <i className="fas fa-save me-2"></i> Simpan Draft
                                            </button>
                                            <button type="submit" className="btn btn-submit-gform w-100" style={{ maxWidth: '350px' }} onClick={() => setActionType('submit')} disabled={processing}>
                                                <i className="fas fa-paper-plane me-2"></i> Submit Pengajuan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}

                    {/* FORM BAP (BERITA ACARA PEMERIKSAAN) */}
                    {!isSectionHidden('bap') && (
                        <div className="gform-card mt-4 mb-5">
                        <div className="gform-card-header">
                            <h5 className="gform-section-title"><i className="fas fa-file-signature me-2" style={{ color: 'var(--kfa-orange)' }}></i>Berita Acara Pemeriksaan (BAP)</h5>
                            <p className="gform-section-desc">Unggah dokumen BAP dari Dinas Kesehatan (Wajib tapi boleh menyusul).</p>
                        </div>

                        <form onSubmit={handleBapSubmit}>
                            <div className="gform-body">
                                <div className="row gx-3 gy-2 mb-2">
                                    <div className="col-md-6">
                                        <label className="form-label-custom text-dark mb-1">
                                            <i className="fas fa-paperclip text-secondary me-2"></i> Dokumen BAP <span className="text-danger">*</span> <span className="text-muted fw-normal" style={{fontSize: '0.85rem'}}>(Wajib tapi boleh menyusul)</span>
                                        </label>
                                        <div>
                                            {(() => {
                                                const isRevisiBap = statusDokumen['16'] === 'revisi';
                                                return (
                                                    <div className={`file-drop-box ${data['file_16'] ? 'has-file' : ''}`} style={{
                                                        borderColor: isRevisiBap ? '#dc3545' : '',
                                                        backgroundColor: isRevisiBap ? '#fff8f8' : ''
                                                    }}>
                                                        {isRevisiBap && <div className="badge bg-danger px-3 py-2" style={{ position: 'absolute', top: 0, right: 0, fontSize: '13px', zIndex: 10, borderRadius: '0 8px 0 8px' }}><i className="fas fa-times-circle me-1"></i> WAJIB DIREVISI</div>}
                                                        <input type="file" className="form-control bg-white shadow-sm mb-2" onChange={handleBapFileChange} accept=".pdf" required={!perizinan.file_16} />
                                                        <small className="text-muted d-block mt-1">Format: Khusus PDF (.pdf) - Maks. 5 MB</small>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        {perizinan.file_16 && (
                                            (() => {
                                                const isRevisiBap = statusDokumen['16'] === 'revisi';
                                                if (isRevisiBap) {
                                                    return (
                                                        <div className="mt-2 p-2 rounded bg-light border-start border-danger border-4 shadow-sm">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="badge bg-danger"><i className="fas fa-exclamation-circle"></i> Butuh Revisi</span>
                                                                <div>
                                                                    <a href={`/storage/${perizinan.file_16.replace('public/', '')}`} target="_blank" className="text-danger small text-decoration-underline"><i className="fas fa-history"></i> Lihat File Lama</a>
                                                                </div>
                                                            </div>
                                                            <p className="mb-0 text-danger" style={{ fontSize: '0.8rem' }}><i className="fas fa-info-circle"></i> {catatanDokumen['16'] || 'Tidak ada catatan.'}</p>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="mt-2 p-2 rounded bg-light border-start border-success border-4 shadow-sm">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="badge bg-success"><i className="fas fa-check-circle"></i> File Tersimpan</span>
                                                                <div>
                                                                    <a href={`/storage/${perizinan.file_16.replace('public/', '')}`} target="_blank" className="text-primary small text-decoration-none"><i className="fas fa-eye"></i> Lihat Dokumen BAP</a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })()
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3 mt-3 border-top">
                                    <div className="text-center text-md-start">
                                        <small className="text-muted d-block"><i className="fas fa-info-circle text-primary me-1"></i> BAP dapat disusulkan tanpa harus mengubah data pengajuan lainnya.</small>
                                    </div>
                                    {(!perizinan.file_16 || statusDokumen['16'] === 'revisi') && (
                                        <button type="submit" className="btn btn-submit-gform text-nowrap shadow-sm" disabled={processingBap}>
                                            <i className="fas fa-upload me-2"></i> {processingBap ? 'MENGUNGGAH...' : 'SUBMIT BAP'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                        </div>
                    )}
                </div>
            </div>
        </CabangLayout>
    );
}
