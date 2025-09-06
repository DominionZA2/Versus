#!/bin/bash

echo ""
echo "========================================"
echo " Versus Development Server Starter"
echo "========================================"
echo ""

echo "[1/4] Stopping all Node.js processes..."
if pgrep node > /dev/null; then
    pkill -f node
    echo "     ✓ Node processes stopped"
else
    echo "     • No Node processes found"
fi

echo ""
echo "[2/4] Checking for processes on port 3000..."
if netstat -ano 2>/dev/null | grep :3000 > /dev/null; then
    echo "     • Found processes on port 3000, killing them..."
    # Kill processes using port 3000
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    echo "     ✓ Port 3000 processes killed"
else
    echo "     ✓ Port 3000 is free"
fi

echo ""
echo "[3/4] Waiting for ports to be released..."
sleep 2
echo "     ✓ Ports released"

echo ""
echo "[4/4] Starting development server on port 3000..."
echo ""

npm run dev