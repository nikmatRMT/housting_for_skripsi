import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import LandingLogin from './pages/LandingLogin';
import LengkapiProfil from './pages/LengkapiProfil';
import Beranda from './pages/Beranda';
import BuatTugas from './pages/BuatTugas';
import DetailTugas from './pages/DetailTugas';
import AdminDashboard from './pages/AdminDashboard';
import Profil from './pages/Profil';
import Register from './pages/Register';
import Riwayat from './pages/Riwayat';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Atur base URL API untuk production di Vercel
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

function MobileOnlyWrapper({ children }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [bypass, setBypass] = useState(localStorage.getItem('bypassMobileBlock') === 'true');

  useEffect(() => {
    const checkPlatform = () => {
      const isNative = Capacitor.isNativePlatform();
      const isWideScreen = window.innerWidth > 768;
      setIsDesktop(!isNative && isWideScreen);
    };

    checkPlatform();
    window.addEventListener('resize', checkPlatform);
    return () => window.removeEventListener('resize', checkPlatform);
  }, []);

  const handleBypass = () => {
    localStorage.setItem('bypassMobileBlock', 'true');
    setBypass(true);
  };

  if (isDesktop && !bypass) {
    return (
      <div style={{
        backgroundColor: 'var(--color-sandstone, #f7f4ed)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'var(--font-outfit, sans-serif)',
        color: 'var(--color-ink-black, #1e1e24)'
      }}>
        <div style={{
          backgroundColor: 'var(--surface, #ffffff)',
          border: '4px solid var(--border-ink, #1e1e24)',
          boxShadow: '8px 8px 0px var(--border-ink, #1e1e24)',
          borderRadius: 'var(--radius-small, 16px)',
          padding: '40px 30px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📱</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>AKSES WEBSITE DIBATASI</h1>
          <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-muted, #64748b)', marginBottom: '24px' }}>
            Sesuai ketentuan keamanan sistem Jasa Warga, halaman Klien dan Pekerja **hanya dapat diakses melalui Aplikasi Mobile Android/iOS**.<br/><br/>
            Halaman website ini khusus disediakan untuk panel kontrol **Administrator**.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/login" style={{
              display: 'block',
              textDecoration: 'none',
              backgroundColor: 'var(--color-sunshine-pop, #ffb000)',
              color: 'var(--color-ink-black, #1e1e24)',
              border: '2px solid var(--border-ink, #1e1e24)',
              padding: '12px',
              borderRadius: '50px',
              fontWeight: '700',
              boxShadow: '2px 2px 0px var(--border-ink, #1e1e24)',
              cursor: 'pointer'
            }}>MASUK SEBAGAI ADMIN / GUEST</a>
            
            <button onClick={handleBypass} style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#3b82f6',
              textDecoration: 'underline',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}>Bypass untuk Uji Coba Sidang</button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--text-main)',
          border: '2px solid var(--border-ink)',
          boxShadow: '4px 4px 0px var(--border-ink)',
          fontWeight: '600',
          borderRadius: 'var(--radius-small)'
        },
        success: { iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--bg-main)' } },
        error: { iconTheme: { primary: 'var(--accent-coral)', secondary: 'var(--bg-main)' } }
      }} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LandingLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lengkapi-profil" element={<LengkapiProfil />} />
        <Route path="/beranda" element={<MobileOnlyWrapper><Beranda /></MobileOnlyWrapper>} />
        <Route path="/buat-tugas" element={<MobileOnlyWrapper><BuatTugas /></MobileOnlyWrapper>} />
        <Route path="/detail-tugas" element={<MobileOnlyWrapper><DetailTugas /></MobileOnlyWrapper>} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/riwayat" element={<MobileOnlyWrapper><Riwayat /></MobileOnlyWrapper>} />
        <Route path="/profil" element={<MobileOnlyWrapper><Profil /></MobileOnlyWrapper>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
