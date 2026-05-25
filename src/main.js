const { app, BrowserWindow, globalShortcut, Menu, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

const DEFAULT_LOCAL_ASSET_CONSOLE_URL = 'http://localhost:5011/asset-console/';
const DEFAULT_PRODUCTION_ASSET_CONSOLE_URL = 'https://embroiderytech-desktop.onrender.com/asset-console/';

const getAssetConsoleUrl = () =>
  process.env.DESKTOP_ASSET_CONSOLE_URL ||
  process.env.REACT_APP_DESKTOP_ASSET_CONSOLE_URL ||
  (isDev ? DEFAULT_LOCAL_ASSET_CONSOLE_URL : DEFAULT_PRODUCTION_ASSET_CONSOLE_URL);

const isAllowedAssetConsoleNavigation = navigationUrl => {
  try {
    const allowedOrigin = new URL(getAssetConsoleUrl()).origin;
    const parsedUrl = new URL(navigationUrl);
    return parsedUrl.origin === allowedOrigin;
  } catch {
    return false;
  }
};

// Auto-updater configuration
autoUpdater.autoDownload = false; // We'll handle download manually to show progress
autoUpdater.autoInstallOnAppQuit = true;

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
    title: 'EmbroideryTech Management System',
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

  // The RFID asset console is the canonical desktop UI.
  mainWindow.loadURL(getAssetConsoleUrl());

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
    
    if (isAllowedAssetConsoleNavigation(navigationUrl)) {
      return;
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
  
  // Show update dialog
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available!`,
    detail: 'Would you like to download and install the update now?',
    buttons: ['Download Now', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      // User clicked "Download Now"
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('✅ No updates available');
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
  
  // Show install dialog
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: `Update ${info.version} has been downloaded!`,
    detail: 'The application will restart to install the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      // User clicked "Restart Now"
      autoUpdater.quitAndInstall();
    }
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
    autoUpdater.quitAndInstall();
  }
});

// Electron app lifecycle
app.on('ready', createWindow);

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
