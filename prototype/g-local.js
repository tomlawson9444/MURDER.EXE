/* LOCAL CO-OP: up to four players on one screen, one controller each.
   Player 1 plays as normal (keyboard and mouse, or a controller). Every other controller that joins becomes a teammate
   that this game runs exactly like an online friend (see g-net.js), with controls read straight from the controller
   instead of from the network: same revives, Linked Overclock and difficulty scaling. Everyone shares this machine's save. */
"use strict";
const LOCAL_PREV = {};
const localMembers = () => [...COOP.members.values()].filter(m => m.local);
// Controllers that belong to local players 2-4 (Player 1's input ignores them; see pollPad).
function localPads() { return new Set(localMembers().map(m => m.pad)); }
// A random look from the cosmetics this save owns, so each player stands out.
function localLook() { const L = Object.assign({}, SAVE.char.look);
  LOOK_SLOTS.forEach(sl => { const opts = sl.opts.filter(o => lookOwned(sl.key, o)); if (opts.length) L[sl.key] = opts[Math.random() * opts.length | 0][0]; }); return L; }
function renumberLocals() { localMembers().forEach((m, i) => { m.name = "PLAYER " + (i + 2); if (m.p) m.p.name = m.name; }); }
function addLocal(gp) {
  const kept = ((SAVE.extra || {}).pads || {})[gp.index] || {}; // what this controller picked last time
  const m = { id: "pad" + gp.index, local: true, pad: gp.index, name: "", look: kept.look || localLook(), heard: performance.now(), presses: [], lockE: null, aimA: 0, aimed: false, cur: null,
    build: kept.build != null ? kept.build : "p1", custom: kept.custom || null, field: 0, nav: {} };
  Object.defineProperty(m, "loadout", { get: () => safeLoadout(srcLoadout(m)) });
  COOP.members.set(m.id, m); renumberLocals(); AU.sfx("milestone"); coopDropIn(m);
}
const remember = m => { const X = SAVE.extra || (SAVE.extra = {}); (X.pads || (X.pads = {}))[m.pad] = { build: m.build, custom: m.custom, look: m.look }; persist(); };

/* ---- Each controller's loadout: Player 1's, one of the three saved builds, or their own ----
   Their own build starts from the starter kit and cycles through the sidearms, Overclocks and implants this save owns.
   Changing a part while a saved build is picked makes it their own copy to tweak (the saved build is never changed). */
const LOCAL_FIELDS = ["LOADOUT", "SIDEARM", "OVERCLOCK", "IMPLANT 1", "IMPLANT 2", "IMPLANT 3"];
const LOCAL_SOURCES = ["p1", 0, 1, 2, "custom"];
const padOwned = cat => ITEMS.filter(i => i.cat === cat && owns(i.id)).map(i => i.id);
function srcLoadout(m) {
  if (m.build === "custom" && m.custom) return m.custom;
  const B = typeof m.build === "number" && SAVE.builds[m.build]; if (B) return { gun: owns(B.gun) ? B.gun : SAVE.loadout.gun, oc: owns(B.oc) ? B.oc : SAVE.loadout.oc, imp: B.imp.filter(owns) };
  return SAVE.loadout; }
