/* NINE NIGHTS OF RAIN: campaign mode. Chapter runs with story objectives, the campaign menu, the archive,
   the chapter-complete screen, the Gutterline Canals district (rising water, floodgates) and THE FERRYMAN. */
"use strict";
const RUN = {}; // reset and music, filled in by g-main.js

/* ---- Save data ---- */
SAVE.camp = Object.assign({ cur: 1, done: {}, res: 0, flags: {}, shards: {}, log: {}, paid: {}, diff: "normal", met: {} }, SAVE.camp || {});
SAVE.camp.trust = Object.assign({ magpie: 0, wren: 0, vane: 0, dex: 0 }, SAVE.camp.trust || {});

/* ---- District 2 of the story: the Gutterline Canals ---- */
DIST.canals = { n: 2, name: "GUTTERLINE CANALS", code: "C-02", amb: "market", next: null,
  pool: [["shrike", 0, 3], ["corvid", 0, 2], ["rook", 0, 3], ["carrion", 1, 2], ["jackdaw", 2, 1], ["bulwark", 3, 1]],
  boss: "ferryman", bossName: "THE FERRYMAN", bossLine: "WEAK POINT · WHILE HE REELS THE CHAIN IN", bossTip: "DASH TO BREAK THE HARPOON. KEEP COVER BETWEEN YOU.", phaseTxt: "FLOODWATER RISING" };
DIST.kiln = { n: 4, name: "THE KILN", code: "C-04", amb: "datacrypt", next: null,
  pool: [["shrike", 0, 3], ["rook", 0, 3], ["carrion", 0, 3], ["corvid", 1, 2], ["hexer", 1, 1], ["bulwark", 2, 2], ["jackdaw", 2, 1]],
  boss: "cinder", bossName: "CINDER", bossLine: "WEAK POINT · THE CHEST FURNACE WHILE IT VENTS", bossTip: "WATCH THE FLOOR. THE POUR FOLLOWS THE GLOW.", phaseTxt: "" };
// Story districts are built by the map generator from a fixed style and seed, so every player gets the same chapter maps.
const STORY_STYLES = {
  canals: { family: "canals", mood: "neon", hue: 192, weather: "heavy", floor: "tiles", backdrop: "docks", hole: "water", name: "GUTTERLINE CANALS", signs: ["NOODLE", "PAWN", "CAW//24H", "LOANS", "SOBA", "CORVUS"] },
  foundries: { family: "foundries", mood: "sodium", hue: 22, weather: "embers", floor: "rust", backdrop: "factory", hole: "molten", name: "THE KILN", signs: ["KILN", "SHIFT 3", "HOT", "NO ENTRY", "HALVORSEN", "CORVUS"] },
};
function storyStyle(m) {
  const P = STORY_STYLES[m.fam || "canals"];
  return Object.assign({}, PG.FAMILIES[P.family], P, { id: P.family + m.seed, seed: m.seed, accents: PG.MOODS[P.mood].acc, target: [13, 16], puddles: P.weather !== "embers", phaseExtra: "h", arch: [m.arch] });
}
const HAZARDS = { canals: ["THE CANAL", "water"], kiln: ["THE SLAG", "molten"] };

/* ---- THE FERRYMAN ---- */
DEFS.ferryman = { w: 48, h: 48, dither: 1, parts: [
  R("chrome", 31, 15, 6, 13), R("ambE", 33, 18, 2, 7),
  Pl("hazard", [[15, 15], [33, 15], [38, 43], [10, 43]]), Pl("rust", [[21, 16], [27, 16], [28, 43], [20, 43]]), R("hazard", 10, 40, 28, 2),
  R("boot", 13, 42, 9, 6), R("boot", 26, 42, 9, 6),
  S_(Pl("hazard", [[10, 17], [16, 16], [15, 31], [9, 31]])), R("chrome", 7, 31, 6, 2), E("ambE", 10, 36, 2.5, 3), R("chrome", 8, 39, 5, 1),
  S_(Pl("hazard", [[32, 17], [37, 17], [38, 27], [33, 27]])),
  R("gun", 29, 24, 16, 4), R("chrome", 43, 23, 2, 6), Pl("chrome", [[45, 23], [48, 25.5], [45, 28]]), Px("chrome", [[30, 29], [32, 30], [34, 29], [36, 30]]),
  E("skin", 24, 11, 5, 5), R("chrome", 20, 12, 8, 4), R("gun", 21, 13, 6, 1), Px("ambE", [[21, 10], [26, 10]]),
  R("robe", 18, 2, 12, 6), Pl("robe", [[7, 8], [41, 8], [37, 11], [11, 11]]),
] };
NAMES.ferryman = "THE FERRYMAN";
FLYING.add("ferryman"); BOSSY.add("ferryman"); // he wades through the canal instead of falling in
function spawnFerryman() {
  buildFlow(); const reach = q => G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0;
  const s = floorSpots(140).filter(reach).sort(() => Math.random() - .5)[0] || floorSpots(60).filter(reach)[0] || { x: GW / 2, y: 80 };
  const e = spawnEnemy("ferryman", s.x, s.y); Object.assign(e, { hp: 3, state: "walk", t: 2, gun: 1.5 }); return e;
}
function updFerry(e, dt, d) {
  const p = G.p, gx = () => e.x + e.face * 16, gy = () => e.y - 24; e.hurt = Math.max(0, (e.hurt || 0) - dt);
  if (e.state !== "pull") e.face = p.x < e.x ? -1 : 1;
  const see = () => los(gx(), gy(), p.x, p.y - BODY);
  if (e.state === "walk") {
    walk(e, 30, dt); e.face = p.x < e.x ? -1 : 1; e.gun -= dt;
    if (e.gun <= 0 && see()) { const a = Math.atan2(p.y - BODY - gy(), p.x - gx()); for (let k = -2; k <= 2; k++) shoot(gx(), gy(), a + k * .14, 95, "e", { by: "ferryman" }); AU.sfx("shotE", panOf(e.x)); e.gun = 2.4; }
    if (d < 14) playerDie("ferryman");
    if (e.t <= 0 && d < 230 && see()) { e.state = "aim"; e.t = 1 * tellK(); AU.sfx("charge", panOf(e.x)); }
  } else if (e.state === "aim") {
    if (e.t > .3) e.la = Math.atan2(p.y - BODY - gy(), p.x - gx());
    if (e.t <= 0) { e.state = "throw"; e.hx = gx(); e.hy = gy(); e.hd = 0; AU.sfx("rail", panOf(e.x)); rumble(.3, .4, 120); }
  } else if (e.state === "throw") {
    for (let s = 0; s < 4; s++) { e.hx += Math.cos(e.la) * 105 * dt; e.hy += Math.sin(e.la) * 105 * dt; e.hd += 105 * dt;
      const ch = tileOf(e.hx, e.hy); if (ch === null || SHOT_BLOCK.has(ch)) { e.state = "stuck"; e.t = 2.4; AU.sfx("impactMetal", panOf(e.hx)); fx(e.hx, e.hy, 8, ["#9090ad", "#ffffff"], 60, .3); return; }
      if (Math.hypot(e.hx - p.x, e.hy - (p.y - BODY)) < 9 && p.dash <= 0 && p.iframes <= 0) { e.state = "pull"; e.t = 1.3; AU.sfx("bulwark"); rumble(.8, .8, 300); pop(p.x, p.y - 34, "HOOKED · DASH!", COL.amber); return; }
      if (e.hd > 270) { e.state = "reel"; e.t = 1.4; return; } }
  } else if (e.state === "pull") {
    e.hx = p.x; e.hy = p.y - BODY;
    if (p.dash > 0) { e.state = "reel"; e.t = 1.8; pop(p.x, p.y - 34, "CHAIN BROKEN", COL.cyan); AU.sfx("ocSnap"); return; }
    const a = Math.atan2(e.y - p.y, e.x - p.x); moveBody(p, Math.cos(a) * 130 * dt, Math.sin(a) * 130 * dt);
    if (d < 16) { playerDie("ferryman"); e.state = "reel"; e.t = 1.4; }
    if (e.t <= 0) { e.state = "reel"; e.t = 1.4; }
  } else if (e.state === "reel" || e.state === "stuck") {
    const a = Math.atan2(gy() - e.hy, gx() - e.hx), l = Math.hypot(gx() - e.hx, gy() - e.hy), sp = Math.min(l, 260 * dt); e.hx += Math.cos(a) * sp; e.hy += Math.sin(a) * sp;
    if (e.t <= 0) { e.state = "walk"; e.t = rnd(2.4, 3.4); e.gun = 1; }
  }
}
// Story bosses take three hits. Each hit sends adds through the doors and stirs up the district hazard.
function hurtBoss(e) { if (e.type === "cinder") return hurtCinder(e); return hurtFerry(e); }
const STORY_BOSSES = { ferryman: () => spawnFerryman(), cinder: () => spawnCinder() };
// A hit while he reels the chain in costs him one of three hits. He calls the water up each time.
function hurtFerry(e) {
  e.hp--; e.hurt = .3; e.state = "walk"; e.t = 1.6; e.gun = 1.2; G.shake = 5; AU.sfx("land", panOf(e.x)); rumble(.8, .6, 250);
  fx(e.x, e.y - 22, 24, [COL.amber, "#ffffff", "#c08d1a"], 90, .6); pop(e.x, e.y - 52, e.hp + " LEFT", COL.amber);
  const ds = doors().filter(dd => Math.hypot(dd.x - G.p.x, dd.y - G.p.y) > 90).slice(0, 2); ds.forEach(dd => { G.pending.push({ type: Math.random() < .5 ? "shrike" : "rook", x: dd.x, y: dd.y, t: .9, door: dd }); AU.sfx("door", panOf(dd.x)); });
  if (G.rules && G.rules.flood) floodStage(true);
}

