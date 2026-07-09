/**
 * SCRIPT UJI NOTIFIKASI — 1 HP saja
 * ===================================
 * Cara pakai:
 *   node scripts/create-test-quest.js
 *
 * Fungsi: Login sebagai akun PEMBUAT lalu buat tugas baru.
 * HP yang login sebagai akun PENERIMA (akun berbeda) akan menerima notifikasi.
 *
 * Ubah EMAIL_PEMBUAT / PASSWORD_PEMBUAT sesuai akun yang tidak dipakai di HP.
 */

const https = require('https');
const readline = require('readline');

const API = 'https://housting-for-skripsi.vercel.app';

// ==============================
// KONFIGURASI — Sesuaikan di sini
// ==============================
const EMAIL_PEMBUAT = 'admin@email.com';
const PASSWORD_PEMBUAT = 'password123';

// Koordinat di Kelurahan Guntung Paikat, Banjarbaru
// (sama dengan default koordinat app, pasti masuk radius 2000m)
const LATITUDE = -3.4400;
const LONGITUDE = 114.8360;

const TUGAS = {
    kategori: 'fisik',
    deskripsi: '[TEST NOTIF] Tolong antarkan dokumen ke kantor kelurahan, ini hanya uji coba notifikasi.',
    upah_jasa: 15000,
    nominal_talangan: 0
};
// ==============================

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'housting-for-skripsi.vercel.app',
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(responseData) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: responseData });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    console.log('====================================');
    console.log(' Script Uji Notifikasi — Jasa Warga');
    console.log('====================================\n');

    // Step 1 — Login
    console.log(`1. Login sebagai: ${EMAIL_PEMBUAT}`);
    const loginRes = await request('POST', '/api/auth/login', {
        email: EMAIL_PEMBUAT,
        password: PASSWORD_PEMBUAT
    });

    if (!loginRes.body.success) {
        console.error('   ERROR: Login gagal!', loginRes.body.message);
        console.log('   Coba ubah EMAIL_PEMBUAT/PASSWORD_PEMBUAT di bagian KONFIGURASI script ini.\n');
        process.exit(1);
    }

    const token = loginRes.body.token;
    const userId = loginRes.body.user.id;
    const namaUser = loginRes.body.user.nama;
    console.log(`   OK! Masuk sebagai: ${namaUser} (ID: ${userId})\n`);

    // Step 2 — Cek tugas aktif dan batal jika ada
    console.log('2. Mengecek tugas aktif yang mungkin menghalangi...');
    const historyRes = await request('GET', `/api/quests/history?user_id=${userId}`, null, token);

    let adaTugasAktif = false;
    if (historyRes.body.success && historyRes.body.data) {
        const aktif = historyRes.body.data.filter(q => q.status === 'OPEN' || q.status === 'TAKEN');
        if (aktif.length > 0) {
            console.log(`   Ada ${aktif.length} tugas aktif. Membatalkan tugas lama...`);
            for (const quest of aktif) {
                if (quest.pembuat_id === userId || quest.pembuat_id?._id === userId) {
                    // Batalkan tugas milik pembuat
                    const cancelRes = await request('POST', `/api/quests/${quest._id}/cancel`, { user_id: userId }, token);
                    if (cancelRes.body.success) {
                        console.log(`   OK! Tugas ${quest._id} dibatalkan.`);
                    } else {
                        console.log(`   Gagal batalkan: ${cancelRes.body.message}`);
                        adaTugasAktif = true;
                    }
                } else {
                    console.log(`   Anda juga pekerja di tugas ${quest._id} (tidak bisa dibatalkan dari sini).`);
                    adaTugasAktif = true;
                }
            }
        } else {
            console.log('   OK! Tidak ada tugas aktif.\n');
        }
    }

    if (adaTugasAktif) {
        console.log('\n   PERHATIAN: Masih ada tugas aktif yang tidak bisa dibatalkan otomatis.');
        console.log('   Harap selesaikan atau batalkan tugas tersebut lewat aplikasi terlebih dahulu.\n');
        process.exit(1);
    }

    // Step 3 — Buat tugas baru
    console.log('3. Membuat tugas baru...');
    console.log(`   Kategori : ${TUGAS.kategori}`);
    console.log(`   Deskripsi: ${TUGAS.deskripsi}`);
    console.log(`   Upah     : Rp ${TUGAS.upah_jasa.toLocaleString('id-ID')}`);
    console.log(`   Lokasi   : (${LATITUDE}, ${LONGITUDE})\n`);

    const createRes = await request('POST', '/api/quests', {
        pembuat_id: userId,
        kategori: TUGAS.kategori,
        deskripsi: TUGAS.deskripsi,
        upah_jasa: TUGAS.upah_jasa,
        nominal_talangan: TUGAS.nominal_talangan,
        latitude: LATITUDE,
        longitude: LONGITUDE
    }, token);

    if (!createRes.body.success) {
        console.error('   ERROR: Gagal membuat tugas!', createRes.body.message);
        process.exit(1);
    }

    const quest = createRes.body.data;
    console.log(`   BERHASIL! Tugas dibuat:`);
    console.log(`   ID    : ${quest._id}`);
    console.log(`   Status: ${quest.status}`);
    console.log(`   PIN   : ${quest.pin_rahasia}`);

    console.log('\n====================================');
    console.log(' SEKARANG cek HP Anda!');
    console.log(' Notifikasi harusnya muncul dalam');
    console.log(' 10-15 detik di HP yang login dengan');
    console.log(' akun BERBEDA dari akun ini.');
    console.log('====================================\n');
}

main().catch(err => {
    console.error('Error tidak terduga:', err.message);
    process.exit(1);
});