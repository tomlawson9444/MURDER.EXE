/* Character model: look options, cosmetics sold at Magpie's, origins with starter kits, and the player sprite builder. */
"use strict";
const ramp = b => [tone(b, -.55), tone(b, -.28), b, tone(b, .28)];
const GOLD = ["#5a3a10", "#9a6a1a", "#d8a83a", "#ffe08a"];
// Each option: [value, label, cosmetic id that unlocks it (empty = free), colour]
const LOOK_SLOTS = [
  { key: "coat", label: "COAT", opts: [["long", "LONG COAT"], ["jacket", "JACKET"], ["trench", "BELTED TRENCH"], ["duster", "SPLIT DUSTER"], ["bomber", "BOMBER"], ["robe", "STREET ROBE"], ["poncho", "RAIN PONCHO"], ["tactical", "TACTICAL RIG"], ["tank", "TANK TOP"], ["cloak", "GHOST CLOAK", "c_cloak"], ["vest", "COMBAT VEST", "c_vest"]] },
  { key: "coatCol", label: "COAT COLOUR", opts: [["midnight", "MIDNIGHT", "", "#322853"], ["graphite", "GRAPHITE", "", "#3c3c48"], ["charcoal", "CHARCOAL", "", "#26242e"], ["oxblood", "OXBLOOD", "", "#5a1e2a"], ["crimson", "CRIMSON", "", "#8a1e2e"], ["rust", "RUST", "", "#6a3a1e"], ["mustard", "MUSTARD", "", "#8a6a1e"], ["sand", "SAND", "", "#8a7a5a"], ["cream", "CREAM", "", "#a8a088"], ["olive", "OLIVE", "", "#3e4a26"], ["forest", "FOREST", "", "#1e3a26"], ["teal", "TEAL", "", "#1e5a5a"], ["navy", "NAVY", "", "#1e2e5a"], ["cobalt", "COBALT", "", "#24408a"], ["plum", "PLUM", "", "#4a2850"], ["hotpink", "HOT PINK", "", "#8a1e5a"],
    ["white", "BLEACHED", "c_white", "#b8b4c8"], ["chrome", "CHROME MANTLE", "c_chrome", "#8a8aa8"], ["opensky", "OPEN SKY", "c_end_release", "#3e6fb8"]] },
  { key: "pattern", label: "PATTERN", opts: [["none", "PLAIN"], ["stripe", "RACING STRIPE"], ["chevron", "CHEVRONS"], ["circuit", "CIRCUIT GLOW"], ["hazard", "HAZARD BAND"], ["camo", "CAMO"], ["studs", "STUDS"], ["crow", "CROW EMBLEM"]] },
  { key: "lining", label: "TRIM", opts: [["magenta", "MAGENTA", "", "#741d55"], ["cyan", "CYAN", "", "#1d5a74"], ["amber", "AMBER", "", "#8a5a14"], ["black", "BLACK", "", "#1a1726"], ["red", "RED", "", "#8a1e1e"], ["lime", "LIME", "", "#4a7a14"], ["violet", "VIOLET", "", "#4a2a8a"], ["white", "WHITE", "", "#a8a4b8"], ["gold", "GOLD", "", "#a07a1a"]] },
  { key: "shoulder", label: "SHOULDERS", opts: [["none", "NONE"], ["pads", "ARMOUR PADS"], ["spikes", "SPIKED PADS"], ["feathers", "CROW FEATHERS"], ["fur", "FUR COLLAR"], ["plate", "CHROME PLATE"]] },
  { key: "arm", label: "ARMS", opts: [["chrome", "CHROME ARM"], ["none", "NO CHROME"], ["left", "LEFT CHROME"], ["carbon", "CARBON ARM"], ["red", "RED ARM"], ["white", "WHITE ARM"], ["both", "FULL CHROME", "c_fullchrome"], ["gold", "GOLD ARM", "c_goldarm"]] },
  { key: "legs", label: "TROUSERS", opts: [["black", "BLACK", "", "#242136"], ["grey", "GREY", "", "#4a4a58"], ["navy", "NAVY", "", "#1e2a4a"], ["khaki", "KHAKI", "", "#5a5236"], ["red", "RED", "", "#6a1e24"], ["white", "WHITE", "", "#9a96a8"], ["denim", "DENIM", "", "#2e4a6a"]] },
  { key: "boots", label: "BOOTS", opts: [["combat", "COMBAT"], ["knee", "KNEE-HIGH"], ["sneakers", "SNEAKERS"], ["glow", "GLOW SOLES"], ["chrome", "CHROME FEET"]] },
  { key: "skin", label: "SKIN", opts: [["s0", "TONE 1", "", "#fbe0c8"], ["s1", "TONE 2", "", "#f2c9a8"], ["s2", "TONE 3", "", "#dfaa8e"], ["s3", "TONE 4", "", "#b97d68"], ["s4", "TONE 5", "", "#8f5a44"], ["s5", "TONE 6", "", "#6a3e2e"], ["s6", "TONE 7", "", "#4a2a22"], ["s7", "TONE 8", "", "#2e1a16"], ["synth", "SYNTH GREY", "", "#8a90a8"], ["bluesynth", "BLUE SYNTH", "", "#5a7aa8"]] },
  { key: "face", label: "FACE", opts: [["none", "CLEAN"], ["scar", "SCAR"], ["tattoo", "GLOW TATTOO"], ["freckles", "FRECKLES"], ["paint", "WAR PAINT"], ["chrome", "CHEEK CHROME"], ["barcode", "BARCODE"], ["beard", "BEARD"], ["lips", "NEON LIPS"]] },
  { key: "hair", label: "HAIR", opts: [["bob", "BOB"], ["buzz", "BUZZ"], ["long", "LONG"], ["ponytail", "PONYTAIL"], ["undercut", "UNDERCUT"], ["spikes", "SPIKES"], ["slick", "SLICKED BACK"], ["fringe", "FRINGE"], ["sidecut", "SIDE SHAVE"], ["afro", "AFRO"], ["bun", "TOP KNOT"], ["braids", "BRAIDS"], ["pigtails", "PIGTAILS"], ["dreads", "DREADS"], ["bald", "BALD"], ["mohawk", "NEON MOHAWK", "c_mohawk"]] },
  { key: "hairCol", label: "HAIR COLOUR", opts: [["black", "BLACK", "", "#221d40"], ["brown", "BROWN", "", "#4a2e1e"], ["auburn", "AUBURN", "", "#7a3a1a"], ["red", "RED", "", "#8a2a20"], ["orange", "ORANGE", "", "#c8601e"], ["blonde", "BLONDE", "", "#c8a050"], ["white", "WHITE", "", "#d8d4e8"], ["silver", "SILVER", "", "#a8a4b8"], ["pink", "PINK", "", "#d86aa8"], ["magenta", "MAGENTA", "", "#a02a78"], ["lavender", "LAVENDER", "", "#9a8ac8"], ["blue", "BLUE", "", "#2a4aa8"], ["cyan", "CYAN", "", "#2a8aa0"], ["teal", "TEAL", "", "#1e7a7a"],
    ["green", "TOXIC DYE", "c_dye_green", "#3a8a2a"], ["violet", "UV DYE", "c_dye_violet", "#6a3aa0"]] },
  { key: "head", label: "HEADWEAR", opts: [["none", "NONE"], ["hood", "HOOD UP"], ["beanie", "BEANIE"], ["cap", "CAP"], ["bandana", "BANDANA"], ["headphones", "HEADPHONES"], ["straw", "STRAW HAT"], ["horns", "CYBER HORNS"], ["antenna", "ANTENNA"]] },
  { key: "eyes", label: "EYES", opts: [["visor", "VISOR"], ["eyes", "OPTICS"], ["goggles", "GOGGLES"], ["shades", "SHADES"], ["mono", "MONO OPTIC"], ["spider", "SPIDER OPTICS"], ["patch", "EYEPATCH"], ["respirator", "RESPIRATOR"], ["bandit", "FACE WRAP"], ["skull", "SKULL MASK"], ["oni", "ONI MASK"], ["kitsune", "FOX MASK"],
    ["mask", "RIPPER MASK", "c_mask"], ["trophy", "CROW TROPHY", "c_trophy"], ["scarecrow", "SCARECROW MASK", "c_scare"]] },
  { key: "glow", label: "GLOW", opts: [["cyan", "CYAN", "", COL.cyan], ["magenta", "MAGENTA", "", COL.magenta], ["amber", "AMBER", "", COL.amber], ["pink", "PINK", "", "#ff7ad9"], ["blue", "BLUE", "", "#3d7dff"], ["orange", "ORANGE", "", "#ff7a1a"], ["green", "GREEN", "", "#3dff7a"], ["ice", "ICE", "", "#9ff3ff"], ["gold", "GOLD", "", "#ffd23a"],
    ["lime", "LIME", "c_glow_lime", "#9dff4a"], ["white", "GHOST WHITE", "c_glow_white", "#e8f6ff"], ["corvus", "CORVUS RED", "c_end_crown", "#ff3d3d"], ["violet", "UV", "c_glow_violet", "#b06cff"]] },
  { key: "back", label: "ON YOUR BACK", opts: [["none", "NOTHING"], ["pack", "BACKPACK"], ["katana", "KATANA"], ["cape", "CAPE"], ["wings", "CYBER WINGS"], ["tanks", "AIR TANKS"]] },
  { key: "extra", label: "EXTRA", opts: [["none", "NONE"], ["crow", "PET CROW"], ["drone", "DRONE"], ["belt", "UTILITY BELT"], ["chain", "CHAIN"], ["scarf", "RAIN SCARF", "c_scarf"], ["crown", "AUGUR'S HALO", "c_crown"]] },
  { key: "trail", label: "AFTERIMAGE", opts: [["glow", "MATCH GLOW"], ["cyan", "CYAN", "", COL.cyan], ["amber", "AMBER", "", COL.amber], ["violet", "VIOLET", "", "#b06cff"], ["magenta", "MAGENTA", "c_trail_mag", COL.magenta], ["gold", "GOLD", "c_trail_gold", "#ffd27a"], ["glitch", "GLITCH", "c_trail_glitch"], ["clean", "CLEAN SKY", "c_end_delete", "#e8f6ff"]] },
  { key: "gun", label: "GUN FINISH", opts: [["steel", "GUNMETAL"], ["white", "WHITE"], ["red", "RED"], ["carbon", "CARBON", "c_gun_carbon"], ["gold", "GOLD", "c_gun_gold"], ["neon", "NEON", "c_gun_neon"]] },
];
const SLOT = Object.fromEntries(LOOK_SLOTS.map(s => [s.key, s]));
const optOf = (L, k) => SLOT[k].opts.find(o => o[0] === L[k]) || SLOT[k].opts[0];
const DEFAULT_LOOK = { coat: "long", coatCol: "midnight", pattern: "none", lining: "magenta", shoulder: "none", arm: "chrome", legs: "black", boots: "combat", skin: "s3", face: "none", hair: "bob", hairCol: "black", head: "none", eyes: "visor", glow: "cyan", back: "none", extra: "none", trail: "glow", gun: "steel" };

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
  ["c_end_delete", "Clean Sky Afterimage", 0, () => !!(SAVE.camp && SAVE.camp.endings && SAVE.camp.endings.delete), "Reach the DELETE ending", "Afterimage. A clean white trail, like a sky with no crows in it."],
  ["c_end_crown", "CORVUS Red Optics", 0, () => !!(SAVE.camp && SAVE.camp.endings && SAVE.camp.endings.crown), "Reach the CROWN ending", "Glow colour. The swarm's own red, in your eyes."],
  ["c_end_release", "Open Sky Coat", 0, () => !!(SAVE.camp && SAVE.camp.endings && SAVE.camp.endings.release), "Reach the RELEASE ending", "Coat colour. The blue of a sky the flock flew off into."],
  ["c_scare", "Scarecrow's Mask", 0, () => !!(SAVE.camp && SAVE.camp.flags.tookMask), "Take Scarecrow's mask in Chapter 21", "Eyes. Stitched burlap and red slits. The Stacks will remember."],
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
  const CARBON = ["#06060a", "#101018", "#1c1c28", "#30304a"];
  MAT.parm = { gold: GOLD, carbon: CARBON, red: ramp("#8a2030"), white: ramp("#b8b4c8") }[L.arm] || MAT.chrome;
  MAT.pgun = { carbon: CARBON, gold: GOLD, white: ramp("#b8b4c8"), red: ramp("#8a2030") }[L.gun] || MAT.gun;
  MAT.ppants = ramp(optOf(L, "legs")[3]); MAT.pboot = { chrome: MAT.chrome, sneakers: MAT.bone }[L.boots] || MAT.boot; MAT.poni = ramp("#8a1a22");
  const g = optOf(L, "glow")[3]; MAT.pglow = { e: g, core: mix(g, "#ffffff", .7) }; MAT.pneon = { e: COL.magenta, core: "#ffc2dc" };
  return g;
}
const trailColors = L => { const g = optOf(L, "glow")[3]; return L.trail === "glitch" ? [COL.magenta, COL.cyan, "#ffffff"] : [L.trail === "glow" ? g : optOf(L, "trail")[3]]; };
const Ln = L; // the engine's line helper (inside playerDef, L is the look)
function playerDef(o, L) {
  L = Object.assign({}, DEFAULT_LOOK, L);
  const b = o.bob || 0, la = o.la || 0, ra = o.ra || 0, U = y => y + b, P = [], cs = L.coat, armR = !["none", "left"].includes(L.arm), armL = ["both", "left"].includes(L.arm);
  const bare = ["vest", "tactical", "tank"].includes(cs), collar = ["long", "jacket", "trench", "duster", "bomber"].includes(cs), hooded = cs === "cloak" || L.head === "hood";
  // Behind the body
  if (L.back === "cape") P.push(Pl("plin", [[6, U(13)], [18, U(13)], [22, 31], [12, 32], [2, 31]]));
  if (L.back === "wings") { const w = [[9, U(15)], [3, U(7)], [0, U(12)], [1, U(21)], [5, U(25)], [9, U(20)]]; P.push(Pl("wing", w), Pl("wing", mirror(24, w)), Px("pglow", [[3, U(8)], [0, U(13)], [21, U(8)], [24, U(13)]])); }
  if (L.back === "katana") P.push(Ln("chrome", 2, U(28), 16, U(11)), Ln("chrome", 3, U(28), 17, U(11)), Ln("plin", 17, U(10), 21, U(5)), Ln("plin", 18, U(10), 22, U(5)), Px("chrome", [[16, U(10)], [17, U(11)], [18, U(11)]]), Px("pglow", [[22, U(4)]]));
  if (L.back === "pack") P.push(R("armor", 1, U(13), 7, 10), R("pgun", 1, U(17), 7, 1), Px("pglow", [[2, U(20)], [3, U(20)]]), Px("plin", [[2, U(14)], [3, U(14)]]));
  if (L.back === "tanks") P.push(E("chrome", 4, U(17), 2, 4.5), E("chrome", 20, U(17), 2, 4.5), Px("pglow", [[4, U(13)], [20, U(13)]]));
  // Coat tails
  if (cs === "long") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [21, 29], [17, 30], [12, 26], [7, 30], [3, 29]]), Pl("plin", [[10, 22], [14, 22], [15, 27], [12, 25.5], [9, 27]]));
  if (cs === "trench") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [22, 30], [17, 31], [12, 27], [7, 31], [2, 30]]), Pl("plin", [[10, 22], [14, 22], [15, 28], [12, 26], [9, 28]]));
  if (cs === "duster") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [21, 31], [16, 31], [13, 25], [11, 25], [8, 31], [3, 31]]));
  if (cs === "jacket") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [19, U(24)], [5, U(24)]]));
  if (cs === "bomber") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [18, U(22)], [6, U(22)]]), R("plin", 6, U(22), 12, 1));
  if (cs === "cloak") P.push(Pl("pcoat", [[4, U(11)], [20, U(11)], [24, 30], [18, 29], [12, 31], [6, 29], [0, 30]]), Pl("plin", [[9, U(20)], [15, U(20)], [16, 29], [12, 30], [8, 29]]));
  // Legs and boots
  const knee = L.boots === "knee" ? 2 : 0;
  P.push(R("ppants", 9, 24, 3, 5 + la), R("ppants", 14, 24, 3, 5 + ra), R("pboot", 8, 28 + la - knee, 4, 3 + knee), R("pboot", 14, 28 + ra - knee, 4, 3 + knee));
  if (L.boots === "glow") P.push(R("pglow", 8, 30 + la, 4, 1), R("pglow", 14, 30 + ra, 4, 1));
  if (L.boots === "sneakers") P.push(Px("pglow", [[9, 29 + la], [15, 29 + ra]]));
  if (cs === "robe") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [19, 29], [5, 29]]), R("plin", 11, U(24), 2, 5));
  // Torso
  if (cs === "cloak") P.push(Pl("pcoat", [[6, U(12)], [18, U(12)], [19, U(25)], [12, U(26)], [5, U(25)]]));
  else if (cs === "vest" || cs === "tactical") P.push(Pl("pcoat", [[8, U(13)], [16, U(13)], [16, U(23)], [8, U(23)]]), E("pcoat", 7.5, U(14), 2.4, 1.7), E("pcoat", 16.5, U(14), 2.4, 1.7));
  else if (cs === "tank") P.push(Pl("pcoat", [[8, U(14)], [16, U(14)], [16, U(23)], [8, U(23)]]), Px("pcoat", [[9, U(13)], [15, U(13)]]));
  else P.push(Pl("pcoat", [[7, U(13)], [17, U(13)], [17, U(23)], [12, U(24)], [7, U(23)]]));
  if (cs === "tactical") P.push(R("armor", 8, U(18), 3, 3), R("armor", 13, U(18), 3, 3), Px("pglow", [[9, U(19)], [14, U(19)]]));
  if (cs !== "tank") P.push(R("armor", 11, U(14), 3, 8));
  if (cs === "robe") P.push(Pl("plin", [[10, U(13)], [14, U(13)], [12, U(18)]]), R("plin", 7, U(20), 10, 2));
  // Pattern
  const pat = { stripe: [R("plin", 8, U(14), 2, 9)], chevron: [Px("plin", [[8, U(16)], [9, U(17)], [10, U(16)], [8, U(19)], [9, U(20)], [10, U(19)], [14, U(16)], [15, U(17)], [16, U(16)]])],
    circuit: [Px("pglow", [[8, U(15)], [9, U(15)], [9, U(16)], [9, U(17)], [15, U(17)], [16, U(17)], [15, U(18)], [15, U(19)], [8, U(20)], [9, U(20)]])],
    hazard: [R("hazard", 7, U(19), 10, 2), Px("pgun", [[8, U(19)], [9, U(20)], [11, U(19)], [12, U(20)], [14, U(19)], [15, U(20)]])],
    camo: [Px("plin", [[8, U(14)], [9, U(14)], [9, U(15)], [15, U(16)], [16, U(16)], [16, U(17)], [8, U(19)], [9, U(20)], [15, U(21)], [14, U(21)]])],
    studs: [Px("chrome", [[8, U(14)], [9, U(16)], [8, U(18)], [16, U(14)], [15, U(16)], [16, U(18)]])],
    crow: [Px("bone", [[15, U(15)], [16, U(15)], [14, U(16)], [15, U(16)], [16, U(16)], [15, U(17)]]), Px("pglow", [[16, U(15)]])] }[L.pattern];
  if (pat) P.push(...pat);
  P.push(R("gun", 8, U(21), 9, 1), Px("pglow", [[12, U(21)], [12, U(16)]]));
  // Arms
  if (armL) P.push(S_(R("parm", 5, U(14), 3, 8)), Px("pglow", [[6, U(17)]]), E("parm", 6, U(23), 1.6, 1.5));
  else if (bare) P.push(S_(R("pskin", 5, U(15), 3, 7)), E("pskin", 6, U(23), 1.6, 1.5));
  else P.push(S_(Pl("pcoat", [[4, U(14)], [8, U(14)], [8, U(22)], [5, U(22)]])), E("pskin", 6, U(23), 1.6, 1.5));
  if (armR) P.push(S_(R("parm", 16, U(14), 3, 7)), Px("pglow", [[17, U(17)]]), E("parm", 17.5, U(21.5), 1.6, 1.5));
  else if (bare) P.push(S_(R("pskin", 16, U(15), 3, 6)), E("pskin", 17.5, U(21.5), 1.6, 1.5));
  else P.push(S_(Pl("pcoat", [[16, U(14)], [19, U(14)], [19, U(21)], [16, U(21)]])), E("pskin", 17.5, U(21.5), 1.6, 1.5));
  if (cs === "poncho") P.push(Pl("pcoat", [[5, U(12)], [19, U(12)], [21, U(20)], [12, U(22)], [3, U(20)]]), R("plin", 4, U(18), 16, 1), R("armor", 11, U(13), 3, 2));
  if (L.extra === "belt") P.push(R("rust", 7, U(21), 10, 2), Px("chrome", [[12, U(21)]]), R("rust", 8, U(22), 2, 2));
  if (L.extra === "chain") P.push(Px("chrome", [[9, U(23)], [10, U(24)], [11, U(24)], [12, U(24)], [13, U(23)]]));
  // Gun
  P.push(R("pgun", 17, U(20), 6, 2), R("chrome", 22, U(20), 2, 1), R("pgun", 17, U(22), 2, 2), Px("pglow", [[19, U(20)]]));
  if (L.gun === "neon") P.push(R("pneon", 17, U(21), 5, 1));
  if (collar) P.push(S_(Pl("pcoat", [[6, U(12)], [18, U(12)], [19, U(15)], [15, U(15)], [12, U(17)], [9, U(15)], [5, U(15)]])));
  if (cs === "bomber") P.push(E("plin", 12, U(13), 6, 1.6));
  // Shoulders
  if (L.shoulder === "pads" || L.shoulder === "spikes") P.push(S_(E("armor", 6, U(14), 2.6, 1.8)), S_(E("armor", 17.5, U(14), 2.6, 1.8)));
  if (L.shoulder === "spikes") P.push(Px("chrome", [[5, U(12)], [6, U(11)], [18, U(11)], [19, U(12)]]));
  if (L.shoulder === "feathers") { const f = [[3, U(16)], [5, U(12)], [9, U(13)], [8, U(15)], [5, U(18)]]; P.push(Pl("wing", f), Pl("wing", mirror(24, f)), Px("pglow", [[4, U(16)], [20, U(16)]])); }
  if (L.shoulder === "fur") P.push(E("plin", 12, U(13), 7, 2));
  if (L.shoulder === "plate") P.push(S_(E("chrome", 17.5, U(14), 3, 2)), Px("pglow", [[18, U(14)]]));
  if (L.extra === "scarf") P.push(S_(Pl("plin", [[7, U(12)], [17, U(12)], [17, U(15)], [14, U(15)], [15, U(20)], [12, U(20)], [12, U(15)], [7, U(15)]])));
  // Head
  if (L.hair === "afro" && !hooded) P.push(E("phair", 12, U(6), 6.5, 5.5));
  if (["long", "braids", "dreads"].includes(L.hair) && !hooded) P.push(Pl("phair", [[7, U(8)], [17, U(8)], [18, U(15)], [6, U(15)]]));
  P.push(E("pskin", 12, U(8.5), 4.5, 4.5));
  const face = { scar: [Ln("rust", 14, U(6), 15, U(12))], tattoo: [Px("pglow", [[9, U(11)], [9, U(12)], [15, U(11)], [15, U(12)], [12, U(5)]])], freckles: [Px("rust", [[9, U(11)], [10, U(10)], [14, U(10)], [15, U(11)]])],
    paint: [R("pgun", 8, U(10), 9, 1)], chrome: [R("chrome", 14, U(10), 3, 2), Px("pglow", [[15, U(10)]])], barcode: [Px("pgun", [[14, U(11)], [15, U(11)], [16, U(11)], [14, U(12)], [16, U(12)]])],
    beard: [Pl("phair", [[8, U(10)], [16, U(10)], [15, U(13)], [12, U(14)], [9, U(13)]])], lips: [R("pglow", 11, U(12), 3, 1)] }[L.face];
  if (face) P.push(...face);
  const bob = Pl("phair", [[7, U(8)], [8, U(4)], [11, U(2.5)], [15, U(3)], [17, U(6)], [17.5, U(11)], [16, U(13)], [15, U(9)], [10, U(7)], [8, U(10)], [7, U(12)]]);
  const buzz = Pl("phair", [[8, U(7)], [9, U(4)], [12, U(3)], [15, U(4)], [16, U(7)], [15, U(6)], [9, U(6)]]);
  if (cs === "cloak" || L.head === "hood") P.push(Pl("pcoat", [[6, U(10)], [7, U(4)], [12, U(1)], [17, U(4)], [18, U(10)], [17, U(14)], [16, U(8)], [8, U(8)], [7, U(14)]]));
  else {
    const H = {
      bob: [bob], buzz: [buzz], long: [bob, Pl("phair", [[7, U(8)], [9.5, U(9)], [9.5, U(16)], [6, U(16)]]), Pl("phair", [[17, U(8)], [14.5, U(9)], [14.5, U(16)], [18, U(16)]])],
      ponytail: [bob, Pl("phair", [[16, U(5)], [19, U(6)], [20, U(14)], [18, U(15)], [17, U(9)]])],
      mohawk: [R("phair", 11, U(1), 3, 6), Px("pglow", [[12, U(0)], [11, U(1)], [13, U(1)]])],
      undercut: [Pl("phair", [[8, U(6)], [9, U(3)], [13, U(2.5)], [17, U(4)], [17, U(7)], [13, U(5)], [9, U(6)]])],
      spikes: [Pl("phair", [[7, U(7)], [7, U(3)], [9, U(5)], [10, U(1)], [12, U(4)], [14, U(0)], [15, U(4)], [17, U(2)], [17, U(7)]])],
      slick: [Pl("phair", [[8, U(7)], [8, U(4)], [12, U(2.5)], [16, U(4)], [18, U(8)], [17, U(11)], [16, U(6)], [9, U(6)]])],
      fringe: [bob, Pl("phair", [[8, U(5)], [15, U(5)], [11, U(11)], [8, U(10)]])],
      sidecut: [buzz, Pl("phair", [[12, U(3)], [16, U(4)], [18, U(8)], [18, U(15)], [15, U(14)], [15, U(7)], [12, U(5)]])],
      afro: [Pl("phair", [[7, U(7)], [8, U(3)], [12, U(2)], [16, U(3)], [17, U(7)], [12, U(5)]])],
      bun: [buzz, E("phair", 12, U(1.8), 2.2, 1.8)],
      braids: [bob, R("phair", 6, U(9), 2, 9), R("phair", 17, U(9), 2, 9), Px("plin", [[6, U(17)], [18, U(17)]])],
      pigtails: [bob, E("phair", 5, U(9), 2, 2.4), E("phair", 19, U(9), 2, 2.4), Px("plin", [[6, U(8)], [18, U(8)]])],
      dreads: [bob, Ln("phair", 7, U(9), 6, U(17)), Ln("phair", 9, U(10), 9, U(18)), Ln("phair", 15, U(10), 15, U(18)), Ln("phair", 17, U(9), 18, U(17))],
      bald: [Px("pskin", [[12, U(4)]])],
    }[L.hair] || [bob];
    P.push(...H);
  }
  // Headwear
  const hat = { beanie: [Pl("plin", [[7, U(7)], [8, U(3)], [12, U(1.5)], [16, U(3)], [17, U(7)]]), R("pcoat", 7, U(6), 10, 1)],
    cap: [Pl("plin", [[8, U(5.5)], [9, U(2.5)], [15, U(2.5)], [16, U(5.5)]]), R("plin", 14, U(5), 6, 1), Px("pglow", [[12, U(3)]])],
    bandana: [R("plin", 7, U(4), 10, 2), Px("plin", [[6, U(5)], [5, U(6)], [5, U(7)]])],
    headphones: [Ln("pgun", 8, U(6), 11, U(2)), Ln("pgun", 11, U(2), 16, U(6)), E("chrome", 7.5, U(8), 1.6, 2), E("chrome", 16.5, U(8), 1.6, 2), Px("pglow", [[7, U(8)], [17, U(8)]])],
    straw: [Pl("hazard", [[1, U(6.5)], [12, U(0.5)], [23, U(6.5)], [12, U(5)]]), Ln("rust", 2, U(6), 22, U(6))],
    horns: [Pl("bone", [[8, U(5)], [6, U(0)], [10, U(4)]]), Pl("bone", [[16, U(5)], [18, U(0)], [14, U(4)]]), Px("pglow", [[6, U(0)], [18, U(0)]])],
    antenna: [Ln("chrome", 15, U(4), 18, U(0)), Px("pglow", [[18, U(0)], [19, U(0)]])] }[L.head];
  if (hat) P.push(...hat);
  // Eyes and masks
  const eye2 = Px("pglow", [[10, U(9)], [14, U(9)]]);
  const EY = { visor: [R("pglow", 9, U(9), 7, 1)], eyes: [eye2], goggles: [R("pgun", 7, U(8), 11, 1), R("pglow", 9, U(8), 2, 2), R("pglow", 13, U(8), 2, 2)],
    shades: [R("pgun", 8, U(8), 9, 2), Px("chrome", [[9, U(8)], [14, U(8)]])], mono: [Px("pglow", [[10, U(9)]]), R("chrome", 13, U(7), 4, 4), R("pglow", 14, U(8), 2, 2)],
    spider: [Px("pglow", [[9, U(8)], [11, U(9)], [13, U(9)], [15, U(8)], [10, U(10)], [14, U(10)]])], patch: [Ln("pgun", 8, U(6), 17, U(8)), R("pgun", 13, U(8), 3, 2), Px("pglow", [[10, U(9)]])],
    respirator: [eye2, Pl("pgun", [[9, U(10)], [15, U(10)], [14, U(13.5)], [10, U(13.5)]]), Px("pglow", [[10, U(12)], [14, U(12)]]), Px("chrome", [[12, U(12)]])],
    bandit: [eye2, Pl("plin", [[8, U(10)], [16, U(10)], [15, U(13)], [12, U(14)], [9, U(13)]])],
    skull: [Pl("bone", [[8, U(6)], [16, U(6)], [16, U(11)], [14, U(13.5)], [10, U(13.5)], [8, U(11)]]), R("pgun", 9, U(8), 2, 2), R("pgun", 13, U(8), 2, 2), Px("pglow", [[10, U(9)], [14, U(9)]]), Px("pgun", [[11, U(12)], [13, U(12)]])],
    oni: [Pl("poni", [[8, U(6)], [16, U(6)], [16, U(12)], [12, U(14)], [8, U(12)]]), Px("bone", [[8, U(5)], [16, U(5)], [11, U(12)], [13, U(12)]]), Px("pglow", [[10, U(9)], [14, U(9)]])],
    kitsune: [Pl("bone", [[8, U(6)], [16, U(6)], [15, U(11)], [12, U(14)], [9, U(11)]]), Px("bone", [[8, U(5)], [16, U(5)]]), Px("redE", [[9, U(8)], [15, U(8)], [12, U(12)], [12, U(6)]]), Px("pgun", [[10, U(9)], [14, U(9)]])],
    mask: [Pl("chrome", [[8, U(10)], [16, U(10)], [15, U(13)], [12, U(14)], [9, U(13)]]), eye2],
    scarecrow: [Pl("rust", [[7.5, U(5)], [16.5, U(5)], [16, U(13)], [12, U(14)], [8, U(13)]]), Px("redE", [[9, U(9)], [10, U(9)], [14, U(9)], [15, U(9)]]), Px("bone", [[10, U(12)], [12, U(12)], [14, U(12)]])],
    trophy: [Pl("bone", [[8.5, U(7)], [15.5, U(7)], [14, U(11)], [12, U(15)], [10, U(11)]]), Px("pglow", [[10, U(8)], [13, U(8)]])] }[L.eyes] || [eye2];
  P.push(...EY);
  if (!hooded && L.head === "none" && ["bob", "long", "ponytail", "fringe", "braids", "pigtails"].includes(L.hair)) P.push(Px("pglow", [[14, U(4)], [15, U(5)], [16, U(7)]]));
  // Extras on top
  if (L.extra === "crown") P.push(Px("pglow", [[7, U(2)], [8, U(0)], [10, U(0)], [12, U(0)], [14, U(0)], [16, U(0)], [17, U(2)]]));
  if (L.extra === "crow") P.push(E("wing", 5, U(11), 2.6, 1.8), E("wing", 4, U(9), 1.6, 1.4), Px("bone", [[2, U(9)]]), Px("redE", [[4, U(9)]]), Px("wing", [[7, U(12)], [8, U(13)]]));
  if (L.extra === "drone") P.push(E("armor", 21, U(4), 2.6, 1.4), Ln("chrome", 18, U(2), 24, U(2)), Px("pglow", [[21, U(5)]]));
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
