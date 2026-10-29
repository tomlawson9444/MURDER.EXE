/* Rendering: world, sprites, effects, HUD and screens. */
"use strict";
let SP = {}, SPF = {};
function flipSpr(s) { const cv = mk(s.w, s.h), c = cv.getContext("2d"); c.translate(s.w, 0); c.scale(-1, 1); c.drawImage(s.cv, 0, 0); const gc = mk(s.gc.width, s.gc.height), g = gc.getContext("2d"); g.translate(gc.width, 0); g.scale(-1, 1); g.drawImage(s.gc, 0, 0); return { cv, gc, G: s.G, w: s.w, h: s.h }; }
function buildSprites() {
  const rim = { rimR: COL.cyan, rimL: "#7f74c9" }, er = { rimL: COL.magenta, rimR: "#6f66b0" };
  SP.vesper = sprite(vesperDef(), rim); SP.vesperB = sprite(vesperDef({ bob: -1 }), rim); SP.run1 = sprite(vesperDef({ la: -1, ra: 1, bob: -1 }), rim); SP.run2 = sprite(vesperDef({ la: 1, ra: -1, bob: -1 }), rim);
  ["corvid", "shrike", "rook", "jackdaw", "carrion", "bulwark", "hexer", "nest", "blackwing", "augur"].forEach(k => SP[k] = sprite(DEFS[k], er));
  for (const k in SP) SPF[k] = flipSpr(SP[k]);
  SP.vesperT = tinted(SP.vesper, COL.cyan); SPF.vesperT = tinted(SPF.vesper, COL.cyan);
}
const sprOf = (k, face) => face < 0 ? SPF[k] : SP[k];
function txt(c, s, x, y, col, size = 8, align = "left") { c.font = `${size}px Silkscreen`; c.textBaseline = "top"; c.textAlign = align; c.fillStyle = col; c.fillText(s, Math.round(x), Math.round(y)); c.textAlign = "left"; }
function panel(c, x, y, w, h, edge) { c.fillStyle = "rgba(6,5,14,.82)"; poly(c, [[x + 4, y], [x + w, y], [x + w, y + h - 4], [x + w - 4, y + h], [x, y + h], [x, y + 4]]); c.fill(); c.strokeStyle = edge; c.lineWidth = 1; c.save(); c.translate(.5, .5); poly(c, [[x + 4, y], [x + w - 1, y], [x + w - 1, y + h - 5], [x + w - 5, y + h - 1], [x, y + h - 1], [x, y + 4]]); c.stroke(); c.restore(); }
function reticle(c, x, y, r, col, n) { c.fillStyle = col; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const ox = Math.round(x + sx * r), oy = Math.round(y + sy * r); c.fillRect(Math.min(ox, ox - sx * 4), oy, 4, 1); c.fillRect(ox, Math.min(oy, oy - sy * 4), 1, 4); }); if (n) txt(c, n, x + r + 3, y - r - 3, col); }