/* ---- The Kiln: floor vents that glow, then erupt ---- */
function ventCluster(cx, cy, n) {
  const out = [], seen = new Set(), q = [[cx, cy]];
  while (q.length && out.length < n) { const [x, y] = q.shift(), k = x + "," + y; if (seen.has(k)) continue; seen.add(k);
    const ch = G.grid.at(x, y); if (ch === null || WALK_BLOCK.has(ch) || ch === "o" || ch === "s") continue; out.push([x, y]);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - .5).forEach(([dx, dy]) => q.push([x + dx, y + dy])); }
  return out;
}
function safeForVent(px, py) { return Math.hypot(px - G.p.x, py - G.p.y) > 30 && !(G.gates || []).some(q => !q.done && Math.hypot(q.x - px, q.y - py) < 24) && doors().every(d => Math.hypot(d.x - px, d.y - py) > 30); }
function ventBurst(tiles, warn) { if (!tiles.length) return; G.vents = G.vents || []; G.vents.push({ tiles, state: "warn", t: warn || 1.3 }); AU.sfx("charge", panOf(tiles[0][0] * TS)); }
function randomVent() {
  const spots = floorSpots(40).filter(s => safeForVent(s.x, s.y)); const s = spots[Math.random() * spots.length | 0]; if (!s) return;
  ventBurst(ventCluster(Math.floor(s.x / TS), Math.floor(s.y / TS), 5 + (Math.random() * 5 | 0)).filter(([x, y]) => safeForVent(x * TS + 8, y * TS + 8)));
}
const onVent = (x, y) => (G.vents || []).some(v => v.state === "hot" && v.tiles.some(([tx, ty]) => Math.floor(x / TS) === tx && Math.floor(y / TS) === ty));
function updateVents(dt) {
  if (!G.vents) return; const p = G.p;
  for (const v of G.vents) { v.t -= dt;
    if (v.state === "warn" && v.t <= 0) { v.state = "hot"; v.t = 3.2; AU.sfx("vent", panOf(v.tiles[0][0] * TS)); G.shake = Math.max(G.shake, 2); }
    else if (v.state === "hot") { if (Math.random() < .5) { const [x, y] = v.tiles[Math.random() * v.tiles.length | 0]; G.parts.push({ x: x * TS + rnd(2, 14), y: y * TS + rnd(4, 14), vx: rnd(-10, 10), vy: rnd(-60, -30), life: .5, max: .5, col: Math.random() < .5 ? "#ffb22e" : "#ff6a2a", g: 40 }); }
      if (v.t <= 0) v.state = "done"; } }
  G.vents = G.vents.filter(v => v.state !== "done");
  if (p.dash <= 0 && onVent(p.x, p.y)) playerDie("vent");
  for (const e of G.en) if (e.alive && !FLYING.has(e.type) && onVent(e.x, e.y)) { fx(e.x, e.y - 6, 10, ["#ffb22e", "#ff6a2a"], 50, .5); killEnemy(e, "fall"); }
}
NAMES.vent = "THE VENTS";

