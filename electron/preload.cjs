// 桌面女友 - preload 桥接
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  setHitRegion: (r) => ipcRenderer.send('set-hit-region', r),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  moveBy: (dx, dy) => ipcRenderer.send('move-by', dx, dy),
  moveTo: (x, y) => ipcRenderer.send('move-to', x, y),
  savePosition: () => ipcRenderer.send('save-position'),
  quit: () => ipcRenderer.send('quit'),
  hide: () => ipcRenderer.send('hide'),
  show: () => ipcRenderer.send('show'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  llmChat: (payload) => ipcRenderer.invoke('llm-chat', payload),
  edgeTts: (text, voiceName, pitch) => ipcRenderer.invoke('edge-tts', text, voiceName, pitch),
});
