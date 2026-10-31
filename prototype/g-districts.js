/* Districts, the Trace rule, Rookery hazards (wind, bridge collapse), and the Hexer, Nest and Augur. */
"use strict";
const DIST = {
  market: { n: 1, name: "RAIN MARKET", code: "D-01", amb: "market", next: "rookery",
    pool: [["shrike", 0, 3], ["corvid", 0, 2], ["rook", 1, 3], ["carrion", 2, 2], ["bulwark", 3, 1], ["jackdaw", 2, 1]],
    boss: "blackwing", bossName: "BLACKWING", bossLine: "WEAK POINT · THRUSTERS AFTER LANDING", bossTip: "WATCH THE SHADOW. MOVE WHEN IT LOCKS.", phaseTxt: "TRAM LINE LIVE" },
  rookery: { n: 2, name: "CHROME ROOKERY", code: "D-02", amb: "rookery", next: "x3",
    pool: [["corvid", 0, 4], ["shrike", 0, 2], ["rook", 0, 2], ["hexer", 1, 2], ["jackdaw", 1, 1], ["carrion", 2, 2], ["bulwark", 3, 1]],
    boss: "augur", bossName: "THE AUGUR", bossLine: "ONLY THE REAL ONE CASTS A SHADOW", bossTip: "HACK ANY COPY TO REVEAL IT. FAKES BITE BACK.", phaseTxt: "NORTH BRIDGE FAILING" },
};
// Title-screen entry for the endless chain. The real districts are x3, x4, x5… built on demand from the run seed.
DIST.endless = { n: 3, name: "ENDLESS SPRAWL", code: "D-03+" };
const DORDER = ["market", "rookery", "endless"];
const BOSSES = { blackwing: { bossName: "BLACKWING", bossLine: "WEAK POINT · THRUSTERS AFTER LANDING", bossTip: "WATCH THE SHADOW. MOVE WHEN IT LOCKS." },
  augur: { bossName: "THE AUGUR", bossLine: "ONLY THE REAL ONE CASTS A SHADOW", bossTip: "HACK ANY COPY TO REVEAL IT. FAKES BITE BACK." } };
// Endless district at a given depth: a generated style and map from the run seed, every enemy type, alternating bosses.
function getDist(key) {
  if (DIST[key]) return DIST[key];
  const depth = +key.slice(1), e = PG.endless(G.runSeed || 0, depth), boss = depth % 2 ? "blackwing" : "augur";
  return (DIST[key] = Object.assign({ n: depth, name: e.style.name, code: "D-" + String(depth).padStart(2, "0"), amb: e.style.amb, next: "x" + (depth + 1), endless: e, boss, phaseTxt: "",
    pool: [["shrike", 0, 3], ["corvid", 0, 3], ["rook", 0, 3], ["carrion", 1, 2], ["hexer", 1, 2], ["jackdaw", 1, 1], ["bulwark", 2, 2]] }, BOSSES[boss]));
}
function resetEndless() { Object.keys(DIST).forEach(k => { if (/^x\d+$/.test(k)) delete DIST[k]; }); }
const D = () => getDist(G.district);
const dk = () => G.kills - G.dStart;
const BOSSY = new Set(["blackwing", "augur", "holo", "nest"]);
const FLYING = new Set(["corvid", "hexer", "augur", "holo", "nest", "blackwing"]);

function perchSpot() { const g = groups(G.grid).find(x => x[0] === "S"); if (!g) return null; const [, x, y, w] = g; return { x: (x + w / 2) * TS, y: (y + 1) * TS + 6 }; }
// Generated maps are built per district from the run seed; classic maps use the hand-made layouts.
// G.mapRecipe is how co-op friends rebuild the same map on their side.
function chooseMap(key) {
  const gen = (style, seed) => { G.mapRecipe = { style, seed }; PG.generate(style, seed, "run"); return "run"; };
  if (G.chapMap) { const m = G.chapMap; if (m.key) { G.mapRecipe = { key: m.key }; return m.key; } return gen(storyStyle(m), m.seed); }
  if (/^x\d+$/.test(key)) { const e = getDist(key).endless; return gen(e.style, e.seed); }
  if (SAVE.mapMode === "gen" && G.runSeed != null) return gen(key, G.runSeed);
  G.mapRecipe = { key }; return key;
}
const mapName = () => G.mapKey === "run" ? MAPS.run.name : D().name;
function gapTiles() { const out = []; for (let y = 2; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) if (G.grid[y][x] === "o") out.push([x, y]); return out; }
function playerStart() { const o = MAPS[G.mapKey].ops.find(o => o[0] === "P"); return { x: o[1] * TS + 8, y: o[2] * TS + 12 }; }
function floorSpots(minFromPlayer) {
  const out = []; for (let y = 3; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) { const ch = G.grid[y][x]; if (WALK_BLOCK.has(ch) || ch === "o" || ch === "=") continue;
    const px = x * TS + 8, py = y * TS + 12; if (Math.hypot(px - G.p.x, py - G.p.y) > minFromPlayer) out.push({ x: px, y: py }); }
  return out;
}
// Enemies that a hit can't hurt right now.
function armored(e) { return (e.type === "blackwing" && e.state !== "vuln") || (e.type === "augur" && e.state === "appear") || (e.type === "nest" && e.state !== "open") || (e.type === "ferryman" && e.state !== "reel" && e.state !== "stuck") || (e.type === "cinder" && e.state !== "vent") || (e.type === "widow" && e.state !== "cab") || (e.type === "archivist" && e.state !== "exposed") || (e.type === "scarecrow" && e.state !== "call") || (e.type === "vanexo" && e.state !== "overheat") || (e.type === "choir" && e.state === "down") || (e.type === "corvina" && e.state !== "exposed"); }

