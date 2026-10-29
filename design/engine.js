/* MURDER.EXE art engine: utilities, materials, and a shaded pixel-sprite renderer. */
"use strict";
const TAU = Math.PI * 2;
const COL = { cyan: "#2be4ff", magenta: "#ff2d8a", amber: "#ffb22e", red: "#ff3d3d", ink: "#e9e6f5", dim: "#9a94b5", void: "#0a0912" };
const rngF = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgba = (h, a) => { const [r, g, b] = hx(h); return `rgba(${r},${g},${b},${a})`; };
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const tone = (h, v) => v >= 0 ? mix(h, "#ffffff", v) : mix(h, "#000000", -v);
function glow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
function glowE(c, x, y, rx, ry, col, a) { c.save(); c.translate(x, y); c.scale(1, ry / rx); glow(c, 0, 0, rx, col, a); c.restore(); }
function poly(c, P) { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); c.closePath(); }
function pline(c, x0, y0, x1, y1, col, every = 1, skip = 0) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; c.fillStyle = col;
  for (let k = skip; k <= n; k++) if (k % every === 0) c.fillRect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 1, 1);
}

/* Materials: 4-step ramps (shadow → highlight) or emissive {e, core}. */
const MAT = {
  coat: ["#100c1d", "#1f1836", "#322853", "#4a3d7d"], coatIn: ["#2a0d22", "#4c1438", "#741d55", "#a32a77"],
  skin: ["#4d2b30", "#86524c", "#b97d68", "#dfaa8e"], hair: ["#08070f", "#141127", "#221d40", "#363063"],
  chrome: ["#262636", "#4f4f68", "#9090ad", "#e2e2f1"], gun: ["#100e18", "#221f30", "#3b374f", "#625d7d"],
  pants: ["#0b0a13", "#161423", "#242136", "#353150"], boot: ["#08070d", "#13111b", "#201d2b", "#302c41"],
  robe: ["#0a0810", "#15111d", "#211b2d", "#322945"], bone: ["#463f52", "#857d95", "#c4bdd1", "#f0ebf6"],
  wing: ["#07060d", "#110e20", "#1d1836", "#2e2858"], armor: ["#191726", "#2b2840", "#433e60", "#645e88"],
  rust: ["#24161a", "#432826", "#673a2f", "#8f5340"], shield: ["#360c27", "#661748", "#a0246a", "#ee4f9e"],
  hazard: ["#3a2a08", "#7a5a10", "#c08d1a", "#f2c040"],
  cyanE: { e: "#2be4ff", core: "#c9f8ff" }, magE: { e: "#ff2d8a", core: "#ffc2dc" },
  ambE: { e: "#ffb22e", core: "#ffeab8" }, redE: { e: "#ff3d3d", core: "#ffc9c9" },
};
const R = (m, x, y, w, h) => ({ m, t: "r", x, y, w, h });
const E = (m, cx, cy, rx, ry) => ({ m, t: "e", cx, cy, rx, ry });
const Pl = (m, p) => ({ m, t: "p", p });
const Px = (m, p) => ({ m, t: "x", p });
const L = (m, x0, y0, x1, y1) => ({ m, t: "l", x0, y0, x1, y1 });
const S_ = p => Object.assign(p, { sep: 1 });
const mirror = (W, P) => P.map(([x, y]) => [W - x, y]);

function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }

