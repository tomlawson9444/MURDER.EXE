/* MURDER.EXE prototype: shared state, input, collision, line of sight, pathfinding. */
"use strict";
const GW = 480, GH = 272;
const G = { mode: "title", pressed: new Set(), paused: false };
const keys = new Set(), mouse = { x: 240, y: 136, down: false, rdown: false };
const GAME_KEYS = [" ", "shift", "enter", "tab", "e", "backspace", "w", "a", "s", "d", "q", "r", "f", "p", "escape", "arrowup", "arrowdown", "arrowleft", "arrowright", "1", "2", "3", "4", "5"];

function setupInput(cv) {
  addEventListener("keydown", e => { const k = e.key.toLowerCase(); if (GAME_KEYS.includes(k)) e.preventDefault(); if (!keys.has(k)) G.pressed.add(k); keys.add(k); });
  addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
  const pos = e => { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * GW; mouse.y = (e.clientY - r.top) / r.height * GH; };
  cv.addEventListener("pointermove", pos);
  cv.addEventListener("pointerdown", e => { pos(e); e.preventDefault(); cv.focus(); if (e.button === 0) { mouse.down = true; G.pressed.add("lmb"); } if (e.button === 2) { mouse.rdown = true; G.pressed.add("rmb"); } });
  addEventListener("pointerup", e => { if (e.button === 0) mouse.down = false; if (e.button === 2) { mouse.rdown = false; } });
  cv.addEventListener("contextmenu", e => e.preventDefault());
  addEventListener("blur", () => { keys.clear(); mouse.down = mouse.rdown = mouse.padDown = mouse.padRdown = false; if (G.mode === "play") G.paused = true; });
}
const held = k => keys.has(k);
// Mouse buttons and controller triggers are tracked separately so neither can cancel the other.
const fireHeld = () => mouse.down || mouse.padDown;
const ocHeld = () => mouse.rdown || mouse.padRdown || held("f");
const hit = k => G.pressed.has(k);

/* Tiles */
const WALK_BLOCK = new Set("#kmpqSuWvZDAcbdthsNC".split(""));
const SHOT_BLOCK = new Set("#kmpquWvZDAcbdhsNC".split(""));
const tileOf = (px, py) => G.grid.at(Math.floor(px / TS), Math.floor(py / TS));
const walkBlocked = (px, py, overLow) => { const ch = tileOf(px, py); if (ch === null) return true; if (overLow && ch === "h") return false; return WALK_BLOCK.has(ch); };
function boxBlocked(x, y, r, overLow) { const ry = r * .6; return walkBlocked(x - r, y - ry, overLow) || walkBlocked(x + r, y - ry, overLow) || walkBlocked(x - r, y + ry, overLow) || walkBlocked(x + r, y + ry, overLow); }
function moveBody(e, dx, dy, overLow) {
  let hitWall = false;
  if (dx) { if (!boxBlocked(e.x + dx, e.y, e.r, overLow)) e.x += dx; else hitWall = true; }
  if (dy) { if (!boxBlocked(e.x, e.y + dy, e.r, overLow)) e.y += dy; else hitWall = true; }
  return hitWall;
}
// Player movement that slips around corners: pushing mostly along one axis into the corner of a block nudges you
// sideways past it (up to 6 px), instead of stopping you dead on a pixel of overlap.
function slideMove(e, dx, dy, overLow) {
  const x0 = e.x, y0 = e.y, hit = moveBody(e, dx, dy, overLow); if (!hit) return false;
  const free = (x, y) => !boxBlocked(x, y, e.r, overLow);
  const nudge = (along, other, horiz) => { // blocked moving `along`; look for an opening up to 6 px either side on the other axis
    for (let k = 1; k <= 6; k++) for (const s of other ? [Math.sign(other)] : [1, -1]) {
      const ox = horiz ? 0 : s * k, oy = horiz ? s * k : 0;
      if (free(e.x + ox, e.y + oy) && free(e.x + ox + (horiz ? along : 0), e.y + oy + (horiz ? 0 : along))) { const step = Math.min(k, Math.abs(along)) * s; moveBody(e, horiz ? 0 : step, horiz ? step : 0, overLow); return; } } };
  if (dx && e.x === x0 && Math.abs(dy) < Math.abs(dx) * .5) nudge(dx, dy, true);
  else if (dy && e.y === y0 && Math.abs(dx) < Math.abs(dy) * .5) nudge(dy, dx, false);
  return hit;
}
function los(x0, y0, x1, y1, skipLow = 20) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 4);
  for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, ch = tileOf(x, y);
    if (ch === null) return false; if (SHOT_BLOCK.has(ch) && !(ch === "h" && (t * d < skipLow || (1 - t) * d < skipLow))) return false; }
  return true;
}

/* Flow field from the player's tile, rebuilt a few times per second */
// In co-op every player gets their own field, so enemies can path to whoever they are after.
function buildFlow() { const f = flowFrom(G.p); if (f) G.flow = f; if (G.crew) for (const q of G.crew) q.flow = q === G.p ? G.flow : flowFrom(q) || q.flow; }
function flowFrom(p) {
  const W = MW, H = MH, dist = new Int16Array(W * H).fill(-1), q = [];
  const px = Math.floor(p.x / TS), py = Math.floor(p.y / TS); if (px < 0 || py < 0 || px >= W || py >= H) return null;
  dist[py * W + px] = 0; q.push(px, py);
  const ok = (x, y) => { const ch = G.grid.at(x, y); return ch !== null && !WALK_BLOCK.has(ch) && ch !== "o"; };
  for (let h = 0; h < q.length; h += 2) { const x = q[h], y = q[h + 1], d = dist[y * W + x];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (ok(nx, ny) && dist[ny * W + nx] < 0) { dist[ny * W + nx] = d + 1; q.push(nx, ny); } } }
  return dist;
}
function flowDir(e) {
  const tx = Math.floor(e.x / TS), ty = Math.floor(e.y / TS), F = G.flow; if (!F) return [0, 0];
  const cur = F[ty * MW + tx]; let best = null, bd = cur < 0 ? 9999 : cur;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const nx = tx + dx, ny = ty + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const d = F[ny * MW + nx]; if (d < 0) continue;
    if (dx && dy && (F[ty * MW + nx] < 0 || F[ny * MW + tx] < 0)) continue;
    if (d < bd) { bd = d; best = [nx, ny]; } }
  if (!best) { const a = Math.atan2(G.p.y - e.y, G.p.x - e.x); return [Math.cos(a), Math.sin(a)]; }
  const gx = best[0] * TS + 8 - e.x, gy = best[1] * TS + 8 - e.y, l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l];
}
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const panOf = x => (x / GW) * 2 - 1;
const rnd = (a, b) => a + Math.random() * (b - a);
