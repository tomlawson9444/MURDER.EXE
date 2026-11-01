/* SETTINGS: sound, display and accessibility, controller, keyboard keys, and credits. Opened from the title screen
   (G.mode "settings") and from the pause menu (G.settingsOpen over a paused run). Everything saves at once: these
   settings in SAVE.settings, the controller ones in SAVE.pad (g-pad.js). */
"use strict";
const SET_DEFAULTS = { music: 8, sfx: 9, shake: true, flashes: true };
// Fills in missing settings in place (menu rows keep a reference to this object, so it is never replaced).
const setCfg = () => { const S = SAVE.settings || (SAVE.settings = {}); for (const k in SET_DEFAULTS) if (S[k] === undefined) S[k] = SET_DEFAULTS[k]; if (!S.keys) S.keys = {}; return S; };
const VERSION = () => (typeof window !== "undefined" && window.MURDER_VERSION) || { v: "dev" };
const versionLabel = () => { const V = VERSION(); return V.v === "dev" ? "DEV BUILD" : "V" + V.v + (V.sha ? " · " + V.sha : ""); };

/* ---- Keyboard keys ---- */
// Actions that can be rebound, and the key the game itself listens for. The arrow keys always move as well.
const KEY_ACTIONS = [["up", "MOVE UP", "w"], ["down", "MOVE DOWN", "s"], ["left", "MOVE LEFT", "a"], ["right", "MOVE RIGHT", "d"],
  ["dash", "DASH", " "], ["reload", "RELOAD", "r"], ["hack", "HACK", "q"], ["oc", "OVERCLOCK (ALSO RIGHT MOUSE)", "f"], ["pause", "PAUSE (ALSO ESC)", "p"]];
const keyOf = a => setCfg().keys[a[0]] || a[2];
const keyName = k => ({ " ": "SPACE", arrowup: "UP", arrowdown: "DOWN", arrowleft: "LEFT", arrowright: "RIGHT", backspace: "BACKSPACE", tab: "TAB", shift: "SHIFT", control: "CTRL", alt: "ALT" })[k] || k.toUpperCase();
// During play a rebound key acts as the original one, and an original key that was moved elsewhere does nothing.
// Menus and name typing always see the real keys.
function remapKey(k) {
  if (G.mode !== "play" || SETTINGS.capture) return k;
  if (G.paused) { const P = KEY_ACTIONS[KEY_ACTIONS.length - 1]; return keyOf(P) === k ? "p" : k; } // menus use the real keys; the pause key still resumes
  for (const a of KEY_ACTIONS) if (keyOf(a) === k) return a[2];
  for (const a of KEY_ACTIONS) if (a[2] === k && keyOf(a) !== k) return "";
  return k;
}
function bindKey(action, k) {
  const S = setCfg(), mine = KEY_ACTIONS.find(a => a[0] === action), old = keyOf(mine), other = KEY_ACTIONS.find(a => a !== mine && keyOf(a) === k);
  if (other) S.keys[other[0]] = old; // swap, so no key does two things
  S.keys[action] = k; for (const a of KEY_ACTIONS) if (S.keys[a[0]] === a[2]) delete S.keys[a[0]]; persist();
}

