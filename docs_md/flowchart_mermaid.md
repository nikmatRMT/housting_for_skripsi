# Kumpulan Flowchart Mermaid - Skripsi Micro-Tasking Hyperlocal

Berikut adalah kode Mermaid untuk seluruh flowchart yang dibutuhkan skripsi. 
Salin kode ke Draw.io (Extras > Edit Diagram > Mermaid) atau ke [Mermaid Live Editor](https://mermaid.live).

---

## 1. Flowchart Transaksi Utama (Klien ↔ Sistem ↔ Pekerja)

> Ini adalah flowchart utama skripsi, sesuai dengan gambar swimlane yang sudah Anda buat.

```mermaid
flowchart TD
    subgraph KLIEN["🔵 Swimlane: Klien"]
        K1["Menekan Tombol 'Buat Tugas'"]
        K2["Menunggu Pekerja Menerima Tugas"]
        K3["Menerima Notifikasi 'Tugas Diterima'"]
        K4["Membuka Chat WhatsApp ke Pekerja"]
        K5["Bertemu Pekerja di Lokasi Tugas"]
        K6["Menyerahkan Uang COD & Memberikan PIN Rahasia 4-Digit"]
        K7["Menerima Notifikasi 'Tugas Selesai'"]
    end

    subgraph SISTEM["🟠 Swimlane: Sistem"]
        S1["Mengunci Koordinat GPS - Static Pin"]
        S2["Menyimpan Tugas ke Database - Status: OPEN"]
        S3["Mengirim Notifikasi ke Pekerja di Sekitar"]
        S4["Melakukan Filter Algoritma Haversine - geoNear <= 1 KM"]
        S5{"Atomic Update: Apakah tugas masih tersedia?"}
        S5_GAGAL["Tampilkan Pesan Error: 'Tugas sudah diambil pekerja lain'"]
        S6["Ubah Status -> TAKEN & Catat waktu_diambil"]
        S7["Kirim Notifikasi ke Klien: 'Tugas Diterima'"]
        S8["Tampilkan Tombol Chat WhatsApp Kedua Pihak"]
        S9{"Validasi Jarak: Pekerja sudah dekat dengan titik tugas?"}
        S9_JAUH["Minta Pekerja Mendekat ke Titik Tugas"]
        S10["Tampilkan Form Input PIN"]
        S11{"Validasi PIN: Apakah PIN yang diinput cocok?"}
        S11_SALAH["Tampilkan Pesan Error: 'PIN Salah!'"]
        S12["Update Database: Status -> COMPLETED & Catat Riwayat Transaksi"]
        S13_P["Kirim Notifikasi Sukses ke Pekerja & Riwayat Pendapatan Bertambah"]
        S13_K["Kirim Notifikasi 'Tugas Selesai' ke Klien"]
    end

    subgraph PEKERJA["🟢 Swimlane: Pekerja"]
        P1["Menerima Notifikasi Tugas Baru"]
        P2["Membuka Aplikasi & Halaman Daftar Tugas"]
        P3["Melihat Daftar Tugas yang Sudah Difilter <= 1 KM"]
        P4["Memilih Tugas & Menekan 'Terima'"]
        P5["Membuka Chat WhatsApp ke Klien"]
        P6["Berjalan Menuju Lokasi Static Pin Klien"]
        P7["Diminta Mendekat ke Titik Tugas"]
        P8["Menerima PIN dari Klien & Menginput PIN ke Aplikasi"]
        P9["Menerima Notifikasi Sukses & Pendapatan Bertambah"]
    end

    %% Alur Klien
    K1 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> P1
    S3 --> S4

    %% Alur Pekerja melihat tugas
    P1 --> P2
    P2 --> P3
    S4 --> P3
    P3 --> P4

    %% Atomic Update
    P4 --> S5
    S5 -- Gagal/Bentrok --> S5_GAGAL
    S5 -- Sukses --> S6

    %% Notifikasi setelah TAKEN
    S6 --> S7
    S7 --> K3
    S6 --> S8
    K3 --> K4
    S8 --> P5

    %% Menunggu Klien
    K1 --> K2

    %% Validasi Jarak
    P5 --> P6
    P6 --> S9
    S9 -- Belum Dekat --> S9_JAUH
    S9_JAUH --> P7
    P7 --> S9
    S9 -- Sudah Dekat --> S10

    %% Klien bertemu Pekerja
    K4 --> K5
    K5 --> K6

    %% Input PIN
    S10 --> P8
    K6 --> P8
    P8 --> S11
    S11 -- Tidak Cocok --> S11_SALAH
    S11_SALAH --> S10
    S11 -- Cocok --> S12

    %% Notifikasi Selesai
    S12 --> S13_P
    S12 --> S13_K
    S13_P --> P9
    S13_K --> K7
```

---

## 2. Flowchart Admin Dashboard

> Flowchart terpisah khusus untuk aktor Admin, sesuai Use Case Diagram (Memantau Transaksi, Mengelola Data Pengguna).

```mermaid
flowchart TD
    A1(["▶ Mulai"])
    A2["Admin Memasukkan Username & Password"]
    A3{"Validasi: Apakah Role = 'admin'?"}
    A3_NO["Tampilkan Pesan Error: 'Akses Ditolak'"]
    A4["Menampilkan Halaman Dashboard Admin"]
    A5["Sistem Memuat Statistik Global: Total Pengguna, Tugas Berjalan, Selesai Hari Ini, Order Fiktif"]
    A6{"Admin Memilih Menu"}

    subgraph MENU_1["Menu: Kelola Pengguna"]
        B1["Menampilkan Tabel Daftar Pengguna"]
        B2{"Apakah Ada Pengguna yang Melanggar?"}
        B2_NO["Kembali Memantau"]
        B3["Admin Menekan Tombol 'Blokir'"]
        B4["Sistem Mengubah Status Pengguna: ACTIVE -> SUSPENDED"]
    end

    subgraph MENU_2["Menu: Pantau Transaksi"]
        C1["Menampilkan Tabel Daftar Seluruh Tugas: OPEN, TAKEN, COMPLETED"]
        C2{"Apakah Ada Tugas Mencurigakan / Order Fiktif?"}
        C2_NO["Kembali Memantau"]
        C3["Admin Menekan Tombol 'Batalkan Paksa'"]
        C4["Sistem Mengubah Status Tugas -> CANCELLED"]
    end

    subgraph MENU_3["Menu: Cetak Laporan"]
        D1["Sistem Menyusun Data Laporan Bulanan: Uang Berputar, Tugas Selesai, Pengguna Aktif"]
        D2["Admin Menekan Tombol 'Cetak'"]
        D3["Sistem Menghasilkan File PDF / Print"]
    end

    A7["Admin Logout"]
    A8(["⏹ Selesai"])

    A1 --> A2
    A2 --> A3
    A3 -- Tidak --> A3_NO
    A3_NO --> A2
    A3 -- Ya --> A4
    A4 --> A5
    A5 --> A6

    A6 -- Kelola Pengguna --> B1
    B1 --> B2
    B2 -- Tidak --> B2_NO
    B2_NO --> A6
    B2 -- Ya --> B3
    B3 --> B4
    B4 --> A6

    A6 -- Pantau Transaksi --> C1
    C1 --> C2
    C2 -- Tidak --> C2_NO
    C2_NO --> A6
    C2 -- Ya --> C3
    C3 --> C4
    C4 --> A6

    A6 -- Cetak Laporan --> D1
    D1 --> D2
    D2 --> D3
    D3 --> A6

    A6 -- Logout --> A7
    A7 --> A8
```

---

## 3. Flowchart Registrasi & Login

> Alur masuk pengguna ke dalam sistem (berlaku untuk Klien, Pekerja, dan Admin).

```mermaid
flowchart TD
    L1(["▶ Mulai"])
    L2["Pengguna Membuka Aplikasi"]
    L3{"Apakah Sudah Memiliki Akun?"}

    subgraph REGISTER["Proses Registrasi"]
        R1["Pengguna Menekan 'Daftar'"]
        R2["Mengisi Email & Password"]
        R3["Sistem Menyimpan Data ke Database"]
        R4["Akun Berhasil Dibuat"]
    end

    subgraph LOGIN["Proses Login"]
        LG1["Pengguna Memasukkan Email & Password"]
        LG2{"Validasi: Apakah Email & Password Cocok?"}
        LG2_NO["Tampilkan Pesan Error: 'Email atau Password Salah'"]
        LG3{"Apakah Profil Sudah Lengkap?"}
        LG4["Redirect ke Halaman 'Lengkapi Profil': Isi Nama & No. WhatsApp"]
        LG5["Sistem Menyimpan Profil ke Database"]
    end

    L4{"Cek Role Pengguna"}
    L5_USER["Redirect ke Halaman Beranda - Mode Pekerja/Klien"]
    L5_ADMIN["Redirect ke Halaman Dashboard Admin"]
    L6(["⏹ Selesai"])

    L1 --> L2
    L2 --> L3
    L3 -- Belum --> R1
    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 --> LG1

    L3 -- Sudah --> LG1
    LG1 --> LG2
    LG2 -- Tidak Cocok --> LG2_NO
    LG2_NO --> LG1
    LG2 -- Cocok --> LG3
    LG3 -- Belum Lengkap --> LG4
    LG4 --> LG5
    LG5 --> L4
    LG3 -- Sudah Lengkap --> L4

    L4 -- Role: user --> L5_USER
    L4 -- Role: admin --> L5_ADMIN
    L5_USER --> L6
    L5_ADMIN --> L6
```

---

## Catatan Penting

> [!TIP]
> - **Flowchart 1** (Transaksi Utama) adalah yang paling penting untuk skripsi karena mendemonstrasikan Algoritma Haversine.
> - **Flowchart 2** (Admin) wajib ada karena di Use Case Diagram sudah tercantum aktor Admin.
> - **Flowchart 3** (Login/Register) opsional tapi disarankan agar lengkap.

> [!WARNING]
> Beberapa fitur di Flowchart 2 (Pantau Transaksi & Cetak Laporan) **belum diimplementasikan di kodingan**. Jika ingin flowchart dan aplikasi sinkron 100%, fitur tersebut perlu dikoding terlebih dahulu.
