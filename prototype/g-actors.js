/* Player, enemies, bullets, explosions. Positions are feet positions in native pixels. */
"use strict";
const NAMES = { shrike: "SHRIKE", rook: "ROOK", jackdaw: "JACKDAW", carrion: "CARRION", corvid: "CORVID", bulwark: "BULWARK", blackwing: "BLACKWING", blast: "BLAST", tram: "THE TRAM", hole: "THE DROP" };
const BODY = 10; // feet → body centre height

function newPlayer(x, y) { return { x, y, r: 4, face: 1, ammo: 6, reload: 0, fireCd: 0, dash: 0, dashCd: 0, dx: 0, dy: 0, iframes: 0, oc: 50, ram: 6, trail: [], moving: false }; }

function fx(x, y, n, cols, sp = 60, life = .5) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (.3 + Math.random()); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: life * (.5 + Math.random()), max: life, col: cols[i % cols.length], g: 120 }); } }
function pop(x, y, txt, col = COL.ink) { G.texts.push({ x, y, txt, col, life: .9 }); }

function playerDie(by) {
  const p = G.p; if (G.mode !== "play" || p.iframes > 0 || G.god) return;
  if (hasImp("backup") && !p.egoUsed) { p.egoUsed = true; p.iframes = 2; G.bul = G.bul.filter(b => b.owner === "p"); G.shake = 6; rumble(1, 1, 300);
    fx(p.x, p.y - BODY, 30, [COL.cyan, "#ffffff"], 90, .8); G.banner = { txt: "BACKUP EGO RESTORED · MULTIPLIER HALVED", col: COL.cyan, life: 2.4 }; AU.sfx("ocSnap"); return; }
  if (hasImp("aegis") && p.aegis) { p.aegis = false; p.aegisK = 0; p.iframes = 1.6; G.bul = G.bul.filter(b => b.owner === "p"); G.shake = 6; rumble(1, 1, 300); AU.sfx("ocSnap");
    if ((by === "hole" || by === "vent") && p.safe) { p.x = p.safe.x; p.y = p.safe.y; }
    fx(p.x, p.y - BODY, 26, [COL.amber, "#ffffff"], 80, .6); G.banner = { txt: "AEGIS LATTICE BROKEN · 20 KILLS TO RECHARGE", col: COL.amber, life: 2 }; return; }
  if (campShield(by)) return;
  rumble(1, 1, 600); G.mode = "dead"; G.deadT = 0; G.killer = (by === "hole" && G.dropName) || NAMES[by] || by; fx(p.x, p.y - BODY, 30, [COL.cyan, COL.magenta, "#ffffff"], 90, .9);
  AU.sfx("flatline"); AU.stop(); AU.setOC(false); G.oc = null; G.shake = 6;
  G.best = Math.max(G.best || 0, G.score); SAVE.best = G.best; persist();
}

// Freeze every non-boss enemy within r of (x, y) for secs (Cryo Pistol, Cryo Core, BLACKOUT).
function stunAround(x, y, r, secs) { for (const e of G.en) if (e.alive && !BOSSY.has(e.type) && Math.hypot(e.x - x, e.y - y) < r) { e.stun = Math.max(e.stun || 0, secs); fx(e.x, e.y - 12, 6, ["#9ff3ff", "#ffffff"], 40, .4); } }
// Rounds that fly out in a ring from a kill (Requiem feathers, MIRRORSHARD shards).
function ringShots(x, y, n, col) { const off = Math.random() * TAU; for (let k = 0; k < n; k++) shoot(x, y - 4, off + k / n * TAU, 380, "p", { life: .45, col }); fx(x, y, 12, [col, "#2a2440"], 80, .4); }
function killEnemy(e, how) {
  if (!e.alive) return;
  if (e.type === "holo") return holoPop(e, how !== "hack");
  e.alive = false; if (e.type === "wrenc") wrenDown();
  if (e.type === "nest") { G.grid[e.ty][e.tx] = "#"; G.dirty = true; fx(e.x, e.y - 10, 30, [COL.red, COL.magenta, "#2a2440"], 90, .8); AU.sfx("crateBreak", panOf(e.x)); }
  if (how === "fall") pop(e.x, e.y - 20, "FELL", COL.amber);
  if (e.type === "carrion" && how !== "blast") { explode(e.x, e.y - 6, 34, "carrion"); }
  const pts = Math.round((e.type === D().boss ? 5000 : e.type === "nest" ? 500 : 100) * G.mult); G.score += pts; G.kills += e.type === "corvid" || e.type === "blackwing" ? 1 : 1;
  if (hasImp("aegis") && !G.p.aegis && ++G.p.aegisK >= 20) { G.p.aegis = true; pop(G.p.x, G.p.y - 34, "AEGIS READY", COL.amber); AU.sfx("lock", 4); }
  if (how === "oc" && G.p.ocId === "crown") G.p.ocRefund = (G.p.ocRefund || 0) + 6;
  G.p.oc = Math.min(G.p.ocMax, G.p.oc + (hasImp("overcharger") ? 13 : 8));
  if (how === "hack" && hasImp("cryocore")) stunAround(e.x, e.y, 54, 2);
  if (hasImp("berserk") && (G.p.streak + 1) % 8 === 0) { G.p.berserk = 4; pop(G.p.x, G.p.y - 34, "BERSERK", COL.red); AU.sfx("charge"); } G.p.ram = Math.min(G.p.ramMax, G.p.ram + .5); G.p.streak = (G.p.streak || 0) + 1;
  if (!G.range) { earn(scripFor(e) * (hasImp("bounty") ? 1.4 : 1) * (G.scripMul || 1)); track("kill", e.type); } else G.range.kills++; /* the firing range pays nothing */ if (how === "fall") track("fall"); if (how === "hack") track("hack"); if (G.blastCount != null && how === "blast") G.blastCount++;
  fx(e.x, e.y - (e.alt || 0) - 8, 16, [COL.magenta, "#2a2440", "#f0ebf6"], 70, .6); pop(e.x, e.y - 26 - (e.alt || 0), "+" + pts);
  AU.sfx("kill", panOf(e.x)); rumble(.4, .3, 90); if (Math.random() < .5) AU.sfx("caw", panOf(e.x)); G.hitstop = .035;
  if (e.type === D().boss && G.camp) { for (const h of G.en) if (h.type === "holo") h.alive = false; earn(200); return campWin(); }
  if (e.type === D().boss) { for (const h of G.en) if (h.type === "holo") h.alive = false; G.bul = []; G.mode = "clear"; G.clearT = 0; earn(200); track("clear", G.district); if (D().next) saveUnlock(getDist(D().next).n); AU.sfx("milestone"); G.best = Math.max(G.best || 0, G.score); SAVE.best = G.best; persist(); }
}