/* ---- CINDER, the Kiln's priest ---- */
DEFS.cinder = { w: 48, h: 48, dither: 1, parts: [
  Pl("robe", [[14, 14], [34, 14], [41, 45], [24, 47], [7, 45]]), Pl("rust", [[18, 15], [30, 15], [33, 44], [15, 44]]),
  R("armor", 18, 19, 12, 12), R("ambE", 20, 21, 8, 8), R("gun", 18, 24, 12, 1), R("gun", 18, 27, 12, 1),
  S_(Pl("robe", [[14, 15], [8, 28], [6, 34], [11, 34], [17, 22]])), S_(Pl("robe", [[34, 15], [40, 28], [42, 34], [37, 34], [31, 22]])),
  R("chrome", 39, 33, 2, 9), E("ambE", 40, 43, 2.5, 2.5), L("chrome", 40, 33, 40, 28),
  E("robe", 24, 9, 6, 7), Pl("chrome", [[19, 8], [29, 8], [27, 14], [21, 14]]), Px("ambE", [[21, 10], [26, 10]]),
  Pl("rust", [[17, 4], [24, 0], [31, 4], [29, 6], [19, 6]]), Px("ambE", [[24, 1]]),
] };
NAMES.cinder = "CINDER"; FLYING.add("cinder"); BOSSY.add("cinder");
function spawnCinder() {
  buildFlow(); const reach = q => G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0;
  const s = floorSpots(120).filter(reach).sort(() => Math.random() - .5)[0] || { x: GW / 2, y: 90 };
  const e = spawnEnemy("cinder", s.x, s.y); Object.assign(e, { hp: 3, state: "walk", t: 2.5, gun: 1.6 }); return e;
}
// He pours slag in lines towards you, then his chest furnace has to vent: that's the window.
function updCinder(e, dt, d) {
  const p = G.p; e.face = p.x < e.x ? -1 : 1; e.hurt = Math.max(0, (e.hurt || 0) - dt);
  if (e.state === "walk") { walk(e, 24, dt); e.face = p.x < e.x ? -1 : 1; e.gun -= dt;
    if (e.gun <= 0) { const a0 = Math.atan2(p.y - BODY - (e.y - 24), p.x - e.x); for (let k = -3; k <= 3; k++) shoot(e.x, e.y - 24, a0 + k * .2, 80, "e", { by: "cinder" }); AU.sfx("shotE", panOf(e.x)); e.gun = 2.6; }
    if (d < 14) playerDie("cinder");
    if (e.t <= 0) { e.state = "pour"; e.t = .9; AU.sfx("charge", panOf(e.x)); } }
  else if (e.state === "pour") { if (e.t <= 0) {
      // Three lines of slag fan out towards you, ending short of where you stand so a sidestep or dash clears them.
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      for (const off of [-.35, 0, .35]) { const tiles = [], seen = new Set();
        for (let r = 20; r < 300; r += 8) { const x = Math.floor((e.x + Math.cos(a + off) * r) / TS), y = Math.floor((e.y + Math.sin(a + off) * r) / TS), k = x + "," + y; if (seen.has(k)) continue; seen.add(k);
          const ch = G.grid.at(x, y); if (ch === null || WALK_BLOCK.has(ch)) break; if (ch !== "s") tiles.push([x, y]); }
        ventBurst(tiles, 1.1); }
      e.state = "vent"; e.t = 2.4; AU.sfx("vent", panOf(e.x)); } }
  else if (e.state === "vent") { if (Math.random() < .4) G.parts.push({ x: e.x + rnd(-4, 4), y: e.y - 24, vx: rnd(-20, 20), vy: rnd(-70, -40), life: .5, max: .5, col: "#ffb22e", g: 30 }); if (e.t <= 0) { e.state = "walk"; e.t = rnd(3, 4.2); e.gun = 1.2; } }
}
function hurtCinder(e) {
  e.hp--; e.hurt = .3; e.state = "walk"; e.t = 2; e.gun = 1.4; G.shake = 5; AU.sfx("land", panOf(e.x)); rumble(.8, .6, 250);
  fx(e.x, e.y - 24, 24, [COL.amber, "#ffffff", "#ff6a2a"], 90, .6); pop(e.x, e.y - 54, e.hp + " LEFT", COL.amber);
  doors().filter(dd => Math.hypot(dd.x - G.p.x, dd.y - G.p.y) > 90).slice(0, 2).forEach(dd => { G.pending.push({ type: Math.random() < .5 ? "carrion" : "shrike", x: dd.x, y: dd.y, t: .9, door: dd }); AU.sfx("door", panOf(dd.x)); });
  for (let i = 0; i < 2; i++) randomVent();
}

/* ---- Rising water ---- */
function floodCandidates() {
  const g = G.grid, out = [], near = (px, py) => (G.gates || []).some(q => Math.hypot(q.x - px, q.y - py) < 28) || (G.shard && Math.hypot(G.shard.x - px, G.shard.y - py) < 20);
  for (let y = 3; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) {
    if (g[y][x] !== "." || ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy][x + dx] === "o")) continue;
    const px = x * TS + 8, py = y * TS + 8; if (Math.hypot(px - G.p.x, py - G.p.y) < 34 || near(px, py)) continue;
    let byDoor = false; for (let j = y - 2; j <= y + 2; j++) for (let i = x - 2; i <= x + 2; i++) if (G.grid.at(i, j) === "s") byDoor = true; if (byDoor) continue;
    out.push([x, y]); }
  return out;
}
// Every door and every unopened floodgate must stay reachable on foot after the water rises.
function stillReachable(extra) {
  const W = MW, H = MH, seen = new Uint8Array(W * H), wet = new Set(extra.map(([x, y]) => y * W + x)), q = [];
  const ok = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const ch = G.grid[y][x]; return !WALK_BLOCK.has(ch) && ch !== "o" && !wet.has(y * W + x); };
  const sx = Math.floor(G.p.x / TS), sy = Math.floor(G.p.y / TS); if (!ok(sx, sy)) return false; seen[sy * W + sx] = 1; q.push(sx, sy);
  for (let h = 0; h < q.length; h += 2) { const x = q[h], y = q[h + 1]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (ok(nx, ny) && !seen[ny * W + nx]) { seen[ny * W + nx] = 1; q.push(nx, ny); } } }
  const reach = (px, py) => { const tx = Math.floor(px / TS), ty = Math.floor(py / TS); return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[(ty + dy) * W + tx + dx]); };
  return doors().every(dd => reach(dd.x, dd.y)) && (G.gates || []).every(g => g.done || reach(g.x, g.y));
}
function floodStage(now) {
  if (G.flood || (G.floodTotal || 0) >= 64) return;
  let pick = floodCandidates().sort(() => Math.random() - .5).slice(0, 16);
  for (let k = 0; k < 4 && pick.length && !stillReachable(pick); k++) pick = pick.slice(0, Math.floor(pick.length / 2));
  if (!pick.length || !stillReachable(pick)) return;
  G.flood = { t: now ? 1.6 : 2.4, tiles: pick }; AU.sfx("bell"); radioOnce("floodwarn", "magpie", "Locks are opening. The flashing tiles go under next.");
}
function updateFlood(dt) {
  const F = G.flood; if (!F) return; F.t -= dt; if (F.t > 0) return;
  G.flood = null; let n = 0;
  F.tiles.forEach(([x, y]) => { const px = x * TS + 8, py = y * TS + 8; if (Math.hypot(px - G.p.x, py - G.p.y) < 12) return; G.grid[y][x] = "o"; n++; fx(px, py, 6, ["#7fd3ff", "#e8f6ff", "#2a4a70"], 50, .5); });
  G.floodTotal = (G.floodTotal || 0) + n; G.dirty = true; G.gapTiles = gapTiles(); buildFlow(); AU.sfx("vent"); G.shake = Math.max(G.shake, 2);
}

