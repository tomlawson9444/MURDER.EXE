/* Character model: look options, cosmetics sold at Magpie's, origins with starter kits, and the player sprite builder. */
"use strict";
const ramp = b => [tone(b, -.55), tone(b, -.28), b, tone(b, .28)];
const GOLD = ["#5a3a10", "#9a6a1a", "#d8a83a", "#ffe08a"];
// Each option: [value, label, cosmetic id that unlocks it (empty = free), colour]
const LOOK_SLOTS = [
  { key: "coat", label: "COAT", opts: [["long", "LONG COAT"], ["jacket", "JACKET"], ["cloak", "GHOST CLOAK", "c_cloak"], ["vest", "COMBAT VEST", "c_vest"]] },
  { key: "coatCol", label: "COAT COLOUR", opts: [["midnight", "MIDNIGHT", "", "#322853"], ["graphite", "GRAPHITE", "", "#3c3c48"], ["oxblood", "OXBLOOD", "", "#5a1e2a"], ["navy", "NAVY", "", "#1e2e5a"], ["olive", "OLIVE", "", "#3e4a26"], ["plum", "PLUM", "", "#4a2850"], ["white", "BLEACHED", "c_white", "#b8b4c8"], ["chrome", "CHROME MANTLE", "c_chrome", "#8a8aa8"]] },
  { key: "lining", label: "LINING", opts: [["magenta", "MAGENTA", "", "#741d55"], ["cyan", "CYAN", "", "#1d5a74"], ["amber", "AMBER", "", "#8a5a14"], ["black", "BLACK", "", "#1a1726"]] },
  { key: "hair", label: "HAIR", opts: [["bob", "BOB"], ["buzz", "BUZZ"], ["long", "LONG"], ["ponytail", "PONYTAIL"], ["mohawk", "NEON MOHAWK", "c_mohawk"]] },
  { key: "hairCol", label: "HAIR COLOUR", opts: [["black", "BLACK", "", "#221d40"], ["silver", "SILVER", "", "#a8a4b8"], ["magenta", "MAGENTA", "", "#a02a78"], ["cyan", "CYAN", "", "#2a8aa0"], ["blonde", "BLONDE", "", "#c8a050"], ["red", "RED", "", "#8a2a20"], ["green", "TOXIC DYE", "c_dye_green", "#3a8a2a"], ["violet", "UV DYE", "c_dye_violet", "#6a3aa0"]] },
  { key: "skin", label: "SKIN", opts: [["s1", "TONE 1", "", "#f2c9a8"], ["s2", "TONE 2", "", "#dfaa8e"], ["s3", "TONE 3", "", "#b97d68"], ["s4", "TONE 4", "", "#8f5a44"], ["s5", "TONE 5", "", "#6a3e2e"], ["s6", "TONE 6", "", "#4a2a22"]] },
  { key: "eyes", label: "EYES", opts: [["visor", "VISOR"], ["eyes", "OPTICS"], ["goggles", "GOGGLES"], ["mask", "RIPPER MASK", "c_mask"], ["trophy", "CROW TROPHY", "c_trophy"]] },
  { key: "arm", label: "ARM", opts: [["chrome", "CHROME ARM"], ["none", "NO CHROME"], ["both", "FULL CHROME", "c_fullchrome"], ["gold", "GOLD ARM", "c_goldarm"]] },
  { key: "glow", label: "GLOW", opts: [["cyan", "CYAN", "", COL.cyan], ["magenta", "MAGENTA", "", COL.magenta], ["amber", "AMBER", "", COL.amber], ["lime", "LIME", "c_glow_lime", "#9dff4a"], ["white", "GHOST WHITE", "c_glow_white", "#e8f6ff"], ["violet", "UV", "c_glow_violet", "#b06cff"]] },
  { key: "trail", label: "AFTERIMAGE", opts: [["glow", "MATCH GLOW"], ["magenta", "MAGENTA", "c_trail_mag", COL.magenta], ["gold", "GOLD", "c_trail_gold", "#ffd27a"], ["glitch", "GLITCH", "c_trail_glitch"]] },
  { key: "gun", label: "GUN FINISH", opts: [["steel", "GUNMETAL"], ["carbon", "CARBON", "c_gun_carbon"], ["gold", "GOLD", "c_gun_gold"], ["neon", "NEON", "c_gun_neon"]] },
  { key: "extra", label: "EXTRA", opts: [["none", "NONE"], ["scarf", "RAIN SCARF", "c_scarf"], ["crown", "AUGUR'S HALO", "c_crown"]] },
];
const SLOT = Object.fromEntries(LOOK_SLOTS.map(s => [s.key, s]));
const optOf = (L, k) => SLOT[k].opts.find(o => o[0] === L[k]) || SLOT[k].opts[0];
const DEFAULT_LOOK = { coat: "long", coatCol: "midnight", lining: "magenta", hair: "bob", hairCol: "black", skin: "s3", eyes: "visor", arm: "chrome", glow: "cyan", trail: "glow", gun: "steel", extra: "none" };

