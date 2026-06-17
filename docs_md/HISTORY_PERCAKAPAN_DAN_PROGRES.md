# History Pengembangan Aplikasi Jasa Warga (Sesi Pengembangan Terbaru)

## 1. Fitur Halaman Tugas Aktif (Role-based Dashboard)
- Halaman `DetailTugas.jsx` telah sepenuhnya dikembangkan menjadi pusat kendali "Tugas Aktif".
- Sistem membedakan tampilan berdasarkan peran secara dinamis:
  - **Klien (Pembuat Tugas):** Menampilkan kotak PIN rahasia 4-digit secara permanen hingga tugas selesai, serta menampilkan informasi identitas Pekerja yang mengambil tugas.
  - **Pekerja:** Menampilkan informasi Klien dan kotak form input untuk memasukkan PIN penyelesaian tugas.

## 2. Sinkronisasi Database (Dummy ID Seeding)
- Mengatasi masalah *Error 404* dan tampilan kosong "Belum Ada Tugas Aktif".
- ID Klien (`Budi`) dan Pekerja (`Siti`) di `seed.js` telah disamakan persis dengan ID *Dummy* yang digunakan oleh *Frontend* (`60b5c1c8a1b2c3d4e5f60001` & `60b5c1c8a1b2c3d4e5f60002`).
- Ini menjamin pengujian *end-to-end* yang mulus saat menggunakan tombol **"Simulasi Ganti Akun"** di halaman Profil.

## 3. Fitur Pembatalan Tugas (Keamanan Berlapis)
- Fungsi tombol merah "Batalkan Tugas (Hapus)" di halaman Tugas Aktif telah diaktifkan.
- **Sistem Keamanan:**
  - Hanya Pembuat Tugas (Klien) yang memiliki akses ke tombol pembatalan.
  - Pembatalan hanya bisa dilakukan jika status tugas masih `OPEN`.
  - Jika tugas sudah `TAKEN` (diambil pekerja), tombol akan otomatis *disabled* dan menampilkan pesan *"Tak bisa batal sepihak"* guna melindungi hak pekerja yang sedang dalam perjalanan.

## 4. Fitur Live Tracking & Rute Jalan (Leaflet Routing Machine)
- Mengintegrasikan ekstensi `leaflet-routing-machine` langsung ke dalam aplikasi.
- **Untuk Pekerja:**
  - Menggunakan sensor `navigator.geolocation.watchPosition` untuk mendeteksi pergerakan koordinat GPS Pekerja secara *real-time* dan mengirimkannya ke database (`pekerja_lokasi`).
  - Menampilkan Garis Rute Biru (jalur navigasi belokan) dari lokasi Pekerja ke lokasi tujuan Klien secara otomatis di dalam peta.
  - Tersedia tombol akses cepat "Buka Arah di Google Maps" sebagai alternatif eksternal.
- **Untuk Klien:**
  - Menggunakan teknik *Live Polling* setiap 5 detik ke *server* untuk melacak kordinat lokasi terbaru dari Pekerja.
  - Peta Klien akan menampilkan posisi pergerakan Pekerja dan garis biru yang bergerak secara dinamis seiring pergerakan nyata Pekerja.
- UI panel teks instruksi jalan bawaan Leaflet disembunyikan menggunakan CSS agar antarmuka Peta tetap ringkas dan terlihat premium.

## 5. Algoritma Haversine
- Telah diuji dan terbukti bekerja 100% sempurna.
- Tugas *dummy* statis di Banjarbaru tidak akan muncul di layar Beranda Klien apabila lokasi GPS nyata mereka berada lebih dari 1 KM jauhnya dari titik tugas tersebut, sesuai dengan cetak biru skripsi.

---

## 6. Dashboard Admin (Fullstack)
- Membuat antarmuka *Admin Dashboard* (`AdminDashboard.jsx`) untuk memantau pengguna dan statistik tugas.
- Mengintegrasikan *backend* `/api/admin/users` untuk memuat data riwayat pengguna.
- Menambahkan fitur keamanan untuk memblokir (*Suspend*) dan mengaktifkan kembali akun pengguna secara *real-time*.

## 7. Sistem Penyelesaian Tugas (Validasi PIN)
- Menyempurnakan alur hidup (*lifecycle*) tugas dari awal hingga akhir.
- Mengintegrasikan *endpoint* `POST /api/quests/:id/complete` di mana Pekerja harus memasukkan **PIN Rahasia 4-Digit** yang hanya diketahui oleh Klien.
- Jika PIN cocok, status tugas resmi berubah menjadi `COMPLETED`.

## 8. Gamifikasi & Statistik Beranda
- Mengubah angka statis di halaman Beranda menjadi *Real-Time Tracker*.
- **Bar Target Sampingan:** Menghitung persentase pencapaian pendapatan harian (dengan target yang bisa diatur).
- **Aktivitas Fisik:** Mengekstrak jarak tempuh (Km) dari perhitungan *GeoNear* di tugas yang telah diselesaikan, kemudian mengonversinya menjadi estimasi **Langkah Kaki** (1 Km = ~1.300 langkah) dan **Kalori Terbakar** (1 Km = ~55 Kcal).

## 9. Sistem Dompet & Total Pendapatan Visual
- Menambahkan *field* `saldo` ke dalam skema `User.js` di MongoDB.
- Membangun otomatisasi pada fungsi *backend*: setiap kali tugas `COMPLETED`, sistem akan langsung menjumlahkan `upah_jasa` + `nominal_talangan` dan menambahkannya ke *field* saldo Pekerja.
- Mengubah desain halaman **Profil** untuk menarik data asli dari database.
- Teks visual diperbarui dari "Saldo Dompet" menjadi **"Total Pendapatan (Uang Tunai)"** untuk mencerminkan sistem bisnis bayar-di-tempat (Cash) yang sesungguhnya.

---
*File ini dibuat secara otomatis oleh Asisten AI untuk menyimpan riwayat implementasi agar tidak hilang atau lupa pada sesi presentasi/bimbingan skripsi berikutnya.*
