// MURDER.EXE desktop build for Steam. Loads the game from ./game (copied from ../prototype by copy-game.js) and
// connects it to Steam through steam.js: achievements, leaderboards, saves for Steam Cloud, and co-op lobbies.
// If Steam isn't running (or the SDK files aren't installed), the game still plays; Steam features switch off.
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path"), fs = require("fs"), steam = require("./steam");

if (process.env.MURDER_USERDATA) app.setPath("userData", process.env.MURDER_USERDATA); // tests: a throwaway save folder
let win = null;
function initSteam() {
  // The App ID: STEAM_APP_ID or steam_appid.txt while testing, the id Steam sets when it launches the game (SteamAppId),
  // and otherwise "steamAppId" in package.json, which must be your real App ID for release builds (480 is Valve's test app).
  const idFile = path.join(__dirname, "steam_appid.txt"), fromFile = fs.existsSync(idFile) ? fs.readFileSync(idFile, "utf8").trim() : "";
  const appId = +(process.env.STEAM_APP_ID || fromFile || process.env.SteamAppId || require("./package.json").steamAppId) || 480;
  const sdkDir = app.isPackaged ? path.join(process.resourcesPath, "steamworks_sdk") : path.join(__dirname, "steamworks_sdk");
  if (steam.init({ app, appId, sdkDir, release: app.isPackaged && !process.env.STEAM_DEV }) && process.platform === "win32") {
    app.commandLine.appendSwitch("in-process-gpu"); app.commandLine.appendSwitch("disable-direct-composition"); // lets the Steam overlay draw over the game on Windows
  }
}

ipcMain.on("steam:available", e => { e.returnValue = steam.ready(); });
ipcMain.on("steam:me", e => { e.returnValue = steam.me(); });
ipcMain.on("app:quit", () => app.quit());
ipcMain.on("app:fullscreen", (e, on) => { if (win && !win.isDestroyed()) win.setFullScreen(!!on); });
ipcMain.on("app:isFullscreen", e => { e.returnValue = !!(win && !win.isDestroyed() && win.isFullScreen()); });
ipcMain.on("steam:keyboard", (e, x, y, w, h) => { e.returnValue = !!steam.keyboard(+x, +y, +w, +h); });
ipcMain.on("steam:keyboardClose", () => steam.keyboardClose());
ipcMain.on("steam:onDeck", e => { e.returnValue = !!steam.onDeck(); });
ipcMain.on("steam:presence", (e, p) => steam.presence(p));
ipcMain.on("steam:activate", (e, name) => { steam.unlock(String(name)); });
ipcMain.handle("lb:submit", (e, name, score, details) => steam.submit(String(name), +score, details));
ipcMain.handle("lb:get", (e, name, scope) => steam.top(String(name), String(scope)));

// ---- Co-op over Steam: lobby + invites + peer-to-peer messages. Messages are polled every frame and passed to the game.
ipcMain.handle("coop:host", () => steam.host());
ipcMain.handle("coop:join", (e, lobbyId) => steam.join(String(lobbyId)));
ipcMain.handle("coop:leave", () => steam.leave());
ipcMain.handle("coop:state", () => steam.lobbyState());
ipcMain.handle("coop:friends", () => steam.friends());
ipcMain.handle("coop:invite", (e, id) => steam.invite(String(id)));
ipcMain.handle("coop:inviteOverlay", () => steam.inviteOverlay());
ipcMain.on("net:send", (e, to, text, reliable) => { if (typeof text === "string" && text.length < 600000) steam.sendTo(String(to), text, !!reliable); });
setInterval(() => { if (!win || win.isDestroyed()) return; const msgs = steam.poll(); if (msgs.length) win.webContents.send("net:msgs", msgs); }, 15);
steam.onPeer(ev => { if (win && !win.isDestroyed()) win.webContents.send("coop:peer", ev); });

