import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profil() {
    const navigate = useNavigate();
    const isGuest = localStorage.getItem('guestMode') === 'true';
    const MY_USER_ID = localStorage.getItem('myUserId');

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(!isGuest);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editWA, setEditWA] = useState('');

    useEffect(() => {
        if (!isGuest) {
            axios.get(`/api/users/profile?user_id=${MY_USER_ID}`)
                .then(res => {
                    if (res.data.success) {
                        setProfile(res.data.data);
                        setEditName(res.data.data.nama_lengkap);
                        setEditWA(res.data.data.no_whatsapp);
                    }
                })
                .catch(err => console.error("Gagal load profil:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isGuest, MY_USER_ID]);

    const handleSaveProfile = () => {
        setIsLoading(true);
        axios.put('/api/users/profile', { user_id: MY_USER_ID, nama_lengkap: editName, no_whatsapp: editWA })
            .then(res => {
                if (res.data.success) {
                    setProfile(res.data.data);
                    setIsEditing(false);
                    alert('Profil berhasil diperbarui!');
                }
            })
            .catch(err => alert("Gagal memperbarui profil: " + err.response?.data?.message))
            .finally(() => setIsLoading(false));
    };

    const handleLogout = () => {
        if (window.confirm('Yakin ingin keluar?')) {
            localStorage.removeItem('guestMode');
            localStorage.removeItem('token');
            localStorage.removeItem('myUserId');
            localStorage.removeItem('userRole');
            navigate('/login');
        }
    };

    return (
        <div className="fade-up" style={{ paddingBottom: '90px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>

            {/* Header */}
            <header style={{ padding: '24px 20px 16px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '4px' }}>Profil Akun</h2>
            </header>

            <div style={{ padding: '24px 20px' }}>
                <div className="clean-card" style={{ padding: '24px', textAlign: 'center', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
                    <div
                        onClick={() => !isGuest && alert('Fitur upload foto belum aktif untuk menghemat penyimpanan server.')}
                        style={{ width: '80px', height: '80px', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '40px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        {!isGuest && (
                            <div style={{ position: 'absolute', bottom: '0', right: '0', background: '#4F46E5', borderRadius: '50%', padding: '4px', border: '2px solid #fff' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                            </div>
                        )}
                    </div>

                    {isGuest ? (
                        <>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>Pengguna Tamu</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Anda saat ini dalam mode lihat-lihat.</p>
                        </>
                    ) : isLoading ? (
                        <p>Memuat profil...</p>
                    ) : profile ? (
                        <>
                            {isEditing ? (
                                <div style={{ marginBottom: '16px' }}>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="form-input"
                                        style={{ textAlign: 'center', marginBottom: '8px' }}
                                        placeholder="Nama Lengkap"
                                    />
                                    <input
                                        type="text"
                                        value={editWA}
                                        onChange={(e) => setEditWA(e.target.value)}
                                        className="form-input"
                                        style={{ textAlign: 'center' }}
                                        placeholder="Nomor WA (contoh: 0812...)"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                                        {profile.nama_lengkap}
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        {profile.email}
                                    </p>
                                </>
                            )}
                            <span style={{ backgroundColor: '#D1FAE5', color: '#059669', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Akun Terverifikasi</span>

                            {/* KARTU PENDAPATAN (UANG TUNAI) */}
                            <div style={{ marginTop: '24px', backgroundColor: 'var(--primary)', color: '#fff', padding: '16px', borderRadius: '12px', textAlign: 'left', boxShadow: 'var(--shadow-soft)' }}>
                                <p style={{ fontSize: '0.8rem', color: '#93C5FD', marginBottom: '4px', fontWeight: '600' }}>TOTAL PENDAPATAN (UANG TUNAI)</p>
                                <h1 style={{ fontSize: '2rem', margin: 0, color: '#fff' }}>Rp {Number(profile.saldo || 0).toLocaleString('id-ID')}</h1>
                                <p style={{ fontSize: '0.75rem', color: '#BFDBFE', marginTop: '8px' }}>Uang yang sudah Anda terima langsung dari Klien</p>
                            </div>
                        </>
                    ) : (
                        <p>Gagal memuat profil.</p>
                    )}
                </div>

                {!isGuest && profile && (
                    <div className="clean-card" style={{ padding: '16px', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>PENGATURAN AKUN</h4>
                            <button
                                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                {isEditing ? 'SIMPAN PROFIL' : 'EDIT PROFIL'}
                            </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Nomor WhatsApp</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{profile.no_whatsapp}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Batas Talangan Klien</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Rp {profile.batas_talangan.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                )}

                {!isGuest && (
                    <div
                        onClick={() => navigate('/riwayat')}
                        className="clean-card"
                        style={{ padding: '16px', marginBottom: '24px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <div>
                            <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Riwayat Tugas</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Lihat tugas yang selesai & transaksi uang</p>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>→</span>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #F87171', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    {isGuest ? 'KEMBALI KE LOGIN' : 'LOGOUT (KELUAR)'}
                </button>

            </div>

            {/* Navigasi Bawah */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '430px',
                background: '#fff',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-around',
                padding: '12px 0',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                zIndex: 10
            }}>
                <div onClick={() => navigate('/beranda')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--border-light)', cursor: 'pointer' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-light)', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Beranda</span>
                </div>
                <div onClick={() => navigate('/detail-tugas')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--border-light)', cursor: 'pointer' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-light)', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Tugas Aktif</span>
                </div>
                <div onClick={() => navigate('/profil')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-main)', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Profil</span>
                </div>
            </nav>
        </div>
    );
}