function drawWorld(c, t) {
  const p = G.p; c.save();
  if (G.shake > 0) c.translate(Math.round(rnd(-G.shake, G.shake)), Math.round(rnd(-G.shake, G.shake)));
  if (G.kick && G.kick.t > 0) c.translate(Math.round(G.kick.x), Math.round(G.kick.y));
  c.drawImage(G.base.C, 0, 0); G.base.steam.forEach(([x, y]) => steam(c, x, y, t));
  // telegraphs on the floor
  for (const s of G.pending) { const on = Math.floor(t / 100) % 2; if (s.door) { c.fillStyle = rgba(COL.magenta, on ? .9 : .4); c.fillRect(s.door.tx * TS + 1, s.door.ty * TS + 1, 14, 14); } else if (s.perch) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, s.x, s.y - 10, 18, COL.amber, on ? .6 : .2); c.restore(); } }
  if (G.tram && G.tram.state === "warn") { const on = Math.floor(t / 120) % 2; c.fillStyle = rgba(COL.red, on ? .35 : .12); c.fillRect(TS, 14 * TS, GW - 2 * TS, TS); txt(c, "TRAM", GW / 2, 14 * TS + 4, rgba("#ffffff", on ? 1 : .5), 8, "center"); }
  if (G.collapse) { const on = Math.floor(t / 110) % 2; c.fillStyle = rgba(COL.red, on ? .45 : .15); c.fillRect(13 * TS, 5 * TS, 4 * TS, TS); c.fillStyle = "#05040a"; for (let i = 0; i < 4; i++) pline(c, 13 * TS + 6 + i * 16, 5 * TS + 1, 13 * TS + 2 + i * 16 + (i % 2) * 8, 5 * TS + 15, "#05040a"); txt(c, "BRIDGE", 15 * TS, 5 * TS + 4, rgba("#ffffff", on ? 1 : .5), 8, "center"); }
  if (G.wind && G.wind.on) txt(c, "WIND", 15 * TS, 2 * TS + 4, rgba("#b9c2ff", .6 + .4 * Math.sin(t * .02)), 8, "center");
  for (const g of G.pings) { const k = 1 - g.life; c.strokeStyle = rgba(COL.magenta, g.life); c.beginPath(); c.ellipse(g.x, g.y, 10 + k * 80, 6 + k * 50, 0, 0, TAU); c.stroke(); }
  for (const e of G.en) if (e.alive) {
    if (e.type === "hexer" && e.state === "cast") { c.save(); c.globalAlpha = .4 + .4 * Math.sin(t * .06); pline(c, e.x, e.y - 14, p.x, p.y - BODY, COL.magenta, 3); c.restore(); c.strokeStyle = rgba(COL.magenta, .8); c.beginPath(); c.arc(e.x, e.y - 16 - e.alt, 12 + (.8 - e.t) * 10, 0, TAU); c.stroke(); }
    if (e.type === "nest") { if (e.state === "open") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, e.y - 10, 16 + Math.sin(t * .04) * 4, COL.red, .9); c.restore(); } else { c.strokeStyle = rgba(COL.magenta, .35); c.strokeRect(e.x - 8.5, e.y - 18.5, 17, 17); } }
    if (e.type === "jackdaw" && e.state === "charge") { const gx = e.x, gy = e.y - BODY - 6, a = e.t > .35 ? .35 : .8; c.save(); c.globalAlpha = a + .2 * Math.sin(t * .05); pline(c, gx, gy, gx + Math.cos(e.la) * 600, gy + Math.sin(e.la) * 600, COL.amber); c.restore(); }
    if (e.type === "carrion" && e.state === "armed") { c.strokeStyle = rgba(COL.amber, .5 + .4 * Math.sin(t * .04)); c.beginPath(); c.ellipse(e.x, e.y, 34, 22, 0, 0, TAU); c.stroke(); }
    if (e.type === "shrike" && e.state === "crouch") { c.save(); c.globalAlpha = .6; pline(c, e.x, e.y - 6, e.x + Math.cos(e.la) * 70, e.y - 6 + Math.sin(e.la) * 70, COL.magenta, 2); c.restore(); }
    if (e.type === "corvid" && e.state === "tell") { c.save(); c.globalAlpha = .55; pline(c, e.x, e.y, e.x + Math.cos(e.la) * 118, e.y + Math.sin(e.la) * 118, COL.red, 2); c.restore(); }
    if (e.type === "blackwing" && (e.state === "target" || e.state === "lock")) { const k = 1 - e.alt / 200; c.fillStyle = `rgba(0,0,0,${.3 + .4 * k})`; c.beginPath(); c.ellipse(e.x, e.y, 10 + 16 * k, 5 + 8 * k, 0, 0, TAU); c.fill(); c.strokeStyle = e.state === "lock" ? COL.amber : rgba(COL.magenta, .7); c.beginPath(); c.ellipse(e.x, e.y, 26, 15, 0, 0, TAU); c.stroke(); }
  }
  // sprites, sorted by feet
  const list = G.en.filter(e => e.alive && e.type !== "nest" && !(e.type === "blackwing" && (e.state === "air" || e.state === "target" || e.state === "lock"))).map(e => ({ e, y: e.y }));
  if (G.mode !== "dead") list.push({ e: p, y: p.y, me: 1 }); list.sort((a, b) => a.y - b.y);
  p.trail.forEach(tr => { c.globalAlpha = tr.life * 2.5; c.drawImage(p.face < 0 ? SPF.vesperT : SP.vesperT, Math.round(tr.x - 14), Math.round(tr.y - 33)); c.globalAlpha = 1; });
  for (const { e, me } of list) {
    if (me) { const k = p.moving ? (Math.floor(t / 110) % 2 ? "run1" : "run2") : (Math.floor(t / 400) % 2 ? "vesperB" : "vesper"); const s = sprOf(k, p.face); shadowUnder(c, p.x - s.w / 2, p.y - s.h + 2, s);
      if (p.iframes > 0 && p.dash <= 0 && Math.floor(t / 50) % 2) continue; drawSpr(c, s, p.x - s.w / 2, p.y - s.h + 2); continue; }
    const holo = e.type === "holo", s = sprOf(holo ? "augur" : e.type, e.face), fly = e.type === "corvid", bob = (e.state === "walk" || fly) ? Math.round(Math.sin((e.anim || 0) * 12) * .8) : 0;
    let ox = 0; if (e.type === "shrike" && e.state === "crouch") ox = Math.round(rnd(-1, 1)); if (holo && Math.random() < .03) ox = Math.round(rnd(-2, 2));
    if (!holo) shadowUnder(c, e.x - s.w / 2, e.y - s.h + 2, s, false);
    const y = e.y - s.h + 2 - (e.alt || 0) + bob; if (e.state === "appear") c.globalAlpha = Math.max(.15, 1 - e.t / .6); drawSpr(c, s, e.x - s.w / 2 + ox, y); c.globalAlpha = 1;
    if (e.type === "augur" && e.reveal > 0) { c.save(); c.globalAlpha = .5 + .5 * Math.sin(t * .03); c.drawImage(tinted(s, COL.magenta), Math.round(e.x - s.w / 2), Math.round(y)); c.restore(); reticle(c, e.x, y + s.h / 2, 22, COL.magenta, "REAL"); }
    if (e.type === "corvid" && e.state === "tell") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, e.x, y + 8, 10, COL.red, .9); c.restore(); }
    if (e.type === "blackwing" && e.state === "vuln") { c.save(); c.globalCompositeOperation = "lighter"; const on = .6 + .4 * Math.sin(t * .05); glow(c, e.x - 8, y + 33, 10, COL.amber, on); glow(c, e.x + 9, y + 33, 10, COL.amber, on); c.restore(); }
    if (e.type === "bulwark") { c.strokeStyle = rgba(COL.magenta, .7); c.beginPath(); c.arc(e.x, e.y - 10, 16, e.dir - 1.1, e.dir + 1.1); c.stroke(); }
  }
  for (const e of G.en) if (e.alive && e.type === "blackwing" && e.state === "rise") { c.globalAlpha = .7; drawSpr(c, sprOf("blackwing", e.face), e.x - 25, e.y - 48 - e.alt); c.globalAlpha = 1; }
  if (G.tram && G.tram.state === "run") { const em = []; OBJ.T(c, Math.round(G.tram.x), 14 * TS, 288, TS, { em, light: () => {} }); em.forEach(f => f(c)); }
  // bullets
  for (const b of G.bul) { const col = b.owner === "p" ? COL.cyan : b.rail ? COL.amber : COL.magenta, sp = Math.hypot(b.vx, b.vy), ux = b.vx / sp, uy = b.vy / sp;
    if (b.owner === "e" && !b.rail) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, b.x, b.y, 7, col, .55); c.restore(); c.fillStyle = col; c.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 3, 3); c.fillStyle = "#ffd1e6"; c.fillRect(Math.round(b.x), Math.round(b.y), 1, 1); }
    else { const L = b.rail ? 18 : 14; for (let k = 0; k < L; k++) { c.fillStyle = rgba(col, (1 - k / L) * .9); c.fillRect(Math.round(b.x - ux * k), Math.round(b.y - uy * k), 1, 1); } c.fillStyle = "#ffffff"; c.fillRect(Math.round(b.x), Math.round(b.y), 1, 1); c.save(); c.globalCompositeOperation = "lighter"; glow(c, b.x, b.y, 6, col, .5); c.restore(); } }
  for (const z of G.zaps) { c.strokeStyle = rgba(COL.magenta, z.life * 5); c.beginPath(); c.moveTo(z.x0, z.y0); for (let i = 1; i < 6; i++) c.lineTo(z.x0 + (z.x1 - z.x0) * i / 6 + rnd(-4, 4), z.y0 + (z.y1 - z.y0) * i / 6 + rnd(-4, 4)); c.lineTo(z.x1, z.y1); c.stroke(); }
  for (const tr of G.tracers) { c.strokeStyle = rgba(COL.cyan, tr.life * 4); c.lineWidth = 1; c.beginPath(); c.moveTo(tr.x0, tr.y0); c.lineTo(tr.x1, tr.y1); c.stroke(); }
  for (const b of G.blasts) { const k = 1 - b.life / .35; c.save(); c.globalCompositeOperation = "lighter"; glow(c, b.x, b.y, b.r * (1 + k), COL.amber, .8 * (1 - k)); c.restore(); c.strokeStyle = rgba("#fff0c8", 1 - k); c.beginPath(); c.ellipse(b.x, b.y, b.r * k, b.r * k * .65, 0, 0, TAU); c.stroke(); }
  for (const q of G.parts) { c.fillStyle = q.col; c.globalAlpha = Math.min(1, q.life / q.max * 2); c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); } c.globalAlpha = 1;
  if (G.flash > 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, p.x + p.face * 14, p.y - BODY - 2, 18, COL.cyan, 1); glow(c, p.x + p.face * 14, p.y - BODY - 2, 40, "#c9f8ff", .25); c.restore(); }
  drawRain(c, G.base, t, G.oc ? 0 : 1);
  c.restore();
}

