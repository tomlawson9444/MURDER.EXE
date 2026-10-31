// The safe bridge the game sees as window.steamBridge (read by prototype/g-platform.js, g-loadout.js and g-net.js).
// "steam" is already a drawing function in the game, hence the longer name.
const { contextBridge, ipcRenderer } = require("electron");
const listeners = { msgs: [], peer: [], joinRequest: [] };
ipcRenderer.on("net:msgs", (e, msgs) => listeners.msgs.forEach(fn => fn(msgs)));
ipcRenderer.on("coop:peer", (e, ev) => listeners.peer.forEach(fn => fn(ev)));
ipcRenderer.on("coop:joinRequest", (e, id) => listeners.joinRequest.forEach(fn => fn(id)));
contextBridge.exposeInMainWorld("steamBridge", {
  available: ipcRenderer.sendSync("steam:available"),
  me: ipcRenderer.sendSync("steam:me"),
  activate: name => ipcRenderer.send("steam:activate", String(name)),
  quit: () => ipcRenderer.send("app:quit"),
  readSave: () => ipcRenderer.sendSync("save:read"),
  writeSave: text => ipcRenderer.send("save:write", String(text)),
  lbSubmit: (name, score, details) => ipcRenderer.invoke("lb:submit", String(name), +score, (details || []).map(Number)),
  lbGet: (name, scope) => ipcRenderer.invoke("lb:get", String(name), String(scope)),
  coop: {
    host: () => ipcRenderer.invoke("coop:host"), join: id => ipcRenderer.invoke("coop:join", String(id)), leave: () => ipcRenderer.invoke("coop:leave"),
    state: () => ipcRenderer.invoke("coop:state"), friends: () => ipcRenderer.invoke("coop:friends"), invite: id => ipcRenderer.invoke("coop:invite", String(id)),
    inviteOverlay: () => ipcRenderer.invoke("coop:inviteOverlay"),
    send: (to, text, reliable) => ipcRenderer.send("net:send", String(to), String(text), !!reliable),
    onMessages: fn => listeners.msgs.push(fn), onPeer: fn => listeners.peer.push(fn), onJoinRequest: fn => listeners.joinRequest.push(fn),
  },
});