const srcLabel = s => s === "p1" ? "SAME AS PLAYER 1" : s === "custom" ? "MY OWN BUILD" : "BUILD " + (s + 1) + (SAVE.builds[s] ? "" : " (EMPTY)");
function editLocal(m, f, d) {
  if (f === 0) { const i = LOCAL_SOURCES.indexOf(m.build); m.build = LOCAL_SOURCES[(i + d + LOCAL_SOURCES.length) % LOCAL_SOURCES.length];
    if (m.build === "custom" && !m.custom) m.custom = Object.assign({}, defaultSave().loadout, { imp: [null, null, null] }); } // from scratch: the starter kit
  else { if (m.build !== "custom") { const L = safeLoadout(srcLoadout(m)); m.custom = { gun: L.gun, oc: L.oc, imp: [0, 1, 2].map(k => L.imp[k] || null) }; m.build = "custom"; }
    const C = m.custom, step = (list, cur) => list[(Math.max(0, list.indexOf(cur)) + d + list.length) % list.length];
    if (f === 1) C.gun = step(padOwned("gun"), C.gun); else if (f === 2) C.oc = step(padOwned("oc"), C.oc);
    else { const k = f - 3, opts = [null].concat(padOwned("imp").filter(id => !C.imp.includes(id) || C.imp[k] === id)); C.imp[k] = step(opts, C.imp[k] || null); } }
  remember(m); AU.sfx("lock", 1);
}
const shortName = id => (ITEM[id] ? ITEM[id].name : "?").toUpperCase();
function drawLocalRow(c, m, x, y, t) {
  const L = safeLoadout(srcLoadout(m)), f = m.field || 0, custom = m.build === "custom" && m.custom;
  const val = f === 0 ? srcLabel(m.build) : f === 1 ? shortName(L.gun) : f === 2 ? shortName(L.oc) : (custom ? m.custom.imp[f - 3] : L.imp[f - 3]) ? shortName(custom ? m.custom.imp[f - 3] : L.imp[f - 3]) : "NONE";
  txt(c, m.name, x, y + 1, mateColName(m.name)); txt(c, LOCAL_FIELDS[f] + ":  < " + val + " >", x, y + 10, COL.amber);
  c.font = "8px Silkscreen"; let sum = [shortName(L.gun), shortName(L.oc)].concat(L.imp.map(shortName)).join(" · "); while (sum.length > 8 && c.measureText(sum).width > 206) sum = sum.slice(0, -2);
  txt(c, sum === [shortName(L.gun), shortName(L.oc)].concat(L.imp.map(shortName)).join(" · ") ? sum : sum + "…", x, y + 19, rgba(COL.ink, .6));
}
const mateColName = name => mateCol({ name });
function dropLocal(m) { COOP.members.delete(m.id); coopDropOut(m); renumberLocals(); AU.sfx("lock", 0); }

// Once a frame, before Player 1's controller is read.
function pollLocals(rdt) {
  const all = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected) : [];
  const lobby = G.mode === "coop" && isHost() && COOP.couch;
  for (const gp of all) {
    const prev = LOCAL_PREV[gp.index] || [], b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .35)), press = i => b(i) && !prev[i];
    const m = COOP.members.get("pad" + gp.index);
    // In the local lobby, A on any controller Player 1 isn't using joins; B leaves again and X rolls a new look.
    if (!m && lobby && press(BTN.A) && !(PAD.active && gp.index === PAD.idx) && COOP.members.size < COOP_MAX - 1) addLocal(gp);
    else if (m && lobby) { if (press(BTN.B)) dropLocal(m); else if (press(BTN.X)) { m.look = localLook(); if (m.p) m.p.look = m.look; remember(m); AU.sfx("lock", 3); } else lobbyNav(m, gp, b, rdt); }
    else if (m) driveLocal(m, gp, b, press, rdt);
    LOCAL_PREV[gp.index] = gp.buttons.map((x, i) => b(i));
  }
  for (const m of localMembers()) if (!all.some(g => g.index === m.pad)) { m.input = null; m.presses = []; } // unplugged: stands still until it's back
}
// Up / down picks a line of the loadout, left / right changes it. Holding keeps stepping after a short delay.
function lobbyNav(m, gp, b, rdt) {
  const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0, R = m.nav || (m.nav = {});
  const rep = (key, dir) => { if (!dir) { R[key] = 0; return 0; } if (!R[key]) { R[key] = .32; return dir; } R[key] -= rdt; if (R[key] <= 0) { R[key] = .12; return dir; } return 0; };
  const v = rep("v", b(BTN.UP) || ly < -.6 ? -1 : b(BTN.DOWN) || ly > .6 ? 1 : 0), h = rep("h", b(BTN.LEFT) || lx < -.6 ? -1 : b(BTN.RIGHT) || lx > .6 ? 1 : 0);
  if (v) { m.field = ((m.field || 0) + v + LOCAL_FIELDS.length) % LOCAL_FIELDS.length; AU.sfx("lock", 0); } if (h) editLocal(m, m.field || 0, h);
}
// The same twin-stick controls as Player 1's controller (g-pad.js), turned into the input a co-op teammate sends.
function driveLocal(m, gp, b, press, rdt) {
  const q = m.p; m.heard = performance.now();
  if (press(BTN.START) || press(BTN.BACK)) G.pressed.add("p"); // anyone can pause
  if (!q || q.down || G.mode !== "play" || G.paused) { m.input = null; m.presses = []; return; }
  const dz = [.12, .2, .3][padCfg().dz], [lx, ly] = stick(gp.axes[0] || 0, gp.axes[1] || 0, dz), [rx, ry, rm] = stick(gp.axes[2] || 0, gp.axes[3] || 0, dz + .05);
  const dx = (b(BTN.RIGHT) ? 1 : 0) - (b(BTN.LEFT) ? 1 : 0), dy = (b(BTN.DOWN) ? 1 : 0) - (b(BTN.UP) ? 1 : 0), dl = Math.hypot(dx, dy);
  const mx = dl ? dx / dl : lx, my = dl ? dy / dl : ly, mine = ocIn(q), ox = q.x + q.face * 12, oy = q.y - BODY - 2;
  if (!m.cur) m.cur = { x: ox + 60, y: oy };
  if (mine) { // Overclock cursor: faster the further you push, pulled onto targets nobody has locked yet
    const sp = 240 + 560 * rm * rm; m.cur.x = Math.max(4, Math.min(GW - 4, m.cur.x + rx * sp * rdt)); m.cur.y = Math.max(4, Math.min(GH - 4, m.cur.y + ry * sp * rdt));
    if (rm < .5) { let n = null, nd = 30; for (const e of G.en) { if (!e.alive || ocLocked(e)) continue; const d = Math.hypot(e.x - m.cur.x, e.y - (e.alt || 0) - 10 - m.cur.y); if (d < nd) { nd = d; n = e; } }
      if (n) { const k = Math.min(1, rdt * 9); m.cur.x += (n.x - m.cur.x) * k; m.cur.y += (n.y - (n.alt || 0) - 10 - m.cur.y) * k; } }
  } else { // aim with the right stick (or along your movement until you first touch it), with aim assist
    let want = null; if (rm > .15) { want = Math.atan2(ry, rx); m.aimed = true; } else if (Math.hypot(mx, my) > .3 && !m.aimed) want = Math.atan2(my, mx);
    if (want != null) m.aimA += angDiff(want, m.aimA) * Math.min(1, rdt * 28);
    const keep = PAD.lockE; PAD.lockE = m.lockE; const tg = assistTarget(ox, oy, m.aimA); m.lockE = PAD.lockE; PAD.lockE = keep;
    m.cur = tg ? { x: tg[0], y: tg[1] } : { x: ox + Math.cos(m.aimA) * 90, y: oy + Math.sin(m.aimA) * 90 }; }
  m.input = { mx, my, ax: m.cur.x, ay: m.cur.y, fire: b(BTN.RT) || (padCfg().autofire && !G.oc && rm > .82), och: b(BTN.LT), seq: 0 };
  const P = m.presses || (m.presses = []);
  if (press(BTN.RT)) P.push("lmb"); if (press(BTN.LT)) P.push("rmb"); if (press(BTN.A) || press(BTN.LB)) P.push(" "); if (press(BTN.X)) P.push("r");
  if (press(BTN.Y) || press(BTN.RB)) P.push(mine ? "oclock" : "q");
}

