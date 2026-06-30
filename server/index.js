const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection helper for serverless environment
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jasa_lepas_db');
        isConnected = db.connections[0].readyState === 1;
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
};

// Middleware to ensure DB connection is established before processing request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// Import Routes
const questRoutes = require('./routes/questRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Routes
app.use('/api/quests', questRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Server Aplikasi Pencarian Jasa Lepas Berjalan');
});

const Quest = require('./models/Quest');

// Endpoint untuk Vercel Cron Job (Sweeper)
app.get('/api/sweeper', async (req, res) => {
    try {
        const now = Date.now();
        const oneHourAgo = new Date(now - 60 * 60 * 1000);
        const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
        const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000);

        // 1. Batalkan tugas OPEN yang sudah > 1 jam
        const canceledOpen = await Quest.updateMany(
            { status: 'OPEN', created_at: { $lt: oneHourAgo } },
            { $set: { status: 'CANCELED' } }
        );

        // 2. Batalkan tugas TAKEN yang sudah > 2 jam
        const canceledTaken = await Quest.updateMany(
            { status: 'TAKEN', taken_at: { $lt: twoHoursAgo } },
            { $set: { status: 'CANCELED' } }
        );

        // 3. Batalkan tugas IN_PROGRESS yang sudah > 12 jam
        const canceledInProgress = await Quest.updateMany(
            { status: 'IN_PROGRESS', arrived_at: { $lt: twelveHoursAgo } },
            { $set: { status: 'CANCELED' } }
        );

        const logMsg = `[Sweeper] Canceled ${canceledOpen.modifiedCount} OPEN, ${canceledTaken.modifiedCount} TAKEN, ${canceledInProgress.modifiedCount} IN_PROGRESS tasks.`;
        console.log(logMsg);

        res.status(200).json({
            success: true,
            message: 'Sweeper job executed successfully',
            data: {
                canceledOpen: canceledOpen.modifiedCount,
                canceledTaken: canceledTaken.modifiedCount,
                canceledInProgress: canceledInProgress.modifiedCount
            }
        });
    } catch (err) {
        console.error('[Sweeper] Error running auto-cancel job:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Auto-Cancel Sweeper Job (Hanya berjalan lokal di server terus-menerus, di Vercel menggunakan Vercel Cron)
if (!process.env.VERCEL) {
    setInterval(async () => {
        try {
            const now = Date.now();
            const oneHourAgo = new Date(now - 60 * 60 * 1000);
            const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
            const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000);

            // 1. Batalkan tugas OPEN yang sudah > 1 jam
            const canceledOpen = await Quest.updateMany(
                { status: 'OPEN', created_at: { $lt: oneHourAgo } },
                { $set: { status: 'CANCELED' } }
            );

            // 2. Batalkan tugas TAKEN yang sudah > 2 jam
            const canceledTaken = await Quest.updateMany(
                { status: 'TAKEN', taken_at: { $lt: twoHoursAgo } },
                { $set: { status: 'CANCELED' } }
            );

            // 3. Batalkan tugas IN_PROGRESS yang sudah > 12 jam
            const canceledInProgress = await Quest.updateMany(
                { status: 'IN_PROGRESS', arrived_at: { $lt: twelveHoursAgo } },
                { $set: { status: 'CANCELED' } }
            );

            if (canceledOpen.modifiedCount > 0 || canceledTaken.modifiedCount > 0 || canceledInProgress.modifiedCount > 0) {
                console.log(`[Sweeper] Canceled ${canceledOpen.modifiedCount} OPEN, ${canceledTaken.modifiedCount} TAKEN, ${canceledInProgress.modifiedCount} IN_PROGRESS tasks.`);
            }
        } catch (err) {
            console.error('[Sweeper] Error running auto-cancel job:', err);
        }
    }, 5 * 60 * 1000); // 5 menit
}

// Start Server jika tidak berjalan di Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
