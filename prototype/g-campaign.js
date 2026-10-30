/* NINE NIGHTS OF RAIN: campaign mode. Chapter runs with story objectives, the campaign menu, the archive,
   the chapter-complete screen, the Gutterline Canals district (rising water, floodgates) and THE FERRYMAN. */
"use strict";
const RUN = {}; // reset and music, filled in by g-main.js

/* ---- Save data ---- */
SAVE.camp = Object.assign({ cur: 1, done: {}, res: 0, flags: {}, shards: {}, log: {}, paid: {}, diff: "normal", met: {}, endings: {} }, SAVE.camp || {});
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
  summits: { family: "summits", mood: "ice", hue: 210, weather: "heavy", floor: "glass", backdrop: "stormGlass", hole: "void", name: "SPIRE ZERO", signs: ["HALVORSEN", "SPIRE", "FLOOR 88", "NO ENTRY", "EXEC", "CORVUS"] },
  nest: { family: "serverhalls", mood: "blood", hue: 350, weather: "ash", floor: "grid", backdrop: "serverWall", hole: "data", name: "THE NEST", signs: ["MOTHER", "WE ARE", "HOME", "FLOCK", "YOU", "CORVUS"] },
  slums: { family: "slums", mood: "toxic", hue: 95, weather: "acid", floor: "gravel", backdrop: "shanty", hole: "toxic", name: "THE STACKS", signs: ["SLEEP POD", "LOANS", "CLINIC", "IMPLANTS", "FREE CHROME", "CORVUS"] },
  galleria: { family: "galleria", mood: "neon", hue: 320, weather: "clear", floor: "marble", backdrop: "mall", hole: "void", name: "HALVORSEN GALLERIA", signs: ["HALVORSEN", "LUXE", "CLOSED", "LOCKDOWN", "SALE", "CORVUS"] },
  docks: { family: "docks", mood: "ice", hue: 205, weather: "smog", floor: "plate", backdrop: "docks", hole: "water", name: "SALTGATE DOCKS", signs: ["SALTGATE", "BERTH 7", "CUSTOMS", "NO ENTRY", "HALVORSEN", "CORVUS"] },
  serverhalls: { family: "serverhalls", mood: "ultraviolet", hue: 268, weather: "clear", floor: "grid", backdrop: "serverWall", hole: "data", name: "DATACRYPT", signs: ["COLD STORE", "RACK 00", "HALVORSEN", "NO SIGNAL", "DATA", "CORVUS"] },
  foundries: { family: "foundries", mood: "sodium", hue: 22, weather: "embers", floor: "rust", backdrop: "factory", hole: "molten", name: "THE KILN", signs: ["KILN", "SHIFT 3", "HOT", "NO ENTRY", "HALVORSEN", "CORVUS"] },
};
function storyStyle(m) {
  const P = STORY_STYLES[m.fam || "canals"];
  return Object.assign({}, PG.FAMILIES[P.family], P, { id: P.family + m.seed, seed: m.seed, accents: PG.MOODS[P.mood].acc, target: [13, 16], puddles: P.weather !== "embers", phaseExtra: "h", arch: [m.arch] });
}
DIST.stacks = { n: 7, name: "THE STACKS", code: "C-07", amb: "market", next: null,
  pool: [["shrike", 0, 4], ["rook", 0, 3], ["corvid", 0, 2], ["carrion", 1, 2], ["hexer", 1, 1], ["jackdaw", 2, 1], ["bulwark", 2, 1]],
  boss: "scarecrow", bossName: "SCARECROW", bossLine: "WEAK POINT · WHILE HE CALLS THE FLOCK", bossTip: "SHOOT HIS NESTS. HIT HIM WHEN HIS ARMS GO UP.", phaseTxt: "" };
DIST.galleria = { n: 8, name: "HALVORSEN GALLERIA", code: "C-08", amb: "spire", next: null,
  pool: [["warden", 0, 4], ["shrike", 0, 2], ["rook", 0, 2], ["bulwark", 1, 1], ["corvid", 1, 2], ["carrion", 2, 1]],
  boss: "vanexo", bossName: "DIRECTOR VANE", bossLine: "WEAK POINT · THE EXO-FRAME WHILE IT OVERHEATS", bossTip: "SIDESTEP THE CHARGE. THE MISSILES FOLLOW YOU.", phaseTxt: "" };
DIST.spire = { n: 9, name: "SPIRE ZERO", code: "C-09", amb: "spire", next: null,
  pool: [["shrike", 0, 3], ["rook", 0, 3], ["corvid", 0, 2], ["carrion", 0, 2], ["hexer", 0, 2], ["jackdaw", 0, 1], ["bulwark", 0, 2], ["warden", 0, 2]],
  boss: "choir", bossName: "THE CHOIR", bossLine: "WEAK POINT · ALL THREE AT ONCE", bossTip: "DROP ALL THREE BEFORE ANY OF THEM GETS BACK UP.", phaseTxt: "" };
DIST.nest = { n: 10, name: "THE NEST", code: "C-10", amb: "datacrypt", next: null,
  pool: [["corvid", 0, 4], ["shrike", 0, 3], ["hexer", 0, 2], ["rook", 0, 2], ["carrion", 1, 2], ["bulwark", 2, 1]],
  boss: "corvina", bossName: "MOTHER CORVINA", bossLine: "WEAK POINT · AFTER SHE SCREAMS", bossTip: "SHE CHANGES EVERY TIME YOU HURT HER.", phaseTxt: "" };
const HAZARDS = { spire: ["THE DROP", "void"], nest: ["THE DATA", "data"], stacks: ["THE PIT", "toxic"], galleria: ["THE ATRIUM", "void"], canals: ["THE CANAL", "water"], kiln: ["THE SLAG", "molten"], docks: ["THE HARBOUR", "water"], datacrypt: ["THE DATA", "data"] };
DIST.docks = { n: 5, name: "SALTGATE DOCKS", code: "C-05", amb: "rookery", next: null,
  pool: [["shrike", 0, 3], ["rook", 0, 3], ["corvid", 0, 2], ["carrion", 1, 2], ["jackdaw", 1, 1], ["bulwark", 2, 2]],
  boss: "widow", bossName: "WIDOW CRANE", bossLine: "WEAK POINT · THE CAB WHILE IT'S OPEN AFTER A DROP", bossTip: "A SHADOW ON THE FLOOR MEANS A CONTAINER IS COMING.", phaseTxt: "" };
DIST.datacrypt = { n: 6, name: "DATACRYPT", code: "C-06", amb: "datacrypt", next: null,
  pool: [["shrike", 0, 3], ["rook", 0, 2], ["hexer", 0, 2], ["carrion", 1, 3], ["corvid", 1, 2], ["bulwark", 2, 1]],
  boss: "archivist", bossName: "THE ARCHIVIST", bossLine: "WEAK POINT · ONLY WHILE NO ECHOES ARE LEFT", bossTip: "THE ECHOES ARE YOU. BREAK THEM ALL, THEN SHOOT.", phaseTxt: "" };

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
function hurtBoss(e) { if (e.type === "choir") return hurtChoir(e); if (e.type === "corvina") return hurtCorvina(e); if (e.type === "wrenc") return hurtWrenc(e); if (e.type === "scarecrow") return hurtScarecrow(e); if (e.type === "vanexo") return hurtVane(e); if (e.type === "cinder") return hurtCinder(e); if (e.type === "widow") return hurtWidow(e); if (e.type === "archivist") return hurtArchivist(e); return hurtFerry(e); }
const STORY_BOSSES = { choir: () => spawnChoir(), corvina: () => spawnCorvina(), scarecrow: () => spawnScarecrow(), vanexo: () => spawnVane(), ferryman: () => spawnFerryman(), cinder: () => spawnCinder(), widow: () => spawnWidow(), archivist: () => spawnArchivist() };
function bossSpot() { buildFlow(); const reach = q => G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0; return floorSpots(120).filter(reach).sort(() => Math.random() - .5)[0] || { x: GW / 2, y: 90 }; }
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

/* ---- Fog on the docks: you see a small circle around you, and enemy eyes through the murk ---- */
let FOGC = null;
function drawFog(c, t) {
  if (!G.fog || !G.p) return; if (!FOGC) FOGC = mk(GW, GH); const f = FOGC.getContext("2d"), p = G.p;
  f.globalCompositeOperation = "source-over"; f.clearRect(0, 0, GW, GH); f.fillStyle = `rgba(120,138,160,${G.fog})`; f.fillRect(0, 0, GW, GH);
  for (let i = 0; i < 5; i++) { f.fillStyle = "rgba(190,205,225,.07)"; f.fillRect(0, (t * .012 + i * 61) % (GH + 40) - 20, GW, 16); }
  f.globalCompositeOperation = "destination-out"; const g = f.createRadialGradient(p.x, p.y - 10, 34, p.x, p.y - 10, 125); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); f.fillStyle = g; f.fillRect(0, 0, GW, GH);
  c.drawImage(FOGC, 0, 0);
  c.save(); c.globalCompositeOperation = "lighter"; for (const e of G.en) { if (!e.alive || Math.hypot(e.x - p.x, e.y - p.y) < 90) continue; const tell = ["crouch", "tell", "aim", "charge", "armed"].includes(e.state); glow(c, e.x, e.y - 20 - (e.alt || 0), tell ? 9 : 5, tell ? COL.red : COL.magenta, tell ? .8 : .45); } c.restore();
}

/* ---- WIDOW CRANE: drops shipping containers where you stand ---- */
DEFS.widow = { w: 48, h: 48, dither: 1, parts: [
  R("armor", 6, 30, 4, 16), R("armor", 38, 30, 4, 16), L("armor", 8, 30, 18, 20), L("armor", 40, 30, 30, 20), R("boot", 4, 44, 8, 4), R("boot", 36, 44, 8, 4),
  R("hazard", 12, 16, 24, 14), R("hazard", 12, 16, 24, 2), Px("gun", [[14, 21], [17, 21], [20, 21], [23, 21], [26, 21], [29, 21], [32, 21]]),
  R("gun", 17, 19, 14, 8), R("cyanE", 19, 21, 10, 3), Px("redE", [[20, 24], [27, 24]]),
  R("chrome", 22, 2, 4, 15), R("chrome", 22, 2, 24, 3), R("chrome", 44, 5, 1, 12), Pl("chrome", [[42, 17], [47, 17], [44.5, 21]]),
  R("armor", 4, 6, 18, 2),
] };
NAMES.widow = "WIDOW CRANE"; FLYING.add("widow"); BOSSY.add("widow");
function spawnWidow() { const s2 = bossSpot(); const e = spawnEnemy("widow", s2.x, s2.y); Object.assign(e, { hp: 3, state: "walk", t: 2, gun: 1.5 }); return e; }
// A 2x2 drop site lined up with a tile, over plain floor, that won't seal anyone in.
function dropSite(px, py) {
  const tx = Math.floor(px / TS), ty = Math.floor(py / TS), tiles = [[tx, ty], [tx + 1, ty], [tx, ty + 1], [tx + 1, ty + 1]];
  if (!tiles.every(([x, y]) => G.grid.at(x, y) === "." && y > 2 && y < MH - 2)) return null;
  if (doors().some(d => Math.hypot(d.x - (tx + 1) * TS, d.y - (ty + 1) * TS) < 36)) return null;
  return stillReachable(tiles) ? tiles : null;
}
function queueDrops(n) {
  const p = G.p, sites = [], tryAt = (x, y) => { const s2 = dropSite(x, y); if (s2 && !sites.some(o => Math.abs(o[0][0] - s2[0][0]) < 3 && Math.abs(o[0][1] - s2[0][1]) < 3)) sites.push(s2); };
  tryAt(p.x - 8, p.y - 8); for (let k = 0; k < 30 && sites.length < n; k++) tryAt(p.x + rnd(-110, 110), p.y + rnd(-70, 70));
  G.drops = (G.drops || []).concat(sites.map(tiles => ({ tiles, state: "warn", t: 1.4 }))); if (sites.length) AU.sfx("charge");
}
function updateDrops(dt) {
  if (!G.drops) return; const p = G.p, inside = (o, tiles) => tiles.some(([x, y]) => Math.floor(o.x / TS) === x && Math.floor(o.y / TS) === y);
  for (const d of G.drops) { d.t -= dt;
    if (d.state === "warn" && d.t <= 0) { d.state = "down"; d.t = 9; d.tiles.forEach(([x, y]) => G.grid[y][x] = "C"); G.dirty = true; G.shake = 6; AU.sfx("land"); rumble(.8, .6, 250);
      fx((d.tiles[0][0] + 1) * TS, (d.tiles[0][1] + 1) * TS, 24, ["#9aa4c8", "#2a3048", COL.amber], 100, .6);
      for (const e of G.en) if (e.alive && !FLYING.has(e.type) && inside(e, d.tiles)) killEnemy(e, "blast");
      if (inside(p, d.tiles)) { playerDie("widow"); if (G.mode === "play") { const q = floorSpots(0).sort((u, v) => Math.hypot(u.x - p.x, u.y - p.y) - Math.hypot(v.x - p.x, v.y - p.y))[0]; if (q) { p.x = q.x; p.y = q.y; } } } }
    else if (d.state === "down" && d.t <= 0) { d.state = "gone"; d.tiles.forEach(([x, y]) => { if (G.grid[y][x] === "C") G.grid[y][x] = "."; }); G.dirty = true; fx((d.tiles[0][0] + 1) * TS, (d.tiles[0][1] + 1) * TS, 12, ["#9aa4c8", "#2a3048"], 50, .5); } }
  G.drops = G.drops.filter(d => d.state !== "gone");
}
function updWidow(e, dt, d) {
  const p = G.p; e.face = p.x < e.x ? -1 : 1; e.hurt = Math.max(0, (e.hurt || 0) - dt);
  if (e.state === "walk") { walk(e, 22, dt); e.face = p.x < e.x ? -1 : 1; e.gun -= dt;
    if (e.gun <= 0) { const a = Math.atan2(p.y - BODY - (e.y - 26), p.x - e.x); for (let k = -1; k <= 1; k++) shoot(e.x, e.y - 26, a + k * .12, 120, "e", { by: "widow" }); AU.sfx("shotE", panOf(e.x)); e.gun = 1.8; }
    if (d < 16) playerDie("widow");
    if (e.t <= 0) { e.state = "drop"; e.t = 1.6; queueDrops(2 + (3 - e.hp)); } }
  else if (e.state === "drop") { if (e.t <= 0) { e.state = "cab"; e.t = 2.2; AU.sfx("vent", panOf(e.x)); } }
  else if (e.state === "cab") { if (e.t <= 0) { e.state = "walk"; e.t = rnd(2.6, 3.6); e.gun = 1; } }
}
function hurtWidow(e) {
  e.hp--; e.hurt = .3; e.state = "walk"; e.t = 1.4; e.gun = 1.2; G.shake = 5; AU.sfx("land", panOf(e.x)); rumble(.8, .6, 250);
  fx(e.x, e.y - 24, 24, [COL.amber, "#ffffff", COL.cyan], 90, .6); pop(e.x, e.y - 54, e.hp + " LEFT", COL.amber);
  doors().filter(dd => Math.hypot(dd.x - G.p.x, dd.y - G.p.y) > 90).slice(0, 2).forEach(dd => { G.pending.push({ type: Math.random() < .5 ? "rook" : "shrike", x: dd.x, y: dd.y, t: .9, door: dd }); AU.sfx("door", panOf(dd.x)); });
}

