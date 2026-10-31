/* CO-OP for up to four players, in Arcade and Story. The host's game is the real one: friends send their controls
   and get the world back about 20 times a second, so everyone sees the same enemies, bullets and story.
   Over Steam (the desktop build): friends-only lobbies, Steam invites and peer-to-peer messages (Steam Build/steam.js).
   In a browser: two tabs on the same computer can play together, which is how co-op is tested without Steam. */
"use strict";
const COOP_MAX = 4, SNAP_HZ = 20, RUN_MODES = new Set(["play", "intro", "clear", "dead", "talk"]);

/* ---- Transports: Steam peer-to-peer, or a BroadcastChannel between tabs ---- */
const NET = (() => {
  let handler = () => {}, bc = null; const localId = "tab-" + Math.random().toString(36).slice(2, 8);
  const SB = () => (typeof window !== "undefined" && window.steamBridge && window.steamBridge.available && window.steamBridge.coop) ? window.steamBridge.coop : null;
  const T = {
    kind: null,
    steamReady: () => !!SB(),
    localReady: () => typeof BroadcastChannel !== "undefined",
    me: () => T.kind === "steam" ? String((window.steamBridge.me || {}).steamId || "") : localId,
    on(fn) { handler = fn; },
    open(kind) { T.kind = kind; if (kind === "local" && !bc) { bc = new BroadcastChannel("murder-exe-coop"); bc.onmessage = ev => { const d = ev.data || {}; if (d.from !== localId && (d.to === "*" || d.to === localId)) recv(d.from, d.text); }; } },
    close() { T.kind = null; },
    send(to, obj, reliable) { if (!T.kind || !to) return; const text = JSON.stringify(obj); try { if (T.kind === "steam") SB().send(String(to), text, !!reliable); else if (bc) bc.postMessage({ from: localId, to, text }); } catch (e) {} },
    sb: SB,
  };
  function recv(from, text) { let m; try { m = JSON.parse(text); } catch (e) { return; } if (m && typeof m.t === "string") { try { handler(String(from), m); } catch (e) { console.warn("[coop]", e); } } }
  const s = SB(); if (s) { s.onMessages(list => list.forEach(m => T.kind === "steam" && recv(m.from, m.text))); s.onPeer(ev => { if (ev && ev.left) COOP.peerLeft(String(ev.left)); }); s.onJoinRequest(id => { const go = () => G.base && G.mode ? COOP.joinSteam(id) : setTimeout(go, 300); go(); }); } // wait until the game has finished starting
  return T;
})();

/* ---- Session state ---- */
// role: null (solo), "host" or "client". members: the host's list of friends in the lobby, by id.
const COOP = { role: null, members: new Map(), hostId: null, hostName: "", joined: false, lobby: [], view: "menu", msg: null, sel: 0, friends: null, invited: new Set(),
  cl: null, seq: 0, cnt: { dash: 0, r: 0, q: 0, oc: 0, lmb: 0 }, lastHeard: 0, sendT: 0, lobbyT: 0, rewT: 0, helloT: 0, sfx: [] };