function drawOC(c, t) {
  const p = G.p, o = G.oc; c.save(); c.globalCompositeOperation = "saturation"; c.fillStyle = "#808080"; c.globalAlpha = .85; c.fillRect(0, 0, GW, GH); c.globalCompositeOperation = "multiply"; c.globalAlpha = .55; c.fillStyle = "#6fb4d8"; c.fillRect(0, 0, GW, GH); c.restore();
  const s = sprOf("vesper", p.face); c.save(); c.globalCompositeOperation = "lighter"; glow(c, p.x, p.y - 16, 30, COL.cyan, .4); c.restore(); drawSpr(c, s, p.x - s.w / 2, p.y - s.h + 2);
  const gx = p.x + p.face * 12, gy = p.y - BODY - 2, pulse = Math.round(Math.sin(t * .01) * 1.5);
  o.locks.forEach((e, i) => { if (!e.alive) return; const ey = e.y - BODY - (e.alt || 0); c.save(); c.globalAlpha = .7; pline(c, gx, gy, e.x, ey, COL.cyan, 3, 6); c.restore(); reticle(c, e.x, ey, 10 + pulse, COL.cyan, "0" + (i + 1)); });
  reticle(c, mouse.x, mouse.y, 6, "#ffffff");
  c.fillStyle = "rgba(0,0,0,.16)"; for (let y = 0; y < GH; y += 2) c.fillRect(0, y, GW, 1);
  panel(c, GW / 2 - 92, 36, 184, 18, COL.cyan); txt(c, "OVERCLOCK // DEADLINK.SYS", GW / 2, 41, COL.cyan, 8, "center");
  txt(c, `LOCKS ${o.locks.length}/6 · RELEASE TO FIRE`, GW / 2, 58, rgba(COL.ink, .85), 8, "center");
  c.fillStyle = COL.cyan; c.fillRect(GW / 2 - 60, 70, 120 * (1 - o.t / 3), 1);
}

