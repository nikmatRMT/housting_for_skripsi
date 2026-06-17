# Alur Sistem Aplikasi (Berdasarkan Flowchart)

Dokumen ini menjelaskan alur (flowchart) utama dari aplikasi skripsi.

## Swimlane: Klien
1. **Membuat Tugas:** Klien menekan tombol 'Buat Tugas'.
2. **Notifikasi:** Klien menerima notifikasi saat tugas diterima oleh pekerja.
3. **Komunikasi:** Klien dapat membuka chat WhatsApp ke pekerja.
4. **Penyelesaian:** Klien bertemu pekerja di lokasi, menyerahkan uang COD, dan memberikan **PIN Rahasia 4-Digit** kepada pekerja.

## Swimlane: Sistem
1. **Inisialisasi:** Mengunci koordinat GPS (Static Pin) dari klien.
2. **Penyimpanan:** Menyimpan tugas ke Database dengan status `OPEN`.
3. **Pencarian Pekerja:** 
   - Mengirim notifikasi ke pekerja di sekitar.
   - Melakukan filter menggunakan **Algoritma Haversine** ($geoNear <= 1 km).
4. **Atomic Update:** Saat pekerja menerima tugas, sistem mengecek apakah tugas masih tersedia.
   - *Gagal:* Tampilkan pesan error 'Tugas sudah diambil pekerja lain'.
   - *Sukses:* Ubah status menjadi `TAKEN` dan catat `waktu_diambil`.
5. **Komunikasi:** Menampilkan tombol chat WhatsApp untuk kedua belah pihak.
6. **Validasi Jarak:** Mengecek apakah pekerja sudah dekat dengan titik tugas.
   - *Belum Dekat:* Meminta pekerja mendekat.
   - *Sudah Dekat:* Menampilkan form input PIN untuk pekerja.
7. **Validasi PIN:** Mengecek apakah PIN yang diinput pekerja cocok dengan milik klien.
   - *Tidak Cocok:* Tampilkan pesan error 'PIN Salah'.
   - *Cocok:* Ubah status menjadi `COMPLETED` dan catat `waktu_selesai`. Selesai.

## Swimlane: Pekerja
1. **Menerima Tugas:** Pekerja menerima notifikasi tugas baru, membuka aplikasi, dan melihat daftar tugas yang sudah difilter (<= 1 km).
2. **Pengambilan Tugas:** Pekerja memilih tugas dan menekan 'Terima'.
3. **Komunikasi:** Pekerja dapat membuka chat WhatsApp ke klien.
4. **Perjalanan:** Pekerja berjalan menuju lokasi Static Pin klien.
5. **Penyelesaian:** 
   - Pekerja bertemu klien.
   - Pekerja menerima PIN dari klien.
   - Pekerja menginput PIN ke dalam aplikasi untuk menyelesaikan tugas.