/* Trace: stand still near the same spot for 4s and the Murder sends a flusher to the nearest door. */
function updateTrace(dt) {
  const p = G.p; if (G.range || G.boss || (G.stalls && G.stalls.some(S => S.fixing)) || (G.zone && G.zone.inside)) { G.trace = 0; return; } // no Trace while you reboot a rack or hold a zone
  if (!G.anchor || Math.hypot(p.x - G.anchor.x, p.y - G.anchor.y) > 22) { G.anchor = { x: p.x, y: p.y }; G.trace = Math.max(0, (G.trace || 0) - dt * 3); return; }
  G.trace = (G.trace || 0) + dt;
  if (G.trace >= 4) {
    G.trace = 0; G.anchor = null; G.pings.push({ x: p.x, y: p.y, life: 1 }); AU.sfx("hexer"); pop(p.x, p.y - 36, "TRACED", COL.magenta);
    const ds = doors().filter(d => Math.hypot(d.x - p.x, d.y - p.y) > 60).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    if (ds[0]) { G.pending.push({ type: G.heat >= 2 && Math.random() < .5 ? "carrion" : "shrike", x: ds[0].x, y: ds[0].y, t: .9, door: ds[0] }); AU.sfx("door", panOf(ds[0].x)); }
  }
}

/* Rookery wind: gusts across the chasm push bullets downward. */
function updateWind(dt) {
  const M = MAPS[G.mapKey]; if (!(G.district === "rookery" || (M && M.wind))) return; const w = G.wind || (G.wind = { on: false, t: 5 }); w.t -= dt;
  if (w.t <= 0) { w.on = !w.on; w.t = w.on ? 2.5 : rnd(4, 7); if (w.on) AU.sfx("vent"); }
  if (!w.on) return;
  for (const b of G.bul) if (tileOf(b.x, b.y) === "o") b.vy += 300 * dt; // gusts only push bullets over open drops
  const gap = G.gapTiles; if (gap && gap.length && Math.random() < .7) { const [gx, gy] = gap[Math.random() * gap.length | 0]; G.parts.push({ x: gx * TS + rnd(0, TS), y: gy * TS + rnd(0, TS), vx: rnd(20, 50), vy: rnd(140, 220), life: .3, max: .3, col: "#b9c2ff", g: 0 }); }
}

/* Rookery Phase 2: the north bridge cracks for 2.2s, then falls. */
function updateCollapse(dt) {
  const c = G.collapse; if (!c) return; c.t -= dt;
  if (c.t <= 0) { G.collapse = null; MAPS[G.mapKey].phase2.forEach(([ch, x, y, w = 1, h = 1]) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (ch === "o" || Math.hypot(i * TS + 8 - G.p.x, j * TS + 8 - G.p.y) > 20) G.grid[j][i] = ch; });
    G.dirty = true; AU.sfx("boom"); G.shake = 6; c.tiles.forEach(([x, y]) => fx(x * TS + 8, y * TS + 8, 10, ["#4a5070", "#9aa4c8", "#2a3048"], 70, .8)); G.gapTiles = gapTiles(); }
}

