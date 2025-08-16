const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

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
      devTools: isDev, // Only enable dev tools in development
    },
    // Professional window settings
    backgroundColor: '#ffffff',
    title: 'Embroidery Tech Management',
    resizable: true,
    maximizable: true,
    fullscreenable: false,
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Load React app URL in dev, or the build index.html in production
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Only open dev tools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Remove menu bar in production for cleaner look
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

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
