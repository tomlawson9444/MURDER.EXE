/* Key art: painted (non-pixel) scene built from static layers plus animated crows and rain. */
"use strict";
function crowShape(c, x, y, s, f) {
  c.beginPath(); c.moveTo(x - s * 1.6, y - f * s * .8);
  c.quadraticCurveTo(x - s * .6, y - s * .2 - f * s * .3, x, y + s * .15);
  c.quadraticCurveTo(x + s * .6, y - s * .2 - f * s * .3, x + s * 1.6, y - f * s * .8);
  c.quadraticCurveTo(x + s * .6, y + s * .1, x, y + s * .45);
  c.quadraticCurveTo(x - s * .6, y + s * .1, x - s * 1.6, y - f * s * .8); c.fill();
}
function perched(c, x, y, s) { c.beginPath(); c.ellipse(x, y - s * 3, s * 4.5, s * 3, -.2, 0, TAU); c.fill(); c.beginPath(); c.arc(x + s * 4, y - s * 6, s * 2, 0, TAU); c.fill(); poly(c, [[x + s * 5.5, y - s * 6.8], [x + s * 9, y - s * 5.8], [x + s * 5.5, y - s * 5.2]]); c.fill(); poly(c, [[x - s * 3.5, y - s * 3], [x - s * 8, y + s * .5], [x - s * 3, y - s * 1]]); c.fill(); }