/* ---- Objectives ---- */
function placeStall() {
  const S = floorSpots(50).filter(s => { const tx = Math.floor(s.x / TS), ty = Math.floor(s.y / TS); for (let j = ty - 1; j <= ty; j++) for (let i = tx - 1; i <= tx + 1; i++) { const ch = G.grid.at(i, j); if (ch === null || WALK_BLOCK.has(ch) || ch === "o") return false; } return true; })
    .sort((a, b) => Math.hypot(a.x - GW / 2, a.y - GH / 2 - 10) - Math.hypot(b.x - GW / 2, b.y - GH / 2 - 10))[0] || { x: GW / 2, y: GH / 2 };
  G.stall = { x: S.x, y: S.y, hp: G.rules.goal.hp, max: G.rules.goal.hp, hurtT: 0 };
}
function hurtStall(n) { const S = G.stall; if (!S || G.camp.won) return; S.hp = Math.max(0, S.hp - n); S.hurtT = .25; fx(S.x + rnd(-12, 12), S.y - 12, 5, [COL.magenta, "#c08d1a", "#ffffff"], 50, .4); AU.sfx("crate", panOf(S.x)); if (S.hp <= 0) campFail("STALL DESTROYED"); }
const stallHit = b => G.stall && Math.abs(b.x - G.stall.x) < 15 && b.y > G.stall.y - 26 && b.y < G.stall.y + 1;
// Objective terminals: floodgates, beacons, relays or furnaces, set by the chapter's goal.
const gateGoal = () => Object.assign({ noun: "FLOODGATE", verb: "OPENING", done: "OPEN", secs: 3.2 }, G.rules.goal);
const gateActive = q => !q.done && (!gateGoal().seq || q === G.gates.find(g => !g.done));
function placeGates(n) {
  const S = floorSpots(70).filter(s => doors().every(dd => Math.hypot(dd.x - s.x, dd.y - s.y) > 48)).sort(() => Math.random() - .5), out = [];
  for (const s of S) { if (out.every(q => Math.hypot(q.x - s.x, q.y - s.y) > 120)) out.push({ x: s.x, y: s.y, prog: 0, done: false }); if (out.length === n) break; }
  for (const s of S) { if (out.length >= n) break; if (out.every(q => Math.hypot(q.x - s.x, q.y - s.y) > 60)) out.push({ x: s.x, y: s.y, prog: 0, done: false }); }
  G.gates = out;
}
function gateProgress(g, k) {
  if (!gateActive(g)) return; g.prog = Math.min(1, g.prog + k);
  if (g.prog >= 1) { g.done = true; const n = G.gates.filter(q => q.done).length, gg = gateGoal(); G.banner = { txt: `${gg.noun} ${n}/${G.gates.length} ${gg.done}`, col: COL.cyan, life: 2 }; AU.sfx("milestone"); fx(g.x, g.y - 8, 24, ["#7fd3ff", "#ffffff", COL.cyan], 90, .7);
    G.heatBase = Math.min(3, G.heatBase + 1); doors().sort(() => Math.random() - .5).slice(0, 2).forEach(dd => { G.pending.push({ type: "shrike", x: dd.x, y: dd.y, t: .9, door: dd }); AU.sfx("door", panOf(dd.x)); }); }
}
function placeShard() { const s = floorSpots(110).filter(q => tileOf(q.x, q.y) !== "o")[Math.random() * 40 | 0] || floorSpots(60)[0]; if (s) G.shard = { x: s.x, y: s.y }; }

/* ---- Triggers for radio lines and the datashard ---- */
function trig(on) {
  const C = G.camp; if (on === "start") return C.t >= .6; if (on === "p2") return G.phase2; if (on === "boss") return G.boss && G.mode === "play";
  const [k, v] = on.split(":"), n = +v;
  if (k === "t") return C.t >= n; if (k === "k") return dk() >= n; if (k === "stall") return G.stall && G.stall.hp / G.stall.max * 100 <= n;
  if (k === "gate") return G.gates && G.gates.filter(g => g.done).length >= n; if (k === "hp") return G.en.some(e => e.alive && e.hp && BOSSY.has(e.type) && e.hp <= n);
  return false;
}
function radioOnce(key, who, text) { const C = G.camp; if (!C || C.fired.has(key)) return; C.fired.add(key); radio(who, text); }

