import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Riwayat = () => {
    const navigate = useNavigate();
    const MY_USER_ID = localStorage.getItem('myUserId');
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!MY_USER_ID) {
            navigate('/login');
            return;
        }
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/quests/history?user_id=${MY_USER_ID}`);
            const data = await response.json();
            if (data.success) {
                setHistoryList(data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil riwayat:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '80px', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button 
                    onClick={() => navigate('/profil')} 
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-main)', cursor: 'pointer', marginRight: '10px' }}
                >
                    ←
                </button>
                <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Riwayat Tugas</h2>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Memuat riwayat...</p>
            ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📜</div>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Belum Ada Riwayat</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selesaikan tugas sebagai klien atau pekerja untuk melihat catatan riwayat di sini.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {historyList.map((quest) => {
                        const isKlien = quest.pembuat_id === MY_USER_ID;
                        const totalUang = quest.upah_jasa + (quest.nominal_talangan || 0);
                        
                        return (
                            <div key={quest._id} style={{
                                backgroundColor: 'var(--bg-card)',
                                padding: '16px',
                                borderRadius: '12px',
                                borderLeft: isKlien ? '4px solid #F59E0B' : '4px solid #10B981', // Kuning (Keluar Uang), Hijau (Dapat Uang)
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isKlien ? '#D97706' : '#059669', backgroundColor: isKlien ? '#FEF3C7' : '#D1FAE5', padding: '2px 8px', borderRadius: '12px' }}>
                                        {isKlien ? 'SAYA KLIEN' : 'SAYA PEKERJA'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(quest.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>{quest.kategori}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{quest.deskripsi}</p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-light)', paddingTop: '12px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Total Transaksi:</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: isKlien ? '#DC2626' : '#10B981' }}>
                                        {isKlien ? '-' : '+'} Rp {totalUang.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Riwayat;
