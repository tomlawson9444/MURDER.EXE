/* In-game mockup: Rain Market at 480x270 with Combat / Overclock / Flatline states and HUD. */
"use strict";
function panel(c, x, y, w, h, edge) {
  c.fillStyle = "rgba(6,5,14,.8)"; poly(c, [[x + 4, y], [x + w, y], [x + w, y + h - 4], [x + w - 4, y + h], [x, y + h], [x, y + 4]]); c.fill();
  c.strokeStyle = edge; c.lineWidth = 1; c.save(); c.translate(.5, .5); poly(c, [[x + 4, y], [x + w - 1, y], [x + w - 1, y + h - 5], [x + w - 5, y + h - 1], [x, y + h - 1], [x, y + 4]]); c.stroke(); c.restore();
}
function txt(c, s, x, y, col, size = 8) { c.font = `${size}px Silkscreen`; c.textBaseline = "top"; c.fillStyle = col; c.fillText(s, x, y); }
function bullet(c, x, y, dx, dy, col, core) { for (let k = 0; k < 8; k++) { c.fillStyle = rgba(col, (1 - k / 8) * .85); c.fillRect(Math.round(x - dx * k), Math.round(y - dy * k), 1, 1); } c.fillStyle = core; c.fillRect(Math.round(x) - 1, Math.round(y), 2, 1); c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y, 7, col, .5); c.restore(); }
function orb(c, x, y) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y, 7, COL.magenta, .55); c.restore(); c.fillStyle = COL.magenta; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); c.fillStyle = "#ffd1e6"; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
function reticle(c, x, y, r, col, n) {
  c.fillStyle = col; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const ox = Math.round(x + sx * r), oy = Math.round(y + sy * r); c.fillRect(Math.min(ox, ox - sx * 4), oy, 4, 1); c.fillRect(ox, Math.min(oy, oy - sy * 4), 1, 4); });
  if (n) txt(c, n, Math.round(x + r + 3), Math.round(y - r - 3), col);
}

