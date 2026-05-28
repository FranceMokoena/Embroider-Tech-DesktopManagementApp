const { app, BrowserWindow, globalShortcut, Menu, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let updateAvailable = false;
let updateDownloaded = false;
let autoUpdater;
const tokenStoreFile = () => path.join(app.getPath('userData'), 'auth-tokens.bin');

function readStoredTokens() {
  try {
    const file = tokenStoreFile();
    if (!fs.existsSync(file)) return null;
    const encrypted = fs.readFileSync(file);
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Secure token read failed:', error.message);
    return null;
  }
}

function writeStoredTokens(tokens) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Electron secure storage encryption is unavailable on this device.');
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(tokens || {}));
  fs.writeFileSync(tokenStoreFile(), encrypted, { mode: 0o600 });
}

function clearStoredTokens() {
  try {
    const file = tokenStoreFile();
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (error) {
    console.error('Secure token clear failed:', error.message);
  }
}

function getAutoUpdater() {
  if (!autoUpdater) {
    try {
      autoUpdater = require('electron-updater').autoUpdater;
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;
      registerAutoUpdaterEvents();
    } catch (error) {
      console.error('Auto updater unavailable:', error.message);
      return null;
    }
  }

  return autoUpdater;
}

function resolveLocalIndex() {
  const candidates = [
    path.join(__dirname, '../build/index.html'),
    path.join(process.resourcesPath || '', 'app', 'build', 'index.html'),
    path.join(process.resourcesPath || '', 'app.asar', 'build', 'index.html')
  ];

  return candidates.find(candidate => candidate && fs.existsSync(candidate));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    icon: path.join(__dirname, '../public/logo.png'),
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#f3f4f6',
    title: 'EmbroideryTech RFID Asset ERP',
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: false,
      webSecurity: true,
      devTools: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webgl: false,
      plugins: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    getAutoUpdater()?.checkForUpdates().catch(error => {
      console.error('Update check failed:', error.message);
    });
  });

  const localIndex = resolveLocalIndex();
  if (!localIndex) {
    dialog.showErrorBox(
      'Missing UI',
      'The application bundle is missing build/index.html. Rebuild before packaging the desktop app.'
    );
    app.quit();
    return;
  }

  mainWindow.loadFile(localIndex);
  Menu.setApplicationMenu(null);

  ['CommandOrControl+Shift+I', 'F12', 'CommandOrControl+Shift+C', 'CommandOrControl+R'].forEach(accelerator => {
    globalShortcut.register(accelerator, () => false);
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.closeDevTools());
  mainWindow.webContents.on('context-menu', event => event.preventDefault());
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (!navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerAutoUpdaterEvents() {
  autoUpdater.on('update-available', info => {
    updateAvailable = true;
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'available',
        message: 'Update available',
        version: info.version,
        releaseNotes: info.releaseNotes
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'not-available', message: 'No updates available' });
    }
  });

  autoUpdater.on('download-progress', progress => {
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', {
        speed: progress.bytesPerSecond,
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total
      });
    }
  });

  autoUpdater.on('update-downloaded', info => {
    updateDownloaded = true;
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        message: 'Update downloaded',
        version: info.version
      });
    }
  });

  autoUpdater.on('error', error => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        message: error.message
      });
    }
  });
}

ipcMain.handle('check-for-updates', () => getAutoUpdater()?.checkForUpdates() || null);
ipcMain.handle('download-update', () => {
  if (updateAvailable) return getAutoUpdater()?.downloadUpdate() || null;
  return null;
});
ipcMain.handle('install-update', () => {
  if (updateDownloaded) getAutoUpdater()?.quitAndInstall();
});

ipcMain.handle('auth:get-tokens', () => readStoredTokens());
ipcMain.handle('auth:set-tokens', (event, tokens) => {
  writeStoredTokens(tokens);
  return true;
});
ipcMain.handle('auth:clear-tokens', () => {
  clearStoredTokens();
  return true;
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('ready', createWindow);
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.disableHardwareAcceleration();

if (process.argv.includes('--inspect') || process.argv.includes('--inspect-brk')) {
  app.quit();
}
