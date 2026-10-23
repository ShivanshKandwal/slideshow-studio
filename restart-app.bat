@echo off
title Restart ChronoStudio
echo ========================================================
echo          Stopping existing servers and restarting...
echo ========================================================

:: 1. Kill any existing python and node/vite processes on ports 8000 and 5174
echo Stopping old server processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

:: 2. Launch Backend
echo [1/2] Launching Backend Server on http://localhost:8000 ...
start "ChronoStudio Backend" cmd /k "cd /d C:\Software\slideshow-studio\backend && python server.py"

:: 3. Launch Frontend
echo [2/2] Launching Frontend UI on http://localhost:5174 ...
start "ChronoStudio Frontend" cmd /k "cd /d C:\Software\slideshow-studio\frontend && npm run dev"

timeout /t 3 /nobreak >nul

:: 4. Open fresh browser window
echo Opening fresh ChronoStudio session...
start http://localhost:5174

echo ========================================================
echo Done! All servers refreshed.
echo ========================================================
