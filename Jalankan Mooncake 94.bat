@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum ditemukan di komputer ini.
  echo.
  echo Aplikasi tetap bisa dibuka langsung lewat file index.html.
  echo Saya akan membukanya sekarang.
  start "" "%~dp0index.html"
  pause
  exit /b 1
)

echo Menjalankan Mooncake 94...
echo.
echo Di PC ini, aplikasi akan terbuka otomatis.
echo Jika browser tidak terbuka, buka alamat ini:
echo http://127.0.0.1:4173
echo.
echo Untuk HP/tablet, lihat alamat WiFi yang muncul di jendela ini setelah server berjalan.
echo Pastikan HP/tablet memakai WiFi yang sama dengan PC kasir.
echo.

start "" "http://127.0.0.1:4173"
node dev-server.js

endlocal