function raster(def) {
  const { w, h, parts } = def; const m = new Array(w * h).fill(null), d = new Int16Array(w * h).fill(-1), sp = new Uint8Array(w * h);
  const set = (x, y, k, pt) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = y * w + x; m[i] = pt.m; d[i] = k; sp[i] = pt.sep ? 1 : 0; };
  parts.forEach((pt, k) => {
    if (pt.t === "r") { for (let y = pt.y; y < pt.y + pt.h; y++) for (let x = pt.x; x < pt.x + pt.w; x++) set(x, y, k, pt); }
    else if (pt.t === "e") { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x + .5 - pt.cx) / pt.rx, dy = (y + .5 - pt.cy) / pt.ry; if (dx * dx + dy * dy <= 1) set(x, y, k, pt); } }
    else if (pt.t === "p") { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inPoly(x + .5, y + .5, pt.p)) set(x, y, k, pt); }
    else if (pt.t === "x") pt.p.forEach(([x, y]) => set(x, y, k, pt));
    else if (pt.t === "l") { let x0 = pt.x0, y0 = pt.y0; const x1 = pt.x1, y1 = pt.y1, dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
      for (;;) { set(x0, y0, k, pt); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  });
  if (def.post) def.post(m, d, w, h);
  return { m, d, sp, w, h };
}

/* Render a def into {cv, gc (glow), G, w, h}. Light from top-left, 1px dark outline, optional rim lights. */
function sprite(def, o = {}) {
  const { m, d, sp, w, h } = raster(def); const W = w + 2, H = h + 2;
  const cv = mk(W, H), c = cv.getContext("2d");
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? null : m[y * w + x];
  const dp = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : d[y * w + x];
  const em = [];
  c.fillStyle = o.outline || "#06040c";
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (at(x, y) === null && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) c.fillRect(x + 1, y + 1, 1, 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = m[y * w + x]; if (!k) continue; const mt = MAT[k]; let col;
    if (mt.e) { const core = at(x - 1, y) === k && at(x + 1, y) === k && at(x, y - 1) === k && at(x, y + 1) === k; col = core ? mt.core : mt.e; em.push([x, y, mt.e]); }
    else {
      const me = dp(x, y), u = at(x, y - 1), lf = at(x - 1, y), dn = at(x, y + 1), rt = at(x + 1, y);
      const eU = u === null || (u !== k && dp(x, y - 1) < me), eL = lf === null || (lf !== k && dp(x - 1, y) < me);
      const oU = u !== null && u !== k && dp(x, y - 1) > me;
      let l = eU && eL ? 3 : (eU || eL) ? 2 : 1;
      if (oU) l = 0; else if (!eU && !eL && (dn === null || rt === null)) l = 0;
      if (sp[y * w + x] && !eU) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1]]) { if (at(x + ax, y + ay) !== null && dp(x + ax, y + ay) < me) { l = 0; break; } }
      if (def.dither && l === 1 && y > h * .55 && (x + y) % 2 === 0) l = 0;
      col = mt[l];
      if (o.rimR && rt === null && !oU) col = mix(col, o.rimR, .55);
      else if (o.rimL && lf === null && !eU) col = mix(col, o.rimL, .4);
    }
    c.fillStyle = col; c.fillRect(x + 1, y + 1, 1, 1);
  }
  const G = 7, gc = mk(W + G * 2, H + G * 2), g = gc.getContext("2d"); g.globalCompositeOperation = "lighter";
  em.forEach(([x, y, e]) => glow(g, x + 1 + G + .5, y + 1 + G + .5, 5, e, .2));
  return { cv, gc, G, w: W, h: H };
}
function drawSpr(c, s, x, y, glowOn = true) {
  x = Math.round(x); y = Math.round(y); c.drawImage(s.cv, x, y);
  if (glowOn) { c.save(); c.globalCompositeOperation = "lighter"; c.drawImage(s.gc, x - s.G, y - s.G); c.restore(); }
}
function shadowUnder(c, x, y, s, fly) { c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.ellipse(Math.round(x + s.w / 2), Math.round(y + s.h - 1 + (fly ? 7 : 0)), s.w * .36, 2.2, 0, 0, TAU); c.fill(); }
function tinted(s, col) { const t = mk(s.w, s.h), c = t.getContext("2d"); c.drawImage(s.cv, 0, 0); c.globalCompositeOperation = "source-in"; c.fillStyle = col; c.fillRect(0, 0, s.w, s.h); return t; }
