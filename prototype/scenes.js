/* Arena painter: albedo → multiply ambient → additive lights → emissives. */
"use strict";
function floorTiles(c, W, H, r, o) {
  for (let y = 0; y < H; y += o.t) for (let x = 0; x < W; x += o.t) {
    c.fillStyle = tone(o.base, (r() - .5) * o.j); c.fillRect(x, y, o.t, o.t);
    c.fillStyle = o.seam; c.fillRect(x, y, o.t, 1); c.fillRect(x, y, 1, o.t);
  }
  for (let i = 0; i < W * H * .05; i++) { c.fillStyle = r() < .6 ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.06)"; c.fillRect(r() * W | 0, r() * H | 0, 1, 1); }
  for (let i = 0; i < (o.cracks || 0); i++) { let x = r() * W, y = r() * H; c.fillStyle = o.seam; for (let k = 0; k < 26; k++) { x += (r() - .3) * 2; y += (r() - .5) * 2; c.fillRect(x | 0, y | 0, 1, 1); } }
}
function shadow(c, x, y, w, h) { c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.ellipse(x + w / 2, y, w / 2, h / 2, 0, 0, TAU); c.fill(); }
function blobPath(c, x, y, rw, rh) {
  c.beginPath();
  [[0, 0, 1, 1], [.5, .4, .6, .7], [-.55, -.2, .5, .6]].forEach(([ox, oy, sx, sy]) => { const cx = x + rw * ox, cy = y + rh * oy; c.moveTo(cx + rw * sx, cy); c.ellipse(cx, cy, rw * sx, rh * sy, 0, 0, TAU); });
}
function signBox(c, em, txt, x, y, col) {
  c.font = "8px Silkscreen"; const tw = Math.ceil(c.measureText(txt).width) + 8;
  c.fillStyle = "#0a0814"; c.fillRect(x - 1, y - 1, tw + 2, 14);
  em.push(c2 => {
    c2.font = "8px Silkscreen"; c2.textBaseline = "top";
    c2.strokeStyle = rgba(col, .9); c2.lineWidth = 1; c2.strokeRect(x + .5, y + .5, tw - 1, 11);
    c2.save(); c2.shadowColor = col; c2.shadowBlur = 8; c2.fillStyle = col; c2.fillText(txt, x + 4, y + 2); c2.restore();
    c2.fillStyle = mix(col, "#ffffff", .4); c2.fillText(txt, x + 4, y + 2);
  });
}

