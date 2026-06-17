# Arsitektur Sistem dan Aturan Bisnis Aplikasi

Dokumen ini merangkum detail teknis, skema database, alur sekuensial, dan aturan bisnis dari aplikasi pencarian jasa skala mikro berdasarkan diagram ERD, Sequence, Use Case, dan Flowchart.

## 1. Skema Database (MongoDB)
Aplikasi menggunakan dua koleksi utama:

### Koleksi `Users`
- `_id` (ObjectId) - Primary Key
- `google_id` (String) / `email_sso` (String)
- `nama_lengkap` (String)
- `no_whatsapp` (String)
- `peran` (String)
- `batas_talangan` (Number) - Batas maksimal uang talangan yang diizinkan untuk klien ini.
- `koordinat_lokasi` (Object)
- **Metode/Fungsi:** `loginSSO()`, `updateProfil()`

### Koleksi `Quests` (Tugas)
- `_id` (ObjectId) - Primary Key
- `pembuat_id` (ObjectId) - Foreign Key ke Users (Klien)
- `pekerja_id` (ObjectId) - Foreign Key ke Users (Pekerja)
- `judul_tugas` (String) / `kategori` & `deskripsi`
- `upah_jasa` (Number)
- `nominal_talangan` (Number)
- `lokasi` (GeoJSON_Point) - Diindeks menggunakan `2dsphere` untuk pencarian radius.
- `pin_rahasia` (String) - PIN 4-digit untuk validasi penyelesaian.
- `status` (Enum) - `OPEN`, `TAKEN`, `COMPLETED`, `CANCELED`
- **Metode/Fungsi:** `insertTugas()`, `updateStatus()`

*Relasi:* 1 User dapat membuat banyak Quests (1:N), dan 1 User dapat menerima banyak Quests (1:N).

## 2. Alur Teknis & Sekuensial (Sequence)
### Pencarian Tugas Berbasis Lokasi
1. **Frontend (React)** mengambil koordinat GPS pekerja dari browser.
2. Frontend mengirim koordinat tersebut ke **Controller (Node.js)**.
3. Controller mengeksekusi *query* MongoDB menggunakan operator `$geoNear` pada indeks `2dsphere` dengan batasan jarak maksimal 1 KM.
4. Data tugas yang difilter dikembalikan dan ditampilkan di Frontend berupa kartu tugas.

### Validasi PIN Penyelesaian Tugas
1. Pekerja menerima PIN 4-digit dari Klien di lokasi tugas.
2. Pekerja menginput PIN ke Frontend, yang kemudian dikirim ke Controller beserta ID Tugas.
3. Controller mencocokkan input dengan `pin_rahasia` di database.
4. Jika cocok, sistem melakukan update status menjadi `COMPLETED` dan merespons sukses. Jika tidak, merespons gagal dan meminta input ulang.

## 3. Aturan Bisnis (Berdasarkan Flowchart & Aturan Anti-Spam)
- **Limit 1 Quest Aktif (Anti-Spam & Anti-Double Job):** Untuk mencegah spam dan terjadinya *double job*, seorang User (baik sebagai Klien pembuat tugas maupun Pekerja pengambil tugas) HANYA BOLEH memiliki maksimal 1 tugas aktif berstatus `OPEN` atau `TAKEN` dalam satu waktu. Mereka harus menyelesaikan atau membatalkan tugas tersebut sebelum bisa membuat atau mengambil tugas baru.
- **Validasi Batas Talangan:** Saat klien mengisi form tugas, sistem (Controller) wajib memeriksa apakah `nominal_talangan` yang diminta melebihi nilai `batas_talangan` milik klien tersebut. Jika MELEBIHI, permintaan ditolak dan pesan error ditampilkan. Jika TIDAK, tugas disimpan dengan status `OPEN`.
- **Atomic Update (First-Come First-Serve):** Saat pekerja menekan tombol "Terima Tugas", sistem harus melakukan *Atomic Update* untuk memastikan tugas belum diambil pekerja lain. Jika berhasil, status berubah jadi `TAKEN`.
- **Validasi Jarak:** Pekerja harus memvalidasi jaraknya (mendekat ke lokasi tugas) sebelum sistem mengizinkan input PIN.

## 4. Hak Akses (Use Case Roles)
- **Klien:** Melakukan login, membuat tugas (termasuk memasukkan uang talangan), membatalkan tugas, memberikan PIN penyelesaian, mengakses chat WA, dan melihat riwayat tugas.
- **Pekerja:** Melakukan login, melihat daftar tugas terdekat, menerima tugas, menginput PIN penyelesaian, dan mengakses chat WA.
- **Admin:** Memantau transaksi dan mengelola data pengguna.