/* ---- Applying them ---- */
const applyAudio = () => { const S = setCfg(); AU.setVolumes(S.music / 10, S.sfx / 10); };
const isFullscreen = () => window.steamBridge && window.steamBridge.isFullscreen ? window.steamBridge.isFullscreen() : !!document.fullscreenElement;
function setFullscreen(on) {
  if (window.steamBridge && window.steamBridge.setFullscreen) return window.steamBridge.setFullscreen(on);
  try { if (on) document.documentElement.requestFullscreen(); else if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
}

/* ---- The screen ---- */
const SETTINGS = { sel: 0, top: 0, capture: null, view: "list", scroll: 0, from: null, mx: 0, my: 0 };
function openSettings(from) { Object.assign(SETTINGS, { sel: 0, top: 0, capture: null, view: "list", scroll: 0, from, mx: mouse.x, my: mouse.y }); if (from === "title") G.mode = "settings"; else G.settingsOpen = true; AU.sfx("lock", 2); }
function closeSettings() { persist(); if (SETTINGS.from === "title") { G.mode = "title"; G.menuMode = null; } else G.settingsOpen = false; AU.sfx("lock", 0); }
function settingsRows() {
  const S = setCfg(), P = padCfg(), onOff = v => v ? "ON" : "OFF", vol = (k, label) => ({ label, val: S[k], bar: true, step: d => { S[k] = Math.max(0, Math.min(10, S[k] + d)); applyAudio(); AU.sfx("lock", S[k] % 6); } });
  return [{ head: "SOUND" }, vol("music", "MUSIC"), vol("sfx", "SOUND EFFECTS"),
    { head: "DISPLAY AND ACCESSIBILITY" },
    { label: "FULLSCREEN", val: onOff(isFullscreen()), step: () => setFullscreen(!isFullscreen()) },
    { label: "SCREEN SHAKE", val: onOff(S.shake), step: () => { S.shake = !S.shake; } },
    { label: "FLASHING EFFECTS", val: S.flashes ? "ON" : "REDUCED", step: () => { S.flashes = !S.flashes; } },
    { head: "CONTROLLER" },
    { label: "AIM ASSIST", val: ["OFF", "NORMAL", "STRONG"][P.assist], step: d => { P.assist = (P.assist + d + 3) % 3; } },
    { label: "AUTO-FIRE (RIGHT STICK)", val: onOff(P.autofire), step: () => { P.autofire = !P.autofire; } },
    { label: "AIM LINE", val: onOff(P.aimline), step: () => { P.aimline = !P.aimline; } },
    { label: "RUMBLE", val: onOff(P.rumble), step: () => { P.rumble = !P.rumble; if (P.rumble) rumble(.6, .6, 200); } },
    { label: "STICK DEADZONE", val: ["LOW", "MEDIUM", "HIGH (WORN STICKS)"][P.dz], step: d => { P.dz = (P.dz + d + 3) % 3; } },
    { head: "KEYBOARD" }]
    .concat(KEY_ACTIONS.map(a => ({ label: a[1], val: SETTINGS.capture === a[0] ? "PRESS A KEY…" : keyName(keyOf(a)), act: () => { SETTINGS.capture = a[0]; AU.sfx("lock", 3); } })),
      [{ label: "RESET KEYS", act: () => { S.keys = {}; persist(); AU.sfx("lock", 4); } },
       { head: "" }, { label: "CREDITS AND LICENCES", act: () => { SETTINGS.view = "credits"; SETTINGS.scroll = 0; } }, { label: "BACK", act: closeSettings }]);
}
const SET_ROW_H = 13, SET_LIST_Y = 40, SET_LIST_ROWS = 15;
function updateSettings(rdt) {
  const S = SETTINGS;
  if (S.view === "credits") { if (hit("arrowdown") || hit("s")) S.scroll = Math.min(CREDITS.length - 17, S.scroll + 1); if (hit("arrowup") || hit("w")) S.scroll = Math.max(0, S.scroll - 1);
    if (hit("escape") || hit("enter") || hit(" ") || hit("lmb") || hit("p")) { S.view = "list"; AU.sfx("lock", 0); } return; }
  if (S.capture) { // waiting for a key to bind
    for (const k of G.pressed) { if (k === "escape") { S.capture = null; return; } if (k === "lmb" || k === "rmb" || k === "enter" || k.length > 12) continue; bindKey(S.capture, k); S.capture = null; AU.sfx("lock", 4); return; }
    return; }
  const rows = settingsRows(), pick = rows.map((r, i) => r.head == null ? i : -1).filter(i => i >= 0); let at = Math.max(0, pick.indexOf(S.sel)); if (!pick.includes(S.sel)) S.sel = pick[0];
  if (hit("escape") || hit("p")) return closeSettings();
  if (hit("arrowup") || hit("w")) { at = (at - 1 + pick.length) % pick.length; S.sel = pick[at]; AU.sfx("lock", 0); }
  if (hit("arrowdown") || hit("s")) { at = (at + 1) % pick.length; S.sel = pick[at]; AU.sfx("lock", 0); }
  if (S.sel < S.top + 1) S.top = Math.max(0, S.sel - 1); if (S.sel > S.top + SET_LIST_ROWS - 2) S.top = Math.min(rows.length - SET_LIST_ROWS, S.sel - SET_LIST_ROWS + 2); S.top = Math.max(0, S.top);
  // Mouse: hover picks a row, the wheel isn't needed (the list follows the selection).
  const hov = rows.findIndex((r, i) => r.head == null && i >= S.top && i < S.top + SET_LIST_ROWS && inBox([GW / 2 - 150, SET_LIST_Y + (i - S.top) * SET_ROW_H - 3, 300, SET_ROW_H], mouse.x, mouse.y));
  if (!PAD.active && (mouse.x !== S.mx || mouse.y !== S.my)) { S.mx = mouse.x; S.my = mouse.y; if (hov >= 0) S.sel = hov; }
  const r = rows[S.sel], d = hit("arrowleft") || hit("a") ? -1 : hit("arrowright") || hit("d") ? 1 : 0;
  if (d && r.step) { r.step(d); persist(); AU.sfx("lock", 2); }
  if (hit("enter") || hit(" ") || (hit("lmb") && hov === S.sel)) { if (r.act) r.act(); else if (r.step) { r.step(1); persist(); AU.sfx("lock", 2); } }
}
function drawSettings(c, t) {
  const S = SETTINGS, L = lab();
  if (G.mode === "settings") { c.drawImage(G.base.C, 0, 0); drawRain(c, G.base, t); veil(c, .84); } else veil(c, .93);
  ["#ff2d8a", "#2be4ff", "#e9e6f5"].forEach((col, i) => txt(c, S.view === "credits" ? "CREDITS" : "SETTINGS", GW / 2 + (i === 0 ? -1 : i === 1 ? 1 : 0), 12, col, 16, "center"));
  if (S.view === "credits") {
    CREDITS.slice(S.scroll, S.scroll + 17).forEach((l, i) => txt(c, l[0], GW / 2, 40 + i * 11, l[1] || rgba(COL.ink, .85), 8, "center"));
    if (S.scroll + 17 < CREDITS.length) txt(c, "▼ MORE", GW / 2, 40 + 17 * 11, COL.dim, 8, "center");
    txt(c, (PAD.active ? "UP / DOWN · " + L.confirm + " OR B: BACK" : "W / S · ENTER OR ESC: BACK") + " · " + versionLabel(), GW / 2, GH - 16, rgba(COL.dim, .75), 8, "center"); return; }
  const rows = settingsRows();
  rows.slice(S.top, S.top + SET_LIST_ROWS).forEach((r, k) => { const i = S.top + k, y = SET_LIST_Y + k * SET_ROW_H, on = i === S.sel;
    if (r.head != null) { if (r.head) { txt(c, r.head, GW / 2 - 146, y, COL.amber); c.fillStyle = rgba(COL.amber, .3); c.fillRect(GW / 2 - 146, y + 10, 292, 1); } return; }
    if (on) { c.fillStyle = rgba(COL.cyan, .14); c.fillRect(GW / 2 - 150, y - 3, 300, SET_ROW_H); c.fillStyle = COL.cyan; c.fillRect(GW / 2 - 150, y - 3, 2, SET_ROW_H); }
    txt(c, r.label, GW / 2 - 140, y, on ? COL.ink : COL.dim);
    if (r.bar) { for (let s = 0; s < 10; s++) { c.fillStyle = s < r.val ? (on ? COL.cyan : rgba(COL.cyan, .7)) : "#2a2640"; c.fillRect(GW / 2 + 52 + s * 9, y + 1, 7, 6); } txt(c, String(r.val * 10) + "%", GW / 2 + 146, y, on ? COL.ink : COL.dim, 8, "right"); }
    else if (r.val != null) txt(c, on && r.step ? "< " + r.val + " >" : r.val, GW / 2 + 146, y, S.capture && on ? COL.amber : on ? COL.cyan : COL.ink, 8, "right"); });
  if (S.top > 0) txt(c, "▲", GW / 2 + 160, SET_LIST_Y, COL.dim); if (S.top + SET_LIST_ROWS < rows.length) txt(c, "▼", GW / 2 + 160, SET_LIST_Y + (SET_LIST_ROWS - 1) * SET_ROW_H, COL.dim);
  const hint = S.capture ? "PRESS THE NEW KEY · ESC: CANCEL" : PAD.active ? `UP / DOWN · LEFT / RIGHT CHANGE · ${L.confirm} SELECT · B: BACK` : "W / S · A / D CHANGE · ENTER OR CLICK · ESC: BACK";
  txt(c, hint, GW / 2, GH - 16, rgba(COL.dim, .8), 8, "center");
}

/* ---- Credits and licences ---- */
// Change CREDIT_NAME to how you want to be credited.
const CREDIT_NAME = "THE MURDER.EXE TEAM";
const CREDITS = [["MURDER.EXE", COL.cyan], ["NINE NIGHTS OF RAIN IN SAINT VARROW"], [""],
  ["CREATED BY", COL.amber], [CREDIT_NAME], [""],
  ["FONTS", COL.amber], ["SILKSCREEN · THE SILKSCREEN PROJECT AUTHORS"], ["CHAKRA PETCH · THE CHAKRA PETCH PROJECT AUTHORS"], ["BOTH UNDER THE SIL OPEN FONT LICENSE 1.1"], [""],
  ["BUILT WITH", COL.amber], ["ELECTRON · MIT LICENSE"], ["CHROMIUM · BSD-STYLE LICENSES"], ["(FULL TEXT IN LICENSES.CHROMIUM.HTML WITH THE GAME)"],
  ["STEAMWORKS-FFI-NODE AND KOFFI · MIT LICENSE"], ["STEAMWORKS SDK (C) VALVE CORPORATION"], [""],
  ["STEAM AND THE STEAM LOGO ARE TRADEMARKS OR"], ["REGISTERED TRADEMARKS OF VALVE CORPORATION"], [""],
  ["THANK YOU FOR PLAYING", COL.magenta]];