const coopName = () => String(SAVE.char.name || "OPERATIVE").slice(0, 16).toUpperCase();
const cleanName = s => String(s || "FRIEND").replace(/[^\w .'-]/g, "").slice(0, 16).toUpperCase() || "FRIEND";
const isHost = () => COOP.role === "host", isClient = () => COOP.role === "client" && COOP.joined;
// Only proper co-op runs bring friends in: not the Daily, Boss Rush or the firing range, which are solo challenges.
const coopRunOK = () => isHost() && COOP.members.size > 0 && !G.daily && !G.rush && !G.range;
const allPlayers = () => G.crew || [G.p];
const crewMates = () => G.crew ? G.crew.filter(q => q.mate) : [];
function coopOthers() { if (isClient()) return COOP.cl ? COOP.cl.others : []; return G.crew ? G.crew.filter(q => q !== G.p) : []; }
const nearPlayer = (x, y, r) => allPlayers().some(q => q && !q.down && Math.hypot(q.x - x, q.y - y) < r);
function nearestAlive(x, y) { let best = null, bd = 1e9; for (const q of allPlayers()) { if (!q || q.down) continue; const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = q; } } return best; }
// Run fn with player q standing in for G.p (and its own flow field), so the single-player code works for anyone.
function withP(q, fn) { const o = G.p, f = G.flow; G.p = q; if (q.flow) G.flow = q.flow; try { return fn(); } finally { G.p = o; G.flow = f; } }

/* ---- Host: friends in the run ---- */
function safeLoadout(L) { const D0 = defaultSave().loadout; L = L || {};
  return { gun: GUNS[L.gun] ? L.gun : D0.gun, oc: OCP[L.oc] ? L.oc : D0.oc, imp: (Array.isArray(L.imp) ? L.imp : []).filter(id => ITEM[id] && ITEM[id].cat === "imp").slice(0, IMP_SLOTS) }; }
function applyLoadoutFrom(p, L, fresh) { const t = G.tryLoadout; G.tryLoadout = L; try { applyLoadout(p, fresh); } finally { G.tryLoadout = t; } }
function spotNear(x, y, k, used = []) { const offs = [[-16, 10], [16, 10], [0, 18], [-20, -6], [20, -6], [0, -16], [-28, 16], [28, 16], [0, 28]];
  for (let i = 0; i < offs.length; i++) { const [dx, dy] = offs[(k + i) % offs.length], q = { x: x + dx, y: y + dy };
    if (!boxBlocked(q.x, q.y, 4, false) && tileOf(q.x, q.y) !== "o" && used.every(u => Math.hypot(u.x - q.x, u.y - q.y) > 8)) { used.push(q); return q; } } return { x, y }; }
function matePlayer(m, x, y) { const q = newPlayer(x, y); q.mate = m; q.name = m.name; q.look = m.look; applyLoadoutFrom(q, m.loadout, true); m.p = q; m.ack = 0; m.presses = []; return q; }
// Called by enterDistrict: put everyone in at the start of each district (fresh players on a new run).
function coopPlaceCrew(ps, fresh) {
  if (!coopRunOK()) { G.crew = null; return; }
  G.p.name = coopName(); G.p.look = SAVE.char.look; G.p.down = false; G.p.revive = 0; const crew = [G.p], used = [{ x: G.p.x, y: G.p.y }]; let k = 0;
  for (const m of COOP.members.values()) { const s = spotNear(ps.x, ps.y, k++, used);
    if (fresh || !m.p) matePlayer(m, s.x, s.y); else { Object.assign(m.p, { x: s.x, y: s.y, trail: [], dash: 0, iframes: .5, down: false, revive: 0 }); applyLoadoutFrom(m.p, m.loadout, false); }
    crew.push(m.p); }
  G.crew = crew;
}
// A friend who joins mid-run drops in beside the host.
function coopDropIn(m) { if (!G.p || !RUN_MODES.has(G.mode) || !coopRunOK() || (G.crew && G.crew.some(q => q.mate === m))) return;
  if (!G.crew) G.crew = [G.p]; const s = spotNear(G.p.x, G.p.y, G.crew.length, G.crew.map(q => ({ x: q.x, y: q.y }))); const q = matePlayer(m, s.x, s.y); q.iframes = 2; if (G.camp) q.shield = G.p.shield || 0; G.crew.push(q); buildFlow();
  G.banner = { txt: m.name + " DROPPED IN", col: COL.cyan, life: 2 }; }
function coopDropOut(m) { if (!G.crew) return; G.crew = G.crew.filter(q => q.mate !== m); if (G.crew.length < 2 && !COOP.members.size) G.crew = null; }

// Controls from a friend, applied to their player while the single-player update runs for them.
const PRESS_KEYS = { dash: " ", r: "r", q: "q", oc: "rmb", lmb: "lmb" };
function takeInput(m, inp) {
  if (!inp || typeof inp !== "object") return; const c = inp.c || {}, seen = m.cnt || (m.cnt = {});
  for (const k in PRESS_KEYS) { const n = +c[k] || 0; if (seen[k] == null) seen[k] = n; else if (n > seen[k]) { (m.presses || (m.presses = [])).push(PRESS_KEYS[k]); seen[k] = n; } }
  m.input = { mx: Math.max(-1, Math.min(1, +inp.mx || 0)), my: Math.max(-1, Math.min(1, +inp.my || 0)), ax: +inp.ax || 0, ay: +inp.ay || 0, fire: !!inp.fire, seq: +inp.s || 0 };
}
function withInput(q, fn) {
  const m = q.mate, inp = m.input || { mx: 0, my: 0, ax: q.x + 20, ay: q.y - BODY, fire: false, seq: 0 };
  const save = { keys: [...keys], mouse: Object.assign({}, mouse), pressed: G.pressed, pad: { active: PAD.active, mx: PAD.mx, my: PAD.my, mag: PAD.mag, aimA: PAD.aimA, lockE: PAD.lockE }, echo: G.echoShots, flash: G.flash, kick: G.kick, shake: G.shake };
  keys.clear(); Object.assign(mouse, { x: inp.ax, y: inp.ay, down: inp.fire, rdown: false, padDown: false, padRdown: false });
  G.pressed = new Set(m.presses || []); m.presses = []; const mv = Math.hypot(inp.mx, inp.my), k = mv > 1 ? 1 / mv : 1;
  Object.assign(PAD, { active: true, mx: inp.mx * k, my: inp.my * k, mag: Math.min(1, mv), aimA: Math.atan2(inp.ay - (q.y - BODY - 2), inp.ax - (q.x + q.face * 12)), lockE: null });
  G.echoShots = q.echoShots || []; G.noRumble = true; m.ack = inp.seq;
  try { withP(q, fn); } finally {
    q.echoShots = G.echoShots; keys.clear(); save.keys.forEach(x => keys.add(x)); Object.assign(mouse, save.mouse); G.pressed = save.pressed; Object.assign(PAD, save.pad);
    G.echoShots = save.echo; G.flash = save.flash; G.kick = save.kick; G.shake = Math.max(save.shake, Math.min(G.shake, 2)); G.noRumble = false; }
}
function coopUpdateMates(dt, rdt) {
  for (const q of crewMates()) {
    if (q.down) { q.iframes = 0; continue; }
    if (tileOf(q.x, q.y) !== "o") q.safe = { x: q.x, y: q.y };
    withInput(q, () => { const before = G.oc; updatePlayer(dt, rdt); if (G.oc && !before) updateOC(0); }); // a friend's Overclock fires at once at the nearest targets (no slow-motion for one player)
  }
}
// Enemies go for the nearest player who is still up, and stick with them for a second or two.
function updateEnemies(dt) {
  const crew = G.crew; if (!crew || crew.length < 2) { for (const e of G.en) if (e.alive) updateEnemy(e, dt); return; }
  for (const e of G.en) { if (!e.alive) continue; let t = e.tgt; e.tgtT = (e.tgtT || 0) - dt;
    if (!t || t.down || !crew.includes(t) || e.tgtT <= 0) { e.tgtT = 1 + Math.random(); let bd = 1e9; const cur = t;
      for (const q of crew) { if (q.down) continue; const d = Math.hypot(q.x - e.x, q.y - e.y) * (q === cur ? .8 : 1); if (d < bd) { bd = d; t = q; } } e.tgt = t; }
    if (!t || t.down) t = nearestAlive(e.x, e.y) || G.p; withP(t, () => updateEnemy(e, dt)); }
}
// Instead of dying, a player goes DOWN while anyone else is still up. Stand beside them to bring them back.
function coopDown(p, by) {
  if (!G.crew || G.crew.length < 2 || !G.crew.includes(p) || !G.crew.some(q => q !== p && !q.down)) return false;
  p.down = true; p.revive = 0; p.dash = 0; p.trail = []; if ((by === "hole" || by === "vent") && p.safe) { p.x = p.safe.x; p.y = p.safe.y; }
  fx(p.x, p.y - BODY, 26, [COL.cyan, COL.magenta, "#ffffff"], 80, .8); AU.sfx("flatline"); G.shake = Math.max(G.shake, 4);
  G.banner = { txt: (p.name || "PLAYER") + " IS DOWN · STAND BESIDE THEM TO REVIVE", col: COL.red, life: 2.4 }; return true;
}
function coopRevive(rdt) {
  if (!G.crew || G.mode !== "play" || G.paused) return;
  for (const q of G.crew) { if (!q.down) continue; const helped = G.crew.some(o => o !== q && !o.down && Math.hypot(o.x - q.x, o.y - q.y) < 20);
    q.revive = helped ? q.revive + rdt : Math.max(0, q.revive - rdt * .5);
    if (q.revive >= 1.6) { q.down = false; q.revive = 0; q.iframes = 2; fx(q.x, q.y - BODY, 22, [COL.cyan, "#ffffff"], 70, .6); AU.sfx("ocSnap"); G.banner = { txt: (q.name || "PLAYER") + " IS BACK UP", col: COL.cyan, life: 1.8 }; } }
}
const coopReviveAll = () => { for (const q of allPlayers()) if (q && q.down) { q.down = false; q.revive = 0; q.iframes = 1; } };

/* ---- Host: what friends earn (each friend banks scrip, stats and achievements in their own save) ---- */
function coopEarn(n) { for (const q of crewMates()) q.mate.scrip = (q.mate.scrip || 0) + n; } // team scrip: every kill pays everyone
function coopTrack(ev, a) { const m = G.p && G.p.mate; if (!m) return false; (m.tracks || (m.tracks = [])).push([ev, a]); return true; }
function coopAchieve(id) { const m = G.p && G.p.mate; if (!m) return false; (m.ach || (m.ach = [])).push(id); return true; }

/* ---- Host: snapshots ---- */
const round1 = v => Math.round(v * 10) / 10;
// A copy of plain data (numbers, strings, flags, small arrays and objects), without links to other game objects.
const SKIP_KEYS = new Set(["tgt", "flow", "hunt", "boss", "target", "src", "from", "mate", "pl", "echoShots", "trail", "look", "lockE", "safe", "e", "S", "g"]);
function plain(v, depth) {
  if (v == null || typeof v === "boolean" || typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? round1(v) : 0;
  if (typeof v !== "object" || depth <= 0 || v instanceof Set || v instanceof Map || v.getContext || v.C) return undefined;
  if (Array.isArray(v)) return v.length > 400 ? undefined : v.map(x => plain(x, depth - 1));
  const o = {}; for (const k in v) { if (SKIP_KEYS.has(k)) continue; const x = plain(v[k], depth - 1); if (x !== undefined) o[k] = x; } return o;
}
let nidSeq = 1;
function enemyView(e) { if (!e.nid) e.nid = nidSeq++; const o = {}; for (const k in e) { if (SKIP_KEYS.has(k) || k === "id" || k === "alive") continue; const v = e[k];
  if (typeof v === "number") o[k] = Number.isFinite(v) ? round1(v) : 0; else if (typeof v === "string" || typeof v === "boolean") o[k] = v; else if (Array.isArray(v) && v.length < 40) o[k] = plain(v, 2); } return o; }
const playerId = q => q.mate ? q.mate.id : "host";
function playerView(q) { return { id: playerId(q), name: q.name || coopName(), x: round1(q.x), y: round1(q.y), face: q.face, moving: !!q.moving, dash: round1(q.dash || 0), iframes: round1(q.iframes || 0), down: !!q.down, revive: round1(q.revive || 0) }; }
const STAT_KEYS = ["ammo", "reload", "oc", "ocMax", "ram", "ramMax", "gunId", "ocId", "maxLocks", "aegis", "aegisK", "shield", "egoUsed", "streak", "berserk", "hitR"];
function statsView(q) { const o = { mag: q.gun.mag, imps: q.imps.slice() }; STAT_KEYS.forEach(k => { if (q[k] !== undefined) o[k] = typeof q[k] === "number" ? round1(q[k]) : q[k]; }); return o; }
function takeNew(list, fn, cap) { const out = []; for (const o of list || []) { if (o._s) continue; o._s = 1; if (out.length < cap) out.push(fn(o)); } return out; }
function talkView() { const T = G.talk; if (!T) return null;
  return { title: T.title, cur: T.cur, shown: Math.min(999, T.shown), sel: T.sel, t: round1(T.t), notes: plain(T.notes, 3),
    choice: T.choice ? { timer: T.choice.timer, t: round1(T.choice.t), opts: T.choice.opts.map(o => ({ t: fillName(o.t), s: o.s, o: o.o, silent: !!o.silent })) } : null }; }
const gridString = () => G.grid ? G.grid.map(r => r.join("")).join("") : "";
let lastGrid = "", gridT = 0;
function worldView(rdt) {
  const inRun = RUN_MODES.has(G.mode) && !!G.crew, W = { mode: G.mode, run: inRun, paused: !!G.paused, solo: RUN_MODES.has(G.mode) && !G.crew };
  if (!inRun) return W;
  const g = gridString(); gridT -= rdt; const sendGrid = g !== lastGrid || gridT <= 0; if (sendGrid) { lastGrid = g; gridT = 1; }
  Object.assign(W, { district: G.district, seed: G.runSeed, score: G.score, kills: G.kills, dStart: G.dStart, heat: G.heat, mult: round1(G.mult), boss: !!G.boss, phase2: !!G.phase2, oc: !!G.oc, hexed: round1(G.hexed || 0),
    shake: round1(G.shake), time: round1(G.time), banner: G.banner ? plain(G.banner, 2) : null, introT: round1(G.introT || 0), clearT: round1(G.clearT || 0), deadT: round1(G.deadT || 0), killer: G.killer || "",
    lull: !!G.lull, fog: G.fog || 0, hazard: G.hazard || null, dropName: G.dropName || null, choirRounds: G.choirRounds || 0,
    camp: G.camp ? { n: G.camp.n, t: round1(G.camp.t), won: G.camp.won, floor: G.camp.floor, wave: G.camp.wave } : null,
    map: { r: G.mapRecipe || { key: G.mapKey }, g: sendGrid ? g : null },
    talk: G.mode === "talk" ? talkView() : null });
  ["stalls", "gates", "zone", "exit", "shard", "flood", "vents", "drops", "rw", "allies", "echoAlly", "tram", "wind", "collapse", "pending", "radioQ"].forEach(k => { W[k] = plain(G[k], 4); });
  return W;
}
function hostSnapshot(rdt) {
  const W = worldView(rdt), common = { t: "s", w: W, sfx: COOP.sfx.splice(0) };
  if (W.run) Object.assign(common, {
    pl: G.crew.map(playerView), en: G.en.filter(e => e.alive).map(enemyView),
    b: G.bul.map(b => [Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), b.owner, b.col || 0, (b.rail ? 1 : 0) | (b.big ? 2 : 0), b.pl && b.pl.mate ? b.pl.mate.id : 0]),
    fx: { parts: takeNew(G.parts, q => [round1(q.x), round1(q.y), Math.round(q.vx), Math.round(q.vy), round1(q.life), round1(q.max), q.col, q.g], 160), texts: takeNew(G.texts, q => plain(q, 2), 12),
      blasts: takeNew(G.blasts, q => plain(q, 2), 12), zaps: takeNew(G.zaps, q => plain(q, 2), 12), tracers: takeNew(G.tracers, q => plain(q, 2), 16), pings: takeNew(G.pings, q => plain(q, 2), 8) } });
  for (const m of COOP.members.values()) { const msg = Object.assign({}, common); if (W.run && m.p && G.crew.includes(m.p)) { msg.you = playerId(m.p); msg.me = statsView(m.p); msg.ack = m.ack || 0; } NET.send(m.id, msg, false); }
}
// Every sound the host's game plays is passed on, so friends hear the fight too.
(() => { const play = AU.sfx; AU.sfx = function (...a) { if (isHost() && COOP.members.size && RUN_MODES.has(G.mode) && COOP.sfx.length < 32) COOP.sfx.push(a); return play.apply(this, a); }; AU.sfxLocal = play; })();
const lobbyList = () => [{ id: "host", name: coopName(), look: SAVE.char.look, host: true }].concat([...COOP.members.values()].map(m => ({ id: m.id, name: m.name, look: m.look })));
function broadcastLobby() { const msg = { t: "lobby", members: lobbyList() }; for (const m of COOP.members.values()) NET.send(m.id, msg, true); }

/* ---- Messages ---- */
NET.on((from, m) => {
  if (isHost()) {
    if (m.t === "find") return NET.send(from, { t: "here", name: coopName() }, true);
    if (m.t === "hello") { let mm = COOP.members.get(from);
      if (!mm && COOP.members.size >= COOP_MAX - 1) return NET.send(from, { t: "full" }, true);
      if (!mm) { mm = { id: from, scrip: 0 }; COOP.members.set(from, mm); AU.sfx("milestone"); }
      Object.assign(mm, { name: cleanName(m.name), look: m.look && typeof m.look === "object" ? m.look : SAVE.char.look, loadout: safeLoadout(m.loadout), heard: performance.now() });
      NET.send(from, { t: "welcome", host: coopName() }, true); broadcastLobby(); if (G.mode === "title" || G.mode === "coop") G.titleMsg = { txt: mm.name + " JOINED YOUR GAME", life: 3 }; coopDropIn(mm); return; }
    const mm = COOP.members.get(from); if (!mm) return; mm.heard = performance.now();
    if (m.t === "in") takeInput(mm, m);
    else if (m.t === "bye") COOP.peerLeft(from);
    return;
  }
  if (COOP.role === "client") {
    if (m.t === "here" && !COOP.hostId) { COOP.hostId = from; COOP.hostName = cleanName(m.name); sendHello(); return; }
    if (from !== COOP.hostId) return; COOP.lastHeard = performance.now();
    if (m.t === "welcome") { if (!COOP.joined) { COOP.joined = true; COOP.hostName = cleanName(m.host); clientStart(); } }
    else if (m.t === "lobby") COOP.lobby = Array.isArray(m.members) ? m.members.slice(0, COOP_MAX) : [];
    else if (m.t === "s" && COOP.joined) applySnapshot(m);
    else if (m.t === "rew" && COOP.joined) applyRewards(m);
    else if (m.t === "full") COOP.leave("THAT GAME IS FULL (4 PLAYERS)");
    else if (m.t === "bye") COOP.leave("THE HOST CLOSED THE GAME");
  }
});
const sendHello = () => NET.send(COOP.hostId, { t: "hello", name: coopName(), look: SAVE.char.look, loadout: SAVE.loadout }, true);

/* ---- Starting, joining and leaving ---- */
Object.assign(COOP, {
  async host(kind) {
    COOP.leave(); NET.open(kind); COOP.msg = kind === "steam" ? "CREATING A STEAM LOBBY…" : null;
    if (kind === "steam") { const r = await NET.sb().host().catch(e => ({ ok: false, error: e.message })); if (!r || !r.ok) { NET.close(); COOP.msg = "COULDN'T CREATE A LOBBY: " + String((r && r.error) || "STEAM ERROR").toUpperCase(); return; } COOP.lobbyId = r.lobbyId; }
    COOP.role = "host"; COOP.members.clear(); COOP.view = "lobby"; COOP.sel = 0; COOP.msg = null; COOP.invited.clear();
  },
  joinLocal() { COOP.leave(); NET.open("local"); COOP.role = "client"; COOP.joined = false; COOP.hostId = null; COOP.msg = "LOOKING FOR A GAME ON THIS COMPUTER…"; COOP.view = "joining"; COOP.lastHeard = performance.now();
    NET.send("*", { t: "find" }, true); },
  async joinSteam(lobbyId) {
    if (!NET.steamReady()) return; COOP.leave(); NET.open("steam"); COOP.role = "client"; COOP.joined = false; COOP.view = "joining"; COOP.msg = "JOINING YOUR FRIEND'S GAME…"; COOP.lastHeard = performance.now();
    if (G.mode !== "coop") { RUN.leave(); AU.stop(); AU.ambience("off"); G.mode = "coop"; G.paused = false; }
    const r = await NET.sb().join(String(lobbyId)).catch(e => ({ ok: false, error: e.message }));
    if (!r || !r.ok) return COOP.leave("COULDN'T JOIN THAT GAME"); COOP.hostId = String(r.host); COOP.lastHeard = performance.now(); sendHello();
  },
  peerLeft(id) { if (isHost()) { const m = COOP.members.get(id); if (!m) return; COOP.members.delete(id); coopDropOut(m); broadcastLobby(); G.banner = { txt: m.name + " LEFT", col: COL.dim, life: 2 }; if (G.mode === "title" || G.mode === "coop") G.titleMsg = { txt: m.name + " LEFT YOUR GAME", life: 3 }; }
    else if (COOP.role === "client" && id === COOP.hostId) COOP.leave("THE HOST LEFT"); },
  leave(msg) {
    const was = COOP.role, wasClient = was === "client" && COOP.joined;
    if (was === "host") for (const m of COOP.members.values()) NET.send(m.id, { t: "bye" }, true); else if (was === "client" && COOP.hostId) NET.send(COOP.hostId, { t: "bye" }, true);
    if (NET.kind === "steam" && NET.sb()) NET.sb().leave().catch(() => {});
    NET.close(); COOP.role = null; COOP.joined = false; COOP.hostId = null; COOP.members.clear(); COOP.lobby = []; COOP.cl = null; G.crew = null; COOP.view = "menu"; COOP.sel = 0; COOP.friends = null;
    if (wasClient || was === "client") { RUN.leave(); G.p = null; G.en = []; G.bul = []; G.talk = null; resetEndless(); RUN.reset("market"); AU.stop(); AU.ambience("off"); G.oc = null; AU.setOC(false); G.mode = "title"; G.menuMode = null; }
    if (msg) { G.titleMsg = { txt: msg, life: 4 }; COOP.msg = msg; }
  },
});
addEventListener("beforeunload", () => { if (COOP.role) COOP.leave(); });

/* ---- Host: once a frame ---- */
function coopAfterStep(rdt) {
  if (isHost()) {
    const now = performance.now(); for (const m of [...COOP.members.values()]) if (now - (m.heard || now) > 10000) COOP.peerLeft(m.id); // gone quiet: dropped
    if (!COOP.members.size) return; coopRevive(rdt);
    COOP.sendT -= rdt; if (COOP.sendT <= 0) { COOP.sendT = RUN_MODES.has(G.mode) ? 1 / SNAP_HZ : .25; hostSnapshot(rdt); }
    COOP.lobbyT -= rdt; if (COOP.lobbyT <= 0) { COOP.lobbyT = 2; broadcastLobby(); }
    COOP.rewT -= rdt; if (COOP.rewT <= 0) { COOP.rewT = 1; for (const m of COOP.members.values()) if (m.scrip || (m.tracks && m.tracks.length) || (m.ach && m.ach.length)) { NET.send(m.id, { t: "rew", scrip: m.scrip || 0, tracks: m.tracks || [], ach: m.ach || [] }, true); m.scrip = 0; m.tracks = []; m.ach = []; } }
  } else if (COOP.role === "client") {
    if (performance.now() - COOP.lastHeard > (COOP.joined ? 10000 : 8000)) return COOP.leave(COOP.joined ? "LOST THE CONNECTION TO THE HOST" : "NO GAME FOUND · HOST ONE IN ANOTHER TAB FIRST");
    if (!COOP.joined) { COOP.helloT -= rdt; if (COOP.helloT <= 0) { COOP.helloT = 1; if (COOP.hostId) sendHello(); else NET.send("*", { t: "find" }, true); } }
  }
}

/* ---- Client: showing the host's world ---- */
function clientStart() {
  RUN.leave(); AU.stop(); AU.ambience("off"); G.oc = null; G.crew = null;
  COOP.cl = { en: new Map(), others: [], hist: [], mapKey: "", grid: "", runOn: false, heat: -1, oc: false, menu: false, chapN: null, looks: {} };
  G.p = Object.assign(newPlayer(GW / 2, GH / 2), { gun: { mag: 6 }, imps: [], ocMax: 100, ramMax: 6, hitR: 4.5 }); G.mode = "coopwait"; G.menuMode = null; G.paused = false;
}
function syncMap(W) {
  const C = COOP.cl, M = W.map; if (!M || !M.r) return; const key = JSON.stringify(M.r);
  if (key !== C.mapKey) { C.mapKey = key; C.grid = ""; let mk = M.r.key;
    if (M.r.style) { PG.generate(M.r.style, M.r.seed, "run"); mk = "run"; }
    if (!MAPS[mk]) return; G.mapKey = mk; G.grid = buildGrid(MAPS[mk], false); if (W.camp) { storySprites(); propSprites(); } C.dirty = true; }
  if (M.g && M.g !== C.grid && G.grid && M.g.length === MW * MH) { C.grid = M.g; for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) G.grid[j][i] = M.g[j * MW + i]; C.dirty = true; }
  if (C.dirty && G.grid) { C.dirty = false; G.base = renderMap(G.mapKey, false, SP, G.grid); G.gapTiles = gapTiles(); G.perch = perchSpot(); }
}
function applySnapshot(S) {
  const C = COOP.cl, W = S.w || {}; if (!C) return;
  (S.sfx || []).forEach(a => { try { AU.sfxLocal(...a); } catch (e) {} });
  C.hostMode = W.mode; C.hostPaused = W.paused; C.solo = W.solo;
  if (!W.run) { if (G.mode !== "coopwait") { G.mode = "coopwait"; AU.stop(); AU.ambience("off"); AU.setOC(false); C.runOn = false; } return; }
  if (W.seed !== G.runSeed) resetEndless();
  Object.assign(G, { district: W.district, runSeed: W.seed, score: W.score, kills: W.kills, dStart: W.dStart, heat: W.heat, mult: W.mult, boss: W.boss, phase2: W.phase2, hexed: W.hexed, shake: Math.max(G.shake || 0, W.shake),
    time: W.time, banner: W.banner, introT: W.introT, clearT: W.clearT, deadT: W.deadT, killer: W.killer, lull: W.lull, fog: W.fog, hazard: W.hazard, dropName: W.dropName, choirRounds: W.choirRounds, paused: false });
  ["stalls", "gates", "zone", "exit", "shard", "flood", "vents", "drops", "rw", "allies", "echoAlly", "tram", "wind", "collapse", "pending", "radioQ"].forEach(k => { G[k] = W[k] === undefined ? null : W[k]; });
  if (!G.allies) G.allies = []; if (!G.pending) G.pending = []; if (!G.radioQ) G.radioQ = [];
  if (W.camp) { if (C.chapN !== W.camp.n) { C.chapN = W.camp.n; const ch = CHAPTERS[W.camp.n]; G.rules = typeof ch.rules === "function" ? ch.rules(SAVE.camp) : ch.rules; G.chapMap = ch.map; }
    G.camp = Object.assign(G.camp && G.camp.n === W.camp.n ? G.camp : { fired: new Set(), ch: CHAPTERS[W.camp.n] }, W.camp); }
  else { G.camp = null; G.rules = null; G.chapMap = null; C.chapN = null; }
  syncMap(W);
  G.talk = W.talk ? Object.assign({ notes: [] }, W.talk) : null;
  // The mode, with music to match.
  const was = G.mode; G.mode = W.mode; const fighting = W.mode === "play" || W.mode === "intro";
  if (fighting && !C.runOn) { C.runOn = true; AU.init(); BANK.attach(); RUN.music(); } else if (!fighting && C.runOn && (W.mode === "dead" || W.mode === "talk")) { C.runOn = false; AU.stop(); }
  if (W.heat !== C.heat) { C.heat = W.heat; AU.setHeat(Math.min(5, W.heat + 2)); } if (W.oc !== C.oc) { C.oc = W.oc; AU.setOC(W.oc); }
  if (was !== G.mode) G.menuMode = null;
  // Players: me (predicted locally, corrected towards the host) and everyone else (smoothed).
  const meV = (S.pl || []).find(q => q.id === S.you), p = G.p;
  if (meV) { const st = S.me || {}; Object.assign(p, st, { gun: Object.assign({}, GUNS[st.gunId] || {}, { mag: st.mag || 6 }), imps: st.imps || [], down: meV.down, revive: meV.revive, iframes: meV.iframes, name: meV.name });
    const h = C.hist.find(q => q.s === S.ack); C.hist = C.hist.filter(q => q.s > S.ack);
    if (!C.placed || meV.down || G.mode !== "play" || C.oc) { p.x = meV.x; p.y = meV.y; C.placed = true; }
    else if (h) { const ex = meV.x - h.x, ey = meV.y - h.y; if (Math.hypot(ex, ey) > 40) { p.x = meV.x; p.y = meV.y; } else { p.x += ex * .5; p.y += ey * .5; } } }
  const prev = new Map(C.others.map(q => [q.id, q]));
  C.others = (S.pl || []).filter(q => q.id !== S.you).map(v => { const o = prev.get(v.id) || { x: v.x, y: v.y, trail: [] }; return Object.assign(o, v, { x: o.x, y: o.y, tx: v.x, ty: v.y, look: lookOf(v.id) }); });
  const seen = new Map(); G.en = (S.en || []).map(v => { const o = C.en.get(v.nid) || { x: v.x, y: v.y }; const x = o.x, y = o.y; Object.assign(o, v, { alive: true, x, y, tx: v.x, ty: v.y }); seen.set(v.nid, o); return o; }); C.en = seen;
  G.bul = (S.b || []).map(a => ({ x: a[0], y: a[1], vx: a[2], vy: a[3], owner: a[4], col: a[5] || undefined, rail: !!(a[6] & 1), big: !!(a[6] & 2) }));
  const F = S.fx || {}; (F.parts || []).forEach(a => G.parts.push({ x: a[0], y: a[1], vx: a[2], vy: a[3], life: a[4], max: a[5], col: a[6], g: a[7] }));
  ["texts", "blasts", "zaps", "tracers", "pings"].forEach(k => (F[k] || []).forEach(o => G[k].push(o)));
}
function lookOf(id) { const m = COOP.lobby.find(q => q.id === id); return m && m.look; }
function applyRewards(m) {
  const n = Math.max(0, Math.min(100000, Math.round(+m.scrip || 0))); if (n) { SAVE.scrip += n; G.runScrip = (G.runScrip || 0) + n; }
  (m.tracks || []).slice(0, 200).forEach(t => { if (Array.isArray(t) && typeof t[0] === "string") track(t[0], t[1]); });
  (m.ach || []).slice(0, 40).forEach(id => { if (typeof id === "string") achieve(id); }); persist();
}
function clientInput(rdt) {
  const C = COOP.cl, p = G.p; let mx = (held("d") || held("arrowright") ? 1 : 0) - (held("a") || held("arrowleft") ? 1 : 0), my = (held("s") || held("arrowdown") ? 1 : 0) - (held("w") || held("arrowup") ? 1 : 0);
  const ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; } if (PAD.active && PAD.mag > 0) { mx = PAD.mx; my = PAD.my; }
  const live = G.mode === "play" && !C.menu && !p.down, c = COOP.cnt;
  if (!live) mx = my = 0;
  if (live) { if (hit(" ") || hit("shift")) c.dash++; if (hit("r")) c.r++; if (hit("q")) c.q++; if (hit("rmb") || hit("f")) c.oc++; if (hit("lmb")) c.lmb++; }
  const s = ++COOP.seq; NET.send(COOP.hostId, { t: "in", s, mx: round1(mx), my: round1(my), ax: Math.round(mouse.x), ay: Math.round(mouse.y), fire: live && fireHeld(), c }, false);
  // Move my own operative straight away (the host's copy catches up), so walking and dashing feel instant.
  p.face = mouse.x < p.x ? -1 : 1; p.dashCdL = (p.dashCdL || 0) - rdt; p.trail.forEach(t => t.life -= rdt); p.trail = p.trail.filter(t => t.life > 0);
  if (live && !C.oc) {
    if ((hit(" ") || hit("shift")) && p.dashCdL <= 0 && !(p.dashL > 0)) { const l = Math.hypot(mx, my); p.dashL = .16; p.ddx = l ? mx / l : p.face; p.ddy = l ? my / l : 0; p.dashCdL = .4; }
    if (p.dashL > 0) { p.dashL -= rdt; moveBody(p, p.ddx * 370 * rdt, p.ddy * 370 * rdt, true); p.trail.push({ x: p.x, y: p.y, life: .2 }); p.moving = true; }
    else { moveBody(p, mx * 112 * rdt, my * 112 * rdt); p.moving = Math.hypot(mx, my) > 0; }
  }
  C.hist.push({ s, x: p.x, y: p.y }); if (C.hist.length > 240) C.hist.shift();
}
function clientAge(rdt) {
  const k = Math.min(1, rdt * 14);
  for (const o of G.en) { o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k; o.anim = (o.anim || 0) + rdt; }
  for (const o of COOP.cl.others) { o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k; }
  for (const b of G.bul) { b.x += b.vx * rdt; b.y += b.vy * rdt; }
  for (const q of G.parts) { q.x += q.vx * rdt; q.y += q.vy * rdt; q.vy += q.g * rdt; q.vx *= .96; q.life -= rdt; } G.parts = G.parts.filter(q => q.life > 0).slice(-600);
  for (const q of G.texts) { q.y -= 14 * rdt; q.life -= rdt; } G.texts = G.texts.filter(q => q.life > 0);
  ["blasts", "zaps", "tracers", "pings"].forEach(key => { G[key].forEach(o => o.life -= rdt); G[key] = G[key].filter(o => o.life > 0); });
  if (G.banner) { G.banner.life -= rdt; if (G.banner.life <= 0) G.banner = null; }
  if (G.radioQ && G.radioQ.length) G.radioQ[0].life -= rdt;
  G.shake = Math.max(0, (G.shake || 0) - rdt * 20);
}
const clientMenuItems = () => [{ label: "RESUME", act: () => { COOP.cl.menu = false; } }, { label: "LEAVE THE GAME", col: COL.magenta, act: () => COOP.leave("YOU LEFT THE GAME") }];
// While in a friend's game the host runs everything; this only sends my controls and keeps the picture moving.
function coopClientStep(rdt) {
  if (!isClient() || !COOP.cl) return false; const C = COOP.cl;
  if (hit("escape") || hit("p")) { C.menu = !C.menu; G.menuMode = null; }
  clientInput(rdt); clientAge(rdt);
  if (C.menu) { const keep = G.mode; G.mode = "coopmenu"; G.menu = layoutMenu(clientMenuItems(), 120, 14); runMenu(G.menu); if (G.mode === "coopmenu") G.mode = keep; }
  return true;
}
function coopClientDraw(c, t) {
  if (!isClient() || !COOP.cl) return false; const C = COOP.cl, m = G.mode;
  try {
    if (m === "talk" && G.talk) { drawTalk(c, t); c.fillStyle = "#05040b"; c.fillRect(0, GH - 20, GW, 20); txt(c, COOP.hostName + " PICKS THE REPLIES · ESC: MENU", GW / 2, GH - 14, rgba(COL.amber, .85), 8, "center"); }
    else if (RUN_MODES.has(m) && G.base && G.grid) {
      drawWorld(c, t); drawFog(c, t); if (C.oc) { c.save(); c.globalCompositeOperation = "multiply"; c.fillStyle = "#6a7ad0"; c.fillRect(0, 0, GW, GH); c.restore(); txt(c, "OVERCLOCK · TIME SLOWS", GW / 2, 40, COL.red, 8, "center"); }
      if (m === "play" || m === "intro") { drawHUD(c, t); drawCoopHud(c, t); }
      if (m === "dead") { G.menu = null; G.deadT = 0; drawDead(c, t); txt(c, COOP.hostName + " IS CHOOSING WHAT'S NEXT", GW / 2, 190, COL.cyan, 8, "center"); }
      if (m === "intro") drawIntro(c, t);
      if (m === "clear") { const keep = G.clearT; G.clearT = 0; drawClear(c, t); G.clearT = keep; txt(c, COOP.hostName + " IS CHOOSING WHAT'S NEXT", GW / 2, 190, COL.cyan, 8, "center"); }
      if (C.hostPaused && m === "play") { veil(c, .6); txt(c, COOP.hostName + " PAUSED THE GAME", GW / 2, 120, COL.ink, 16, "center"); }
      if (G.p.down && m === "play") { panel(c, GW / 2 - 110, 200, 220, 22, COL.red); txt(c, "YOU'RE DOWN · A TEAMMATE CAN REVIVE YOU", GW / 2, 207, COL.red, 8, "center"); }
    } else drawWait(c, t);
  } catch (e) { if (!C.drawErr) { C.drawErr = true; console.warn("[coop] draw", e); } drawWait(c, t); }
  if (C.menu) { veil(c, .7); txt(c, "CO-OP · " + COOP.hostName + "'S GAME", GW / 2, 84, COL.ink, 16, "center"); const k = G.mode; G.mode = "coopmenu"; drawMenu(c, G.menu, t); G.mode = k; }
  return true;
}
const WAIT_TXT = { title: "IS ON THE TITLE SCREEN", arcade: "IS SETTING UP AN ARCADE RUN", shop: "IS SHOPPING AT MAGPIE'S", body: "IS IN THE BODYSHOP", camp: "IS PICKING A CHAPTER", chap: "IS LOOKING OVER THE CHAPTER RESULTS", extras: "IS IN CHALLENGES", coop: "IS IN THE LOBBY · THEY START THE GAME" };
function drawWait(c, t) {
  if (G.base) { c.drawImage(G.base.C, 0, 0); drawRain(c, G.base, t); } else { c.fillStyle = "#05040b"; c.fillRect(0, 0, GW, GH); } veil(c, .8);
  ["#ff2d8a", "#2be4ff", "#e9e6f5"].forEach((col, i) => txt(c, "CO-OP", GW / 2 + (i === 0 ? -1 : i === 1 ? 1 : 0), 30, col, 16, "center"));
  const C = COOP.cl || {}, what = C.solo ? "IS PLAYING A SOLO CHALLENGE · YOU'LL JOIN THE NEXT RUN" : WAIT_TXT[C.hostMode] || "IS GETTING READY";
  txt(c, COOP.hostName + "'S GAME", GW / 2, 56, COL.amber, 8, "center"); txt(c, COOP.hostName + " " + what, GW / 2, 70, COL.ink, 8, "center");
  drawMembers(c, t, COOP.lobby, 96);
  txt(c, "YOU PLAY WITH YOUR OWN OPERATIVE AND LOADOUT · SCRIP AND ACHIEVEMENTS GO TO YOUR SAVE", GW / 2, 214, rgba(COL.cyan, .75), 8, "center");
  txt(c, (PAD.active ? lab().pause : "ESC") + ": MENU", GW / 2, GH - 16, rgba(COL.dim, .7), 8, "center");
}
function drawMembers(c, t, list, y) {
  panel(c, GW / 2 - 130, y, 260, 16 + COOP_MAX * 22, "#3a3456"); txt(c, `PLAYERS ${list.length}/${COOP_MAX}`, GW / 2 - 120, y + 6, COL.dim);
  for (let i = 0; i < COOP_MAX; i++) { const m = list[i], yy = y + 20 + i * 22;
    if (!m) { txt(c, "· OPEN SLOT ·", GW / 2, yy + 6, "#3a3456", 8, "center"); continue; }
    const s = m.look ? lookSprites(m.look) : null; if (s) { const f = Math.floor(t / 400) % 2 ? s.SP.vesperB : s.SP.vesper; c.save(); c.beginPath(); c.rect(GW / 2 - 120, yy - 2, 26, 20); c.clip(); drawSpr(c, f, GW / 2 - 120, yy - 4); c.restore(); }
    txt(c, m.name, GW / 2 - 88, yy + 6, COL.ink); txt(c, m.host ? "HOST" : "READY", GW / 2 + 120, yy + 6, m.host ? COL.amber : COL.cyan, 8, "right"); }
}

