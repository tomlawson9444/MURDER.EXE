/* LOCAL CO-OP: extra controllers on the same computer, up to four players in all.
   Player 1 plays as normal (keyboard and mouse, or a controller). Every other controller that joins becomes a teammate.
   - On the host's computer (a same-screen game, or an online game they're hosting) the game runs that teammate exactly
     like an online friend (see g-net.js), with controls read straight from the controller.
   - On an online friend's computer, extra controllers join the host's game too: their controls go to the host over the
     friend's connection, and they show up for everyone like any other player.
   Same revives, Linked Overclock and difficulty scaling either way. Players on one computer share its save. */
"use strict";
const LOCAL_PREV = {};
COOP.subs = new Map(); // a friend's own extra controllers, when this computer has joined someone else's game
const localMembers = () => [...COOP.members.values()].filter(m => m.local);
// The extra controllers on this computer, whichever side of a game it's on.
const padPlayers = () => isClient() ? [...COOP.subs.values()] : localMembers();
// Controllers that belong to players 2-4 here (Player 1's input ignores them; see pollPad).
function localPads() { return new Set(padPlayers().map(m => m.pad)); }
// A random look from the cosmetics this save owns, so each player stands out.
function localLook() { const L = Object.assign({}, SAVE.char.look);
  LOOK_SLOTS.forEach(sl => { const opts = sl.opts.filter(o => lookOwned(sl.key, o)); if (opts.length) L[sl.key] = opts[Math.random() * opts.length | 0][0]; }); return L; }
// Host side: "PLAYER 2", "PLAYER 3"… On a friend's computer their extras go by the friend's first name, so everyone can tell whose they are.
function renumberLocals() { padPlayers().forEach((m, i) => { m.name = isClient() ? coopName().split(" ")[0].slice(0, 10) + " P" + (i + 2) : "PLAYER " + (i + 2); if (m.p) m.p.name = m.name; }); }
function newPadPlayer(gp) {
  const kept = ((SAVE.extra || {}).pads || {})[gp.index] || {}; // what this controller picked last time
  const m = { local: true, pad: gp.index, name: "", look: kept.look || localLook(), heard: performance.now(), presses: [], lockE: null, aimA: 0, aimed: false, cur: null,
    build: kept.build != null ? kept.build : "p1", custom: kept.custom || null, field: 0, nav: {}, cnt: { dash: 0, r: 0, q: 0, oc: 0, lmb: 0, lock: 0 } };
  Object.defineProperty(m, "loadout", { get: () => safeLoadout(srcLoadout(m)) }); return m;
}
function addLocal(gp) {
  const m = newPadPlayer(gp);
  if (isClient()) { m.sub = "p" + gp.index; m.id = NET.me() + "/" + m.sub; COOP.subs.set("pad" + gp.index, m); renumberLocals(); sendSubHello(m); AU.sfx("lock", 4); return; }
  m.id = "pad" + gp.index; COOP.members.set(m.id, m); renumberLocals(); AU.sfx("milestone"); coopDropIn(m);
}
function dropLocal(m) {
  if (isClient()) { NET.send(COOP.hostId, { t: "bye", sub: m.sub }, true); COOP.subs.delete("pad" + m.pad); renumberLocals(); padPlayers().forEach(sendSubHello); AU.sfx("lock", 0); return; }
  COOP.members.delete(m.id); coopDropOut(m); renumberLocals(); AU.sfx("lock", 0);
}
// A friend's extra controller introduces itself to the host (again whenever its look or loadout changes).
const sendSubHello = m => NET.send(COOP.hostId, { t: "hello", sub: m.sub, name: m.name, look: m.look, loadout: m.loadout }, true);
const remember = m => { const X = SAVE.extra || (SAVE.extra = {}); (X.pads || (X.pads = {}))[m.pad] = { build: m.build, custom: m.custom, look: m.look }; persist(); if (m.sub) sendSubHello(m); };

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
  c.font = "8px Silkscreen"; const full = [shortName(L.gun), shortName(L.oc)].concat(L.imp.map(shortName)).join(" · "); let sum = full; while (sum.length > 8 && c.measureText(sum).width > 206) sum = sum.slice(0, -2);
  txt(c, sum === full ? sum : sum + "…", x, y + 19, rgba(COL.ink, .6));
}
const mateColName = name => mateCol({ name });
// The lobby row to draw with a loadout editor: a controller on this computer.
const localRowOf = m => padPlayers().find(p => p.id === m.id) || null;

