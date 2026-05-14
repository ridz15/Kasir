# Mooncake 94

Aplikasi kasir lokal untuk toko bakery satu cabang. Aplikasi berjalan dari PC kasir, bisa dibuka dari HP/tablet di WiFi yang sama, dan menyimpan data utama di SQLite lokal.

## Cara menjalankan

1. Klik dua kali file `Jalankan Mooncake 94.bat`.
2. Browser akan terbuka otomatis ke aplikasi Mooncake 94.
3. Jika tidak terbuka otomatis, buka `http://127.0.0.1:4173`.

Data aplikasi tersimpan di:

```text
data/mooncake94.db
```

File database ini bersifat lokal dan tidak ikut di-push ke GitHub.

## Buka dari HP atau tablet

1. Pastikan PC kasir dan HP/tablet memakai WiFi yang sama.
2. Klik dua kali `Jalankan Mooncake 94.bat` di PC kasir.
3. Lihat jendela yang terbuka. Di sana akan muncul alamat seperti `http://192.168.1.10:4173`.
4. Buka alamat tersebut di browser HP/tablet.
5. Biarkan PC kasir dan jendela server tetap menyala selama aplikasi dipakai.

Jika Windows Firewall muncul, pilih `Allow access` untuk jaringan private.

Catatan: PC kasir harus tetap menyala karena PC menjadi server lokal dan pusat database.

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

Saat aplikasi dibuka lewat `Jalankan Mooncake 94.bat`, data tersimpan di SQLite lokal. Jika file `index.html` dibuka langsung tanpa server, aplikasi masih bisa berjalan dengan penyimpanan browser sebagai fallback, tetapi mode utama yang disarankan adalah lewat launcher.

Tetap lakukan `Backup Data` secara rutin, terutama setelah tutup toko.