/* ---- Drawing other players (both sides) ---- */
const lookCache = new Map();
function lookSprites(L) {
  const k = JSON.stringify(L); if (lookCache.has(k)) return lookCache.get(k);
  let out = null; try { const s = playerSprites(L), F = {}; for (const f in s) F[f] = flipSpr(s[f]); out = { SP: s, SPF: F }; } catch (e) { out = { SP, SPF }; }
  if (lookCache.size > 12) lookCache.clear(); lookCache.set(k, out); if (SAVE.char && SAVE.char.look) lookMaterials(SAVE.char.look); return out;
}
const MATE_COLS = [COL.amber, "#9dff4a", COL.magenta, "#b9c2ff"];
// Each player keeps one colour for their name tag and their line in the player list.
const mateCol = q => { let h = 0; for (const ch of String(q.name || "")) h = (h * 31 + ch.charCodeAt(0)) | 0; return MATE_COLS[Math.abs(h) % MATE_COLS.length]; };
function drawMate(c, q, t) {
  const s0 = q.look ? lookSprites(q.look) : { SP, SPF }, k = q.moving ? (Math.floor(t / 110) % 2 ? "run1" : "run2") : (Math.floor(t / 400) % 2 ? "vesperB" : "vesper"), s = (q.face < 0 ? s0.SPF : s0.SP)[k] || sprOf(k, q.face);
  shadowUnder(c, q.x - s.w / 2, q.y - s.h + 2, s);
  if (q.down) c.globalAlpha = .45; else if (q.iframes > 0 && !(q.dash > 0) && Math.floor(t / 50) % 2) c.globalAlpha = .4;
  drawSpr(c, s, q.x - s.w / 2, q.y - s.h + 2); c.globalAlpha = 1; nameTag(c, q, t);
}
function nameTag(c, q, t) {
  const col = q.down ? COL.red : mateCol(q), label = q.down ? (q.name || "") + " · DOWN" : q.name || "";
  c.font = "8px Silkscreen"; const w = c.measureText(label).width + 6; c.fillStyle = "rgba(6,5,14,.7)"; c.fillRect(Math.round(q.x - w / 2), Math.round(q.y - 45), Math.round(w), 10); txt(c, label, q.x, q.y - 44, col, 8, "center");
  if (q.down && q.revive > 0) { c.strokeStyle = COL.cyan; c.lineWidth = 2; c.beginPath(); c.arc(q.x, q.y - 14, 13, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, q.revive / 1.6)); c.stroke(); c.lineWidth = 1; }
}
function drawCoopHud(c, t) {
  const list = (isClient() ? [G.p].concat(COOP.cl.others) : G.crew) || []; if (list.length < 2) return;
  list.forEach((q, i) => { const y = 46 + i * 10, me = q === G.p; txt(c, (q.down ? "DOWN · " : "") + (me ? "YOU" : q.name || "PLAYER"), GW - 8, y, q.down ? COL.red : me ? rgba(COL.ink, .8) : mateCol(q), 8, "right"); });
}

