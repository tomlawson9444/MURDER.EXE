/* Tile-based arena maps: 30x17 tiles of 16px (480x272), 3/4 top-down. Object painters live here. */
"use strict";
const TS = 16;
const CLASS = { "#": "hard", k: "hard", m: "hard", p: "hard", q: "hard", S: "hard", u: "hard", W: "hard", v: "hard", Z: "hard", D: "hard", T: "haz", A: "hard",
  h: "low", c: "soft", b: "hack", d: "hack", n: "hack", t: "hack", x: "haz", o: "haz", r: "haz", w: "haz", f: "haz", g: "haz", s: "spawn" };
const GROUPED = new Set("kmSquWHTZD".split(""));
const BLOCKS = ch => ["hard", "low", "soft"].includes(CLASS[ch]) && ch !== "T";

function block(c, x, y, w, d, hgt, top, front, edge) {
  c.fillStyle = top; c.fillRect(x, y, w, d);
  c.fillStyle = edge || tone(top, .25); c.fillRect(x, y, w, 1);
  c.fillStyle = front; c.fillRect(x, y + d, w, hgt);
  c.fillStyle = tone(front, -.35); c.fillRect(x, y + d + hgt - 1, w, 1); c.fillRect(x + w - 1, y + d, 1, hgt);
  c.fillStyle = tone(top, -.2); c.fillRect(x, y + d, w, 1);
}
function dropShadow(c, x, y, w, h) { c.fillStyle = "rgba(0,0,0,.38)"; c.fillRect(x + 3, y + 3, w, h); }

const FLOORS = {
  asphalt(c, x, y, r, th) { c.fillStyle = tone(th.floor, (r() - .5) * .1); c.fillRect(x, y, TS, TS); c.fillStyle = th.seam; if (r() < .5) c.fillRect(x, y, TS, 1); if (r() < .5) c.fillRect(x, y, 1, TS);
    for (let i = 0; i < 7; i++) { c.fillStyle = r() < .6 ? "rgba(0,0,0,.28)" : "rgba(255,255,255,.07)"; c.fillRect(x + r() * TS | 0, y + r() * TS | 0, 1, 1); }
    if (r() < .08) { c.fillStyle = th.seam; let px = x + 2, py = y + r() * 14; for (let k = 0; k < 14; k++) { px += 1; py += (r() - .5) * 2; c.fillRect(px | 0, py | 0, 1, 1); } } },
  plate(c, x, y, r, th) { c.fillStyle = tone(th.floor, (r() - .5) * .08); c.fillRect(x, y, TS, TS); c.fillStyle = th.seam; c.fillRect(x, y, TS, 1); c.fillRect(x, y, 1, TS);
    c.fillStyle = tone(th.floor, .3); [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([a, b]) => c.fillRect(x + a, y + b, 1, 1));
    if (r() < .15) { c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + 3, y + 7, 10, 1); } },
  grate(c, x, y, r, th) { c.fillStyle = tone(th.floor, (r() - .5) * .06); c.fillRect(x, y, TS, TS); c.fillStyle = th.seam; c.fillRect(x, y, TS, 1); c.fillRect(x, y, 1, TS);
    c.fillStyle = tone(th.floor, -.3); for (let i = 3; i < TS; i += 4) for (let j = 3; j < TS; j += 4) c.fillRect(x + i, y + j, 2, 2); },
  marble(c, x, y, r, th) { c.fillStyle = tone(th.floor, (r() - .5) * .05); c.fillRect(x, y, TS, TS); if ((x / TS + y / TS) % 2 === 0) { c.fillStyle = "rgba(255,255,255,.03)"; c.fillRect(x, y, TS, TS); }
    c.fillStyle = th.seam; c.fillRect(x, y, TS, 1); c.fillRect(x, y, 1, TS);
    if (r() < .25) { c.fillStyle = "rgba(225,215,250,.18)"; let px = x + r() * 16, py = y; for (let k = 0; k < 16; k++) { px += (r() - .5) * 2; py += 1; c.fillRect(px | 0, py | 0, 1, 1); } } },
};

