import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';

export default function PrintLaporan({ perizinans, startDate, endDate, unit, kodeSap, jenis }) {
    useEffect(() => {
        // Auto print after a short delay
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return dayjs(dateString).format('DD/MM/YYYY');
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return dayjs(dateString).format('DD/MM/YYYY HH:mm');
    };

    const total = perizinans.length;
    const selesai = perizinans.filter(p => ['completed', 'terbit_verifikasi'].includes(p.status)).length;
    const revisi = perizinans.filter(p => p.status === 'needs_revision').length;
    const proses = total - selesai - revisi;

    const getPercent = (val) => total === 0 ? '0%' : Math.round((val / total) * 100) + '%';

    return (
        <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: '#333', lineHeight: 1.4, margin: 0, padding: '20px' }}>
            <Head title="Cetak Laporan Statistik Pengajuan - KFA" />
            <style>{`
                body { padding: 0; margin: 0; background: white; }
                .header { text-align: center; border-bottom: 2px solid #0B132B; padding-bottom: 10px; margin-bottom: 20px; }
                .header h2 { margin: 0; color: #0B132B; text-transform: uppercase; }
                .header p { margin: 5px 0 0; font-size: 14px; color: #666; }
                .filters { margin-bottom: 20px; font-size: 13px; }
                .filters span { display: inline-block; margin-right: 20px; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
                th { background-color: #f5f5f5; color: #0B132B; font-weight: bold; }
                .text-center { text-align: center; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; }
                .status-success { background-color: #d1fae5; color: #065f46; border: 1px solid #10b981; }
                .status-warning { background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
                .status-info { background-color: #e0f2fe; color: #075985; border: 1px solid #0ea5e9; }
                .status-secondary { background-color: #f3f4f6; color: #374151; border: 1px solid #9ca3af; }
                .footer { margin-top: 30px; font-size: 11px; color: #666; text-align: right; font-style: italic; }
                
                @media print {
                    body { padding: 0; margin: 10mm; }
                    @page { margin: 10mm; size: landscape; }
                    button.btn-print { display: none; }
                }
                .btn-print { background-color: #0B132B; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; font-weight: bold; }
            `}</style>

            <button className="btn-print" onClick={() => window.print()}>Print Dokumen</button>

            <div className="header">
                <h2>Laporan Rekapitulasi Pengajuan Perizinan SIA</h2>
                <p>PT Kimia Farma Apotek - Portal Admin HQ</p>
            </div>

            <div className="filters">
                <strong>Filter Diterapkan:</strong><br />
                <span><strong>Tanggal:</strong> {startDate ? formatDate(startDate) : 'Awal'} s/d {endDate ? formatDate(endDate) : 'Sekarang'}</span>
                <span><strong>Wilayah/Bisnis:</strong> {unit || 'Semua Wilayah'}</span>
                <span><strong>Cabang/Apotek:</strong> {kodeSap || 'Semua Cabang'}</span>
                <span><strong>Jenis Perizinan:</strong> {jenis || 'Semua Jenis'}</span>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px 15px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', borderRadius: '6px' }}>
                <strong>Ringkasan Status:</strong>
                <span style={{ marginLeft: '20px' }}><strong>Selesai:</strong> {selesai} ({getPercent(selesai)})</span>
                <span style={{ marginLeft: '20px' }}><strong>Dalam Proses:</strong> {proses} ({getPercent(proses)})</span>
                <span style={{ marginLeft: '20px' }}><strong>Perlu Revisi:</strong> {revisi} ({getPercent(revisi)})</span>
                <span style={{ marginLeft: '20px' }}><strong>Total:</strong> {total} Pengajuan</span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="5%" className="text-center">No</th>
                        <th width="8%">ID</th>
                        <th width="15%">Nama Apotek</th>
                        <th width="10%">Kode SAP</th>
                        <th width="18%">Jenis Perizinan</th>
                        <th width="12%">Tanggal Pengajuan</th>
                        <th width="15%">Status Saat Ini</th>
                        <th width="17%">Update Terakhir</th>
                    </tr>
                </thead>
                <tbody>
                    {perizinans.length > 0 ? (
                        perizinans.map((p, index) => {
                            let statusClass = 'status-secondary';
                            let statusLabel = 'DRAFT';

                            if (['completed', 'terbit_verifikasi'].includes(p.status.toLowerCase())) {
                                statusClass = 'status-success';
                                statusLabel = 'SELESAI (TERBIT)';
                            } else if (p.status === 'needs_revision') {
                                statusClass = 'status-warning';
                                statusLabel = 'REVISI CABANG';
                            } else if (p.status !== 'draft') {
                                statusClass = 'status-info';
                                statusLabel = `PROSES (${p.status.replace(/_/g, ' ').toUpperCase()})`;
                            }

                            const lastUpdate = p.activity_logs && p.activity_logs.length > 0
                                ? p.activity_logs[0].created_at
                                : p.updated_at;

                            return (
                                <tr key={p.id}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>#{p.id}</td>
                                    <td><strong>{p.nama_apotek}</strong></td>
                                    <td>{p.user?.kode_sap || '-'}</td>
                                    <td>{p.jenis_perizinan}</td>
                                    <td>{p.tanggal_pengajuan ? formatDate(p.tanggal_pengajuan) : formatDate(p.created_at)}</td>
                                    <td>
                                        <span className={`badge ${statusClass}`}>{statusLabel}</span>
                                    </td>
                                    <td>{formatDateTime(lastUpdate)}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="8" className="text-center" style={{ padding: '20px' }}>
                                Tidak ada data pengajuan perizinan yang sesuai dengan filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '12px' }}>
                Total Data Ditemukan: {perizinans.length} Pengajuan
            </div>

            <div className="footer">
                Dicetak oleh Sistem KFA pada: {dayjs().format('DD/MM/YYYY HH:mm:ss')}
            </div>
        </div>
    );
}