/* Hexer: keeps its distance, then hexes you (locks Overclock and hacking, scrambles the HUD). */
function updHexer(e, dt, d, see) {
  const p = G.p; e.face = p.x < e.x ? -1 : 1; e.alt = 4 + Math.sin((e.anim || 0) * 3) * 2;
  if (e.state === "walk") {
    if (d < 90) { const a = Math.atan2(e.y - p.y, e.x - p.x); moveBody(e, Math.cos(a) * 40 * dt, Math.sin(a) * 40 * dt); }
    else if (d > 150 || !see()) walk(e, 40, dt);
    if (e.t <= 0 && d < 170 && see()) { e.state = "cast"; e.t = .8 * tellK(); AU.sfx("hexer", panOf(e.x)); }
  } else if (e.state === "cast" && e.t <= 0) {
    if (see() && G.mode === "play") { G.hexed = 3; pop(p.x, p.y - 36, "HEXED", COL.magenta); AU.sfx("hexer"); rumble(.3, .6, 250); }
    e.state = "walk"; e.t = 4.5;
  }
}
/* Nest: wall-mounted spawner. Armoured except while it opens to release Corvids. */
function updNest(e, dt) {
  if (e.state === "closed") { if (e.t <= 0) { e.state = "open"; e.t = 1.4; AU.sfx("nest", panOf(e.x)); } }
  else if (e.t <= 0) { if (G.en.filter(x => x.alive && x.type === "corvid").length < 6) { spawnEnemy("corvid", e.x - 8, e.y + 10); spawnEnemy("corvid", e.x + 8, e.y + 10); }
    e.state = "closed"; e.t = Math.max(3, rnd(6, 9) - G.heat * .5); }
}
function spawnNests() { MAPS[G.mapKey].ops.filter(o => o[0] === "N").forEach(([, x, y]) => { const e = spawnEnemy("nest", x * TS + 9, y * TS + 17); e.tx = x; e.ty = y; e.state = "closed"; e.t = rnd(3, 6); }); }

/* THE AUGUR: splits into five copies; only the real one casts a shadow. */
function augurShuffle(e) {
  for (const h of G.en) if (h.type === "holo") h.alive = false;
  const spots = floorSpots(90).sort(() => Math.random() - .5), picked = [];
  for (const s of spots) { if (picked.every(q => Math.hypot(q.x - s.x, q.y - s.y) > 60)) picked.push(s); if (picked.length === 5) break; }
  picked.forEach((s, i) => { if (i === 0) { e.x = s.x; e.y = s.y; } else { const h = spawnEnemy("holo", s.x, s.y); h.boss = e; h.state = "appear"; h.t = .6; } });
  e.state = "appear"; e.t = .6; e.volley = 1.2; AU.sfx("hexer");
  fx(e.x, e.y - 20, 12, [COL.magenta, "#ffffff"], 60, .5);
}
function updAugur(e, dt) {
  const p = G.p; e.face = p.x < e.x ? -1 : 1; e.alt = 6 + Math.sin((e.anim || 0) * 2) * 2; e.reveal = Math.max(0, (e.reveal || 0) - dt);
  if (e.state === "appear") { if (e.t <= 0) { e.state = "idle"; e.t = 5; } return; }
  e.volley -= dt;
  if (e.volley <= 0) { e.volley = Math.max(.8, 1.4 - G.heat * .08);
    const copies = [e, ...G.en.filter(h => h.alive && h.type === "holo")].sort(() => Math.random() - .5).slice(0, 2);
    copies.forEach(c => { const a = Math.atan2(p.y - BODY - (c.y - 20), p.x - c.x); for (let k = -2; k <= 2; k++) shoot(c.x, c.y - 20, a + k * .16, 95, "e", { by: "augur" }); }); AU.sfx("shotE"); }
  if (e.t <= 0) augurShuffle(e);
}
function updHolo(e, dt) { e.face = G.p.x < e.x ? -1 : 1; e.alt = 6 + Math.sin((e.anim || 0) * 2 + 1) * 2; if (e.state === "appear" && e.t <= 0) e.state = "idle"; if (!e.boss || !e.boss.alive) e.alive = false; }
function holoPop(e, punish) {
  e.alive = false; fx(e.x, e.y - 20, 18, [COL.magenta, "#ffffff", COL.cyan], 80, .5); AU.sfx("hexer", panOf(e.x)); if (e.boss) e.boss.reveal = Math.max(e.boss.reveal || 0, 1.2);
  if (punish) { for (let i = 0; i < 10; i++) shoot(e.x, e.y - 20, i / 10 * TAU, 80, "e", { by: "augur" }); pop(e.x, e.y - 40, "FAKE", COL.magenta); }
}

function saveUnlock(n) { G.unlocked = Math.max(G.unlocked || 1, n); SAVE.unlocked = G.unlocked; persist(); }