function drawHUD(c, t) {
  const p = G.p, W = GW, H = GH;
  if (G.hexed > 0) { c.save(); c.translate(Math.round(rnd(-2, 2)), Math.round(rnd(-1, 1))); }
  panel(c, 6, 6, 110, 24, "#3a3456"); txt(c, D().name, 12, 9, COL.ink); txt(c, D().code + (G.phase2 ? " · PHASE 2" : ""), 12, 19, G.phase2 ? COL.red : COL.dim);
  panel(c, W / 2 - 54, 6, 108, 24, "#3a3456"); txt(c, G.boss ? D().bossName : `${String(Math.min(dk(), 100)).padStart(3, "0")}/100`, W / 2, 9, G.boss ? COL.magenta : COL.ink, 8, "center");
  for (let i = 0; i < 20; i++) { c.fillStyle = i < Math.min(dk(), 100) / 5 ? COL.magenta : "#2a2640"; c.fillRect(W / 2 - 49 + i * 5, 21, 4, 3); }
  panel(c, W - 108, 6, 102, 24, "#3a3456"); txt(c, String(G.score).padStart(7, "0"), W - 100, 9, COL.ink); txt(c, "x" + G.mult.toFixed(1), W - 12, 9, COL.cyan, 8, "right");
  for (let i = 0; i < 5; i++) { c.fillStyle = i < G.heat ? COL.amber : "#2a2640"; c.fillRect(W - 100 + i * 7, 21, 5, 3); } txt(c, "HEAT", W - 12, 19, COL.dim, 8, "right");
  txt(c, "+" + (G.runScrip || 0) + " SCRIP", W - 8, 34, rgba(COL.amber, .85), 8, "right");
  panel(c, 6, H - 42, 156, 36, "#3a3456");
  const mag = p.gun.mag, big = mag > 8;
  for (let i = 0; i < mag; i++) { const a = i / mag * TAU - Math.PI / 2, rr = big ? 10 : 9, x = 24 + Math.cos(a) * rr, y = H - 24 + Math.sin(a) * rr, sz = big ? 2 : 4;
    c.fillStyle = i < p.ammo ? (p.ammo === 1 && Math.floor(t / 200) % 2 ? COL.amber : COL.ink) : "#2a2640"; c.fillRect(Math.round(x) - sz / 2, Math.round(y) - sz / 2, sz, sz); }
  if (p.reload > 0) { c.strokeStyle = COL.cyan; c.beginPath(); c.arc(24, H - 24, 13, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p.reload / p.gun.reload)); c.stroke(); }
  txt(c, p.reload > 0 ? "RELOADING" : p.gun.name, 42, H - 39, p.reload > 0 ? COL.cyan : COL.ink);
  txt(c, "OC", 42, H - 28, COL.cyan); c.fillStyle = "#2a2640"; c.fillRect(58, H - 26, 96, 4); c.fillStyle = p.oc >= 50 ? COL.cyan : "#1a7f90"; c.fillRect(58, H - 26, 96 * p.oc / p.ocMax, 4); c.fillStyle = "#05040b"; for (let k = 50; k < p.ocMax; k += 50) c.fillRect(58 + Math.round(96 * k / p.ocMax), H - 26, 1, 4);
  txt(c, "RAM", 42, H - 18, COL.magenta); const rs = 90 / p.ramMax; for (let i = 0; i < p.ramMax; i++) { c.fillStyle = i < Math.floor(p.ram) ? COL.magenta : "#2a2640"; c.fillRect(64 + Math.round(i * rs), H - 16, Math.round(rs) - 2, 4); }
  panel(c, W - 66, H - 38, 60, 32, "#3a3456");
  const qx = W - 60, ready = p.ram >= 3; c.strokeStyle = ready ? COL.magenta : "#3a3456"; c.strokeRect(qx + .5, H - 33.5, 21, 17); txt(c, lab().hackShort, qx + 11, H - 14, COL.dim, 8, "center");
  c.fillStyle = ready ? COL.magenta : "#3a3456"; [[11, 2], [9, 5], [7, 8], [10, 8], [9, 11], [7, 14]].forEach(([a, b]) => c.fillRect(qx + a, H - 33 + b, 3, 2));
  const fx2 = W - 32; c.strokeStyle = p.oc >= 50 ? COL.cyan : "#3a3456"; c.strokeRect(fx2 + .5, H - 33.5, 21, 17); txt(c, lab().ocShort, fx2 + 11, H - 14, COL.dim, 8, "center"); reticle(c, fx2 + 11, H - 25, 4, p.oc >= 50 ? COL.cyan : "#3a3456");
  if (G.hexed > 0) { c.fillStyle = rgba(COL.magenta, .5); for (let i = 0; i < 6; i++) c.fillRect(6 + rnd(0, 150), H - 42 + rnd(0, 34), rnd(10, 60), 1); txt(c, "HEXED " + G.hexed.toFixed(1), 110, H - 39, COL.magenta); c.restore(); }
  if (G.trace > 1 && G.mode === "play") { const k = Math.min(1, (G.trace - 1) / 3); c.fillStyle = "#2a2640"; c.fillRect(Math.round(p.x - 12), Math.round(p.y - 40), 24, 2); c.fillStyle = k > .7 && Math.floor(t / 90) % 2 ? "#ffffff" : COL.magenta; c.fillRect(Math.round(p.x - 12), Math.round(p.y - 40), Math.round(24 * k), 2); txt(c, "TRACE", p.x, p.y - 50, rgba(COL.magenta, .5 + k * .5), 8, "center"); }
  if (!G.oc && p.ram >= 3 && !(G.hexed > 0)) { const tg = hackTarget(); if (tg) { reticle(c, tg.x, tg.y, tg.r + Math.round(Math.sin(t * .012)), COL.magenta); txt(c, lab().hackShort, tg.x + tg.r + 3, tg.y + tg.r - 4, COL.magenta); } }
  if (!G.oc) { reticle(c, mouse.x, mouse.y, 5, COL.cyan); c.fillStyle = COL.cyan; c.fillRect(Math.round(mouse.x), Math.round(mouse.y), 1, 1); }
  for (const q of G.texts) txt(c, q.txt, q.x, q.y, rgba(q.col.startsWith("#") ? q.col : "#e9e6f5", Math.min(1, q.life * 2)), 8, "center");
  if (G.banner) { const b = G.banner; c.globalAlpha = Math.min(1, b.life * 2); c.font = "8px Silkscreen"; const bw = Math.max(160, c.measureText(b.txt).width + 24); panel(c, W / 2 - bw / 2, 84, bw, 22, b.col); txt(c, b.txt, W / 2, 91, b.col, 8, "center"); c.globalAlpha = 1; }
}

