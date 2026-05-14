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
echo Jika browser tidak terbuka otomatis, buka alamat ini:
echo http://127.0.0.1:4173
echo.

start "" "http://127.0.0.1:4173"
node dev-server.js

endlocal
