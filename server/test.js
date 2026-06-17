const http = require('http');

const testNearbyQuests = () => {
    return new Promise((resolve, reject) => {
        // Koordinat Guntung Paikat (Klien)
        const longitude = 114.836;
        const latitude = -3.440;
        
        http.get(`http://localhost:5000/api/quests/nearby?longitude=${longitude}&latitude=${latitude}&radius=1000`, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('✅ [TEST 1] GET /api/quests/nearby (Algoritma Haversine)');
                    console.log(`Status Code: ${res.statusCode}`);
                    console.log(`Jumlah Tugas Ditemukan: ${parsed.total}`);
                    if (parsed.data && parsed.data.length > 0) {
                        console.log(`Tugas Terdekat: ${parsed.data[0].deskripsi}`);
                        console.log(`Jarak: ${Math.round(parsed.data[0].jarak_meter)} meter`);
                    }
                    console.log('--------------------------------------------------');
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const runTests = async () => {
    try {
        console.log('Memulai Pengujian API...\n');
        await testNearbyQuests();
        console.log('Pengujian selesai.');
    } catch (err) {
        console.error('Test gagal:', err.message);
    }
};

runTests();