function drawLogo(c, x, y, size) { c.font = `700 ${size}px "Chakra Petch", sans-serif`; c.textBaseline = "alphabetic"; c.textAlign = "center"; [[COL.magenta, -2], [COL.cyan, 2], [COL.ink, 0]].forEach(([col, dx]) => { c.fillStyle = col; c.fillText("MURDER", x + dx, y); }); const w = c.measureText("MURDER").width; c.textAlign = "left"; txt(c, ".EXE", x + w / 2 + 4, y - 12, COL.magenta, 16); }
function veil(c, a) { c.fillStyle = `rgba(5,4,11,${a})`; c.fillRect(0, 0, GW, GH); }
function drawTitle(c, t) {
  c.drawImage(G.base.C, 0, 0); drawRain(c, G.base, t); veil(c, .72);
  drawLogo(c, GW / 2 - 18, 92, 44); txt(c, "ONE BULLET. ONE LIFE.", GW / 2, 104, COL.dim, 8, "center");
  const L = lab(); const rows = [[L.move, "MOVE"], [L.aim, "AIM"], [L.fire, "SHOOT"], [L.dash, "PHASE DASH (OVER LOW COVER)"], [L.oc, "OVERCLOCK · SWEEP TO LOCK"], [L.hack, "SHORT CIRCUIT"], [L.reload, "RELOAD"]];
  rows.forEach(([k, v], i) => { txt(c, k, GW / 2 - 8, 122 + i * 11, COL.cyan, 8, "right"); txt(c, v, GW / 2 + 4, 122 + i * 11, COL.ink); });
  if ((G.unlocked || 1) > 1) { const k = DIST[DORDER[G.sel || 0]]; txt(c, `<  ${k.code} ${k.name}  >`, GW / 2, 198, COL.magenta, 8, "center"); }
  if (Math.floor(t / 500) % 2) txt(c, (PAD.active ? "PRESS " + L.confirm : "CLICK") + " TO GEAR UP AT MAGPIE'S", GW / 2, 210, COL.amber, 8, "center");
  txt(c, PAD.active ? L.name + " CONTROLLER" : "CONTROLLERS SUPPORTED · PRESS ANY BUTTON", GW / 2, 222, rgba(COL.dim, .8), 8, "center");
  txt(c, (G.best ? "BEST " + String(G.best).padStart(7, "0") + "   ·   " : "") + SAVE.scrip + " SCRIP", GW / 2, 234, COL.dim, 8, "center");
  txt(c, (G.unlocked || 1) > 1 ? "LEFT / RIGHT TO PICK A DISTRICT" : "PROTOTYPE · CLEAR THE RAIN MARKET TO UNLOCK DISTRICT 02", GW / 2, GH - 16, rgba(COL.dim, .7), 8, "center");
}
function drawDead(c, t) {
  c.save(); c.globalCompositeOperation = "multiply"; c.fillStyle = "#b03048"; c.fillRect(0, 0, GW, GH); c.restore();
  const r = rngF(Math.floor(t / 140)); for (let i = 0; i < 10; i++) { const sy = r() * GH | 0, sh = 2 + r() * 8 | 0, dx = (r() - .5) * 20 | 0; c.drawImage(c.canvas, 0, sy, GW, sh, dx, sy, GW, sh); }
  c.fillStyle = "rgba(5,3,10,.6)"; c.fillRect(0, 80, GW, 112);
  ["#2be4ff", "#ff2d8a", "#ffe8ee"].forEach((col, i) => txt(c, "FLATLINE", GW / 2 + (i === 0 ? -2 : i === 1 ? 2 : 0), 88, col, 32, "center"));
  txt(c, "KILLED BY  " + G.killer, GW / 2, 130, COL.amber, 8, "center");
  txt(c, `KILLS ${String(G.kills).padStart(3, "0")}   HEAT ${G.heat}   SCORE ${String(G.score).padStart(7, "0")}`, GW / 2, 144, COL.ink, 8, "center");
  txt(c, "BEST " + String(G.best || 0).padStart(7, "0") + "   ·   +" + (G.runScrip || 0) + " SCRIP KEPT", GW / 2, 158, COL.dim, 8, "center");
  if (G.deadT > .8) { if (Math.floor(t / 500) % 2) txt(c, (PAD.active ? "PRESS " + lab().confirm : "CLICK OR R") + " TO REBOOT", GW / 2, 172, COL.cyan, 8, "center");
    txt(c, (PAD.active ? (PAD.kind === "ps" ? "○" : "B") : "ESC") + " TO RE-GEAR AT MAGPIE'S", GW / 2, 184, COL.amber, 8, "center"); }
}
function drawIntro(c, t) {
  const k = Math.min(1, G.introT / .3); c.fillStyle = `rgba(12,7,18,${.85 * k})`; c.fillRect(0, 0, GW, GH);
  c.save(); c.globalAlpha = k; for (let i = -10; i < 30; i++) { c.fillStyle = i % 2 ? "#160a1c" : "#0c0712"; poly(c, [[i * 26, 70], [i * 26 + 26, 70], [i * 26 + 26 - 60, 200], [i * 26 - 60, 200]]); c.fill(); }
  c.globalCompositeOperation = "lighter"; glow(c, 120, 140, 70, COL.magenta, .35); c.globalCompositeOperation = "source-over";
  const B = D(); c.save(); c.translate(70, 92); c.scale(2, 2); drawSpr(c, SP[B.boss], 0, 0); c.restore();
  txt(c, `DISTRICT 0${B.n} · ${B.name} · KILL 100`, 220, 96, COL.magenta);
  ["#ff2d8a", "#2be4ff", "#e9e6f5"].forEach((col, i) => txt(c, B.bossName, 220 + (i === 0 ? -2 : i === 1 ? 2 : 0), 110, col, 24));
  c.font = "8px Silkscreen"; const cw = c.measureText(B.bossLine).width + 8; c.fillStyle = COL.amber; c.fillRect(220, 152, cw, 14); txt(c, B.bossLine, 224, 155, "#120c02");
  txt(c, B.bossTip, 220, 174, COL.dim); c.restore();
}
function drawClear(c, t) {
  veil(c, .78); txt(c, "DISTRICT CLEAR", GW / 2, 78, COL.cyan, 32, "center");
  txt(c, `SCORE ${String(G.score).padStart(7, "0")}   ·   BEST ${String(G.best || 0).padStart(7, "0")}`, GW / 2, 124, COL.ink, 8, "center");
  txt(c, `TIME ${Math.floor(G.time / 60)}:${String(Math.floor(G.time % 60)).padStart(2, "0")}   ·   KILLS ${G.kills}`, GW / 2, 138, COL.dim, 8, "center");
  const nx = D().next ? DIST[D().next] : null, L = lab();
  if (nx) { txt(c, `NEXT: ${nx.code} ${nx.name} · HEAT CARRIES OVER (MAX 2)`, GW / 2, 160, COL.magenta, 8, "center");
    txt(c, "+" + (G.runScrip || 0) + " SCRIP THIS RUN · " + SAVE.scrip + " BANKED", GW / 2, 146, COL.amber, 8, "center");
    if (G.clearT > 1) { if (Math.floor(t / 500) % 2) txt(c, (PAD.active ? "PRESS " + L.confirm : "CLICK") + " TO VISIT MAGPIE, THEN BREACH", GW / 2, 182, COL.amber, 8, "center"); txt(c, (PAD.active ? (PAD.kind === "ps" ? "○" : "B") : "ESC") + " TO CASH OUT", GW / 2, 196, COL.dim, 8, "center"); } }
  else { txt(c, "RUN COMPLETE · DATACRYPT ARRIVES IN THE NEXT BUILD", GW / 2, 160, COL.magenta, 8, "center"); if (G.clearT > 1 && Math.floor(t / 500) % 2) txt(c, (PAD.active ? "PRESS " + L.confirm : "CLICK") + " TO RETURN", GW / 2, 184, COL.amber, 8, "center"); }
}
function drawPause(c) { veil(c, .7); txt(c, "PAUSED", GW / 2, 110, COL.ink, 16, "center"); txt(c, (PAD.active ? lab().pause + " OR " + lab().confirm : "CLICK OR P") + " TO RESUME", GW / 2, 136, COL.cyan, 8, "center"); }
