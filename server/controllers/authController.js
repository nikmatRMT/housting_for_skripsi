const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret Key untuk JWT (Sebaiknya di .env, tapi untuk keperluan skripsi kita pakai string default)
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_jasa_warga_guntung_paikat';

// Registrasi Pengguna Baru
exports.register = async (req, res) => {
    try {
        const { nama_lengkap, email, no_whatsapp, password, role } = req.body;

        // Validasi input
        if (!nama_lengkap || !email || !no_whatsapp || !password) {
            return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi!' });
        }

        // Cek apakah email sudah terdaftar
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
        }

        // Enkripsi Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Buat User Baru
        const newUser = new User({
            nama_lengkap,
            email,
            no_whatsapp,
            password: hashedPassword,
            role: role || 'user'
        });

        await newUser.save();

        res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
    } catch (error) {
        console.error('Error in Register:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat registrasi.' });
    }
};

// Login Pengguna
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email dan password wajib diisi!' });
        }

        // Cari User berdasarkan email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Email tidak ditemukan.' });
        }

        // Cek status blokir
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ success: false, message: 'Akun Anda ditangguhkan. Silakan hubungi admin.' });
        }

        // Cek kecocokan password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password salah!' });
        }

        // Buat Payload Token
        const payload = {
            id: user._id,
            role: user.role
        };

        // Generate Token JWT
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            message: 'Login berhasil!',
            token,
            user: {
                id: user._id,
                nama_lengkap: user.nama_lengkap,
                email: user.email,
                role: user.role,
                no_whatsapp: user.no_whatsapp,
                saldo: user.saldo
            }
        });
    } catch (error) {
        console.error('Error in Login:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
    }
};
