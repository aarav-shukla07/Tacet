const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onToggle: (cb) => {
    // cb will get (event) argument — we wrap to call without args
    ipcRenderer.on('toggle-overlay', () => cb());
  }
});
