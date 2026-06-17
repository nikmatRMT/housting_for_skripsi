import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet-routing-machine';

// Ikon kustom agar tidak bergantung pada aset lokal Leaflet
const customIcon = new L.DivIcon({
    html: `<div style="color: #E11D48;"><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

function RoutingMachine({ userLoc, clientLoc }) {
    const map = useMap();

    useEffect(() => {
        if (!userLoc || !clientLoc) return;
        
        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLoc[0], userLoc[1]),
                L.latLng(clientLoc[0], clientLoc[1])
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            show: false,
            lineOptions: {
                styles: [{ color: '#3B82F6', weight: 6, opacity: 0.8 }]
            },
            createMarker: function() { return null; } 
        }).addTo(map);

        return () => {
            if (map && routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [map, userLoc, clientLoc]);

    return null;
}

export default function DetailTugas() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [quest, setQuest] = useState(location.state?.quest || null);
    const [isLoading, setIsLoading] = useState(!quest);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [showSuccessUI, setShowSuccessUI] = useState(false);

    const MY_USER_ID = localStorage.getItem('myUserId');
    const pembuatIdString = quest ? (typeof quest.pembuat_id === 'object' ? quest.pembuat_id?._id : quest.pembuat_id) : null;
    const isKlien = pembuatIdString === MY_USER_ID;

    useEffect(() => {
        let watchId;
        if (quest && !isKlien) {
            if (navigator.geolocation) {
                watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        const newLoc = [pos.coords.latitude, pos.coords.longitude];
                        setUserLocation(newLoc);
                        // Kirim lokasi terbaru ke backend agar bisa dipantau klien
                        axios.put(`/api/quests/${quest._id}/location`, {
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude
                        }).catch(() => {});
                    },
                    (err) => console.log("Gagal ambil lokasi user"),
                    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
                );
            }
        } else if (quest && isKlien && quest.status === 'TAKEN') {
            // Polling untuk Klien setiap 5 detik agar mendapatkan lokasi live dari pekerja
            const interval = setInterval(async () => {
                try {
                    const res = await axios.get(`/api/quests/my-active?user_id=${MY_USER_ID}`);
                    if (res.data.success && res.data.data) {
                        const fetched = res.data.data;
                        if (fetched.pekerja_lokasi && fetched.pekerja_lokasi.latitude) {
                            setUserLocation([fetched.pekerja_lokasi.latitude, fetched.pekerja_lokasi.longitude]);
                        }
                    }
                } catch (e) {}
            }, 5000);
            return () => clearInterval(interval);
        }

        return () => {
            if (watchId && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [quest, isKlien, MY_USER_ID]);

    useEffect(() => {
        if (!quest) {
            const fetchMyActiveQuest = async () => {
                try {
                    const res = await axios.get(`/api/quests/my-active?user_id=${MY_USER_ID}`);
                    if (res.data.success) {
                        setQuest(res.data.data);
                    }
                } catch (err) {
                    console.log("Tidak ada tugas aktif");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMyActiveQuest();
        } else {
            setIsLoading(false);
        }
    }, [quest, MY_USER_ID]);

    const handleDeleteQuest = async () => {
        if (!window.confirm("Yakin ingin membatalkan dan menghapus tugas ini secara permanen?")) return;
        
        setIsSubmitting(true);
        try {
            const res = await axios.delete(`/api/quests/${quest._id}`, {
                data: { pembuat_id: MY_USER_ID }
            });
            if (res.data.success) {
                alert(res.data.message);
                setQuest(null);
                window.location.reload(); // Refresh halaman agar state kembali kosong
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Terjadi kesalahan sistem saat mencoba menghapus.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelesaikanTugas = async () => {
        if (!pinInput || pinInput.length !== 4) {
            alert('Masukkan 4-digit PIN dengan benar!');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await axios.put(`/api/quests/${quest._id}/complete`, { pin: pinInput });
            if (res.data.success) {
                setShowSuccessUI(true);
                setTimeout(() => {
                    navigate('/beranda');
                }, 2500);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyelesaikan tugas');
            setIsSubmitting(false);
        }
    };

    const toggleMapSize = (e) => {
        e.preventDefault();
        setIsMapExpanded(!isMapExpanded);
        // Memaksa Leaflet me-render ulang ukuran kanvasnya setelah animasi CSS selesai
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    };

    const BottomNav = () => (
        <nav style={{ 
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '430px', background: '#fff', borderTop: '1px solid var(--border-light)', 
            display: 'flex', justifyContent: 'space-around', padding: '12px 0',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', zIndex: 10
        }}>
            <div onClick={() => navigate('/beranda')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--border-light)', cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-light)', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Beranda</span>
            </div>
            <div onClick={() => navigate('/detail-tugas')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-main)', cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-main)', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Tugas Aktif</span>
            </div>
            <div onClick={() => navigate('/profil')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--border-light)', cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-light)', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Profil</span>
            </div>
        </nav>
    );

    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat data...</div>;
    }

    if (!quest) {
        return (
            <div className="fade-up" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '90px' }}>
                <header style={{ padding: '24px 20px 16px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '4px' }}>Tugas Aktif</h2>
                </header>
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: '#E2E8F0', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <span style={{ fontSize: '24px' }}>📋</span>
                    </div>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Belum Ada Tugas Aktif</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Anda tidak sedang membuat atau mengerjakan tugas apapun saat ini.</p>
                </div>
                <BottomNav />
            </div>
        );
    }

    // isKlien sudah dihitung di atas

    // Menentukan informasi pihak seberang untuk ditampilkan
    let otherPartyName = "Belum Diambil";
    if (isKlien) {
        if (quest.status === 'TAKEN' && typeof quest.pekerja_id === 'object' && quest.pekerja_id) {
            otherPartyName = quest.pekerja_id.nama_lengkap;
        } else {
            otherPartyName = "Menunggu Pekerja (Belum Diambil)";
        }
    } else {
        if (typeof quest.pembuat_id === 'object' && quest.pembuat_id) {
            otherPartyName = quest.pembuat_id.nama_lengkap;
        } else {
            otherPartyName = "Klien (Pembuat Tugas)";
        }
    }

    return (
        <div className="fade-up" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '90px' }}>
            
            {showSuccessUI && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#10B981', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '16px', animation: 'bounce 1s infinite' }}>🎉</div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px', textAlign: 'center' }}>TUGAS SELESAI!</h1>
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>Saldo Anda berhasil ditambahkan.</p>
                </div>
            )}

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: '#fff', borderBottom: '2px solid var(--text-main)' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid var(--border-light)', padding: '6px 12px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 'bold' }}>
                    &lt;
                </button>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Tugas Aktif</h2>
            </header>

            {/* Status Banner */}
            <div style={{ backgroundColor: '#F1F5F9', color: 'var(--text-main)', padding: '16px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: '700', fontSize: '0.9rem' }}>
                STATUS: SEDANG DIKERJAKAN
            </div>

            {/* Informasi Profil Pihak Terkait */}
            <div style={{ padding: '20px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', borderRadius: '24px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {isKlien ? `Pekerja: ${otherPartyName}` : `Klien: ${otherPartyName}`}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {isKlien ? (quest.status === 'TAKEN' ? 'Sedang menuju lokasi' : 'Menunggu...') : `📍 ${Math.round(quest.jarak_meter || 0)} meter dari Anda`}
                    </p>
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                {/* Detail Pekerjaan */}
                <div style={{ padding: '20px', backgroundColor: '#fff', border: '2px solid var(--text-main)', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.5px' }}>DETAIL TUGAS</h3>
                    
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Kategori</p>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: '800', textTransform: 'uppercase' }}>{quest.kategori}</h2>
                    
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Catatan dari Klien</p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '24px', lineHeight: '1.5' }}>{quest.deskripsi}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Upah Jasa</span>
                        <span style={{ color: 'var(--text-main)' }}>Rp {quest.upah_jasa.toLocaleString('id-ID')}</span>
                    </div>
                    {quest.nominal_talangan > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Talangan</span>
                            <span style={{ color: 'var(--text-main)' }}>Rp {quest.nominal_talangan.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: 'var(--text-main)', marginTop: quest.nominal_talangan > 0 ? 0 : '16px', paddingTop: quest.nominal_talangan > 0 ? 0 : '16px', borderTop: quest.nominal_talangan > 0 ? 'none' : '1px solid var(--border-light)' }}>
                        <span style={{ fontWeight: '800' }}>Total Tagihan</span>
                        <span style={{ fontWeight: '800' }}>Rp {(quest.upah_jasa + quest.nominal_talangan).toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* Map Interactive */}
                <div style={isMapExpanded ? {
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, backgroundColor: '#fff'
                } : { 
                    height: '250px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--border-light)', marginBottom: '24px', position: 'relative', zIndex: 1 
                }}>
                    
                    <MapContainer center={[quest.lokasi.coordinates[1], quest.lokasi.coordinates[0]]} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                        
                        {/* NATIVE LEAFLET CONTROLS */}
                        <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'none', padding: '10px' }}>
                            <div 
                                className="leaflet-control" 
                                style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', clear: 'both' }}
                                ref={(ref) => {
                                    if (ref) {
                                        L.DomEvent.disableClickPropagation(ref);
                                        L.DomEvent.disableScrollPropagation(ref);
                                    }
                                }}
                            >
                                <button 
                                    type="button"
                                    onClick={toggleMapSize}
                                    style={{ padding: '8px 12px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                >
                                    {isMapExpanded ? '↙️ Perkecil Peta' : '🔍 Perbesar Layar'}
                                </button>
                            </div>
                        </div>

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[quest.lokasi.coordinates[1], quest.lokasi.coordinates[0]]} icon={customIcon}>
                            <Popup>Titik Lokasi Klien</Popup>
                        </Marker>
                        {(!isKlien && userLocation) && (
                            <RoutingMachine userLoc={userLocation} clientLoc={[quest.lokasi.coordinates[1], quest.lokasi.coordinates[0]]} />
                        )}
                    </MapContainer>
                </div>

                {/* Tombol Arah Google Maps (Khusus Pekerja) */}
                {!isKlien && (
                    <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${quest.lokasi.coordinates[1]},${quest.lokasi.coordinates[0]}`, '_blank')}
                        className="btn" 
                        style={{ width: '100%', backgroundColor: '#DBEAFE', color: '#1D4ED8', border: '1px solid #93C5FD', fontWeight: 'bold', padding: '12px', borderRadius: '6px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                        Buka Arah (Jalur Biru) di Google Maps
                    </button>
                )}

                {/* Action Buttons / PIN Display */}
                {isKlien ? (
                    <div className="clean-card" style={{ padding: '20px', border: '2px dashed var(--primary)', textAlign: 'center', marginBottom: '24px' }}>
                        <p style={{ color: 'var(--primary)', fontWeight: '700', marginBottom: '8px' }}>PIN RAHASIA TUGAS INI:</p>
                        <h1 style={{ fontSize: '2.5rem', letterSpacing: '8px', color: 'var(--text-main)', marginBottom: '8px' }}>{quest.pin_rahasia}</h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Berikan PIN ini kepada Pekerja HANYA jika tugas telah diselesaikan dengan baik.</p>
                    </div>
                ) : (
                    <div className="clean-card" style={{ padding: '20px', border: '2px solid var(--border-light)', marginBottom: '24px' }}>
                        <p style={{ color: 'var(--text-main)', fontWeight: '700', marginBottom: '12px', textAlign: 'center' }}>INPUT PIN PENYELESAIAN</p>
                        <input 
                            type="text" 
                            maxLength="4"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="Minta PIN dari Klien"
                            style={{ width: '100%', padding: '16px', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px', borderRadius: '8px', border: '2px solid var(--border-light)', marginBottom: '16px' }}
                        />
                        <button 
                            onClick={handleSelesaikanTugas} 
                            disabled={isSubmitting}
                            className="btn btn-primary" 
                            style={{ backgroundColor: 'var(--text-main)', fontWeight: '700', padding: '16px', borderRadius: '8px', width: '100%' }}>
                            {isSubmitting ? 'Memproses...' : 'SELESAIKAN TUGAS'}
                        </button>
                    </div>
                )}

                <button className="btn btn-outline" style={{ border: '2px solid var(--text-main)', color: 'var(--text-main)', fontWeight: '700', marginBottom: '16px', padding: '16px', borderRadius: '4px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    CHAT WHATSAPP {isKlien ? 'PEKERJA' : 'KLIEN'}
                </button>

                {isKlien && (
                    <div style={{ textAlign: 'center' }}>
                        <button 
                            onClick={handleDeleteQuest}
                            disabled={isSubmitting || quest.status !== 'OPEN'}
                            style={{ 
                                background: 'none', border: 'none', textDecoration: 'underline', 
                                color: quest.status !== 'OPEN' ? 'var(--border-light)' : '#E11D48', 
                                fontSize: '0.85rem', 
                                cursor: quest.status !== 'OPEN' ? 'not-allowed' : 'pointer' 
                            }}>
                            {quest.status === 'OPEN' ? 'Batalkan Tugas (Hapus)' : 'Tugas sudah diambil (Tak bisa batal sepihak)'}
                        </button>
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
    );
}