/* ---- THE ARCHIVIST: hides behind echoes that replay your own recent movement ---- */
DEFS.archivist = { w: 48, h: 48, dither: 1, parts: [
  Pl("robe", [[16, 12], [32, 12], [40, 44], [24, 40], [8, 44]]), L("cyanE", 24, 14, 24, 40), L("magE", 18, 24, 30, 24), L("cyanE", 15, 32, 33, 32),
  S_(Pl("robe", [[16, 14], [9, 26], [6, 32], [11, 32], [18, 20]])), S_(Pl("robe", [[32, 14], [39, 26], [42, 32], [37, 32], [30, 20]])),
  R("bone", 2, 22, 6, 8), R("bone", 40, 22, 6, 8), Px("cyanE", [[3, 24], [4, 26], [5, 28], [41, 24], [43, 26], [42, 28]]),
  E("robe", 24, 8, 6, 7), Pl("chrome", [[19, 6], [29, 6], [27, 12], [21, 12]]), Px("cyanE", [[21, 8], [22, 8], [26, 8], [27, 8]]),
] };
NAMES.archivist = "THE ARCHIVIST"; NAMES.echo = "YOUR OWN ECHO"; FLYING.add("archivist"); BOSSY.add("archivist"); FLYING.add("echo");
// Echoes are your own sprite, washed cyan and see-through.
function echoSprites() { if (SP.echo) return; const v = SP.vesper, t2 = mk(v.w, v.h), x = t2.getContext("2d");
  x.globalAlpha = .75; x.drawImage(v.cv, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-atop"; x.fillStyle = "rgba(127,211,255,.55)"; x.fillRect(0, 0, v.w, v.h);
  const base = { cv: t2, gc: v.gc, G: v.G, w: v.w, h: v.h }; SP.echo = base; SPF.echo = flipSpr(base); }
function spawnArchivist() { echoSprites(); const s2 = bossSpot(); const e = spawnEnemy("archivist", s2.x, s2.y); Object.assign(e, { hp: 3, state: "summon", t: 1, ring: 2.5 }); return e; }
// An echo walks a few seconds of the path you really took this chapter, and fires at you as it goes.
function spawnEcho() {
  const R2 = G.camp.rec || [], len = 50; let path;
  if (R2.length > len + 5) { const i0 = Math.floor(Math.random() * (R2.length - len)); path = R2.slice(i0, i0 + len); }
  else { buildFlow(); const reach = q => G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0; // not enough recorded movement: stand on a random reachable spot in view
    const ok = floorSpots(60).filter(q => reach(q) && Math.hypot(q.x - G.p.x, q.y - G.p.y) < 200), seen = ok.filter(q => los(G.p.x, G.p.y - 12, q.x, q.y - 10, 1e9));
    path = [(seen.length ? seen : ok)[Math.floor(Math.random() * (seen.length || ok.length))] || bossSpot()]; }
  const e = spawnEnemy("echo", path[0].x, path[0].y); Object.assign(e, { path, pi: 0, gun: rnd(1, 2) }); fx(e.x, e.y - 14, 12, [COL.cyan, "#ffffff"], 60, .5); return e;
}
function updEcho(e, dt) {
  const p = G.p; e.pi = (e.pi + dt * 10) % e.path.length; const q = e.path[Math.floor(e.pi)]; if (q) { e.face = q.x < e.x ? -1 : q.x > e.x ? 1 : e.face; e.x = q.x; e.y = q.y; }
  e.gun -= dt; if (e.gun <= 0) { shoot(e.x + e.face * 10, e.y - BODY - 2, Math.atan2(p.y - BODY - (e.y - BODY - 2), p.x - e.x - e.face * 10), 115, "e", { by: "echo" }); AU.sfx("shotE", panOf(e.x)); e.gun = rnd(1.4, 2.2); }
  e.hid = los(p.x, p.y - 12, e.x, e.y - 10, 1e9) ? 0 : (e.hid || 0) + dt; // out of sight too long: step back into view so the shield can always come down
  if (e.hid > 8) { const q = floorSpots(60).filter(q => Math.hypot(q.x - p.x, q.y - p.y) < 180 && los(p.x, p.y - 12, q.x, q.y - 10, 1e9)).sort(() => Math.random() - .5)[0]; if (q) { e.path = [q]; e.pi = 0; e.hid = 0; fx(q.x, q.y - 14, 12, [COL.cyan, "#ffffff"], 60, .5); } }
  if (!G.en.some(a => a.alive && a.type === "archivist")) e.alive = false;
}
function updArchivist(e, dt) {
  const p = G.p; e.face = p.x < e.x ? -1 : 1; e.alt = 6 + Math.sin((e.anim || 0) * 2) * 2; e.hurt = Math.max(0, (e.hurt || 0) - dt);
  const echoes = G.en.filter(x => x.alive && x.type === "echo").length;
  if (e.state === "summon") { if (e.t <= 0) { for (let i = 0; i < 2 + (3 - e.hp); i++) spawnEcho(); e.state = "shielded"; AU.sfx("hexer"); } }
  else if (e.state === "shielded") { e.ring -= dt; if (e.ring <= 0) { for (let i = 0; i < 10; i++) shoot(e.x, e.y - 24, i / 10 * TAU + (e.anim || 0), 70, "e", { by: "archivist" }); AU.sfx("shotE", panOf(e.x)); e.ring = 3.2; }
    const dx = p.x - e.x, dy = p.y - e.y, dd = Math.hypot(dx, dy) || 1; if (dd > 110) { const nx = Math.min(MW * TS - 40, Math.max(40, e.x + dx / dd * 16 * dt)), ny = Math.min(MH * TS - 40, Math.max(70, e.y + dy / dd * 16 * dt)); // drifts in so it's in reach when exposed
      if ([[0, -10], [-12, -10], [12, -10], [0, 0]].every(([ox, oy]) => !SHOT_BLOCK.has(tileOf(nx + ox, ny + oy - e.alt)))) { e.x = nx; e.y = ny; } } // never over a wall, where shots can't reach it
    if (!echoes) { e.state = "exposed"; e.t = 5; AU.sfx("ocSnap"); pop(e.x, e.y - 56, "EXPOSED", COL.cyan); } }
  else if (e.state === "exposed") { if (e.t <= 0) { e.state = "summon"; e.t = .8; } }
}
function hurtArchivist(e) {
  e.hp--; e.hurt = .3; e.state = "summon"; e.t = 1.4; G.shake = 5; AU.sfx("land", panOf(e.x)); rumble(.8, .6, 250);
  fx(e.x, e.y - 24, 24, [COL.cyan, "#ffffff", COL.magenta], 90, .6); pop(e.x, e.y - 54, e.hp + " LEFT", COL.cyan);
}

/* ---- Act 4 people: Halvorsen Wardens and a crow-masked Wren ---- */
NPC_LOOKS.warden = { coat: "vest", coatCol: "white", lining: "amber", hair: "buzz", hairCol: "black", skin: "s3", eyes: "visor", arm: "chrome", glow: "amber", trail: "glow", gun: "steel", extra: "none" };
NPC_LOOKS.wrenCult = { coat: "jacket", coatCol: "plum", lining: "magenta", hair: "mohawk", hairCol: "green", skin: "s4", eyes: "trophy", arm: "none", glow: "magenta", trail: "glow", gun: "carbon", extra: "scarf" };
function storySprites() {
  [["warden", "warden"], ["wrenc", "wrenCult"]].forEach(([k, look]) => { if (SP[k]) return; const v = previewSprite(NPC_LOOKS[look]); SP[k] = { cv: v.cv, gc: v.gc, G: v.G, w: v.w, h: v.h }; SPF[k] = flipSpr(SP[k]); });
  if (!SP.scarecrow) { SP.scarecrow = sprite(DEFS.scarecrow, { rimL: COL.magenta, rimR: "#6f66b0" }); SPF.scarecrow = flipSpr(SP.scarecrow); }
}
NAMES.warden = "A HALVORSEN WARDEN"; NAMES.wrenc = "WREN";
// Wardens: Halvorsen troopers with a laser sight and a fast round. In crossfire chapters they shoot the Murder too.
function wardenTarget(e) {
  const p = G.p; if (!(G.rules && G.rules.infight)) return p; let best = p, bd = Math.hypot(p.x - e.x, p.y - e.y) * 1.3;
  for (const o of G.en) { if (!o.alive || o === e || o.type === "warden" || BOSSY.has(o.type) || o.type === "echo") continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd && d < 170) { bd = d; best = o; } }
  return best;
}
function updWarden(e, dt) {
  const tg = e.state === "aim" && e.tg && (e.tg === G.p || e.tg.alive) ? e.tg : wardenTarget(e), d = Math.hypot(tg.x - e.x, tg.y - e.y), sees = los(e.x, e.y - BODY, tg.x, tg.y - BODY);
  e.face = tg.x < e.x ? -1 : 1;
  if (e.state === "walk") { if (d > 140 || !sees) walk(e, 46, dt); else if (e.t <= 0) { e.state = "aim"; e.t = .65 * tellK(); e.tg = tg; AU.sfx("glint", panOf(e.x)); } }
  else if (e.state === "aim") { e.la = Math.atan2(tg.y - BODY - (e.y - BODY - 2), tg.x - e.x - e.face * 10); if (e.t <= 0) { shoot(e.x + e.face * 10, e.y - BODY - 2, e.la, 230, "w", { by: "warden" }); AU.sfx("shotE", panOf(e.x)); e.state = "walk"; e.t = rnd(1.4, 2); } }
  if (Math.hypot(G.p.x - e.x, G.p.y - e.y) < 9) playerDie("warden");
}
// Wren, if you left the sleepers in Chapter 5: two hits to kill, or quickhack the implant to free her.
function spawnWrenc() { storySprites(); const ds = doors().sort((a, b) => Math.hypot(b.x - G.p.x, b.y - G.p.y) - Math.hypot(a.x - G.p.x, a.y - G.p.y)); const d = ds[0] || { x: GW / 2, y: 60 };
  const e = spawnEnemy("wrenc", d.x, d.y); Object.assign(e, { hp: 2, state: "walk", t: 1 }); G.banner = { txt: "WREN · HACK THE IMPLANT TO FREE THEM", col: "#9dff4a", life: 3 }; return e; }
function updWrenc(e, dt, d) {
  const p = G.p, ang = Math.atan2(p.y - e.y, p.x - e.x); e.hurt = Math.max(0, (e.hurt || 0) - dt);
  if (e.state === "walk") { walk(e, 66, dt); if (d < 60 && los(e.x, e.y - BODY, p.x, p.y - BODY)) { e.state = "crouch"; e.t = .45 * tellK(); e.la = ang; AU.sfx("crouch", panOf(e.x)); } }
  else if (e.state === "crouch") { e.la = ang; if (e.t <= 0) { e.state = "lunge"; e.t = .3; AU.sfx("lunge", panOf(e.x)); } }
  else if (e.state === "lunge") { if (moveBody(e, Math.cos(e.la) * 280 * dt, Math.sin(e.la) * 280 * dt)) e.t = 0; e.face = Math.cos(e.la) < 0 ? -1 : 1; if (d < 9) playerDie("wrenc"); if (e.t <= 0) { e.state = "rec"; e.t = .8; } }
  else if (e.t <= 0) e.state = "walk";
}
function hurtWrenc(e) { e.hp--; e.hurt = .3; e.state = "rec"; e.t = 1; pop(e.x, e.y - 34, "WREN · 1 MORE HIT KILLS", "#9dff4a"); AU.sfx("bulwark", panOf(e.x)); }
function freeWren(e) { e.alive = false; SAVE.camp.flags.wrenFreed = true; delete SAVE.camp.flags.wrenDead; SAVE.camp.trust.wren = Math.max(SAVE.camp.trust.wren, 0); persist();
  fx(e.x, e.y - 14, 24, ["#9dff4a", "#ffffff", COL.magenta], 80, .7); pop(e.x, e.y - 34, "IMPLANT FRIED · WREN IS FREE", "#9dff4a"); radio("wren", "...{FIRST}? It's quiet. It's actually quiet. I'm sorry. I'm so sorry."); }
function wrenDown() { SAVE.camp.flags.wrenDead = true; persist(); radio("magpie", "That was Wren. ...Keep moving, {FIRST}."); }

/* ---- Hold a zone, and extract to a van ---- */
function placeZone() { const q = guardSpots(1, 0, true)[0]; G.zone = { x: q.x, y: q.y, r: 30, prog: 0 }; }
// Magpie's van: dark purple, magenta stripe, a magpie on the side door.
DEFS.van = { w: 50, h: 28, parts: [
  R("coat", 2, 6, 40, 16), Pl("coat", [[40, 6], [44, 9], [48, 14], [48, 22], [40, 22]]), R("armor", 3, 3, 33, 4), R("chrome", 3, 3, 33, 1),
  Pl("gun", [[40, 8], [44, 10], [46, 14], [40, 14]]), R("gun", 30, 8, 8, 6), R("cyanE", 31, 9, 6, 1), R("cyanE", 41, 10, 2, 1),
  R("magE", 2, 16, 46, 1), R("coatIn", 2, 18, 46, 3), L("armor", 18, 7, 18, 21), L("armor", 29, 7, 29, 21),
  Px("bone", [[22, 10], [23, 10], [24, 11], [21, 11], [22, 12], [25, 12], [23, 13]]), Px("cyanE", [[24, 10]]),
  R("chrome", 44, 20, 5, 2), R("ambE", 47, 15, 2, 3), R("redE", 1, 8, 2, 4),
  E("boot", 11, 23, 4.5, 4.5), E("boot", 38, 23, 4.5, 4.5), E("chrome", 11, 23, 1.6, 1.6), E("chrome", 38, 23, 1.6, 1.6),
] };
// The van pulls up on open ground (room for its body) and drives in from the nearest side of the map.
function placeExit() { buildFlow(); const reach = q => G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0;
  const roomy = q => { const tx = Math.floor(q.x / TS), ty = Math.floor(q.y / TS); for (let j = ty - 1; j <= ty; j++) for (let i = tx - 1; i <= tx + 1; i++) { const ch = G.grid.at(i, j); if (ch === null || WALK_BLOCK.has(ch) || ch === "o") return false; } return q.y > 70; };
  const all = floorSpots(0).filter(reach), far = (a, b) => Math.hypot(b.x - G.p.x, b.y - G.p.y) - Math.hypot(a.x - G.p.x, a.y - G.p.y);
  const q = all.filter(roomy).sort(far)[0] || all.sort(far)[0] || { x: GW / 2, y: GH / 2 };
  if (!SP.van) { SP.van = sprite(DEFS.van, { rimR: COL.magenta, rimL: "#7f74c9" }); SPF.van = flipSpr(SP.van); }
  const fromLeft = q.x < GW / 2; G.exit = { x: q.x, y: q.y, vx: fromLeft ? -60 : GW + 60, face: fromLeft ? 1 : -1, arriveT: 1.4, open: false };
  G.banner = { txt: "MAGPIE'S VAN IS PULLING IN", col: COL.cyan, life: 2 }; AU.sfx("tramRun"); }
