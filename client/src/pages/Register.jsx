import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        email: '',
        no_whatsapp: '',
        password: '',
        role: 'user'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post('/api/auth/register', formData);
            if (res.data.success) {
                alert('Pendaftaran berhasil! Silakan login dengan akun baru Anda.');
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftar.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px', backgroundColor: 'var(--bg-main)' }}>
            
            <div className="fade-up" style={{ marginTop: '2vh', textAlign: 'center', marginBottom: '24px' }}>
                <h2>Buat Akun Baru</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bergabunglah dengan komunitas Jasa Warga Guntung Paikat.</p>
            </div>

            <div className="fade-up delay-1 clean-card" style={{ padding: '24px' }}>
                
                {error && (
                    <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Nama Lengkap</label>
                        <input 
                            type="text" 
                            name="nama_lengkap"
                            value={formData.nama_lengkap}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                            placeholder="Contoh: Budi Santoso"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Nomor WhatsApp Aktif</label>
                        <input 
                            type="text" 
                            name="no_whatsapp"
                            value={formData.no_whatsapp}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                            placeholder="Contoh: 08123456789"
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Hanya digunakan untuk komunikasi dengan pengguna lain.</p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Email</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                            placeholder="contoh@email.com"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Kata Sandi</label>
                        <input 
                            type="password" 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
                            placeholder="Minimal 6 karakter"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isLoading}
                        style={{ width: '100%', padding: '14px', fontSize: '1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                        {isLoading ? 'Memproses...' : 'DAFTAR SEKARANG'}
                    </button>
                </form>
                
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Sudah punya akun? <span onClick={() => navigate('/login')} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Masuk di sini</span>
                    </p>
                </div>
                
            </div>
            
        </div>
    );
}
