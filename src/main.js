const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev'); // Detect dev mode

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load React app URL in dev, or the build index.html in production
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();

    // Optional: Auto-reload when files change
    try {
      require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
      });
    } catch (err) {
      console.log('electron-reload not installed, skipping auto-reload');
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Manual reload shortcut: Ctrl+R / Cmd+R
  globalShortcut.register('CommandOrControl+R', () => {
    if (mainWindow) mainWindow.reload();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
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