function updateVan(dt) {
  const V = G.exit; if (!V || V.open) return; V.arriveT -= dt; const k = Math.max(0, V.arriveT / 1.4), e = k * k; V.dx = V.kind === "lift" ? 0 : (V.vx - V.x) * e;
  if (V.arriveT <= 0) { V.open = true; V.dx = 0; G.banner = V.kind === "lift" ? { txt: "LIFT OPEN · GET IN", col: COL.cyan, life: 2 } : { txt: "THE VAN IS HERE · GET IN", col: COL.cyan, life: 2.2 }; AU.sfx("milestone"); fx(V.x, V.y - 4, 16, ["#9aa4c8", "#2a2440"], 50, .5); }
}

/* ---- SCARECROW: plants drone nests on the walls and calls the flock ---- */
NAMES.scarecrow = "SCARECROW"; FLYING.add("scarecrow"); BOSSY.add("scarecrow");
function spawnScarecrow() { storySprites(); const s2 = bossSpot(); const e = spawnEnemy("scarecrow", s2.x, s2.y); Object.assign(e, { hp: 3, state: "walk", t: 2.2, call: 4 }); return e; }
function plantNest() {
  if (G.en.filter(x => x.alive && x.type === "nest").length >= 3) return;
  const c = []; for (let y = 2; y < MH - 3; y++) for (let x = 2; x < MW - 2; x++) if (G.grid[y][x] === "#" && G.grid[y + 1][x] === "." && Math.hypot(x * TS - G.p.x, y * TS - G.p.y) > 60) c.push([x, y]);
  const pick = c[Math.random() * c.length | 0]; if (!pick) return; const [x, y] = pick; G.grid[y][x] = "N"; G.dirty = true;
  const n = spawnEnemy("nest", x * TS + 9, y * TS + 17); n.tx = x; n.ty = y; n.state = "closed"; n.t = rnd(1.5, 3); fx(x * TS + 8, y * TS + 8, 14, [COL.magenta, "#2a2440"], 60, .5); AU.sfx("nest", panOf(x * TS));
}
function updScarecrow(e, dt, d) {
  const p = G.p; e.face = p.x < e.x ? -1 : 1; e.hurt = Math.max(0, (e.hurt || 0) - dt);
  if (e.state === "walk") { walk(e, 24, dt); e.face = p.x < e.x ? -1 : 1; e.call -= dt; if (d < 14) playerDie("scarecrow");
    if (e.call <= 0) { e.state = "call"; e.t = 2.6; plantNest(); for (let i = 0; i < 3; i++) spawnEnemy("corvid", e.x + rnd(-30, 30), e.y - 30); AU.sfx("caw"); AU.sfx("nest", panOf(e.x)); }
    else if (e.t <= 0) { e.state = "sweep"; e.t = .75 * tellK(); e.la = Math.atan2(p.y - e.y, p.x - e.x); AU.sfx("charge", panOf(e.x)); } }
  else if (e.state === "sweep") { if (e.t <= 0) { for (let k = -4; k <= 4; k++) shoot(e.x, e.y - 22, e.la + k * .15, 100, "e", { by: "scarecrow" }); AU.sfx("shotE", panOf(e.x)); e.state = "walk"; e.t = rnd(1.8, 2.6); } }
  else if (e.state === "call") { if (e.t <= 0) { e.state = "walk"; e.t = 1.5; e.call = rnd(4.5, 6); } }
}
function hurtScarecrow(e) {
  e.hp--; e.hurt = .3; e.state = "walk"; e.t = 1.2; e.call = 3; G.shake = 5; AU.sfx("land", panOf(e.x)); rumble(.8, .6, 250);
  fx(e.x, e.y - 24, 24, [COL.magenta, "#ffffff", "#c08d1a"], 90, .6); pop(e.x, e.y - 54, e.hp + " LEFT", COL.magenta); plantNest();
}

/* ---- DIRECTOR VANE in a Halvorsen exo-frame ---- */
DEFS.vanexo = { w: 48, h: 48, dither: 1, parts: [
  R("chrome", 12, 32, 7, 12), R("chrome", 29, 32, 7, 12), R("boot", 10, 43, 10, 5), R("boot", 28, 43, 10, 5),
  Pl("bone", [[12, 14], [36, 14], [38, 33], [10, 33]]), R("ambE", 20, 20, 8, 3), R("chrome", 14, 28, 20, 3),
  S_(Pl("bone", [[4, 12], [13, 12], [13, 24], [4, 24]])), S_(Pl("bone", [[35, 12], [44, 12], [44, 24], [35, 24]])), R("gun", 2, 9, 9, 5), R("gun", 37, 9, 9, 5), Px("ambE", [[3, 11], [45, 11]]),
  E("skin", 24, 9, 5, 5), Pl("hair", [[18, 8], [20, 3], [24, 2], [28, 3], [30, 8], [29, 6], [19, 6]]), R("ambE", 20, 9, 8, 1),
] };
NAMES.vanexo = "DIRECTOR VANE"; FLYING.add("vanexo"); BOSSY.add("vanexo");
function spawnVane() { storySprites(); const s2 = bossSpot(); const e = spawnEnemy("vanexo", s2.x, s2.y); Object.assign(e, { hp: 3, state: "walk", t: 2, gun: 1.2 }); return e; }
function updVane(e, dt, d) {
  const p = G.p; e.hurt = Math.max(0, (e.hurt || 0) - dt); if (e.state !== "charge") e.face = p.x < e.x ? -1 : 1;
  if (e.state === "walk") { walk(e, 32, dt); e.gun -= dt; if (d < 16) playerDie("vanexo");
    if (e.gun <= 0) { for (const sx of [-14, 14]) for (let k = 0; k < 2; k++) shoot(e.x + sx, e.y - 36, -Math.PI / 2 + sx * .03 + rnd(-.4, .4), 70, "e", { by: "vanexo", seek: 1.6, life: 4 }); AU.sfx("rail", panOf(e.x)); e.gun = 2.8; }
    if (e.t <= 0) { e.state = "aim"; e.t = .9 * tellK(); AU.sfx("charge", panOf(e.x)); } }
  else if (e.state === "aim") { if (e.t > .3) e.la = Math.atan2(p.y - e.y, p.x - e.x); if (e.t <= 0) { e.state = "charge"; e.t = .7; e.face = Math.cos(e.la) < 0 ? -1 : 1; AU.sfx("dash"); } }
  else if (e.state === "charge") { const hitWall = moveBody(e, Math.cos(e.la) * 340 * dt, Math.sin(e.la) * 340 * dt); G.parts.push({ x: e.x, y: e.y - rnd(4, 30), vx: -Math.cos(e.la) * 80, vy: 0, life: .2, max: .2, col: COL.amber, g: 0 });
    if (d < 18) playerDie("vanexo"); if (hitWall || e.t <= 0) { e.state = "overheat"; e.t = 2.4; G.shake = hitWall ? 6 : 3; AU.sfx("land", panOf(e.x)); } }
  else if (e.state === "overheat") { if (Math.random() < .4) G.parts.push({ x: e.x + rnd(-10, 10), y: e.y - 30, vx: rnd(-10, 10), vy: -50, life: .5, max: .5, col: "#d8d4ee", g: 0 }); if (e.t <= 0) { e.state = "walk"; e.t = rnd(2.4, 3.4); e.gun = .8; } }
}
function hurtVane(e) {
  e.hp--; e.hurt = .3; e.state = "walk"; e.t = 1.6; e.gun = 1; G.shake = 5; AU.sfx("land", panOf(e.x)); rumble(.8, .6, 250);
  fx(e.x, e.y - 24, 24, [COL.amber, "#ffffff", "#d8d4ee"], 90, .6); pop(e.x, e.y - 54, e.hp + " LEFT", COL.amber);
  doors().filter(dd => Math.hypot(dd.x - G.p.x, dd.y - G.p.y) > 90).slice(0, 2).forEach(dd => { G.pending.push({ type: "warden", x: dd.x, y: dd.y, t: .9, door: dd }); AU.sfx("door", panOf(dd.x)); });
}

/* ---- Objective props: terminals, racks, the cargo trolley, Magpie's stall and datashards ---- */
DEFS.t_floodgate = { w: 18, h: 24, parts: [ R("rust", 0, 19, 18, 3), R("chrome", 0, 19, 18, 1), R("rust", 3, 9, 12, 12), R("armor", 4, 10, 10, 4),
  E("chrome", 9, 6, 6, 5.5), E("rust", 9, 6, 3.5, 3), Px("chrome", [[9, 1], [9, 11], [4, 6], [14, 6], [6, 3], [12, 3], [6, 9], [12, 9]]), E("gun", 9, 6, 1.5, 1.5), R("gun", 5, 15, 8, 4) ] };
DEFS.t_beacon = { w: 18, h: 26, parts: [ R("armor", 3, 20, 12, 5), R("chrome", 3, 20, 12, 1), R("armor", 8, 5, 3, 16), L("chrome", 9, 8, 4, 20), L("chrome", 9, 8, 14, 20),
  Pl("chrome", [[2, 7], [9, 2], [16, 7], [9, 9]]), Pl("gun", [[5, 6], [9, 4], [13, 6], [9, 8]]), E("redE", 9, 1.5, 1.5, 1.5), R("gun", 5, 22, 8, 2) ] };
DEFS.t_relay = { w: 18, h: 26, parts: [ R("armor", 2, 21, 14, 4), R("chrome", 2, 21, 14, 1), R("armor", 7, 8, 4, 14), Pl("chrome", [[1, 2], [7, 8], [6, 11], [0, 5]]), Pl("chrome", [[17, 2], [11, 8], [12, 11], [18, 5]]),
  Px("chrome", [[8, 11], [10, 11], [8, 14], [10, 14], [8, 17], [10, 17]]), R("gun", 5, 23, 8, 1) ] };
DEFS.t_furnace = { w: 24, h: 26, parts: [ R("rust", 16, 0, 5, 8), R("gun", 16, 0, 5, 1), R("rust", 1, 6, 22, 19), R("rust", 1, 6, 22, 2), R("armor", 4, 10, 16, 11), R("ambE", 6, 16, 12, 4),
  R("gun", 5, 12, 14, 1), R("gun", 5, 15, 14, 1), R("gun", 5, 18, 14, 1), R("hazard", 1, 23, 22, 2), Px("gun", [[3, 23], [7, 24], [11, 23], [15, 24], [19, 23]]) ] };
DEFS.t_node = { w: 20, h: 22, parts: [ Pl("armor", [[1, 8], [19, 8], [19, 21], [1, 21]]), Pl("chrome", [[3, 2], [17, 2], [19, 8], [1, 8]]), R("gun", 4, 3, 12, 4),
  Px("chrome", [[4, 11], [7, 11], [10, 11], [13, 11], [16, 11], [5, 14], [8, 14], [11, 14], [14, 14]]), R("gun", 3, 18, 14, 2) ] };
DEFS.rack = { w: 20, h: 30, parts: [ R("gun", 1, 0, 18, 28), R("armor", 1, 0, 18, 2), R("chrome", 1, 0, 18, 1), L("armor", 1, 0, 1, 27), L("armor", 18, 0, 18, 27),
  ...[0, 1, 2, 3, 4, 5].map(i => R("armor", 3, 4 + i * 4, 14, 3)), ...[0, 1, 2, 3, 4, 5].map(i => R("chrome", 12, 5 + i * 4, 4, 1)), R("chrome", 2, 28, 3, 2), R("chrome", 15, 28, 3, 2) ] };
DEFS.trolley = { w: 36, h: 8, parts: [ R("hazard", 1, 1, 34, 3), Px("gun", [[3, 1], [7, 2], [11, 1], [15, 2], [19, 1], [23, 2], [27, 1], [31, 2]]), R("armor", 1, 4, 34, 1),
  E("boot", 6, 6, 2.5, 2.5), E("boot", 30, 6, 2.5, 2.5), E("chrome", 6, 6, .8, .8), E("chrome", 30, 6, .8, .8), R("chrome", 17, 0, 2, 1) ] };
DEFS.stall = { w: 40, h: 38, parts: [
  R("chrome", 3, 6, 1, 26), R("chrome", 36, 6, 1, 26),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => Pl(i % 2 ? "coat" : "magE", [[i * 4, 2], [i * 4 + 4, 2], [i * 4 + 4, 8], [i * 4 + 2, 10], [i * 4, 8]])),
  R("armor", 0, 0, 40, 2), R("chrome", 0, 0, 40, 1),
  R("rust", 4, 19, 6, 5), R("chrome", 11, 17, 7, 7), R("hazard", 19, 20, 5, 4), R("armor", 25, 18, 7, 6), R("gun", 12, 19, 5, 2), Px("cyanE", [[27, 20], [29, 20]]),
  R("coat", 2, 24, 36, 12), R("coatIn", 2, 24, 36, 2), R("armor", 2, 34, 36, 2), Px("magE", [[6, 29], [10, 29], [14, 29], [18, 29], [22, 29], [26, 29], [30, 29], [34, 29]]) ] };
DEFS.shard = { w: 9, h: 15, parts: [ Pl("magE", [[4, 0], [8, 6], [6, 11], [4, 14], [2, 11], [0, 6]]), L("bone", 4, 1, 4, 14), Px("cyanE", [[4, 3], [4, 6]]) ] };
const TERMINAL = { FLOODGATE: "t_floodgate", BEACON: "t_beacon", RELAY: "t_relay", FURNACE: "t_furnace", NODE: "t_node" };
function propSprites() { ["t_floodgate", "t_beacon", "t_relay", "t_furnace", "t_node", "rack", "trolley", "stall", "shard"].forEach(k => { if (!SP[k]) SP[k] = sprite(DEFS[k], { rimR: COL.cyan, rimL: "#7f74c9" }); }); }

/* ---- Act 5: climbing Spire Zero floor by floor ---- */
DEFS.lift = { w: 34, h: 40, parts: [ R("armor", 0, 0, 34, 40), R("chrome", 0, 0, 34, 2), R("chrome", 0, 0, 2, 40), R("chrome", 32, 0, 2, 40), R("gun", 4, 8, 26, 32),
  R("chrome", 4, 8, 12, 32), R("chrome", 18, 8, 12, 32), L("armor", 17, 8, 17, 39), Pl("cyanE", [[13, 2], [17, 5], [21, 2], [21, 4], [17, 7], [13, 4]]), Px("cyanE", [[6, 24], [27, 24]]) ] };
function placeLift() {
  buildFlow(); const reach = q => G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0;
  const roomy = q => { const tx = Math.floor(q.x / TS), ty = Math.floor(q.y / TS); for (let j = ty - 1; j <= ty; j++) for (let i = tx - 1; i <= tx + 1; i++) { const ch = G.grid.at(i, j); if (ch === null || WALK_BLOCK.has(ch) || ch === "o") return false; } return q.y > 80; };
  const all = floorSpots(0).filter(reach), far = (a, b) => Math.hypot(b.x - G.p.x, b.y - G.p.y) - Math.hypot(a.x - G.p.x, a.y - G.p.y), q = all.filter(roomy).sort(far)[0] || all.sort(far)[0];
  if (!SP.lift) SP.lift = sprite(DEFS.lift, { rimR: COL.cyan, rimL: "#7f74c9" });
  G.exit = { x: q.x, y: q.y, kind: "lift", face: 1, vx: q.x, arriveT: 1, open: false }; G.banner = { txt: "THE LIFT IS COMING DOWN", col: COL.cyan, life: 2 }; AU.sfx("bell");
}
function nextFloor() {
  const C = G.camp, g = G.rules.goal; C.floor++; G.exit = null; G.chapMap = Object.assign({}, G.chapMap, { seed: G.chapMap.seed + 37 * C.floor });
  RUN.enter(C.ch.district); G.heatBase = G.rules.heatBase || 0; G.heat = G.heatBase; buildFlow(); G.flood = null; G.vents = null;
  (G.allies || []).forEach((a, i) => { a.x = G.p.x + (i ? 16 : -16); a.y = G.p.y + 8; });
  G.banner = { txt: `FLOOR ${C.floor}/${g.floors}` + (C.floor === g.floors ? " · THE TOP" : ""), col: COL.cyan, life: 2.4 }; AU.sfx("milestone"); fx(G.p.x, G.p.y - 12, 24, [COL.cyan, "#ffffff"], 80, .6);
}