function drawSigil(a, cx, cy, R, s) {
  a.save(); a.strokeStyle = COL.magenta; a.shadowColor = COL.magenta; a.shadowBlur = 24 * s;
  a.lineWidth = 3 * s; for (let i = 0; i < 18; i++) { const a0 = i / 18 * TAU + .05; a.beginPath(); a.arc(cx, cy, R, a0, a0 + TAU / 18 - .12); a.stroke(); }
  a.lineWidth = 1.2 * s; for (let i = 0; i < 90; i++) { const an = i / 90 * TAU, r1 = R * .86, r2 = R * (i % 5 ? .9 : .95); a.beginPath(); a.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); a.lineTo(cx + Math.cos(an) * r2, cy + Math.sin(an) * r2); a.stroke(); }
  a.lineWidth = 1 * s; a.beginPath(); a.arc(cx, cy, R * .78, 0, TAU); a.stroke();
  a.lineWidth = 4 * s; a.beginPath(); a.moveTo(cx - R * .62, cy); a.quadraticCurveTo(cx, cy - R * .52, cx + R * .62, cy); a.quadraticCurveTo(cx, cy + R * .52, cx - R * .62, cy); a.closePath(); a.stroke();
  a.fillStyle = rgba(COL.magenta, .14); a.fill();
  a.lineWidth = 2 * s; a.beginPath(); a.arc(cx, cy, R * .2, 0, TAU); a.stroke();
  a.fillStyle = "#ffd1e6"; a.beginPath(); a.ellipse(cx, cy, R * .045, R * .17, 0, 0, TAU); a.fill();
  a.beginPath(); a.moveTo(cx - R * .12, cy + R * .5); a.lineTo(cx, cy + R * .62); a.lineTo(cx + R * .12, cy + R * .5); a.stroke();
  a.restore();
}
function cityLayer(a, W, H, r, o) {
  let x = -10 * o.s;
  while (x < W) {
    const bw = (30 + r() * 90) * o.s; let bh = (o.minH + r() * (o.maxH - o.minH)) * H;
    if (o.avoid && x + bw > o.avoid[0] && x < o.avoid[1]) bh *= .4;
    const top = o.base - bh; a.fillStyle = o.col; a.fillRect(x, top, bw, H - top);
    if (r() < .5) a.fillRect(x + bw * .3, top - 8 * o.s, bw * .2, 8 * o.s);
    if (r() < .3) a.fillRect(x + bw * .7, top - 30 * o.s, 1.5 * o.s, 30 * o.s);
    const ws = 4 * o.s;
    for (let wy = top + 6 * o.s; wy < o.base; wy += ws * 2) for (let wx = x + 4 * o.s; wx < x + bw - 4 * o.s; wx += ws * 1.6)
      if (r() < o.winP) { a.fillStyle = rgba(o.win[r() * o.win.length | 0], o.winA * (.4 + r() * .6)); a.fillRect(wx, wy, ws * .8, ws * .9); }
    if (o.neon && r() < .45) { const col = [COL.magenta, COL.cyan, COL.amber][r() * 3 | 0]; const nx = x + (r() < .5 ? 2 * o.s : bw - 8 * o.s), ny = top + 20 * o.s + r() * bh * .3, nh = (40 + r() * 80) * o.s;
      a.save(); a.shadowColor = col; a.shadowBlur = 18 * o.s; a.fillStyle = col; a.fillRect(nx, ny, 5 * o.s, nh); a.restore(); a.fillStyle = "rgba(255,255,255,.55)"; a.fillRect(nx + 2 * o.s, ny, 1 * o.s, nh); }
    x += bw + r() * 6 * o.s;
  }
}
function billboard(a, x, y, w, h, col, t1, t2, s) {
  a.save(); const g = a.createLinearGradient(x, y, x, y + h); g.addColorStop(0, mix(col, "#000000", .55)); g.addColorStop(1, mix(col, "#000000", .85));
  a.fillStyle = g; a.fillRect(x, y, w, h); a.shadowColor = col; a.shadowBlur = 20 * s; a.strokeStyle = col; a.lineWidth = 2 * s; a.strokeRect(x, y, w, h);
  a.fillStyle = col; a.font = `700 ${Math.round(h * .38)}px "Chakra Petch", sans-serif`; a.textBaseline = "middle"; a.fillText(t1, x + w * .08, y + h * .38);
  a.font = `${Math.round(h * .2)}px Silkscreen, monospace`; a.fillStyle = mix(col, "#ffffff", .4); a.fillText(t2, x + w * .08, y + h * .74); a.restore();
}
function figure(c, x, y, k, s) {
  const shapes = [
    [[-7, 38], [-9, 46], [-22, 48], [-34, 56], [-40, 70], [-42, 95], [-44, 130], [-46, 160], [-52, 200], [-62, 234], [-50, 229], [-42, 240], [-32, 231], [-24, 238], [-22, 286], [-28, 298], [-8, 298], [-8, 286], [-6, 238], [0, 228], [6, 238], [8, 286], [8, 298], [28, 298], [22, 286], [20, 238], [30, 233], [42, 242], [50, 230], [58, 236], [52, 200], [46, 160], [43, 120], [41, 80], [34, 56], [22, 48], [9, 46], [7, 38]],
    "head",
    [[-16, 22], [-22, 40], [-12, 35], [-6, 41], [4, 36], [12, 41], [17, 30], [16, 18]],
    [[34, 58], [46, 64], [55, 108], [62, 146], [52, 150], [44, 112], [37, 80]],
    [[50, 142], [64, 140], [67, 151], [86, 186], [79, 191], [62, 160], [53, 158]],
    [[-36, 60], [-46, 66], [-52, 110], [-56, 140], [-48, 146], [-42, 112], [-38, 80]],
  ];
  c.save(); c.translate(x, y - 298 * k); c.scale(k, k);
  const fillAll = (dx, dy, col, blur) => { c.save(); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = blur; c.translate(dx, dy);
    shapes.forEach(p => { if (p === "head") { c.beginPath(); c.ellipse(0, 22, 15, 19, 0, 0, TAU); } else poly(c, p); c.fill(); }); c.restore(); };
  fillAll(2.6, -.8, COL.cyan, 16 * s); fillAll(-2.2, 0, COL.magenta, 12 * s); fillAll(0, 0, "#05030a", 0);
  c.strokeStyle = "#05030a"; c.lineWidth = 2.4; c.lineCap = "round";
  [[-12, 8, -30, 2, -46, 7], [-14, 16, -32, 14, -48, 22], [-10, 2, -26, -6, -42, -3]].forEach(([a, b, qx, qy, ex, ey]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(qx, qy, ex, ey); c.stroke(); });
  c.save(); c.strokeStyle = rgba(COL.cyan, .9); c.shadowColor = COL.cyan; c.shadowBlur = 10 * s; c.lineWidth = 1.4; c.setLineDash([7, 5]); c.beginPath(); c.moveTo(0, 52); c.lineTo(1.5, 214); c.stroke(); c.setLineDash([]);
  c.fillStyle = COL.cyan; c.fillRect(-4, 42, 8, 3); c.restore();
  c.save(); c.translate(-18, 92); c.fillStyle = rgba(COL.magenta, .8); crowShape(c, 0, 0, 7, .3); c.strokeStyle = rgba(COL.magenta, .9); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-10, -7); c.lineTo(10, 7); c.moveTo(10, -7); c.lineTo(-10, 7); c.stroke(); c.restore();
  c.save(); c.shadowColor = COL.cyan; c.shadowBlur = 14 * s; c.fillStyle = COL.cyan; c.fillRect(70, 160, 4, 4); c.strokeStyle = COL.cyan; c.lineWidth = 2; c.beginPath(); c.moveTo(13, 15); c.lineTo(16, 23); c.stroke(); c.restore();
  c.restore();
}

