/* District maps: data, renderer, tactical overlay. */
"use strict";
const MW = 30, MH = 17;
const THEMES = {
  market: { floorFn: "asphalt", floor: "#4a4468", seam: "#36304f", wallTop: "#2a2440", wallFront: "#4a4068", wallEdge: "#7a6ea4", accent: COL.magenta, car: "#6a3a7a", low: "barrier", ambient: "#4b4670", fog: "#2a1238", rain: true,
    back: (c, W, H, r, em) => facade(c, W, 32 / .2, r, em, { h: .2, col: "#463e66", shutters: [.36, .66], signs: [["NOODLE", .1, .02, COL.magenta], ["CAW//24H", .44, .03, COL.cyan], ["PAWN", .84, .02, COL.amber]] }),
    lights: [[.5, .6, 260, "#3b2f7a", .3], [.2, .1, 90, COL.magenta, .35], [.5, .1, 90, COL.cyan, .3], [.85, .1, 70, COL.amber, .3]] },
  rookery: { floorFn: "plate", floor: "#5a6488", seam: "#3a4260", wallTop: "#3a4260", wallFront: "#5a6380", wallEdge: "#9aa4c8", accent: "#7fd3ff", car: "#4a5a7a", low: "sandbag", ambient: "#46527a", fog: "#203050", rain: true,
    back: (c, W, H, r, em) => skyline(c, W, 32 / .26 * 1, r, em, { h: .26 }),
    lights: [[.5, .55, 260, "#5a7cff", .22], [.5, .0, 200, COL.magenta, .25]] },
  datacrypt: { floorFn: "grate", floor: "#4a5674", seam: "#2e3650", wallTop: "#1a2034", wallFront: "#2a3450", wallEdge: "#5a6a90", accent: "#4d7cff", car: "#3a4460", low: "barrier", ambient: "#3a4470", fog: "#101a3a", rain: false,
    back: (c, W, H, r, em) => serverWall(c, W, 32 / .22, r, em, { h: .22 }),
    lights: [[.5, .5, 260, "#4d7cff", .22], [.95, .1, 60, COL.magenta, .5]] },
  spire: { floorFn: "marble", floor: "#3e3850", seam: "#28232f", wallTop: "#2a2232", wallFront: "#4a3a52", wallEdge: "#9a80a0", accent: COL.amber, car: "#5a3a4a", low: "planter", ambient: "#5a4660", fog: "#3a0d2a", rain: true,
    back: (c, W, H, r, em) => stormGlass(c, W, 32 / .22, r, em, { h: .22 }),
    lights: [[.5, 0, 260, COL.magenta, .3], [.5, .6, 200, COL.red, .12]] },
};
const BORDER = [["#", 0, 0, 30, 2], ["#", 0, 0, 1, 17], ["#", 29, 0, 1, 17], ["#", 0, 16, 30, 1]];
const MAPS = {
  market: { theme: "market", seed: 31, name: "Rain Market", tramRow: 14, phaseTxt: "TRAM LINE LIVE",
    ops: [...BORDER, ["s", 5, 1], ["s", 15, 1], ["s", 24, 1], ["s", 0, 8], ["s", 29, 8],
      ["v", 1, 2], ["v", 2, 2], ["v", 27, 2], ["g", 12, 2], ["g", 26, 9],
      ["m", 13, 6, 4, 2], ["h", 11, 5, 2, 1], ["h", 17, 5, 2, 1], ["h", 11, 9, 2, 1], ["h", 17, 9, 2, 1],
      ["k", 3, 5, 3, 2], ["c", 2, 10], ["c", 3, 10], ["c", 2, 11],
      ["S", 22, 3, 5, 2], ["h", 22, 6, 2, 1],
      ["n", 8, 4], ["n", 21, 8], ["n", 14, 11],
      ["w", 7, 8, 2, 1], ["w", 20, 11, 2, 2], ["w", 9, 13, 3, 1],
      ["b", 19, 3], ["b", 6, 12], ["b", 27, 12], ["p", 9, 10], ["p", 20, 13], ["k", 23, 10, 3, 2],
      ["c", 16, 12], ["c", 17, 12], ["r", 1, 14, 28, 1], ["c", 4, 15], ["c", 25, 15], ["h", 12, 15, 5, 1], ["P", 14, 9]],
    phase2: [["T", 3, 14, 18, 1], ["h", 21, 8], ["c", 13, 4], ["c", 16, 4]],
    zones: [["A · STALL ISLAND", 11, 4], ["B · CAR PARK", 1, 7], ["C · SNIPER WALK", 21, 2], ["D · TRAM LANE", 2, 13]],
    actors: [["jackdaw", 23, 2], ["rook", 17, 4], ["shrike", 6, 8], ["corvid", 12, 3]],
    notes: { cover: "The noodle stall is the only hard cover in the middle. Low barriers on its four corners let you rotate around it. The west car park gives strong cover, but it has one exit, so it's a trap if a Carrion follows you in.", choke: "The gap between the stall and the east car is the main lane. The north doors push enemies straight down it.", hazard: "The three hanging signs drop when shot (2 tiles wide). Puddles conduct Short Circuit. Steam from the vents hides bullets.", phase: "At kill 50 the tram starts running. It sweeps the south lane every 12 seconds, cuts the arena in half for 3 seconds, and kills anything on the rails, enemies included." } },
  rookery: { theme: "rookery", seed: 41, name: "Chrome Rookery", collapseTiles: [[13, 5], [14, 5], [15, 5], [16, 5]], phaseTxt: "NORTH BRIDGE FAILING",
    ops: [...BORDER, ["o", 13, 2, 4, 14], ["=", 13, 5, 4, 1], ["=", 13, 11, 4, 1], ["N", 6, 1], ["N", 22, 1], ["s", 0, 12], ["s", 29, 4],
      ["u", 2, 3, 2, 1], ["u", 9, 3, 2, 1], ["W", 5, 6, 3, 3], ["h", 2, 9, 3, 1], ["A", 10, 8], ["c", 10, 12], ["c", 11, 12], ["u", 3, 13, 2, 1], ["h", 7, 12, 1, 3],
      ["S", 23, 2, 4, 2], ["u", 19, 6, 2, 1], ["u", 24, 8, 2, 1], ["h", 18, 10, 3, 1], ["W", 21, 12, 3, 3], ["c", 26, 12], ["c", 27, 13], ["b", 18, 4], ["b", 11, 6], ["w", 4, 11, 2, 1], ["w", 25, 5, 2, 1], ["P", 7, 10]],
    phase2: [["o", 13, 5, 4, 1], ["h", 12, 6], ["h", 17, 4]],
    zones: [["A · WEST ROOF", 2, 5], ["B · NORTH BRIDGE", 13, 4], ["C · BILLBOARD", 22, 1], ["D · SOUTH BRIDGE", 13, 12]],
    actors: [["corvid", 9, 2], ["corvid", 20, 3], ["jackdaw", 24, 1], ["bulwark", 19, 11]],
    notes: { cover: "Two rooftops. The water tanks are the hard cover on each side, and AC units give short cover along the north edge. There is no cover on the bridges at all.", choke: "Two bridges are the only way across. Both are 1 tile deep, so whoever holds a bridge controls the fight. Enemies spawn on both roofs to make you cross.", hazard: "The chasm kills on contact. Wind gusts across the gap bend bullets 1 tile downward. The drone Nests on the north wall respawn Corvids until you hack or shoot their open cores.", phase: "At kill 50 the north bridge collapses. Only the south bridge is left, so the bridge fight turns into a hold-or-flank decision. The debris leaves two new low barriers at the chasm edge." } },
  datacrypt: { theme: "datacrypt", seed: 51, name: "Datacrypt",
    ops: [...BORDER, ["s", 14, 1], ["s", 0, 4], ["s", 29, 12],
      ["q", 3, 4, 8, 1], ["q", 19, 4, 8, 1], ["q", 3, 12, 8, 1], ["q", 19, 12, 8, 1],
      ["p", 11, 7], ["p", 18, 7], ["p", 11, 10], ["p", 18, 10], ["f", 13, 7, 4, 4], ["d", 7, 8], ["d", 22, 8], ["t", 2, 8], ["t", 27, 8], ["t", 14, 2],
      ["h", 4, 8, 2, 1], ["h", 24, 8, 2, 1], ["c", 12, 14], ["c", 17, 14], ["x", 3, 15, 8, 1], ["x", 19, 15, 8, 1], ["b", 2, 14], ["b", 27, 2], ["S", 22, 13, 4, 2], ["P", 14, 9]],
    phase2: [["f", 8, 6, 14, 7], ["x", 12, 3, 6, 1]],
    zones: [["A · NORTH AISLE", 3, 2], ["B · CORE", 12, 5], ["C · SOUTH AISLE", 3, 13], ["D · CONTROL BOOTH", 21, 14]],
    actors: [["hexer", 14, 5], ["bulwark", 6, 9], ["carrion", 22, 6], ["shrike", 17, 13]],
    notes: { cover: "The server rows make four long aisles of hard cover. Four pillars around the frozen core give the only cover in the middle. Shield emitters raise a hard-light wall for 4 seconds when you hack them.", choke: "The aisles are 1–2 tiles wide, so this map is about close-quarters fighting. A Shrike in an aisle can't be dodged sideways. Use the side gaps between racks to get out.", hazard: "Three turrets cover the aisles (hack with Turncoat). The cooling core freezes your dash for 0.5 seconds. Exposed cable trenches along the south wall electrify anything that touches them.", phase: "At kill 50 a coolant purge spreads the frost across the whole middle. Dashing becomes unreliable, which pushes the fight back into the aisles and up against the turrets." } },
  spire: { theme: "spire", seed: 61, name: "Spire Zero",
    ops: [...BORDER, ["s", 14, 1], ["s", 0, 8], ["s", 29, 8],
      ["H", 11, 6, 8, 5], ["p", 6, 4], ["p", 23, 4], ["p", 6, 12], ["p", 23, 12], ["Z", 14, 12, 2, 2],
      ["h", 3, 4, 2, 1], ["h", 25, 4, 2, 1], ["h", 9, 3, 3, 1], ["h", 18, 3, 3, 1], ["h", 9, 14, 3, 1], ["h", 18, 14, 3, 1],
      ["o", 2, 7, 2, 3], ["o", 26, 10, 2, 2], ["A", 27, 3], ["b", 4, 13], ["b", 25, 13], ["w", 20, 8, 2, 1], ["w", 8, 9, 2, 1], ["P", 14, 9]],
    phase2: [["o", 7, 7, 3, 2], ["o", 20, 10, 3, 2], ["o", 13, 3, 4, 1], ["o", 2, 12, 2, 2]],
    zones: [["A · HELIPAD", 11, 5], ["B · WEST TERRACE", 2, 3], ["C · EAST TERRACE", 24, 3], ["D · MONUMENT", 13, 14]],
    actors: [["corvus", 13, 2]],
    notes: { cover: "The arena is open and symmetrical, deliberately. The four corner columns are the only hard cover, and the luxury planters are low cover you can dash over. The crow monument is the only safe spot in the south.", choke: "There isn't one. CORVUS forms its shapes over the helipad, so you are always choosing between a column with no line of sight and open ground with a clear shot.", hazard: "Holes in the roof kill on contact. The arena shrinks as the fight goes on. Storm lightning hits the antenna every 20 seconds, and you can shoot the antenna to chain the strike to nearby drones.", phase: "At kill 50 the roof collapses in four places, including the edge of the helipad. The safe floor drops by about 30%, so the end of the fight is a duel on what's left." } },
};

