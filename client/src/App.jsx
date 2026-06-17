import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LandingLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lengkapi-profil" element={<LengkapiProfil />} />
        <Route path="/beranda" element={<Beranda />} />
        <Route path="/buat-tugas" element={<BuatTugas />} />
        <Route path="/detail-tugas" element={<DetailTugas />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/riwayat" element={<Riwayat />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
