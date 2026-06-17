import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

export default function Beranda() {
    const navigate = useNavigate();
    const isGuest = localStorage.getItem('guestMode') === 'true';
    const MY_USER_ID = localStorage.getItem('myUserId');

    const [quests, setQuests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuest, setSelectedQuest] = useState(null);
    const [stats, setStats] = useState({
        incomeToday: 0,
        incomeMonth: 480000, // Default demo jika kosong
        questsMonth: 47,
        distanceTodayKm: 0
    });

    useEffect(() => {
        if (!isGuest) {
            axios.get(`/api/quests/my-stats?user_id=${MY_USER_ID}`)
                .then(res => {
                    if (res.data.success) {
                        setStats(res.data.data);
                    }
                })
                .catch(err => console.error("Gagal load stats:", err));
        }
    }, [isGuest, MY_USER_ID]);

    useEffect(() => {
        const fetchQuests = async (lat, lng) => {
            try {
                const res = await axios.get(`/api/quests/nearby?latitude=${lat}&longitude=${lng}`);
                if (res.data.success) {
                    setQuests(res.data.data);
                }
            } catch (err) {
                console.error("Gagal mengambil data tugas:", err);
            } finally {
                setIsLoading(false);
            }
        };

        // Otomatis mencari tugas di sekitar berdasarkan GPS asli
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchQuests(pos.coords.latitude, pos.coords.longitude),
                (err) => {
                    console.warn("GPS Ditolak/Gagal, menggunakan lokasi default.");
                    fetchQuests(-3.440, 114.836); // Default Banjarbaru
                }
            );
        } else {
            fetchQuests(-3.440, 114.836);
        }
    }, []);

    const handleDeleteQuest = async (questId) => {
        if (!window.confirm("Yakin ingin membatalkan dan menghapus tugas ini secara permanen?")) return;
        
        try {
            const res = await axios.delete(`/api/quests/${questId}`, {
                data: { pembuat_id: MY_USER_ID }
            });
            
            if (res.data.success) {
                alert(res.data.message);
                // Langsung hapus dari tampilan tanpa perlu refresh halaman
                setQuests(quests.filter(q => q._id !== questId));
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.message) {
                alert('GAGAL: ' + err.response.data.message);
            } else {
                alert('Terjadi kesalahan sistem saat mencoba menghapus.');
            }
        }
    };

    const handleTakeQuest = async (questId) => {
        try {
            const res = await axios.put(`/api/quests/${questId}/take`, { pekerja_id: MY_USER_ID });
            if (res.data.success) {
                alert('Berhasil! Segera laksanakan tugas ini.');
                navigate('/detail-tugas');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengambil tugas. Mungkin sudah diambil orang lain.');
            setQuests(quests.filter(q => q._id !== questId));
            setSelectedQuest(null);
        }
    };

    // --- Perhitungan Gamifikasi ---
    const targetHarian = 50000;
    const progressPersen = Math.min(100, Math.round((stats.incomeToday / targetHarian) * 100));
    
    // Asumsi rata-rata: 1 Km = ~1300 langkah
    const langkah = Math.round(stats.distanceTodayKm * 1300);
    // Asumsi rata-rata: 1 Km = ~55 Kalori jalan kaki
    const kalori = Math.round(stats.distanceTodayKm * 55);

    return (
        <div className="fade-up" style={{ paddingBottom: '90px' }}>
            
            {/* Header Utama */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 20px 16px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '4px' }}>Tugas di Sekitar Anda</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Filter Radius: Maks 1 km</p>
                </div>
                <button style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            </header>

            <div style={{ padding: '16px 20px' }}>
                
                {/* Tombol Buat Tugas Baru (Hanya Muncul Jika Login) */}
                {!isGuest && (
                    <button 
                        onClick={() => navigate('/buat-tugas')} 
                        className="btn" 
                        style={{ marginBottom: '16px', padding: '12px', fontSize: '1rem', backgroundColor: 'var(--secondary)', color: 'white' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Buat Permintaan Bantuan Baru
                    </button>
                )}

                {/* Kartu Penghasilan (Dark Blue) */}
                <div style={{ backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ padding: '20px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            REKAP UANG TUNAI (HARI INI)
                        </p>
                        <h1 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '4px' }}>Rp {stats.incomeToday.toLocaleString('id-ID')}</h1>
                        <p style={{ fontSize: '0.85rem', color: '#BFDBFE', lineHeight: '1.4' }}>Hanya visualisasi uang tunai yang diterima berdasarkan tarif aplikasi. Dapat menjadi patokan <strong>Peringkat Kontribusi</strong> ke depannya.</p>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.7rem', color: '#93C5FD', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>TOTAL BULAN INI</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>Rp {stats.incomeMonth.toLocaleString('id-ID')}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.7rem', color: '#93C5FD', fontWeight: '600' }}>Tugas Selesai</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>{stats.questsMonth}</p>
                        </div>
                    </div>
                </div>

                {/* Kartu Target Sampingan */}
                <div className="clean-card" style={{ padding: '16px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>TARGET SAMPINGAN HARI INI</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>{progressPersen}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '6px', marginBottom: '12px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPersen}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '6px', transition: 'width 1s ease-out' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-main)' }}><strong>Rp {stats.incomeToday.toLocaleString('id-ID')}</strong> terkumpul</span>
                        <span style={{ color: 'var(--text-muted)' }}>target <strong>Rp {targetHarian.toLocaleString('id-ID')}</strong></span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                        {progressPersen >= 100 ? "Luar biasa! Targetmu hari ini sudah tercapai. 🎉" : "Terus semangat mengejar target harianmu!"}
                    </p>
                </div>

                {/* Kartu Aktivitas Fisik */}
                <div className="clean-card" style={{ padding: '16px', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>AKTIVITAS FISIKMU HARI INI</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{ flex: 1, borderRight: '1px solid var(--border-light)' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{langkah.toLocaleString('id-ID')}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Langkah</p>
                        </div>
                        <div style={{ flex: 1, borderRight: '1px solid var(--border-light)' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{kalori}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kalori</p>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{stats.distanceTodayKm}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Km</p>
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#F1F5F9', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Setara jogging santai 15 menit — sambil dapat uang!</p>
                    </div>
                </div>

                {/* Daftar Tugas Tersedia */}
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>TUGAS TERSEDIA ({quests.length})</p>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Mencari satelit dan tugas di sekitar...</p>
                    </div>
                ) : quests.length === 0 ? (
                    <div className="clean-card" style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-light)' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Belum ada permintaan bantuan dalam radius 1 KM dari lokasi Anda saat ini.</p>
                    </div>
                ) : (
                    quests.map((quest) => (
                        <div key={quest._id} className="clean-card" style={{ padding: '16px', marginBottom: '16px', border: '2px solid var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <div style={{ backgroundColor: 'var(--text-main)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                                    JARAK: {Math.round(quest.jarak_meter)} METER
                                </div>
                                {quest.pembuat_id === MY_USER_ID && (
                                    <div style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid var(--primary)' }}>
                                        TUGAS MILIK ANDA
                                    </div>
                                )}
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>{quest.kategori}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px' }}>{quest.deskripsi}</p>
                            
                            <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>Upah Lelah:</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>Rp {quest.upah_jasa.toLocaleString('id-ID')}</span>
                            </div>

                            {quest.nominal_talangan > 0 && (
                                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '10px', textAlign: 'center', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Minta Ditalangi Dulu</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#E11D48' }}>Rp {quest.nominal_talangan.toLocaleString('id-ID')}</p>
                                </div>
                            )}

                            {quest.pembuat_id === MY_USER_ID ? (
                                <button onClick={() => handleDeleteQuest(quest._id)} className="btn" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: 'bold', border: '1px solid #F87171' }}>
                                    BATALKAN TUGAS (Hapus)
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setSelectedQuest(quest)} 
                                    className="btn btn-primary" 
                                    style={{ backgroundColor: 'var(--text-main)', padding: '14px' }}
                                >
                                    LIHAT DETAIL
                                </button>
                            )}
                        </div>
                    ))
                )}

                {/* Footer Keterangan */}
                <div style={{ border: '1px dashed var(--border-light)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Urutan ditentukan oleh Algoritma Haversine ($geoNear) — tugas paling dekat & sepadan tampil lebih dulu.
                    </p>
                </div>

            </div>

            {/* MODAL DETAIL TUGAS */}
            {selectedQuest && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="clean-card fade-up" style={{ padding: '24px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>{selectedQuest.kategori}</h3>
                            <button onClick={() => setSelectedQuest(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        
                        <div style={{ height: '180px', backgroundColor: '#e2e8f0', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
                            <MapContainer center={[selectedQuest.lokasi.coordinates[1], selectedQuest.lokasi.coordinates[0]]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[selectedQuest.lokasi.coordinates[1], selectedQuest.lokasi.coordinates[0]]}></Marker>
                            </MapContainer>
                        </div>

                        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.5' }}>{selectedQuest.deskripsi}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed var(--border-light)', paddingBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upah Lelah</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Rp {selectedQuest.upah_jasa.toLocaleString('id-ID')}</span>
                        </div>
                        {selectedQuest.nominal_talangan > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px dashed var(--border-light)', paddingBottom: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dana Talangan</span>
                                <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#E11D48' }}>Rp {selectedQuest.nominal_talangan.toLocaleString('id-ID')}</span>
                            </div>
                        )}

                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
                            <p style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>⚠️</span> INFORMASI PEMBAYARAN
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#991B1B', lineHeight: '1.4' }}>
                                Pembayaran bersifat <strong>TUNAI / C.O.D</strong> saat bertatap muka. Pembayaran menggunakan QRIS, E-Wallet, atau kesepakatan bonus tambahan adalah murni <strong>urusan privat</strong> di luar tanggung jawab aplikasi. <br/><br/><strong>Catatan:</strong> Jika uang yang diberikan lebih besar, sistem hanya akan mencatat riwayat upah sesuai nominal yang tercantum di aplikasi ini.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setSelectedQuest(null)} className="btn" style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>BATAL</button>
                            {isGuest ? (
                                <button onClick={() => { alert('Anda harus Login/Daftar akun sungguhan untuk bisa mengambil tugas dan mendapatkan uang!'); navigate('/login'); }} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--border-light)', color: 'var(--text-muted)', border: 'none', fontWeight: 'bold' }}>LOGIN UNTUK AMBIL</button>
                            ) : (
                                <button onClick={() => handleTakeQuest(selectedQuest._id)} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--primary)' }}>AMBIL TUGAS</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
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
                <div onClick={() => navigate('/beranda')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-main)', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Beranda</span>
                </div>
                <div onClick={() => navigate('/detail-tugas')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--border-light)', cursor: 'pointer' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-light)', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Tugas Aktif</span>
                </div>
                <div onClick={() => navigate('/profil')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--border-light)', cursor: 'pointer' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-light)', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Profil</span>
                </div>
            </nav>
        </div>
    );
}