/* ---- Chapter runs ---- */
function startChapter(n, retry) {
  const ch = CHAPTERS[n]; SAVE.camp.cur = n; SAVE.camp.met.magpie = SAVE.camp.met.magpie || n >= 2;
  if (!retry) undoChapterFx(n);
  G.camp = { n, ch, t: 0, fired: new Set(), won: false, winT: 0, kills0: 0 }; G.rules = typeof ch.rules === "function" ? ch.rules(SAVE.camp) : ch.rules; G.chapMap = ch.map; G.runSeed = null; G.queuedSeed = null;
  const hz = HAZARDS[ch.district] || [null, null];
  G.radioQ = []; G.stall = null; G.gates = null; G.shard = null; G.flood = null; G.vents = null; G.floodTotal = 0; G.god = false; G.dropName = hz[0]; G.hazard = hz[1];
  AU.init(); BANK.attach(); RUN.reset(ch.district);
  G.heatBase = G.rules.heatBase || 0; G.heat = G.heatBase; G.lastHeat = G.heat;
  G.p.shield = SAVE.camp.diff === "story" ? 2 : 0;
  const g = G.rules.goal; if (g.type === "stall") placeStall(); if (g.type === "gates") placeGates(g.n);
  G.floodT = G.rules.flood || 0; G.ventT = G.rules.vents || 0;
  const title = `CHAPTER ${String(n).padStart(2, "0")} · ${ch.title}`, go = () => { G.mode = "play"; G.paused = false; G.banner = { txt: ch.goal, col: COL.cyan, life: 2.6 }; RUN.music(); buildFlow(); };
  AU.stop(); AU.ambience(D().amb);
  if (retry) go(); else startTalk(ch.brief, go, { title });
}
function campTick(dt) {
  const C = G.camp; if (!C) return; const ch = C.ch, R = G.rules, g = R.goal;
  if (C.won) { C.winT -= dt; if (C.winT <= 0 && G.mode === "play") { AU.stop(); startTalk(ch.outro, chapterDone, { title: `CHAPTER ${String(C.n).padStart(2, "0")} · ${ch.title}` }); } return; }
  C.t += dt;
  ch.radio.forEach((r, i) => { if (C.fired.has(i) || (r.if && !r.if(SAVE.camp)) || !trig(r.on)) return; C.fired.add(i); radio(r.who, typeof r.t === "function" ? r.t() : r.t); });
  if (ch.shard && !C.shardOut && !SAVE.camp.shards[C.n] && trig(ch.shard.on)) { C.shardOut = true; placeShard(); }
  if (ch.shard && !C.shardOut && SAVE.camp.shards[C.n] && trig(ch.shard.on)) C.shardOut = true; // already found on an earlier run
  if (G.shard && Math.hypot(G.shard.x - G.p.x, G.shard.y - G.p.y) < 12) { SAVE.camp.shards[C.n] = true; C.gotShard = true; G.shard = null; persist(); AU.sfx("milestone"); G.banner = { txt: "DATASHARD RECOVERED · CHECK THE ARCHIVE", col: COL.magenta, life: 2.4 }; }
  const p = G.p; if (tileOf(p.x, p.y) !== "o" && !onVent(p.x, p.y)) p.safe = { x: p.x, y: p.y };
  if (R.vents) { G.ventT -= dt; if (G.ventT <= 0) { G.ventT = R.vents * rnd(.8, 1.2); randomVent(); } } updateVents(dt);
  if (R.flood) { G.floodT -= dt; if (G.floodT <= 0) { G.floodT = R.flood; floodStage(false); } updateFlood(dt); }
  if (G.stall) { const S = G.stall; S.hurtT = Math.max(0, S.hurtT - dt);
    for (const e of G.en) { if (!e.alive || BOSSY.has(e.type)) continue; const d = Math.hypot(e.x - S.x, e.y - S.y);
      if (e.type === "corvid") { if (e.state === "dive" && !e.dv) { e.dv = true; if (Math.random() < .35) e.la = Math.atan2(S.y - 10 - e.y, S.x - e.x); } if (e.state !== "dive") e.dv = false; if (e.state === "dive" && d < 14) { hurtStall(12); killEnemy(e, "blast"); } }
      else if (d < 16) hurtStall(14 * dt); } }
  if (G.gates) G.gates.forEach(q => { if (gateActive(q) && Math.hypot(q.x - p.x, q.y - p.y) < 18) gateProgress(q, dt / gateGoal().secs); });
  const win = (g.type === "kills" && dk() >= g.n) || ((g.type === "survive" || g.type === "stall") && C.t >= g.secs) || (g.type === "gates" && G.gates.every(q => q.done));
  if (win) campWin();
}
function campWin() {
  const C = G.camp; if (!C || C.won) return; C.won = true; C.winT = 1.6; G.god = true; G.flood = null; G.vents = null;
  for (const e of G.en) if (e.alive && e.type !== "nest") { e.alive = false; fx(e.x, e.y - 10, 8, ["#2a2440", COL.magenta], 50, .5); }
  G.pending = []; G.bul = []; G.banner = { txt: "OBJECTIVE COMPLETE", col: COL.cyan, life: 1.6 }; AU.sfx("milestone"); G.best = Math.max(G.best || 0, G.score); SAVE.best = G.best;
}
function chapterDone() {
  const C = G.camp, S = SAVE.camp; earn(150); S.done[C.n] = true; if (S.paidNow) S.paid[C.n] = true; S.paidNow = false;
  S.cur = Math.max(S.cur, Math.min(C.n + 1, maxChapter())); if (C.ch.district === "market" && G.rules.goal.type === "boss") track("clear", "market");
  if (C.ch.district === "rookery" && G.rules.goal.type === "boss") track("clear", "rookery");
  persist(); G.god = false; G.mode = "chap"; G.chapT = 0; G.menuMode = null; AU.ambience(D().amb);
}
function campFail(reason) {
  if (G.mode !== "play") return; G.mode = "dead"; G.deadT = 0; G.killer = reason; rumble(1, 1, 600); AU.sfx("flatline"); AU.stop(); AU.setOC(false); G.oc = null; G.shake = 6;
}
// Story difficulty: two shields soak hits. A fall into the water puts you back on the last dry spot.
function campShield(by) {
  const p = G.p; if (!G.camp || !(p.shield > 0)) return false;
  p.shield--; p.iframes = 1.6; G.bul = G.bul.filter(b => b.owner === "p"); G.shake = 6; rumble(1, 1, 300); AU.sfx("ocSnap"); fx(p.x, p.y - BODY, 24, [COL.cyan, "#ffffff"], 80, .6);
  if ((by === "hole" || by === "vent") && p.safe) { p.x = p.safe.x; p.y = p.safe.y; }
  G.banner = { txt: `SHIELD BROKEN · ${p.shield} LEFT`, col: COL.cyan, life: 1.8 }; return true;
}
const maxChapter = () => Math.max(...ACTS.flatMap(a => a.chapters));
// The chapter to play next: the first one not cleared yet, within what is unlocked.
const nextChapter = () => Math.min(ACTS.flatMap(a => a.chapters).find(n => !SAVE.camp.done[n]) || maxChapter(), Math.min(SAVE.camp.cur, maxChapter()));
const chLabel = n => "CH " + String(n).padStart(2, "0");
const actOf = n => ACTS.find(a => a.chapters.includes(n)) || ACTS[0];
const allChapters = () => ACTS.flatMap(a => a.chapters);

