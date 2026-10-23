@echo off
title ChronoStudio Launcher
echo ========================================================
echo        Starting ChronoStudio & YouTube Publisher       
echo ========================================================

:: Check if backend folder exists
if not exist "C:\Software\slideshow-studio\backend" (
    echo Error: Project folder not found!
    pause
    exit /b
)

:: 1. Launch FastAPI & FFmpeg Backend Server
echo [1/2] Starting Python Backend API on http://localhost:8000 ...
start "ChronoStudio Backend" cmd /k "cd /d C:\Software\slideshow-studio\backend && python server.py"

:: 2. Launch Vite Frontend UI
echo [2/2] Starting Frontend UI on http://localhost:5174 ...
start "ChronoStudio Frontend" cmd /k "cd /d C:\Software\slideshow-studio\frontend && npm run dev"

:: Wait 3 seconds for servers to initialize
timeout /t 3 /nobreak >nul

:: 3. Automatically open default web browser
echo Opening ChronoStudio in your browser...
start http://localhost:5174

echo ========================================================
echo ChronoStudio is now up and running!
echo You can keep the console windows open while using the app.
echo ========================================================
