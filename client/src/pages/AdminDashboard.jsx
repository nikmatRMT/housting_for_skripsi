import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({ totalUsers: 0, activeQuests: 0, completedToday: 0, fictitiousOrders: 0 });
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // Menggunakan relative URL karena Vite Proxy sudah dikonfigurasi
                const statsRes = await axios.get('/api/admin/dashboard');
                if (statsRes.data.success) setStats(statsRes.data.data);
                
                const usersRes = await axios.get('/api/admin/users');
                if (usersRes.data.success) setUsers(usersRes.data.data);
            } catch (err) {
                console.error("Gagal memuat data admin:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    // Override pengaturan mobile view khusus untuk halaman admin
    useEffect(() => {
        const root = document.getElementById('root');
        if (root) {
            root.style.maxWidth = '100%';
            root.style.width = '100%';
        }
        return () => {
            // Kembalikan ke tampilan HP jika pindah ke halaman lain
            if (root) {
                root.style.maxWidth = '430px';
            }
        };
    }, []);

    const toggleStatus = async (userId) => {
        if (!window.confirm("Yakin ingin mengubah status pengguna ini?")) return;
        try {
            const res = await axios.put(`/api/admin/users/${userId}/toggle-status`);
            if (res.data.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, status: res.data.data.status } : u));
            }
        } catch (err) {
            alert(err.response?.data?.message || "Gagal mengubah status");
        }
    };

    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat data admin...</div>;
    }

    return (
        <div className="fade-up" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', width: '100vw', maxWidth: 'none' }}>
            
            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: '#fff', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: '800' }}>ADMINISTRATOR</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Micro-Tasking Panel</p>
                </div>
                
                <nav style={{ padding: '16px 0', flex: 1 }}>
                    <a href="#" style={{ display: 'block', padding: '16px 24px', backgroundColor: 'var(--primary)', color: '#fff', textDecoration: 'none', fontWeight: '600' }}>Dashboard</a>
                    <a href="#" style={{ display: 'block', padding: '16px 24px', color: 'var(--text-muted)', textDecoration: 'none' }}>Kelola Pengguna</a>
                    <a href="#" style={{ display: 'block', padding: '16px 24px', color: 'var(--text-muted)', textDecoration: 'none' }}>Pantau Transaksi</a>
                    <a href="#" style={{ display: 'block', padding: '16px 24px', color: 'var(--text-muted)', textDecoration: 'none' }}>Laporan Cetak</a>
                </nav>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
                    <a href="#" onClick={(e) => {e.preventDefault(); navigate('/');}} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Logout</a>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Topbar */}
                <header style={{ padding: '20px 32px', backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Selamat Datang, Admin</h2>
                    <div style={{ display: 'flex' }}>
                        <input type="text" placeholder="Cari pengguna, tugas, ID..." style={{ padding: '10px 16px', border: '1px solid var(--border-light)', outline: 'none', width: '250px' }} />
                        <button style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cari</button>
                    </div>
                </header>

                <div style={{ padding: '32px' }}>
                    
                    {/* Stat Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                        
                        <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid var(--border-light)', borderTop: '4px solid var(--primary)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px' }}>TOTAL PENGGUNA</p>
                            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '4px' }}>{stats.totalUsers}</h1>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Terdaftar di sistem</p>
                        </div>
                        
                        <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid var(--border-light)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px' }}>TUGAS BERJALAN</p>
                            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '4px' }}>{stats.activeQuests}</h1>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sedang dikerjakan</p>
                        </div>

                        <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid var(--border-light)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px' }}>SELESAI HARI INI</p>
                            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '4px' }}>{stats.completedToday}</h1>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transaksi sukses</p>
                        </div>

                        <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid var(--border-light)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '8px' }}>ORDER FIKTIF</p>
                            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '4px' }}>{stats.fictitiousOrders}</h1>
                            <p style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: '600' }}>⚠️ Perlu ditindak</p>
                        </div>

                    </div>

                    {/* Table */}
                    <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>DATA PENGGUNA TERBARU</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Menampilkan 2 dari 124 data</p>
                        </div>
                        
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
                                    <th style={{ padding: '16px 24px', fontWeight: '600', width: '50px' }}>No</th>
                                    <th style={{ padding: '16px 24px', fontWeight: '600' }}>Nama Lengkap</th>
                                    <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'center' }}>Peran Aktif</th>
                                    <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'center' }}>Status Akun</th>
                                    <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data pengguna.</td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={user._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '16px 24px' }}>{index + 1}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {user.nama_lengkap} <br/>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>{user.role === 'admin' ? 'Administrator' : 'Klien / Pekerja'}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ 
                                                    backgroundColor: user.status === 'ACTIVE' ? '#fff' : '#EF4444', 
                                                    color: user.status === 'ACTIVE' ? 'var(--primary)' : '#fff',
                                                    border: user.status === 'ACTIVE' ? '1px solid var(--primary)' : 'none',
                                                    padding: '4px 12px', fontWeight: '600', fontSize: '0.85rem', borderRadius: '4px' 
                                                }}>
                                                    {user.status === 'ACTIVE' ? 'Aktif' : 'Diblokir'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => toggleStatus(user._id)}
                                                    style={{ 
                                                        border: 'none', background: user.status === 'ACTIVE' ? '#EF4444' : 'var(--secondary)', 
                                                        color: '#fff', padding: '6px 16px', cursor: 'pointer', fontWeight: '600', borderRadius: '4px' 
                                                    }}
                                                >
                                                    {user.status === 'ACTIVE' ? 'Blokir' : 'Aktifkan'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </main>
        </div>
    );
}
