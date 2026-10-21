# Automated Verification & Test Runner
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Running Automated Verification & Test Suite    " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot

# 1. Backend Pytest
Write-Host "`n[1/2] Running Backend Unit & Simulation Tests..." -ForegroundColor Yellow
python -m pytest "$WorkspaceRoot\backend\tests" -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

# 2. Frontend TypeScript Build
Write-Host "`n[2/2] Running Frontend TypeScript Typecheck & Production Build..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests and production builds passed with 100% success!" -ForegroundColor Green
Set-Location "$WorkspaceRoot"
