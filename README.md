# ChronoStudio — Quick Start Guide

## Option 1: 1-Click Launch (Easiest)
Double-click the launcher script created in the project folder:
📁 `C:\Software\slideshow-studio\start-app.bat`

This will automatically:
1. Start the Python FFmpeg backend server on `http://localhost:8000`.
2. Start the Vite React UI on `http://localhost:5174`.
3. Open your default web browser directly to the dashboard.

---

## Option 2: Manual Terminal Launch

Open two PowerShell windows:

### Terminal 1 (Backend Pipeline & YouTube API):
```powershell
cd C:\Software\slideshow-studio\backend
python server.py
```

### Terminal 2 (Frontend UI):
```powershell
cd C:\Software\slideshow-studio\frontend
npm run dev
```
Then visit: **[http://localhost:5174/](http://localhost:5174/)**

---

## Connecting Your YouTube Account:
1. Download your OAuth 2.0 Client credentials JSON from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Application type: *Desktop App*).
2. Save that file as:
   `C:\Software\slideshow-studio\backend\client_secrets.json`
3. Click **"Connect YouTube"** on the top navigation bar. It opens your browser to sign in to your channel once, saving your session for all future uploads.