const ENT = [["bulwark", 104, 140], ["jackdaw", 372, 30], ["rook", 286, 54], ["shrike", 92, 98], ["carrion", 340, 150], ["hexer", 410, 196], ["corvid", 200, 40], ["corvid", 226, 28], ["corvid", 180, 26]];
const VX = 210, VY = 128;
function drawGame(c, SP, S, mode, t) {
  const W = 480, H = 272; c.imageSmoothingEnabled = false; c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  const live = mode === "oc" ? 0 : t; // Overclock freezes time
  c.drawImage(S.C, 0, 0);
  S.steam.forEach(([x, y]) => steam(c, x, y, live));
    const list = ENT.map(([k, x, y], i) => { const fly = k === "corvid" || k === "hexer"; return { k, x: x + (k === "shrike" ? Math.round(Math.sin(live * .003) * 2) : 0), y: y + (fly ? Math.round(Math.sin(live * .004 + i) * 2) : 0), fly }; });
  if (mode !== "flat") list.push({ k: Math.floor(live / 220) % 2 ? "vesperB" : "vesper", x: VX, y: VY });
  list.sort((a, b) => (a.y + SP[a.k].h) - (b.y + SP[b.k].h));
  list.forEach(e => { shadowUnder(c, e.x, e.y, SP[e.k], e.fly); drawSpr(c, SP[e.k], e.x, e.y); });
  const blink = Math.floor(live / 160) % 2;
  c.save(); c.globalCompositeOperation = "lighter"; glow(c, 340 + 13, 150 + 12, 16, COL.amber, blink ? .45 : .15); c.restore();
  const gx = VX + 26, gy = VY + 21, tx = 286 + 14, ty = 54 + 16;

  if (mode === "combat") {
    const lx0 = 372 + 2, ly0 = 30 + 11, a = .45 + .25 * Math.sin(t * .02);
    c.save(); c.globalAlpha = a; pline(c, lx0, ly0, VX + 13, VY + 15, COL.amber); c.restore();
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, VX + 13, VY + 15, 5, COL.amber, .6); c.restore();
    const dx = tx - gx, dy = ty - gy, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl;
    [.3, .62].forEach(f => { const p = (f + t * .0006) % 1; bullet(c, gx + dx * p, gy + dy * p, ux, uy, COL.cyan, "#effdff"); });
    if (Math.floor(t / 90) % 4 === 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, gx + 2, gy, 12, COL.cyan, .8); c.restore(); c.fillStyle = "#effdff"; c.fillRect(gx, gy - 1, 5, 3); c.fillRect(gx + 2, gy - 3, 1, 7); }
    [0, 1, 2].forEach(i => { const p = (i * .12 + t * .00035) % 1; orb(c, tx - 6 + (gx - tx) * p * .9, ty + 2 + (gy - ty) * p * .9 + i * 3); });
    const kp = (t * .0008) % 1, kx = 160, ky = 44; // kill pop
    if (kp < .6) { const r0 = kp * 18; c.fillStyle = rgba("#ffffff", .8 * (1 - kp / .6)); for (let i = 0; i < 10; i++) { const an = i / 10 * TAU; c.fillRect(Math.round(kx + Math.cos(an) * r0), Math.round(ky + Math.sin(an) * r0 * .7), 1, 1); }
      c.fillStyle = COL.magenta; for (let i = 0; i < 8; i++) { const an = i * 2.4; c.fillRect(Math.round(kx + Math.cos(an) * r0 * .7), Math.round(ky + Math.sin(an) * r0 * .5 + kp * 10), 2, 1); }
      txt(c, "+120", kx - 8, ky - 12 - Math.round(kp * 8), rgba(COL.ink, 1 - kp / .6)); }
    txt(c, "GRAZE", VX - 22, VY + 2, rgba(COL.cyan, .5 + .5 * Math.sin(t * .01)));
    reticle(c, tx, ty, 9, COL.cyan); c.fillStyle = COL.cyan; c.fillRect(tx, ty, 1, 1);
  }
  if (mode === "oc") {
    c.save(); c.globalCompositeOperation = "saturation"; c.fillStyle = "#808080"; c.globalAlpha = .85; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "multiply"; c.globalAlpha = .6; c.fillStyle = "#6fb4d8"; c.fillRect(0, 0, W, H); c.restore();
    c.save(); c.globalCompositeOperation = "lighter"; glow(c, VX + 13, VY + 18, 30, COL.cyan, .4); c.restore();
    c.save(); c.globalAlpha = .35; c.drawImage(SP.vesperT, VX - 8, VY); c.globalAlpha = .6; c.drawImage(SP.vesperT, VX - 4, VY); c.restore();
    drawSpr(c, SP.vesper, VX, VY);
    const T = [[286, 54, SP.rook], [200, 40, SP.corvid], [226, 28, SP.corvid], [180, 26, SP.corvid], [372, 30, SP.jackdaw], [340, 150, SP.carrion]];
    const pulse = Math.round(Math.sin(t * .008) * 1.5);
    T.forEach(([x, y, s], i) => { const cx = x + s.w / 2, cy = y + s.h / 2; c.save(); c.globalAlpha = .7; pline(c, gx, gy, cx, cy, COL.cyan, 3, 6); c.restore(); reticle(c, cx, cy, s.w / 2 + 2 + pulse, COL.cyan, "0" + (i + 1)); });
    c.fillStyle = "rgba(0,0,0,.16)"; for (let y = 0; y < H; y += 2) c.fillRect(0, y, W, 1);
    panel(c, W / 2 - 92, 36, 184, 18, COL.cyan); txt(c, "OVERCLOCK // DEADLINK.SYS", W / 2 - 84, 41, COL.cyan);
    txt(c, "LOCKS 6/6  ·  RELEASE TO FIRE", W / 2 - 74, 58, rgba(COL.ink, .8));
  }
  if (mode === "flat") {
    c.save(); c.globalCompositeOperation = "multiply"; c.fillStyle = "#b03048"; c.fillRect(0, 0, W, H); c.restore();
    const r = rngF(Math.floor(t / 140)); for (let i = 0; i < 14; i++) { const sy = r() * H | 0, sh = 2 + r() * 10 | 0, dx = (r() - .5) * 26 | 0; c.drawImage(c.canvas, 0, sy, W, sh, dx, sy, W, sh); }
    c.fillStyle = COL.magenta; for (let i = 0; i < 26; i++) { const an = i * 1.7, d = 6 + (i * 7) % 22; c.fillRect(VX + 13 + Math.cos(an) * d | 0, VY + 24 + Math.sin(an) * d * .5 | 0, 2, 1); }
    c.fillStyle = "rgba(5,3,10,.55)"; c.fillRect(0, 84, W, 104);
    ["#2be4ff", "#ff2d8a", "#ffe8ee"].forEach((col, i) => { c.font = "32px Silkscreen"; c.textBaseline = "top"; c.fillStyle = col; c.fillText("FLATLINE", 92 + (i === 0 ? -2 : i === 1 ? 2 : 0), 92); });
    txt(c, "KILLED BY  JACKDAW  ·  RAIL ROUND", 92, 134, COL.amber);
    txt(c, "KILLS 087   HEAT 3   SCORE 0012840", 92, 148, COL.ink);
    txt(c, "MILESTONE  HACK 3 CARRIONS  2/3", 92, 162, COL.cyan);
    if (Math.floor(t / 500) % 2) txt(c, "[R] REBOOT", 92, 176, COL.dim);
    return;
  }
  hud(c, W, H, t, mode);
}
function hud(c, W, H, t, mode) {
  panel(c, 6, 6, 98, 24, "#3a3456"); txt(c, "RAIN MARKET", 12, 9, COL.ink); txt(c, "D-01", 12, 19, COL.dim);
  panel(c, W / 2 - 54, 6, 108, 24, "#3a3456"); txt(c, "087/100", W / 2 - 24, 9, COL.ink);
  for (let i = 0; i < 20; i++) { c.fillStyle = i < 17 ? COL.magenta : "#2a2640"; c.fillRect(W / 2 - 49 + i * 5, 21, 4, 3); }
  panel(c, W - 108, 6, 102, 24, "#3a3456"); txt(c, "0012840", W - 100, 9, COL.ink); txt(c, "x4.0", W - 42, 9, COL.cyan);
  for (let i = 0; i < 5; i++) { c.fillStyle = i < 3 ? COL.amber : "#2a2640"; c.fillRect(W - 100 + i * 7, 21, 5, 3); } txt(c, "HEAT", W - 62, 19, COL.dim);
  panel(c, 6, H - 42, 156, 36, "#3a3456");
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, x = 24 + Math.cos(a) * 9, y = H - 24 + Math.sin(a) * 9; c.fillStyle = i < 2 ? (i === 1 && Math.floor(t / 300) % 2 ? COL.amber : COL.ink) : "#2a2640"; c.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); }
  c.fillStyle = "#3a3456"; c.fillRect(23, H - 25, 2, 2);
  txt(c, "KESTREL .44", 42, H - 39, COL.ink);
  txt(c, "OC", 42, H - 28, COL.cyan); c.fillStyle = "#2a2640"; c.fillRect(58, H - 26, 96, 4); c.fillStyle = COL.cyan; c.fillRect(58, H - 26, mode === "oc" ? 30 : 70, 4); c.fillStyle = "#05040b"; c.fillRect(106, H - 26, 1, 4);
  txt(c, "RAM", 42, H - 18, COL.magenta); c.fillStyle = "#2a2640"; c.fillRect(64, H - 16, 90, 4); c.fillStyle = COL.magenta; c.fillRect(64, H - 16, 54, 4);
  panel(c, W - 66, H - 38, 60, 32, "#3a3456");
  [["Q", 0], ["E", 1]].forEach(([k, i]) => { const x = W - 60 + i * 28; c.strokeStyle = COL.magenta; c.strokeRect(x + .5, H - 33.5, 21, 17); txt(c, k, x + 8, H - 14, COL.dim);
    c.fillStyle = COL.magenta; if (i === 0) { [[11, 2], [9, 5], [7, 8], [10, 8], [9, 11], [7, 14]].forEach(([a, b]) => c.fillRect(x + a, H - 33 + b, 3, 2)); } else { c.fillRect(x + 5, H - 26, 12, 1); c.fillRect(x + 7, H - 28, 8, 1); c.fillRect(x + 7, H - 24, 8, 1); c.fillRect(x + 10, H - 26, 2, 1); for (let j = 0; j < 10; j++) c.fillRect(x + 6 + j, H - 21 - j, 1, 1); } });
}
