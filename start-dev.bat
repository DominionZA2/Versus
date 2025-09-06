@echo off
echo.
echo ========================================
echo  Versus Development Server Starter
echo ========================================
echo.

echo [1/4] Stopping all Node.js processes...
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% equ 0 (
    taskkill /f /im node.exe >nul 2>&1
    echo     ✓ Node processes stopped
) else (
    echo     • No Node processes found
)

echo.
echo [2/4] Checking for processes on port 3000...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo     • Found processes on port 3000, attempting to kill...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    echo     ✓ Port 3000 processes killed
) else (
    echo     ✓ Port 3000 is free
)

echo.
echo [3/4] Waiting for ports to be released...
timeout /t 2 /nobreak >nul
echo     ✓ Ports released

echo.
echo [4/4] Starting development server on port 3000...
echo.
npm run dev