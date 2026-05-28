const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAuth', {
  getTokens: () => ipcRenderer.invoke('auth:get-tokens'),
  setTokens: tokens => ipcRenderer.invoke('auth:set-tokens', tokens),
  clearTokens: () => ipcRenderer.invoke('auth:clear-tokens')
});