/* ---- Allies: Stacks fighters on the Spire, Dex's ghost in the Nest. They can't be hurt, and their rounds only hit the Murder. ---- */
NPC_LOOKS.stacker = { coat: "jacket", coatCol: "olive", lining: "amber", hair: "long", hairCol: "red", skin: "s5", eyes: "goggles", arm: "chrome", glow: "amber", trail: "glow", gun: "steel", extra: "scarf" };
function allySprite(k) {
  if (SP[k]) return SP[k];
  if (k === "echoally") { echoSprites(); SP.echoally = SP.echo; SPF.echoally = SPF.echo; return SP.echoally; }
  if (k === "stacker") { const v = previewSprite(NPC_LOOKS.stacker); SP.stacker = v; SPF.stacker = flipSpr(v); }
  else { const v = previewSprite(NPC_LOOKS.dex), t2 = mk(v.w, v.h), x = t2.getContext("2d"); x.globalAlpha = .8; x.drawImage(v.cv, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-atop"; x.fillStyle = "rgba(201,182,255,.5)"; x.fillRect(0, 0, v.w, v.h);
    SP.dexghost = { cv: t2, gc: v.gc, G: v.G, w: v.w, h: v.h }; SPF.dexghost = flipSpr(SP.dexghost); }
  return SP[k];
}
function spawnAllies(kind, n) { G.allies = Array.from({ length: n }, (_, i) => { allySprite(kind); return { kind, x: G.p.x + (i ? 16 : -16), y: G.p.y + 8, face: 1, gun: rnd(.5, 1.2), r: 4, slot: i }; }); }
// Echo Shell (Act 3 reward): a copy of you that walks behind you and shoots, in the story and in Arcade.
function placeEchoAlly() { G.echoAlly = null; if (!hasImp("echo")) return; allySprite("echoally"); G.echoAlly = { kind: "echoally", x: G.p.x - 14, y: G.p.y + 12, face: 1, gun: 1, r: 4, slot: 2 }; }
const allyList = () => (G.allies || []).concat(G.echoAlly ? [G.echoAlly] : []);
function updateAllies(dt) {
  for (const a of allyList()) {
    const p = G.p, off = (a.slot ? 1 : -1) * 22, tx = a.slot === 2 ? p.x - p.face * 16 : p.x + off, ty = p.y + (a.slot === 2 ? 14 : 10), d = Math.hypot(tx - a.x, ty - a.y);
    if (d > 10) { const sp = Math.min(130, d * 3); moveBody(a, (tx - a.x) / d * sp * dt, (ty - a.y) / d * sp * dt); if (d > 90) { a.x = tx; a.y = ty; } }
    a.gun -= dt; a.moving = d > 10;
    let best = null, bd = 175; for (const e of G.en) { if (!e.alive || armored(e) || e.type === "holo") continue; const dd = Math.hypot(e.x - a.x, e.y - a.y); if (dd < bd && los(a.x, a.y - BODY, e.x, e.y - BODY - (e.alt || 0), 1e9)) { bd = dd; best = e; } }
    if (best) a.face = best.x < a.x ? -1 : 1; else a.face = p.face;
    if (best && a.gun <= 0) { const gx = a.x + a.face * 10, gy = a.y - BODY - 2; shoot(gx, gy, Math.atan2(best.y - BODY - (best.alt || 0) - gy, best.x - gx) + rnd(-.05, .05), 320, "a"); AU.sfx("kestrel", panOf(a.x)); a.gun = a.kind === "dexghost" ? .55 : a.kind === "echoally" ? rnd(.8, 1.1) : rnd(.9, 1.3); }
  }
}
function drawAllies(c, t) {
  if (G.echoAlly) { const a = G.echoAlly, s2 = a.face < 0 ? SPF.echoally : SP.echoally; if (s2) { c.save(); c.globalAlpha = .85; drawSpr(c, s2, a.x - s2.w / 2, a.y - s2.h + 2 - (a.moving && Math.floor(t / 110) % 2 ? 1 : 0)); c.restore(); } }
  for (const a of G.allies || []) { const s2 = a.face < 0 ? SPF[a.kind] : SP[a.kind]; if (!s2) continue; shadowUnder(c, a.x - s2.w / 2, a.y - s2.h + 2, s2);
    drawSpr(c, s2, a.x - s2.w / 2, a.y - s2.h + 2 - (a.moving && Math.floor(t / 110) % 2 ? 1 : 0)); if (!a.slot) txt(c, a.kind === "dexghost" ? "DEX" : "STACKS", a.kind === "dexghost" || (G.allies.length < 2) ? a.x : (a.x + G.allies[1].x) / 2, a.y - s2.h - 8, rgba(a.kind === "dexghost" ? "#c9b6ff" : COL.amber, .75), 8, "center"); }
}

/* ---- The Nest: the floor rewrites itself ---- */
function rewriteStage() {
  if (!G.rw) G.rw = { live: [] }; if (G.rw.pending) return;
  const ok = (x, y) => safeForVent(x * TS + 8, y * TS + 8) && !(G.zone && Math.hypot(x * TS + 8 - G.zone.x, y * TS + 8 - G.zone.y) < 40);
  let pick = []; for (let k = 0; k < 4; k++) { const sp = floorSpots(50); const s2 = sp[Math.random() * sp.length | 0]; if (s2) pick = pick.concat(ventCluster(Math.floor(s2.x / TS), Math.floor(s2.y / TS), 7).filter(([x, y]) => ok(x, y))); }
  const old = G.rw.live; old.forEach(([x, y]) => { if (G.grid[y][x] === "o") G.grid[y][x] = "."; }); const fine = stillReachable(pick); old.forEach(([x, y]) => G.grid[y][x] = "o");
  if (!fine || !pick.length) return; G.rw.pending = { t: 1.6, tiles: pick }; AU.sfx("hexer");
}
function updateRewrite(dt) {
  const W = G.rw; if (!W || !W.pending) return; W.pending.t -= dt; if (W.pending.t > 0) return;
  W.live.forEach(([x, y]) => { if (G.grid[y][x] === "o") G.grid[y][x] = "."; });
  W.live = W.pending.tiles.filter(([x, y]) => Math.hypot(x * TS + 8 - G.p.x, y * TS + 8 - G.p.y) > 12 && G.grid[y][x] === "."); W.live.forEach(([x, y]) => G.grid[y][x] = "o");
  W.pending = null; G.dirty = true; G.gapTiles = gapTiles(); buildFlow(); G.shake = Math.max(G.shake, 2); AU.sfx("ocSnap");
}

/* ---- THE CHOIR: three singers. Drop all three before any gets back up. ---- */
DEFS.choir = { w: 24, h: 34, parts: [ Pl("robe", [[7, 10], [17, 10], [22, 33], [12, 31], [2, 33]]), L("magE", 12, 12, 12, 30), Pl("robe", [[6, 2], [12, 0], [18, 2], [18, 12], [6, 12]]),
  E("bone", 12, 7, 3.5, 4), Px("redE", [[10, 6], [14, 6]]), R("magE", 11, 9, 3, 1), S_(Pl("robe", [[7, 11], [3, 20], [5, 21], [9, 14]])), S_(Pl("robe", [[17, 11], [21, 20], [19, 21], [15, 14]])) ] };
NAMES.choir = "THE CHOIR"; BOSSY.add("choir");
function spawnChoir() {
  if (!SP.choir) { SP.choir = sprite(DEFS.choir, { rimL: COL.magenta, rimR: "#6f66b0" }); SPF.choir = flipSpr(SP.choir); }
  G.choirRounds = 2; const spots = floorSpots(80).sort(() => Math.random() - .5), out = [];
  for (const q of spots) { if (out.every(o => Math.hypot(o.x - q.x, o.y - q.y) > 110)) out.push(q); if (out.length === 3) break; }
  return out.map((q, i) => { const e = spawnEnemy("choir", q.x, q.y); Object.assign(e, { hp: 2, state: "sing", gun: .8 + i * .4, spin: i * 2 }); return e; })[0];
}
function updChoir(e, dt, d) {
  const p = G.p, fast = G.choirRounds === 1; e.face = p.x < e.x ? -1 : 1;
  if (e.state === "down") { if (e.t <= 0) { e.state = "sing"; e.gun = 1; fx(e.x, e.y - 16, 18, [COL.magenta, "#ffffff"], 70, .6); choirPop(e, "BACK UP", COL.magenta); AU.sfx("hexer", panOf(e.x)); } return; }
  if (d > 90) walk(e, 22, dt); else if (d < 60) moveBody(e, -(p.x - e.x) / d * 30 * dt, -(p.y - e.y) / d * 30 * dt);
  e.gun -= dt; if (e.gun <= 0) { for (let k = 0; k < 5; k++) shoot(e.x, e.y - 20, e.spin + k / 5 * TAU, fast ? 85 : 70, "e", { by: "choir" }); e.spin += .45; e.gun = fast ? .7 : 1.05; }
}
// One status label per singer: a new one replaces the old so DOWN and BACK UP never stack.
function choirPop(e, t, col) { for (let i = G.texts.length - 1; i >= 0; i--) { const q = G.texts[i]; if (Math.abs(q.x - e.x) < 14 && Math.abs(q.y - (e.y - 40)) < 24) G.texts.splice(i, 1); } pop(e.x, e.y - 40, t, col); }
function hurtChoir(e) {
  if (e.state === "down") return; const fast = G.choirRounds === 1; e.state = "down"; e.t = fast ? 3 : 3.6; fx(e.x, e.y - 16, 20, [COL.magenta, "#2a2440", "#ffffff"], 80, .6); choirPop(e, "DOWN", COL.cyan); AU.sfx("kill", panOf(e.x));
  const all = G.en.filter(x => x.alive && x.type === "choir"); if (!all.every(x => x.state === "down")) return;
  G.choirRounds--; G.shake = 6; rumble(1, .8, 300);
  if (G.choirRounds <= 0) { all.forEach(x => { x.hp = 1; }); all.forEach(x => killEnemy(x, "shot")); return; }
  G.banner = { txt: "THE CHOIR RISES AGAIN · FASTER", col: COL.magenta, life: 2.4 }; radio("corvus", "SING, CHILDREN. SING LOUDER.");
  all.forEach(x => { x.t = 1.6; });
}

/* ---- MOTHER CORVINA: three phases, then the choice ---- */
DEFS.corvina = { w: 48, h: 48, dither: 1, parts: [
  Pl("wing", [[22, 14], [6, 4], [0, 16], [4, 30], [12, 26], [20, 30]]), Pl("wing", [[26, 14], [42, 4], [48, 16], [44, 30], [36, 26], [28, 30]]),
  Px("redE", [[4, 10], [8, 8], [2, 20], [7, 24], [44, 10], [40, 8], [46, 20], [41, 24]]),
  Pl("shield", [[17, 14], [31, 14], [38, 46], [24, 43], [10, 46]]), L("redE", 24, 18, 24, 42), R("chrome", 14, 40, 3, 8), R("chrome", 31, 40, 3, 8), R("chrome", 22, 42, 4, 6),
  E("bone", 24, 9, 5, 6), Pl("hair", [[18, 6], [21, 1], [24, 0], [27, 1], [30, 6], [29, 14], [27, 8], [21, 8], [19, 14]]), Px("redE", [[22, 9], [26, 9]]),
  Px("redE", [[16, 1], [20, -1], [24, -2], [28, -1], [32, 1]]) ] };
NAMES.corvina = "MOTHER CORVINA"; FLYING.add("corvina"); BOSSY.add("corvina");
function spawnCorvina() { const s2 = bossSpot(); const e = spawnEnemy("corvina", s2.x, s2.y); Object.assign(e, { hp: 3, state: "sing", t: 3, gun: 1, feather: 2, adds: 5, spin: 0 }); return e; }
const corvinaPhase = e => 4 - e.hp;
function updCorvina(e, dt, d) {
  const p = G.p, ph = corvinaPhase(e); e.face = p.x < e.x ? -1 : 1; e.alt = 4 + Math.sin((e.anim || 0) * 2) * 2; e.hurt = Math.max(0, (e.hurt || 0) - dt);
  if (e.state === "sing") {
    if (ph < 3) walk(e, 18, dt);
    e.gun -= dt; if (e.gun <= 0) { if (ph < 3) { const off = Math.random() * TAU; for (let k = 0; k < 14; k++) if (k % 7 !== 0) shoot(e.x, e.y - 24, off + k / 14 * TAU, 70, "e", { by: "corvina" }); e.gun = 1.7; }
      else { for (let k = 0; k < 2; k++) shoot(e.x, e.y - 24, e.spin + k * Math.PI, 80, "e", { by: "corvina" }); e.spin += .33; e.gun = .16; } AU.sfx("shotE", panOf(e.x)); }
    if (ph >= 2) { e.feather -= dt; if (e.feather <= 0) { for (let k = 0; k < 4; k++) shoot(e.x, e.y - 30, -Math.PI / 2 + (k - 1.5) * .5, 60, "e", { by: "corvina", seek: 1.3, life: 4 }); e.feather = 2.6; AU.sfx("rail", panOf(e.x)); } }
    e.adds -= dt; if (e.adds <= 0) { for (let k = 0; k < 2; k++) spawnEnemy("corvid", e.x + rnd(-40, 40), e.y - 40); e.adds = 7; AU.sfx("caw"); }
    if (e.t <= 0) { e.state = "scream"; e.t = .9; AU.sfx("charge", panOf(e.x)); } }
  else if (e.state === "scream") { if (e.t <= 0) { for (let k = 0; k < 24; k++) shoot(e.x, e.y - 24, k / 24 * TAU, 95, "e", { by: "corvina" }); G.shake = 5; AU.sfx("caw");
      if (ph === 3) { const q = floorSpots(90).sort(() => Math.random() - .5)[0]; if (q) { fx(e.x, e.y - 20, 20, [COL.red, "#2a2440"], 80, .5); e.x = q.x; e.y = q.y; } }
      e.state = "exposed"; e.t = 2.4; } }
  else if (e.state === "exposed") { if (e.t <= 0) { e.state = "sing"; e.t = rnd(4, 5.5) - ph * .5; } }
}
function hurtCorvina(e) {
  e.hp--; e.hurt = .3; e.state = "sing"; e.t = 3; G.shake = 7; AU.sfx("land", panOf(e.x)); rumble(1, .8, 350); fx(e.x, e.y - 24, 30, [COL.red, "#ffffff", "#2a2440"], 100, .7); pop(e.x, e.y - 56, e.hp + " LEFT", COL.red);
  const ph = corvinaPhase(e);
  if (ph === 2) { G.banner = { txt: "PHASE 2 · THE FLOOR IS REWRITING", col: COL.red, life: 2.4 }; G.rules = Object.assign({}, G.rules, { rewrite: 7 }); G.rwT = 1; radio("corvus", "WE WILL REWRITE THE GROUND UNDER YOU."); }
  if (ph === 3) { G.banner = { txt: "PHASE 3 · CORVUS TAKES THE WHEEL", col: COL.red, life: 2.4 }; radio("corvus", "SHE IS TIRED. WE ARE NOT."); }
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
// Guarded objects: Magpie's stall (one), server racks (several) or a cargo crane that moves along a path.
// Tiles on the shortest walks from each spawn door to the middle of the map: where enemy traffic runs.
function tilePath(sx, sy, ex, ey) {
  const W = MW, prev = new Int32Array(W * MH).fill(-1), q = [sx, sy], ok = (x, y) => { const ch = G.grid.at(x, y); return ch !== null && !WALK_BLOCK.has(ch) && ch !== "o"; };
  prev[sy * W + sx] = sy * W + sx;
  for (let h = 0; h < q.length; h += 2) { const x = q[h], y = q[h + 1]; if (x === ex && y === ey) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (ok(nx, ny) && prev[ny * W + nx] < 0) { prev[ny * W + nx] = y * W + x; q.push(nx, ny); } } }
  const out = []; let k = ey * W + ex; if (prev[k] < 0) return out; while (k !== sy * W + sx) { out.push([k % W, Math.floor(k / W)]); k = prev[k]; } return out;
}
function trafficTiles() {
  const busy = new Set(), cx = Math.floor(GW / 2 / TS), cy = Math.floor(GH / 2 / TS), mid = floorSpots(0).sort((a, b) => Math.hypot(a.x - GW / 2, a.y - GH / 2) - Math.hypot(b.x - GW / 2, b.y - GH / 2))[0];
  const mx = mid ? Math.floor(mid.x / TS) : cx, my = mid ? Math.floor(mid.y / TS) : cy;
  doors().forEach(d => tilePath(Math.floor(d.x / TS), Math.floor(d.y / TS), mx, my).forEach(([x, y]) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) busy.add((x + i) + "," + (y + j)); }));
  return busy;
}
function guardSpots(n, minGap, avoidTraffic) {
  const busy = avoidTraffic ? trafficTiles() : null, quiet = q => !busy || !busy.has(Math.floor(q.x / TS) + "," + Math.floor(q.y / TS));
  const ok = s2 => { const tx = Math.floor(s2.x / TS), ty = Math.floor(s2.y / TS); for (let j = ty - 1; j <= ty; j++) for (let i = tx - 1; i <= tx + 1; i++) { const ch = G.grid.at(i, j); if (ch === null || WALK_BLOCK.has(ch) || ch === "o") return false; } return true; };
  const S = floorSpots(50).filter(ok).filter(q => q.y > 92 && doors().every(d => Math.hypot(d.x - q.x, d.y - q.y) > 72)).sort((a, b) => Math.hypot(a.x - GW / 2, a.y - GH / 2 - 10) - Math.hypot(b.x - GW / 2, b.y - GH / 2 - 10)), out = [];
  for (const q of S) { if (quiet(q) && out.every(o => Math.hypot(o.x - q.x, o.y - q.y) > minGap)) out.push(q); if (out.length === n) break; }
  for (const q of S) { if (out.length >= n) break; if (out.every(o => Math.hypot(o.x - q.x, o.y - q.y) > minGap)) out.push(q); } // fall back to busy spots if the map is tight
  return out.length ? out : [{ x: GW / 2, y: GH / 2 }];
}
// The cargo crane's route: the longest walkable path from the west side of the yard to the east side.
function cargoPath() {
  buildFlow(); const reach = q => G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0, all = floorSpots(0).filter(reach), low = all.filter(q => q.y > 84), sp = low.length > 20 ? low : all;
  const a = sp.reduce((m, q) => q.x < m.x ? q : m, sp[0]), b = sp.reduce((m, q) => q.x > m.x ? q : m, sp[0]);
  const W = MW, prev = new Int32Array(W * MH).fill(-1), q = [], sx = Math.floor(a.x / TS), sy = Math.floor(a.y / TS), ex = Math.floor(b.x / TS), ey = Math.floor(b.y / TS);
  const ok = (x, y) => { const ch = G.grid.at(x, y); return ch !== null && !WALK_BLOCK.has(ch) && ch !== "o"; };
  prev[sy * W + sx] = sy * W + sx; q.push(sx, sy);
  for (let h = 0; h < q.length; h += 2) { const x = q[h], y = q[h + 1]; if (x === ex && y === ey) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (ok(nx, ny) && prev[ny * W + nx] < 0) { prev[ny * W + nx] = y * W + x; q.push(nx, ny); } } }
  const path = []; let k = ey * W + ex; if (prev[k] < 0) return [a, b];
  while (k !== sy * W + sx) { path.unshift({ x: (k % W) * TS + 8, y: Math.floor(k / W) * TS + 12 }); k = prev[k]; }
  path.unshift({ x: a.x, y: a.y }); return path;
}
function placeStalls() {
  const g = G.rules.goal, kind = g.type === "escort" ? "cargo" : g.kind || "stall", n = g.n || 1;
  if (kind === "cargo") { const path = cargoPath(); G.stalls = [{ kind, x: path[0].x, y: path[0].y, path, idx: 0, hp: g.hp, max: g.hp, hurtT: 0, prog: 0 }]; return; }
  G.stalls = guardSpots(n, 90, kind === "rack").map((q, i) => ({ kind, id: i + 1, x: q.x, y: q.y, hp: g.hp, max: g.hp, hurtT: 0, alarmT: 0 }));
  if (kind === "rack") G.rackFlow = G.stalls.map(S => fieldTo(Math.floor(S.x / TS), Math.floor(S.y / TS)));
}
const STALL_FAIL = { stall: "STALL DESTROYED", cargo: "CARGO DESTROYED", rack: "TWO RACKS WENT DARK" };
// Racks take reduced damage, and the chapter only fails once more racks go dark than the goal allows (1 by default for racks).
function hurtStall(S, n) {
  if (!S || S.dead || G.camp.won) return; S.hp = Math.max(0, S.hp - n); S.hurtT = .25; S.alarmT = 2;
  if (S.kind === "rack" && n >= 1 && (G.camp.callT || 0) <= 0) { G.camp.callT = 7; radio("magpie", S.hp / S.max < .4 ? `Rack ${S.id} is failing! Get over there and reboot it!` : `Rack ${S.id}'s getting hit!`); AU.sfx("hackFail"); } fx(S.x + rnd(-12, 12), S.y - 12, 5, [COL.magenta, "#c08d1a", "#ffffff"], 50, .4); AU.sfx("crate", panOf(S.x));
  if (S.hp > 0) return; S.dead = true; const lost = G.stalls.filter(q => q.dead).length, allow = G.rules.goal.lose || 0;
  if (lost > allow) campFail(STALL_FAIL[S.kind]); else { G.banner = { txt: `A RACK WENT DARK · ${G.stalls.length - lost} LEFT · LOSE ONE MORE AND IT'S OVER`, col: COL.red, life: 2.6 }; AU.sfx("hackFail"); fx(S.x, S.y - 14, 20, ["#2be4ff", "#2a2640"], 60, .7); }
}
const stallHit = b => (G.stalls || []).find(S => !S.dead && Math.abs(b.x - S.x) < 15 && b.y > S.y - 26 && b.y < S.y + 1);
function blastStalls(x, y, r) { (G.stalls || []).forEach(S => { if (Math.hypot(S.x - x, S.y - 8 - y) < r + 10) hurtStall(S, S.kind === "rack" ? 10 : 20); }); }
// Damage per stray enemy bullet.
const stallShot = S => S.kind === "rack" ? 3 : 8;