// Players 2-4 on this screen: a small panel each beside Player 1's, and their aim reticles in their own colour.
function drawLocalHud(c, t) {
  if (!G.crew) return; const L = G.crew.filter(q => q.mate && q.mate.local);
  L.forEach((q, i) => { const x = 168 + i * 80, y = GH - 42, col = q.down ? COL.red : mateCol(q);
    panel(c, x, y, 76, 36, col); txt(c, q.name, x + 5, y + 4, col);
    txt(c, q.down ? "DOWN" : q.reload > 0 ? "RELOADING" : "AMMO " + q.ammo + "/" + q.gun.mag, x + 5, y + 14, q.down ? COL.red : rgba(COL.ink, .85));
    c.fillStyle = "#2a2640"; c.fillRect(x + 5, y + 25, 66, 3); c.fillRect(x + 5, y + 30, 66, 2); // Overclock, then RAM
    c.fillStyle = COL.cyan; c.fillRect(x + 5, y + 25, Math.round(66 * Math.min(1, q.oc / q.ocMax)), 3);
    c.fillStyle = COL.magenta; c.fillRect(x + 5, y + 30, Math.round(66 * Math.min(1, q.ram / q.ramMax)), 2); });
  if (G.mode !== "play") return;
  for (const q of L) { const m = q.mate; if (!m.cur || q.down) continue; if (ocIn(q)) reticle(c, m.cur.x, m.cur.y, 6, "#ffffff"); else { reticle(c, m.cur.x, m.cur.y, 4, mateCol(q)); c.fillStyle = mateCol(q); c.fillRect(Math.round(m.cur.x), Math.round(m.cur.y), 1, 1); } }
}
