const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
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

function createWindow() {
  // Create the browser window with professional settings
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, 'logo.png'), // Use your logo as app icon
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
    title: 'Embroidery Tech Management',
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
