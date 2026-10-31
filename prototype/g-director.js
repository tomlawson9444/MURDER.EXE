/* Wave director, Heat, Phase 2 tram, and the BLACKWING boss. */
"use strict";

function doors() {
  const out = []; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (G.grid[y][x] === "s") {
    const sx = x === 0 ? 1 : x === MW - 1 ? MW - 2 : x, sy = (x === 0 || x === MW - 1) ? y : y + 1; out.push({ tx: x, ty: y, x: sx * TS + 8, y: sy * TS + 12 }); }
  return out;
}
function pickType() {
  const opts = ((G.rules && G.rules.pool) || D().pool).filter(([k, h]) => G.heat >= h && !(k === "jackdaw" && (!G.perch || G.en.some(e => e.alive && e.type === "jackdaw"))));
  const tot = opts.reduce((s, o) => s + o[2], 0); let r = Math.random() * tot; for (const o of opts) { r -= o[2]; if (r <= 0) return o[0]; } return "shrike";
}
function updateDirector(dt) {
  const alive = G.en.filter(e => e.alive && !BOSSY.has(e.type)).length;
  // Campaign chapters set their own Phase 2 and boss kill counts (null means never), and can add Heat over time.
  const R = G.rules || {}, p2At = "p2" in R ? R.p2 : 50, bossAt = "boss" in R ? R.boss : 100;
  G.heat = Math.min(5, G.heatBase + coopHeat() + Math.floor(dk() / 15) + (R.timeHeat && G.camp ? Math.floor(G.camp.t / R.timeHeat) : 0)); G.mult = (1 + G.heat * .5) * (G.p.egoUsed ? .5 : 1);
  if (G.heat !== G.lastHeat) { AU.setHeat(Math.min(5, G.heat + 2)); track("heat", G.heat); if (G.heat > (G.lastHeat || 0)) G.banner = { txt: "HEAT " + G.heat, col: COL.amber, life: 1.6 }; G.lastHeat = G.heat; }
  if (p2At != null && dk() >= p2At && !G.phase2) startPhase2();
  if (bossAt != null && dk() >= bossAt && !G.boss) { startBoss(); return; }
  if (G.boss && G.crew) { coopBossAdds(dt); for (const s of G.pending) { s.t -= dt; if (s.t <= 0) spawnEnemy(s.type, s.x, s.y); } G.pending = G.pending.filter(s => s.t > 0); }
  if (G.boss || (G.camp && G.camp.won)) return;
  if (dailyMod("heat") || dailyMod("bottomless")) G.heatBase = Math.max(G.heatBase, 3);
  G.spawnT -= dt; const cap = Math.round((3 + G.heat + (dk() > 70 ? 1 : 0) + Math.floor(Math.max(0, D().n - 2) / 3)) * (dailyMod("swarm") ? 1.5 : 1) * coopPressure()); // endless depth adds pressure; co-op adds more
  if (G.spawnT <= 0 && alive + G.pending.length < cap && !G.lull) {
    G.spawnT = Math.max(.6, 1.7 - G.heat * .2) / coopRate(); const type = pickType();
    if (type === "corvid") { const x = rnd(40, GW - 40); G.pending.push({ type, x, y: 34, t: .8, door: null }); AU.sfx("caw", panOf(x)); }
    else if (type === "jackdaw") { const ps = G.perch; if (ps) G.pending.push({ type, x: ps.x, y: ps.y, t: .8, door: null, perch: true }); }
    else { const far = doors().filter(d => allPlayers().every(q => Math.hypot(d.x - q.x, d.y - q.y) > 90)), ds = far.length ? far : doors().filter(d => Math.hypot(d.x - G.p.x, d.y - G.p.y) > 90); /* never on top of anyone */ const d = ds[Math.random() * ds.length | 0]; if (d) { G.pending.push({ type, x: d.x, y: d.y, t: .9, door: d }); AU.sfx("door", panOf(d.x)); } }
  }
  for (const s of G.pending) { s.t -= dt; if (s.t <= 0) spawnEnemy(s.type, s.x, s.y); }
  G.pending = G.pending.filter(s => s.t > 0);
}

