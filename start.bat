@echo off
title Construction Suite — Setup & Launch
cd /d "%~dp0"

:: ── Check Python ──────────────────────────────────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo         Download from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python found

:: ── Check Node ────────────────────────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Download from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

:: ── Install backend dependencies ──────────────────────────────────────────
echo.
echo [1/5] Installing backend Python packages...
cd /d "%~dp0backend"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARN] pip install had issues — continuing anyway
)

:: ── Seed database (if not already seeded) ─────────────────────────────────
echo.
echo [2/5] Checking database...
cd /d "%~dp0backend"
if not exist "construction_suite.db" (
    echo         Seeding database for the first time...
    python seed_data.py
) else (
    echo         Database already exists — skipping seed
)

:: ── Install frontend dependencies ─────────────────────────────────────────
echo.
echo [3/5] Installing frontend npm packages...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [WARN] npm install had issues — continuing anyway
)

:: ── Start backend server ─────────────────────────────────────────────────
echo.
echo [4/5] Starting backend API server...
cd /d "%~dp0backend"
start "Backend — Construction Suite" cmd /c "uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 & pause"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: ── Start frontend dev server ────────────────────────────────────────────
echo.
echo [5/5] Starting frontend dev server...
cd /d "%~dp0frontend"
start "Frontend — Construction Suite" cmd /c "npm run dev & pause"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

:: ── Open browser ─────────────────────────────────────────────────────────
echo.
echo Opening browser to http://localhost:5173
start http://localhost:5173

echo.
echo ========================================================================
echo  Construction Suite is starting up!
echo  - Backend API:  http://127.0.0.1:8000
echo  - API Docs:     http://127.0.0.1:8000/docs
echo  - Frontend:     http://localhost:5173
echo.
echo  Demo login: admin@construction.bw / Admin@1234
echo ========================================================================
echo.
echo Close this window to stop the servers (or close the individual windows).
pause