function explode(x, y, r, src, safe) {
  const outer = G.blastCount == null; if (outer) G.blastCount = 0;
  G.blasts.push({ x, y, r, life: .35 }); rumble(.9, .6, 300); G.shake = Math.max(G.shake, 5); AU.sfx("boom", panOf(x));
  fx(x, y, 34, [COL.amber, "#fff0c8", COL.red, "#2a2440"], 120, .8);
  for (const e of G.en) if (e.alive && Math.hypot(e.x - x, e.y - y) < r && !BOSSY.has(e.type)) killEnemy(e, "blast");
  if (!safe && Math.hypot(G.p.x - x, G.p.y - y) < r) playerDie("blast");
  if (src !== "kiln") blastStalls(x, y, r); // your own Kiln Rounds never hurt what you are guarding
  if (outer) { track("blast", G.blastCount); G.blastCount = null; }
  const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
  for (let j = ty - 1; j <= ty + 1; j++) for (let i = tx - 1; i <= tx + 1; i++) { const ch = G.grid.at(i, j); if (ch === "c") breakTile(i, j); if (ch === "b" && !(i === tx && j === ty)) setTimeout(() => G.grid.at(i, j) === "b" && detonateBarrel(i, j), 120); }
}
function breakTile(i, j) { G.grid[j][i] = "."; G.dirty = true; fx(i * TS + 8, j * TS + 8, 14, ["#6e62a2", "#4a4274", "#b08a3a"], 60, .6); AU.sfx("crateBreak", panOf(i * TS)); }
function detonateBarrel(i, j) { G.grid[j][i] = "."; G.dirty = true; explode(i * TS + 8, j * TS + 10, 34, "barrel"); }
function dropSign(i, j) { G.grid[j][i] = "h"; G.dirty = true; AU.sfx("sign"); G.shake = 4; const x = i * TS + 8, y = j * TS + 10;
  fx(x, y, 20, [COL.magenta, COL.cyan, "#ffffff"], 80, .7); for (const e of G.en) if (e.alive && Math.abs(e.x - x) < 20 && Math.abs(e.y - y) < 16) killEnemy(e, "blast"); if (Math.abs(G.p.x - x) < 14 && Math.abs(G.p.y - y) < 12) playerDie("blast"); }

function shoot(x, y, a, spd, owner, o = {}) { G.bul.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, owner, d: 0, life: o.life || 2.5, rail: o.rail, grazed: false, by: o.by, seek: o.seek || 0, pierce: o.pierce || 0, bounce: o.bounce || 0, hits: [], col: o.col, big: o.big, homing: o.homing, feathers: o.feathers, blast: o.blast, arc: o.arc, freeze: o.freeze, vamp: o.vamp, split: o.split }); }
// The traits a gun's rounds carry.
function shotOpts(g, focus) { return { pierce: g.pierce, bounce: g.bounce, life: g.life, col: g.col, big: g.big, homing: g.homing, feathers: g.feathers, blast: g.blast, arc: g.arc, freeze: g.freeze, vamp: g.vamp, split: g.split }; }

