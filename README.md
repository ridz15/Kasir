# Mooncake 94

Aplikasi kasir lokal untuk toko bakery satu cabang. Versi awal ini berjalan langsung di browser tanpa hosting dan menyimpan data di browser komputer kasir.

## Cara menjalankan

1. Klik dua kali file `Jalankan Mooncake 94.bat`.
2. Browser akan terbuka otomatis ke aplikasi Mooncake 94.
3. Jika tidak terbuka otomatis, buka `http://127.0.0.1:4173`.

Cara alternatif:

1. Buka file `index.html` di browser.
   Alternatif: jalankan `node dev-server.js`, lalu buka `http://127.0.0.1:4173`.
2. Masuk ke menu `Produk & Stok` untuk tambah produk atau tambah stok.
3. Masuk ke menu `Kasir`, klik produk, masukkan uang diterima, lalu selesaikan transaksi.

## Fitur

- Input produk, harga, kategori, stok, dan batas stok rendah.
- Hitung total belanja dan kembalian.
- Riwayat transaksi.
- Laporan sederhana untuk hari ini dan omset 7 hari terakhir.
- Print struk pembayaran.
- Stok otomatis berkurang setelah transaksi selesai.
- Backup dan import data lewat file JSON.

## Catatan data

Data tersimpan lokal di browser memakai `localStorage`. Ini cocok untuk tahap awal satu cabang tanpa server. Saat sudah butuh multi cabang, dashboard online, atau login serius, struktur data ini bisa dipindahkan ke backend dan database server.