function buildGrid(M, phase2) {
  const g = Array.from({ length: MH }, () => new Array(MW).fill("."));
  const apply = ops => ops.forEach(([ch, x, y, w = 1, h = 1]) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < MH && i >= 0 && i < MW) g[j][i] = ch; });
  apply(M.ops); if (phase2) apply(M.phase2);
  g.at = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? null : g[y][x];
  return g;
}
function groups(G) {
  const seen = new Set(), out = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const ch = G[y][x], k = x + "," + y; if (!GROUPED.has(ch) || seen.has(k)) continue;
    let x1 = x, y1 = y; while (G.at(x1 + 1, y) === ch) x1++; while (G.at(x, y1 + 1) === ch) y1++;
    for (let j = y; j <= y1; j++) for (let i = x; i <= x1; i++) seen.add(i + "," + j); out.push([ch, x, y, x1 - x + 1, y1 - y + 1]); }
  return out;
}

function renderMap(key, phase2, SP, Gover) {
  const M = MAPS[key], th = THEMES[M.theme], G = Gover || buildGrid(M, phase2), r = rngF(M.seed);
  const W = MW * TS, H = MH * TS, C = mk(W, H), c = C.getContext("2d"); c.imageSmoothingEnabled = false;
  const em = [], lights = [], steamPts = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) FLOORS[th.floorFn](c, x * TS, y * TS, r, th);
  if (key === "market") { c.fillStyle = "rgba(210,170,80,.5)"; for (let x = 16; x < W - 16; x += 22) c.fillRect(x, 12 * TS + 8, 12, 1); }
  if (key === "spire") { c.fillStyle = "rgba(255,178,46,.45)"; c.fillRect(TS, 9 * TS, W - 2 * TS, 1); }
  if (M.roadRow != null) { c.fillStyle = "rgba(210,170,80,.5)"; for (let x = 16; x < W - 16; x += 22) c.fillRect(x, M.roadRow * TS + 8, 12, 1); }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const d = DECALS[G[y][x]]; if (d) d(c, x * TS, y * TS, G, x, y, r, em, th); }
  th.back(c, W, H, r, em);
  const items = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const ch = G[y][x]; if (OBJ[ch] && !GROUPED.has(ch)) items.push([ch, x, y, 1, 1]); }
  groups(G).forEach(gp => items.push(gp));
  items.sort((a, b) => (a[2] + a[4]) - (b[2] + b[4]) || a[1] - b[1]);
  items.forEach(([ch, x, y, w, h]) => OBJ[ch](c, x * TS, y * TS, w * TS, h * TS, { th, G, tx: x, ty: y, r, em, SP, steam: steamPts, light: (lx, ly, rad, col, a) => lights.push([lx, ly, rad, col, a]) }));
  c.globalCompositeOperation = "multiply"; c.fillStyle = th.ambient; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "lighter";
  th.lights.forEach(([fx, fy, rad, col, a]) => glow(c, fx * W, fy * H, rad, col, a));
  lights.forEach(([x, y, rad, col, a]) => glow(c, x, y, rad, col, a));
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (G[y][x] === "w") { c.save(); c.beginPath(); c.rect(x * TS, y * TS, TS, TS); c.clip();
    lights.forEach(([lx, ly, rad, col, a]) => { if (Math.abs(lx - x * TS - 8) < 40 && ly < y * TS + 8) glowE(c, lx, y * TS + 8 + (y * TS - ly) * .15, 4, 14, col, a); }); c.restore(); }
  c.globalCompositeOperation = "source-over";
  em.forEach(f => f(c));
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(th.fog, .3)); g.addColorStop(.4, rgba(th.fog, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (G[y][x] === "g") steamPts.push([x * TS + 8, y * TS + 8]);
  const weather = th.weather || (th.rain ? "rain" : null);
  if (weather === "smog") { c.fillStyle = rgba(th.fog || "#3a4a2a", .22); c.fillRect(0, 0, W, H); }
  return { C, W, H, G, M, steam: steamPts, weather, rain: weather && weather !== "smog" && weather !== "clear" ? mkRain(W, H, M.seed + 7) : null };
}

function sightline(c, G, ox, oy, a0, a1, own) {
  const pts = [[ox, oy]];
  for (let i = 0; i <= 90; i++) { const a = a0 + (a1 - a0) * i / 90; let d = 6, px = ox, py = oy;
    for (; d < 560; d += 2) { px = ox + Math.cos(a) * d; py = oy + Math.sin(a) * d; const ch = G.at(px / TS | 0, py / TS | 0); if (ch === null || (BLOCKS(ch) && ch !== own)) break; }
    pts.push([px, py]); }
  c.fillStyle = rgba(COL.amber, .13); poly(c, pts); c.fill(); c.strokeStyle = rgba(COL.amber, .55); c.lineWidth = 1; c.stroke();
}
const TCOL = { hard: "#d8d4ee", low: COL.cyan, soft: COL.amber, hack: COL.magenta, haz: COL.red, spawn: COL.magenta };
function drawTactical(c, R) {
  const { G, M, W, H } = R; c.fillStyle = "rgba(5,4,12,.62)"; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,.035)"; for (let x = 0; x < W; x += TS) c.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += TS) c.fillRect(0, y, W, 1);
  groups(G).filter(g => g[0] === "S").forEach(([, x, y, w, h]) => { const ox = (x + w / 2) * TS, oy = (y + h / 2) * TS, b = Math.atan2(H / 2 - oy, W / 2 - ox); sightline(c, G, ox, oy, b - .8, b + .8, "S"); });
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (G[y][x] === "t") { const cx = x * TS + 8, cy = y * TS + 8, base = Math.atan2(H / 2 - cy, W / 2 - cx); sightline(c, G, cx, cy, base - .5, base + .5, "t"); }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const ch = G[y][x], k = CLASS[ch]; if (!k || (ch === "#" && y < 2) || (ch === "#" && (x === 0 || x === MW - 1 || y === MH - 1))) continue;
    const col = TCOL[k]; c.fillStyle = rgba(col, k === "hard" ? .18 : .28); c.fillRect(x * TS, y * TS, TS, TS); c.fillStyle = col;
    if (CLASS[G.at(x, y - 1)] !== k) c.fillRect(x * TS, y * TS, TS, 1); if (CLASS[G.at(x, y + 1)] !== k) c.fillRect(x * TS, y * TS + 15, TS, 1);
    if (CLASS[G.at(x - 1, y)] !== k) c.fillRect(x * TS, y * TS, 1, TS); if (CLASS[G.at(x + 1, y)] !== k) c.fillRect(x * TS + 15, y * TS, 1, TS);
    if (k === "haz" && ch !== "w") { c.fillStyle = rgba(col, .5); for (let i = 0; i < TS; i += 4) c.fillRect(x * TS + i, y * TS + i, 2, 2); }
    if (k === "spawn") { const dx = x === 0 ? 1 : x === MW - 1 ? -1 : 0, dy = dx ? 0 : 1, cx = x * TS + 8 + dx * 14, cy = y * TS + 8 + dy * 14;
      for (let s = 0; s < 3; s++) for (let i = -3; i <= 3; i++) c.fillRect(cx + dx * s * 4 + (dy ? i : -Math.abs(i) * dx), cy + dy * s * 4 + (dx ? i : -Math.abs(i) * dy), 1, 1); }
  }
  M.ops.filter(o => o[0] === "N").forEach(([, x, y]) => { c.strokeStyle = COL.magenta; c.beginPath(); c.arc(x * TS + 8, y * TS + 10, 30, .2, Math.PI - .2); c.stroke(); });
  const p = M.ops.find(o => o[0] === "P"); if (p) { const x = p[1] * TS + 8, y = p[2] * TS + 8; c.strokeStyle = COL.cyan; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.stroke(); c.fillStyle = COL.cyan; c.fillRect(x - 1, y - 1, 2, 2); }
  c.font = "8px Silkscreen"; c.textBaseline = "top";
  M.zones.forEach(([t, x, y]) => { const tw = Math.ceil(c.measureText(t).width) + 6; c.fillStyle = "rgba(5,4,12,.85)"; c.fillRect(x * TS, y * TS, tw, 11); c.fillStyle = COL.ink; c.fillText(t, x * TS + 3, y * TS + 2); });
}
function drawMapActors(c, R, SP, t) {
  (R.M.actors || []).forEach(([k, tx, ty], i) => { const s = SP[k], fly = k === "corvid" || k === "corvus" || k === "hexer"; const x = tx * TS + 8 - s.w / 2, y = ty * TS + 14 - s.h + (fly ? Math.round(Math.sin(t * .003 + i) * 2) - 6 : 0); shadowUnder(c, x, y, s, fly); drawSpr(c, s, x, y); });
}