/* Cosmetics: sold in Magpie's STYLE tab. [id, name, price, req, reqText, description] */
const COSMETICS = [
  ["c_cloak", "Ghost Cloak", 600, null, "", "A hooded cloak that swallows your silhouette."], ["c_vest", "Combat Vest", 450, null, "", "Armoured vest, bare arms. All business."],
  ["c_white", "Bleached Coat", 250, null, "", "Coat colour. Stands out against the dark."], ["c_chrome", "Chrome Mantle", 500, null, "", "Coat colour. Polished chrome weave."],
  ["c_mohawk", "Neon Mohawk", 300, null, "", "Hair. The tips glow in your optics colour."], ["c_dye_green", "Toxic Dye", 150, null, "", "Hair colour. Acid green."], ["c_dye_violet", "UV Dye", 150, null, "", "Hair colour. Ultraviolet."],
  ["c_mask", "Ripper Mask", 350, null, "", "Eyes. Chrome jaw plate and glowing optics."], ["c_trophy", "Crow Trophy Mask", 400, s => (s.byType.corvid || 0) >= 50, "Kill 50 Corvids", "Eyes. A Murder beak mask, rewired to your side."],
  ["c_fullchrome", "Full Chrome", 500, null, "", "Arm. Both arms replaced with chrome."], ["c_goldarm", "Gold Arm", 800, null, "", "Arm. Gold-plated cyberarm. Subtle it is not."],
  ["c_glow_lime", "Lime Optics", 200, null, "", "Glow colour for visor, implants and hair tips."], ["c_glow_white", "Ghost White Optics", 200, null, "", "Glow colour. Cold white."], ["c_glow_violet", "UV Optics", 200, null, "", "Glow colour. Ultraviolet."],
  ["c_trail_mag", "Magenta Afterimage", 250, null, "", "Phase-dash afterimage colour."], ["c_trail_gold", "Gold Afterimage", 400, null, "", "Phase-dash afterimage colour."],
  ["c_trail_glitch", "Glitch Afterimage", 600, s => !!s.clears.rookery, "Clear the Chrome Rookery", "Your dash leaves a flickering RGB-split trail."],
  ["c_gun_carbon", "Carbon Finish", 250, null, "", "Sidearm finish. Matte black weave."], ["c_gun_gold", "Gold Finish", 500, null, "", "Sidearm finish. Gold plating."], ["c_gun_neon", "Neon Finish", 350, null, "", "Sidearm finish. A magenta light strip."],
  ["c_scarf", "Rain Scarf", 200, null, "", "Extra. A scarf in your lining colour."], ["c_crown", "Augur's Halo", 700, s => (s.byType.augur || 0) >= 1, "Defeat THE AUGUR", "Extra. The Augur's data halo, now orbiting you."],
];
COSMETICS.forEach(([id, name, price, req, reqText, desc]) => {
  const s = LOOK_SLOTS.find(sl => sl.opts.some(o => o[2] === id)), o = s.opts.find(o => o[2] === id);
  const item = Object.assign(it(id, "style", name, price, req, reqText, desc, [s.label + ": " + o[1]]), { slot: s.key, value: o[0], col: o[3] });
  ITEMS.push(item); ITEM[id] = item;
});
CATS.push(["style", "STYLE"]);

