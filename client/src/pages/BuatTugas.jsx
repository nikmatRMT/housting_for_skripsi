import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

// Ikon kustom agar tidak bergantung pada aset lokal Leaflet
const customIcon = new L.DivIcon({
    html: `<div style="color: #E11D48;"><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

// Komponen kecil untuk menggeser (flyTo) peta setiap kali koordinat 'lokasi' berubah
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), { duration: 0.5 });
        }
    }, [center, map]);
    return null;
}

function MapClickHandler({ setLokasi, setIsLokasiTerkunci, lokasiAsli }) {
    useMapEvents({
        click(e) {
            if (!lokasiAsli) {
                alert("Wajib menyalakan fitur 'Deteksi Otomatis' terlebih dahulu sebelum menentukan lokasi pin.");
                return;
            }
            const distance = L.latLng(lokasiAsli[0], lokasiAsli[1]).distanceTo(e.latlng);
            if (distance > 100) {
                alert(`Pin ditolak! Jarak maksimum 100 meter dari lokasi GPS asli Anda (Jarak klik: ${Math.round(distance)} meter).`);
                return;
            }
            setLokasi([e.latlng.lat, e.latlng.lng]);
            setIsLokasiTerkunci(true);
        }
    });
    return null;
}

export default function BuatTugas() {
    const navigate = useNavigate();

    // Form States
    const [kategori, setKategori] = useState('jastip');
    const [deskripsi, setDeskripsi] = useState('');
    const [upahJasa, setUpahJasa] = useState('');
    const [talangan, setTalangan] = useState('');

    // Default Guntung Paikat
    const [lokasi, setLokasi] = useState([-3.440, 114.836]);
    const [lokasiAsli, setLokasiAsli] = useState(null); // Simpan GPS asli
    const [isLokasiTerkunci, setIsLokasiTerkunci] = useState(false);
    const [isMemuatLokasi, setIsMemuatLokasi] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDapatkanLokasi = () => {
        if (!navigator.geolocation) {
            alert('Maaf, browser Anda tidak mendukung fitur lokasi GPS.');
            return;
        }

        setIsMemuatLokasi(true);

        // Meminta izin GPS dan mengambil titik koordinat nyata pengguna
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLokasi([latitude, longitude]);
                setLokasiAsli([latitude, longitude]);
                setIsLokasiTerkunci(true);
                setIsMemuatLokasi(false);
            },
            (error) => {
                alert('Gagal mendapatkan lokasi. Pastikan Anda telah mengizinkan akses lokasi (Location/GPS) di browser Anda. Error: ' + error.message);
                setIsMemuatLokasi(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleTerbitkan = async (e) => {
        e.preventDefault();
        if (!isLokasiTerkunci) {
            alert('Tolong kunci lokasi Anda terlebih dahulu menggunakan tombol GPS!');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                pembuat_id: localStorage.getItem('myUserId'),
                kategori: kategori,
                deskripsi: deskripsi,
                upah_jasa: Number(upahJasa),
                nominal_talangan: kategori === 'jastip' ? Number(talangan || 0) : 0,
                latitude: lokasi[0],
                longitude: lokasi[1]
            };

            const response = await axios.post('/api/quests', payload);

            if (response.data.success) {
                alert('Tugas berhasil diterbitkan! Sistem akan mencarikan pekerja terdekat. PIN Rahasia Anda: ' + response.data.data.pin_rahasia);
                navigate('/beranda');
            }
        } catch (error) {
            console.error('Gagal menerbitkan tugas:', error);
            // Menangkap pesan error khusus dari backend (misalnya validasi 1 tugas aktif)
            if (error.response && error.response.data && error.response.data.message) {
                alert('GAGAL: ' + error.response.data.message);
            } else {
                alert('Terjadi kesalahan sistem saat menghubungi server.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fade-up" style={{ padding: '24px', paddingBottom: '90px' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <h2 style={{ fontSize: '1.4rem' }}>Buat Tugas Baru</h2>
            </header>

            <form onSubmit={handleTerbitkan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Geolocation Section */}
                <div className="clean-card" style={{ padding: '16px' }}>
                    <p style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)' }}>Lokasi Pengerjaan (GPS)</p>

                    <div style={isMapExpanded ? {
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, backgroundColor: '#fff'
                    } : {
                        height: '250px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)', marginBottom: '12px', position: 'relative', zIndex: 1
                    }}>

                        <MapContainer center={lokasi} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>

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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsMapExpanded(!isMapExpanded);
                                            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
                                        }}
                                        style={{ padding: '8px 12px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                    >
                                        {isMapExpanded ? '↙️ Perkecil Peta' : '🔍 Perbesar Layar'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDapatkanLokasi();
                                        }}
                                        disabled={isMemuatLokasi}
                                        style={{ padding: '8px 12px', backgroundColor: '#fff', color: 'var(--primary)', border: '2px solid var(--primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                                    >
                                        {isMemuatLokasi ? 'Mencari...' : '📍 Deteksi Otomatis'}
                                    </button>
                                </div>
                            </div>

                            <MapUpdater center={lokasi} />
                            <MapClickHandler setLokasi={setLokasi} setIsLokasiTerkunci={setIsLokasiTerkunci} lokasiAsli={lokasiAsli} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker
                                draggable={true}
                                eventHandlers={{
                                    dragend: (e) => {
                                        if (!lokasiAsli) {
                                            alert("Wajib menyalakan fitur 'Deteksi Otomatis' terlebih dahulu sebelum menentukan lokasi pin.");
                                            setLokasi([-3.440, 114.836]);
                                            return;
                                        }
                                        const marker = e.target;
                                        const pos = marker.getLatLng();
                                        const distance = L.latLng(lokasiAsli[0], lokasiAsli[1]).distanceTo(pos);
                                        
                                        if (distance > 100) {
                                            alert(`Pin ditolak! Jarak maksimum 100 meter dari lokasi GPS asli Anda (Jarak geser: ${Math.round(distance)} meter).`);
                                            setLokasi([...lokasiAsli]); // Kembali ke titik GPS asli
                                        } else {
                                            setLokasi([pos.lat, pos.lng]);
                                            setIsLokasiTerkunci(true);
                                        }
                                    }
                                }}
                                position={lokasi}
                                icon={customIcon}
                            >
                                <Popup>{isLokasiTerkunci ? 'Lokasi dikunci. Jarak geser maksimal 100m.' : 'Klik Deteksi Otomatis dulu.'}</Popup>
                            </Marker>
                            {isLokasiTerkunci && (
                                <Circle center={lokasi} pathOptions={{ fillColor: '#10B981', color: '#10B981' }} radius={1000} />
                            )}
                        </MapContainer>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Pekerja dalam radius 1 KM akan melihat titik ini. Jika titik GPS kurang presisi, Anda bisa <b>menggeser pin</b> maksimal 100 meter dari lokasi aslinya.
                    </p>
                </div>

                {/* Form Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600' }}>Kategori Tugas</label>
                    <select value={kategori} onChange={(e) => setKategori(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem', backgroundColor: '#fff' }}>
                        <option value="jastip">Jasa Titip (Belanja / Antar)</option>
                        <option value="fisik">Bantuan Fisik (Angkat Barang)</option>
                        <option value="perbaikan">Perbaikan Ringan</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600' }}>Deskripsi Tugas</label>
                    <textarea
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        placeholder="Contoh: Tolong belikan nasi goreng di depan gang, pedas sedang..."
                        rows="3"
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem', resize: 'none' }}
                        required
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600' }}>Upah Lelah Pekerja (Rp)</label>
                    <input
                        type="number"
                        value={upahJasa}
                        onChange={(e) => setUpahJasa(e.target.value)}
                        placeholder="Contoh: 5000"
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                        required
                    />
                </div>

                {kategori === 'jastip' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontWeight: '600' }}>Dana Talangan Pekerja (Rp) - <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Opsional</span></label>
                        <input
                            type="number"
                            value={talangan}
                            onChange={(e) => setTalangan(e.target.value)}
                            placeholder="Contoh: 15000"
                            style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maksimal talangan akun Anda: Rp 20.000</p>
                    </div>
                )}

                <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', borderLeft: '4px solid var(--accent)', marginTop: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', lineHeight: '1.5' }}><strong>Perhatian:</strong> Pastikan upah sepadan dengan beban fisik/jarak. Sistem akan mempublikasikan tugas ini ke warga terdekat.</p>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Mengirim ke Sistem...' : 'Terbitkan Tugas'}
                </button>
            </form>
        </div>
    );
}