// Once a frame, before Player 1's controller is read.
function pollLocals(rdt) {
  const all = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected) : [];
  // Controllers join from the lobby: the host's CO-OP screen, or the waiting screen in a friend's game.
  const lobby = (isHost() && G.mode === "coop" && COOP.view === "lobby") || (isClient() && G.mode === "coopwait" && !(COOP.cl && COOP.cl.menu));
  const room = () => isClient() ? COOP.lobby.length < COOP_MAX : COOP.members.size < COOP_MAX - 1;
  for (const gp of all) {
    const prev = LOCAL_PREV[gp.index] || [], b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .35)), press = i => b(i) && !prev[i];
    const m = padPlayers().find(p => p.pad === gp.index);
    // A on any controller Player 1 isn't using joins; B leaves again and X rolls a new look.
    if (!m && lobby && press(BTN.A) && !(PAD.active && gp.index === PAD.idx) && room()) addLocal(gp);
    else if (m && lobby) { if (press(BTN.B)) dropLocal(m); else if (press(BTN.X)) { m.look = localLook(); if (m.p) m.p.look = m.look; remember(m); AU.sfx("lock", 3); } else lobbyNav(m, gp, b, rdt); }
    else if (m) driveLocal(m, gp, b, press, rdt);
    LOCAL_PREV[gp.index] = gp.buttons.map((x, i) => b(i));
  }
  for (const m of padPlayers()) { const here = all.some(g => g.index === m.pad); if (!here && !m.unplugged) { m.input = null; m.presses = []; if (m.sub && isClient()) sendSubInput(m, null); } m.unplugged = !here; } // unplugged: stands still until it's back
}
// Up / down picks a line of the loadout, left / right changes it. Holding keeps stepping after a short delay.
function lobbyNav(m, gp, b, rdt) {
  const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0, R = m.nav || (m.nav = {});
  const rep = (key, dir) => { if (!dir) { R[key] = 0; return 0; } if (!R[key]) { R[key] = .32; return dir; } R[key] -= rdt; if (R[key] <= 0) { R[key] = .12; return dir; } return 0; };
  const v = rep("v", b(BTN.UP) || ly < -.6 ? -1 : b(BTN.DOWN) || ly > .6 ? 1 : 0), h = rep("h", b(BTN.LEFT) || lx < -.6 ? -1 : b(BTN.RIGHT) || lx > .6 ? 1 : 0);
  if (v) { m.field = ((m.field || 0) + v + LOCAL_FIELDS.length) % LOCAL_FIELDS.length; AU.sfx("lock", 0); } if (h) editLocal(m, m.field || 0, h);
}
// The player a controller drives: the host's own copy, or (on a friend's computer) the one shown from the host's updates.
const padBody = m => isClient() ? COOP.cl && COOP.cl.others.find(o => o.id === m.id) : m.p;
const padInOc = (m, q) => isClient() ? !!(G.oc && G.oc.ids && G.oc.ids.includes(m.id)) : ocIn(q);
const lockedNow = e => isClient() ? !!(G.oc && ((G.oc.locks || []).includes(e) || (G.oc.others || []).includes(e))) : ocLocked(e);
const PRESS_COUNT = { " ": "dash", r: "r", q: "q", rmb: "oc", lmb: "lmb", oclock: "lock" };
// The same twin-stick controls as Player 1's controller (g-pad.js), turned into the input a co-op teammate sends.
function driveLocal(m, gp, b, press, rdt) {
  const q = padBody(m); m.heard = performance.now();
  if (press(BTN.START) || press(BTN.BACK)) G.pressed.add("p"); // anyone can pause (on a friend's computer: opens its menu)
  if (!q || q.down || G.mode !== "play" || G.paused) { m.input = null; m.presses = []; if (m.sub && q) sendSubInput(m, null); return; }
  const dz = [.12, .2, .3][padCfg().dz], [lx, ly] = stick(gp.axes[0] || 0, gp.axes[1] || 0, dz), [rx, ry, rm] = stick(gp.axes[2] || 0, gp.axes[3] || 0, dz + .05);
  const dx = (b(BTN.RIGHT) ? 1 : 0) - (b(BTN.LEFT) ? 1 : 0), dy = (b(BTN.DOWN) ? 1 : 0) - (b(BTN.UP) ? 1 : 0), dl = Math.hypot(dx, dy);
  const mx = dl ? dx / dl : lx, my = dl ? dy / dl : ly, mine = padInOc(m, q), ox = q.x + q.face * 12, oy = q.y - BODY - 2;
  if (!m.cur) m.cur = { x: ox + 60, y: oy };
  if (mine) { // Overclock cursor: faster the further you push, pulled onto targets nobody has locked yet
    const sp = 240 + 560 * rm * rm; m.cur.x = Math.max(4, Math.min(GW - 4, m.cur.x + rx * sp * rdt)); m.cur.y = Math.max(4, Math.min(GH - 4, m.cur.y + ry * sp * rdt));
    if (rm < .5) { let n = null, nd = 30; for (const e of G.en) { if (!e.alive || lockedNow(e)) continue; const d = Math.hypot(e.x - m.cur.x, e.y - (e.alt || 0) - 10 - m.cur.y); if (d < nd) { nd = d; n = e; } }
      if (n) { const k = Math.min(1, rdt * 9); m.cur.x += (n.x - m.cur.x) * k; m.cur.y += (n.y - (n.alt || 0) - 10 - m.cur.y) * k; } }
  } else { // aim with the right stick (or along your movement until you first touch it), with aim assist
    let want = null; if (rm > .15) { want = Math.atan2(ry, rx); m.aimed = true; } else if (Math.hypot(mx, my) > .3 && !m.aimed) want = Math.atan2(my, mx);
    if (want != null) m.aimA += angDiff(want, m.aimA) * Math.min(1, rdt * 28);
    const keep = PAD.lockE; PAD.lockE = m.lockE; const tg = assistTarget(ox, oy, m.aimA); m.lockE = PAD.lockE; PAD.lockE = keep;
    m.cur = tg ? { x: tg[0], y: tg[1] } : { x: ox + Math.cos(m.aimA) * 90, y: oy + Math.sin(m.aimA) * 90 }; }
  const input = { mx, my, ax: m.cur.x, ay: m.cur.y, fire: b(BTN.RT) || (padCfg().autofire && !G.oc && rm > .82), och: b(BTN.LT), seq: 0 }, P = [];
  if (press(BTN.RT)) P.push("lmb"); if (press(BTN.LT)) P.push("rmb"); if (press(BTN.A) || press(BTN.LB)) P.push(" "); if (press(BTN.X)) P.push("r");
  if (press(BTN.Y) || press(BTN.RB)) P.push(mine ? "oclock" : "q");
  if (m.sub) { P.forEach(k => m.cnt[PRESS_COUNT[k]]++); sendSubInput(m, input); } // over the network, presses travel as counters so none are lost
  else { m.input = input; (m.presses || (m.presses = [])).push(...P); }
}
const sendSubInput = (m, i) => NET.send(COOP.hostId, Object.assign({ t: "in", sub: m.sub, s: 0, c: m.cnt }, i ? { mx: round1(i.mx), my: round1(i.my), ax: Math.round(i.ax), ay: Math.round(i.ay), fire: i.fire, och: i.och } : { mx: 0, my: 0, fire: false, och: false }), false);