/* Origins: chosen when you create your operative. The starter kit is granted once per save. */
const ORIGINS = [
  { id: "corpo", name: "CORPO DEFECTOR", desc: "Ex-Halvorsen enforcer. Clean shooting, fast feet.", kit: { gun: "kestrel", oc: "deadlink", imp: ["reflex"] }, scrip: 0 },
  { id: "netrunner", name: "STREET NETRUNNER", desc: "Raised in the Rain Market data dens. Hacks first, asks never.", kit: { gun: "kestrel", oc: "arc", imp: ["deck"] }, scrip: 0 },
  { id: "merc", name: "MERC BREACHER", desc: "Kicks doors for a living. Likes it loud and close.", kit: { gun: "breacher", oc: "deadlink", imp: ["graze"] }, scrip: 0 },
  { id: "ghost", name: "GHOST", desc: "Nobody saw you come in. Sees every tell, travels light.", kit: { gun: "kestrel", oc: "deadlink", imp: ["prism"] }, scrip: 250 },
];
const ORIGIN = Object.fromEntries(ORIGINS.map(o => [o.id, o]));
const NAMES_A = ["VESPER", "NYX", "RAVEN", "JUNO", "SABLE", "WREN", "ONYX", "IRIS", "DEX", "VIOLET", "ZERO", "MAKO", "LUX", "ECHO", "RHEA", "KIT", "ASH", "CASS", "ROOK", "MOTH"];
const NAMES_B = ["KADE", "VOSS", "HALE", "STRAND", "MERCER", "QUILL", "SOREN", "VANCE", "MORROW", "KESTREL", "BLACK", "RAIN", "CROWE", "LOCKE", "VALE", "NOVAK"];
const randomName = () => NAMES_A[Math.random() * NAMES_A.length | 0] + " " + NAMES_B[Math.random() * NAMES_B.length | 0];

// Fill in character fields on old saves.
SAVE.char = Object.assign({ created: false, name: "VESPER KADE", origin: "corpo", starterClaimed: false }, SAVE.char || {});
SAVE.char.look = Object.assign({}, DEFAULT_LOOK, SAVE.char.look || {});
const lookOwned = (slotKey, opt) => !opt[2] || owns(opt[2]);
function claimStarter(originId) {
  const O = ORIGIN[originId]; if (SAVE.char.starterClaimed) return false;
  const k = O.kit; [k.gun, k.oc, ...k.imp].forEach(id => { if (!owns(id)) SAVE.owned.push(id); });
  SAVE.loadout = { gun: k.gun, oc: k.oc, imp: k.imp.slice() }; SAVE.scrip += O.scrip; SAVE.char.starterClaimed = true; persist(); return true;
}

