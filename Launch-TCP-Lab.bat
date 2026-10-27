@echo off
title TCP Congestion Control Research Lab
echo ========================================================
echo   TCP Congestion Control Research Lab - Auto Launcher
echo ========================================================
echo.

cd /d "%~dp0"

:: Check if Backend (Port 8000) is already active
netstat -ano | findstr /R /C:":8000 .*LISTENING" > nul
if %errorlevel% equ 0 (
    echo [Backend] Port 8000 is already active.
) else (
    echo [1/3] Launching FastAPI Backend on port 8000...
    start "TCP Lab Backend" /min cmd /c "cd /d ""%~dp0backend"" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
)

:: Check if Frontend (Port 5173) is already active
netstat -ano | findstr /R /C:":5173 .*LISTENING" > nul
if %errorlevel% equ 0 (
    echo [Frontend] Port 5173 is already active.
) else (
    echo [2/3] Launching React Dashboard on port 5173...
    start "TCP Lab Frontend" /min cmd /c "cd /d ""%~dp0frontend"" && npm run dev"
)

echo [3/3] Connecting to services...
timeout /t 2 /nobreak > nul

echo Opening Dashboard in your default browser...
start http://localhost:5173

echo.
echo ========================================================
echo   TCP Congestion Control Lab is READY!
echo   - Dashboard URL: http://localhost:5173
echo   - Backend Docs:  http://127.0.0.1:8000/docs
echo   - Database:      Connected (lab.db)
echo ========================================================
timeout /t 4 > nul
