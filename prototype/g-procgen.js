/* Procedural districts. Two layers:
   1. STYLES: a district style mixes a family (streets, docks, slums, rooftops…), a mood and palette, a floor, a backdrop,
      hazard looks, weather and a set-piece pool. Four classic presets plus an endless generator.
   2. MAPS: from a style and a seed, build an arena: layout archetype, wall intrusions, spawn doors, set pieces,
      hazards and decoration, then validate against the level-design rules and rebuild anything that fails. */
"use strict";
const PG = (() => {
  const W = 30, H = 17, SOLID = new Set("#kmpqSuWvZDAcbdthsNC".split(""));
  const walkable = c => c !== null && c !== undefined && !SOLID.has(c) && c !== "o";
  const hashSeed = (...a) => { let h = 2166136261 >>> 0; for (const ch of a.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const SEED_MAX = 2176782336; // 36^6: every seed is exactly six base-36 characters and round-trips
  const seedName = n => (n % SEED_MAX).toString(36).toUpperCase().padStart(6, "0");
  const randomSeed = () => Math.floor(Math.random() * SEED_MAX);
  const parseSeed = s => { const n = parseInt(String(s).trim(), 36); return Number.isFinite(n) ? n % SEED_MAX : null; };
  const at = (g, x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : g[y][x];
  const key = (x, y) => x + "," + y;
  const R = seed => { const r = rngF(seed); return { r, ri: (a, b) => a + Math.floor(r() * (b - a + 1)), pick: a => a[Math.floor(r() * a.length)], chance: p => r() < p }; };

  /* ---- Set pieces, grouped by tag. Letters are tiles, "." is floor that must stay open, " " leaves the tile alone. ---- */
  const TAGS = {
    street: [{ n: "CAR PARK", p: ["kkk.kkk", "kkk.kkk"], w: 2, big: 1 }, { n: "WRECK", p: ["ckkk", "bkkk"], w: 2, big: 1 }, { n: "BLOCKED STREET", p: ["hhh..hhh"], w: 2, big: 1 }, { n: "PARKED CAR", p: ["kkk", "kkk"], w: 4, big: 1 },
      { p: ["hhh"], w: 4 }, { p: ["hh"], w: 3 }, { p: ["h", "h", "h"], w: 2 }, { p: ["p"], w: 2 }],
    market: [{ n: "STALL ISLAND", p: ["h......h", "..mmmm..", "..mmmm..", "h......h"], w: 3, big: 1 }, { n: "NOODLE ROW", p: ["mmm.mmm", "mmm.mmm"], w: 2, big: 1 }, { n: "KIOSK", p: ["##v", "##."], w: 2, big: 1 },
      { p: ["v"], w: 1 }, { p: ["cc", "c."], w: 3 }, { p: ["c.c"], w: 2 }],
    clutter: [{ p: ["cb"], w: 3 }, { p: ["cc"], w: 3 }, { p: ["hh"], w: 2 }, { p: ["h", "h"], w: 2 }, { p: ["c"], w: 2 }],
    roof: [{ n: "WATER TANK", p: ["WWW", "WWW", "WWW"], w: 3, big: 1 }, { n: "AC BANK", p: ["uu.uu"], w: 2, big: 1 }, { n: "STAIR HUT", p: ["DD", "DD"], w: 2, big: 1 }, { n: "ANTENNA ARRAY", p: ["A.A.A"], w: 1, big: 1 },
      { n: "HVAC PLANT", p: ["uu", "uu"], w: 2, big: 1 }, { p: ["uu"], w: 4 }, { p: ["hhh"], w: 3 }, { p: ["A"], w: 1 }],
    tech: [{ n: "SERVER ROW", p: ["qqqqqq"], w: 3, big: 1 }, { n: "RACK PAIR", p: ["qqqq", "....", "qqqq"], w: 2, big: 1 }, { n: "COOLING STACK", p: ["##d", "##."], w: 2, big: 1 }, { n: "TERMINAL CLUSTER", p: ["q.q", "...", "q.q"], w: 2, big: 1 },
      { p: ["qqqq"], w: 3 }, { p: ["p"], w: 3 }, { p: [".d."], w: 2 }],
    luxury: [{ n: "MONUMENT", p: ["ZZ", "ZZ"], w: 2, big: 1 }, { n: "PLANTER GARDEN", p: ["hh.hh", "h...h", "hh.hh"], w: 2, big: 1 }, { n: "GLASS ATRIUM", p: ["###", "p.p"], w: 2, big: 1 }, { n: "COLONNADE", p: ["p.p.p"], w: 2, big: 1 },
      { p: ["p"], w: 5 }, { p: ["hhh"], w: 3 }],
    industrial: [{ n: "CONTAINER STACK", p: ["CCC", "CCC"], w: 3, big: 1 }, { n: "CONTAINER PAIR", p: ["CCC.CCC", "CCC.CCC"], w: 2, big: 1 }, { n: "TANK FARM", p: ["WWW.WWW", "WWW.WWW", "WWW.WWW"], w: 1, big: 1 },
      { p: ["bb"], w: 2 }, { p: ["uu"], w: 2 }, { p: ["cc"], w: 2 }],
    slum: [{ n: "SHACK", p: ["##", "##"], w: 3, big: 1 }, { n: "SHACK ROW", p: ["##.##", "##.##"], w: 2, big: 1 }, { n: "BURN BARRELS", p: ["b.b"], w: 2, big: 1 }, { p: ["cc", "cb"], w: 2 }, { p: ["v"], w: 1 }],
  };
  const WALL_TAGS = { street: [["vv"], ["v"]], market: [["vv"], ["vc"]], clutter: [["cc"], ["c"]], roof: [["uu"], ["u"]], tech: [["qqqqq"], ["qqq"]], luxury: [["hhhh"], ["p"]], industrial: [["bb"], ["cc"]], slum: [["cc"], ["b"]] };

  /* ---- Families: the building blocks of every style ---- */
  const FAMILIES = {
    streets: { arch: ["CROSSROADS", "TRAM YARD", "PLAZA", "BACK ALLEYS"], tags: ["street", "clutter", "market"], back: ["facade", "billboards", "overpass", "mall"], floors: ["asphalt", "tiles", "gravel"], b: [2, 5], low: "barrier", decor: 1, perch: .6, amb: "market", holes: ["void", "water"], nouns: ["STREETS", "BLOCK", "STRIP", "AVENUE", "UNDERPASS", "MILE"] },
    markets: { arch: ["PLAZA", "CROSSROADS", "BACK ALLEYS", "TRAM YARD"], tags: ["market", "street", "clutter"], back: ["facade", "shanty", "billboards"], floors: ["asphalt", "tiles"], b: [2, 4], low: "barrier", decor: 1, perch: .6, amb: "market", holes: ["void"], nouns: ["NIGHT MARKET", "BAZAAR", "STALLS", "ARCADE"] },
    rooftops: { arch: ["CHASM SPLIT", "SKY GAP", "ZIGZAG DROP", "ROOF ISLANDS"], tags: ["roof", "clutter"], back: ["skyline", "billboards"], floors: ["plate", "rust", "glass"], b: [0, 2], low: "sandbag", nests: 1, wind: 1, perch: .7, amb: "rookery", holes: ["void"], nouns: ["ROOFTOPS", "HEIGHTS", "SKYDOCK", "GANTRIES", "AERIE"] },
    serverhalls: { arch: ["SERVER AISLES", "CORE HALL", "COLD VAULT"], tags: ["tech", "clutter"], back: ["serverWall", "factory"], floors: ["grate", "grid", "hex"], b: [1, 3], low: "barrier", turrets: 1, trench: 1, core: "f", rowKit: "q", perch: .5, amb: "datacrypt", holes: ["data", "void"], dry: 1, nouns: ["DATACRYPT", "NODEWORKS", "STACKS", "MAINFRAME", "COLDSTORE"] },
    summits: { arch: ["HELIDECK", "BROKEN SUMMIT", "TERRACES"], tags: ["luxury"], back: ["stormGlass", "skyline"], floors: ["marble", "glass", "hex"], b: [0, 2], low: "planter", core: "H", perch: .4, amb: "spire", holes: ["void"], open: .88, nouns: ["SUMMIT", "PENTHOUSE", "CROWN", "APEX"] },
    foundries: { arch: ["CONTAINER YARD", "CROSSROADS", "POOLS"], tags: ["industrial", "clutter"], back: ["factory", "overpass"], floors: ["rust", "plate", "gravel"], b: [1, 3], low: "barrier", rowKit: "C", perch: .6, amb: "datacrypt", holes: ["molten", "toxic"], nouns: ["FOUNDRY", "WORKS", "REFINERY", "SMELTERS", "YARDS"] },
    docks: { arch: ["CANAL", "CONTAINER YARD", "PLAZA"], tags: ["industrial", "street", "clutter"], back: ["docks"], floors: ["plate", "rust", "asphalt"], b: [0, 2], low: "barrier", rowKit: "C", perch: .5, amb: "rookery", holes: ["water", "toxic"], nouns: ["DOCKS", "WHARF", "HARBOUR", "PIERS", "QUAYS"] },
    slums: { arch: ["BACK ALLEYS", "POOLS", "CROSSROADS"], tags: ["slum", "market", "clutter"], back: ["shanty"], floors: ["gravel", "asphalt", "tiles"], b: [3, 6], low: "sandbag", decor: 1, perch: .4, amb: "market", holes: ["toxic", "water"], nouns: ["SLUMS", "WARRENS", "STACKS", "SHANTYTOWN"] },
    galleria: { arch: ["PLAZA", "TERRACES", "CORE HALL"], tags: ["luxury", "market"], back: ["mall", "billboards"], floors: ["tiles", "marble", "glass"], b: [1, 3], low: "planter", core: "w", perch: .4, amb: "spire", holes: ["void", "water"], dry: 1, nouns: ["ARCOLOGY", "GALLERIA", "MALL", "ATRIUM", "PROMENADE"] },
    canals: { arch: ["CANAL", "POOLS", "CROSSROADS"], tags: ["street", "market", "clutter"], back: ["facade", "docks", "shanty"], floors: ["tiles", "asphalt"], b: [1, 3], low: "barrier", decor: 1, perch: .5, amb: "market", holes: ["water", "toxic"], nouns: ["CANALS", "WATERWAYS", "FLOODLINE", "SPILLWAY", "LOCKS"] },
  };
  const MOODS = {
    neon: { hue: null, acc: [COL.magenta, COL.cyan, "#b06cff", COL.amber], words: ["NEON", "CHROME", "SIGNAL", "GLASS", "STATIC"] },
    sodium: { hue: 30, acc: [COL.amber, "#ff7a2a", "#ffd27a", COL.magenta], words: ["SODIUM", "AMBER", "RUST", "BRASS", "TUNGSTEN"] },
    toxic: { hue: 100, acc: ["#9dff4a", "#2bff9a", COL.amber, COL.cyan], words: ["ACID", "TOXIC", "CARRION", "PHOSPHOR", "FERAL"] },
    ice: { hue: 205, acc: [COL.cyan, "#7fd3ff", "#c9b6ff", "#e8f6ff"], words: ["COLD", "GLACIER", "COBALT", "PALE", "WIRE"] },
    blood: { hue: 350, acc: [COL.red, COL.magenta, COL.amber, "#ff8a8a"], words: ["SCARLET", "BLOOD", "RAZOR", "RED", "KILN"] },
    ultraviolet: { hue: 275, acc: ["#b06cff", COL.magenta, COL.cyan, "#7f74ff"], words: ["ULTRAVIOLET", "VELVET", "GHOST", "ECHO", "OBSIDIAN"] },
  };
  const WEATHER = ["rain", "rain", "heavy", "acid", "snow", "ash", "embers", "smog", "clear"];
  const SIGNS = ["NOODLE", "PAWN", "CAW//24H", "RAMEN", "BODEGA", "CLINIC", "RIPPER", "PACHINKO", "KARAOKE", "SYNTH BAR", "DUMPLING", "LOANS", "TATTOO", "ARCADE", "SOBA", "CHROME", "HOTEL", "BAR", "OBEY", "CORVUS", "IMPLANTS", "NO SIGNAL", "BUY CHROME", "SLEEP POD", "DATA", "LIQUOR"];

  // A classic preset: one of the four hand-tuned districts.
  function preset(base) {
    const P = {
      market: { family: "markets", arch: ["TRAM YARD", "CROSSROADS", "PLAZA", "BACK ALLEYS"], tags: ["market", "street", "clutter"], b: [2, 4], decor: 1, perch: .7, target: [14, 18] },
      rookery: { family: "rooftops", arch: ["CHASM SPLIT", "SKY GAP", "ZIGZAG DROP", "ROOF ISLANDS"], tags: ["roof", "clutter"], b: [0, 2], nests: 1, wind: 1, perch: .7, target: [11, 14] },
      datacrypt: { family: "serverhalls", arch: ["SERVER AISLES", "CORE HALL", "COLD VAULT"], tags: ["tech", "clutter"], b: [1, 3], turrets: 1, trench: 1, core: "f", rowKit: "q", perch: .7, target: [11, 14] },
      spire: { family: "summits", arch: ["HELIDECK", "BROKEN SUMMIT", "TERRACES"], tags: ["luxury"], b: [0, 2], core: "H", perch: .4, open: .88, target: [11, 14] },
    }[base];
    const F = FAMILIES[P.family];
    return Object.assign({ id: base, preset: base, name: { market: "RAIN MARKET", rookery: "CHROME ROOKERY", datacrypt: "DATACRYPT", spire: "SPIRE ZERO" }[base], amb: F.amb, nouns: F.nouns, puddles: base !== "datacrypt", phaseExtra: base === "datacrypt" ? "f" : base === "spire" ? "o" : "h" }, F, P);
  }
  // An endless style: a random family, mood, palette, floor, backdrop, hazards and weather.
  function randomStyle(seed) {
    const { r, ri, pick, chance } = R(hashSeed(seed, "style")), famKey = pick(Object.keys(FAMILIES)), F = FAMILIES[famKey], moodKey = pick(Object.keys(MOODS)), M = MOODS[moodKey];
    const hue = M.hue == null ? r() * 360 : M.hue + (r() - .5) * 40;
    let weather = F.dry && chance(.7) ? pick(["clear", "smog", "clear"]) : pick(WEATHER); if (moodKey === "ice" && chance(.5)) weather = "snow"; if (moodKey === "sodium" && famKey === "foundries" && chance(.6)) weather = pick(["embers", "ash", "smog"]);
    const s = Object.assign({}, F, { id: seedName(seed), seed, family: famKey, mood: moodKey, hue, accents: M.acc, weather, floor: pick(F.floors), backdrop: pick(F.back), hole: pick(F.holes),
      name: pick(M.words) + " " + pick(F.nouns), target: [ri(12, 14), ri(15, 17)], puddles: ["rain", "heavy", "acid"].includes(weather), phaseExtra: F.trench ? "f" : F.core === "H" ? "o" : "h", signs: SIGNS.slice().sort(() => r() - .5).slice(0, 6) });
    return s;
  }
  // Endless districts are derived from the run seed and their depth, so a run link reproduces every district.
  function endless(runSeed, depth) { return { style: randomStyle(hashSeed(runSeed, "district", depth) % SEED_MAX), seed: hashSeed(runSeed, "map", depth) % SEED_MAX }; }

  /* ---- Map builder ---- */
  function build(S, seed) {
    const { r, ri, pick, chance } = R(seed);
    const g = Array.from({ length: H }, () => new Array(W).fill(".")); for (let x = 0; x < W; x++) g[0][x] = g[1][x] = g[H - 1][x] = "#"; for (let y = 0; y < H; y++) g[y][0] = g[y][W - 1] = "#";
    g.maxOpen = S.open || .82;
    const res = new Set(), placed = [], zones = [], meta = { phase2: [], phaseTxt: null, tramRow: null, collapseTiles: null, roadRow: null };
    const arch = pick(S.arch), mirror = arch === "TERRACES" || (S.family !== "rooftops" && chance(.25));
    const kits = S.tags.flatMap((t, i) => TAGS[t].map(k => Object.assign({}, k, { w: (k.w || 1) * (i === 0 ? 3 : i === 1 ? 2 : 1) })));
    const wallKits = S.tags.flatMap(t => WALL_TAGS[t]);
    const fill = (ch, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (at(g, i, j) !== null && i > 0 && i < W - 1 && j > 1 && j < H - 1) g[j][i] = ch; };
    const reserve = (x, y, w = 1, h = 1) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) res.add(key(i, j)); };
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
    const bridges = [];

    /* 1. Skeleton per archetype */
    if (arch === "TRAM YARD" || (arch === "CROSSROADS" && chance(.5))) { const y = ri(12, 14); fill("r", 1, y, W - 2, 1); reserve(1, y, W - 2, 1); meta.tramRow = y; meta.phaseTxt = "TRAM LINE LIVE"; zones.push(["TRAM LANE", 2, y - 1]); }
    else if (arch === "CROSSROADS" || arch === "PLAZA" || arch === "BACK ALLEYS") meta.roadRow = ri(9, 12);
    if (arch === "CHASM SPLIT" || arch === "ZIGZAG DROP") {
      const wv = ri(3, 4), x0 = ri(11, 15), x1 = arch === "ZIGZAG DROP" ? Math.max(6, Math.min(W - 6 - wv, x0 + pick([-4, -3, 3, 4]))) : x0, mid = ri(7, 10);
      fill("o", x0, 2, wv, mid - 1); fill("o", x1, mid, wv, H - 1 - mid); if (x1 !== x0) fill("o", Math.min(x0, x1), mid - 1, Math.abs(x1 - x0) + wv, 2);
      const rows = [ri(3, mid - 3), ri(mid + 2, H - 4)]; if (chance(.5)) rows.push(rows[0] < mid - 4 ? mid - 2 : ri(mid + 1, H - 3));
      rows.forEach(y => { const xs = y < mid ? x0 : x1; if (y >= mid - 1 && y <= mid) return; fill("=", xs, y, wv, 1); bridges.push({ x: xs, y, w: wv, h: 1 }); });
      zones.push(["THE GAP", Math.min(x0, x1), 2]);
    } else if (arch === "SKY GAP" || arch === "CANAL") {
      const hv = arch === "CANAL" ? ri(2, 3) : ri(2, 3), y0 = ri(7, 9); fill("o", 1, y0, W - 2, hv);
      const cols = [ri(3, 8), ri(12, 17), ri(21, 25)].filter(() => chance(.85)); if (cols.length < 2) cols.push(ri(12, 17)); cols.forEach(x => { fill("=", x, y0, 2, hv); bridges.push({ x, y: y0, w: 2, h: hv }); });
      zones.push([arch === "CANAL" ? "THE CANAL" : "THE GAP", 2, y0]);
    } else if (arch === "ROOF ISLANDS") { const w = ri(7, 10), h = ri(3, 4), x = ri(9, W - 9 - w), y = ri(6, 9); fill("o", x, y, w, h); zones.push(["THE PIT", x, y - 1]); }
    if (arch === "SERVER AISLES" || arch === "CONTAINER YARD") {
      const rk = S.rowKit || "q", step = rk === "C" ? 5 : ri(4, 5); let y = ri(4, 5);
      while (y < H - (rk === "C" ? 4 : 3)) { let x = ri(2, 4); while (x < W - 4) { const len = rk === "C" ? 3 : ri(4, 8); if (x + len < W - 2) fill(rk, x, y, len, rk === "C" ? 2 : 1); x += len + ri(2, 3); } y += step; }
      zones.push([arch === "CONTAINER YARD" ? "CONTAINER YARD" : "SERVER AISLES", 2, 3]);
    }
    if (arch === "CORE HALL" || arch === "COLD VAULT") { const w = ri(4, 7), h = ri(3, 4), x = Math.floor((W - w) / 2) + ri(-2, 2), y = ri(6, 8); fill(S.core || "w", x, y, w, h);
      zones.push([S.core === "f" ? "COLD CORE" : S.core === "H" ? "LANDING PAD" : "FOUNTAIN COURT", x, y - 1]); [[x - 2, y - 1], [x + w + 1, y - 1], [x - 2, y + h], [x + w + 1, y + h]].forEach(([px, py]) => { if (at(g, px, py) === ".") g[py][px] = "p"; }); }
    if (arch === "HELIDECK" || (arch === "BROKEN SUMMIT" && chance(.5))) { const x = 11, y = ri(5, 7); fill("H", x, y, 8, 5); zones.push(["HELIPAD", x, y - 1]); }
    if (S.turrets) for (let i = 0; i < ri(2, 3); i++) { const side = chance(.5) ? 1 : W - 2, y = ri(4, H - 4); if (g[y][side] === "." && g[y][side === 1 ? 2 : W - 3] === ".") g[y][side] = "t"; }
    if (S.trench) { let x = ri(2, 6); while (x < W - 6) { const len = ri(4, 7); fill("x", x, H - 2, len, 1); x += len + ri(3, 6); } }

    /* 2. Buildings pushing in from the walls */
    const nB = ri(S.b[0], S.b[1]) + (arch === "BACK ALLEYS" ? 2 : 0);
    for (let i = 0; i < nB; i++) {
      const side = pick(["left", "right", "bottom", "top"]), w = side === "left" || side === "right" ? ri(2, 4) : ri(3, 6), h = side === "left" || side === "right" ? ri(2, 4) : ri(1, 2);
      const x = side === "left" ? 1 : side === "right" ? W - 1 - w : ri(3, W - 4 - w), y = side === "bottom" ? H - 1 - h : side === "top" ? 2 : ri(3, H - 2 - h);
      let ok = true; for (let j = y - 1; j <= y + h; j++) for (let k = x - 1; k <= x + w; k++) { const c = at(g, k, j); if (c !== "." && c !== "#") ok = false; } if (!ok) continue;
      fill("#", x, y, w, h); if (mirror && side !== "left" && side !== "right") fill("#", W - x - w, y, w, h);
    }

    /* 3. Spawn doors */
    const doors = [];
    const tryDoor = (x, y, ix, iy) => { if (g[y][x] !== "#" || !walkable(at(g, ix, iy)) || at(g, ix, iy) === "r" || doors.some(d => Math.abs(d.x - x) + Math.abs(d.y - y) < 5)) return false; g[y][x] = "s"; doors.push({ x, y }); reserve(ix, iy); reserve(ix + Math.sign(ix - x), iy + Math.sign(iy - y)); return true; };
    for (let t = 0, n = ri(2, 3); t < 40 && doors.length < n; t++) { const x = ri(3, W - 4); tryDoor(x, 1, x, 2); }
    for (let t = 0, n = doors.length + ri(1, 2); t < 40 && doors.length < n; t++) { const left = chance(.5), y = ri(3, H - 3); tryDoor(left ? 0 : W - 1, y, left ? 1 : W - 2, y); }

    /* 4. Player start */
    let P = null;
    for (let t = 0; t < 200 && !P; t++) { const x = ri(8, W - 9), y = ri(5, H - 5); let ok = true; for (let j = y - 1; j <= y + 1; j++) for (let i = x - 2; i <= x + 2; i++) if (at(g, i, j) !== "." || res.has(key(i, j))) ok = false; if (ok) P = { x, y }; }
    if (!P) return { ok: false, why: "no start" };
    reserve(P.x - 2, P.y - 2, 5, 5);

    /* 5. Wall features */
    if (chance(S.perch || .5)) { const p = chance(.5) ? ["SSSSS", "SSSSS"] : ["SSSS", "SSSS"]; for (let t = 0; t < 30; t++) { const x = ri(2, W - 2 - p[0].length); if (fits(p, x, 2, true)) { stamp(p, x, 2); placed.push({ kit: { n: "SNIPER PERCH" }, x, y: 2, w: p[0].length, h: 2 }); zones.push(["SNIPER PERCH", x, 1]); break; } } }
    for (let i = 0; i < ri(1, 3); i++) { const p = pick(wallKits); for (let t = 0; t < 20; t++) { const x = ri(2, W - 2 - p[0].length); if (fits(p, x, 2, true)) { stamp(p, x, 2); placed.push({ kit: { n: "WALL" }, x, y: 2, w: p[0].length, h: 1 }); break; } } }
    if (S.nests) { for (let n = 0, t = 0; t < 40 && n < 2; t++) { const x = ri(3, W - 4); if (g[1][x] === "#" && g[1][x - 1] === "#" && g[1][x + 1] === "#" && walkable(g[2][x]) && !doors.some(d => Math.abs(d.x - x) < 3)) { g[1][x] = "N"; n++; } } }
    const holes = arch === "BROKEN SUMMIT" ? ri(3, 5) : arch === "POOLS" ? ri(3, 5) : S.core === "H" ? ri(1, 3) : 0;
    for (let i = 0, t = 0; t < 60 && i < holes; t++) { const w = ri(2, 3), h = 2, p = Array.from({ length: h }, () => "o".repeat(w)); if (place(p, 1, {})) { if (!i && arch === "POOLS") zones.push(["SLUDGE POOLS", placed[placed.length - 1].x, placed[placed.length - 1].y - 1]); i++; } }

    /* 6. Set pieces */
    const target = ri(S.target ? S.target[0] : 12, S.target ? S.target[1] : 16);
    const bigs = kits.filter(k => k.big); for (let i = 0; i < ri(2, 4); i++) { const k = weighted(bigs); if (place(k, 60) && k.n) zones.push([k.n, placed[placed.length - 1].x, placed[placed.length - 1].y - 1]); }
    for (let t = 0; t < 220 && placed.length < target + 2; t++) place(weighted(kits), 6);

    /* 7. Decoration */
    if (S.puddles) for (let i = 0; i < ri(2, 4); i++) { const x = ri(2, W - 4), y = ri(3, H - 3), w = ri(1, 3); for (let k = 0; k < w; k++) if (g[y][x + k] === "." && !res.has(key(x + k, y))) g[y][x + k] = "w"; }
    if (S.decor) { for (let i = 0; i < ri(1, 2); i++) { const x = ri(2, W - 3), y = ri(3, H - 3); if (g[y][x] === ".") g[y][x] = "g"; } for (let i = 0, t = 0; t < 40 && i < ri(2, 4); t++) { const x = ri(3, W - 4), y = ri(3, H - 4); if (g[y][x] === "." && !res.has(key(x, y)) && g[y - 1][x] === ".") { g[y][x] = "n"; i++; } } }
    if (S.core === "f") for (let i = 0; i < ri(1, 2); i++) { const x = ri(3, W - 6), y = ri(3, H - 4); for (let j = 0; j < 2; j++) for (let k = 0; k < ri(2, 4); k++) if (g[y + j] && g[y + j][x + k] === ".") g[y + j][x + k] = "f"; }
    g[P.y][P.x] = "P";

    /* 8. Validate */
    const stats = validate(g, P, doors, placed);
    if (!stats.ok) return { ok: false, why: stats.why, stats };

    /* 9. Phase 2 */
    if (bridges.length >= 2) { const b = pick(bridges); meta.collapseTiles = []; for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) meta.collapseTiles.push([b.x + i, b.y + j]);
      const test = g.map(row => row.slice()); meta.collapseTiles.forEach(([x, y]) => test[y][x] = "o");
      if (validate(test, P, doors, placed, true).ok) { meta.phaseTxt = arch === "CANAL" ? "BRIDGE GOING UNDER" : "BRIDGE FAILING"; meta.phase2 = meta.collapseTiles.map(([x, y]) => ["o", x, y]); } else meta.collapseTiles = null; }
    if (!meta.phase2.length) {
      const extra = S.phaseExtra || "h";
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
    let reached = 0; const pockets = [];
    for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (walkable(g[y][x])) { if (dist[y * W + x] >= 0) reached++; else pockets.push([x, y]); }
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
    const open = reached / ((W - 2) * (H - 3)); if (open < .5 || open > (g.maxOpen || .82)) return { ok: false, why: "open area out of range" };
    return { ok: true, reachPct: Math.round(open * 100), deadEnds, pocketsFilled: pockets.length, doors: doors.length, coverKits: placed.length, nearestDoor: nearDoor };
  }

  /* ---- Render theme for a style. Presets reuse their classic theme; endless styles get a generated palette. ---- */
  function makeTheme(S, mapSeed) {
    const { r, pick } = R(hashSeed(mapSeed, "look"));
    if (S.preset) {
      const B = THEMES[S.preset], th = Object.assign({}, B), accents = [COL.magenta, COL.cyan, COL.amber, "#b06cff", "#2bff9a"];
      if (S.preset === "market") { const words = SIGNS.slice().sort(() => r() - .5).slice(0, 3 + Math.floor(r() * 2)), col = pick(["#463e66", "#3e3a5e", "#4a3a58", "#36405e", "#4a3e52"]);
        const signs = words.map((w, i) => [w, .04 + i * (.86 / words.length) + r() * .04, .02 + r() * .05, pick(accents)]), sh = [r() * .4, .5 + r() * .4];
        th.back = (c, Wd, Hd, rr, em) => facade(c, Wd, 32 / .2, rr, em, { h: .2, col, shutters: sh, signs }); }
      th.ambient = tone(B.ambient, (r() - .5) * .3); th.floor = tone(B.floor, (r() - .5) * .22); th.seam = tone(B.seam, (r() - .5) * .2);
      th.wallTop = tone(B.wallTop, (r() - .5) * .25); th.wallFront = tone(B.wallFront, (r() - .5) * .25); th.accent = pick(accents); th.car = pick(["#6a3a7a", "#3a5a7a", "#7a3a46", "#3a6a5a", "#5a5a6a"]);
      th.lights = B.lights.concat(Array.from({ length: 2 }, () => [r(), .15 + r() * .75, 60 + r() * 110, pick(accents), .12 + r() * .14]));
      if (r() < .25) th.rain = false; else if (B.rain === false && r() < .2) th.rain = true;
      return th;
    }
    const h = S.hue, acc = S.accents, floor = hsl(h + (r() - .5) * 20, 8 + r() * 10, 26 + r() * 7), wall = hsl(h, 12 + r() * 10, 26 + r() * 7);
    const backCol = hsl(h + (r() - .5) * 30, 16, 26), words = S.signs;
    const backs = {
      facade: (c, Wd, Hd, rr, em) => facade(c, Wd, 32 / .2, rr, em, { h: .2, col: backCol, shutters: [r() * .4, .5 + r() * .4], signs: words.slice(0, 3 + (r() * 2 | 0)).map((w, i, a) => [w, .04 + i * (.86 / a.length) + r() * .04, .02 + r() * .05, pick(acc)]) }),
      skyline: (c, Wd, Hd, rr, em) => skyline(c, Wd, 32 / .26, rr, em, { h: .26 }), serverWall: (c, Wd, Hd, rr, em) => serverWall(c, Wd, 32 / .22, rr, em, { h: .22 }),
      stormGlass: (c, Wd, Hd, rr, em) => stormGlass(c, Wd, 32 / .22, rr, em, { h: .22 }),
    };
    const back = backs[S.backdrop] || ((c, Wd, Hd, rr, em) => BACKDROPS[S.backdrop](c, Wd, rr, em, { col: backCol, accents: acc, words, hue: h }));
    return { floorFn: S.floor, floor, seam: tone(floor, -.3), wallTop: hsl(h, 18, 16), wallFront: wall, wallEdge: hsl(h, 28, 58), accent: pick(acc), car: hsl(h + 60 + r() * 180, 30, 36), low: S.low,
      ambient: hsl(h + 10, 16 + r() * 10, 26 + r() * 6), fog: hsl(h, 40, 16), weather: S.weather, rain: ["rain", "heavy", "acid"].includes(S.weather), hole: S.hole, back,
      lights: [[.5, .6, 260, hsl(h, 45, 36), .18], [.2, .1, 90, acc[0], .3], [.5, .1, 90, acc[1], .26], [.85, .1, 70, acc[2], .26]].concat(Array.from({ length: 2 }, () => [r(), .15 + r() * .75, 60 + r() * 110, pick(acc), .12 + r() * .14])) };
  }

  /* ---- Public: build a map from a style (or classic preset name) and a seed, register it, return it ---- */
  function generate(styleOrBase, seed, mapKey = "gen") {
    const S = typeof styleOrBase === "string" ? preset(styleOrBase) : styleOrBase;
    const t0 = performance.now(); let out = null, attempt = 0;
    for (; attempt < 60; attempt++) { out = build(S, hashSeed(seed, S.id, attempt)); if (out.ok) break; }
    if (!out.ok) return null;
    THEMES[mapKey] = makeTheme(S, seed);
    const ops = []; out.g.forEach((row, y) => row.forEach((ch, x) => { if (ch !== ".") ops.push([ch, x, y]); }));
    const { r, pick } = R(hashSeed(seed, "name"));
    const name = S.preset ? (pick(MOODS[pick(Object.keys(MOODS))].words) + " " + pick(FAMILIES[S.family].nouns)) : S.name;
    const map = { theme: mapKey, base: S.preset || S.family, style: S, seed: hashSeed(seed, "render") % 100000, name, code: seedName(seed), arch: out.arch, mirror: out.mirror, ops, phase2: out.meta.phase2, phaseTxt: out.meta.phaseTxt,
      tramRow: out.meta.tramRow, collapseTiles: out.meta.collapseTiles, roadRow: out.meta.roadRow, wind: !!S.wind, amb: S.amb, zones: out.zones, actors: [], notes: {},
      stats: Object.assign({}, out.stats, { attempts: attempt + 1, ms: +(performance.now() - t0).toFixed(1) }) };
    MAPS[mapKey] = map; return map;
  }
  return { generate, preset, randomStyle, endless, hashSeed, seedName, randomSeed, parseSeed, SEED_MAX, FAMILIES, MOODS };
})();
