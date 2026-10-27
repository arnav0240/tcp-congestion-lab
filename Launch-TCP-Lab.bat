@echo off
title TCP Congestion Control Research Lab Launcher
echo ========================================================
echo   TCP Congestion Control Research Lab - Auto Launcher
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Launching Backend API & Database on port 8000...
start "TCP Lab Backend" /min cmd /c "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Launching Frontend Interface on port 5173...
start "TCP Lab Frontend" /min cmd /c "cd frontend && npm run dev"

echo [3/3] Waiting for services to connect...
timeout /t 3 /nobreak > nul

echo Opening Dashboard in browser...
start http://localhost:5173

echo.
echo ========================================================
echo   All services are connected and ready to present!
echo   - Dashboard URL: http://localhost:5173
echo   - Backend API:   http://127.0.0.1:8000
echo   - Database:      Connected (lab.db)
echo ========================================================
echo You can minimize this window.
timeout /t 5 > nul
