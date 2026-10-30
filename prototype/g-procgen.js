/* Procedural district maps. Every map is built from a seed: a layout archetype, building intrusions, spawn doors,
   hand-designed cover kits, hazards and decoration, then checked by a validator against the level-design rules.
   Maps that fail are rebuilt from a derived seed. Output plugs straight into MAPS/THEMES and renderMap. */
"use strict";
const PG = (() => {
  const W = 30, H = 17, SOLID = new Set("#kmpqSuWvZDAcbdthsN".split(""));
  const walkable = c => c !== null && c !== undefined && !SOLID.has(c) && c !== "o";
  const hashSeed = (...a) => { let h = 2166136261 >>> 0; for (const ch of a.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const seedName = n => (n % 2176782336).toString(36).toUpperCase().padStart(6, "0");
  const SEED_MAX = 2176782336; // 36^6: every seed is exactly six base-36 characters and round-trips
  const randomSeed = () => Math.floor(Math.random() * SEED_MAX);
  const parseSeed = s => { const n = parseInt(String(s).trim(), 36); return Number.isFinite(n) ? n % SEED_MAX : null; };
  const at = (g, x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : g[y][x];
  const key = (x, y) => x + "," + y;

  // Hand-designed cover kits. Letters are tiles, "." is floor that must stay open, " " leaves the tile alone.
  const KITS = {
    market: [{ n: "STALL ISLAND", p: ["h......h", "..mmmm..", "..mmmm..", "h......h"], w: 3, big: 1 }, { n: "CAR PARK", p: ["kkk.kkk", "kkk.kkk"], w: 2, big: 1 },
      { n: "NOODLE ROW", p: ["mmm.mmm", "mmm.mmm"], w: 2, big: 1 }, { n: "WRECK", p: ["ckkk", "bkkk"], w: 2, big: 1 }, { n: "KIOSK", p: ["##v", "##."], w: 2, big: 1 }, { n: "BLOCKED STREET", p: ["hhh..hhh"], w: 2, big: 1 },
      { p: ["kkk", "kkk"], w: 4 }, { p: ["hhh"], w: 4 }, { p: ["hh"], w: 3 }, { p: ["h", "h", "h"], w: 2 }, { p: ["cc", "c."], w: 3 }, { p: ["c.c"], w: 2 }, { p: ["cb"], w: 2 }, { p: ["p"], w: 2 }, { p: ["v"], w: 1 }],
    rookery: [{ n: "WATER TANK", p: ["WWW", "WWW", "WWW"], w: 3, big: 1 }, { n: "AC BANK", p: ["uu.uu"], w: 2, big: 1 }, { n: "STAIR HUT", p: ["DD", "DD"], w: 2, big: 1 }, { n: "ANTENNA ARRAY", p: ["A.A.A"], w: 1, big: 1 },
      { n: "HVAC PLANT", p: ["uu", "uu"], w: 2, big: 1 }, { p: ["uu"], w: 4 }, { p: ["hhh"], w: 3 }, { p: ["h", "h"], w: 2 }, { p: ["cc"], w: 2 }, { p: ["A"], w: 1 }, { p: ["cb"], w: 2 }],
    datacrypt: [{ n: "SERVER ROW", p: ["qqqqqq"], w: 3, big: 1 }, { n: "RACK PAIR", p: ["qqqq", "....", "qqqq"], w: 2, big: 1 }, { n: "COOLING STACK", p: ["##d", "##."], w: 2, big: 1 }, { n: "TERMINAL CLUSTER", p: ["q.q", "...", "q.q"], w: 2, big: 1 },
      { p: ["qqqq"], w: 3 }, { p: ["p"], w: 3 }, { p: [".d."], w: 2 }, { p: ["hh"], w: 2 }, { p: ["cc"], w: 2 }, { p: ["cb"], w: 1 }],
    spire: [{ n: "MONUMENT", p: ["ZZ", "ZZ"], w: 2, big: 1 }, { n: "PLANTER GARDEN", p: ["hh.hh", "h...h", "hh.hh"], w: 2, big: 1 }, { n: "GLASS ATRIUM", p: ["###", "p.p"], w: 2, big: 1 }, { n: "COLONNADE", p: ["p.p.p"], w: 2, big: 1 },
      { p: ["p"], w: 5 }, { p: ["hhh"], w: 3 }, { p: ["h", "h"], w: 2 }, { p: ["hh"], w: 2 }, { p: ["cb"], w: 1 }],
  };
  const WALL_KITS = { market: [["vv"], ["v"], ["cc"], ["vc"]], rookery: [["uu"], ["u"], ["cc"]], datacrypt: [["qqqqq"], ["qqq"], ["cc"]], spire: [["hhhh"], ["hh"], ["p"]] };
  const ARCH = { market: ["TRAM YARD", "CROSSROADS", "PLAZA", "BACK ALLEYS"], rookery: ["CHASM SPLIT", "SKY GAP", "ZIGZAG DROP", "ROOF ISLANDS"], datacrypt: ["SERVER AISLES", "CORE HALL", "COLD VAULT"], spire: ["HELIDECK", "BROKEN SUMMIT", "TERRACES"] };
  const SIGNS = ["NOODLE", "PAWN", "CAW//24H", "RAMEN", "BODEGA", "CLINIC", "RIPPER", "PACHINKO", "KARAOKE", "SYNTH BAR", "DUMPLING", "LOANS", "TATTOO", "ARCADE", "SOBA", "CHROME", "HOTEL", "BAR"];
  const NAME_A = ["NEON", "CHROME", "RUST", "GLASS", "HOLLOW", "BLACK", "SIGNAL", "STATIC", "VELVET", "IRON", "SODIUM", "RAZOR", "PALE", "COLD", "ACID", "CARRION", "GHOST", "MERCURY", "OBSIDIAN", "PHOSPHOR", "SCARLET", "TUNGSTEN", "ULTRAVIOLET", "WIRE", "ZERO", "BRASS", "COBALT", "DEAD", "ECHO", "FERAL", "HALOGEN", "KILN"];
  const NAME_B = { market: ["NIGHT MARKET", "BAZAAR", "ALLEYS", "ARCADE", "SPRAWL", "STREETS", "STALLS", "BLOCK", "UNDERPASS", "MILE"], rookery: ["ROOKERY", "ROOFTOPS", "SKYDOCK", "HEIGHTS", "ANTENNA FARM", "AERIE", "GANTRIES", "TERRACE"], datacrypt: ["DATACRYPT", "SERVER VAULT", "COLDSTORE", "NODEWORKS", "STACKS", "MAINFRAME"], spire: ["SPIRE", "SUMMIT", "PENTHOUSE", "HELIDECK", "CROWN", "APEX"] };

  function build(base, seed) {
    const r = rngF(seed), ri = (a, b) => a + Math.floor(r() * (b - a + 1)), pick = a => a[Math.floor(r() * a.length)], chance = p => r() < p;
    const g = Array.from({ length: H }, () => new Array(W).fill(".")); g.base = base; for (let x = 0; x < W; x++) g[0][x] = g[1][x] = g[H - 1][x] = "#"; for (let y = 0; y < H; y++) g[y][0] = g[y][W - 1] = "#";
    const res = new Set(), placed = [], zones = [], meta = { phase2: [], phaseTxt: null, tramRow: null, collapseTiles: null, roadRow: null };
    const arch = pick(ARCH[base]), mirror = arch === "TERRACES" || (base !== "rookery" && chance(.25));
    const fill = (ch, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (at(g, i, j) !== null && i > 0 && i < W - 1 && j > 1 && j < H - 1) g[j][i] = ch; };
    const reserve = (x, y, w = 1, h = 1) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) res.add(key(i, j)); };

    // Can a pattern go here? Footprint must be plain unreserved floor; the ring around it must stay walkable (keeps two exits).
    function fits(p, x, y, wallTop) {
      const h = p.length, w = p[0].length;
      for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
        const tx = x + i, ty = y + j, c = at(g, tx, ty), inside = j >= 0 && j < h && i >= 0 && i < w;
        if (inside) { if (p[j][i] === " ") continue; if (c !== "." || res.has(key(tx, ty))) return false; }
        else { if (wallTop && j < 0) continue; if (!walkable(c)) return false; }
      }
      return true;
    }
    const stamp = (p, x, y) => p.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== " " && ch !== ".") g[y + j][x + i] = ch; }));
    function place(kit, tries = 50, opt = {}) {
      const p = kit.p || kit, h = p.length, w = p[0].length;
      for (let t = 0; t < tries; t++) {
        const x = opt.x != null ? opt.x : ri(2, W - 2 - w), y = opt.y != null ? opt.y : ri(3, H - 3 - h);
        if (!fits(p, x, y, opt.wallTop)) continue;
        if (mirror && !opt.noMirror) { const mx = W - x - w; if (mx !== x && Math.abs(mx - x) >= w + 1) { if (!fits(p, mx, y)) continue; stamp(p, mx, y); placed.push({ kit, x: mx, y, w, h }); } }
        stamp(p, x, y); placed.push({ kit, x, y, w, h }); return true;
      }
      return false;
    }
    const weighted = list => { const tot = list.reduce((s, k) => s + (k.w || 1), 0); let v = r() * tot; for (const k of list) { v -= k.w || 1; if (v <= 0) return k; } return list[0]; };

    /* 1. Skeleton per archetype */
    if (base === "market") {
      if (arch === "TRAM YARD" || (arch === "CROSSROADS" && chance(.5))) { const y = ri(12, 14); fill("r", 1, y, W - 2, 1); reserve(1, y, W - 2, 1); meta.tramRow = y; meta.phaseTxt = "TRAM LINE LIVE"; zones.push(["TRAM LANE", 2, y - 1]); }
      else meta.roadRow = ri(9, 12);
    }
    if (base === "rookery") {
      const bridges = [];
      if (arch === "CHASM SPLIT" || arch === "ZIGZAG DROP") {
        const wv = ri(3, 4), x0 = ri(11, 15), x1 = arch === "ZIGZAG DROP" ? Math.max(6, Math.min(W - 6 - wv, x0 + pick([-4, -3, 3, 4]))) : x0, mid = ri(7, 10);
        fill("o", x0, 2, wv, mid - 1); fill("o", x1, mid, wv, H - 1 - mid); if (x1 !== x0) fill("o", Math.min(x0, x1), mid - 1, Math.abs(x1 - x0) + wv, 2);
        const rows = [ri(3, mid - 3), ri(mid + 2, H - 4)]; if (chance(.5)) rows.push(rows[0] < mid - 4 ? mid - 2 : ri(mid + 1, H - 3));
        rows.forEach(y => { const xs = y < mid ? x0 : x1; if (y >= mid - 1 && y <= mid) return; fill("=", xs, y, wv, 1); bridges.push({ x: xs, y, w: wv, h: 1 }); });
        zones.push(["THE GAP", Math.min(x0, x1), 2]);
      } else if (arch === "SKY GAP") {
        const hv = ri(2, 3), y0 = ri(7, 9); fill("o", 1, y0, W - 2, hv);
        const cols = [ri(4, 8), ri(12, 17), ri(21, 25)].filter(() => chance(.85)); if (cols.length < 2) cols.push(ri(12, 17)); cols.forEach(x => { fill("=", x, y0, 2, hv); bridges.push({ x, y: y0, w: 2, h: hv }); });
        zones.push(["THE GAP", 2, y0]);
      } else { const w = ri(7, 10), h = ri(3, 4), x = ri(9, W - 9 - w), y = ri(6, 9); fill("o", x, y, w, h); zones.push(["THE PIT", x, y - 1]); }
      if (bridges.length >= 2) { const b = pick(bridges); meta.collapseTiles = []; for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) meta.collapseTiles.push([b.x + i, b.y + j]); meta.phaseTxt = "BRIDGE FAILING"; }
    }
    if (base === "datacrypt") {
      if (arch === "SERVER AISLES") { let y = ri(4, 5); while (y < H - 3) { let x = ri(2, 4); while (x < W - 4) { const len = ri(4, 8); if (x + len < W - 2) fill("q", x, y, len, 1); x += len + ri(2, 3); } y += ri(4, 5); } }
      else { const w = ri(4, 7), h = ri(3, 4), x = Math.floor((W - w) / 2) + ri(-2, 2), y = ri(6, 8); fill("f", x, y, w, h); zones.push(["COLD CORE", x, y - 1]); [[x - 2, y - 1], [x + w + 1, y - 1], [x - 2, y + h], [x + w + 1, y + h]].forEach(([px, py]) => { if (at(g, px, py) === ".") g[py][px] = "p"; }); }
      for (let i = 0; i < ri(2, 3); i++) { const side = chance(.5) ? 1 : W - 2, y = ri(4, H - 4); if (g[y][side] === "." && g[y][side === 1 ? 2 : W - 3] === ".") { g[y][side] = "t"; } }
      let x = ri(2, 6); while (x < W - 6) { const len = ri(4, 7); fill("x", x, H - 2, len, 1); x += len + ri(3, 6); }
    }
    if (base === "spire") {
      if (arch !== "BROKEN SUMMIT" || chance(.5)) { const w = 8, h = 5, x = 11, y = ri(5, 7); fill("H", x, y, w, h); zones.push(["HELIPAD", x, y - 1]); }
    }

    /* 2. Buildings pushing in from the walls (fewer on rooftops and summits) */
    const nB = { market: arch === "BACK ALLEYS" ? ri(4, 6) : ri(2, 4), rookery: ri(0, 2), datacrypt: ri(1, 3), spire: ri(0, 2) }[base];
    for (let i = 0; i < nB; i++) {
      const side = pick(["left", "right", "bottom", "top"]), w = side === "left" || side === "right" ? ri(2, 4) : ri(3, 6), h = side === "left" || side === "right" ? ri(2, 4) : ri(1, 2);
      const x = side === "left" ? 1 : side === "right" ? W - 1 - w : ri(3, W - 4 - w), y = side === "bottom" ? H - 1 - h : side === "top" ? 2 : ri(3, H - 2 - h);
      let ok = true; for (let j = y - 1; j <= y + h; j++) for (let k = x - 1; k <= x + w; k++) { const c = at(g, k, j); if (c !== "." && c !== "#") ok = false; } if (!ok) continue;
      fill("#", x, y, w, h); if (mirror && side !== "left" && side !== "right") fill("#", W - x - w, y, w, h);
    }

    /* 3. Spawn doors: north wall and sides, spaced apart, with clear floor inside */
    const doors = [];
    const tryDoor = (x, y, ix, iy) => { if (g[y][x] !== "#" || !walkable(at(g, ix, iy)) || at(g, ix, iy) === "r" || doors.some(d => Math.abs(d.x - x) + Math.abs(d.y - y) < 5)) return false; g[y][x] = "s"; doors.push({ x, y }); reserve(ix, iy); reserve(ix + Math.sign(ix - x), iy + Math.sign(iy - y)); return true; };
    for (let t = 0, n = ri(2, 3); t < 40 && doors.length < n; t++) { const x = ri(3, W - 4); tryDoor(x, 1, x, 2); }
    for (let t = 0, n = doors.length + ri(1, 2); t < 40 && doors.length < n; t++) { const left = chance(.5), y = ri(3, H - 3); tryDoor(left ? 0 : W - 1, y, left ? 1 : W - 2, y); }

    /* 4. Player start: open floor near the middle, with a clear 5x3 around it */
    let P = null;
    for (let t = 0; t < 200 && !P; t++) { const x = ri(8, W - 9), y = ri(5, H - 5); let ok = true; for (let j = y - 1; j <= y + 1; j++) for (let i = x - 2; i <= x + 2; i++) if (at(g, i, j) !== "." || res.has(key(i, j))) ok = false; if (ok) P = { x, y }; }
    if (!P) return { ok: false, why: "no start" };
    reserve(P.x - 2, P.y - 2, 5, 5);

    /* 5. Wall-hugging kits and features */
    if (chance(base === "spire" ? .4 : .7)) { const p = base === "market" ? ["SSSSS", "SSSSS"] : ["SSSS", "SSSS"]; for (let t = 0; t < 30; t++) { const x = ri(2, W - 2 - p[0].length); if (fits(p, x, 2, true)) { stamp(p, x, 2); placed.push({ kit: { n: "SNIPER PERCH" }, x, y: 2, w: p[0].length, h: 2 }); zones.push(["SNIPER PERCH", x, 1]); break; } } }
    for (let i = 0; i < ri(1, 3); i++) { const p = pick(WALL_KITS[base]); for (let t = 0; t < 20; t++) { const x = ri(2, W - 2 - p[0].length); if (fits(p, x, 2, true)) { stamp(p, x, 2); placed.push({ kit: { n: "WALL" }, x, y: 2, w: p[0].length, h: 1 }); break; } } }
    if (base === "rookery") { for (let n = 0, t = 0; t < 40 && n < 2; t++) { const x = ri(3, W - 4); if (g[1][x] === "#" && g[1][x - 1] === "#" && g[1][x + 1] === "#" && walkable(g[2][x]) && !doors.some(d => Math.abs(d.x - x) < 3)) { g[1][x] = "N"; n++; } } }
    if (base === "spire") { const n = arch === "BROKEN SUMMIT" ? ri(3, 5) : ri(1, 3); for (let i = 0, t = 0; t < 60 && i < n; t++) { const w = ri(2, 3), h = 2, p = Array.from({ length: h }, () => "o".repeat(w)); if (place(p, 1, {})) i++; } }

    /* 6. Cover kits */
    const target = { market: ri(14, 18), rookery: ri(11, 14), datacrypt: ri(11, 14), spire: ri(11, 14) }[base];
    const bigs = KITS[base].filter(k => k.big); for (let i = 0; i < ri(2, 4); i++) { const k = pick(bigs); if (place(k, 60) && k.n) zones.push([k.n, placed[placed.length - 1].x, placed[placed.length - 1].y - 1]); }
    for (let t = 0; t < 220 && placed.length < target + 2; t++) place(weighted(KITS[base]), 6);

    /* 7. Decoration and hazards */
    if (base === "market" || base === "spire" || base === "rookery") for (let i = 0; i < ri(2, 4); i++) { const x = ri(2, W - 4), y = ri(3, H - 3), w = ri(1, 3); for (let k = 0; k < w; k++) if (g[y][x + k] === "." && !res.has(key(x + k, y))) g[y][x + k] = "w"; }
    if (base === "market") { for (let i = 0; i < ri(1, 2); i++) { const x = ri(2, W - 3), y = ri(3, H - 3); if (g[y][x] === ".") g[y][x] = "g"; } for (let i = 0, t = 0; t < 40 && i < ri(2, 4); t++) { const x = ri(3, W - 4), y = ri(3, H - 4); if (g[y][x] === "." && !res.has(key(x, y)) && g[y - 1][x] === ".") { g[y][x] = "n"; i++; } } }
    if (base === "datacrypt") for (let i = 0; i < ri(1, 2); i++) { const x = ri(3, W - 6), y = ri(3, H - 4); for (let j = 0; j < 2; j++) for (let k = 0; k < ri(2, 4); k++) if (g[y + j] && g[y + j][x + k] === ".") g[y + j][x + k] = "f"; }
    g[P.y][P.x] = "P";

    /* 8. Validate (and patch tiny unreachable pockets) */
    const stats = validate(g, P, doors, placed);
    if (!stats.ok) return { ok: false, why: stats.why, stats };

    /* 9. Phase 2 */
    if (meta.collapseTiles) { const test = g.map(row => row.slice()); meta.collapseTiles.forEach(([x, y]) => test[y][x] = "o"); if (!validate(test, P, doors, placed, true).ok) { meta.collapseTiles = null; meta.phaseTxt = null; } else meta.phase2 = meta.collapseTiles.map(([x, y]) => ["o", x, y]); }
    if (!meta.phase2.length) {
      const extra = base === "datacrypt" ? "f" : base === "spire" ? "o" : "h";
      if (extra === "f") { meta.phaseTxt = "COOLANT PURGE"; for (let y = 4; y < H - 3; y++) for (let x = 8; x < W - 8; x++) if (g[y][x] === ".") meta.phase2.push(["f", x, y]); }
      else { meta.phaseTxt = meta.phaseTxt || (extra === "o" ? "ROOF COLLAPSING" : "BARRICADES GOING UP");
        for (let i = 0, t = 0; t < 80 && i < 4; t++) { const x = ri(2, W - 4), y = ri(3, H - 4), w = extra === "o" ? 2 : ri(2, 3);
          let ok = true; for (let k = 0; k < w; k++) if (g[y][x + k] !== "." || res.has(key(x + k, y)) || Math.abs(x + k - P.x) + Math.abs(y - P.y) < 4) ok = false;
          if (!ok) continue; const test = g.map(row => row.slice()); for (let k = 0; k < w; k++) test[y][x + k] = extra; if (!validate(test, P, doors, placed, true).ok) continue;
          for (let k = 0; k < w; k++) meta.phase2.push([extra, x + k, y]); i++; } }
    }
    const zonesOut = zones.filter((z, i) => zones.findIndex(q => q[0] === z[0]) === i).slice(0, 4).map((z, i) => [String.fromCharCode(65 + i) + " · " + z[0], Math.max(1, Math.min(W - 9, z[1])), Math.max(2, z[2])]);
    return { ok: true, g, P, doors, arch, mirror, meta, zones: zonesOut, stats, kits: placed.length };
  }

  function validate(g, P, doors, placed, quick) {
    const dist = new Int16Array(W * H).fill(-1), q = [P.x, P.y]; dist[P.y * W + P.x] = 0;
    for (let h = 0; h < q.length; h += 2) { const x = q[h], y = q[h + 1]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (walkable(at(g, nx, ny)) && dist[ny * W + nx] < 0) { dist[ny * W + nx] = dist[y * W + x] + 1; q.push(nx, ny); } } }
    let walk = 0, reached = 0; const pockets = [];
    for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (walkable(g[y][x])) { walk++; if (dist[y * W + x] >= 0) reached++; else pockets.push([x, y]); }
    const doorDist = doors.map(d => { const ix = d.x === 0 ? 1 : d.x === W - 1 ? W - 2 : d.x, iy = d.y <= 1 ? 2 : d.y; return dist[iy * W + ix]; });
    if (doorDist.some(v => v < 0)) return { ok: false, why: "door unreachable" };
    if (quick) return { ok: pockets.length <= 4 };
    if (pockets.length > 8) return { ok: false, why: "big unreachable area" };
    pockets.forEach(([x, y]) => g[y][x] = "#");
    let deadEnds = 0;
    for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (dist[y * W + x] >= 0) { let blocked = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!walkable(at(g, x + dx, y + dy))) blocked++; if (blocked >= 3) deadEnds++; }
    if (deadEnds > 3) return { ok: false, why: "too many dead ends" };
    if (doors.length < 3) return { ok: false, why: "not enough doors" };
    const nearDoor = Math.min(...doorDist); if (nearDoor < 6) return { ok: false, why: "door too close to start" };
    const left = placed.filter(p => p.x + p.w / 2 < W / 2).length, right = placed.length - left;
    if (placed.length < 6 || left < 2 || right < 2) return { ok: false, why: "cover unbalanced" };
    const open = reached / ((W - 2) * (H - 3)); if (open < .5 || open > (g.base === "spire" ? .88 : .82)) return { ok: false, why: "open area out of range" };
    return { ok: true, reachPct: Math.round(open * 100), deadEnds, pocketsFilled: pockets.length, doors: doors.length, coverKits: placed.length, nearestDoor: nearDoor };
  }

  /* Public: generate a district map, register it with MAPS/THEMES under `mapKey`, return the map record. */
  function generate(base, seed, mapKey = "gen") {
    const t0 = performance.now(); let out = null, attempt = 0;
    for (; attempt < 60; attempt++) { out = build(base, hashSeed(seed, base, attempt)); if (out.ok) break; }
    if (!out.ok) return null;
    const r = rngF(hashSeed(seed, "style")), pick = a => a[Math.floor(r() * a.length)];
    const B = THEMES[base], th = Object.assign({}, B), accents = [COL.magenta, COL.cyan, COL.amber, "#b06cff", "#2bff9a"];
    if (base === "market") { const words = SIGNS.slice().sort(() => r() - .5).slice(0, 3 + Math.floor(r() * 2)), col = pick(["#463e66", "#3e3a5e", "#4a3a58", "#36405e", "#4a3e52"]);
      const signs = words.map((w, i) => [w, .04 + i * (.86 / words.length) + r() * .04, .02 + r() * .05, pick(accents)]), sh = [r() * .4, .5 + r() * .4];
      th.back = (c, Wd, Hd, rr, em) => facade(c, Wd, 32 / .2, rr, em, { h: .2, col, shutters: sh, signs }); }
    th.ambient = tone(B.ambient, (r() - .5) * .3); th.floor = tone(B.floor, (r() - .5) * .22); th.seam = tone(B.seam, (r() - .5) * .2);
    th.wallTop = tone(B.wallTop, (r() - .5) * .25); th.wallFront = tone(B.wallFront, (r() - .5) * .25); th.accent = pick(accents); th.car = pick(["#6a3a7a", "#3a5a7a", "#7a3a46", "#3a6a5a", "#5a5a6a"]);
    th.lights = B.lights.concat(Array.from({ length: 2 }, () => [r(), .15 + r() * .75, 60 + r() * 110, pick(accents), .12 + r() * .14]));
    if (r() < .25) th.rain = false; else if (B.rain === false && r() < .2) th.rain = true;
    THEMES[mapKey] = th;
    const ops = []; out.g.forEach((row, y) => row.forEach((ch, x) => { if (ch !== ".") ops.push([ch, x, y]); }));
    const name = (pick(NAME_A) + " " + pick(NAME_B[base])).toUpperCase();
    const map = { theme: mapKey, base, seed: hashSeed(seed, "render") % 100000, name, code: seedName(seed), arch: out.arch, mirror: out.mirror, ops, phase2: out.meta.phase2, phaseTxt: out.meta.phaseTxt,
      tramRow: out.meta.tramRow, collapseTiles: out.meta.collapseTiles, roadRow: out.meta.roadRow, zones: out.zones, actors: [], notes: {}, stats: Object.assign({}, out.stats, { attempts: attempt + 1, ms: +(performance.now() - t0).toFixed(1) }) };
    MAPS[mapKey] = map; return map;
  }
  return { generate, hashSeed, seedName, randomSeed, parseSeed, ARCH, SEED_MAX };
})();