/* ---- Player ---- */
function updatePlayer(dt, rdt) {
  const p = G.p; p.iframes = Math.max(0, p.iframes - dt); p.fireCd -= dt; p.dashCd -= dt; p.tollCd = (p.tollCd || 0) - dt; p.shockCd = (p.shockCd || 0) - dt; p.berserk = Math.max(0, (p.berserk || 0) - dt);
  p.ram = Math.min(p.ramMax, p.ram + dt * .25);
  if (hasImp("redline") && p.oc > 0) p.oc = Math.max(0, p.oc - dt * 1.5);
  if (G.oc) return;
  let mx = (held("d") || held("arrowright") ? 1 : 0) - (held("a") || held("arrowleft") ? 1 : 0), my = (held("s") || held("arrowdown") ? 1 : 0) - (held("w") || held("arrowup") ? 1 : 0);
  let ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; }
  if (PAD.active && PAD.mag > 0) { mx = PAD.mx; my = PAD.my; ml = Math.hypot(mx, my); }
  p.face = mouse.x < p.x ? -1 : 1;
  if ((hit(" ") || hit("shift")) && p.dashCd <= 0 && p.dash <= 0) { const dx = ml ? mx / ml : p.face, dy = ml ? my / ml : 0; p.dash = .16; p.dx = dx; p.dy = dy; p.dashCd = hasImp("reflex") ? .28 : .4; p.iframes = hasImp("phase") ? .32 : .22; AU.sfx("dash"); track("dash"); rumble(0, .35, 120); }
  if (p.dash > 0) { p.dash -= dt; const s = (hasImp("reflex") ? 315 : 370) * (hasImp("phase") ? 1.25 : 1) * dt;
    if (hasImp("static")) { const n0 = G.bul.length; G.bul = G.bul.filter(q => q.owner === "p" || q.owner === "a" || Math.hypot(q.x - p.x, q.y - (p.y - BODY)) > 36); if (G.bul.length < n0) fx(p.x, p.y - BODY, 6, ["#9ff3ff", "#ffffff"], 60, .3); } moveBody(p, p.dx * s, p.dy * s, true); p.trail.push({ x: p.x, y: p.y, life: .2 }); G.parts.push({ x: p.x + rnd(-6, 6), y: p.y - rnd(2, 26), vx: -p.dx * 120, vy: -p.dy * 120, life: .18, max: .18, col: COL.cyan, g: 0 });
    if (hasImp("toll") && (p.tollCd || 0) <= 0) { const v = G.en.find(e => e.alive && !BOSSY.has(e.type) && !armored(e) && e.type !== "holo" && e.type !== "echo" && Math.hypot(e.x - p.x, e.y - p.y) < 13); if (v) { p.tollCd = 1; killEnemy(v, "dash"); fx(v.x, v.y - 10, 14, [COL.amber, "#ffffff"], 80, .4); AU.sfx("impactMetal", panOf(v.x)); } }
    if (p.dash <= 0 && hasImp("shockdash") && (p.shockCd || 0) <= 0) { p.shockCd = 4; explode(p.x, p.y - 6, 30, "dash", true); }
    if (p.dash <= 0) { let n = 0; while (boxBlocked(p.x, p.y, p.r, false) && n++ < 20) { p.x += p.dx * 2; p.y += p.dy * 2; } if (boxBlocked(p.x, p.y, p.r, false)) { p.x -= p.dx * 40; p.y -= p.dy * 40; } } }
  else { const od = hasImp("overdrive") ? 1 + Math.min(.25, Math.floor((p.streak || 0) / 10) * .05) : 1; const ad = hasImp("adrenal") ? 1.12 : 1; moveBody(p, mx * 112 * od * ad * dt, my * 112 * od * ad * dt); }
  if (ml > 0 || p.dash > 0) p.still = 0; else { p.still = (p.still || 0) + dt; if (p.still > 2) p.streak = 0; }
  p.moving = ml > 0 || p.dash > 0;
  if (ml > 0 && p.dash <= 0) { p.stepT = (p.stepT || 0) - dt; if (p.stepT <= 0) { AU.sfx("step", panOf(p.x)); p.stepT = .24; if (tileOf(p.x, p.y) === "w") fx(p.x, p.y, 3, ["#9aa4c8"], 30, .25); } }
  p.trail.forEach(t => t.life -= dt); p.trail = p.trail.filter(t => t.life > 0);
  if (p.dash <= 0 && tileOf(p.x, p.y) === "o") playerDie("hole");
  if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { p.ammo = p.gun.mag; } }
  else if (hit("r") && p.ammo < p.gun.mag) { p.reload = p.gun.reload; AU.sfx("reload"); }
  if ((hit("lmb") || fireHeld()) && p.reload <= 0 && p.fireCd <= 0) { // holding keeps firing at the gun's own rate
    if (p.ammo > 0) { const g = p.gun, gx = p.x + p.face * 12, gy = p.y - BODY - 2, a = Math.atan2(mouse.y - gy, mouse.x - gx), last = p.ammo === 1 && hasImp("trigger");
      const focus = hasImp("focus") && (p.still || 0) > .5;
      for (let k = 0; k < g.pellets; k++) shoot(gx, gy, a + (g.pellets > 1 ? (k / (g.pellets - 1) - .5) * g.spread * 2 : 0) + rnd(-g.spread, g.spread) * (g.pellets > 1 ? .3 : 1), g.speed * (g.pellets > 1 ? rnd(.9, 1.1) : 1) * (focus ? 1.5 : 1), "p", Object.assign(shotOpts(g, focus), { pierce: g.pierce + (last ? 2 : 0) + (focus ? 1 : 0) }));
      if (hasImp("twin")) shoot(gx, gy, a + .12, g.speed * (focus ? 1.5 : 1), "p", shotOpts(g, focus));
      for (let k = 1; k < (g.burst || 0); k++) G.echoShots.push({ t: k * .07, a, burst: 1 });
      if (g.echo) (G.echoShots || (G.echoShots = [])).push({ t: g.echo, a }); // the Archive Repeater fires every shot again a beat later
      p.ammo--; p.fireCd = g.cd * (p.berserk > 0 ? .5 : 1); const gk = "gun_" + p.gunId; AU.sfx(AU.has(gk) ? gk : g.sfx === "rail" ? "rail" : "kestrel", 0); if (g.kick) G.shake = Math.max(G.shake, g.kick); rumble(.25, .5, 70); G.flash = .06; G.shake = Math.max(G.shake, 1.6); G.kick = { x: -Math.cos(a) * 2, y: -Math.sin(a) * 2, t: .06 }; for (let k = 0; k < 5; k++) { const sa = a + rnd(-.5, .5), sv = rnd(60, 160); G.parts.push({ x: gx, y: gy, vx: Math.cos(sa) * sv, vy: Math.sin(sa) * sv, life: .12, max: .12, col: k % 2 ? COL.cyan : "#ffffff", g: 0 }); } if (p.ammo === 1) AU.sfx("lastRound"); if (p.ammo === 0) { p.reload = g.reload; AU.sfx("reload"); } }
  }
  for (const q of G.echoShots || []) { q.t -= dt; if (q.t <= 0) { const g = p.gun, gx = p.x + p.face * 12, gy = p.y - BODY - 2; if (q.burst) shoot(gx, gy, q.a + rnd(-.03, .03), g.speed, "p", shotOpts(g)); else shoot(gx, gy, q.a, g.speed, "p", { life: g.life, col: "#9fd8ff" }); AU.sfx("kestrel", 0); fx(gx, gy, 4, [q.burst ? COL.cyan : "#9fd8ff", "#ffffff"], 50, .15); } }
  if (G.echoShots) G.echoShots = G.echoShots.filter(q => q.t > 0);
  if (hit("q")) hack();
  if ((hit("rmb") || hit("f")) && p.oc >= 50 && G.hexed > 0) { AU.sfx("hackFail"); pop(p.x, p.y - 30, "HEXED", COL.magenta); }
  else if ((hit("rmb") || hit("f")) && p.oc >= 50) { G.oc = { locks: [], t: 0 }; p.oc -= 50; track("oc", 0); AU.sfx("ocIn"); AU.setOC(true); }
}
function updateOC(rdt) {
  const o = G.oc; o.t += rdt;
  // Pad quick-lock (Y / RB): the nearest unlocked enemy to the cursor.
  if (hit("oclock") && o.locks.length < G.p.maxLocks) { const n = G.en.filter(e => e.alive && !o.locks.includes(e) && !e.dummyHidden).sort((a, b) => Math.hypot(a.x - mouse.x, a.y - mouse.y) - Math.hypot(b.x - mouse.x, b.y - mouse.y))[0]; if (n) { o.locks.push(n); AU.sfx("lock", o.locks.length - 1); mouse.x = n.x; mouse.y = n.y - (n.alt || 0) - 10; } }
  for (const e of G.en) if (e.alive && o.locks.length < G.p.maxLocks && !o.locks.includes(e) && Math.hypot(e.x - mouse.x, e.y - (e.alt || 0) - 10 - mouse.y) < 14) { o.locks.push(e); AU.sfx("lock", o.locks.length - 1); }
  if (!ocHeld() || o.t > 3) {
    const p = G.p, gx = p.x + p.face * 12, gy = p.y - BODY - 2; G.tracers = [];
    // Pad: a quick tap of the trigger locks the nearest enemies you can see and fires at once.
    if (PAD.active && !o.locks.length && o.t < .35) o.locks = G.en.filter(e => e.alive && los(gx, gy, e.x, e.y - BODY - (e.alt || 0), 1e9)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, p.maxLocks);
    const prog = p.ocId; if (o.locks.length >= 6) { SAVE.stats.ocFull++; checkMilestones(); }
    p.ocRefund = 0; G.scripMul = prog === "reaper" ? 3 : 1;
    o.locks.forEach(e => { G.tracers.push({ x0: gx, y0: gy, x1: e.x, y1: e.y - (e.alt || 0) - 10, life: .25 });
      if (prog === "crown" && e.alive && e.hp > 1) { hurtBoss(e); return; } // the crown cracks a story boss's armour; the last hit is still yours to land
      if (armored(e)) { AU.sfx("bulwark"); return; }
      if (prog === "swarm") { const ex = e.x, ey = e.y - 6; killEnemy(e, "oc"); explode(ex, ey, 30, "swarm"); } // every lock detonates, even if a neighbour's blast got it first
      else if (prog === "arc") { killEnemy(e, "oc"); arcFrom(e, 2, "oc"); }
      else if (prog === "hydra") { killEnemy(e, "oc"); arcFrom(e, 4, "oc"); }
      else if (prog === "nova") { const ex = e.x, ey = e.y - 6; killEnemy(e, "oc"); explode(ex, ey, 42, "nova", true); }
      else if (prog === "mirror") { const ex = e.x, ey = e.y - 6; killEnemy(e, "oc"); ringShots(ex, ey, 6, "#9ff3ff"); }
      else if (prog === "leech") { killEnemy(e, "oc"); p.ocRefund = (p.ocRefund || 0) + 12; p.ram = Math.min(p.ramMax, p.ram + 1); }
      else killEnemy(e, "oc"); });
    G.scripMul = 1;
    if (prog === "blackout") { G.bul = G.bul.filter(q => q.owner === "p" || q.owner === "a"); stunAround(p.x, p.y, 9999, 1.5); G.flash = .2; }
    if (prog === "bastion") { p.iframes = 2.5; p.ram = p.ramMax; fx(p.x, p.y - BODY, 30, [COL.amber, "#ffffff"], 90, .7); pop(p.x, p.y - 36, "BASTION", COL.amber); }
    if (prog === "ghost" && o.locks.length) { const t = o.locks[o.locks.length - 1]; if (!boxBlocked(t.x, t.y, p.r, false) && tileOf(t.x, t.y) !== "o") { fx(p.x, p.y - 12, 16, [COL.cyan, "#ffffff"], 60, .4); p.trail.push({ x: p.x, y: p.y, life: .3 }); p.x = t.x; p.y = t.y; p.iframes = .6; fx(p.x, p.y - 12, 16, [COL.cyan, "#ffffff"], 60, .4); } }
    AU.sfx("ocFire", o.locks.length); rumble(.8, .8, 220); if (!o.locks.length) p.oc = Math.min(p.ocMax, p.oc + 50); else if (p.ocRefund) { p.oc = Math.min(p.ocMax, p.oc + p.ocRefund); pop(p.x, p.y - 34, "+" + p.ocRefund + " OC", COL.red); p.ocRefund = 0; }
    p.ammo = p.gun.mag; p.reload = 0; G.oc = null; AU.setOC(false); G.shake = 3;
  }
}
// With a pad the reticle is only a point along your aim, so an enemy in the aim direction beats a barrel or sign that happens to sit under it.
function hackPick() { const t = hackTarget(); if (!PAD.active || (t && t.kind !== "b" && t.kind !== "n")) return t; const p = G.p; return padHackTarget(p.x + p.face * 12, p.y - BODY - 2) || t; }
// What Q would hit right now: the nearest enemy under the cursor, else a barrel or sign near it.
function hackTarget() {
  let best = null, bd = 22;
  for (const e of G.en) { if (!e.alive) continue; const ey = e.y - BODY - (e.alt || 0), d = Math.hypot(e.x - mouse.x, ey - mouse.y);
    if (d < bd && !(e.type === "blackwing" && e.state !== "vuln") && !(["ferryman", "cinder", "widow", "archivist", "scarecrow", "vanexo", "choir", "corvina"].includes(e.type) && armored(e))) { bd = d; best = { kind: "enemy", e, x: e.x, y: ey, r: BOSSY.has(e.type) && e.type !== "nest" ? 18 : 10 }; } }
  if (best) return best;
  for (const S of G.stalls || []) { const d = Math.hypot(S.x - mouse.x, S.y - 14 - mouse.y); if (S.kind === "rack" && !S.dead && S.hp < S.max && d < 16) return { kind: "rack", S, x: S.x, y: S.y - 14, r: 11 }; }
  for (const g of G.gates || []) { const d = Math.hypot(g.x - mouse.x, g.y - 13 - mouse.y); if (!g.done && d < 18) return { kind: "gate", g, x: g.x, y: g.y - 13, r: 9 }; }
  const tx = Math.floor(mouse.x / TS), ty = Math.floor(mouse.y / TS); let td = 99;
  for (let j = ty - 1; j <= ty + 1; j++) for (let i = tx - 1; i <= tx + 1; i++) { const ch = G.grid.at(i, j); if (ch !== "b" && ch !== "n") continue;
    const cx = i * TS + 8, cy = j * TS + (ch === "n" ? 2 : 10), d = Math.hypot(cx - mouse.x, cy - mouse.y); if (d < td && d < 26) { td = d; best = { kind: ch, i, j, x: cx, y: cy, r: 9 }; } }
  return best;
}
function hack() {
  const p = G.p; if (G.hexed > 0) { AU.sfx("hackFail"); pop(p.x, p.y - 30, "HEXED", COL.magenta); return; }
  if (p.ram < 3) { AU.sfx("hackFail"); pop(p.x, p.y - 30, "NEED 3 RAM", COL.magenta); return; }
  const tg = hackPick(); if (!tg) { AU.sfx("hackFail"); pop(mouse.x, mouse.y - 10, "AIM AT A TARGET", COL.dim); return; }
  p.ram -= 3; AU.sfx("circuit"); G.zaps.push({ x0: p.x, y0: p.y - 14, x1: tg.x, y1: tg.y, life: .22 });
  if (tg.kind === "b") return detonateBarrel(tg.i, tg.j);
  if (tg.kind === "n") return dropSign(tg.i, tg.j);
  if (tg.kind === "rack") { tg.S.hp = Math.min(tg.S.max, tg.S.hp + 30); pop(tg.x, tg.y - 16, "RACK +30", COL.cyan); fx(tg.x, tg.y, 14, [COL.cyan, "#ffffff"], 60, .5); return; }
  if (tg.kind === "gate") { gateProgress(tg.g, .45); pop(tg.x, tg.y - 16, "GATE +45%", COL.cyan); return; }
  if (tg.e.type === "wrenc") return freeWren(tg.e);
  if (tg.e.hp > 1) return hurtBoss(tg.e);
  if (tg.e.type === "augur") { tg.e.reveal = 2.5; pop(tg.x, tg.y - 24, "REVEALED", COL.magenta); return; }
  if (tg.e.type === "holo") { const bs = tg.e.boss; killEnemy(tg.e, "hack"); if (bs) { bs.reveal = 2.5; pop(bs.x, bs.y - 44, "REAL", COL.magenta); } return; }
  if (tg.e.type === "nest") return killEnemy(tg.e, "hack");
  // Fry the target's implants, then arc to up to 2 nearby enemies.
  fx(tg.e.x, tg.y, 10, [COL.magenta, "#ffffff"], 70, .4); killEnemy(tg.e, "hack"); const n = arcFrom(tg.e, 2, "hack");
  if (n) pop(tg.x, tg.y - 22, "ARC x" + (n + 1), COL.magenta);
}
// Chain lightning from a target to up to n nearby enemies. Returns how many it hit.
function arcFrom(src, n, how) {
  const hitList = [src]; let from = src;
  for (let k = 0; k < n; k++) { let nx = null, nd = 46;
    for (const e of G.en) { if (!e.alive || hitList.includes(e) || BOSSY.has(e.type)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y); if (d < nd) { nd = d; nx = e; } }
    if (!nx) break; G.zaps.push({ x0: from.x, y0: from.y - BODY - (from.alt || 0), x1: nx.x, y1: nx.y - BODY - (nx.alt || 0), life: .22 }); hitList.push(nx); from = nx; }
  hitList.slice(1).forEach(e => { fx(e.x, e.y - BODY - (e.alt || 0), 10, [COL.magenta, "#ffffff"], 70, .4); killEnemy(e, how); });
  return hitList.length - 1;
}

