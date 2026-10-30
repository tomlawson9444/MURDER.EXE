/* District style art: extra floors, backdrops, hazard-pit looks, shipping containers and colour helpers.
   Loaded after maptiles.js and scenes.js; everything here is picked by the style generator in g-procgen.js. */
"use strict";
function stxt(c, s, x, y, col) { c.font = "8px Silkscreen"; c.textBaseline = "top"; c.textAlign = "center"; c.fillStyle = col; c.fillText(s, Math.round(x), Math.round(y)); c.textAlign = "left"; }
function hsl(h, s, l) { h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
  const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); };
  return "#" + f(0) + f(8) + f(4); }

/* ---- Floors (c, x, y, r, th): one 16px tile ---- */
Object.assign(FLOORS, {
  tiles(c, x, y, r, th) { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const miss = r() < .03; c.fillStyle = miss ? tone(th.floor, -.35) : tone(th.floor, (r() - .5) * .12); c.fillRect(x + i * 8, y + j * 8, 8, 8);
      if (!miss) { c.fillStyle = tone(th.floor, .18); c.fillRect(x + i * 8 + 1, y + j * 8 + 1, 2, 1); } }
    c.fillStyle = th.seam; c.fillRect(x, y, TS, 1); c.fillRect(x, y + 8, TS, 1); c.fillRect(x, y, 1, TS); c.fillRect(x + 8, y, 1, TS); },
  hex(c, x, y, r, th) { c.fillStyle = tone(th.floor, (r() - .5) * .08); c.fillRect(x, y, TS, TS); c.fillStyle = th.seam;
    for (let i = 0; i < TS; i++) { const k = i % 8, d = k < 4 ? k : 8 - k; c.fillRect(x + i, y + d, 1, 1); c.fillRect(x + i, y + 8 + (3 - Math.min(3, d)), 1, 1); } c.fillRect(x, y + 4, 1, 4); c.fillRect(x + 8, y + 4, 1, 4); },
  rust(c, x, y, r, th) { FLOORS.plate(c, x, y, r, th); for (let i = 0; i < 6; i++) { c.fillStyle = r() < .5 ? "rgba(140,70,30,.35)" : "rgba(90,45,20,.4)"; c.fillRect(x + r() * 14 | 0, y + r() * 14 | 0, 1 + (r() * 3 | 0), 1 + (r() * 2 | 0)); }
    if (r() < .2) { c.fillStyle = "rgba(120,60,25,.3)"; c.fillRect(x + (r() * 12 | 0), y + 2, 1, 10); } },
  glass(c, x, y, r, th) { c.fillStyle = tone(th.floor, -.15 + (r() - .5) * .06); c.fillRect(x, y, TS, TS); c.fillStyle = tone(th.floor, .22); c.fillRect(x, y, TS, 1); c.fillRect(x, y, 1, TS);
    if (r() < .3) { c.fillStyle = "rgba(255,255,255,.08)"; for (let k = 0; k < 8; k++) c.fillRect(x + 4 + k, y + 11 - k, 1, 1); } },
  gravel(c, x, y, r, th) { c.fillStyle = tone(th.floor, (r() - .5) * .14); c.fillRect(x, y, TS, TS);
    for (let i = 0; i < 22; i++) { c.fillStyle = r() < .5 ? "rgba(0,0,0,.3)" : "rgba(255,255,255,.09)"; c.fillRect(x + r() * TS | 0, y + r() * TS | 0, r() < .15 ? 2 : 1, 1); } },
  grid(c, x, y, r, th) { c.fillStyle = tone(th.floor, -.25 + (r() - .5) * .05); c.fillRect(x, y, TS, TS); c.fillStyle = rgba(th.accent || COL.cyan, .18); c.fillRect(x, y, TS, 1); c.fillRect(x, y, 1, TS);
    c.fillStyle = rgba(th.accent || COL.cyan, .45); c.fillRect(x, y, 1, 1); },
});

/* ---- Hazard pits: same lethal 'o' tile, five looks ---- */
const voidPit = DECALS.o;
DECALS.o = (c, x, y, G, tx, ty, r, em, th) => {
  const kind = th && th.hole || "void"; if (kind === "void") return voidPit(c, x, y, G, tx, ty, r, em);
  const P = { water: ["#0a1c2c", "#1e4a66", "#7fd3ff"], toxic: ["#14280c", "#2e5a14", "#9dff4a"], molten: ["#2a0c04", "#7a2a08", "#ffb22e"], data: ["#020308", "#0a1a24", "#2be4ff"] }[kind];
  c.fillStyle = P[0]; c.fillRect(x, y, TS, TS);
  const up = G.at(tx, ty - 1); if (up !== "o" && up !== "=") { c.fillStyle = tone(P[1], -.3); c.fillRect(x, y, TS, 3); c.fillStyle = P[1]; c.fillRect(x, y + 3, TS, 1); }
  const pts = []; for (let i = 0; i < (kind === "data" ? 6 : 4); i++) pts.push([x + r() * TS | 0, y + 4 + r() * 11 | 0, r()]);
  em.push(c2 => { pts.forEach(([a, b, v]) => { c2.fillStyle = rgba(P[2], kind === "water" ? .35 : .7); if (kind === "data") c2.fillRect(a, b, 1, 2 + (v * 3 | 0)); else c2.fillRect(a, b, v < .3 ? 2 : 1, 1); });
    if (kind !== "water") { c2.save(); c2.globalCompositeOperation = "lighter"; glow(c2, x + 8, y + 9, 12, P[2], kind === "molten" ? .35 : .18); c2.restore(); } });
};