function startPhase2() {
  const M = MAPS[G.mapKey]; G.phase2 = true; G.banner = { txt: M.phaseTxt || D().phaseTxt, col: COL.red, life: 2.2 };
  if (M.collapseTiles) { G.collapse = { t: 2.2, tiles: M.collapseTiles }; AU.sfx("sign"); return; }
  M.phase2.filter(o => o[0] !== "T").forEach(([ch, x, y]) => { if (Math.hypot(x * TS + 8 - G.p.x, y * TS + 8 - G.p.y) > 20) G.grid[y][x] = ch; });
  G.dirty = true; if (M.tramRow != null) G.tram = { state: "idle", t: 4, x: -300, row: M.tramRow };
}
function updateTram(dt) {
  const T = G.tram; if (!T) return; T.t -= dt;
  if (T.state === "idle" && T.t <= 0) { T.state = "warn"; T.t = 1.6; AU.sfx("bell"); }
  else if (T.state === "warn" && T.t <= 0) { T.state = "run"; T.x = -300; AU.sfx("tramRun"); }
  else if (T.state === "run") { T.x += 430 * dt; const y0 = T.row * TS - 2, y1 = (T.row + 1) * TS + 2;
    const inLane = o => o.y > y0 && o.y < y1 && o.x > T.x && o.x < T.x + 288;
    if (inLane(G.p)) playerDie("tram"); for (const e of G.en) if (e.alive && e.type !== "corvid" && inLane(e)) killEnemy(e, "tram");
    if (T.x > GW + 20) { T.state = "idle"; T.t = 12; } }
}

function startBoss() {
  G.boss = true; G.collapse && updateCollapse(99); for (const e of G.en) if (e.alive && e.type !== "nest") { e.alive = false; fx(e.x, e.y - 10, 8, ["#2a2440", COL.magenta], 50, .5); }
  G.pending = []; G.bul = []; G.mode = "intro"; G.introT = 0; AU.sfx("caw"); AU.setHeat(5);
}
function updateBoss(e, dt, d) {
  const p = G.p; e.face = p.x < e.x ? -1 : 1;
  if (e.state === "air") { e.alt = Math.min(200, e.alt + 300 * dt); if (e.t <= 0) { e.state = "target"; e.t = 1.0; e.x = p.x; e.y = p.y; } }
  else if (e.state === "target") { e.x += (p.x - e.x) * Math.min(1, dt * 5); e.y += (p.y - e.y) * Math.min(1, dt * 5); if (e.t <= 0) { e.state = "lock"; e.t = .55; AU.sfx("charge", panOf(e.x)); } }
  else if (e.state === "lock") { e.alt = 200 * (e.t / .55); if (e.t <= 0) {
      e.state = "vuln"; e.t = .8; e.alt = 0; e.cycles++; AU.sfx("land", panOf(e.x)); rumble(1, .7, 350); G.shake = 7; fx(e.x, e.y, 30, ["#9a98b8", "#2a2440", COL.amber], 110, .7);
      if (Math.hypot(p.x - e.x, p.y - e.y) < 26) playerDie("blackwing");
      const n = 8 + Math.min(6, e.cycles); for (let i = 0; i < n; i++) shoot(e.x, e.y - 8, i / n * TAU + e.cycles * .3, 75, "e", { by: "blackwing" });
      if (e.cycles % 3 === 0) { spawnEnemy("corvid", rnd(60, GW - 60), 30); spawnEnemy("corvid", rnd(60, GW - 60), 30); } } }
  else if (e.state === "vuln") { if (e.t <= 0) { e.state = "rise"; e.t = .4; } }
  else if (e.state === "rise") { e.alt += 400 * dt; if (e.t <= 0) { e.state = "air"; e.t = Math.max(.5, 1.2 - e.cycles * .08); } }
}
