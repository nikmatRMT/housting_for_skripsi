import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LandingLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/auth/login', { email, password });
            if (res.data.success) {
                // Hapus mode tamu dan dummy
                localStorage.removeItem('guestMode');
                localStorage.removeItem('dummyUserId');
                
                // Simpan token dan data user asli
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('myUserId', res.data.user.id);
                localStorage.setItem('userRole', res.data.user.role);
                
                // Set default authorization header untuk request selanjutnya
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                
                // Arahkan ke beranda
                navigate('/beranda');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat login.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuest = () => {
        localStorage.setItem('guestMode', 'true');
        navigate('/beranda');
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px', backgroundColor: 'var(--bg-main)' }}>
            
            {/* Logo / Header Area */}
            <div className="fade-up" style={{ marginTop: '4vh', textAlign: 'center' }}>
                <div style={{ 
                    width: '72px', 
                    height: '72px', 
                    backgroundColor: 'var(--primary)', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: 'var(--shadow-soft)'
                }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                
                <h1>Jasa Warga</h1>
                <p style={{ color: 'var(--text-main)', fontWeight: '500', fontSize: '1.1rem' }}>
                    Kelurahan Guntung Paikat
                </p>
                <p style={{ marginTop: '8px', fontSize: '0.9rem', padding: '0 8px', color: 'var(--text-muted)' }}>
                    Masuk ke akun Anda untuk mulai meminta atau memberikan bantuan.
                </p>
            </div>

            {/* Action Area */}
            <div className="fade-up delay-2" style={{ marginTop: 'auto', marginBottom: '24px' }}>
                <div className="clean-card" style={{ padding: '24px' }}>
                    
                    {error && (
                        <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                                placeholder="contoh@email.com"
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Kata Sandi</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                                placeholder="Masukkan kata sandi"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={isLoading}
                            style={{ width: '100%', padding: '14px', fontSize: '1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                            {isLoading ? 'Memproses...' : 'MASUK'}
                        </button>
                    </form>
                    
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Belum punya akun? <span onClick={() => navigate('/register')} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Daftar Sekarang</span>
                        </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-light)', margin: '20px 0' }}></div>
                    
                    <button 
                        className="btn" 
                        onClick={handleGuest}
                        style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '12px' }}>
                        Masuk sebagai Tamu (Lihat-lihat dulu)
                    </button>
                    
                </div>
            </div>
            
        </div>
    );
}