/* ---- Shipping containers: hard cover, drawn per group ---- */
CLASS.C = "hard"; GROUPED.add("C");
OBJ.C = (c, x, y, w, h, X) => {
  const cols = ["#7a3a46", "#3a5a7a", "#7a6a2a", "#3a6a5a", "#5a3a7a", "#7a4a2a"], col = cols[(X.tx * 7 + X.ty * 3) % cols.length];
  dropShadow(c, x + 1, y + 2, w - 2, h - 2); block(c, x + 1, y, w - 2, h - 12, 11, tone(col, .15), tone(col, -.2));
  c.fillStyle = tone(col, -.4); for (let i = x + 3; i < x + w - 2; i += 3) c.fillRect(i, y + h - 12, 1, 10);
  c.fillStyle = tone(col, .35); for (let i = x + 4; i < x + w - 3; i += 4) c.fillRect(i, y + 1, 1, h - 14);
  c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(x + 5, y + h - 9, 8, 2);
};

/* ---- Backdrops (top 32px band). (c, W, r, em, o) where o = { col, accent, accents, words } ---- */
const band = 32;
function curb(c, W, col) { c.fillStyle = tone(col, .35); c.fillRect(0, band - 2, W, 2); c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(0, band, W, 5); }
const BACKDROPS = {
  billboards(c, W, r, em, o) {
    c.fillStyle = o.col; c.fillRect(0, 0, W, band); for (let x = 0; x < W; x += 20) { c.fillStyle = tone(o.col, -.25); c.fillRect(x, 0, 1, band); }
    let x = 4 + (r() * 20 | 0); while (x < W - 60) { const w = 60 + (r() * 60 | 0), col = o.accents[(r() * o.accents.length) | 0], word = o.words[(r() * o.words.length) | 0];
      c.fillStyle = "#07060d"; c.fillRect(x - 2, 2, w + 4, 24);
      em.push(c2 => { const g = c2.createLinearGradient(x, 3, x + w, 25); g.addColorStop(0, rgba(col, .85)); g.addColorStop(1, rgba(mix(col, "#05040b", .6), .9)); c2.fillStyle = g; c2.fillRect(x, 3, w, 22);
        c2.fillStyle = "rgba(0,0,0,.25)"; for (let yy = 4; yy < 25; yy += 2) c2.fillRect(x, yy, w, 1); stxt(c2, word, x + w / 2, 10, "#ffffff"); });
      x += w + 16 + (r() * 30 | 0); }
    curb(c, W, o.col); },
  overpass(c, W, r, em, o) {
    const g = c.createLinearGradient(0, 0, 0, band); g.addColorStop(0, "#0a0814"); g.addColorStop(1, tone(o.col, -.2)); c.fillStyle = g; c.fillRect(0, 0, W, band);
    c.fillStyle = tone(o.col, .1); c.fillRect(0, 2, W, 9); c.fillStyle = tone(o.col, -.35); c.fillRect(0, 11, W, 3);
    for (let x = 20 + (r() * 30 | 0); x < W; x += 64) { c.fillStyle = tone(o.col, -.1); c.fillRect(x, 14, 9, band - 14); c.fillStyle = tone(o.col, -.4); c.fillRect(x + 7, 14, 2, band - 14); }
    const cars = []; for (let i = 0; i < 6; i++) cars.push([r() * W | 0, r() < .5]); em.push(c2 => { for (let x = 8; x < W; x += 20) { c2.fillStyle = rgba(COL.amber, .8); c2.fillRect(x, 12, 2, 1); }
      cars.forEach(([cx, red]) => { c2.fillStyle = red ? rgba(COL.red, .9) : "rgba(255,250,230,.9)"; c2.fillRect(cx, red ? 5 : 8, 10, 1); }); });
    curb(c, W, o.col); },
  shanty(c, W, r, em, o) {
    c.fillStyle = "#0a0812"; c.fillRect(0, 0, W, band); const wins = [];
    for (let row = 0; row < 2; row++) { let x = -(r() * 10 | 0); while (x < W) { const w = 14 + (r() * 18 | 0), h = 10 + (r() * 8 | 0), y = row ? 0 : band - h, col = hsl(o.hue + (r() - .5) * 80, 18 + r() * 20, 22 + r() * 12);
        c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = tone(col, -.3); for (let i = x + 2; i < x + w; i += 3) c.fillRect(i, y, 1, h); c.fillStyle = tone(col, .25); c.fillRect(x, y, w, 1);
        if (r() < .6) wins.push([x + 3 + (r() * (w - 8) | 0), y + 3 + (r() * (h - 7) | 0), o.accents[(r() * o.accents.length) | 0]]); x += w + (r() * 3 | 0); } }
    em.push(c2 => { wins.forEach(([a, b, col]) => { c2.fillStyle = rgba(col, .8); c2.fillRect(a, b, 4, 3); }); c2.strokeStyle = "#05040a"; c2.beginPath(); c2.moveTo(0, 14); c2.quadraticCurveTo(W / 2, 24, W, 12); c2.stroke(); });
    curb(c, W, "#3a3046"); },
  docks(c, W, r, em, o) {
    const g = c.createLinearGradient(0, 0, 0, 18); g.addColorStop(0, "#07060f"); g.addColorStop(1, tone(hsl(o.hue, 40, 25), 0)); c.fillStyle = g; c.fillRect(0, 0, W, 18);
    c.fillStyle = hsl(o.hue + 180, 35, 12); c.fillRect(0, 18, W, band - 18);
    const cranes = []; for (let x = 30 + (r() * 40 | 0); x < W - 20; x += 110 + (r() * 60 | 0)) cranes.push(x);
    c.fillStyle = "#05040a"; cranes.forEach(x => { c.fillRect(x, 2, 2, 22); c.fillRect(x - 14, 3, 40, 2); c.fillRect(x + 20, 5, 1, 10); });
    for (let x = 0; x < W; x += 6 + (r() * 10 | 0)) { c.fillStyle = hsl(o.hue + r() * 180, 40, 28); c.fillRect(x, 22 + (r() * 3 | 0), 5 + (r() * 6 | 0), 8); }
    em.push(c2 => { cranes.forEach(x => { c2.fillStyle = COL.red; c2.fillRect(x, 1, 2, 1); }); c2.fillStyle = rgba(hsl(o.hue, 70, 70), .35); for (let i = 0; i < 20; i++) c2.fillRect((i * 53) % W, 19 + (i % 3), 6, 1); });
    curb(c, W, "#3a4054"); },
  factory(c, W, r, em, o) {
    c.fillStyle = o.col; c.fillRect(0, 0, W, band);
    for (let i = 0; i < 3; i++) { const y = 4 + i * 8 + (r() * 3 | 0); c.fillStyle = tone(o.col, .25); c.fillRect(0, y, W, 3); c.fillStyle = tone(o.col, -.3); c.fillRect(0, y + 3, W, 1); for (let x = (r() * 30 | 0); x < W; x += 40) { c.fillStyle = tone(o.col, .4); c.fillRect(x, y - 1, 3, 5); } }
    const stacks = []; for (let x = 40 + (r() * 40 | 0); x < W - 20; x += 120 + (r() * 80 | 0)) { stacks.push(x); c.fillStyle = tone(o.col, -.2); c.fillRect(x, 0, 10, band - 2); }
    for (let x = 0; x < W; x += 8) { c.fillStyle = (x / 8) % 2 ? "#c8962a" : "#1a1726"; c.fillRect(x, band - 6, 8, 3); }
    em.push(c2 => stacks.forEach(x => { c2.save(); c2.globalCompositeOperation = "lighter"; glow(c2, x + 5, 1, 12, COL.amber, .7); c2.restore(); c2.fillStyle = "#fff0c8"; c2.fillRect(x + 3, 0, 4, 1); }));
    curb(c, W, o.col); },
  mall(c, W, r, em, o) {
    c.fillStyle = tone(o.col, .1); c.fillRect(0, 0, W, band); const shops = [];
    for (let x = 4; x < W - 40; x += 46) { const col = o.accents[(r() * o.accents.length) | 0], shut = r() < .3 ? 6 + (r() * 10 | 0) : 0; shops.push([x, col, shut, o.words[(r() * o.words.length) | 0]]);
      c.fillStyle = "#07060d"; c.fillRect(x, 6, 40, band - 8); }
    em.push(c2 => shops.forEach(([x, col, shut, word]) => { c2.fillStyle = rgba(col, .3); c2.fillRect(x + 1, 13, 38, band - 16); c2.fillStyle = "#05040a"; [8, 20, 30].forEach(m => { c2.fillRect(x + m, 17, 3, 9); c2.fillRect(x + m, 15, 3, 2); });
      if (shut) { c2.fillStyle = "#2a2638"; c2.fillRect(x + 1, 13, 38, shut); } stxt(c2, word.slice(0, 6), x + 20, 4, col); }));
    curb(c, W, o.col); },
};