/* ---- Drawing in the world ---- */
// Canal water: a moving shimmer and foam edges, so flooded tiles read as deadly at a glance.
function drawWater(c, t) {
  const g = G.grid; for (let y = 2; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { if (g[y][x] !== "o") continue; const px = x * TS, py = y * TS;
    c.fillStyle = "rgba(30,110,170,.28)"; c.fillRect(px, py, TS, TS);
    const ph = (t * .02 + x * 5 + y * 3) % 16; c.fillStyle = "rgba(160,225,255,.35)"; c.fillRect(px + ((ph * 3) | 0) % 14, py + (ph | 0), 3, 1); c.fillRect(px + ((ph * 7 + 5) | 0) % 13, py + ((ph + 8) % 16 | 0), 2, 1);
    c.fillStyle = "rgba(200,240,255,.45)"; if (g[y - 1][x] !== "o") c.fillRect(px, py, TS, 1); if (g[y + 1][x] !== "o") c.fillRect(px, py + TS - 1, TS, 1); if (g[y][x - 1] !== "o") c.fillRect(px, py, 1, TS); if (g[y][x + 1] !== "o") c.fillRect(px + TS - 1, py, 1, TS); }
}
// Kiln slag: a slow orange pulse and bright crust edges.
function drawMolten(c, t) {
  const g = G.grid; for (let y = 2; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { if (g[y][x] !== "o") continue; const px = x * TS, py = y * TS;
    c.fillStyle = `rgba(255,${90 + Math.round(30 * Math.sin(t * .003 + x + y))},20,.22)`; c.fillRect(px, py, TS, TS);
    c.fillStyle = "rgba(255,200,90,.5)"; if (g[y - 1][x] !== "o") c.fillRect(px, py, TS, 1); if (g[y + 1][x] !== "o") c.fillRect(px, py + TS - 1, TS, 1); if (g[y][x - 1] !== "o") c.fillRect(px, py, 1, TS); if (g[y][x + 1] !== "o") c.fillRect(px + TS - 1, py, 1, TS); }
}
function campDrawFloor(c, t) {
  if (G.hazard === "water") drawWater(c, t); if (G.hazard === "molten") drawMolten(c, t);
  for (const v of G.vents || []) { const on = Math.floor(t / 100) % 2;
    v.tiles.forEach(([x, y]) => { if (v.state === "warn") { c.fillStyle = rgba("#ff6a2a", on ? .45 : .18); c.fillRect(x * TS, y * TS, TS, TS); }
      else { c.fillStyle = `rgba(255,${150 + Math.round(60 * Math.sin(t * .02 + x * 3 + y))},40,.7)`; c.fillRect(x * TS, y * TS, TS, TS); c.save(); c.globalCompositeOperation = "lighter"; glow(c, x * TS + 8, y * TS + 8, 14, "#ff6a2a", .35); c.restore(); } }); }
  if (G.flood) { const on = Math.floor(t / 110) % 2, ts = G.flood.tiles; c.fillStyle = rgba("#2be4ff", on ? .4 : .14); ts.forEach(([x, y]) => c.fillRect(x * TS, y * TS, TS, TS));
    const mx = ts.reduce((s, q) => s + q[0], 0) / ts.length, my = ts.reduce((s, q) => s + q[1], 0) / ts.length; txt(c, "FLOOD", mx * TS + 8, my * TS + 4, rgba("#ffffff", on ? 1 : .5), 8, "center"); }
  if (G.gates) G.gates.forEach(q => { if (!q.done && !gateActive(q)) return; const col = q.done ? "#9dff4a" : COL.cyan; c.save(); c.translate(q.x, q.y); c.scale(1, .62); c.strokeStyle = rgba(col, .35); c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.stroke();
    if (q.prog > 0) { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + TAU * q.prog); c.stroke(); } c.restore(); });
  if (G.shard) { const b = Math.sin(t * .005) * 2, x = G.shard.x, y = G.shard.y - 8 + b; c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y, 14, COL.magenta, .5 + .2 * Math.sin(t * .01)); c.restore();
    c.fillStyle = COL.magenta; poly(c, [[x, y - 5], [x + 3, y], [x, y + 5], [x - 3, y]]); c.fill(); c.fillStyle = "#ffffff"; c.fillRect(Math.round(x), Math.round(y - 3), 1, 6); }
}
function campDrawObjects(c, t) {
  if (G.stall) { const S = G.stall, x = Math.round(S.x), y = Math.round(S.y), sh = S.hurtT > 0 ? Math.round(rnd(-1, 1)) : 0;
    const mg = portrait("magpieBody"); if (mg) drawSpr(c, mg, x + 4 + sh, y - mg.h - 6);
    c.fillStyle = "#1a1424"; c.fillRect(x - 15 + sh, y - 12, 30, 12); c.fillStyle = "#3a2a46"; c.fillRect(x - 15 + sh, y - 13, 30, 2);
    for (let i = 0; i < 4; i++) { c.fillStyle = ["#8f5340", "#625d7d", "#c08d1a", "#3b374f"][i]; c.fillRect(x - 12 + i * 7 + sh, y - 18, 5, 5); }
    c.fillStyle = "#302c41"; c.fillRect(x - 15 + sh, y - 30, 1, 18); c.fillRect(x + 14 + sh, y - 30, 1, 18);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#16121f" : COL.magenta; c.fillRect(x - 16 + i * 4 + sh, y - 32, 4, 4); }
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 28, 16, COL.magenta, .25); c.restore();
    c.fillStyle = "#2a2640"; c.fillRect(x - 15, y - 38, 30, 2); c.fillStyle = S.hp / S.max < .3 && Math.floor(t / 120) % 2 ? "#ffffff" : COL.magenta; c.fillRect(x - 15, y - 38, Math.round(30 * S.hp / S.max), 2); }
  if (G.gates) G.gates.forEach(q => { const x = Math.round(q.x), y = Math.round(q.y), live = gateActive(q), col = q.done ? "#9dff4a" : live ? COL.cyan : "#3a3456", gg = gateGoal();
    c.fillStyle = "#16121f"; c.fillRect(x - 5, y - 18, 10, 18); c.fillStyle = "#302c41"; c.fillRect(x - 5, y - 18, 10, 1); c.fillStyle = col; c.fillRect(x - 3, y - 15, 6, 4);
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 13, 10, col, .5); c.restore();
    if (live) txt(c, Math.hypot(G.p.x - x, G.p.y - y) < 18 ? gg.verb : gg.noun, x, y - 30, rgba(col, .8 + .2 * Math.sin(t * .01)), 8, "center"); });
  for (const e of G.en) { if (!e.alive || e.type !== "cinder") continue;
    if (e.state === "pour") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 24, 22, "#ff6a2a", .5 + .3 * Math.sin(t * .05)); c.restore(); }
    if (e.state === "vent") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 24, 14, COL.amber, .7 + .3 * Math.sin(t * .05)); c.restore(); txt(c, "VENTING", e.x, e.y - 58, rgba(COL.amber, .9), 8, "center"); }
    if (e.hurt > 0) { const s = sprOf("cinder", e.face); c.save(); c.globalAlpha = e.hurt * 2; c.drawImage(tinted(s, "#ffffff"), Math.round(e.x - s.w / 2), Math.round(e.y - s.h + 2)); c.restore(); } }
  for (const e of G.en) { if (!e.alive || e.type !== "ferryman") continue; const gx = e.x + e.face * 16, gy = e.y - 24;
    if (e.state === "aim") { c.save(); c.globalAlpha = e.t > .3 ? .35 + .2 * Math.sin(t * .05) : .9; pline(c, gx, gy, gx + Math.cos(e.la) * 270, gy + Math.sin(e.la) * 270, COL.amber); c.restore(); }
    if (["throw", "pull", "stuck", "reel"].includes(e.state)) { const l = Math.hypot(e.hx - gx, e.hy - gy), n = Math.max(1, Math.floor(l / 3));
      for (let i = 0; i <= n; i++) { c.fillStyle = i % 2 ? "#9090ad" : "#e2e2f1"; c.fillRect(Math.round(gx + (e.hx - gx) * i / n), Math.round(gy + (e.hy - gy) * i / n), 1, 1); }
      c.fillStyle = "#e2e2f1"; c.fillRect(Math.round(e.hx) - 1, Math.round(e.hy) - 1, 3, 3); }
    if (e.state === "reel" || e.state === "stuck") { c.save(); c.globalCompositeOperation = "lighter"; const on = .6 + .4 * Math.sin(t * .05); glow(c, e.x - e.face * 9, e.y - 30, 12, COL.amber, on); c.restore(); }
    if (e.hurt > 0) { const s = sprOf("ferryman", e.face); c.save(); c.globalAlpha = e.hurt * 2; c.drawImage(tinted(s, "#ffffff"), Math.round(e.x - s.w / 2), Math.round(e.y - s.h + 2)); c.restore(); } }
}
NPC_LOOKS.magpieBody = { coat: "cloak", coatCol: "midnight", lining: "magenta", hair: "long", hairCol: "black", skin: "s2", eyes: "mask", arm: "both", glow: "magenta", trail: "glow", gun: "steel", extra: "none" };