/* ---- Racks: Carrions that hunt them, and rebooting them ---- */
// A walking field towards one rack, like the one enemies use to chase you.
function fieldTo(tx, ty) {
  const W = MW, dist = new Int16Array(W * MH).fill(-1), q = [tx, ty], ok = (x, y) => { const ch = G.grid.at(x, y); return ch !== null && !WALK_BLOCK.has(ch) && ch !== "o"; };
  dist[ty * W + tx] = 0;
  for (let h = 0; h < q.length; h += 2) { const x = q[h], y = q[h + 1], d = dist[y * W + x]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (ok(nx, ny) && dist[ny * W + nx] < 0) { dist[ny * W + nx] = d + 1; q.push(nx, ny); } } }
  return dist;
}
function stepAlong(F, e, sp, dt) {
  const tx = Math.floor(e.x / TS), ty = Math.floor(e.y / TS), cur = F[ty * MW + tx]; let best = null, bd = cur < 0 ? 9999 : cur;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const nx = tx + dx, ny = ty + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const d = F[ny * MW + nx]; if (d < 0) continue;
    if (dx && dy && (F[ty * MW + nx] < 0 || F[ny * MW + tx] < 0)) continue; if (d < bd) { bd = d; best = [nx, ny]; } }
  if (!best) return; const gx = best[0] * TS + 8 - e.x, gy = best[1] * TS + 8 - e.y, l = Math.hypot(gx, gy) || 1; moveBody(e, gx / l * sp * dt, gy / l * sp * dt); if (gx) e.face = gx < 0 ? -1 : 1;
}
// Called from the Carrion's walk: hunters head for their rack and arm when they reach it.
function huntStep(e, dt) {
  const S = e.hunt; if (!S || S.dead) { e.hunt = null; return false; }
  stepAlong(G.rackFlow && S.kind === "rack" ? G.rackFlow[S.id - 1] : fieldFor(S.x, S.y), e, 62, dt);
  if (Math.hypot(e.x - S.x, e.y - S.y) < 22) { e.state = "armed"; e.t = 1.2 * tellK(); e.beep = 0; }
  return true;
}
// A hunter that blows up at its target does extra damage on top of the blast.
function hunterBlast(e) { if (e.hunt && !e.hunt.dead && Math.hypot(e.x - e.hunt.x, e.y - e.hunt.y) < 30) hurtStall(e.hunt, e.hunt.kind === "rack" ? 18 : 6); }

/* ---- Raiders: enemies that go for the chapter's objective instead of only chasing you ---- */
// Walking fields to objective points, cached per tile (the cargo moves, so its field is rebuilt when it changes tile).
function fieldFor(x, y) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS), k = tx + "," + ty, M = G.raidFields || (G.raidFields = new Map()); if (!M.has(k)) { if (M.size > 40) M.clear(); M.set(k, fieldTo(tx, ty)); } return M.get(k); }
// Where a raider is heading right now, or null when its objective is gone.
function raidPoint(R) {
  if (R.S) return R.S.dead ? null : R.S;
  if (R.kind === "gate") { const q = (G.gates || []).filter(gateActive).sort((a, b) => Math.hypot(a.x - G.p.x, a.y - G.p.y) - Math.hypot(b.x - G.p.x, b.y - G.p.y))[0]; return q || null; }
  if (R.kind === "zone") return G.zone && G.zone.prog < 1 ? G.zone : null;
  if (R.kind === "van") return G.exit || null;
  return null;
}
// Which enemies raid, per objective. Flyers, Hexers and snipers always hunt you.
const RAID_ODDS = { stall: { shrike: .45, rook: .4, bulwark: .5, carrion: .45 }, escort: { shrike: .55, rook: .45, bulwark: .6, carrion: .5 }, guard: { shrike: .35, rook: .35 },
  gates: { shrike: .4, rook: .4, bulwark: .5 }, hold: { shrike: .45, rook: .4, bulwark: .6, carrion: .35 }, extract: { shrike: .5, bulwark: .5, rook: .3 } };
function assignRaiders(dt) {
  const g = G.rules.goal, odds = RAID_ODDS[g.type]; if (!odds) return; const C = G.camp;
  if (g.type === "extract" && !G.exit) return; // van raiders are picked once the van is on its way
  for (const e of G.en) { if (!e.alive || e.raidSet || e.dummy) continue; e.raidSet = true; const pr = odds[e.type]; if (!pr || Math.random() > pr) continue;
    let R = null;
    if (G.stalls && (g.type === "stall" || g.type === "escort" || g.type === "guard")) { const live = G.stalls.filter(S => !S.dead); if (!live.length) continue; R = { S: live[Math.random() * live.length | 0] }; }
    else if (g.type === "gates") R = { kind: "gate" }; else if (g.type === "hold") R = { kind: "zone" }; else if (g.type === "extract") R = { kind: "van" };
    if (!R) continue;
    R.peel = Math.random() < .6 ? rnd(85, 130) : 0; // most raiders break off to chase you when you come into view; the rest stay committed
    if (e.type === "carrion" && R.S) { e.hunt = R.S; e.huntSet = true; } else e.raid = R;
    if ((C.raidCallT || 0) <= 0 && R.S) { C.raidCallT = 9; const nm = { stall: "my stall", cargo: "the cargo", rack: "rack " + R.S.id }[R.S.kind]; radio("magpie", nm ? `They're going for ${nm}! Cut them off!` : "They're going for the objective!"); }
  }
  C.raidCallT = (C.raidCallT || 0) - dt;
}
// Movement for a raider (called from the enemy's walk). Returns false to fall back to chasing you:
// raiders turn on you when you get close, so defending the objective means meeting them there.
function raidMove(e, spd, dt) {
  const R = e.raid, T = raidPoint(R); if (!T) { e.raid = null; return false; }
  // How close you have to be before a raider turns on you: cargo and ring raiders keep shoving in until you're right on them.
  const p = G.p, turn = R.S ? (R.S.kind === "cargo" ? 26 : 54) : R.kind === "zone" ? 22 : R.kind === "van" ? 30 : 54, dp = Math.hypot(p.x - e.x, p.y - e.y); if (dp < turn) return false;
  // Peelers chase you while they can see you nearby, then go back to the objective once you've lost them for a moment.
  if (R.peel) { const seen = dp < (R.chase ? R.peel + 70 : R.peel) && los(e.x, e.y - BODY, p.x, p.y - BODY, 1e9); R.lost = seen ? 0 : (R.lost || 0) + dt;
    if (seen && !R.chase) { R.chase = true; pop(e.x, e.y - 30, "!", COL.red); } else if (R.chase && R.lost > 1.5) R.chase = false;
    if (R.chase) return false; }
  const reach = R.S ? (e.type === "rook" ? 70 : 14) : R.kind === "zone" ? 18 : 26, d = Math.hypot(T.x - e.x, T.y - e.y);
  if (e.type === "rook" && R.S && d < reach && !los(e.x, e.y - BODY, T.x, T.y - 12, 1e9)) { stepAlong(fieldFor(T.x, T.y), e, spd, dt); return true; } // keep closing until it has a clear shot
  if (d > reach) { stepAlong(fieldFor(T.x, T.y), e, spd, dt); return true; }
  e.face = T.x < e.x ? -1 : 1;
  if (R.S) { e.raidT = (e.raidT || 0) - dt; if (e.raidT <= 0) { const S = R.S;
    if (e.type === "rook") { const gx = e.x + e.face * 12, gy = e.y - BODY - 2; shoot(gx, gy, Math.atan2(S.y - 12 - gy, S.x - gx) + rnd(-.05, .05), 135, "e", { by: "rook" }); AU.sfx("shotE", panOf(e.x)); e.raidT = 1.8; }
    else { hurtStall(S, e.type === "bulwark" ? 4 : 5); fx(S.x + rnd(-8, 8), S.y - rnd(6, 18), 6, [COL.magenta, "#ffffff"], 60, .3); AU.sfx("impactMetal", panOf(e.x)); e.raidT = 1; } } }
  return true;
}
const stallPct = () => { const live = (G.stalls || []).filter(S => !S.dead); return live.length ? Math.min(...live.map(S => S.hp / S.max)) * 100 : 0; };

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
// Anywhere on the map you can walk to, a good distance from you (not just the top rows).
function placeShard() { buildFlow(); const reach = q => tileOf(q.x, q.y) !== "o" && G.flow[Math.floor(q.y / TS) * MW + Math.floor(q.x / TS)] >= 0;
  const pool = floorSpots(110).filter(reach), s = pool[Math.random() * pool.length | 0] || floorSpots(60).filter(reach)[0]; if (s) G.shard = { x: s.x, y: s.y }; }

