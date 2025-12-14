# 👛 SISTEM PENCATATAN KEUANGAN PRIBADI TERINTEGRASI BOT TELEGRAM

## 🌟 Misi Proyek: Kontrol Penuh Keuangan Individu

Proyek ini bertujuan untuk membangun sistem pencatatan dan analisis keuangan pribadi yang sangat mudah diakses melalui Bot Telegram dan diolah menggunakan Google Sheets (sebagai database) dan Google Apps Script.

Tujuan utama adalah **otomatisasi input**, **analisis harian**, dan **visualisasi saldo** tanpa perlu membuka aplikasi *spreadsheet* secara manual.

---

## 🛠️ ARSITEKTUR SISTEM (GOOGLE SHEETS & APPS SCRIPT)

### 1. Struktur Database (Sheet Utama)

| Sheet Name | Fungsi Utama | Keterangan |
| :--- | :--- | :--- |
| **Expenses** | Mencatat semua pengeluaran (Debit). | Database pengeluaran harian. |
| **Income [Tahun]** | Mencatat semua pemasukan (Kredit). | Database pemasukan utama. |
| **Balances** | Menghitung dan menyimpan saldo harian/periode. | Sumber data untuk laporan saldo bot. |
| **Dashboard** | Visualisasi dan ringkasan kondisi keuangan. | Dilengkapi filter tanggal dan kategori. |
| **Settings** | Konfigurasi kategori dan target anggaran. | Data master untuk VLOOKUP. |

### 2. Fokus Analisis dan Pelaporan

* **Pencatatan Single-Entry:** Sistem berfokus pada pencatatan Pengeluaran (Expense) dan Pemasukan (Income) secara terpisah.
* **Saldo Real-time:** Menampilkan Saldo Kas & Bank aktual.
* **Analisis Kategori:** Laporan pengeluaran dikelompokkan berdasarkan kategori (Makanan, Transportasi, Kebutuhan Rumah Tangga, dll.) untuk kontrol budget.

---

## 🤖 FITUR BOT TELEGRAM

Bot ini berfungsi sebagai antarmuka input dan monitoring utama, dirancang untuk kecepatan dan kemudahan.

| Perintah Bot | Fungsi | Deskripsi |
| :--- | :--- | :--- |
| `/start` | Memulai/Mengakses Menu | Memuat menu *inline* utama dan instruksi. |
| `/tambahdata` | Input Manual | Input transaksi dengan parameter lengkap (Tanggal, Nominal, Kategori, Keterangan). |
| `/cepat` | Input Cepat (Inline Button) | Menyediakan tombol *inline* untuk input transaksi yang paling sering dilakukan (misal: "Beli Kopi", "Bayar Tol") dengan nominal tetap atau *prompt* nominal. |
| `/ceksaldo` | Cek Saldo Real-time | Menampilkan saldo akhir Kas & Bank saat ini dari sheet `Balances`. |
| `/analisis` | Laporan Periodik | Menyediakan ringkasan pengeluaran bulan ini, pengeluaran tertinggi, dan persentase penggunaan budget. |
| `/updatecash` | Update Saldo Awal | Fungsi khusus untuk menyesuaikan saldo Kas/Bank secara manual jika ada selisih. |

---

## ⚙️ LANGKAH INSTALASI (APPS SCRIPT)

1.  Salin seluruh kode Google Apps Script ke editor skrip Google Sheet Anda.
2.  Isi variabel konfigurasi: `BOT_TOKEN`, `USER_ID`, dan ID *spreadsheet* Anda.
3.  **Deployment Web App:** Deploy Apps Script sebagai Web App (Akses: Siapa saja). Salin URL Deployment.
4.  **Set Webhook:** Jalankan fungsi **`setWebhook()`** di Apps Script editor untuk mendaftarkan URL Deployment ke Telegram, mengaktifkan bot.