function buildKA(W, H, seed = 11) {
  const r = rngF(seed), s = W / 1600; const cx = W * .36, cy = H * .22, R = H * .16;
  const A = mk(W, H), a = A.getContext("2d");
  let g = a.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#05040e"); g.addColorStop(.35, "#140a2a"); g.addColorStop(.62, "#3e0e3a"); g.addColorStop(.78, "#6e1648"); g.addColorStop(1, "#1a0920"); a.fillStyle = g; a.fillRect(0, 0, W, H);
  glow(a, cx, cy, R * 3.4, COL.magenta, .24);
  for (let i = 0; i < 80; i++) { const x = r() * W, y = r() * H * .55, rx = (.08 + r() * .25) * W, ry = (.012 + r() * .035) * H, dd = Math.hypot(x - cx, (y - cy) * 2) / W;
    a.fillStyle = r() < .55 ? `rgba(8,5,20,${.25 + r() * .35})` : rgba(COL.magenta, Math.max(0, .12 - dd * .18)); a.beginPath(); a.ellipse(x, y, rx, ry, 0, 0, TAU); a.fill(); }
  a.save(); a.globalCompositeOperation = "lighter";
  for (let i = 0; i < 7; i++) { const ang = Math.PI / 2 + (i - 3) * .17, Lh = H * 1.1; const gg = a.createLinearGradient(cx, cy, cx + Math.cos(ang) * Lh, cy + Math.sin(ang) * Lh); gg.addColorStop(0, rgba(COL.magenta, .1)); gg.addColorStop(1, rgba(COL.magenta, 0)); a.fillStyle = gg;
    poly(a, [[cx, cy], [cx + Math.cos(ang - .03) * Lh, cy + Math.sin(ang - .03) * Lh], [cx + Math.cos(ang + .03) * Lh, cy + Math.sin(ang + .03) * Lh]]); a.fill(); }
  a.restore();
  drawSigil(a, cx, cy, R, s);
  cityLayer(a, W, H, r, { base: H * .8, minH: .1, maxH: .32, col: "#2a1238", win: ["#ff7ab8", "#c9b6ff"], winA: .35, winP: .14, s });
  g = a.createLinearGradient(0, H * .45, 0, H * .85); g.addColorStop(0, rgba("#5a1446", 0)); g.addColorStop(1, rgba("#5a1446", .55)); a.fillStyle = g; a.fillRect(0, H * .45, W, H * .4);
  // Spire Zero
  const base = H * .84, sp = [[cx - 64 * s, base], [cx - 52 * s, H * .66], [cx - 40 * s, H * .64], [cx - 36 * s, H * .54], [cx - 20 * s, H * .5], [cx - 12 * s, H * .44], [cx - 3 * s, H * .4], [cx + 3 * s, H * .4], [cx + 12 * s, H * .44], [cx + 20 * s, H * .5], [cx + 36 * s, H * .54], [cx + 40 * s, H * .64], [cx + 52 * s, H * .66], [cx + 64 * s, base]];
  a.fillStyle = "#0e0718"; poly(a, sp); a.fill();
  a.save(); poly(a, sp); a.clip(); for (let y = H * .42; y < base; y += 5 * s) for (let x = cx - 64 * s; x < cx + 64 * s; x += 4 * s) if (r() < .22) { a.fillStyle = rgba(r() < .7 ? COL.amber : COL.magenta, .35 + r() * .4); a.fillRect(x, y, 2 * s, 2 * s); } a.restore();
  a.save(); a.lineWidth = 1.5 * s; a.shadowBlur = 10 * s; a.shadowColor = COL.cyan; a.strokeStyle = rgba(COL.cyan, .7); a.beginPath(); sp.slice(0, 7).forEach(([x, y], i) => i ? a.lineTo(x, y) : a.moveTo(x, y)); a.stroke();
  a.shadowColor = COL.magenta; a.strokeStyle = rgba(COL.magenta, .8); a.beginPath(); sp.slice(7).forEach(([x, y], i) => i ? a.lineTo(x, y) : a.moveTo(x, y)); a.stroke();
  a.strokeStyle = "#0e0718"; a.lineWidth = 2 * s; a.shadowBlur = 0; a.beginPath(); a.moveTo(cx, H * .4); a.lineTo(cx, H * .34); a.stroke(); a.restore();
  a.save(); a.globalCompositeOperation = "lighter"; glow(a, cx, H * .34, 14 * s, COL.red, .9); a.restore();
  cityLayer(a, W, H, r, { base: H * .95, minH: .12, maxH: .4, col: "#12081f", win: [COL.cyan, COL.amber, COL.magenta, "#c9b6ff"], winA: .6, winP: .1, s, neon: true, avoid: [cx - W * .07, cx + W * .07] });
  billboard(a, W * .5, H * .56, W * .11, H * .075, COL.magenta, "CORVUS", "SEE EVERYTHING", s);
  billboard(a, W * .07, H * .52, W * .09, H * .08, COL.cyan, "HALVORSEN", "SECURITY · 2099", s);
  billboard(a, W * .79, H * .6, W * .07, H * .055, COL.amber, "RAIN", "MARKET", s);
  g = a.createLinearGradient(0, H * .7, 0, H); g.addColorStop(0, rgba("#2a0a24", 0)); g.addColorStop(1, rgba("#2a0a24", .7)); a.fillStyle = g; a.fillRect(0, H * .7, W, H * .3);
  // sigil pulse layer
  const B = mk(W, H); drawSigil(B.getContext("2d"), cx, cy, R, s);
  // Foreground
  const C = mk(W, H), c = C.getContext("2d"); const ey = x => H * .86 - H * .05 * (x / W);
  c.fillStyle = "#07050d"; c.fillRect(W * .97, 0, W * .04, ey(W));
  const sx = W * .905, sy = H * .14, sw = W * .055, sh = H * .58;
  c.fillStyle = "#0a0716"; c.fillRect(sx, sy, sw, sh); c.fillStyle = "#07050d"; c.fillRect(sx + sw, sy + sh * .1, W * .02, 4 * s); c.fillRect(sx + sw, sy + sh * .85, W * .02, 4 * s);
  c.save(); c.shadowColor = COL.cyan; c.shadowBlur = 22 * s; c.strokeStyle = COL.cyan; c.lineWidth = 2.5 * s; c.strokeRect(sx + 5 * s, sy + 5 * s, sw - 10 * s, sh - 10 * s);
  c.fillStyle = "#e0fbff"; c.font = `700 ${Math.round(sw * .62)}px "Chakra Petch", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
  "NOODLE".split("").forEach((ch, i) => c.fillText(ch, sx + sw / 2, sy + sh * (.12 + i * .155))); c.restore();
  c.save(); c.globalCompositeOperation = "lighter"; glow(c, sx + sw / 2, sy + sh / 2, W * .14, COL.cyan, .22); c.restore();
  const ax = W * .2; c.strokeStyle = "#05030a"; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(ax, ey(ax)); c.lineTo(ax, H * .42); c.moveTo(ax - 20 * s, H * .5); c.lineTo(ax + 20 * s, H * .5); c.moveTo(ax - 12 * s, H * .46); c.lineTo(ax + 12 * s, H * .46); c.stroke();
  c.save(); c.globalCompositeOperation = "lighter"; glow(c, ax, H * .42, 12 * s, COL.red, .9); c.restore();
  const bz = (t, p0, p1, p2) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  const cab = [[ax, H * .43], [W * .55, H * .64], [W * .97, H * .3]];
  c.strokeStyle = "#05030a"; c.lineWidth = 2.5 * s; c.beginPath(); c.moveTo(cab[0][0], cab[0][1]); c.quadraticCurveTo(cab[1][0], cab[1][1], cab[2][0], cab[2][1]); c.stroke();
  c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(ax, H * .5); c.quadraticCurveTo(W * .5, H * .74, W * .97, H * .45); c.stroke();
  c.fillStyle = "#05030a"; [.22, .3, .36, .58].forEach(t => perched(c, bz(t, cab[0][0], cab[1][0], cab[2][0]), bz(t, cab[0][1], cab[1][1], cab[2][1]), 1.3 * s));
  const rx0 = W * .02, rw = W * .12, rh = H * .12, ry0 = ey(rx0) - rh;
  c.fillStyle = "#0b0815"; c.fillRect(rx0, ry0, rw, rh); c.fillStyle = "#151022"; c.fillRect(rx0, ry0, rw, rh * .12);
  c.strokeStyle = rgba(COL.magenta, .55); c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(rx0, ry0); c.lineTo(rx0 + rw, ry0); c.stroke();
  c.strokeStyle = "#1d1630"; c.lineWidth = 2 * s; c.beginPath(); c.arc(rx0 + rw / 2, ry0 + rh * .58, rh * .32, 0, TAU); c.stroke(); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(rx0 + rw / 2 - rh * .3, ry0 + rh * .58 + i * rh * .1); c.lineTo(rx0 + rw / 2 + rh * .3, ry0 + rh * .58 + i * rh * .1); c.stroke(); }
  c.beginPath(); c.moveTo(0, ey(0)); c.lineTo(W, ey(W)); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); g = c.createLinearGradient(0, H * .8, 0, H); g.addColorStop(0, "#0e0a18"); g.addColorStop(1, "#030206"); c.fillStyle = g; c.fill();
  g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, rgba(COL.magenta, .75)); g.addColorStop(.6, rgba("#c9b6ff", .35)); g.addColorStop(1, rgba(COL.cyan, .85)); c.strokeStyle = g; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(0, ey(0)); c.lineTo(W, ey(W)); c.stroke();
  c.save(); c.globalCompositeOperation = "lighter"; glowE(c, sx + sw / 2, H * .94, W * .025, H * .09, COL.cyan, .4); glowE(c, cx, H * .95, W * .05, H * .05, COL.magenta, .22);
  for (let i = 0; i < 34; i++) glowE(c, r() * W, ey(W / 2) + r() * H * .12 + 8 * s, 3 * s, 10 * s, [COL.magenta, COL.cyan, COL.amber][r() * 3 | 0], .22); c.restore();
  const fx = W * .7; figure(c, fx, ey(fx) + H * .025, H * .5 / 298, s);
  // crows
  const crows = [], stream = [];
  for (let i = 0; i < 360; i++) { const rho = R * (.9 + r() * 1.8); crows.push({ th: r() * TAU, rx: rho * 1.7, ry: rho * .5, sp: (.00008 + r() * .00012) * (r() < .85 ? 1 : -1), ph: r() * TAU, w: (2 + r() * 8) * s, fs: .01 + r() * .01, sz: (1.6 + r() * 2.6) * s }); }
  for (let i = 0; i < 40; i++) stream.push({ off: r(), sp: .00005 + r() * .00005, dx: W * (.25 + r() * .6), dy: H * (-.1 + r() * .35), ph: r() * TAU, fs: .008 + r() * .006, sz: (2.5 + r() * 3) * s });
  const drops = []; for (let i = 0; i < 520; i++) { const z = r(); drops.push([r() * W, r() * H, (z < .7 ? 14 : 30) * s, (z < .7 ? .5 : .95) * (1 + r() * .4) * H / 700, z < .7 ? 1 : 2, z < .7 ? .18 : .32]); }
  const Eo = mk(W, H), e = Eo.getContext("2d");
  const vg = e.createRadialGradient(W * .5, H * .45, H * .3, W * .5, H * .5, W * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.72)"); e.fillStyle = vg; e.fillRect(0, 0, W, H);
  const N = mk(160, 160), n = N.getContext("2d"), id = n.createImageData(160, 160); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 20; } n.putImageData(id, 0, 0);
  e.fillStyle = e.createPattern(N, "repeat"); e.fillRect(0, 0, W, H); e.fillStyle = "rgba(0,0,0,.08)"; for (let y = 0; y < H; y += 3) e.fillRect(0, y, W, 1);
  return { W, H, s, cx, cy, R, A, B, C, E: Eo, crows, stream, drops, ey };
}
function drawKA(c, K, t) {
  const { W, H, s } = K; c.drawImage(K.A, 0, 0);
  c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = .3 + .3 * Math.sin(t * .0016); c.drawImage(K.B, 0, 0); c.restore();
  c.fillStyle = "#06030c";
  for (const o of K.crows) { const th = o.th + t * o.sp; crowShape(c, K.cx + Math.cos(th) * o.rx, K.cy + Math.sin(th) * o.ry + Math.sin(t * .001 + o.ph) * o.w, o.sz, Math.sin(t * o.fs + o.ph)); }
  for (const o of K.stream) { const u = (t * o.sp + o.off) % 1; crowShape(c, K.cx + u * o.dx + Math.sin(u * 9 + o.ph) * 20 * s, K.cy + u * o.dy + Math.cos(u * 7 + o.ph) * 14 * s, o.sz * (.4 + u * 1.6), Math.sin(t * o.fs + o.ph)); }
  c.drawImage(K.C, 0, 0);
  c.lineCap = "round";
  [[1, .18], [2, .32]].forEach(([lw, al]) => { c.strokeStyle = `rgba(190,200,255,${al})`; c.lineWidth = lw * s; c.beginPath();
    for (const d of K.drops) if (d[4] === lw) { const y = (d[1] + t * d[3]) % (H + 40) - 20, x = (d[0] - (t * d[3]) * .22 % W + W) % W; c.moveTo(x, y); c.lineTo(x - d[2] * .22, y + d[2]); } c.stroke(); });
  c.drawImage(K.E, 0, 0);
}