/* ---- Triggers for radio lines and the datashard ---- */
function trig(on) {
  const C = G.camp; if (on === "start") return C.t >= .6; if (on === "p2") return G.phase2; if (on === "boss") return G.boss && G.mode === "play";
  const [k, v] = on.split(":"), n = +v;
  if (k === "zone") return G.zone && G.zone.prog * 100 >= n; if (k === "van") return !!G.exit;
  if (k === "t") return C.t >= n; if (k === "k") return dk() >= n; if (k === "stall") return G.stalls && stallPct() <= n; if (k === "cargo") return G.stalls && G.stalls[0].prog * 100 >= n;
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
  G.radioQ = []; G.stalls = null; G.drops = null; G.rackFlow = null; G.raidFields = null; G.lull = false; G.zone = null; G.exit = null; G.allies = []; G.rw = null; G.choirRounds = 0; storySprites(); propSprites(); G.fog = G.rules.fog || 0; G.gates = null; G.shard = null; G.flood = null; G.vents = null; G.floodTotal = 0; G.god = false; G.dropName = hz[0]; G.hazard = hz[1];
  AU.init(); BANK.attach(); RUN.reset(ch.district);
  G.heatBase = G.rules.heatBase || 0; G.heat = G.heatBase; G.lastHeat = G.heat;
  G.p.shield = SAVE.camp.diff === "story" ? 2 : 0;
  const g = G.rules.goal; if (g.type === "stall" || g.type === "guard" || g.type === "escort") placeStalls(); if (g.type === "hold") placeZone();
  G.camp.floor = 1; G.rwT = G.rules.rewrite || 0; if (G.rules.allies) spawnAllies(G.rules.allies[0], G.rules.allies[1]); if (g.type === "gates") placeGates(g.n);
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
  C.recT = (C.recT || 0) - dt; if (C.recT <= 0) { C.recT = .1; (C.rec || (C.rec = [])).push({ x: p.x, y: p.y }); if (C.rec.length > 900) C.rec.shift(); }
  updateDrops(dt);
  if (R.vents) { G.ventT -= dt; if (G.ventT <= 0) { G.ventT = R.vents * rnd(.8, 1.2); randomVent(); } } updateVents(dt);
  if (R.flood) { G.floodT -= dt; if (G.floodT <= 0) { G.floodT = R.flood; floodStage(false); } updateFlood(dt); }
  C.callT = (C.callT || 0) - dt;
  // Waves: spawning pauses during the breaks so you can reboot racks.
  if (R.waves) { const w = R.waves.findIndex(([a, b]) => C.t >= a && C.t < b), lull = w < 0;
    if (lull !== G.lull || w !== C.wave) { if (w >= 0 && w !== C.wave) { G.banner = { txt: `WAVE ${w + 1}/${R.waves.length}` + (w === R.waves.length - 1 ? " · THE BIG ONE" : ""), col: COL.red, life: 2.2 }; AU.sfx("bell"); if (w === R.waves.length - 1) G.heatBase = Math.min(4, G.heatBase + 1); }
      else if (lull && C.t < g.secs) { G.banner = { txt: "BREAK · REBOOT YOUR RACKS", col: COL.cyan, life: 2.2 }; AU.sfx("milestone"); }
      G.lull = lull; if (w >= 0) C.wave = w; } }
  if (G.rackFlow) for (const e of G.en) if (e.alive && e.type === "carrion" && !e.huntSet) { e.huntSet = true; const live = G.stalls.filter(S2 => !S2.dead);
    if (live.length && Math.random() < .8) { e.hunt = live[Math.random() * live.length | 0]; if ((C.huntCallT || 0) <= 0) { C.huntCallT = 6; radio("magpie", `Carrion heading for rack ${e.hunt.id}!`); } } }
  C.huntCallT = (C.huntCallT || 0) - dt; assignRaiders(dt);
  for (const S of G.stalls || []) { S.hurtT = Math.max(0, S.hurtT - dt); S.alarmT = Math.max(0, (S.alarmT || 0) - dt); let contested = false;
    // Rebooting: stand beside a damaged rack to restore it.
    S.fixing = S.kind === "rack" && !S.dead && S.hp < S.max && Math.hypot(p.x - S.x, p.y - S.y) < 22;
    if (S.fixing) { S.hp = Math.min(S.max, S.hp + 9 * dt); if (Math.random() < .3) G.parts.push({ x: S.x + rnd(-8, 8), y: S.y - rnd(4, 26), vx: 0, vy: -30, life: .4, max: .4, col: COL.cyan, g: 0 }); }
    for (const e of G.en) { if (!e.alive || BOSSY.has(e.type)) continue; const d = Math.hypot(e.x - S.x, e.y - S.y); if (d < 24) contested = true;
      if (e.type === "corvid") { if (e.state === "dive" && !e.dv) { e.dv = true; if (Math.random() < .35) e.la = Math.atan2(S.y - 10 - e.y, S.x - e.x); } if (e.state !== "dive") e.dv = false; if (e.state === "dive" && d < 14) { hurtStall(S, 12); killEnemy(e, "blast"); } }
      else if (d < 16 && S.kind !== "rack" && !e.raid) hurtStall(S, 14 * dt); } // racks only take stray shots and blasts; raiders use their own attacks
    // The cargo crane only rolls while you're beside it and nothing is on top of it.
    if (S.path) { S.moving = !contested && Math.hypot(p.x - S.x, p.y - S.y) < 56 && S.idx < S.path.length - 1;
      if (S.moving) { const tg = S.path[S.idx + 1], dx = tg.x - S.x, dy = tg.y - S.y, l = Math.hypot(dx, dy), st = 15 * dt; if (l <= st) { S.x = tg.x; S.y = tg.y; S.idx++; } else { S.x += dx / l * st; S.y += dy / l * st; } }
      S.prog = S.idx / (S.path.length - 1); S.contested = contested; } }
  if (G.gates) G.gates.forEach(q => { q.contested = gateActive(q) && G.en.some(e => e.alive && !FLYING.has(e.type) && !BOSSY.has(e.type) && Math.hypot(e.x - q.x, e.y - q.y) < 30);
    if (gateActive(q) && !q.contested && Math.hypot(q.x - p.x, q.y - p.y) < 18) gateProgress(q, dt / gateGoal().secs); }); // an enemy at the terminal blocks it
  if (G.zone) { const Z = G.zone, inside = Math.hypot(p.x - Z.x, p.y - Z.y) < Z.r; Z.contested = inside && G.en.some(e => e.alive && !FLYING.has(e.type) && Math.hypot(e.x - Z.x, e.y - Z.y) < Z.r); Z.inside = inside;
    if (inside && !Z.contested) Z.prog = Math.min(1, Z.prog + dt / g.secs);
    if (R.wrenAt != null && SAVE.camp.flags.leftThem && !C.wrenOut && Z.prog >= R.wrenAt) { C.wrenOut = true; spawnWrenc(); } }
  if (g.type === "extract" && !G.exit && C.t >= g.secs) placeExit();
  if (g.type === "climb" && !G.exit && dk() >= g.kills) placeLift();
  if (g.type === "climb" && G.exit && G.exit.open && C.floor < g.floors && Math.hypot(p.x - G.exit.x, p.y - G.exit.y) < 20) nextFloor();
  updateVan(dt); updateAllies(dt);
  if (G.rules.rewrite) { G.rwT -= dt; if (G.rwT <= 0) { G.rwT = G.rules.rewrite; rewriteStage(); } } updateRewrite(dt);
  const win = (g.type === "kills" && dk() >= g.n) || (g.type === "hold" && G.zone.prog >= 1) || (g.type === "climb" && C.floor >= g.floors && G.exit && G.exit.open && Math.hypot(p.x - G.exit.x, p.y - G.exit.y) < 20) || (g.type === "extract" && G.exit && G.exit.open && Math.hypot(p.x - G.exit.x, p.y - G.exit.y) < 24) || ((g.type === "survive" || g.type === "stall" || g.type === "guard") && C.t >= g.secs) || (g.type === "escort" && G.stalls[0].prog >= 1) || (g.type === "gates" && G.gates.every(q => q.done));
  if (win) campWin();
}
function campWin() {
  const C = G.camp; if (!C || C.won) return; C.won = true; C.winT = 1.6; if (G.stalls) SAVE.camp.stallHp = Math.round(stallPct()); G.lull = false;
  if (G.rackFlow) { const saved = G.stalls.filter(S => !S.dead).length; SAVE.camp.racksSaved = saved; if (saved === G.stalls.length) SAVE.camp.flags.allRacks = true; else delete SAVE.camp.flags.allRacks; } G.god = true; G.flood = null; G.vents = null;
  for (const e of G.en) if (e.alive && e.type !== "nest") { e.alive = false; fx(e.x, e.y - 10, 8, ["#2a2440", COL.magenta], 50, .5); }
  G.pending = []; G.bul = []; G.banner = { txt: "OBJECTIVE COMPLETE", col: COL.cyan, life: 1.6 }; AU.sfx("milestone"); G.best = Math.max(G.best || 0, G.score); SAVE.best = G.best;
}
// Finishing an act pays out once: its reward item (never sold) and a pile of scrip.
// Finishing an act pays out once: a weapon and a piece of gear Magpie never sells, plus a pile of scrip.
const actRewards = A => ITEMS.filter(i => i.relic === A.n);
const actDone = A => A.chapters.every(n => SAVE.camp.done[n]);
function grantActRewards() {
  const S = SAVE.camp, got = []; S.actPaid = S.actPaid || {};
  ACTS.forEach(A => { if (!actDone(A)) return; const L = SAVE.loadout, scrip = S.actPaid[A.n] ? 0 : ACT_SCRIP[A.n] || 0, items = actRewards(A).filter(i => !owns(i.id)); // items added later still reach finished saves
    if (!items.length && !scrip) return; S.actPaid[A.n] = true; SAVE.scrip += scrip;
    items.forEach(i => { SAVE.owned.push(i.id); if (i.cat === "gun") L.gun = i.id; if (i.cat === "imp" && L.imp.length < IMP_SLOTS) L.imp.push(i.id); }); // new weapon goes straight in your hand
    got.push({ act: A.n, items, scrip }); });
  if (got.length) persist(); return got;
}
const rewardNames = items => items.map(i => i.name.toUpperCase()).join(" + ");
function chapterDone() {
  const C = G.camp, S = SAVE.camp; earn(150); S.done[C.n] = true; if (S.paidNow) S.paid[C.n] = true; S.paidNow = false;
  S.cur = Math.max(S.cur, Math.min(C.n + 1, maxChapter())); C.reward = grantActRewards().find(r => r.act === actOf(C.n).n) || null; if (C.ch.district === "market" && G.rules.goal.type === "boss") track("clear", "market");
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
  if (G.zone) { const Z = G.zone, col = Z.contested ? COL.red : Z.inside ? COL.cyan : COL.amber; c.save(); c.translate(Z.x, Z.y); c.scale(1, .62); c.strokeStyle = rgba(col, .5); c.beginPath(); c.arc(0, 0, Z.r, 0, TAU); c.stroke();
    c.fillStyle = rgba(col, .08); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, Z.r, -Math.PI / 2, -Math.PI / 2 + TAU * Z.prog); c.stroke(); c.restore();
    txt(c, Z.contested ? "CONTESTED" : Z.inside ? "HOLDING" : "HOLD HERE", Z.x, Z.y - 32, rgba(col, .8 + .2 * Math.sin(t * .01)), 8, "center"); }
  if (G.exit && G.exit.kind === "lift") { const V = G.exit, x = Math.round(V.x), y = Math.round(V.y), s2 = SP.lift, top = y - s2.h + 4;
    if (V.open) { c.fillStyle = "#05040b"; c.fillRect(x - 13, top + 8, 26, 32); c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, top + 24, 18, COL.cyan, .5 + .2 * Math.sin(t * .01)); c.restore(); }
    c.save(); if (V.open) { c.beginPath(); c.rect(x - 17, top, 34, 8); c.rect(x - 17, top, 4, 40); c.rect(x + 13, top, 4, 40); c.clip(); } drawSpr(c, s2, x - 17, top); c.restore();
    txt(c, V.open ? "GET IN" : "LIFT", x, top - 10, rgba(COL.cyan, .7 + .3 * Math.sin(t * .01)), 8, "center"); }
  else if (G.exit && SP.van) { const V = G.exit, s2 = V.face < 0 ? SPF.van : SP.van, x = Math.round(V.x + (V.dx || 0)), y = Math.round(V.y), idle = V.open && Math.floor(t / 90) % 2 ? 1 : 0;
    // headlight beams, shadow, then the van; the side door glows once it has stopped
    c.save(); c.globalCompositeOperation = "lighter"; const hx = x + V.face * 24; c.fillStyle = "rgba(255,210,120,.10)"; c.beginPath(); c.moveTo(hx, y - 10); c.lineTo(hx + V.face * 70, y - 28); c.lineTo(hx + V.face * 70, y + 6); c.fill(); glow(c, hx, y - 9, 10, COL.amber, .6); c.restore();
    c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.ellipse(x, y + 1, 24, 4, 0, 0, TAU); c.fill();
    drawSpr(c, s2, x - s2.w / 2, y - s2.h + 3 - idle);
    if (V.open) { const on = .5 + .5 * Math.sin(t * .01); c.save(); c.globalCompositeOperation = "lighter"; glow(c, x - V.face * 1, y - 12, 16, COL.cyan, .5 * on); c.restore(); txt(c, "GET IN", x, y - 40, rgba(COL.cyan, .7 + .3 * on), 8, "center"); } }
  if (G.rw && G.rw.pending) { const on = Math.floor(t / 80) % 2; G.rw.pending.tiles.forEach(([x, y]) => { c.fillStyle = rgba(on ? COL.red : COL.magenta, .4); c.fillRect(x * TS + (on ? 1 : 0), y * TS, TS, TS); });
    const ts = G.rw.pending.tiles, mx = ts.reduce((a, q) => a + q[0], 0) / ts.length, my = ts.reduce((a, q) => a + q[1], 0) / ts.length; txt(c, "REWRITE", mx * TS + 8, my * TS + 4, rgba("#ffffff", on ? 1 : .5), 8, "center"); }
  for (const d of G.drops || []) if (d.state === "warn") { const on = Math.floor(t / 90) % 2, x = d.tiles[0][0] * TS, y = d.tiles[0][1] * TS, k = 1 - d.t / 1.4;
    c.fillStyle = `rgba(0,0,0,${.25 + .4 * k})`; c.fillRect(x + 6 - 6 * k, y + 6 - 6 * k, 20 + 12 * k, 20 + 12 * k); c.strokeStyle = on ? COL.amber : rgba(COL.amber, .5); c.strokeRect(x + .5, y + .5, 31, 31); }
  for (const v of G.vents || []) { const on = Math.floor(t / 100) % 2;
    v.tiles.forEach(([x, y]) => { if (v.state === "warn") { c.fillStyle = rgba("#ff6a2a", on ? .45 : .18); c.fillRect(x * TS, y * TS, TS, TS); }
      else { c.fillStyle = `rgba(255,${150 + Math.round(60 * Math.sin(t * .02 + x * 3 + y))},40,.7)`; c.fillRect(x * TS, y * TS, TS, TS); c.save(); c.globalCompositeOperation = "lighter"; glow(c, x * TS + 8, y * TS + 8, 14, "#ff6a2a", .35); c.restore(); } }); }
  if (G.flood) { const on = Math.floor(t / 110) % 2, ts = G.flood.tiles; c.fillStyle = rgba("#2be4ff", on ? .4 : .14); ts.forEach(([x, y]) => c.fillRect(x * TS, y * TS, TS, TS));
    const mx = ts.reduce((s, q) => s + q[0], 0) / ts.length, my = ts.reduce((s, q) => s + q[1], 0) / ts.length; txt(c, "FLOOD", mx * TS + 8, my * TS + 4, rgba("#ffffff", on ? 1 : .5), 8, "center"); }
  if (G.gates) G.gates.forEach(q => { if (!q.done && !gateActive(q)) return; const col = q.done ? "#9dff4a" : COL.cyan; c.save(); c.translate(q.x, q.y); c.scale(1, .62); c.strokeStyle = rgba(col, .35); c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.stroke();
    if (q.prog > 0) { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + TAU * q.prog); c.stroke(); } c.restore(); });
  if (G.shard) { const b = Math.sin(t * .005) * 2, x = G.shard.x, y = G.shard.y - 8 + b; c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y, 14, COL.magenta, .5 + .2 * Math.sin(t * .01)); c.restore();
    c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.ellipse(x, G.shard.y + 2, 4, 1.5, 0, 0, TAU); c.fill(); drawSpr(c, SP.shard, x - SP.shard.w / 2, y - SP.shard.h / 2); }
}
function campDrawObjects(c, t) {
  for (const S of G.stalls || []) { const x = Math.round(S.x), y = Math.round(S.y), sh = S.hurtT > 0 ? Math.round(rnd(-1, 1)) : 0;
    if (S.kind === "stall") {
      const mg = portrait("magpieBody"); if (mg) drawSpr(c, mg, x + 6 + sh, y - mg.h - 8);
      shadowUnder(c, x - 20, y - 36, SP.stall); drawSpr(c, SP.stall, x - 20 + sh, y - 36);
      c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 30, 18, COL.magenta, .22); c.restore();
    } else { // server rack, on its own or riding the cargo crane's trolley
      if (S.kind === "cargo") { c.fillStyle = "#9090ad"; c.fillRect(x, 6, 1, y - 34); c.fillStyle = "#e2e2f1"; c.fillRect(x - 3, y - 35, 7, 2); drawSpr(c, SP.trolley, x - 18, y - 6); }
      else shadowUnder(c, x - 10, y - 30, SP.rack);
      drawSpr(c, SP.rack, x - 10 + sh, y - 30 - (S.kind === "cargo" ? 4 : 0));
      if (S.dead) { txt(c, "DARK", x, y - 40, rgba(COL.red, .8), 8, "center"); continue; }
      if (S.id) txt(c, "R" + S.id, x, y - 48, S.alarmT > 0 && Math.floor(t / 120) % 2 ? COL.red : rgba(COL.ink, .7), 8, "center");
      if (S.alarmT > 0) { c.strokeStyle = rgba(COL.red, .4 + .5 * (Math.floor(t / 120) % 2)); c.strokeRect(x - 11.5, y - 31.5, 23, 31); }
      if (S.fixing) txt(c, "REBOOTING", x, y - 58, rgba(COL.cyan, .7 + .3 * Math.sin(t * .02)), 8, "center");
      else if (S.hp < S.max * .6 && Math.hypot(G.p.x - S.x, G.p.y - S.y) > 22) txt(c, "STAND HERE TO REBOOT", x, y - 58, rgba(COL.dim, .7), 8, "center");
      const ry = y - 26 - (S.kind === "cargo" ? 4 : 0); for (let i = 0; i < 6; i++) { c.fillStyle = (Math.floor(t / 200) + i) % 3 ? "#2be4ff" : "#1a5a6a"; c.fillRect(x - 6 + sh, ry + i * 4, 2, 1); }
      c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 14, 14, COL.cyan, .2); c.restore();
      if (S.kind === "cargo" && !S.moving && S.prog < 1) txt(c, S.contested ? "BLOCKED" : "STAY CLOSE", x, y - 46, rgba(S.contested ? COL.red : COL.cyan, .7 + .3 * Math.sin(t * .01)), 8, "center");
    }
    c.fillStyle = "#2a2640"; c.fillRect(x - 15, y - 38, 30, 2); c.fillStyle = S.hp / S.max < .3 && Math.floor(t / 120) % 2 ? "#ffffff" : COL.magenta; c.fillRect(x - 15, y - 38, Math.round(30 * S.hp / S.max), 2); }
  if (G.gates) G.gates.forEach(q => { const x = Math.round(q.x), y = Math.round(q.y), live = gateActive(q), col = q.done ? "#9dff4a" : live ? COL.cyan : "#3a3456", gg = gateGoal();
    const ts = SP[TERMINAL[gg.noun] || "t_floodgate"], top = y - ts.h + 2; shadowUnder(c, x - ts.w / 2, top, ts);
    if (!live && !q.done) c.globalAlpha = .55; drawSpr(c, ts, x - ts.w / 2, top); c.globalAlpha = 1;
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, top + 4, live ? 10 + Math.sin(t * .01) * 2 : 7, col, (live ? .5 : q.done ? .4 : .15) * (gg.noun === "FURNACE" ? .5 : 1)); c.restore();
    if (q.done) txt(c, "OK", x, top - 10, "#9dff4a", 8, "center");
    if (live) txt(c, q.contested ? "CONTESTED" : Math.hypot(G.p.x - x, G.p.y - y) < 18 ? gg.verb : gg.noun, x, top - 12, rgba(q.contested ? COL.red : col, .8 + .2 * Math.sin(t * .01)), 8, "center"); });
  drawAllies(c, t);
  for (const e of G.en) { if (!e.alive) continue;
    if (e.type === "choir" && e.state === "down") { const s2 = sprOf("choir", e.face); c.save(); c.globalAlpha = .6; c.drawImage(tinted(s2, "#05040b"), Math.round(e.x - s2.w / 2), Math.round(e.y - s2.h + 2)); c.restore(); txt(c, Math.ceil(e.t) + "", e.x, e.y - 44, COL.cyan, 8, "center"); }
    if (e.type === "corvina" && e.state === "scream") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 24 - e.alt, 30, COL.red, .5 + .4 * Math.sin(t * .06)); c.restore(); }
    if (e.type === "corvina" && e.state === "exposed") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 24 - e.alt, 16, "#ffffff", .5); c.restore(); txt(c, "EXPOSED", e.x, e.y - 62, COL.cyan, 8, "center"); }
    if (e.type === "corvina" && e.hurt > 0) { const s2 = sprOf("corvina", e.face); c.save(); c.globalAlpha = e.hurt * 2; c.drawImage(tinted(s2, "#ffffff"), Math.round(e.x - s2.w / 2), Math.round(e.y - s2.h + 2 - e.alt)); c.restore(); }
    if (e.type === "warden" && e.state === "aim") { c.save(); c.globalAlpha = .55 + .3 * Math.sin(t * .05); pline(c, e.x + e.face * 10, e.y - BODY - 2, e.x + e.face * 10 + Math.cos(e.la) * 300, e.y - BODY - 2 + Math.sin(e.la) * 300, COL.amber); c.restore(); }
    if (e.type === "scarecrow" && e.state === "call") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 28, 18, COL.magenta, .7 + .3 * Math.sin(t * .05)); c.restore(); txt(c, "CALLING", e.x, e.y - 60, COL.magenta, 8, "center"); }
    if (e.type === "scarecrow" && e.state === "sweep") { c.save(); c.globalAlpha = .35; c.fillStyle = COL.red; c.beginPath(); c.moveTo(e.x, e.y - 20); c.arc(e.x, e.y - 20, 110, e.la - .65, e.la + .65); c.fill(); c.restore(); }
    if (e.type === "vanexo" && e.state === "aim") { c.save(); c.globalAlpha = e.t > .3 ? .4 : .9; pline(c, e.x, e.y - 20, e.x + Math.cos(e.la) * 300, e.y - 20 + Math.sin(e.la) * 300, COL.amber, 3); c.restore(); }
    if (e.type === "vanexo" && e.state === "overheat") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 24, 16, "#ffffff", .5 + .3 * Math.sin(t * .05)); c.restore(); txt(c, "OVERHEATING", e.x, e.y - 60, COL.amber, 8, "center"); }
    if (["wrenc", "scarecrow", "vanexo"].includes(e.type) && e.hurt > 0) { const s2 = sprOf(e.type, e.face); c.save(); c.globalAlpha = e.hurt * 2; c.drawImage(tinted(s2, "#ffffff"), Math.round(e.x - s2.w / 2), Math.round(e.y - s2.h + 2)); c.restore(); } }
  for (const e of G.en) { if (!e.alive || !e.raid || e.raid.chase || !e.raid.S || e.raid.S.dead || Math.hypot(e.x - e.raid.S.x, e.y - e.raid.S.y) < 20) continue; const S = e.raid.S; c.save(); c.globalAlpha = .3 + .2 * Math.sin(t * .02); c.setLineDash([2, 4]); c.strokeStyle = COL.red; c.beginPath(); c.moveTo(e.x, e.y - 6); c.lineTo(S.x, S.y - 12); c.stroke(); c.restore(); }
  for (const e of G.en) { if (!e.alive || !e.hunt || e.hunt.dead) continue; const S = e.hunt; c.save(); c.globalAlpha = .45 + .25 * Math.sin(t * .02); c.setLineDash([3, 3]); c.strokeStyle = COL.red; c.beginPath(); c.moveTo(e.x, e.y - 6); c.lineTo(S.x, S.y - 12); c.stroke(); c.restore(); }
  for (const e of G.en) { if (!e.alive || (e.type !== "widow" && e.type !== "archivist")) continue; const s2 = sprOf(e.type, e.face);
    if (e.type === "widow" && e.state === "cab") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 26, 14, COL.cyan, .7 + .3 * Math.sin(t * .05)); c.restore(); txt(c, "CAB OPEN", e.x, e.y - 58, rgba(COL.cyan, .9), 8, "center"); }
    if (e.type === "archivist") { if (e.state === "exposed") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 24 - e.alt, 18, COL.cyan, .8); c.restore(); txt(c, "EXPOSED", e.x, e.y - 60, COL.cyan, 8, "center"); }
      else { c.strokeStyle = rgba(COL.magenta, .5 + .3 * Math.sin(t * .02)); c.beginPath(); c.arc(e.x, e.y - 22 - e.alt, 22, 0, TAU); c.stroke(); } }
    if (e.hurt > 0) { c.save(); c.globalAlpha = e.hurt * 2; c.drawImage(tinted(s2, "#ffffff"), Math.round(e.x - s2.w / 2), Math.round(e.y - s2.h + 2 - (e.alt || 0))); c.restore(); } }
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
  if (G.boss && D().boss === "choir") { const up = G.en.filter(e => e.alive && e.type === "choir" && e.state !== "down").length; label = `CHOIR · ${up}/3 UP`; col = COL.magenta; k = G.choirRounds / 2; }
  else if (G.boss) { const b = G.en.find(e => e.alive && e.type === D().boss); label = D().bossName; col = COL.magenta; k = b && b.hp ? b.hp / 3 : 1; }
  else if (g.type === "climb") { label = G.exit ? `FLOOR ${C.floor}/${g.floors} · LIFT` : `FLOOR ${C.floor}/${g.floors} · ${Math.min(dk(), g.kills)}/${g.kills}`; k = ((C.floor - 1) + Math.min(1, dk() / g.kills)) / g.floors; col = G.exit ? COL.cyan : COL.ink; }
  else if (g.type === "kills") { label = `${String(Math.min(dk(), g.n)).padStart(2, "0")}/${g.n} KILLS`; k = dk() / g.n; }
  else if (g.type === "survive") { const s = Math.max(0, Math.ceil(g.secs - C.t)); label = `SURVIVE ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; k = C.t / g.secs; }
  else if (g.type === "stall" || g.type === "guard") { const s = Math.max(0, Math.ceil(g.secs - C.t)); label = g.type === "stall" ? `STALL ${Math.ceil(stallPct())}% · ${s}S` : (G.rules.waves ? (G.lull ? "BREAK" : `W${(C.wave || 0) + 1}`) + " · " : "") + `RACKS ${G.stalls.filter(q => !q.dead).length}/${G.stalls.length} · ${s}S`; k = C.t / g.secs; col = stallPct() < 30 ? COL.red : COL.ink; }
  else if (g.type === "hold") { label = `HOLD ${Math.floor(G.zone.prog * 100)}%` + (G.zone.contested ? " · CONTESTED" : ""); k = G.zone.prog; col = G.zone.contested ? COL.red : COL.ink; }
  else if (g.type === "extract") { const s = Math.max(0, Math.ceil(g.secs - C.t)); label = G.exit ? "GET TO THE VAN" : `VAN IN ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; k = Math.min(1, C.t / g.secs); col = G.exit ? COL.cyan : COL.ink; }
  else if (g.type === "escort") { const S = G.stalls[0]; label = `CARGO ${Math.floor(S.prog * 100)}% · HP ${Math.ceil(S.hp / S.max * 100)}`; k = S.prog; col = S.hp / S.max < .3 ? COL.red : COL.ink; }
  else if (g.type === "gates") { const n = G.gates.filter(q => q.done).length; label = `${gateGoal().noun}S ${n}/${G.gates.length}`; k = n / G.gates.length; }
  else if (g.type === "boss") { label = `${String(Math.min(dk(), G.rules.boss)).padStart(2, "0")}/${G.rules.boss} · DRAW OUT`; k = dk() / G.rules.boss; }
  panel(c, x, 6, 108, 24, "#3a3456"); txt(c, label, W / 2, 9, col, 8, "center");
  for (let i = 0; i < 20; i++) { c.fillStyle = i < Math.min(1, k) * 20 ? (G.boss ? COL.amber : COL.magenta) : "#2a2640"; c.fillRect(W / 2 - 49 + i * 5, 21, 4, 3); }
  if (G.p.shield > 0 || SAVE.camp.diff === "story") { txt(c, "SHIELD", 168, GH - 58, COL.dim); for (let i = 0; i < 2; i++) { c.fillStyle = i < G.p.shield ? COL.cyan : "#2a2640"; c.fillRect(206 + i * 8, GH - 56, 6, 4); } }
}