// ---- Saves: save.json in the app-data folder (Windows %APPDATA%\MURDER.EXE, Linux and Steam Deck ~/.config/MURDER.EXE,
// macOS ~/Library/Application Support/MURDER.EXE). Steam Auto-Cloud syncs this one file between machines (see README).
// Writes go to a temp file that is renamed over the old one, so a crash mid-write can't corrupt the save; the previous
// good save is kept as save.json.bak. Saves are batched (at most every half second) and flushed on quit.
const SAVE_PATH = () => path.join(app.getPath("userData"), "save.json");
let pendingSave = null, saveTimer = null;
function writeSaveNow() {
  clearTimeout(saveTimer); saveTimer = null; if (pendingSave == null) return; const text = pendingSave; pendingSave = null;
  try { JSON.parse(text); const p = SAVE_PATH(); fs.mkdirSync(path.dirname(p), { recursive: true });
    if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak"); fs.writeFileSync(p + ".tmp", text); fs.renameSync(p + ".tmp", p); }
  catch (e) { console.warn("[save] could not write:", e.message); }
}
ipcMain.on("save:read", e => {
  const main = SAVE_PATH();
  try { if (fs.existsSync(main)) JSON.parse(fs.readFileSync(main, "utf8")); } catch (err) { try { fs.renameSync(main, main + ".corrupt-" + Date.now()); console.warn("[save] save.json was unreadable; kept a copy and loaded the backup"); } catch (e2) {} }
  for (const p of [main, main + ".bak"]) { try { const t = fs.readFileSync(p, "utf8"); JSON.parse(t); e.returnValue = t; return; } catch (err) {} }
  e.returnValue = null; // no file yet: the game falls back to (and migrates) its browser save
});
ipcMain.on("save:write", (e, text) => { if (typeof text !== "string" || text.length > 4e6) return; pendingSave = text; if (!saveTimer) saveTimer = setTimeout(writeSaveNow, 500); });
app.on("before-quit", () => { writeSaveNow(); steam.leave(); });

function createWindow() {
  // Fullscreen by default (Steam Deck included); F11 or Alt+Enter switches to a window. MURDER_WINDOWED=1 starts windowed.
  win = new BrowserWindow({ width: 1440, height: 816, minWidth: 960, minHeight: 544, backgroundColor: "#05040b", title: "MURDER.EXE", autoHideMenuBar: true, fullscreen: !process.env.MURDER_WINDOWED,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false, backgroundThrottling: false } }); // keeps co-op running while minimised
  win.loadFile(path.join(__dirname, "game", "index.html"));
  // Accepted a Steam invite (or Steam started the game from one): passed on once the game has loaded.
  win.webContents.once("did-finish-load", () => steam.onJoinRequest(lobbyId => { if (win && !win.isDestroyed()) win.webContents.send("coop:joinRequest", lobbyId); }));
  if (process.env.MURDER_SMOKE) smokeTest(win);
  win.webContents.on("before-input-event", (e, input) => { if (input.type === "keyDown" && (input.key === "F11" || (input.alt && input.key === "Enter"))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } });
}

// Self-test for any build: MURDER_SMOKE=1 starts the game, checks it reached the title screen with the Steam bridge
// in place, saves a screenshot to smoke-test.png beside the app, prints a JSON line and quits (exit code 1 on failure).
function smokeTest(win) {
  const errors = []; win.webContents.on("console-message", e => { if (e.level === "error") errors.push(e.message); });
  setTimeout(async () => {
    let r = {}; try { r = await win.webContents.executeJavaScript(`({ mode: __G.mode, bridge: typeof window.steamBridge, steam: !!(window.steamBridge && window.steamBridge.available), platform: PLATFORM.name, achievements: ACH.length, font: document.fonts.check('8px "Silkscreen"') })`); } catch (e) { errors.push(String(e)); }
    if (process.env.MURDER_SMOKE_EVAL) { try { r.eval = await win.webContents.executeJavaScript(process.env.MURDER_SMOKE_EVAL); await new Promise(ok => setTimeout(ok, 900)); } catch (e) { errors.push("eval: " + e.message); } } // extra checks for tests
    try { fs.writeFileSync(path.join(process.cwd(), "smoke-test.png"), (await win.webContents.capturePage()).toPNG()); } catch (e) { errors.push("screenshot: " + e.message); }
    const ok = r.mode === "title" && r.bridge === "object" && !errors.length; console.log("SMOKE " + JSON.stringify(Object.assign(r, { ok, errors }))); writeSaveNow(); app.exit(ok ? 0 : 1);
  }, 6000);
}

initSteam();
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