/* ---- Enemies ---- */
function spawnEnemy(type, x, y) {
  const e = { type, x, y, r: 4, alive: true, state: "walk", t: 0, face: 1, alt: 0, id: Math.random() };
  if (type === "corvid") { e.alt = 14; e.state = "circle"; e.t = rnd(1.5, 3); e.ang = Math.random() * TAU; }
  if (type === "jackdaw") { e.state = "idle"; e.t = 1; }
  if (type === "bulwark") { e.dir = Math.atan2(G.p.y - y, G.p.x - x); }
  if (type === "blackwing") { e.state = "air"; e.t = 1.2; e.alt = 200; e.cycles = 0; }
  if (type === "hexer") { e.t = 1.5; }
  G.en.push(e); return e;
}
function walk(e, spd, dt) { if (e.raid && G.camp && raidMove(e, spd, dt)) return; const [dx, dy] = flowDir(e); moveBody(e, dx * spd * dt, dy * spd * dt); if (dx) e.face = dx < 0 ? -1 : 1; }
function updateEnemy(e, dt) {
  const p = G.p, d = Math.hypot(p.x - e.x, p.y - e.y), ang = Math.atan2(p.y - e.y, p.x - e.x); e.t -= dt; e.anim = (e.anim || 0) + dt;
  const see = () => los(e.x, e.y - BODY, p.x, p.y - BODY);
  if (!FLYING.has(e.type) && tileOf(e.x, e.y) === "o") { fx(e.x, e.y - 6, 10, ["#2a2440", COL.magenta], 40, .5); return killEnemy(e, "fall"); }
  if (e.stun > 0 && !BOSSY.has(e.type)) { e.stun -= dt; return; } // frozen solid
  if (e.dummy) { e.face = p.x < e.x ? -1 : 1; e.dir = ang; return; } // firing-range target: stands still, never shoots
  switch (e.type) {
    case "hexer": updHexer(e, dt, d, see); break;
    case "nest": updNest(e, dt); break;
    case "augur": updAugur(e, dt); break;
    case "holo": updHolo(e, dt); break;
    case "shrike":
      if (e.state === "walk") { walk(e, 58, dt); if (d < 52 && see()) { e.state = "crouch"; e.t = .4 * tellK(); e.la = ang; AU.sfx("crouch", panOf(e.x)); } }
      else if (e.state === "crouch") { e.la = ang; if (e.t <= 0) { e.state = "lunge"; e.t = .28; AU.sfx("lunge", panOf(e.x)); } }
      else if (e.state === "lunge") { if (moveBody(e, Math.cos(e.la) * 270 * dt, Math.sin(e.la) * 270 * dt)) e.t = 0; e.face = Math.cos(e.la) < 0 ? -1 : 1; if (d < 9) playerDie("shrike"); if (e.t <= 0) { e.state = "rec"; e.t = .7; } }
      else if (e.t <= 0) e.state = "walk";
      break;
    case "rook":
      e.face = p.x < e.x ? -1 : 1;
      if (e.state === "walk") { if (d > 130 || !see()) walk(e, 44, dt); else { e.state = "aim"; e.t = .4; AU.sfx("glint", panOf(e.x)); } }
      else if (e.state === "aim") { if (e.t <= 0) { e.state = "burst"; e.n = 3; e.t = 0; } }
      else if (e.state === "burst") { if (e.t <= 0) { const gx = e.x + e.face * 12, gy = e.y - BODY - 2; shoot(gx, gy, Math.atan2(p.y - BODY - gy, p.x - gx) + rnd(-.07, .07), 135, "e", { by: "rook" }); AU.sfx("shotE", panOf(e.x)); e.t = .11; if (--e.n <= 0) { e.state = "cool"; e.t = 1.5; e.strafe = Math.random() < .5 ? 1 : -1; } } }
      else { moveBody(e, Math.cos(ang + Math.PI / 2 * e.strafe) * 22 * dt, Math.sin(ang + Math.PI / 2 * e.strafe) * 22 * dt); if (e.t <= 0) e.state = "walk"; }
      break;
    case "jackdaw":
      e.face = p.x < e.x ? -1 : 1;
      if (e.state === "idle") { if (e.t <= 0 && see()) { e.state = "charge"; e.t = 1.2 * tellK(); e.la = ang; AU.sfx("charge", panOf(e.x)); } }
      else if (e.state === "charge") { if (e.t > .35) e.la = Math.atan2(p.y - BODY - (e.y - BODY - 6), p.x - e.x); if (e.t <= 0) { shoot(e.x, e.y - BODY - 6, e.la, 520, "e", { rail: true, by: "jackdaw" }); AU.sfx("rail", panOf(e.x)); e.state = "idle"; e.t = 2.2; } }
      break;
    case "carrion":
      if (e.state === "walk") { if (!(e.hunt && huntStep(e, dt))) walk(e, 72, dt); if (d < 30 && e.state === "walk") { e.state = "armed"; e.t = 1.4 * tellK(); e.beep = 0; } }
      else { if (!e.hunt) walk(e, 26, dt); e.beep -= dt; if (e.beep <= 0) { AU.sfx("beep", panOf(e.x)); e.beep = .08 + e.t * .2; } if (e.t <= 0) { e.alive = false; if (e.hunt) hunterBlast(e); explode(e.x, e.y - 6, 34, "carrion"); G.killerHint = "carrion"; } }
      break;
    case "bulwark": {
      let da = ang - e.dir; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; e.dir += Math.max(-2 * dt, Math.min(2 * dt, da));
      walk(e, 30, dt); e.face = Math.cos(e.dir) < 0 ? -1 : 1; if (d < 11) playerDie("bulwark"); break; }
    case "corvid":
      if (e.state === "circle") { e.ang += dt * 1.6; const tx = p.x + Math.cos(e.ang) * 70, ty = p.y + Math.sin(e.ang) * 46; e.x += (tx - e.x) * Math.min(1, dt * 2); e.y += (ty - e.y) * Math.min(1, dt * 2); e.face = Math.cos(e.ang + Math.PI / 2) < 0 ? -1 : 1;
        if (e.t <= 0) { e.state = "tell"; e.t = .5 * tellK(); AU.sfx("caw", panOf(e.x)); } }
      else if (e.state === "tell") { e.la = ang; if (e.t <= 0) { e.state = "dive"; e.t = .55; AU.sfx("dive", panOf(e.x)); } }
      else if (e.state === "dive") { e.x += Math.cos(e.la) * 215 * dt; e.y += Math.sin(e.la) * 215 * dt; e.alt = 6; if (d < 9) playerDie("corvid"); if (e.t <= 0) { e.state = "rec"; e.t = .6; } }
      else { e.alt += (14 - e.alt) * dt * 4; if (e.t <= 0) { e.state = "circle"; e.t = rnd(1.8, 3.2); e.ang = Math.atan2(e.y - p.y, e.x - p.x); } }
      e.x = Math.max(8, Math.min(GW - 8, e.x)); e.y = Math.max(20, Math.min(GH - 8, e.y));
      break;
    case "blackwing": updateBoss(e, dt, d); break;
    case "ferryman": updFerry(e, dt, d); break;
    case "cinder": updCinder(e, dt, d); break;
    case "widow": updWidow(e, dt, d); break;
    case "archivist": updArchivist(e, dt); break;
    case "echo": updEcho(e, dt); break;
    case "warden": updWarden(e, dt); break;
    case "wrenc": updWrenc(e, dt, d); break;
    case "scarecrow": updScarecrow(e, dt, d); break;
    case "vanexo": updVane(e, dt, d); break;
    case "choir": updChoir(e, dt, d); break;
    case "corvina": updCorvina(e, dt, d); break;
  }
}

