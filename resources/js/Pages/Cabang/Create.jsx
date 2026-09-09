import React, { useState, useRef } from 'react';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import CabangLayout from '../../Layouts/CabangLayout';
import Swal from 'sweetalert2';

export default function Create() {
    const { auth, flash, errors: pageErrors } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        jenis_perizinan: '',
        nama_apotek: `${auth.user.name} (KFA ${auth.user.unit_bisnis || ''})`,
        tanggal_pengajuan: new Date().toISOString().split('T')[0],
        kode_pos: '',
        luas_lahan: '',
        alamat_lengkap: auth.user.alamat || '',
        lokasi_alamat_lengkap: auth.user.alamat || '',
        deskripsi_kegiatan: '',
        deskripsi_lokasi: '',
        nama_rencana_usaha: auth.user.name || '',
        bangunan_renovasi: '',
        mesin_peralatan: '',
        investasi_lain: '',
        modal_kerja: '',
        omzet_pertahun: '',
        sdm_laki: 0,
        sdm_perempuan: 0,
        sdm_tka: 0,
        keterangan: '',
        file_1: null, file_2: null, file_3: null, file_4: null, file_5: null,
        file_6: null, file_7: null, file_8: null, file_9: null, file_10: null,
        file_11: null, file_12: null, file_13: null, file_14: null, file_15: null,
        file_16: null
    });

    const [actionType, setActionType] = useState('draft');
    const actionTypeRef = useRef('draft');

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
        const currentAction = actionTypeRef.current;

        if (currentAction === 'submit') {
            const allRequiredFields = [
                'jenis_perizinan', 'nama_rencana_usaha', 'kode_pos', 'luas_lahan',
                'alamat_lengkap', 'lokasi_alamat_lengkap', 'deskripsi_kegiatan', 'deskripsi_lokasi',
                'bangunan_renovasi', 'mesin_peralatan', 'investasi_lain', 'modal_kerja', 'omzet_pertahun',
                'sdm_laki', 'sdm_perempuan', 'sdm_tka',
                'file_1', 'file_2', 'file_3', 'file_4', 'file_5',
                'file_6', 'file_7', 'file_8', 'file_9', 'file_10',
                'file_11', 'file_12', 'file_13', 'file_14', 'file_15'
            ];
            
            let hasMissingFields = false;
            let firstMissingElement = null;

            // Bersihkan semua border merah manual yang mungkin masih nyangkut
            allRequiredFields.forEach(field => {
                const el = document.getElementById(field);
                if (el) {
                    if (field.startsWith('file_') && el.parentElement) {
                        el.parentElement.style.removeProperty('border');
                        el.parentElement.style.removeProperty('background-color');
                    } else {
                        el.style.removeProperty('border');
                        el.style.removeProperty('background-color');
                    }
                }
            });
            
            for (let i = 0; i < allRequiredFields.length; i++) {
                const field = allRequiredFields[i];
                if (data[field] === '' || data[field] === null || data[field] === undefined) {
                    hasMissingFields = true;
                    const element = document.getElementById(field);
                    
                    if (element) {
                        if (!firstMissingElement) {
                            firstMissingElement = element;
                        }
                        
                        if (field.startsWith('file_')) {
                            element.parentElement.style.setProperty('border', '2px solid #dc3545', 'important');
                            element.parentElement.style.setProperty('background-color', '#fff8f8', 'important');
                            // Hilangkan warna merah jika user mengubah file
                            element.addEventListener('change', function handler() {
                                if (this.parentElement) {
                                    this.parentElement.style.removeProperty('border');
                                    this.parentElement.style.removeProperty('background-color');
                                }
                                this.removeEventListener('change', handler);
                            });
                        } else {
                            element.style.setProperty('border', '2px solid #dc3545', 'important');
                            element.style.setProperty('background-color', '#fff8f8', 'important');
                            // Hilangkan warna merah jika user mengetik
                            element.addEventListener('input', function handler() {
                                this.style.removeProperty('border');
                                this.style.removeProperty('background-color');
                                this.removeEventListener('input', handler);
                            });
                            element.addEventListener('change', function handler() {
                                this.style.removeProperty('border');
                                this.style.removeProperty('background-color');
                                this.removeEventListener('change', handler);
                            });
                        }
                    }
                }
            }

            if (hasMissingFields) {
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                
                if (firstMissingElement) {
                    firstMissingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                Swal.fire({
                    title: 'Formulir Belum Lengkap!',
                    text: 'Silakan lengkapi semua kolom dan berkas yang ditandai dengan warna merah.',
                    icon: 'warning',
                    confirmButtonColor: '#F26522'
                });
                
                return;
            }
        }

        post(`/cabang/pengajuan?action=${currentAction}`, {
            forceFormData: true,
            preserveScroll: true
        });
    };

    const handleBackClick = () => {
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
                    post(`/cabang/pengajuan?action=draft`, {
                        forceFormData: true,
                    });
                }, 100);
            } else if (result.isDenied) {
                window.history.back();
            }
        });
    };

    return (
        <CabangLayout title="Buat Pengajuan Baru - KFA" pageTitle="Formulir Pengajuan Perizinan Apotek" onBackClick={handleBackClick}>
            <style>{`
                .gform-card { background: #ffffff; border-radius: 12px; border: none; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); margin-bottom: 12px; position: relative; overflow: hidden; transition: box-shadow 0.3s ease; }
                .gform-card:hover { box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1); }
                .gform-card-header { border-top: 6px solid var(--kfa-orange); padding: 12px 20px 8px 20px; border-bottom: 1px solid #f0f0f0; background-color: #fafbfc; }
                .gform-section-title { font-size: 1.25rem; font-weight: 700; color: var(--kfa-navy); margin-bottom: 4px; }
                .gform-section-desc { font-size: 0.9rem; color: #6c757d; margin-bottom: 0; }
                .gform-body { padding: 16px 20px; }
                .form-label-custom { font-weight: 600; color: #2c3e50; font-size: 0.88rem; margin-bottom: 4px; }
                .file-drop-box { background-color: #f8f9fa; border: 2px dashed #dce1e5; border-radius: 8px; padding: 8px 10px; transition: all 0.3s ease; position: relative; overflow: hidden; }
                .file-drop-box::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background-color: var(--kfa-navy); transition: all 0.3s ease; opacity: 0.7; }
                .file-drop-box:hover::before, .file-drop-box:focus-within::before { background-color: var(--kfa-orange); opacity: 1; }
                .file-drop-box:hover, .file-drop-box:focus-within { border-color: var(--kfa-orange); background-color: #fffaf7; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(242, 101, 34, 0.08); }
                .file-drop-box.has-file { border-color: #10B981; background-color: #ECFDF5; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1); }
                .file-drop-box.has-file::before { background-color: #10B981; }
                .file-drop-box input[type="file"] { font-size: 0.88rem; }
                .input-group-text-custom { background-color: #f1f3f5; border-color: #ced4da; color: #495057; font-weight: 600; }
                .btn-submit-gform { background: linear-gradient(135deg, #F26522, #d8541a); color: white; font-weight: 700; font-size: 1.1rem; padding: 14px 32px; border-radius: 50px; border: none; box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3); transition: all 0.3s; }
                .btn-submit-gform:hover { background: linear-gradient(135deg, #d8541a, #bf4512); color: white; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(242, 101, 34, 0.4); }
                .btn-draft-gform { background-color: #ffffff; color: #495057; font-weight: 600; font-size: 1rem; padding: 14px 28px; border-radius: 50px; border: 2px solid #dee2e6; transition: all 0.3s; }
                .btn-draft-gform:hover { background-color: #f8f9fa; border-color: #adb5bd; color: #212529; }
                input::placeholder, textarea::placeholder, .form-control::placeholder { font-style: italic !important; color: #94a3b8 !important; opacity: 0.75 !important; font-weight: 400 !important; }
                @media (max-width: 576px) { .gform-card-header { padding: 18px 16px 14px 16px; } .gform-body { padding: 16px; } .gform-section-title { font-size: 1.1rem; } .btn-submit-gform, .btn-draft-gform { width: 100%; margin-bottom: 10px; } }
            `}</style>

            <div className="row justify-content-center">
                <div className="col-lg-10 col-xl-9">
                    {Object.keys(errors).length > 0 && (
                        <div className="alert alert-danger shadow-sm rounded-3 mb-4 border-0" style={{ borderLeft: '5px solid #dc3545 !important' }}>
                            <h6 className="fw-bold mb-1"><i className="fas fa-exclamation-triangle me-2"></i> Gagal Menyimpan Data</h6>
                            <p className="mb-0 small">Mohon periksa kembali formulir di bawah. Terdapat isian yang tidak valid.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} id="form-pengajuan" noValidate>
                        {/* BAGIAN 0: INFORMASI UMUM */}
                        <div className="gform-card" style={{ borderTop: '8px solid var(--kfa-navy)' }}>
                            <div className="gform-card-header" style={{ backgroundColor: '#fff' }}>
                                <h3 className="fw-bold mb-1" style={{ color: 'var(--kfa-navy)' }}>Data Utama Pengajuan Perizinan</h3>
                                <p className="gform-section-desc">Pilih jenis perizinan yang akan diajukan oleh cabang Anda.</p>
                            </div>
                            <div className="gform-body bg-light bg-opacity-50">
                                <div className="row gx-3 gy-2">
                                    <div className="col-md-6 d-flex flex-column">
                                        <label className="form-label-custom">Jenis Perizinan Yang Diajukan <span className="text-danger">*</span></label>
                                        <select className="form-select form-select-lg border-secondary shadow-sm" id="jenis_perizinan" value={data.jenis_perizinan} onChange={e => setData('jenis_perizinan', e.target.value)} required style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--kfa-navy)' }}>
                                            <option value="">-- Klik untuk Memilih --</option>
                                            <option value="Perubahan APJ">Perubahan APJ</option>
                                            <option value="Perpanjangan & Perubahan APJ">Perpanjangan dan Perubahan APJ</option>
                                            <option value="Perpanjangan SIA (Belum OSS)">Perpanjangan SIA (SIA Lama Belum OSS)</option>
                                            <option value="Perpanjangan SIA (Sudah OSS)">Perpanjangan SIA (SIA Lama Sudah OSS)</option>
                                        </select>
                                        {errors.jenis_perizinan && <div className="text-danger small mt-1">{errors.jenis_perizinan}</div>}
                                    </div>
                                    <div className="col-md-6 d-flex flex-column">
                                        <label className="form-label-custom">Nama Cabang / Unit Bisnis <small className="text-muted fw-normal">(Terisi otomatis)</small></label>
                                        <input type="text" className="form-control bg-white border-0 shadow-sm text-secondary fw-bold mt-auto" value={data.nama_apotek} readOnly style={{ fontSize: '0.95rem' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN 1: LEGALITAS DASAR */}
                        <div className="gform-card">
                            <div className="gform-card-header">
                                <h4 className="gform-section-title">Bagian 1: Persyaratan Dasar</h4>
                                <p className="gform-section-desc">Unggah salinan dokumen izin dan perjanjian resmi apotek <strong>(Khusus berformat PDF, maksimal 5 MB per berkas)</strong>.</p>
                            </div>
                            <div className="gform-body">
                                <div className="row gx-3 gy-2">
                                    {[
                                        { id: 'file_1', label: 'SIA Terakhir', accept: '.pdf' },
                                        { id: 'file_2', label: 'SIPA Terbaru yang Masih Berlaku', accept: '.pdf' },
                                        { id: 'file_3', label: 'Akta Perjanjian Sewa', accept: '.pdf' },
                                        { id: 'file_4', label: 'Rencana Teknis Bangunan (RTB/RIK)', accept: '.pdf' },
                                        { id: 'file_5', label: 'Izin Lokasi yang Diterbitkan OSS', accept: '.pdf' },
                                        { id: 'file_12', label: 'Sertifikat Tanah dan IMB', accept: '.pdf' }
                                    ].map(field => (
                                        <div className="col-md-6" key={field.id}>
                                            <label className="form-label-custom text-dark mb-1">
                                                <i className="fas fa-paperclip text-secondary me-2"></i> {field.label} <span className="text-danger">*</span>
                                            </label>
                                            <div>
                                                <div className={`file-drop-box ${data[field.id] ? 'has-file' : ''}`}>
                                                    <input type="file" className="form-control bg-white shadow-sm mb-2" id={field.id} onChange={e => handleFileChange(e, field.id)} accept={field.accept} />
                                                    <small className="text-muted d-block mt-1">Format: Khusus PDF (.pdf) - Maks. 5 MB</small>
                                                </div>
                                                {errors[field.id] && <div className="text-danger small mt-1">{errors[field.id]}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN 2: ALAMAT & LAHAN */}
                        <div className="gform-card">
                            <div className="gform-card-header">
                                <h4 className="gform-section-title">Bagian 2: Alamat, Geografis Lahan & Tata Ruang</h4>
                            </div>
                            <div className="gform-body">
                                <div className="row gx-3 gy-2">
                                    <div className="col-md-6 d-flex flex-column">
                                        <label className="form-label-custom">Nama Rencana Usaha / Kegiatan</label>
                                        <input type="text" className="form-control border-secondary-subtle bg-light mt-auto" id="nama_rencana_usaha" value={data.nama_rencana_usaha} onChange={e => setData('nama_rencana_usaha', e.target.value)} placeholder="Masukkan nama rencana usaha di sini..." />
                                        {errors.nama_rencana_usaha && <div className="text-danger small mt-1">{errors.nama_rencana_usaha}</div>}
                                    </div>
                                    <div className="col-md-3 d-flex flex-column">
                                        <label className="form-label-custom">Kode Pos</label>
                                        <input type="text" className="form-control border-secondary-subtle mt-auto" id="kode_pos" value={data.kode_pos} onChange={e => setData('kode_pos', e.target.value.replace(/\D/g, ''))} placeholder="Masukkan kode pos..." />
                                        {errors.kode_pos && <div className="text-danger small mt-1">{errors.kode_pos}</div>}
                                    </div>
                                    <div className="col-md-3 d-flex flex-column">
                                        <label className="form-label-custom">Luas Lahan</label>
                                        <div className="input-group mt-auto">
                                            <input type="text" className="form-control border-secondary-subtle mt-auto" id="luas_lahan" value={data.luas_lahan} onChange={e => setData('luas_lahan', e.target.value.replace(/\D/g, ''))} placeholder="Masukkan luas lahan..." />
                                            <span className="input-group-text input-group-text-custom">m²</span>
                                        </div>
                                        {errors.luas_lahan && <div className="text-danger small mt-1">{errors.luas_lahan}</div>}
                                    </div>

                                    <div className="col-md-6 d-flex flex-column">
                                        <label className="form-label-custom">Alamat Lengkap Apotek</label>
                                        <textarea style={{ resize: "none" }} className="form-control border-secondary-subtle bg-light mt-auto" rows="2" id="alamat_lengkap" value={data.alamat_lengkap} onChange={e => setData('alamat_lengkap', e.target.value)} placeholder="Masukkan alamat lengkap apotek di sini..."></textarea>
                                        {errors.alamat_lengkap && <div className="text-danger small mt-1">{errors.alamat_lengkap}</div>}
                                    </div>
                                    <div className="col-md-6 d-flex flex-column">
                                        <label className="form-label-custom">Rincian Alamat Lokasi Kegiatan</label>
                                        <textarea style={{ resize: "none" }} className="form-control border-secondary-subtle bg-light mt-auto" rows="2" id="lokasi_alamat_lengkap" value={data.lokasi_alamat_lengkap} onChange={e => setData('lokasi_alamat_lengkap', e.target.value)} placeholder="Masukkan rincian alamat lokasi di sini..."></textarea>
                                        {errors.lokasi_alamat_lengkap && <div className="text-danger small mt-1">{errors.lokasi_alamat_lengkap}</div>}
                                    </div>

                                    <div className="col-md-6 d-flex flex-column">
                                        <label className="form-label-custom">Deskripsi Kegiatan Usaha</label>
                                        <textarea style={{ resize: "none" }} className="form-control border-secondary-subtle mt-auto" rows="2" id="deskripsi_kegiatan" value={data.deskripsi_kegiatan} onChange={e => setData('deskripsi_kegiatan', e.target.value)} placeholder="Masukkan deskripsi kegiatan di sini..."></textarea>
                                        {errors.deskripsi_kegiatan && <div className="text-danger small mt-1">{errors.deskripsi_kegiatan}</div>}
                                    </div>
                                    <div className="col-md-6 d-flex flex-column">
                                        <label className="form-label-custom">Deskripsi Kondisi Lokasi</label>
                                        <textarea style={{ resize: "none" }} className="form-control border-secondary-subtle mt-auto" rows="2" id="deskripsi_lokasi" value={data.deskripsi_lokasi} onChange={e => setData('deskripsi_lokasi', e.target.value)} placeholder="Masukkan deskripsi kondisi lokasi di sini..."></textarea>
                                        {errors.deskripsi_lokasi && <div className="text-danger small mt-1">{errors.deskripsi_lokasi}</div>}
                                    </div>

                                    {[
                                        { id: 'file_6', label: 'Peta Polygon Lahan', accept: '.zip', format: 'ZIP (.zip)' },
                                        { id: 'file_13', label: 'Data Kesesuaian Tata Ruang', accept: '.pdf', format: 'PDF (.pdf)' },
                                        { id: 'file_14', label: 'Peta Lokasi', accept: '.pdf', format: 'PDF (.pdf)' },
                                        { id: 'file_15', label: 'SHP Peta Tapak Proyek', accept: '.zip', format: 'ZIP (.zip)' }
                                    ].map(field => (
                                        <div className="col-md-6 d-flex flex-column" key={field.id}>
                                            <label className="form-label-custom text-dark mb-2"><i className="fas fa-paperclip text-secondary me-2"></i> {field.label} <span className="text-danger">*</span></label>
                                            <div className={`file-drop-box mt-auto ${data[field.id] ? 'has-file' : ''}`}>
                                                <input type="file" className="form-control bg-white shadow-sm mb-2" id={field.id} onChange={e => handleFileChange(e, field.id)} accept={field.accept} />
                                                <small className="text-muted d-block mt-1">Format: Khusus {field.format} - Maks. 5 MB</small>
                                            </div>
                                            {errors[field.id] && <div className="text-danger small mt-1">{errors[field.id]}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN 3: FINANSIAL */}
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
                                    ].map(field => (
                                        <div className="col-md-6 d-flex flex-column" key={field.id}>
                                            <label className="form-label-custom">{field.label}</label>
                                            <div className="input-group mt-auto">
                                                <span className="input-group-text input-group-text-custom">Rp</span>
                                                <input type="text" className="form-control border-secondary-subtle mt-auto" id={field.id} value={data[field.id]} onChange={e => setData(field.id, e.target.value.replace(/\D/g, ''))} placeholder={field.placeholder} />
                                            </div>
                                            {errors[field.id] && <div className="text-danger small mt-1">{errors[field.id]}</div>}
                                        </div>
                                    ))}

                                    <div className="col-md-12 d-flex flex-column">
                                        <label className="form-label-custom">Nilai Kapasitas / Omzet per Tahun</label>
                                        <div className="input-group mt-auto">
                                            <span className="input-group-text input-group-text-custom">Rp</span>
                                            <input type="text" className="form-control border-secondary-subtle mt-auto" id="omzet_pertahun" value={data.omzet_pertahun} onChange={e => setData('omzet_pertahun', e.target.value.replace(/\D/g, ''))} placeholder="Masukkan nominal omzet..." />
                                        </div>
                                        {errors.omzet_pertahun && <div className="text-danger small mt-1">{errors.omzet_pertahun}</div>}
                                    </div>

                                    <div className="col-md-12 d-flex flex-column">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <label className="form-label-custom mb-0">
                                                Jumlah Personel SDM Apotek <span className="text-danger">*</span>
                                            </label>
                                            <small className="text-muted"><i className="fas fa-info-circle me-1"></i>Ketik angka atau gunakan tombol <strong>+</strong> / <strong>-</strong></small>
                                        </div>
                                        <div className="row gx-3 gy-3">
                                            {/* SDM Laki-laki */}
                                            <div className="col-md-4">
                                                <div className="p-3 bg-white rounded-3 shadow-sm border text-center" style={{ borderColor: '#E2E8F0' }}>
                                                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
                                                            <i className="fas fa-male fs-5"></i>
                                                        </div>
                                                        <label htmlFor="sdm_laki" className="fw-bold text-dark mb-0 small">Laki-laki</label>
                                                    </div>
                                                    <div className="input-group input-group-sm mb-2" style={{ maxWidth: '170px', margin: '0 auto' }}>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary px-2 fw-bold" 
                                                            style={{ borderRadius: '8px 0 0 8px', borderColor: '#CBD5E1' }}
                                                            onClick={() => setData('sdm_laki', Math.max(0, (parseInt(data.sdm_laki) || 0) - 1))}
                                                            title="Kurangi"
                                                        >
                                                            <i className="fas fa-minus"></i>
                                                        </button>
                                                        <input 
                                                            type="text" 
                                                            className="form-control text-center fw-bold bg-white" 
                                                            id="sdm_laki" 
                                                            value={data.sdm_laki} 
                                                            onChange={e => setData('sdm_laki', e.target.value.replace(/\D/g, ''))}
                                                            placeholder="0"
                                                            style={{ fontSize: '1.05rem', borderColor: '#CBD5E1', color: '#0F172A' }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary px-2 fw-bold" 
                                                            style={{ borderRadius: '0 8px 8px 0', borderColor: '#CBD5E1' }}
                                                            onClick={() => setData('sdm_laki', (parseInt(data.sdm_laki) || 0) + 1)}
                                                            title="Tambah"
                                                        >
                                                            <i className="fas fa-plus"></i>
                                                        </button>
                                                    </div>
                                                    <div className="badge bg-light text-secondary border px-2 py-1 fw-normal" style={{ fontSize: '0.75rem' }}>
                                                        <i className="fas fa-user me-1 text-primary"></i> <strong>{data.sdm_laki || 0}</strong> Orang
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SDM Perempuan */}
                                            <div className="col-md-4">
                                                <div className="p-3 bg-white rounded-3 shadow-sm border text-center" style={{ borderColor: '#E2E8F0' }}>
                                                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                                                            <i className="fas fa-female fs-5"></i>
                                                        </div>
                                                        <label htmlFor="sdm_perempuan" className="fw-bold text-dark mb-0 small">Perempuan</label>
                                                    </div>
                                                    <div className="input-group input-group-sm mb-2" style={{ maxWidth: '170px', margin: '0 auto' }}>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary px-2 fw-bold" 
                                                            style={{ borderRadius: '8px 0 0 8px', borderColor: '#CBD5E1' }}
                                                            onClick={() => setData('sdm_perempuan', Math.max(0, (parseInt(data.sdm_perempuan) || 0) - 1))}
                                                            title="Kurangi"
                                                        >
                                                            <i className="fas fa-minus"></i>
                                                        </button>
                                                        <input 
                                                            type="text" 
                                                            className="form-control text-center fw-bold bg-white" 
                                                            id="sdm_perempuan" 
                                                            value={data.sdm_perempuan} 
                                                            onChange={e => setData('sdm_perempuan', e.target.value.replace(/\D/g, ''))}
                                                            placeholder="0"
                                                            style={{ fontSize: '1.05rem', borderColor: '#CBD5E1', color: '#0F172A' }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary px-2 fw-bold" 
                                                            style={{ borderRadius: '0 8px 8px 0', borderColor: '#CBD5E1' }}
                                                            onClick={() => setData('sdm_perempuan', (parseInt(data.sdm_perempuan) || 0) + 1)}
                                                            title="Tambah"
                                                        >
                                                            <i className="fas fa-plus"></i>
                                                        </button>
                                                    </div>
                                                    <div className="badge bg-light text-secondary border px-2 py-1 fw-normal" style={{ fontSize: '0.75rem' }}>
                                                        <i className="fas fa-user me-1 text-danger"></i> <strong>{data.sdm_perempuan || 0}</strong> Orang
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SDM TKA */}
                                            <div className="col-md-4">
                                                <div className="p-3 bg-white rounded-3 shadow-sm border text-center" style={{ borderColor: '#E2E8F0' }}>
                                                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                                                            <i className="fas fa-globe-asia fs-5"></i>
                                                        </div>
                                                        <label htmlFor="sdm_tka" className="fw-bold text-dark mb-0 small">Tenaga Asing (TKA)</label>
                                                    </div>
                                                    <div className="input-group input-group-sm mb-2" style={{ maxWidth: '170px', margin: '0 auto' }}>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary px-2 fw-bold" 
                                                            style={{ borderRadius: '8px 0 0 8px', borderColor: '#CBD5E1' }}
                                                            onClick={() => setData('sdm_tka', Math.max(0, (parseInt(data.sdm_tka) || 0) - 1))}
                                                            title="Kurangi"
                                                        >
                                                            <i className="fas fa-minus"></i>
                                                        </button>
                                                        <input 
                                                            type="text" 
                                                            className="form-control text-center fw-bold bg-white" 
                                                            id="sdm_tka" 
                                                            value={data.sdm_tka} 
                                                            onChange={e => setData('sdm_tka', e.target.value.replace(/\D/g, ''))}
                                                            placeholder="0"
                                                            style={{ fontSize: '1.05rem', borderColor: '#CBD5E1', color: '#0F172A' }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary px-2 fw-bold" 
                                                            style={{ borderRadius: '0 8px 8px 0', borderColor: '#CBD5E1' }}
                                                            onClick={() => setData('sdm_tka', (parseInt(data.sdm_tka) || 0) + 1)}
                                                            title="Tambah"
                                                        >
                                                            <i className="fas fa-plus"></i>
                                                        </button>
                                                    </div>
                                                    <div className="badge bg-light text-secondary border px-2 py-1 fw-normal" style={{ fontSize: '0.75rem' }}>
                                                        <i className="fas fa-globe me-1 text-success"></i> <strong>{data.sdm_tka || 0}</strong> Orang
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN 4: BERKAS FASILITAS */}
                        <div className="gform-card">
                            <div className="gform-card-header">
                                <h4 className="gform-section-title">Bagian 4: Persyaratan Umum</h4>
                            </div>
                            <div className="gform-body">
                                <div className="row gx-3 gy-2">
                                    {[
                                        { id: 'file_7', label: 'Dokumen Administrasi', accept: '.pdf' },
                                        { id: 'file_8', label: 'Dokumen Lokasi', accept: '.pdf' },
                                        { id: 'file_9', label: 'Dokumen Bangunan', accept: '.pdf' },
                                        { id: 'file_10', label: 'Dokumen Sarana & Prasarana', accept: '.pdf' },
                                        { id: 'file_11', label: 'Dokumen SDM (STR, KTP, SIPA, dll)', accept: '.pdf' }
                                    ].map(field => (
                                        <div className="col-md-6 d-flex flex-column" key={field.id}>
                                            <label className="form-label-custom text-dark mb-2"><i className="fas fa-paperclip text-secondary me-2"></i> {field.label} <span className="text-danger">*</span></label>
                                            <div className={`file-drop-box mt-auto ${data[field.id] ? 'has-file' : ''}`}>
                                                <input type="file" className="form-control bg-white shadow-sm mb-2" id={field.id} onChange={e => handleFileChange(e, field.id)} accept={field.accept} />
                                                <small className="text-muted d-block mt-1">Format: Khusus PDF (.pdf) - Maks. 5 MB</small>
                                            </div>
                                            {errors[field.id] && <div className="text-danger small mt-1">{errors[field.id]}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* BAGIAN TAMBAHAN */}
                        <div className="gform-card" style={{ borderTop: '6px solid #6c757d' }}>
                            <div className="gform-body">
                                <div className="mb-4">
                                    <label className="form-label-custom fs-6">Keterangan / Catatan Tambahan (Opsional)</label>
                                    <textarea style={{ resize: "none" }} className="form-control border-secondary-subtle mt-auto" rows="2" value={data.keterangan} onChange={e => setData('keterangan', e.target.value)}></textarea>
                                </div>
                                <div className="d-flex flex-column flex-md-row gap-3 justify-content-end align-items-center bg-light p-3 rounded border">
                                    <button type="submit" className="btn btn-draft-gform w-100" style={{ maxWidth: '250px' }} onClick={() => { setActionType('draft'); actionTypeRef.current = 'draft'; }} disabled={processing}>
                                        <i className="fas fa-save me-2"></i> Simpan Draft
                                    </button>
                                    <button type="submit" className="btn btn-submit-gform w-100" style={{ maxWidth: '350px' }} onClick={() => { setActionType('submit'); actionTypeRef.current = 'submit'; }} disabled={processing}>
                                        <i className="fas fa-paper-plane me-2"></i> Submit Pengajuan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* FORM BAP (BERITA ACARA PEMERIKSAAN) */}
                        <div className="gform-card mt-4 mb-5">
                            <div className="gform-card-header">
                                <h5 className="gform-section-title"><i className="fas fa-file-signature me-2" style={{ color: 'var(--kfa-orange)' }}></i>Berita Acara Pemeriksaan (BAP)</h5>
                                <p className="gform-section-desc">Unggah dokumen BAP dari Dinas Kesehatan (Wajib tapi boleh menyusul).</p>
                            </div>
                            <div className="gform-body">
                                <div className="row gx-3 gy-2 mb-2">
                                    <div className="col-md-6">
                                        <label className="form-label-custom text-dark mb-1">
                                            <i className="fas fa-paperclip text-secondary me-2"></i> Dokumen BAP <span className="text-danger">*</span> <span className="text-muted fw-normal" style={{fontSize: '0.85rem'}}>(Wajib tapi boleh menyusul)</span>
                                        </label>
                                        <div>
                                            <div className={`file-drop-box ${data['file_16'] ? 'has-file' : ''}`}>
                                                <input type="file" className="form-control bg-white shadow-sm mb-2" id="file_16" onChange={e => handleFileChange(e, 'file_16')} accept=".pdf" />
                                                <small className="text-muted d-block mt-1">Format: Khusus PDF (.pdf) - Maks. 5 MB</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3 mt-3 border-top">
                                    <div className="text-center text-md-start">
                                        <small className="text-muted d-block"><i className="fas fa-info-circle text-primary me-1"></i> BAP dapat disusulkan tanpa harus mengubah data pengajuan lainnya.</small>
                                    </div>
                                    <button type="submit" className="btn btn-submit-gform text-nowrap shadow-sm" onClick={() => { setActionType('submit'); actionTypeRef.current = 'submit'; }} disabled={processing}>
                                        <i className="fas fa-upload me-2"></i> {processing ? 'MENGUNGGAH...' : 'SUBMIT BAP'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </CabangLayout>
    );
}
