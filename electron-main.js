const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Fix Chromium/Electron Windows cache lock conflicts by setting a dedicated clean user data directory
const customUserDataPath = path.join(app.getPath('appData'), 'ChronoStudio_UserData');
app.setPath('userData', customUserDataPath);

let mainWindow;
let backendProcess;

function getPythonPath() {
  const possiblePaths = [
    'C:\\Users\\hp\\miniconda3\\python.exe',
    'python',
    'py'
  ];
  const fs = require('fs');
  for (const p of possiblePaths) {
    if (p.includes('\\') && fs.existsSync(p)) {
      return p;
    }
  }
  return 'python';
}

function startBackend() {
  const isPackaged = app.isPackaged;
  let backendExec;
  let cwd;

  if (isPackaged) {
    // In built package, standalone compiled backend binary resides in process.resourcesPath/backend/server.exe
    backendExec = path.join(process.resourcesPath, 'backend', 'server.exe');
    cwd = path.join(process.resourcesPath, 'backend');
  } else {
    // In development mode, invoke python directly
    const pythonExec = getPythonPath();
    backendExec = pythonExec;
    cwd = path.join(__dirname, 'backend');
  }

  const args = isPackaged ? [] : ['server.py'];
  console.log(`Starting backend: ${backendExec} in ${cwd}`);
  
  backendProcess = spawn(backendExec, args, {
    cwd: cwd,
    shell: !isPackaged,
    stdio: 'ignore'
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#08080a',
    title: 'ChronoStudio — Slideshow & YouTube Auto-Publisher',
    icon: path.join(__dirname, 'frontend/dist/vite.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // Load built app or dev server
  const devUrl = 'http://localhost:5174';
  const prodPath = `file://${path.join(__dirname, 'frontend/dist/index.html')}`;

  const loadUrl = process.env.ELECTRON_DEV ? devUrl : prodPath;
  mainWindow.loadURL(loadUrl);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native Folder Dialog IPC
ipcMain.handle('dialog:openFolder', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    defaultPath: defaultPath || undefined
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Native File Dialog IPC (for audio)
ipcMain.handle('dialog:openAudioFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'flac', 'ogg'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    try {
      const { exec } = require('child_process');
      // On Windows kill process tree cleanly
      exec(`taskkill /pid ${backendProcess.pid} /t /f`);
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
