#!/usr/bin/env bash
# Startup script for TCP Congestion Control Research Lab (Linux / macOS)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================================="
echo "  TCP Congestion Control Research Lab - Starting Services "
echo "=========================================================="

# 1. Start Backend in background
echo "[1/2] Starting Backend API on http://127.0.0.1:8000 ..."
cd "$WORKSPACE_ROOT/backend"
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

sleep 2

# 2. Start Frontend
echo "[2/2] Starting Frontend on http://localhost:5173 ..."
cd "$WORKSPACE_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both services are running!"
echo "Frontend:  http://localhost:5173"
echo "API Docs:  http://127.0.0.1:8000/api/docs"
echo "Health:    http://127.0.0.1:8000/api/v1/health"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
