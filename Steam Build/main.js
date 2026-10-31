// MURDER.EXE desktop build for Steam. Loads the game from ./game (copied from ../prototype by copy-game.js)
// and unlocks Steam achievements through steamworks.js. If Steam isn't running, the game still plays; it just
// can't unlock achievements until the next launch (the game re-sends every earned achievement on start-up).
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path"), fs = require("fs");

let steam = null;
function initSteam() {
  try {
    const steamworks = require("steamworks.js");
    // Launched from Steam, the app id comes from Steam itself. For local testing, steam_appid.txt (or STEAM_APP_ID) supplies it.
    const idFile = path.join(__dirname, "steam_appid.txt"), fromFile = fs.existsSync(idFile) ? fs.readFileSync(idFile, "utf8").trim() : "";
    const appId = +(process.env.STEAM_APP_ID || fromFile) || undefined;
    // Release builds: if someone starts the .exe directly, relaunch it through Steam (skipped for the 480 test app).
    if (appId && appId !== 480 && !process.env.STEAM_DEV && steamworks.restartAppIfNecessary(appId)) { app.quit(); return; }
    steam = steamworks.init(appId);
    steamworks.electronEnableSteamOverlay();
    console.log("[steam] ready for", steam.localplayer.getName());
  } catch (e) { steam = null; console.warn("[steam] not available, achievements will sync next time:", e.message); }
}

ipcMain.on("steam:available", e => { e.returnValue = !!steam; });
ipcMain.on("app:quit", () => app.quit());
ipcMain.on("steam:activate", (e, name) => {
  if (!steam || typeof name !== "string" || !/^MURDER_[A-Z0-9_]+$/.test(name)) return;
  try { if (!steam.achievement.isActivated(name)) steam.achievement.activate(name); } catch (err) { console.warn("[steam] could not unlock", name, err.message); }
});

function createWindow() {
  // Fullscreen by default (Steam Deck included); F11 or Alt+Enter switches to a window. MURDER_WINDOWED=1 starts windowed.
  const win = new BrowserWindow({ width: 1440, height: 816, minWidth: 960, minHeight: 544, backgroundColor: "#05040b", title: "MURDER.EXE", autoHideMenuBar: true, fullscreen: !process.env.MURDER_WINDOWED,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false } });
  win.loadFile(path.join(__dirname, "game", "index.html"));
  if (process.env.MURDER_SMOKE) smokeTest(win);
  win.webContents.on("before-input-event", (e, input) => { if (input.type === "keyDown" && (input.key === "F11" || (input.alt && input.key === "Enter"))) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } });
}

// Self-test for any build: MURDER_SMOKE=1 starts the game, checks it reached the title screen with the Steam bridge
// in place, saves a screenshot to smoke-test.png beside the app, prints a JSON line and quits (exit code 1 on failure).
function smokeTest(win) {
  const errors = []; win.webContents.on("console-message", (e, level, msg) => { if (level >= 3) errors.push(msg); });
  setTimeout(async () => {
    let r = {}; try { r = await win.webContents.executeJavaScript(`({ mode: __G.mode, bridge: typeof window.steamBridge, steam: !!(window.steamBridge && window.steamBridge.available), platform: PLATFORM.name, achievements: ACH.length, font: document.fonts.check('8px "Silkscreen"') })`); } catch (e) { errors.push(String(e)); }
    try { fs.writeFileSync(path.join(process.cwd(), "smoke-test.png"), (await win.webContents.capturePage()).toPNG()); } catch (e) { errors.push("screenshot: " + e.message); }
    const ok = r.mode === "title" && r.bridge === "object" && !errors.length; console.log("SMOKE " + JSON.stringify(Object.assign(r, { ok, errors }))); app.exit(ok ? 0 : 1);
  }, 6000);
}

initSteam();
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