/* ---- Campaign menu and archive ---- */
const actOpen = A => A.chapters[0] <= SAVE.camp.cur;
function openCamp() { G.mode = "camp"; G.campView = "list"; G.camp = null; G.rules = null; G.chapMap = null; shopSprites();
  const late = grantActRewards(); G.campNote = late.length ? { txt: "ACT REWARDS CLAIMED: " + late.map(r => rewardNames(r.items) + (r.scrip ? " +" + r.scrip : "")).join(" · "), life: 6 } : null; // acts finished before rewards existed
  // Open on the act and chapter you play next.
  const nx = nextChapter(), A = actOf(nx); G.campAct = ACTS.indexOf(A);
  G.menuMode = "camp"; G.menuSel = A.chapters.indexOf(nx); G.menuMx = mouse.x; G.menuMy = mouse.y; }
function campMenuItems() {
  const S = SAVE.camp, items = [], A = ACTS[G.campAct || 0];
  A.chapters.forEach((n, i) => { const open = n <= S.cur && actOpen(A); items.push({ label: n, ch: n, y: 52 + i * 15, box: [20, 50 + i * 15, 236, 13], act: () => open ? startChapter(n) : AU.sfx("hackFail") }); });
  const y = 52 + A.chapters.length * 15 + 8;
  items.push({ label: "DIFFICULTY", y, box: [20, y - 2, 236, 13], act: () => { S.diff = S.diff === "story" ? "normal" : "story"; persist(); AU.sfx("lock", 2); } });
  items.push({ label: "ARCHIVE", y: y + 15, box: [20, y + 13, 236, 13], act: () => { G.campView = "archive"; G.menuMode = null; G.archSel = 0; } });
  items.push({ label: "BACK", y: y + 30, box: [20, y + 28, 236, 13], act: () => { G.mode = "title"; G.menuMode = null; } });
  return items;
}
function updateCamp(rdt) {
  if (G.campView === "archive") {
    const all = ACTS[G.campAct || 0].chapters, n = all.length; if (hit("escape") || hit("lmb") && mouse.y > 240) { G.campView = "list"; G.menuMode = null; return; }
    const sw = d => { const a = Math.max(0, Math.min(ACTS.length - 1, (G.campAct || 0) + d)); if (a !== G.campAct) { G.campAct = a; G.archSel = 0; AU.sfx("lock", 1); } };
    if (hit("arrowleft") || hit("a") || hit("q")) sw(-1); if (hit("arrowright") || hit("d") || hit("e")) sw(1);
    if (hit("arrowup") || hit("w")) G.archSel = (G.archSel + n - 1) % n; if (hit("arrowdown") || hit("s")) G.archSel = (G.archSel + 1) % n;
    all.forEach((ch, i) => { if (hit("lmb") && inBox([20, 54 + i * 13, 150, 12], mouse.x, mouse.y)) G.archSel = i; });
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
  const aOpen = actOpen(A); txt(c, aOpen ? `ACT ${A.n} · ${A.name}` : `ACT ${A.n} · LOCKED`, GW / 2, 32, aOpen ? COL.amber : "#5a5276", 8, "center");
  if (ACTS.length > 1) { txt(c, "<", GW / 2 - 92, 32, ai > 0 ? (on2 ? COL.cyan : rgba(COL.cyan, .6)) : "#2a2640", 8, "center"); txt(c, ">", GW / 2 + 92, 32, ai < ACTS.length - 1 ? (on2 ? COL.cyan : rgba(COL.cyan, .6)) : "#2a2640", 8, "center"); }
  const items = G.menu || campMenuItems(), sel = G.menuMode === G.mode ? G.menuSel : -1;
  items.forEach((it, i) => { const on = i === sel, [bx, by, bw, bh] = it.box; if (on) { c.fillStyle = rgba(COL.cyan, .14); c.fillRect(bx, by, bw, bh); c.fillStyle = COL.cyan; c.fillRect(bx, by, 2, bh); }
    if (it.ch) { const n = it.ch, open = n <= S.cur && actOpen(A), done = S.done[n], ch = CHAPTERS[n];
      txt(c, String(n).padStart(2, "0"), bx + 8, it.y, open ? COL.amber : "#3a3456"); txt(c, open ? ch.title : "LOCKED", bx + 28, it.y, open ? (on ? COL.ink : rgba(COL.ink, .8)) : "#3a3456");
      txt(c, done ? "CLEAR" : open ? "NEW" : "", bx + bw - 22, it.y, done ? COL.cyan : COL.amber, 8, "right");
      if (S.shards[n]) { c.fillStyle = COL.magenta; poly(c, [[bx + bw - 10, it.y], [bx + bw - 7, it.y + 3], [bx + bw - 10, it.y + 6], [bx + bw - 13, it.y + 3]]); c.fill(); } }
    else { const lab2 = it.label === "DIFFICULTY" ? "DIFFICULTY: " + (S.diff === "story" ? "STORY · 2 SHIELDS" : "NORMAL · ONE LIFE") : it.label === "ARCHIVE" ? `ARCHIVE · ${Object.keys(S.shards).length}/${allChapters().length} LOGS` : it.label;
      txt(c, lab2, bx + 8, it.y, on ? COL.cyan : COL.dim); } });
  // Right column: the chapter under the cursor, then trust.
  const hov = items[sel] && items[sel].ch ? items[sel].ch : A.chapters.includes(nextChapter()) ? nextChapter() : A.chapters[0], ch = CHAPTERS[hov], open = hov <= S.cur && aOpen;
  panel(c, 268, 46, 196, 70, "#3a3456");
  txt(c, aOpen ? `${chLabel(hov)} · ${DIST[ch.district].name}` : chLabel(hov), 276, 52, aOpen ? COL.amber : "#5a5276");
  if (open) { wrapText(c, ch.goal, 180).forEach((l, i) => txt(c, l, 276, 64 + i * 10, COL.ink)); txt(c, S.done[hov] ? "CLEARED" + (S.shards[hov] ? " · DATASHARD FOUND" : " · DATASHARD MISSING") : "NOT CLEARED YET", 276, 102, S.done[hov] ? COL.cyan : COL.dim); }
  else txt(c, aOpen ? "CLEAR THE CHAPTER BEFORE IT" : `FINISH ACT ${A.n - 1} TO UNLOCK`, 276, 64, COL.dim);
  const paid = (S.actPaid || {})[A.n]; // what finishing this act gets you
  txt(c, paid ? "CLAIMED: " : "ACT REWARD: ", 20, 214, COL.dim); c.font = "8px Silkscreen"; const rx = 20 + c.measureText(paid ? "CLAIMED: " : "ACT REWARD: ").width;
  txt(c, `${rewardNames(actRewards(A))} + ${ACT_SCRIP[A.n]} SCRIP`, rx, 214, paid ? COL.dim : COL.amber);
  if (G.campNote) { G.campNote.life -= 1 / 60; txt(c, G.campNote.txt, GW / 2, 228, COL.amber, 8, "center"); if (G.campNote.life <= 0) G.campNote = null; }
  panel(c, 268, 122, 196, 84, "#3a3456"); txt(c, "WHO TRUSTS YOU", 276, 128, COL.dim);
  const metOf = { magpie: S.done[1] || S.cur >= 2, wren: S.flags.freed || S.flags.leftThem, vane: true, dex: S.done[9] || S.flags.metDex };
  TRUSTS.forEach(([k, nm], i) => { const met = metOf[k], y = 142 + i * 12; txt(c, met ? nm : "???", 276, y, met ? COL.ink : "#3a3456"); if (met) trustPips(c, 340, y + 2, S.trust[k]); });
  txt(c, "CORVUS RESONANCE", 276, 192, COL.red); for (let i = 0; i < 8; i++) { c.fillStyle = i < S.res ? COL.red : "#2a2640"; c.fillRect(392 + i * 8, 194, 6, 3); }
  txt(c, PAD.active ? "LEFT / RIGHT: ACT · UP / DOWN + " + lab().confirm + " · B: BACK" : "A / D: ACT · W / S + ENTER OR CLICK · ESC: BACK", GW / 2, GH - 14, rgba(COL.dim, .7), 8, "center");
}
function drawArchive(c, t) {
  const S = SAVE.camp, A = ACTS[G.campAct || 0], all = A.chapters; G.archSel = Math.max(0, Math.min(G.archSel || 0, all.length - 1)); txt(c, `< ACT ${A.n} · ${actOpen(A) ? A.name : "LOCKED"} >`, GW / 2, 42, COL.dim, 8, "center");
  all.forEach((n, i) => { const got = S.shards[n], on = i === G.archSel, y = 56 + i * 13; if (on) { c.fillStyle = rgba(COL.magenta, .14); c.fillRect(20, y - 2, 150, 11); }
    txt(c, got ? CHAPTERS[n].shard.title.split(" · ")[0] : "LOG " + String(n).padStart(2, "0"), 28, y, got ? (on ? COL.magenta : COL.ink) : "#3a3456"); txt(c, got ? "" : "MISSING", 164, y, "#3a3456", 8, "right"); });
  const n = all[G.archSel], sh = CHAPTERS[n].shard; panel(c, 180, 52, 284, 170, COL.magenta);
  if (S.shards[n]) { txt(c, sh.title, 190, 60, COL.magenta); wrapText(c, fillName(sh.text).toUpperCase(), 264).forEach((l, i) => txt(c, l, 190, 76 + i * 11, COL.ink)); }
  else { txt(c, "NOT RECOVERED", 190, 60, COL.dim); wrapText(c, n <= S.cur ? `FIND THE GLOWING DATASHARD DURING ${chLabel(n)} · ${CHAPTERS[n].title}.` : `UNLOCKS WHEN YOU REACH ${chLabel(n)}.`, 264).forEach((l, i) => txt(c, l, 190, 76 + i * 11, COL.dim)); }
  txt(c, PAD.active ? "LEFT / RIGHT: ACT · UP / DOWN · B: BACK" : "A / D: ACT · W / S · ESC: BACK", GW / 2, GH - 14, rgba(COL.dim, .7), 8, "center");
}

/* ---- Chapter complete ---- */
function updateChap(rdt, actions) {
  G.chapT += rdt; if (G.chapT < .8) return; const n = G.camp.n, next = n < maxChapter() ? n + 1 : null;
  if (hit("escape")) { actions.toCamp(); return; }
  G.menu = layoutMenu(next ? [{ label: "NEXT · " + chLabel(next) + " " + CHAPTERS[next].title, act: () => startChapter(next) }, { label: "MAGPIE'S, THEN " + chLabel(next), col: COL.magenta, act: () => openShop("campNext") }, { label: "CAMPAIGN MENU", col: COL.dim, act: actions.toCamp }]
    : [{ label: "CAMPAIGN MENU", act: actions.toCamp }, { label: "MAGPIE'S", col: COL.magenta, act: () => { actions.toCamp(); openShop("title"); } }], next ? 196 : 212); runMenu(G.menu);
}
function drawChap(c, t) {
  drawCampBG(c, t); const C = G.camp, S = SAVE.camp, A = actOf(C.n), actEnd = A.chapters[A.chapters.length - 1] === C.n, last = C.n === maxChapter();
  txt(c, last ? "THE END" : actEnd ? `ACT ${A.n} COMPLETE` : "CHAPTER COMPLETE", GW / 2, 40, last && SAVE.camp.ending === "crown" ? COL.red : COL.cyan, 24, "center");
  txt(c, `${chLabel(C.n)} · ${C.ch.title}`, GW / 2, 72, COL.amber, 8, "center");
  txt(c, `TIME ${Math.floor(G.time / 60)}:${String(Math.floor(G.time % 60)).padStart(2, "0")}   ·   KILLS ${G.kills}   ·   +${G.runScrip || 0} SCRIP   ·   ${SAVE.scrip} BANKED`, GW / 2, 92, COL.ink, 8, "center");
  txt(c, S.shards[C.n] ? (C.gotShard ? "DATASHARD RECOVERED: " : "DATASHARD: ") + C.ch.shard.title : "DATASHARD MISSED · REPLAY THE CHAPTER TO FIND IT", GW / 2, 106, S.shards[C.n] ? COL.magenta : COL.dim, 8, "center");
  const shown = TRUSTS.filter(([k]) => k !== "dex" || S.flags.metDex); let x = GW / 2 - shown.length * 46;
  shown.forEach(([k, nm]) => { txt(c, nm, x, 126, COL.dim); trustPips(c, x + 40, 128, S.trust[k]); x += 92; });
  txt(c, "CORVUS RESONANCE " + S.res, GW / 2, 142, COL.red, 8, "center");
  if (last) drawEnding(c, t);
  const R = C.reward; if (R) { const pulse = .75 + .25 * Math.sin(t * .008), nm = rewardNames(R.items);
    if (last) txt(c, `ACT 5 REWARDS: ${nm} · +${R.scrip} SCRIP`, GW / 2, 197, rgba(COL.amber, pulse), 8, "center");
    else { txt(c, `ACT ${R.act} REWARDS: ${nm}`, GW / 2, 152, rgba(COL.amber, pulse), 8, "center");
      R.items.forEach((i, k) => txt(c, i.desc.toUpperCase(), GW / 2, 163 + k * 10, rgba(COL.ink, .85), 8, "center"));
      txt(c, `+${R.scrip} SCRIP · NEW WEAPON EQUIPPED · NOT SOLD AT MAGPIE'S · WORKS IN ARCADE TOO`, GW / 2, 165 + R.items.length * 10, COL.amber, 8, "center"); } }
  if (G.chapT > .8) drawMenu(c, G.menu, t);
}

/* ---- The ending card after Chapter 30 ---- */
const ENDINGS = { delete: ["DELETE · CLEAN SKY", "CORVUS IS GONE. THE CITY WAKES UP UNWATCHED.", "CLEAN SKY AFTERIMAGE"], crown: ["CROWN · MURDER OF ONE", "YOU ARE THE FLOCK NOW. SAINT VARROW BELONGS TO YOU.", "CORVUS RED OPTICS"],
  release: ["RELEASE · OPEN SKY", "THE MINDS SCATTER INTO THE NET, FREE. DEX SENDS ONE LAST MESSAGE.", "OPEN SKY COAT"] };
function drawEnding(c, t) {
  const S = SAVE.camp, E = ENDINGS[S.ending] || ENDINGS.delete, f = S.flags;
  txt(c, E[0], GW / 2, 156, S.ending === "crown" ? COL.red : COL.cyan, 8, "center"); txt(c, E[1], GW / 2, 166, rgba(COL.ink, .85), 8, "center");
  const fates = [f.forgaveMagpie ? "MAGPIE: FORGIVEN" : "MAGPIE: BEHIND GLASS", f.wrenDead ? "WREN: LOST" : f.freed ? "WREN: FREE" : "WREN: GONE", f.vaneKilled ? "VANE: DEAD" : f.vaneStacks ? "VANE: THE STACKS" : "VANE: SPARED", "RESONANCE " + S.res];
  txt(c, fates.join("   ·   "), GW / 2, 178, COL.dim, 8, "center"); txt(c, "UNLOCKED IN MAGPIE'S STYLE TAB: " + E[2], GW / 2, 188, COL.amber, 8, "center");
}