/* ---- The CO-OP screen: host a game, invite friends, join ---- */
function openCoop() { G.mode = "coop"; G.menuMode = null; if (!COOP.role) COOP.view = "menu"; else if (isHost()) COOP.view = "lobby"; COOP.msg = COOP.role ? null : COOP.msg; }
function coopItems() {
  const steam = NET.steamReady(), web = !window.steamBridge, back = { label: "BACK", col: COL.dim, act: () => { G.mode = "title"; G.menuMode = null; } };
  if (COOP.view === "friends") {
    const F = COOP.friends || []; return [{ label: "STEAM OVERLAY · INVITE ANYONE", col: COL.amber, act: () => NET.sb().inviteOverlay() }]
      .concat(F.slice(0, 9).map(f => ({ label: (COOP.invited.has(f.id) ? "INVITED · " : "INVITE ") + cleanName(f.name), act: () => { NET.sb().invite(f.id); COOP.invited.add(f.id); AU.sfx("lock", 3); } })),
        [{ label: "DONE", col: COL.dim, act: () => { COOP.view = "lobby"; G.menuMode = null; } }]); }
  if (isHost()) return [
    { label: steam && NET.kind === "steam" ? "INVITE FRIENDS" : "HOW FRIENDS JOIN", col: COL.amber, act: () => { if (NET.kind === "steam") { COOP.view = "friends"; G.menuMode = null; COOP.friends = null; NET.sb().friends().then(f => { COOP.friends = Array.isArray(f) ? f : []; }).catch(() => { COOP.friends = []; }); } else COOP.msg = "OPEN THE GAME IN ANOTHER TAB, PICK CO-OP, THEN JOIN ON THIS COMPUTER"; } },
    { label: "PLAY ARCADE TOGETHER", act: () => openArcade() },
    { label: "PLAY STORY TOGETHER", act: () => openCamp() },
    { label: "CLOSE THE GAME", col: COL.magenta, act: () => COOP.leave("CO-OP GAME CLOSED") }, back];
  const items = [];
  if (steam) items.push({ label: "HOST A GAME · STEAM", act: () => COOP.host("steam") }, { label: "JOIN A FRIEND", col: COL.amber, act: () => { COOP.msg = "ACCEPT A STEAM INVITE, OR PICK JOIN GAME ON A FRIEND IN YOUR STEAM FRIENDS LIST"; } });
  if (web && NET.localReady()) items.push({ label: "HOST ON THIS COMPUTER (TEST)", act: () => COOP.host("local") }, { label: "JOIN ON THIS COMPUTER (TEST)", col: COL.amber, act: () => COOP.joinLocal() });
  return items.concat([back]);
}
function updateCoop(rdt) {
  if (COOP.role === "client" && !COOP.joined) { if (hit("escape")) COOP.leave(); return; }
  if (hit("escape")) { if (COOP.view === "friends") { COOP.view = "lobby"; G.menuMode = null; } else { G.mode = "title"; G.menuMode = null; } return; }
  G.menu = layoutMenu(coopItems(), COOP.view === "friends" ? 64 : isHost() ? 160 : 124, COOP.view === "friends" ? 13 : 12); runMenu(G.menu);
}
function drawCoop(c, t) {
  c.drawImage(G.base.C, 0, 0); drawRain(c, G.base, t); veil(c, .8);
  ["#ff2d8a", "#2be4ff", "#e9e6f5"].forEach((col, i) => txt(c, "CO-OP", GW / 2 + (i === 0 ? -1 : i === 1 ? 1 : 0), 12, col, 16, "center"));
  if (COOP.role === "client" && !COOP.joined) { txt(c, COOP.msg || "CONNECTING…", GW / 2, 120, COL.ink, 8, "center"); txt(c, "ESC: CANCEL", GW / 2, GH - 16, rgba(COL.dim, .7), 8, "center"); return; }
  if (COOP.view === "friends") { txt(c, "INVITE FRIENDS · " + (COOP.friends ? COOP.friends.length + " ONLINE" : "LOADING…"), GW / 2, 40, COL.dim, 8, "center"); if (COOP.friends && !COOP.friends.length) txt(c, "NO FRIENDS ONLINE · TRY THE STEAM OVERLAY", GW / 2, 50, COL.amber, 8, "center"); }
  else if (isHost()) { txt(c, (NET.kind === "steam" ? "STEAM LOBBY · FRIENDS ONLY" : "TEST GAME ON THIS COMPUTER") + " · UP TO 4 PLAYERS", GW / 2, 34, COL.dim, 8, "center"); drawMembers(c, t, lobbyList(), 46); }
  else { txt(c, "PLAY ARCADE AND THE STORY WITH UP TO THREE FRIENDS", GW / 2, 34, COL.dim, 8, "center");
    wrapText(c, "THE HOST PICKS THE RUN OR CHAPTER AND MAKES THE STORY CHOICES. EVERYONE BRINGS THEIR OWN OPERATIVE AND LOADOUT, AND KEEPS THE SCRIP AND ACHIEVEMENTS THEY EARN. GO DOWN AND A TEAMMATE CAN REVIVE YOU; THE RUN ENDS WHEN EVERYONE IS DOWN.", 380).forEach((l, i) => txt(c, l, GW / 2, 56 + i * 11, rgba(COL.ink, .85), 8, "center"));
    if (!NET.steamReady()) txt(c, window.steamBridge ? "STEAM ISN'T RUNNING · START STEAM TO PLAY ONLINE" : "ONLINE CO-OP WITH STEAM FRIENDS IS IN THE STEAM VERSION", GW / 2, 108, COL.amber, 8, "center"); }
  drawMenu(c, G.menu, t);
  if (COOP.msg) txt(c, COOP.msg, GW / 2, 236, COL.amber, 8, "center");
  const L = lab(); txt(c, PAD.active ? "UP / DOWN + " + L.confirm + " · B: BACK" : "W / S + ENTER OR CLICK · ESC: BACK", GW / 2, GH - 16, rgba(COL.dim, .7), 8, "center");
}
