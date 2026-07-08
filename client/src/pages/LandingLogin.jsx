import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';

export default function LandingLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Cek sesi aktif saat pertama kali dibuka untuk auto-redirect
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const guestMode = localStorage.getItem('guestMode') === 'true';

        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            if (role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/beranda', { replace: true });
            }
        } else if (guestMode) {
            navigate('/beranda', { replace: true });
        }
    }, [navigate]);

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

                // Simpan email terakhir untuk mempermudah login berikutnya
                localStorage.setItem('rememberedEmail', email);

                // Simpan token dan data user asli
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('myUserId', res.data.user.id);
                localStorage.setItem('userRole', res.data.user.role);

                // Set default authorization header untuk request selanjutnya
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

                // Arahkan berdasarkan role pengguna
                if (res.data.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/beranda');
                }
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

            {/* Hero / Branding Area */}
            <div className="fade-up" style={{ marginTop: '6vh', textAlign: 'center' }}>
                <div style={{ margin: '0 auto 20px', width: 'fit-content' }}>
                    <Logo size={64} />
                </div>

                <h1 style={{ fontSize: 'clamp(2rem, 8vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '8px' }}>
                    Jasa Warga
                </h1>
                <p style={{ color: 'var(--text-main)', fontWeight: '500', fontSize: 'var(--text-subheading)' }}>
                    Kelurahan Guntung Paikat
                </p>
                <p style={{ marginTop: '12px', fontSize: '14px', padding: '0 16px', color: 'var(--text-muted)', lineHeight: '1.55' }}>
                    Masuk ke akun Anda untuk mulai meminta atau memberikan bantuan.
                </p>
            </div>

            {/* Login Form Card */}
            <div className="fade-up delay-2" style={{ marginTop: 'auto', marginBottom: '24px' }}>
                <div className="clean-card" style={{ padding: '24px' }}>

                    {error && (
                        <div className="error-box" style={{ marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input"
                                placeholder="contoh@email.com"
                                id="login-email"
                            />
                            {email.length > 0 && !email.includes('@') && (
                                <div className="speech-bubble" style={{ color: '#EF4444', display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                    <span>Format email salah! Harap sertakan simbol '@' (contoh: nama@email.com).</span>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label className="form-label">Kata Sandi</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="form-input"
                                    placeholder="Masukkan kata sandi"
                                    id="login-password"
                                    style={{ paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '4px',
                                    }}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                            {password.length > 0 && password.length < 6 && (
                                <div className="speech-bubble" style={{ color: '#EF4444', display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                    <span>Kata sandi terlalu pendek! Minimal adalah 6 karakter.</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                            id="login-submit"
                        >
                            {isLoading ? 'Memproses...' : 'MASUK'}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            Belum punya akun?{' '}
                            <span
                                onClick={() => navigate('/register')}
                                style={{ color: 'var(--accent-green)', fontWeight: '700', cursor: 'pointer', borderBottom: '2px solid var(--accent-green)' }}
                            >
                                Daftar Sekarang
                            </span>
                        </p>
                    </div>

                    <hr className="divider-mist" style={{ margin: '20px 0' }} />

                    <button
                        className="btn btn-outline"
                        onClick={handleGuest}
                        id="login-guest"
                    >
                        Masuk sebagai Tamu (Lihat-lihat dulu)
                    </button>

                </div>
            </div>

            {/* Footer accent */}
            <div style={{
                backgroundColor: 'var(--accent-yellow)',
                margin: '0 -24px -32px',
                padding: '14px 24px',
                textAlign: 'center',
                borderTop: '2px solid var(--border-ink)'
            }}>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '500' }}>
                    Aplikasi Skripsi — Layanan Jasa Berbasis Proximity
                </p>
            </div>

        </div>
    );
}