/* Backdrops (top band of each arena) */
function facade(c, W, H, r, em, o) {
  const wh = Math.round(H * o.h); c.fillStyle = o.col; c.fillRect(0, 0, W, wh);
  for (let x = 0; x < W; x += 24) { c.fillStyle = tone(o.col, -.25); c.fillRect(x, 0, 1, wh); }
  for (let x = 6; x < W - 10; x += 24) if (r() < .55) {
    c.fillStyle = "#0c0a16"; c.fillRect(x, 4, 12, 8);
    if (r() < .6) { const col = ["#ffb22e", "#2be4ff", "#ff7ab8", "#c9b6ff"][r() * 4 | 0]; em.push(c2 => { c2.fillStyle = rgba(col, .5); c2.fillRect(x + 1, 5, 10, 6); c2.fillStyle = "rgba(0,0,0,.45)"; c2.fillRect(x + 1, 8, 10, 1); }); }
  }
  (o.shutters || []).forEach(fx => { const x = fx * W | 0; c.fillStyle = tone(o.col, .15); c.fillRect(x, wh - 26, 30, 18); c.fillStyle = tone(o.col, -.2); for (let y = wh - 26; y < wh - 8; y += 2) c.fillRect(x, y, 30, 1); });
  for (let i = 0; i < 4; i++) { const x = r() * W | 0; c.fillStyle = tone(o.col, .2); c.fillRect(x, 0, 2, wh - 2); c.fillStyle = tone(o.col, -.3); c.fillRect(x + 2, 0, 1, wh - 2); }
  c.fillStyle = tone(o.col, .35); c.fillRect(0, wh - 2, W, 2); c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(0, wh, W, 5);
  (o.signs || []).forEach(([t, fx, fy, col]) => signBox(c, em, t, fx * W | 0, fy * H | 0, col));
  em.push(c2 => { // overhead cable with lanterns
    c2.strokeStyle = "#07060d"; c2.lineWidth = 1; c2.beginPath(); c2.moveTo(0, wh + 6); c2.quadraticCurveTo(W * .5, wh + 40, W, wh + 2); c2.stroke();
    for (let i = 1; i < 9; i++) { const t = i / 9, x = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * W * .5 + t * t * W, y = (1 - t) * (1 - t) * (wh + 6) + 2 * (1 - t) * t * (wh + 40) + t * t * (wh + 2);
      const col = i % 2 ? COL.magenta : COL.amber; c2.fillStyle = col; c2.fillRect(x | 0, (y | 0) + 1, 2, 3); c2.save(); c2.globalCompositeOperation = "lighter"; glow(c2, x + 1, y + 3, 8, col, .35); c2.restore(); }
  });
}
function skyline(c, W, H, r, em, o) {
  const wh = Math.round(H * o.h); const g = c.createLinearGradient(0, 0, 0, wh); g.addColorStop(0, "#1a1838"); g.addColorStop(1, "#8a3a8a"); c.fillStyle = g; c.fillRect(0, 0, W, wh);
  let x = 0; while (x < W) { const bw = 8 + r() * 22 | 0, bh = 6 + r() * (wh - 8) | 0; c.fillStyle = "#1a1530"; c.fillRect(x, wh - bh, bw, bh);
    const wins = []; for (let wy = wh - bh + 2; wy < wh - 2; wy += 3) for (let wx = x + 1; wx < x + bw - 1; wx += 2) if (r() < .2) wins.push([wx, wy, ["#ff7ab8", "#2be4ff", "#ffb22e"][r() * 3 | 0]]);
    em.push(c2 => wins.forEach(([a, b, col]) => { c2.fillStyle = rgba(col, .75); c2.fillRect(a, b, 1, 1); })); x += bw + 1; }
  c.fillStyle = "#6a7290"; c.fillRect(0, wh - 3, W, 3); c.fillStyle = "#1a1e30"; c.fillRect(0, wh, W, 3);
  em.push(c2 => { c2.fillStyle = "#3d4566"; c2.fillRect(0, wh - 12, W, 1); for (let px = 4; px < W; px += 14) c2.fillRect(px, wh - 12, 1, 10); });
}
function serverWall(c, W, H, r, em, o) {
  const wh = Math.round(H * o.h); c.fillStyle = "#232a40"; c.fillRect(0, 0, W, wh);
  for (let x = 2; x < W - 14; x += 18) {
    c.fillStyle = "#161b2c"; c.fillRect(x, 3, 14, wh - 7); c.fillStyle = "#0d1120"; for (let y = 7; y < wh - 5; y += 4) c.fillRect(x + 1, y, 12, 1);
    const leds = []; for (let y = 8; y < wh - 6; y += 4) for (let j = 0; j < 3; j++) if (r() < .5) leds.push([x + 2 + j * 4, y + 1, ["#4d7cff", "#2bff9a", "#ff2d8a", "#4d7cff"][r() * 4 | 0]]);
    em.push(c2 => leds.forEach(([a, b, col]) => { c2.fillStyle = col; c2.fillRect(a, b, 2, 1); }));
  }
  c.fillStyle = "#4a5470"; c.fillRect(0, wh - 2, W, 2); c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(0, wh, W, 5);
}
function stormGlass(c, W, H, r, em, o) {
  const wh = Math.round(H * o.h); const g = c.createLinearGradient(0, 0, 0, wh); g.addColorStop(0, "#241030"); g.addColorStop(1, "#a0287a"); c.fillStyle = g; c.fillRect(0, 0, W, wh);
  for (let i = 0; i < 20; i++) { c.fillStyle = `rgba(0,0,0,${.2 + r() * .3})`; c.beginPath(); c.ellipse(r() * W, r() * wh * .7, 20 + r() * 50, 3 + r() * 5, 0, 0, TAU); c.fill(); }
  const bolt = []; let bx = W * .72, by = 0; while (by < wh - 14) { bolt.push([bx | 0, by | 0]); bx += (r() - .5) * 10; by += 3 + r() * 4; }
  em.push(c2 => {
    c2.save(); c2.shadowColor = "#e0c8ff"; c2.shadowBlur = 8; for (let i = 1; i < bolt.length; i++) pline(c2, bolt[i - 1][0], bolt[i - 1][1], bolt[i][0], bolt[i][1], "#f4ecff"); c2.restore();
    c2.fillStyle = "rgba(150,200,255,.10)"; c2.fillRect(0, wh - 14, W, 12); c2.fillStyle = "rgba(200,230,255,.5)"; c2.fillRect(0, wh - 14, W, 1);
    c2.fillStyle = "rgba(200,230,255,.25)"; for (let px = 10; px < W; px += 40) c2.fillRect(px, wh - 14, 1, 12);
  });
  c.fillStyle = "#3a3046"; c.fillRect(0, wh - 2, W, 2);
}