/* ---- Bullets ---- */
// Low cover only stops a shot if someone on the far side is crouched right behind it.
function hugging(b) {
  const near = o => Math.hypot(o.x - b.x, o.y - b.y) < 22 && ((b.vx * (o.x - b.x) + b.vy * (o.y - b.y)) > 0);
  return b.owner === "p" ? G.en.some(e => e.alive && !e.alt && near(e)) : near(G.p);
}
function updateBullets(dt) {
  const p = G.p;
  for (const b of G.bul) {
    // Homing rounds (Vane's missiles) turn towards you for a short while after launch.
    if (b.seek > 0) { b.seek -= dt; const sp = Math.hypot(b.vx, b.vy); let cur = Math.atan2(b.vy, b.vx), da = Math.atan2(p.y - BODY - b.y, p.x - b.x) - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      cur += Math.max(-2.4 * dt, Math.min(2.4 * dt, da)); b.vx = Math.cos(cur) * sp; b.vy = Math.sin(cur) * sp; }
    if (b.split > 0) { b.split -= dt; if (b.split <= 0) { const a0 = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy); [-.32, .32].forEach(da => shoot(b.x, b.y, a0 + da, sp, "p", { life: b.life, col: b.col })); fx(b.x, b.y, 4, [b.col || COL.cyan, "#ffffff"], 40, .2); } }
    if (b.homing && b.owner === "p") { let best = null, bd = 170; for (const e of G.en) { if (!e.alive || armored(e) || e.type === "holo") continue; const d = Math.hypot(e.x - b.x, e.y - BODY - (e.alt || 0) - b.y); if (d < bd) { bd = d; best = e; } }
      if (best) { const sp = Math.hypot(b.vx, b.vy); let cur = Math.atan2(b.vy, b.vx), da = Math.atan2(best.y - BODY - (best.alt || 0) - b.y, best.x - b.x) - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        cur += Math.max(-5 * dt, Math.min(5 * dt, da)); b.vx = Math.cos(cur) * sp; b.vy = Math.sin(cur) * sp; } }
    const steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3);
    for (let s = 0; s < steps && b.life > 0; s++) {
      b.x += b.vx * dt / steps; b.y += b.vy * dt / steps; b.d += Math.hypot(b.vx, b.vy) * dt / steps;
      const ch = tileOf(b.x, b.y);
      if (ch === null) { b.life = 0; break; }
      if (SHOT_BLOCK.has(ch) && !(ch === "h" && (b.d < 20 || !hugging(b)))) {
        const i = Math.floor(b.x / TS), j = Math.floor(b.y / TS);
        if (b.bounce > 0 && ch !== "b" && ch !== "c") { // Ricochet: reflect off the face we hit and keep going
          const px = b.x - b.vx * dt / steps, py = b.y - b.vy * dt / steps, bx = SHOT_BLOCK.has(tileOf(b.x, py)), by = SHOT_BLOCK.has(tileOf(px, b.y));
          if (bx || !by) b.vx = -b.vx; if (by || !bx) b.vy = -b.vy; b.x = px; b.y = py; b.bounce--; b.d = 20; b.hits = [];
          AU.sfx("impactMetal", panOf(b.x)); fx(b.x, b.y, 5, [COL.cyan, "#ffffff"], 50, .2); continue; }
        if (b.blast && b.owner === "p") { explode(b.x - b.vx * .01, b.y - b.vy * .01, b.blast, "gun", true); b.life = 0; break; }
        if (ch === "b") detonateBarrel(i, j);
        else if (ch !== "c") AU.sfx("kmvquWtdA".includes(ch) ? "impactMetal" : "impactWall", panOf(b.x));
        else if (ch === "c") { const k = i + "," + j; G.crateHp[k] = (G.crateHp[k] || 2) - 1; if (G.crateHp[k] <= 0) breakTile(i, j); else AU.sfx("crate", panOf(b.x)); }
        fx(b.x - b.vx * .01, b.y - b.vy * .01, 4, [b.owner === "p" ? COL.cyan : COL.magenta, "#ffffff"], 40, .25); b.life = 0; break;
      }
      if (G.tram && G.tram.state === "run" && b.y > G.tram.row * TS - 10 && b.y < (G.tram.row + 1) * TS && b.x > G.tram.x && b.x < G.tram.x + 288) { b.life = 0; break; }
      if (b.owner === "p" || b.owner === "a") { // your rounds and your allies' rounds
        for (const e of G.en) { if (!e.alive || b.hits.includes(e)) continue; const ey = e.y - BODY - (e.alt || 0); const big = e.type === "blackwing" || e.type === "augur" || e.type === "holo" || e.type === "ferryman" || e.type === "cinder" || e.type === "widow" || e.type === "archivist" || e.type === "scarecrow" || e.type === "vanexo" || e.type === "corvina", hw = big ? 13 : 7, hh = big ? 16 : 9; if (Math.abs(b.x - e.x) < hw && Math.abs(b.y - ey) < hh) {
          if (e.type === "bulwark") { const ba = Math.atan2(-b.vy, -b.vx); let da = ba - e.dir; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; if (Math.abs(da) < 1.2) { AU.sfx("bulwark", panOf(e.x)); fx(b.x, b.y, 6, [COL.magenta, "#ffffff"], 50, .3); b.life = 0; break; } }
          if (b.blast && b.owner === "p") { const bx = b.x, by = b.y; b.life = 0; if (!armored(e) && e.hp > 1) hurtBoss(e); else if (!armored(e)) killEnemy(e, "shot"); explode(bx, by, b.blast, "gun", true); break; }
          if (armored(e)) { AU.sfx("bulwark", panOf(e.x)); fx(b.x, b.y, 5, [COL.magenta, "#ffffff"], 50, .3); b.life = 0; break; }
          if (e.hp > 1) { hurtBoss(e); b.life = 0; break; }
          { const kx = e.x, ky = e.y - 6; killEnemy(e, "shot"); if (b.owner === "p" && hasImp("kiln")) explode(kx, ky, 26, "kiln", true);
            if (b.feathers) ringShots(kx, ky, b.feathers, "#ff3d3d");
            if (b.owner === "p") { if (b.arc) arcFrom(e, b.arc, "shot"); if (b.freeze) stunAround(kx, ky, b.freeze, 2); if (b.vamp || hasImp("scavenger")) p.ammo = Math.min(p.gun.mag, p.ammo + 1);
              if (hasImp("chainmod") && Math.random() < .35) arcFrom(e, 1, "shot"); } }
          if (b.pierce > 0) { b.pierce--; b.hits.push(e); continue; } b.life = 0; break; } }
        if (b.life <= 0) break;
      } else {
        // Crossfire: Warden rounds hit the Murder, and Murder rounds hit Wardens.
        const foe = G.en.find(e => e.alive && (b.owner === "w" ? e.type !== "warden" && !BOSSY.has(e.type) && e.type !== "echo" : e.type === "warden") && Math.abs(b.x - e.x) < 7 && Math.abs(b.y - (e.y - BODY - (e.alt || 0))) < 9);
        if (foe && b.d > 12) { killEnemy(foe, "crossfire"); b.life = 0; break; }
        const sh = stallHit(b); if (sh) { hurtStall(sh, stallShot(sh)); b.life = 0; break; }
        const dx = b.x - p.x, dy = b.y - (p.y - BODY), dd = Math.hypot(dx, dy);
        if (dd < p.hitR) { playerDie(b.by); b.life = 0; break; }
        if (dd < 11 && !b.grazed && G.mode === "play") { b.grazed = true; p.oc = Math.min(p.ocMax, p.oc + (hasImp("graze") ? 10 : 5)); track("graze"); AU.sfx("graze"); pop(p.x, p.y - 32, "GRAZE", COL.cyan); }
      }
    }
    b.life -= dt;
  }
  G.bul = G.bul.filter(b => b.life > 0);
}
