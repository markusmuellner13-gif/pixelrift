const { contextBridge, ipcRenderer } = require('electron');

// Expose safe Electron APIs to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getUserDataPath:  () => ipcRenderer.invoke('get-user-data-path'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  platform: process.platform,
  isElectron: true,
});