const PROPS = {
  crate(c, x, y) { shadow(c, x + 1, y + 13, 22, 5); c.fillStyle = "#5d548a"; c.fillRect(x, y, 20, 5); c.fillStyle = "#3f3766"; c.fillRect(x, y + 5, 20, 9); c.fillStyle = "#231d3d"; c.fillRect(x, y + 13, 20, 1); c.fillStyle = "#7a70aa"; c.fillRect(x, y, 20, 1); c.fillStyle = "#9a7a34"; c.fillRect(x + 3, y + 8, 14, 1); c.fillStyle = "#2b2448"; c.fillRect(x + 9, y + 5, 1, 8); },
  barrier(c, x, y) { shadow(c, x, y + 10, 28, 4); c.fillStyle = "#6a6688"; c.fillRect(x, y, 26, 3); c.fillStyle = "#4a4666"; c.fillRect(x, y + 3, 26, 6); for (let i = 0; i < 26; i += 6) { c.fillStyle = "#c8962a"; c.fillRect(x + i, y + 4, 3, 4); } c.fillStyle = "#2a2740"; c.fillRect(x, y + 9, 26, 1); },
  vending(c, x, y, r, em) { c.fillStyle = "#2e2a44"; c.fillRect(x, y, 16, 26); c.fillStyle = "#1e1b30"; c.fillRect(x + 13, y, 3, 26); shadow(c, x, y + 26, 18, 4);
    em.push(c2 => { c2.fillStyle = rgba(COL.cyan, .85); c2.fillRect(x + 2, y + 3, 10, 12); c2.fillStyle = "#0b0a14"; for (let i = 0; i < 3; i++) c2.fillRect(x + 2, y + 6 + i * 3, 10, 1); c2.fillStyle = "#c9f8ff"; c2.fillRect(x + 2, y + 3, 10, 1); c2.fillStyle = COL.magenta; c2.fillRect(x + 4, y + 18, 6, 2); }); },
  stall(c, x, y, r, em) { shadow(c, x, y + 21, 46, 6); c.fillStyle = "#4a3650"; c.fillRect(x + 2, y + 8, 40, 12); c.fillStyle = "#6a4c70"; c.fillRect(x + 2, y + 8, 40, 2);
    for (let i = 0; i < 44; i += 4) { c.fillStyle = (i / 4) % 2 ? "#3a1430" : "#b0246a"; c.fillRect(x + i, y, 4, 7); } c.fillStyle = "#14101e"; c.fillRect(x, y + 7, 44, 1);
    [[8, 24], [18, 25], [30, 24]].forEach(([sx, sy]) => { c.fillStyle = "#3a3556"; c.fillRect(x + sx, y + sy, 5, 3); });
    em.push(c2 => { [6, 22, 38].forEach(lx => { c2.fillStyle = COL.amber; c2.fillRect(x + lx, y + 8, 2, 3); c2.fillStyle = "#fff0c8"; c2.fillRect(x + lx, y + 9, 2, 1); }); c2.fillStyle = rgba(COL.amber, .5); c2.fillRect(x + 6, y + 12, 30, 1); }); },
  lamp(c, x, y, r, em) { shadow(c, x - 2, y + 22, 8, 3); c.fillStyle = "#3a3556"; c.fillRect(x, y, 2, 22); c.fillStyle = "#4a4466"; c.fillRect(x - 3, y - 2, 8, 3); em.push(c2 => { c2.fillStyle = "#e6dcff"; c2.fillRect(x - 2, y + 1, 6, 1); }); },
  trash(c, x, y) { [[x, y, 5, 4], [x + 6, y + 1, 6, 4], [x + 3, y - 3, 5, 4]].forEach(([a, b, rx, ry]) => { c.fillStyle = "#2a2640"; c.beginPath(); c.ellipse(a, b, rx, ry, 0, 0, TAU); c.fill(); c.fillStyle = "#4a4466"; c.fillRect(a - 2, b - ry + 1, 3, 1); }); },
  vent(c, x, y) { c.fillStyle = "#1a1726"; c.fillRect(x, y, 18, 10); c.fillStyle = "#4a4466"; for (let i = 1; i < 18; i += 3) c.fillRect(x + i, y + 1, 1, 8); },
  manhole(c, x, y) { c.fillStyle = "#2a2640"; c.beginPath(); c.ellipse(x, y, 9, 6, 0, 0, TAU); c.fill(); c.strokeStyle = "#5a5478"; c.beginPath(); c.ellipse(x + .5, y + .5, 8, 5, 0, 0, TAU); c.stroke(); c.fillStyle = "#5a5478"; c.fillRect(x - 4, y - 1, 8, 1); c.fillRect(x - 3, y + 1, 6, 1); },
  ac(c, x, y) { shadow(c, x, y + 17, 22, 5); c.fillStyle = "#7a80a0"; c.fillRect(x, y, 20, 5); c.fillStyle = "#5a6080"; c.fillRect(x, y + 5, 20, 11); c.strokeStyle = "#353a52"; c.beginPath(); c.arc(x + 10.5, y + 10.5, 4.5, 0, TAU); c.stroke(); c.fillStyle = "#353a52"; c.fillRect(x + 6, y + 10, 9, 1); c.fillRect(x + 10, y + 6, 1, 9); },
  antenna(c, x, y, r, em) { c.fillStyle = "#3e4560"; c.fillRect(x, y - 30, 2, 34); c.fillRect(x - 5, y - 22, 12, 1); c.fillRect(x - 3, y - 14, 8, 1); shadow(c, x - 6, y + 4, 14, 3); em.push(c2 => { c2.fillStyle = COL.red; c2.fillRect(x, y - 32, 2, 2); c2.save(); c2.globalCompositeOperation = "lighter"; glow(c2, x + 1, y - 31, 10, COL.red, .5); c2.restore(); }); },
  tank(c, x, y) { shadow(c, x - 14, y + 8, 30, 6); c.fillStyle = "#5d6684"; c.beginPath(); c.ellipse(x, y, 14, 9, 0, 0, TAU); c.fill(); c.fillStyle = "#7680a2"; c.beginPath(); c.ellipse(x, y - 2, 12, 6, 0, 0, TAU); c.fill(); c.strokeStyle = "#3e4560"; c.beginPath(); c.ellipse(x, y - 2, 7, 3.5, 0, 0, TAU); c.stroke(); },
  skylight(c, x, y, r, em) { c.fillStyle = "#3a4260"; c.fillRect(x, y, 30, 18); em.push(c2 => { c2.fillStyle = rgba("#7fd3ff", .35); c2.fillRect(x + 2, y + 2, 12, 14); c2.fillRect(x + 16, y + 2, 12, 14); c2.fillStyle = "rgba(255,255,255,.35)"; c2.fillRect(x + 3, y + 3, 4, 1); c2.fillRect(x + 17, y + 3, 4, 1); }); },
  server(c, x, y, r, em) { shadow(c, x, y + 31, 18, 4); c.fillStyle = "#26304a"; c.fillRect(x, y, 16, 30); c.fillStyle = "#3a4668"; c.fillRect(x, y, 16, 2); c.fillStyle = "#121828"; for (let i = 4; i < 28; i += 4) c.fillRect(x + 1, y + i, 14, 1);
    const leds = []; for (let i = 4; i < 28; i += 4) for (let j = 0; j < 3; j++) if (r() < .6) leds.push([x + 3 + j * 4, y + i + 2, ["#4d7cff", "#2bff9a", "#ff2d8a"][r() * 3 | 0]]); em.push(c2 => leds.forEach(([a, b, col]) => { c2.fillStyle = col; c2.fillRect(a, b, 2, 1); })); },
  frost(c, x, y, r) { c.fillStyle = "rgba(200,225,255,.25)"; c.beginPath(); c.ellipse(x, y, 26, 9, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(230,240,255,.45)"; for (let i = 0; i < 40; i++) c.fillRect(x - 22 + r() * 44 | 0, y - 6 + r() * 12 | 0, 1, 1); },
  trench(c, x, y, r, em, f = 1) { const len = c.canvas.width * f; c.fillStyle = "#0d1020"; c.fillRect(x, y, len, 4); em.push(c2 => { c2.fillStyle = rgba("#4d7cff", .85); c2.fillRect(x, y + 1, len, 1); c2.fillStyle = rgba(COL.magenta, .6); c2.fillRect(x, y + 2, len, 1); }); },
  helipad(c, x, y) { c.strokeStyle = "rgba(255,178,46,.6)"; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 42, 26, 0, 0, TAU); c.stroke(); c.lineWidth = 1; c.fillStyle = "rgba(255,178,46,.6)"; c.fillRect(x - 12, y - 10, 3, 20); c.fillRect(x + 9, y - 10, 3, 20); c.fillRect(x - 9, y - 1, 18, 3); },
  hole(c, x, y, r, em, w = 50, h = 22) {
    const P = [[x, y], [x + w * .4, y - h * .4], [x + w, y - h * .1], [x + w * .85, y + h * .6], [x + w * .2, y + h * .5]];
    c.fillStyle = "#030208"; poly(c, P); c.fill();
    const pts = []; for (let i = 0; i < 30; i++) pts.push([x + w * .1 + r() * w * .8 | 0, y - h * .3 + r() * h * .8 | 0, ["#ffb22e", "#ff2d8a", "#2be4ff", "#c9b6ff"][r() * 4 | 0]]);
    em.push(c2 => { c2.save(); poly(c2, P); c2.clip(); pts.forEach(([a, b, col]) => { c2.fillStyle = rgba(col, .75); c2.fillRect(a, b, 1, 1); }); c2.restore(); c2.strokeStyle = "rgba(255,178,46,.5)"; poly(c2, P); c2.stroke(); });
  },
};

function paintScene(W, H, cfg) {
  const C = mk(W, H), c = C.getContext("2d"), r = rngF(cfg.seed); const em = [];
  cfg.floor(c, W, H, r);
  cfg.back(c, W, H, r, em);
  const puddles = (cfg.puddles || []).map(([fx, fy, rw, rh]) => [fx * W, fy * H, rw, rh]);
  puddles.forEach(([x, y, rw, rh]) => { c.fillStyle = cfg.puddle; blobPath(c, x, y, rw, rh); c.fill(); });
  cfg.props.forEach(([fn, fx, fy, ...a]) => PROPS[fn](c, Math.round(fx * W), Math.round(fy * H), r, em, ...a));
  c.globalCompositeOperation = "multiply"; c.fillStyle = cfg.ambient; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "lighter";
  const lights = cfg.lights.map(([fx, fy, rad, col, a]) => [fx * W, fy * H, rad, col, a]);
  lights.forEach(([x, y, rad, col, a]) => glow(c, x, y, rad, col, a));
  puddles.forEach(([x, y, rw, rh]) => { c.save(); blobPath(c, x, y, rw, rh); c.clip();
    lights.forEach(([lx, ly, rad, col, a]) => { if (Math.abs(lx - x) < rw + 30 && rad < 150) glowE(c, lx, y + (y - ly) * .1, 5, rh * 2.6, col, a * .9); });
    c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(x - rw * .6, y - 1, rw * .5, 1); c.restore(); });
  c.globalCompositeOperation = "source-over";
  em.forEach(f => f(c));
  if (cfg.fog) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(cfg.fog, .35)); g.addColorStop(.45, rgba(cfg.fog, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  return { C, W, H, rain: cfg.rain === false ? null : mkRain(W, H, cfg.seed + 1) };
}
function mkRain(W, H, seed) {
  const r = rngF(seed), n = W * H / 650 | 0, drops = [], spl = [];
  for (let i = 0; i < n; i++) drops.push([r() * W, r() * H, 2 + r() * 4 | 0, .08 + r() * .12]);
  for (let i = 0; i < n / 5; i++) spl.push([r() * W | 0, (H * .22 + r() * H * .78) | 0, r()]);
  return { drops, spl };
}
// Weather particles. S.weather: rain (default), heavy, acid, snow, ash, embers. Smog is painted into the map itself.
function drawRain(c, S, t, slow = 1) {
  if (!S.rain) return; const { W, H } = S, w = S.weather || "rain";
  if (w === "snow" || w === "ash" || w === "embers") {
    const col = w === "snow" ? "rgba(235,240,255,.75)" : w === "ash" ? "rgba(160,150,170,.6)" : null;
    for (const [x, y, l, s] of S.rain.drops) { const k = t * s * slow * (w === "snow" ? .22 : .16);
      if (w === "embers") { const yy = H - ((y + k) % H), xx = (x + Math.sin(k * .05 + x) * 6 + W) % W; c.fillStyle = (x | 0) % 3 ? "rgba(255,178,46,.8)" : "rgba(255,90,40,.8)"; if (((t * .01 + x) | 0) % 5) c.fillRect(xx | 0, yy | 0, 1, 1); }
      else { const yy = (y + k) % H, xx = (x + Math.sin(k * .04 + y) * 8 + W) % W; c.fillStyle = col; c.fillRect(xx | 0, yy | 0, l > 4 && w === "snow" ? 2 : 1, 1); } }
    return; }
  c.fillStyle = w === "acid" ? "rgba(150,255,120,.34)" : w === "heavy" ? "rgba(185,195,255,.46)" : "rgba(185,195,255,.34)";
  for (const [x, y, l, s] of S.rain.drops) { const yy = (y + t * s * slow * (w === "heavy" ? 1.3 : 1)) % H; c.fillRect(x | 0, yy | 0, 1, slow < 1 ? 1 : l + (w === "heavy" ? 2 : 0)); }
  if (slow < 1) return;
  c.lineWidth = 1;
  for (const [x, y, ph] of S.rain.spl) { const p = (t * .0012 + ph) % 1; if (p < .25) { const k = p / .25; c.strokeStyle = `rgba(185,195,255,${.5 * (1 - k)})`; c.beginPath(); c.ellipse(x + .5, y + .5, 1 + k * 4, .5 + k * 1.6, 0, 0, TAU); c.stroke(); } }
}
function steam(c, x, y, t) { for (let i = 0; i < 6; i++) { const p = (t * .0004 + i / 6) % 1; c.fillStyle = `rgba(200,195,230,${.16 * (1 - p)})`; c.beginPath(); c.arc(x + Math.sin(p * 6 + i) * 4, y - p * 34, 3 + p * 7, 0, TAU); c.fill(); } }

const DISTRICTS = {
  market: { name: "Rain Market", kills: "Kills 0–100", seed: 3, ambient: "#4b4670", puddle: "#1a1630", fog: "#2a1238",
    desc: "Neon bazaar under a permanent downpour. Shoot down signs onto enemies, hide shots in vent steam, and use puddles to conduct Short Circuit.",
    sw: ["#1a1630", "#3d3858", "#ff2d8a", "#2be4ff", "#ffb22e"],
    floor: (c, W, H, r) => { floorTiles(c, W, H, r, { t: 16, base: "#4a4468", j: .10, seam: "#2e2a46", cracks: 14 }); for (let x = 4; x < W; x += 30) { c.fillStyle = "rgba(200,160,70,.6)"; for (let i = 0; i < 16; i++) if (r() < .85) c.fillRect(x + i, H * .6 | 0, 1, 2); } },
    back: (c, W, H, r, em) => facade(c, W, H, r, em, { h: .2, col: "#463e66", shutters: [.04, .42], signs: [["NOODLE", .14, .07, COL.magenta], ["CAW//24H", .56, .08, COL.cyan], ["PAWN", .86, .04, COL.amber]] }),
    puddles: [[.22, .74, 30, 8], [.7, .5, 22, 6], [.5, .92, 40, 8], [.88, .82, 18, 5], [.36, .3, 16, 4]],
    props: [["stall", .05, .22], ["vending", .76, .115], ["crate", .3, .42], ["crate", .335, .47], ["crate", .66, .34], ["barrier", .6, .68], ["lamp", .93, .5], ["trash", .06, .86], ["vent", .46, .78], ["manhole", .2, .62], ["crate", .12, .5]],
    lights: [[.18, .26, 80, COL.magenta, .5], [.62, .25, 70, COL.cyan, .45], [.9, .2, 46, COL.amber, .4], [.1, .33, 56, COL.amber, .45], [.94, .55, 70, "#c9b6ff", .35], [.79, .24, 40, COL.cyan, .4], [.5, .62, 220, "#3b2f7a", .3]] },
  rookery: { name: "Chrome Rookery", kills: "Kills 100–200", seed: 5, ambient: "#46527a", puddle: "#1a2034", fog: "#203050",
    desc: "Rooftops above the market. Wind gusts bend your bullets, and drone Nests keep respawning Corvids until you hack them.",
    sw: ["#1a2034", "#4a5470", "#7fd3ff", "#ff3d3d", "#ff2d8a"],
    floor: (c, W, H, r) => { floorTiles(c, W, H, r, { t: 24, base: "#566082", j: .08, seam: "#363e58", cracks: 6 }); for (let y = 0; y < H; y += 24) for (let x = 0; x < W; x += 24) { c.fillStyle = "#7a84a8"; [[2, 2], [21, 2], [2, 21], [21, 21]].forEach(([a, b]) => c.fillRect(x + a, y + b, 1, 1)); } },
    back: (c, W, H, r, em) => skyline(c, W, H, r, em, { h: .26 }),
    puddles: [[.3, .72, 26, 7], [.75, .62, 20, 5], [.55, .9, 30, 6]],
    props: [["ac", .06, .4], ["ac", .14, .46], ["tank", .88, .45], ["antenna", .72, .42], ["skylight", .42, .52], ["crate", .24, .8], ["vent", .6, .82]],
    lights: [[.5, .1, 160, COL.magenta, .25], [.72, .26, 40, COL.red, .45], [.47, .57, 80, "#7fd3ff", .4], [.2, .7, 90, "#5a7cff", .25], [.9, .8, 60, COL.amber, .2]] },
  datacrypt: { name: "Datacrypt", kills: "Kills 200–300", seed: 8, ambient: "#3a4470", puddle: "#0e1424", fog: "#101a3a", rain: false,
    desc: "A server farm under the city. Turrets are hackable, cooling floors freeze your dash for a moment, and the only light is machine light.",
    sw: ["#0e1424", "#3a4460", "#4d7cff", "#2bff9a", "#ff2d8a"],
    floor: (c, W, H, r) => { floorTiles(c, W, H, r, { t: 8, base: "#46526e", j: .06, seam: "#2e3650" }); for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) { c.fillStyle = "#2c3450"; c.fillRect(x + 3, y + 3, 2, 2); } },
    back: (c, W, H, r, em) => serverWall(c, W, H, r, em, { h: .22 }),
    puddles: [],
    props: [["trench", 0, .6, 1], ["server", .16, .3], ["server", .22, .3], ["server", .28, .3], ["server", .64, .3], ["server", .7, .3], ["server", .76, .3], ["frost", .45, .82], ["frost", .86, .74], ["crate", .08, .78]],
    lights: [[.24, .42, 90, "#4d7cff", .5], [.72, .42, 90, "#4d7cff", .5], [.5, .6, 170, "#4d7cff", .22], [.93, .14, 60, COL.magenta, .55], [.45, .84, 50, "#c8e0ff", .3]] },
  spire: { name: "Spire Zero", kills: "Kills 300–400", seed: 13, ambient: "#5a4660", puddle: "#140d18", fog: "#3a0d2a",
    desc: "The corporate summit, mid-storm. The roof breaks apart as the fight goes on, so the arena keeps shrinking under CORVUS's gaze.",
    sw: ["#140d18", "#2e2838", "#ffb22e", "#ff3d3d", "#ff2d8a"],
    floor: (c, W, H, r) => { floorTiles(c, W, H, r, { t: 32, base: "#3a3446", j: .06, seam: "#26222e" }); c.strokeStyle = "rgba(220,210,245,.2)"; c.lineWidth = 1; for (let i = 0; i < 14; i++) { c.beginPath(); let x = r() * W, y = r() * H; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 40; y += (r() - .5) * 20; c.lineTo(x, y); } c.stroke(); } c.fillStyle = "rgba(255,178,46,.55)"; c.fillRect(0, H * .48 | 0, W, 1); c.fillRect(W * .5 | 0, H * .22 | 0, 1, H); },
    back: (c, W, H, r, em) => stormGlass(c, W, H, r, em, { h: .22 }),
    puddles: [[.2, .76, 20, 6], [.8, .56, 26, 6]],
    props: [["helipad", .5, .62], ["hole", .06, .42, 60, 26], ["hole", .72, .84, 70, 24], ["barrier", .38, .3], ["barrier", .62, .88]],
    lights: [[.5, .04, 220, COL.magenta, .35], [.15, .45, 60, COL.amber, .3], [.85, .85, 60, COL.amber, .3], [.5, .62, 120, COL.red, .2], [.9, .3, 50, COL.red, .4]] },
};