/* Per-tile decals (drawn on the floor before objects) */
const DECALS = {
  w(c, x, y, G, tx, ty) { const n = (dx, dy) => G.at(tx + dx, ty + dy) === "w"; c.fillStyle = "rgba(8,6,20,.55)"; c.fillRect(x + (n(-1, 0) ? 0 : 2), y + (n(0, -1) ? 0 : 3), TS - (n(-1, 0) ? 0 : 2) - (n(1, 0) ? 0 : 2), TS - (n(0, -1) ? 0 : 3) - (n(0, 1) ? 0 : 3)); },
  g(c, x, y) { c.fillStyle = "#16131f"; c.fillRect(x + 1, y + 3, 14, 10); c.fillStyle = "#4a4466"; for (let i = 2; i < 15; i += 3) c.fillRect(x + i, y + 4, 1, 8); },
  r(c, x, y, G, tx, ty) { c.fillStyle = "#16131f"; c.fillRect(x, y + 1, TS, 14); c.fillStyle = "#2a2538"; for (let i = 1; i < TS; i += 4) c.fillRect(x + i, y + 2, 2, 12);
    c.fillStyle = "#9a98b8"; c.fillRect(x, y + 4, TS, 1); c.fillRect(x, y + 11, TS, 1); c.fillStyle = "#c8962a"; if (tx % 2) c.fillRect(x + 2, y, 8, 1); },
  x(c, x, y) { c.fillStyle = "#1a1726"; c.fillRect(x, y, TS, TS); c.fillStyle = "#c8962a"; for (let i = -16; i < 16; i += 5) for (let k = 0; k < 16; k++) { const px = x + i + k; if (px >= x && px < x + TS) c.fillRect(px, y + k, 2, 1); } },
  f(c, x, y, G, tx, ty, r) { c.fillStyle = "rgba(200,225,255,.22)"; c.fillRect(x, y, TS, TS); c.fillStyle = "rgba(235,245,255,.5)"; for (let i = 0; i < 5; i++) c.fillRect(x + r() * 15 | 0, y + r() * 15 | 0, 1, 1); },
  "=": (c, x, y, G, tx, ty) => { c.fillStyle = "#4a5070"; c.fillRect(x, y, TS, TS); c.fillStyle = "#2a3048"; for (let i = 0; i < TS; i += 3) c.fillRect(x + i, y, 1, TS); c.fillStyle = "#9aa4c8"; if (G.at(tx, ty - 1) === "o") c.fillRect(x, y, TS, 1); if (G.at(tx, ty + 1) === "o") c.fillRect(x, y + TS - 1, TS, 1); },
  o(c, x, y, G, tx, ty, r, em) { c.fillStyle = "#030208"; c.fillRect(x, y, TS, TS);
    const up = G.at(tx, ty - 1); if (up !== "o" && up !== "=") { c.fillStyle = "#1c1424"; c.fillRect(x, y, TS, 5); c.fillStyle = "#2c2236"; for (let i = 0; i < TS; i += 2) c.fillRect(x + i, y + 5, 1, (r() * 3 | 0)); }
    const pts = []; for (let i = 0; i < 4; i++) pts.push([x + r() * TS | 0, y + 6 + r() * 9 | 0, ["#ffb22e", "#ff2d8a", "#2be4ff", "#c9b6ff"][r() * 4 | 0]]);
    em.push(c2 => pts.forEach(([a, b, col]) => { c2.fillStyle = rgba(col, .65); c2.fillRect(a, b, 1, 1); })); },
};

