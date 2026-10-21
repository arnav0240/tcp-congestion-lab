# PowerShell startup script for TCP Congestion Control Research Lab
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TCP Congestion Control Research Lab - Starting Services " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot

# 1. Start Python FastAPI Backend on port 8000
Write-Host "[1/2] Launching Backend API on http://127.0.0.1:8000 ..." -ForegroundColor Green
$BackendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory "$WorkspaceRoot\backend" -PassThru

Start-Sleep -Seconds 2

# 2. Start Vite Frontend on port 5173
Write-Host "[2/2] Launching Frontend Interface on http://localhost:5173 ..." -ForegroundColor Green
$FrontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "$WorkspaceRoot\frontend" -PassThru

Write-Host ""
Write-Host "Both services are active!" -ForegroundColor Yellow
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Docs:  http://127.0.0.1:8000/api/docs" -ForegroundColor Cyan
Write-Host "Health:    http://127.0.0.1:8000/api/v1/health" -ForegroundColor Cyan
Write-Host "Press Ctrl+C or close the console windows to stop." -ForegroundColor Gray