/* ---- Player sprite from a look ---- */
function lookMaterials(L) {
  MAT.pcoat = ramp(optOf(L, "coatCol")[3]); MAT.plin = ramp(optOf(L, "lining")[3]); MAT.phair = ramp(optOf(L, "hairCol")[3]); MAT.pskin = ramp(optOf(L, "skin")[3]);
  MAT.parm = L.arm === "gold" ? GOLD : MAT.chrome;
  MAT.pgun = { carbon: ["#06060a", "#101018", "#1c1c28", "#30304a"], gold: GOLD }[L.gun] || MAT.gun;
  const g = optOf(L, "glow")[3]; MAT.pglow = { e: g, core: mix(g, "#ffffff", .7) }; MAT.pneon = { e: COL.magenta, core: "#ffc2dc" };
  return g;
}
const trailColors = L => { const g = optOf(L, "glow")[3]; return L.trail === "glitch" ? [COL.magenta, COL.cyan, "#ffffff"] : [L.trail === "glow" ? g : optOf(L, "trail")[3]]; };
function playerDef(o, L) {
  const b = o.bob || 0, la = o.la || 0, ra = o.ra || 0, U = y => y + b, P = [], cs = L.coat, armR = L.arm !== "none", armL = L.arm === "both";
  if (cs === "long") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [21, 29], [17, 30], [12, 26], [7, 30], [3, 29]]), Pl("plin", [[10, 22], [14, 22], [15, 27], [12, 25.5], [9, 27]]));
  if (cs === "jacket") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [19, U(24)], [5, U(24)]]));
  if (cs === "cloak") P.push(Pl("pcoat", [[4, U(11)], [20, U(11)], [24, 30], [18, 29], [12, 31], [6, 29], [0, 30]]), Pl("plin", [[9, U(20)], [15, U(20)], [16, 29], [12, 30], [8, 29]]));
  P.push(R("pants", 9, 24, 3, 5 + la), R("pants", 14, 24, 3, 5 + ra), R("boot", 8, 28 + la, 4, 3), R("boot", 14, 28 + ra, 4, 3));
  if (cs === "cloak") P.push(Pl("pcoat", [[6, U(12)], [18, U(12)], [19, U(25)], [12, U(26)], [5, U(25)]]));
  else if (cs === "vest") P.push(Pl("pcoat", [[8, U(13)], [16, U(13)], [16, U(23)], [8, U(23)]]), E("pcoat", 7.5, U(14), 2.4, 1.7), E("pcoat", 16.5, U(14), 2.4, 1.7));
  else P.push(Pl("pcoat", [[7, U(13)], [17, U(13)], [17, U(23)], [12, U(24)], [7, U(23)]]));
  P.push(R("armor", 11, U(14), 3, 8), R("gun", 8, U(21), 9, 1), Px("pglow", [[12, U(21)], [12, U(16)]]));
  if (armL) P.push(S_(R("parm", 5, U(14), 3, 8)), Px("pglow", [[6, U(17)]]), E("parm", 6, U(23), 1.6, 1.5));
  else if (cs === "vest") P.push(S_(R("pskin", 5, U(15), 3, 7)), E("pskin", 6, U(23), 1.6, 1.5));
  else P.push(S_(Pl("pcoat", [[4, U(14)], [8, U(14)], [8, U(22)], [5, U(22)]])), E("pskin", 6, U(23), 1.6, 1.5));
  if (armR) P.push(S_(R("parm", 16, U(14), 3, 7)), Px("pglow", [[17, U(17)]]), E("parm", 17.5, U(21.5), 1.6, 1.5));
  else if (cs === "vest") P.push(S_(R("pskin", 16, U(15), 3, 6)), E("pskin", 17.5, U(21.5), 1.6, 1.5));
  else P.push(S_(Pl("pcoat", [[16, U(14)], [19, U(14)], [19, U(21)], [16, U(21)]])), E("pskin", 17.5, U(21.5), 1.6, 1.5));
  P.push(R("pgun", 17, U(20), 6, 2), R("chrome", 22, U(20), 2, 1), R("pgun", 17, U(22), 2, 2), Px("pglow", [[19, U(20)]]));
  if (L.gun === "neon") P.push(R("pneon", 17, U(21), 5, 1));
  if (cs === "long" || cs === "jacket") P.push(S_(Pl("pcoat", [[6, U(12)], [18, U(12)], [19, U(15)], [15, U(15)], [12, U(17)], [9, U(15)], [5, U(15)]])));
  if (L.extra === "scarf") P.push(S_(Pl("plin", [[7, U(12)], [17, U(12)], [17, U(15)], [14, U(15)], [15, U(20)], [12, U(20)], [12, U(15)], [7, U(15)]])));
  P.push(E("pskin", 12, U(8.5), 4.5, 4.5));
  const bob = Pl("phair", [[7, U(8)], [8, U(4)], [11, U(2.5)], [15, U(3)], [17, U(6)], [17.5, U(11)], [16, U(13)], [15, U(9)], [10, U(7)], [8, U(10)], [7, U(12)]]);
  if (cs === "cloak") P.push(Pl("pcoat", [[6, U(10)], [7, U(4)], [12, U(1)], [17, U(4)], [18, U(10)], [17, U(14)], [16, U(8)], [8, U(8)], [7, U(14)]]));
  else if (L.hair === "bob") P.push(bob);
  else if (L.hair === "buzz") P.push(Pl("phair", [[8, U(7)], [9, U(4)], [12, U(3)], [15, U(4)], [16, U(7)], [15, U(6)], [9, U(6)]]));
  else if (L.hair === "long") P.push(bob, Pl("phair", [[7, U(8)], [9.5, U(9)], [9.5, U(16)], [6, U(16)]]), Pl("phair", [[17, U(8)], [14.5, U(9)], [14.5, U(16)], [18, U(16)]]));
  else if (L.hair === "ponytail") P.push(bob, Pl("phair", [[16, U(5)], [19, U(6)], [20, U(14)], [18, U(15)], [17, U(9)]]));
  else if (L.hair === "mohawk") P.push(R("phair", 11, U(1), 3, 6), Px("pglow", [[12, U(0)], [11, U(1)], [13, U(1)]]));
  if (L.eyes === "visor") P.push(R("pglow", 9, U(9), 7, 1));
  else if (L.eyes === "eyes") P.push(Px("pglow", [[10, U(9)], [14, U(9)]]));
  else if (L.eyes === "goggles") P.push(R("pgun", 7, U(8), 11, 1), R("pglow", 9, U(8), 2, 2), R("pglow", 13, U(8), 2, 2));
  else if (L.eyes === "mask") P.push(Pl("chrome", [[8, U(10)], [16, U(10)], [15, U(13)], [12, U(14)], [9, U(13)]]), Px("pglow", [[10, U(9)], [14, U(9)]]));
  else if (L.eyes === "trophy") P.push(Pl("bone", [[8.5, U(7)], [15.5, U(7)], [14, U(11)], [12, U(15)], [10, U(11)]]), Px("pglow", [[10, U(8)], [13, U(8)]]));
  if (cs !== "cloak" && ["bob", "long", "ponytail"].includes(L.hair)) P.push(Px("pglow", [[14, U(4)], [15, U(5)], [16, U(7)]]));
  if (L.extra === "crown") P.push(Px("pglow", [[7, U(2)], [8, U(0)], [10, U(0)], [12, U(0)], [14, U(0)], [16, U(0)], [17, U(2)]]));
  return { w: 26, h: 33, parts: P };
}
const PRIM = { rimR: COL.cyan, rimL: "#7f74c9" };
const FRAMES = { vesper: {}, vesperB: { bob: -1 }, run1: { la: -1, ra: 1, bob: -1 }, run2: { la: 1, ra: -1, bob: -1 } };
// Build the four player frames for a look. Used for the game sprites and for previews.
function playerSprites(L) { lookMaterials(L); const out = {}; for (const k in FRAMES) out[k] = sprite(playerDef(FRAMES[k], L), PRIM); return out; }
const previewCache = new Map();
function previewSprite(L, frame = "vesper") { const k = JSON.stringify(L) + frame; if (!previewCache.has(k)) { if (previewCache.size > 60) previewCache.clear(); previewCache.set(k, playerSprites(L)[frame]); } return previewCache.get(k); }
// Install the saved look into the game's sprite tables (normal, flipped and afterimage tints).
function applyLook() {
  const L = SAVE.char.look, s = playerSprites(L);
  for (const k in s) { SP[k] = s[k]; SPF[k] = flipSpr(s[k]); }
  const cols = trailColors(L); SP.trails = cols.map(c => tinted(SP.vesper, c)); SPF.trails = cols.map(c => tinted(SPF.vesper, c));
  SP.vesperT = SP.trails[0]; SPF.vesperT = SPF.trails[0];
}