/* ---- HUD ---- */
function campHudCenter(c, t) {
  const C = G.camp, g = G.rules.goal, W = GW, x = W / 2 - 54; let label = "", k = 0, col = COL.ink;
  if (G.boss) { const b = G.en.find(e => e.alive && e.type === D().boss); label = D().bossName; col = COL.magenta; k = b && b.hp ? b.hp / 3 : 1; }
  else if (g.type === "kills") { label = `${String(Math.min(dk(), g.n)).padStart(2, "0")}/${g.n} KILLS`; k = dk() / g.n; }
  else if (g.type === "survive") { const s = Math.max(0, Math.ceil(g.secs - C.t)); label = `SURVIVE ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; k = C.t / g.secs; }
  else if (g.type === "stall") { const s = Math.max(0, Math.ceil(g.secs - C.t)); label = `STALL ${Math.ceil(G.stall.hp / G.stall.max * 100)}% · ${s}S`; k = C.t / g.secs; col = G.stall.hp / G.stall.max < .3 ? COL.red : COL.ink; }
  else if (g.type === "gates") { const n = G.gates.filter(q => q.done).length; label = `${gateGoal().noun}S ${n}/${G.gates.length}`; k = n / G.gates.length; }
  else if (g.type === "boss") { label = `${String(Math.min(dk(), G.rules.boss)).padStart(2, "0")}/${G.rules.boss} · DRAW OUT`; k = dk() / G.rules.boss; }
  panel(c, x, 6, 108, 24, "#3a3456"); txt(c, label, W / 2, 9, col, 8, "center");
  for (let i = 0; i < 20; i++) { c.fillStyle = i < Math.min(1, k) * 20 ? (G.boss ? COL.amber : COL.magenta) : "#2a2640"; c.fillRect(W / 2 - 49 + i * 5, 21, 4, 3); }
  if (G.p.shield > 0 || SAVE.camp.diff === "story") { txt(c, "SHIELD", 168, GH - 58, COL.dim); for (let i = 0; i < 2; i++) { c.fillStyle = i < G.p.shield ? COL.cyan : "#2a2640"; c.fillRect(206 + i * 8, GH - 56, 6, 4); } }
}

/* ---- Campaign menu and archive ---- */
function openCamp() { G.mode = "camp"; G.campView = "list"; G.camp = null; G.rules = null; G.chapMap = null; shopSprites();
  // Open on the act and chapter you play next.
  const nx = nextChapter(), A = actOf(nx); G.campAct = ACTS.indexOf(A);
  G.menuMode = "camp"; G.menuSel = A.chapters.indexOf(nx); G.menuMx = mouse.x; G.menuMy = mouse.y; }
function campMenuItems() {
  const S = SAVE.camp, items = [], A = ACTS[G.campAct || 0];
  A.chapters.forEach((n, i) => { const open = n <= S.cur; items.push({ label: n, ch: n, y: 52 + i * 15, box: [20, 50 + i * 15, 236, 13], act: () => open ? startChapter(n) : AU.sfx("hackFail") }); });
  const y = 52 + A.chapters.length * 15 + 8;
  items.push({ label: "DIFFICULTY", y, box: [20, y - 2, 236, 13], act: () => { S.diff = S.diff === "story" ? "normal" : "story"; persist(); AU.sfx("lock", 2); } });
  items.push({ label: "ARCHIVE", y: y + 15, box: [20, y + 13, 236, 13], act: () => { G.campView = "archive"; G.menuMode = null; G.archSel = 0; } });
  items.push({ label: "BACK", y: y + 30, box: [20, y + 28, 236, 13], act: () => { G.mode = "title"; G.menuMode = null; } });
  return items;
}
function updateCamp(rdt) {
  if (G.campView === "archive") {
    const all = allChapters(), n = all.length; if (hit("escape") || hit("lmb") && mouse.y > 240) { G.campView = "list"; G.menuMode = null; return; }
    if (hit("arrowup") || hit("w")) G.archSel = (G.archSel + n - 1) % n; if (hit("arrowdown") || hit("s")) G.archSel = (G.archSel + 1) % n;
    all.forEach((ch, i) => { if (hit("lmb") && inBox([20, 48 + i * 13, 150, 12], mouse.x, mouse.y)) G.archSel = i; });
    if (hit("enter") || hit(" ")) { G.campView = "list"; G.menuMode = null; } return;
  }
  if (hit("escape")) { G.mode = "title"; G.menuMode = null; return; }
  const sw = d => { const a = Math.max(0, Math.min(ACTS.length - 1, (G.campAct || 0) + d)); if (a !== G.campAct) { G.campAct = a; G.menuSel = 0; AU.sfx("lock", 1); } };
  if (hit("arrowleft") || hit("a") || hit("q")) sw(-1); if (hit("arrowright") || hit("d") || hit("e")) sw(1);
  if (hit("lmb") && mouse.y < 40) { if (mouse.x < GW / 2 - 60) sw(-1); else if (mouse.x > GW / 2 + 60) sw(1); }
  G.menu = campMenuItems(); runMenu(G.menu);
}
function drawCampBG(c, t) { if (G.base) { c.drawImage(G.base.C, 0, 0); drawRain(c, G.base, t); } veil(c, .82); }
function drawCamp(c, t) {
  drawCampBG(c, t); const S = SAVE.camp, ai = G.campAct || 0, A = ACTS[ai];
  ["#ff2d8a", "#2be4ff", "#e9e6f5"].forEach((col, i) => txt(c, "NINE NIGHTS OF RAIN", GW / 2 + (i === 0 ? -1 : i === 1 ? 1 : 0), 10, col, 16, "center"));
  if (G.campView === "archive") { txt(c, "ARCHIVE", GW / 2, 32, COL.magenta, 8, "center"); return drawArchive(c, t); }
  const on2 = Math.floor(t / 400) % 2;
  txt(c, `ACT ${A.n} · ${A.name}`, GW / 2, 32, COL.amber, 8, "center");
  if (ACTS.length > 1) { txt(c, "<", GW / 2 - 92, 32, ai > 0 ? (on2 ? COL.cyan : rgba(COL.cyan, .6)) : "#2a2640", 8, "center"); txt(c, ">", GW / 2 + 92, 32, ai < ACTS.length - 1 ? (on2 ? COL.cyan : rgba(COL.cyan, .6)) : "#2a2640", 8, "center"); }
  const items = G.menu || campMenuItems(), sel = G.menuMode === G.mode ? G.menuSel : -1;
  items.forEach((it, i) => { const on = i === sel, [bx, by, bw, bh] = it.box; if (on) { c.fillStyle = rgba(COL.cyan, .14); c.fillRect(bx, by, bw, bh); c.fillStyle = COL.cyan; c.fillRect(bx, by, 2, bh); }
    if (it.ch) { const n = it.ch, open = n <= S.cur, done = S.done[n], ch = CHAPTERS[n];
      txt(c, String(n).padStart(2, "0"), bx + 8, it.y, open ? COL.amber : "#3a3456"); txt(c, open ? ch.title : "LOCKED", bx + 28, it.y, open ? (on ? COL.ink : rgba(COL.ink, .8)) : "#3a3456");
      txt(c, done ? "CLEAR" : open ? "NEW" : "", bx + bw - 22, it.y, done ? COL.cyan : COL.amber, 8, "right");
      if (S.shards[n]) { c.fillStyle = COL.magenta; poly(c, [[bx + bw - 10, it.y], [bx + bw - 7, it.y + 3], [bx + bw - 10, it.y + 6], [bx + bw - 13, it.y + 3]]); c.fill(); } }
    else { const lab2 = it.label === "DIFFICULTY" ? "DIFFICULTY: " + (S.diff === "story" ? "STORY · 2 SHIELDS" : "NORMAL · ONE LIFE") : it.label === "ARCHIVE" ? `ARCHIVE · ${Object.keys(S.shards).length}/${allChapters().length} LOGS` : it.label;
      txt(c, lab2, bx + 8, it.y, on ? COL.cyan : COL.dim); } });
  // Right column: the chapter under the cursor, then trust.
  const hov = items[sel] && items[sel].ch ? items[sel].ch : A.chapters.includes(nextChapter()) ? nextChapter() : A.chapters[0], ch = CHAPTERS[hov], open = hov <= S.cur;
  panel(c, 268, 46, 196, 70, "#3a3456");
  txt(c, `${chLabel(hov)} · ${DIST[ch.district].name}`, 276, 52, COL.amber);
  if (open) { wrapText(c, ch.goal, 180).forEach((l, i) => txt(c, l, 276, 64 + i * 10, COL.ink)); txt(c, S.done[hov] ? "CLEARED" + (S.shards[hov] ? " · DATASHARD FOUND" : " · DATASHARD MISSING") : "NOT CLEARED YET", 276, 102, S.done[hov] ? COL.cyan : COL.dim); }
  else txt(c, "CLEAR THE CHAPTER BEFORE IT", 276, 64, COL.dim);
  panel(c, 268, 122, 196, 84, "#3a3456"); txt(c, "WHO TRUSTS YOU", 276, 128, COL.dim);
  const metOf = { magpie: S.done[1] || S.cur >= 2, wren: S.flags.freed || S.flags.leftThem, vane: true, dex: S.done[9] || S.flags.metDex };
  TRUSTS.forEach(([k, nm], i) => { const met = metOf[k], y = 142 + i * 12; txt(c, met ? nm : "???", 276, y, met ? COL.ink : "#3a3456"); if (met) trustPips(c, 340, y + 2, S.trust[k]); });
  txt(c, "CORVUS RESONANCE", 276, 192, COL.red); for (let i = 0; i < 8; i++) { c.fillStyle = i < S.res ? COL.red : "#2a2640"; c.fillRect(392 + i * 8, 194, 6, 3); }
  txt(c, PAD.active ? "LEFT / RIGHT: ACT · UP / DOWN + " + lab().confirm + " · B: BACK" : "A / D: ACT · W / S + ENTER OR CLICK · ESC: BACK", GW / 2, GH - 14, rgba(COL.dim, .7), 8, "center");
}
function drawArchive(c, t) {
  const S = SAVE.camp, all = allChapters(); txt(c, "THE NIGHT OF FEATHERS, AS WITNESSES SAW IT", GW / 2, 42, COL.dim, 8, "center");
  all.forEach((n, i) => { const got = S.shards[n], on = i === G.archSel, y = 54 + i * 13; if (on) { c.fillStyle = rgba(COL.magenta, .14); c.fillRect(20, y - 2, 150, 12); }
    txt(c, got ? CHAPTERS[n].shard.title.split(" · ")[0] : "LOG " + String(n).padStart(2, "0"), 28, y, got ? (on ? COL.magenta : COL.ink) : "#3a3456"); txt(c, got ? "" : "MISSING", 164, y, "#3a3456", 8, "right"); });
  const n = all[G.archSel], sh = CHAPTERS[n].shard; panel(c, 180, 52, 284, 170, COL.magenta);
  if (S.shards[n]) { txt(c, sh.title, 190, 60, COL.magenta); wrapText(c, fillName(sh.text).toUpperCase(), 264).forEach((l, i) => txt(c, l, 190, 76 + i * 11, COL.ink)); }
  else { txt(c, "NOT RECOVERED", 190, 60, COL.dim); wrapText(c, `FIND THE GLOWING DATASHARD DURING ${chLabel(n)} · ${CHAPTERS[n].title}.`, 264).forEach((l, i) => txt(c, l, 190, 76 + i * 11, COL.dim)); }
  txt(c, PAD.active ? "UP / DOWN · B: BACK" : "W / S · ESC: BACK", GW / 2, GH - 14, rgba(COL.dim, .7), 8, "center");
}

/* ---- Chapter complete ---- */
function updateChap(rdt, actions) {
  G.chapT += rdt; if (G.chapT < .8) return; const n = G.camp.n, next = n < maxChapter() ? n + 1 : null;
  if (hit("escape")) { actions.toCamp(); return; }
  G.menu = layoutMenu(next ? [{ label: "NEXT · " + chLabel(next) + " " + CHAPTERS[next].title, act: () => startChapter(next) }, { label: "MAGPIE'S, THEN " + chLabel(next), col: COL.magenta, act: () => openShop("campNext") }, { label: "CAMPAIGN MENU", col: COL.dim, act: actions.toCamp }]
    : [{ label: "CAMPAIGN MENU", act: actions.toCamp }, { label: "MAGPIE'S", col: COL.magenta, act: () => { actions.toCamp(); openShop("title"); } }], 196); runMenu(G.menu);
}
function drawChap(c, t) {
  drawCampBG(c, t); const C = G.camp, S = SAVE.camp, A = actOf(C.n), actEnd = A.chapters[A.chapters.length - 1] === C.n, last = C.n === maxChapter();
  txt(c, actEnd ? `ACT ${A.n} COMPLETE` : "CHAPTER COMPLETE", GW / 2, 40, COL.cyan, 24, "center");
  txt(c, `${chLabel(C.n)} · ${C.ch.title}`, GW / 2, 72, COL.amber, 8, "center");
  txt(c, `TIME ${Math.floor(G.time / 60)}:${String(Math.floor(G.time % 60)).padStart(2, "0")}   ·   KILLS ${G.kills}   ·   +${G.runScrip || 0} SCRIP   ·   ${SAVE.scrip} BANKED`, GW / 2, 92, COL.ink, 8, "center");
  txt(c, S.shards[C.n] ? (C.gotShard ? "DATASHARD RECOVERED: " : "DATASHARD: ") + C.ch.shard.title : "DATASHARD MISSED · REPLAY THE CHAPTER TO FIND IT", GW / 2, 106, S.shards[C.n] ? COL.magenta : COL.dim, 8, "center");
  const shown = TRUSTS.filter(([k]) => k !== "dex" || S.flags.metDex); let x = GW / 2 - shown.length * 46;
  shown.forEach(([k, nm]) => { txt(c, nm, x, 126, COL.dim); trustPips(c, x + 40, 128, S.trust[k]); x += 92; });
  txt(c, "CORVUS RESONANCE " + S.res, GW / 2, 142, COL.red, 8, "center");
  if (last) txt(c, `ACT ${A.n + 1} ARRIVES IN THE NEXT BUILD`, GW / 2, 162, COL.magenta, 8, "center");
  if (G.chapT > .8) drawMenu(c, G.menu, t);
}