// Players 2-4 on this computer: a small panel each beside Player 1's, and their aim reticles in their own colour.
function padHudList() {
  if (isClient()) { const C = COOP.cl; if (!C) return []; return [...COOP.subs.values()].map(m => { const q = padBody(m), st = (C.subStats || {})[m.id]; return q && st ? { m, q, s: st, inOc: padInOc(m, q) } : null; }).filter(Boolean); }
  if (!G.crew) return []; return G.crew.filter(q => q.mate && q.mate.local).map(q => ({ m: q.mate, q, s: { ammo: q.ammo, mag: q.gun.mag, reload: q.reload, oc: q.oc, ocMax: q.ocMax, ram: q.ram, ramMax: q.ramMax }, inOc: ocIn(q) }));
}
function drawLocalHud(c, t) {
  const L = padHudList();
  L.forEach(({ q, s }, i) => { const x = 168 + i * 80, y = GH - 42, col = q.down ? COL.red : mateCol(q);
    panel(c, x, y, 76, 36, col); txt(c, q.name, x + 5, y + 4, col);
    txt(c, q.down ? "DOWN" : s.reload > 0 ? "RELOADING" : "AMMO " + s.ammo + "/" + s.mag, x + 5, y + 14, q.down ? COL.red : rgba(COL.ink, .85));
    c.fillStyle = "#2a2640"; c.fillRect(x + 5, y + 25, 66, 3); c.fillRect(x + 5, y + 30, 66, 2); // Overclock, then RAM
    c.fillStyle = COL.cyan; c.fillRect(x + 5, y + 25, Math.round(66 * Math.min(1, s.oc / (s.ocMax || 100))), 3);
    c.fillStyle = COL.magenta; c.fillRect(x + 5, y + 30, Math.round(66 * Math.min(1, s.ram / (s.ramMax || 6))), 2); });
  if (G.mode !== "play") return;
  for (const { m, q, inOc } of L) { if (!m.cur || q.down) continue; if (inOc) reticle(c, m.cur.x, m.cur.y, 6, "#ffffff"); else { reticle(c, m.cur.x, m.cur.y, 4, mateCol(q)); c.fillStyle = mateCol(q); c.fillRect(Math.round(m.cur.x), Math.round(m.cur.y), 1, 1); } }
}
