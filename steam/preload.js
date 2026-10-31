// Exposes a tiny, safe Steam bridge to the game as window.steamBridge (read by prototype/g-platform.js).
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("steamBridge", {
  available: ipcRenderer.sendSync("steam:available"),
  activate: name => ipcRenderer.send("steam:activate", String(name)),
});
