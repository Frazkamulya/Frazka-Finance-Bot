# SISTEM PENCATATAN KEUANGAN PRIBADI TERINTEGRASI BOT TELEGRAM

## Misi Proyek: Kontrol Penuh Keuangan Individu

Proyek ini bertujuan membangun sistem pencatatan dan analisis keuangan pribadi yang sangat mudah diakses melalui Bot Telegram. Sistem menggunakan Google Sheets (sebagai database) dan Google Apps Script untuk otomatisasi input, analisis harian, dan visualisasi saldo.

Tujuan utama adalah **otomatisasi input**, **analisis mendalam**, dan **pemeliharaan data** tanpa perlu membuka aplikasi *spreadsheet* secara manual.

---

## FITUR BOT TELEGRAM (Full Command List)

Bot ini dirancang untuk kecepatan input dan kemampuan analisis serta *maintenance* data yang lengkap.

| Perintah Bot | Kategori | Fungsi & Deskripsi |
| :--- | :--- | :--- |
| `/start` | Navigasi | Memuat menu *inline* utama dan instruksi penggunaan sistem. |
| `/tambahdata` | Input | Input transaksi pengeluaran/pemasukan dengan parameter lengkap (Tanggal, Nominal, Kategori, Keterangan). |
| `/cepat` | Input | Input cepat menggunakan tombol *inline* untuk transaksi yang paling sering. |
| `/updatepemasukan` | Maintenance | Fungsi khusus untuk **menyesuaikan total pemasukan** (misalnya, untuk koreksi data atau update gaji). |
| `/updatecash` | Maintenance | Fungsi khusus untuk **menyesuaikan saldo Kas/Bank** secara manual jika selisih atau penyesuaian awal. |
| `/ceksaldo` | Monitoring | Menampilkan saldo akhir Kas & Bank saat ini secara *real-time* dari sheet `Balances`. |
| `/rekapharian_menu` | Analisis | Menampilkan menu untuk **Rekap Harian** (total pengeluaran/pemasukan hari ini/periode tertentu). |
| `/analisis` | Analisis | Menyediakan ringkasan pengeluaran bulanan, pengeluaran tertinggi, dan persentase penggunaan budget. |
| `/rekapkategori` | Analisis | Laporan detail pengeluaran berdasarkan kategori. |
| `/cari` | Data Retrieval | Fitur pencarian untuk menemukan transaksi tertentu berdasarkan kata kunci di kolom Keterangan/Uraian. |
| `/hapus` | Maintenance | Fitur untuk menghapus/membatalkan entri transaksi terakhir atau entri spesifik. |
| `/format` | Maintenance | Fungsi utilitas untuk membersihkan, merapikan, atau mengatur ulang format *spreadsheet*. |

---

## ARSITEKTUR SISTEM (GOOGLE SHEETS & APPS SCRIPT)

### 1. Struktur Database (Sheet Utama)

* **Expenses:** Database pengeluaran harian.
* **Income [Tahun]:** Database pemasukan utama.
* **Balances:** Menghitung dan menyimpan saldo harian/periode.
* **Dashboard:** Visualisasi dan ringkasan kondisi keuangan.
* **Settings:** Konfigurasi kategori dan target anggaran.

### 2. Fitur Kunci

* **Pencatatan Double-Entry:** Fokus pada pencatatan Pengeluaran dan Pemasukan secara terpisah.
* **Saldo Real-time:** Menampilkan Saldo Kas & Bank aktual.
* **Analisis Kategori:** Laporan pengeluaran dikelompokkan berdasarkan kategori.

---

##  KREDIT DAN KONTRIBUTOR

**Owner Proyek & Auditor:** Frazka M.W

---
