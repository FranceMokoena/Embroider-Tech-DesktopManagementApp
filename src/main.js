const { app, BrowserWindow, globalShortcut, Menu, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const dotenv = require('dotenv');
const isDev = require('electron-is-dev');

const rootEnvPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: rootEnvPath });
const devServerPort = process.env.PORT || 3000;
const electronDevUrl = process.env.ELECTRON_DEV_URL || `http://localhost:${devServerPort}`;

let mainWindow;

// Auto-updater configuration (enforced updates in production)
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false;

const UPDATE_CHECK_INTERVAL_MS = 1000 * 60 * 60; // 1 hour

// Update status variables
let updateAvailable = false;
let updateDownloaded = false;

function createWindow() {
  // Create the browser window with professional settings
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, '../public/logo.png'), // Use your logo as app icon
    titleBarStyle: 'default', // Use native title bar
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      devTools: false, // Completely disable dev tools in all environments
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webgl: false,
      plugins: false,
    },
    // Professional window settings
    backgroundColor: '#ffffff',
    title: 'Amrod Digital Asset Tracking Management System',
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    // Security settings
    webSecurity: true,
    allowRunningInsecureContent: false,
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    
    // Check for updates when app starts (only in production)
    if (!isDev) {
      console.log('🔍 Checking for updates on startup...');
      autoUpdater.checkForUpdates();
    }
  });

  // Load React app URL in dev, or the build index.html in production
  if (isDev) {
    mainWindow.loadURL(electronDevUrl);
    // Completely disable dev tools even in development for testing
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      const tokenCleared = sessionStorage.getItem('adminTokenCleared');
      const backupToken = sessionStorage.getItem('adminTokenBackup');
      if (!tokenCleared) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        sessionStorage.removeItem('adminTokenBackup');
        sessionStorage.removeItem('adminUsernameBackup');
        sessionStorage.setItem('adminTokenCleared', '1');
      } else if (!localStorage.getItem('adminToken') && backupToken) {
        localStorage.setItem('adminToken', backupToken);
        const usernameBackup = sessionStorage.getItem('adminUsernameBackup');
        if (usernameBackup && !localStorage.getItem('adminUsername')) {
          localStorage.setItem('adminUsername', usernameBackup);
        }
      }
    `, true);
  });

  // Remove menu bar completely for cleaner look
  Menu.setApplicationMenu(null);

  // Disable all keyboard shortcuts that could open dev tools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    // Prevent opening dev tools
    return false;
  });

  globalShortcut.register('F12', () => {
    // Prevent F12 from opening dev tools
    return false;
  });

  globalShortcut.register('CommandOrControl+Shift+C', () => {
    // Prevent opening dev tools
    return false;
  });

  // Manual reload shortcut: Ctrl+R / Cmd+R (only in dev)
  if (isDev) {
    globalShortcut.register('CommandOrControl+R', () => {
      if (mainWindow) mainWindow.reload();
    });
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Additional security: Prevent dev tools from being opened
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });

  // Disable right-click context menu in production
  if (!isDev) {
    mainWindow.webContents.on('context-menu', (e) => {
      e.preventDefault();
    });
  }

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const devOrigin = isDev ? new URL(electronDevUrl).origin : undefined;
    
    if (isDev && parsedUrl.origin === devOrigin) {
      return; // Allow localhost in development
    }
    
    if (!isDev && parsedUrl.protocol === 'file:') {
      return; // Allow file protocol in production
    }
    
    event.preventDefault();
  });
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('🔍 Checking for updates...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking', message: 'Checking for updates...' });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('✅ Update available:', info);
  updateAvailable = true;
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'available', 
      message: 'Update available!',
      version: info.version,
      releaseNotes: info.releaseNotes
    });
  }
  
  // Enforce update: download immediately and inform the user
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Required',
    message: `A new version (${info.version}) is available.`,
    detail: 'The update will download now and the app will restart to finish installation.',
    buttons: ['OK'],
    defaultId: 0
  }).finally(() => {
    autoUpdater.downloadUpdate();
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('✅ No updates available');
  updateAvailable = false;
  updateDownloaded = false;
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'not-available', message: 'No updates available' });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('📥 Download progress:', progressObj);
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', {
      speed: progressObj.bytesPerSecond,
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ Update downloaded:', info);
  updateDownloaded = true;
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloaded', 
      message: 'Update downloaded and ready to install!',
      version: info.version
    });
  }
  
  // Enforce install immediately
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Installing Update',
    message: `Update ${info.version} is ready to install.`,
    detail: 'The application will restart now.',
    buttons: ['OK'],
    defaultId: 0
  }).finally(() => {
    autoUpdater.quitAndInstall(true, true);
  });
});

autoUpdater.on('error', (err) => {
  console.error('❌ Auto-updater error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'error', 
      message: 'Update error: ' + err.message 
    });
  }

  if (updateAvailable) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Failed',
      message: 'An update is required but could not be downloaded.',
      detail: err.message,
      buttons: ['Retry', 'Quit'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.checkForUpdates();
      } else {
        app.quit();
      }
    });
  }
});

// IPC handlers for update actions
ipcMain.handle('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.handle('download-update', () => {
  if (updateAvailable && !isDev) {
    autoUpdater.downloadUpdate();
  }
});

ipcMain.handle('install-update', () => {
  if (updateDownloaded && !isDev) {
    autoUpdater.quitAndInstall(true, true);
  }
});

// Electron app lifecycle
app.on('ready', () => {
  createWindow();

  if (!isDev) {
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Additional security: Disable GPU acceleration if not needed
app.disableHardwareAcceleration();

// Security: Prevent app from being run with --inspect flag
if (process.argv.includes('--inspect') || process.argv.includes('--inspect-brk')) {
  console.log('Debug mode is disabled for security reasons');
  app.quit();
}