/* Objects. (c, x, y, w, h, ctx) where x,y,w,h are pixel bounds of the tile or group. */
const OBJ = {
  "#"(c, x, y, w, h, X) { if (y < 2 * TS) return; const th = X.th, below = X.G.at(X.tx, X.ty + 1);
    c.fillStyle = th.wallTop; c.fillRect(x, y, TS, TS); c.fillStyle = tone(th.wallTop, .12); c.fillRect(x + 2 + (X.r() * 8 | 0), y + 3 + (X.r() * 8 | 0), 3, 1);
    if (below && below !== "#" && below !== "s") { c.fillStyle = th.wallFront; c.fillRect(x, y + 6, TS, 10); c.fillStyle = th.wallEdge; c.fillRect(x, y + 6, TS, 1); c.fillStyle = tone(th.wallFront, -.3); c.fillRect(x, y + 11, TS, 1); c.fillRect(x, y + 15, TS, 1); } },
  h(c, x, y, w, h, X) { const L = X.G.at(X.tx - 1, X.ty) === "h", Rr = X.G.at(X.tx + 1, X.ty) === "h", th = X.th; const x0 = x + (L ? 0 : 1), ww = TS - (L ? 0 : 1) - (Rr ? 0 : 1);
    dropShadow(c, x0, y + 5, ww, 11);
    if (th.low === "planter") { block(c, x0, y + 4, ww, 6, 6, "#2a3a34", "#4a4458"); c.fillStyle = "#1a5a46"; for (let i = 1; i < ww - 1; i += 3) c.fillRect(x0 + i, y + 3 + ((i * 7) % 3), 2, 3); X.em.push(c2 => { c2.fillStyle = rgba(COL.magenta, .8); c2.fillRect(x0 + 2, y + 5, 1, 1); c2.fillRect(x0 + ww - 4, y + 6, 1, 1); }); }
    else if (th.low === "sandbag") { block(c, x0, y + 5, ww, 5, 6, "#6a6688", "#4a4666"); c.fillStyle = "#3a3656"; for (let i = 4; i < ww; i += 5) c.fillRect(x0 + i, y + 5, 1, 11); }
    else { block(c, x0, y + 5, ww, 5, 6, "#7a7698", "#555177"); for (let i = 0; i < ww; i += 6) { c.fillStyle = "#c8962a"; c.fillRect(x0 + i + 1, y + 11, 3, 3); } } },
  c(c, x, y) { dropShadow(c, x + 1, y + 3, 14, 13); block(c, x + 1, y + 2, 14, 6, 7, "#6e62a2", "#4a4274"); c.fillStyle = "#2e2850"; c.fillRect(x + 1, y + 8, 14, 1); for (let k = 0; k < 7; k++) { c.fillRect(x + 2 + k * 2, y + 9 + (k % 7), 1, 1); } c.fillStyle = "#b08a3a"; c.fillRect(x + 3, y + 4, 10, 1); },
  b(c, x, y, w, h, X) { dropShadow(c, x + 3, y + 5, 10, 10); c.fillStyle = "#5a4426"; c.fillRect(x + 3, y + 6, 10, 9); c.fillStyle = "#7a5c32"; c.beginPath(); c.ellipse(x + 8, y + 6, 5, 2.5, 0, 0, TAU); c.fill(); c.fillStyle = "#3a2c18"; c.fillRect(x + 12, y + 6, 1, 9);
    X.em.push(c2 => { c2.fillStyle = COL.amber; c2.fillRect(x + 3, y + 9, 10, 1); c2.fillRect(x + 3, y + 12, 10, 1); c2.fillStyle = "#fff0c8"; c2.fillRect(x + 7, y + 10, 2, 1); }); X.light(x + 8, y + 10, 26, COL.amber, .35); },
  v(c, x, y, w, h, X) { dropShadow(c, x + 1, y + 1, 14, 15); block(c, x + 1, y, 14, 4, 12, "#4a4466", "#2e2a44"); const col = X.tx % 2 ? COL.cyan : COL.magenta;
    X.em.push(c2 => { c2.fillStyle = rgba(col, .9); c2.fillRect(x + 3, y + 6, 8, 6); c2.fillStyle = "#0b0a14"; c2.fillRect(x + 3, y + 8, 8, 1); c2.fillRect(x + 3, y + 10, 8, 1); c2.fillStyle = mix(col, "#ffffff", .6); c2.fillRect(x + 3, y + 6, 8, 1); }); X.light(x + 8, y + 14, 40, col, .45); },
  p(c, x, y, w, h, X) { dropShadow(c, x + 2, y + 2, 12, 13); block(c, x + 2, y - 8, 12, 9, 14, "#8a86a8", "#555177"); X.em.push(c2 => { c2.fillStyle = rgba(X.th.accent, .9); c2.fillRect(x + 2, y + 6, 12, 1); }); X.light(x + 8, y + 8, 24, X.th.accent, .3); },
  n(c, x, y, w, h, X) { c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(x + 8, y + 12, 9, 3, 0, 0, TAU); c.fill(); const col = [COL.magenta, COL.cyan, COL.amber][(X.tx + X.ty) % 3];
    X.em.push(c2 => { c2.fillStyle = "#07060d"; c2.fillRect(x + 1, y - 26, 1, 16); c2.fillRect(x + 14, y - 26, 1, 16); c2.fillStyle = "#0a0814"; c2.fillRect(x - 4, y - 11, 24, 10); c2.strokeStyle = col; c2.strokeRect(x - 3.5, y - 10.5, 23, 9);
      c2.fillStyle = mix(col, "#ffffff", .4); for (let i = 0; i < 16; i += 3) c2.fillRect(x - 1 + i, y - 8 + (i % 2), 2, 4); c2.save(); c2.globalCompositeOperation = "lighter"; glow(c2, x + 8, y - 6, 18, col, .4); c2.restore(); }); X.light(x + 8, y + 10, 46, col, .4); },
  k(c, x, y, w, h, X) { dropShadow(c, x + 2, y + 4, w - 4, h - 6); const col = X.th.car; c.fillStyle = "#0a0910"; [[x + 6, y + 3], [x + w - 13, y + 3], [x + 6, y + h - 6], [x + w - 13, y + h - 6]].forEach(([a, b]) => c.fillRect(a, b, 7, 4));
    c.fillStyle = col; c.fillRect(x + 2, y + 5, w - 4, h - 12); c.fillStyle = tone(col, -.35); c.fillRect(x + 2, y + h - 7, w - 4, 5); c.fillStyle = tone(col, .25); c.fillRect(x + 2, y + 5, w - 4, 1);
    c.fillStyle = tone(col, -.2); c.fillRect(x + 13, y + 8, w - 26, h - 18); c.fillStyle = "rgba(43,228,255,.35)"; c.fillRect(x + w - 14, y + 8, 3, h - 18); c.fillRect(x + 11, y + 8, 2, h - 18); c.fillStyle = "rgba(255,255,255,.3)"; c.fillRect(x + w - 14, y + 9, 1, 3);
    X.em.push(c2 => { c2.fillStyle = COL.amber; c2.fillRect(x + w - 3, y + 6, 1, 3); c2.fillRect(x + w - 3, y + h - 11, 1, 3); c2.fillStyle = COL.red; c2.fillRect(x + 2, y + 6, 1, 3); c2.fillRect(x + 2, y + h - 11, 1, 3); }); X.light(x + w + 12, y + h / 2 - 2, 34, COL.amber, .35); X.light(x - 4, y + h / 2, 16, COL.red, .3); },
  m(c, x, y, w, h, X) { dropShadow(c, x, y + 8, w, h - 4); block(c, x + 2, y + 12, w - 4, 6, 10, "#6a5a7a", "#3e3250"); for (let i = 0; i < w; i += 4) { c.fillStyle = (i / 4) % 2 ? "#3a1430" : "#c02a74"; c.fillRect(x + i, y, 4, 11); c.fillRect(x + i + 1, y + 11, 2, 1); }
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(x, y + 8, w, 3); for (let i = 6; i < w - 4; i += 12) { c.fillStyle = "#3a3556"; c.fillRect(x + i, y + h + 1, 5, 3); }
    X.em.push(c2 => { for (let i = 4; i < w - 2; i += 12) { c2.fillStyle = COL.amber; c2.fillRect(x + i, y + 11, 2, 3); c2.fillStyle = "#fff0c8"; c2.fillRect(x + i, y + 12, 2, 1); } c2.fillStyle = rgba(COL.amber, .5); c2.fillRect(x + 5, y + 18, w - 10, 1); }); X.light(x + w / 2, y + h, 64, COL.amber, .45); X.steam.push([x + w * .7, y + 10]); },
  S(c, x, y, w, h, X) { dropShadow(c, x, y + 4, w, h); block(c, x, y, w, h - 10, 10, "#5e6688", "#2e3348"); c.fillStyle = "#3e4462"; for (let i = 2; i < w; i += 3) c.fillRect(x + i, y + 2, 1, h - 13);
    c.fillStyle = "#1a1e30"; for (let i = 4; i < w; i += 14) c.fillRect(x + i, y + h - 10, 2, 10); c.fillStyle = "#8a94b8"; for (let k = 0; k < 10; k += 2) c.fillRect(x + w - 8, y + h - 10 + k, 5, 1); c.fillRect(x + w - 8, y + h - 10, 1, 10); c.fillRect(x + w - 4, y + h - 10, 1, 10);
    c.fillStyle = "#9aa4c8"; c.fillRect(x, y + h - 14, w - 10, 1); for (let i = 0; i < w - 10; i += 6) c.fillRect(x + i, y + h - 14, 1, 3); X.light(x + 8, y + 6, 30, COL.amber, .3); },
  q(c, x, y, w, h, X) { dropShadow(c, x, y - 2, w, 18); block(c, x, y - 8, w, 7, 16, "#3a4668", "#1c2238"); const leds = [];
    for (let i = 0; i < w; i += 12) { c.fillStyle = "#0d1120"; c.fillRect(x + i, y - 1, 1, 16); for (let k = 1; k < 14; k += 3) { c.fillRect(x + i + 2, y + k, 8, 1); if (X.r() < .7) leds.push([x + i + 3 + (X.r() * 6 | 0), y + k + 1, ["#4d7cff", "#2bff9a", "#ff2d8a", "#4d7cff"][X.r() * 4 | 0]]); } }
    X.em.push(c2 => leds.forEach(([a, b, col]) => { c2.fillStyle = col; c2.fillRect(a, b, 2, 1); })); for (let i = 0; i < w; i += 32) X.light(x + i + 16, y + 12, 34, "#4d7cff", .4); },
  u(c, x, y, w, h, X) { dropShadow(c, x + 1, y + 2, w - 2, h - 2); block(c, x + 1, y, w - 2, h - 7, 6, "#8890b0", "#5a6080"); c.strokeStyle = "#3e4462"; for (let i = 0; i < w - 6; i += 14) { c.beginPath(); c.arc(x + 8.5 + i, y + 5.5, 4, 0, TAU); c.stroke(); c.fillStyle = "#3e4462"; c.fillRect(x + 5 + i, y + 5, 7, 1); } },
  W(c, x, y, w, h, X) { c.fillStyle = "rgba(0,0,0,.38)"; c.beginPath(); c.ellipse(x + w / 2 + 3, y + h - 3, w / 2, 6, 0, 0, TAU); c.fill(); c.fillStyle = "#5d6684"; c.fillRect(x + 2, y + 8, w - 4, h - 14); c.beginPath(); c.ellipse(x + w / 2, y + h - 6, w / 2 - 2, 5, 0, 0, TAU); c.fill();
    c.fillStyle = "#6e78a0"; c.fillRect(x + 4, y + 8, 4, h - 14); c.fillStyle = "#454d68"; c.fillRect(x + w - 9, y + 8, 5, h - 14); c.fillStyle = "#8a94b8"; c.beginPath(); c.ellipse(x + w / 2, y + 8, w / 2 - 2, 6, 0, 0, TAU); c.fill(); c.strokeStyle = "#454d68"; c.beginPath(); c.ellipse(x + w / 2, y + 8, w / 4, 3, 0, 0, TAU); c.stroke();
    c.fillStyle = "#2e3348"; for (let k = 10; k < h - 6; k += 3) c.fillRect(x + w / 2 + 6, y + k, 4, 1); },
  A(c, x, y, w, h, X) { c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(x + 6, y + 12, 8, 3); c.fillStyle = "#4a5270"; c.fillRect(x + 7, y - 26, 2, 40); c.fillRect(x + 2, y - 18, 12, 1); c.fillRect(x + 4, y - 10, 8, 1); X.em.push(c2 => { c2.fillStyle = COL.red; c2.fillRect(x + 7, y - 28, 2, 2); }); X.light(x + 8, y - 26, 16, COL.red, .6); },
  N(c, x, y, w, h, X) { X.em.push(c2 => drawSpr(c2, X.SP.nest, x - 4, y - 6)); X.light(x + 8, y + 6, 26, COL.red, .4); },
  t(c, x, y, w, h, X) { c.fillStyle = "rgba(0,0,0,.4)"; c.beginPath(); c.ellipse(x + 9, y + 12, 7, 3, 0, 0, TAU); c.fill(); c.fillStyle = "#3e4462"; c.beginPath(); c.ellipse(x + 8, y + 11, 6, 3, 0, 0, TAU); c.fill(); block(c, x + 3, y + 2, 10, 5, 4, "#6a7294", "#3a4060"); c.fillStyle = "#2a2e44"; c.fillRect(x + 8, y + 7, 7, 2);
    X.em.push(c2 => { c2.fillStyle = COL.red; c2.fillRect(x + 6, y + 8, 2, 1); }); X.light(x + 8, y + 8, 20, COL.red, .4); },
  d(c, x, y, w, h, X) { c.fillStyle = "#1a1726"; c.fillRect(x + 2, y + 9, 12, 5); c.fillStyle = "#4a4466"; c.fillRect(x + 2, y + 9, 12, 1);
    X.em.push(c2 => { c2.fillStyle = COL.amber; c2.fillRect(x + 4, y + 11, 8, 1); c2.fillStyle = rgba(COL.amber, .18); c2.fillRect(x + 2, y - 4, 12, 13); c2.fillStyle = rgba(COL.amber, .5); c2.fillRect(x + 2, y - 4, 12, 1); }); X.light(x + 8, y + 10, 22, COL.amber, .3); },
  H(c, x, y, w, h) { c.strokeStyle = "rgba(255,178,46,.6)"; c.lineWidth = 2; c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, TAU); c.stroke(); c.lineWidth = 1; c.fillStyle = "rgba(255,178,46,.6)"; const cx = x + w / 2 | 0, cy = y + h / 2 | 0; c.fillRect(cx - 10, cy - 9, 3, 18); c.fillRect(cx + 7, cy - 9, 3, 18); c.fillRect(cx - 7, cy - 1, 14, 3); },
  T(c, x, y, w, h, X) { dropShadow(c, x, y - 6, w, 20); block(c, x, y - 10, w, 9, 15, "#9aa0c0", "#4a5070"); c.fillStyle = "#2a2e44"; for (let i = 60; i < w; i += 62) c.fillRect(x + i, y - 10, 2, 24);
    const wins = []; for (let i = 4; i < w - 6; i += 8) if ((i % 62) < 54) wins.push(x + i); X.em.push(c2 => { wins.forEach((a, k) => { c2.fillStyle = k % 5 ? rgba(COL.cyan, .7) : rgba(COL.amber, .8); c2.fillRect(a, y + 1, 5, 4); }); c2.fillStyle = COL.amber; c2.fillRect(x + w - 2, y, 2, 3); c2.fillStyle = "rgba(200,210,255,.25)"; for (let k = 0; k < 6; k++) c2.fillRect(x - 30 + k * 4, y - 6 + k * 3, 24, 1); });
    for (let i = 0; i < w; i += 48) X.light(x + i + 24, y + 6, 30, COL.cyan, .25); },
  Z(c, x, y, w, h, X) { dropShadow(c, x + 3, y + 12, w - 6, h - 12); block(c, x + 3, y + 14, w - 6, 8, 8, "#8a7a96", "#4e4058"); c.fillStyle = "#0c0912"; perched(c, x + w / 2 - 2, y + 15, 2); X.em.push(c2 => { c2.fillStyle = COL.magenta; c2.fillRect(x + w / 2 + 6, y + 3, 2, 1); }); X.light(x + w / 2, y + 6, 30, COL.magenta, .35); },
  D(c, x, y, w, h, X) { dropShadow(c, x, y + 2, w, h); block(c, x, y, w, h - 12, 12, X.th.wallTop, X.th.wallFront, X.th.wallEdge); X.em.push(c2 => { c2.fillStyle = "#05040a"; c2.fillRect(x + w / 2 - 5, y + h - 11, 10, 11); c2.strokeStyle = rgba(COL.amber, .7); c2.strokeRect(x + w / 2 - 5.5, y + h - 11.5, 11, 11); c2.fillStyle = rgba(COL.amber, .8); c2.fillRect(x + w / 2 + 2, y + h - 6, 1, 1); }); X.light(x + w / 2, y + h, 22, COL.amber, .25); }, // stair hut: amber, so it never reads as a magenta spawn door
  s(c, x, y, w, h, X) { if (X.ty <= 1) { X.em.push(c2 => { c2.fillStyle = "#05040a"; c2.fillRect(x + 2, y + 2, 12, 14); c2.strokeStyle = COL.magenta; c2.strokeRect(x + 1.5, y + 1.5, 13, 14); c2.fillStyle = rgba(COL.magenta, .9); [[5, 6], [6, 7], [7, 8], [8, 8], [9, 7], [10, 6]].forEach(([a, b]) => { c2.fillRect(x + a, y + b, 1, 1); c2.fillRect(x + a, y + b + 4, 1, 1); }); }); X.light(x + 8, y + 18, 34, COL.magenta, .5); }
    else { const left = X.tx === 0; c.fillStyle = X.th.wallTop; c.fillRect(x, y, TS, TS); X.em.push(c2 => { c2.fillStyle = "#05040a"; c2.fillRect(left ? x + 10 : x, y + 1, 6, 14); c2.fillStyle = COL.magenta; c2.fillRect(left ? x + 15 : x, y + 1, 1, 14); }); X.light(left ? x + 18 : x - 2, y + 8, 30, COL.magenta, .5); } },
};
