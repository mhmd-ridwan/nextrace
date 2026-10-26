@echo off
setlocal

title NEXTRACE - Platform Perlindungan Identitas Digital

echo ===============================================================================
echo   NEXTRACE - Sistem Terpadu Identifikasi Akun Tiruan dan Pelacak Kebocoran
echo   Integrated Identity Protection and Digital Evidence Platform
echo ===============================================================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: 1. Verifikasi Lingkungan Python
echo [*] Memeriksa instalasi Python...
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python tidak ditemukan di PATH sistem!
    echo Silakan install Python 3.12+ dan tambahkan ke PATH.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('python --version 2^>^&1') do echo [OK] %%v ditemukan.

:: 2. Verifikasi Lingkungan Node.js dan npm
echo [*] Memeriksa instalasi Node.js dan npm...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan di PATH sistem!
    echo Silakan install Node.js v18+ dan tambahkan ke PATH.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version 2^>^&1') do echo [OK] Node.js %%v ditemukan.

:: 3. Persiapan Database Backend
echo [*] Memeriksa database backend SQLite...
if not exist "%BACKEND_DIR%\nextrace.db" (
    echo [*] Database belum ada. Menginisialisasi skema dan data demo...
    pushd "%BACKEND_DIR%"
    python -c "import asyncio; from app.db.session import init_db; from app.db.seed import seed_demo_data; asyncio.run(init_db()); asyncio.run(seed_demo_data())"
    popd
    echo [OK] Database siap dan telah diisi data demo.
) else (
    echo [OK] Database backend nextrace.db ditemukan.
)

:: 4. Persiapan Modul Frontend
echo [*] Memeriksa dependensi frontend...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [*] Menginstal dependensi frontend...
    pushd "%FRONTEND_DIR%"
    call npm install
    popd
) else (
    echo [OK] Dependensi frontend node_modules sudah terpasang.
)

echo.
echo ===============================================================================
echo   MENJALANKAN LAYANAN NEXTRACE
echo ===============================================================================
echo [*] 1. Menjalankan Backend FastAPI pada port 8000...
start "NEXTRACE Backend Port 8000" /D "%BACKEND_DIR%" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [*] Menunggu backend online...
ping 127.0.0.1 -n 4 >nul

echo [*] 2. Menjalankan Frontend Next.js pada port 3000...
start "NEXTRACE Frontend Port 3000" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo [*] Menunggu inisialisasi frontend...
ping 127.0.0.1 -n 6 >nul

echo.
echo ===============================================================================
echo   SISTEM NEXTRACE BERHASIL DIJALANKAN!
echo ===============================================================================
echo   Dashboard Utama  : http://localhost:3000
echo   Backend REST API : http://localhost:8000
echo   Swagger OpenAPI  : http://localhost:8000/docs
echo   ReDoc API Docs   : http://localhost:8000/redoc
echo ===============================================================================
echo.
echo Membuka browser default ke http://localhost:3000...
start http://localhost:3000

echo Tekan sembarang tombol untuk menutup launcher ini.
pause >nul
