import { useNavigate } from 'react-router-dom';

export default function LengkapiProfil() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/beranda');
    };

    return (
        <div className="fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px', backgroundColor: 'var(--bg-main)', minHeight: '100vh' }}>
            
            <div style={{ marginTop: '10vh', textAlign: 'center' }}>
                <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    border: '2px solid var(--border-light)', 
                    backgroundColor: '#fff',
                    margin: '0 auto 24px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--primary)'
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                
                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-main)' }}>Tinggal Satu Langkah Lagi!</h2>
                
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6', textAlign: 'left', marginBottom: '32px' }}>
                    Halo, <strong>Budi</strong> (budi.s@gmail.com). Untuk menjaga keamanan warga Guntung Paikat dari akun fiktif, kami memerlukan nomor WhatsApp aktif Anda. <strong>Satu nomor hanya dapat digunakan untuk satu akun.</strong>
                </p>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                        NOMOR WHATSAPP
                    </label>
                    <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fff', marginBottom: '12px' }}>
                        <div style={{ backgroundColor: 'var(--primary)', color: '#fff', padding: '14px 16px', fontWeight: '700' }}>
                            +62
                        </div>
                        <input 
                            type="tel" 
                            placeholder="81234567890" 
                            style={{ flex: 1, border: 'none', padding: '14px', fontSize: '1.05rem', outline: 'none' }}
                            required
                        />
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '32px' }}>
                        Pastikan nomor ini aktif. Pekerja akan menghubungi Anda via nomor ini saat mengerjakan tugas.
                    </p>

                    <button type="submit" className="btn btn-primary" style={{ padding: '16px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Simpan & Masuk Aplikasi
                    </button>
                </form>
            </div>
            
        </div>
    );
}
