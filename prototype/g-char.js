/* Character model: look options, cosmetics sold at Magpie's, origins with starter kits, and the player sprite builder. */
"use strict";
const ramp = b => [tone(b, -.55), tone(b, -.28), b, tone(b, .28)];
const GOLD = ["#5a3a10", "#9a6a1a", "#d8a83a", "#ffe08a"];
// Each option: [value, label, cosmetic id that unlocks it (empty = free), colour]
const LOOK_SLOTS = [
  { key: "coat", label: "COAT", opts: [["long", "LONG COAT"], ["jacket", "JACKET"], ["trench", "BELTED TRENCH"], ["duster", "SPLIT DUSTER"], ["bomber", "BOMBER"], ["robe", "STREET ROBE"], ["poncho", "RAIN PONCHO"], ["tactical", "TACTICAL RIG"], ["tank", "TANK TOP"], ["cloak", "GHOST CLOAK", "c_cloak"], ["vest", "COMBAT VEST", "c_vest"], ["plate", "HALVORSEN PLATE", "c_plate"], ["feather", "FEATHER COAT", "c_feather"], ["neoncoat", "NEON-EDGE COAT", "c_neoncoat"], ["royal", "ROYAL GREATCOAT", "c_royal"]] },
  { key: "coatCol", label: "COAT COLOUR", opts: [["midnight", "MIDNIGHT", "", "#322853"], ["graphite", "GRAPHITE", "", "#3c3c48"], ["charcoal", "CHARCOAL", "", "#26242e"], ["oxblood", "OXBLOOD", "", "#5a1e2a"], ["crimson", "CRIMSON", "", "#8a1e2e"], ["rust", "RUST", "", "#6a3a1e"], ["mustard", "MUSTARD", "", "#8a6a1e"], ["sand", "SAND", "", "#8a7a5a"], ["cream", "CREAM", "", "#a8a088"], ["olive", "OLIVE", "", "#3e4a26"], ["forest", "FOREST", "", "#1e3a26"], ["teal", "TEAL", "", "#1e5a5a"], ["navy", "NAVY", "", "#1e2e5a"], ["cobalt", "COBALT", "", "#24408a"], ["plum", "PLUM", "", "#4a2850"], ["hotpink", "HOT PINK", "", "#8a1e5a"],
    ["white", "BLEACHED", "c_white", "#b8b4c8"], ["chrome", "CHROME MANTLE", "c_chrome", "#8a8aa8"], ["opensky", "OPEN SKY", "c_end_release", "#3e6fb8"], ["gold", "GILDED", "c_col_gold", "#a8822a"], ["void", "VOID BLACK", "c_col_void", "#0e0c14"], ["neonpink", "NEON PINK", "c_col_pink", "#c82a8a"], ["toxic", "TOXIC GREEN", "c_col_toxic", "#4a8a1e"], ["ice", "GLACIER", "c_col_ice", "#6aa8c8"], ["blood", "BLOOD", "c_col_blood", "#4a0a12"], ["sunset", "SUNSET", "c_col_sunset", "#c8602a"], ["holo", "HOLO TEAL", "c_col_holo", "#2a9ab8"]] },
  { key: "pattern", label: "PATTERN", opts: [["none", "PLAIN"], ["stripe", "RACING STRIPE"], ["chevron", "CHEVRONS"], ["circuit", "CIRCUIT GLOW"], ["hazard", "HAZARD BAND"], ["camo", "CAMO"], ["studs", "STUDS"], ["crow", "CROW EMBLEM"], ["neon", "NEON TRIM", "c_pat_neon"], ["flames", "FLAMES", "c_pat_flames"], ["skull", "SKULL EMBLEM", "c_pat_skull"], ["tiger", "TIGER STRIPES", "c_pat_tiger"], ["glitch", "GLITCH", "c_pat_glitch"]] },
  { key: "lining", label: "TRIM", opts: [["magenta", "MAGENTA", "", "#741d55"], ["cyan", "CYAN", "", "#1d5a74"], ["amber", "AMBER", "", "#8a5a14"], ["black", "BLACK", "", "#1a1726"], ["red", "RED", "", "#8a1e1e"], ["lime", "LIME", "", "#4a7a14"], ["violet", "VIOLET", "", "#4a2a8a"], ["white", "WHITE", "", "#a8a4b8"], ["gold", "GOLD", "", "#a07a1a"], ["electric", "ELECTRIC", "c_trim_elec", "#2a9ae8"], ["acid", "ACID", "c_trim_acid", "#6ad81e"], ["scarlet", "SCARLET", "c_trim_scarlet", "#c81e2a"]] },
  { key: "shoulder", label: "SHOULDERS", opts: [["none", "NONE"], ["pads", "ARMOUR PADS"], ["spikes", "SPIKED PADS"], ["feathers", "CROW FEATHERS"], ["fur", "FUR COLLAR"], ["plate", "CHROME PLATE"], ["mech", "MECH PAULDRONS", "c_sh_mech"], ["epaulettes", "GOLD EPAULETTES", "c_sh_gold"], ["bone", "BONE PAULDRONS", "c_sh_bone"]] },
  { key: "arm", label: "ARMS", opts: [["chrome", "CHROME ARM"], ["none", "NO CHROME"], ["left", "LEFT CHROME"], ["carbon", "CARBON ARM"], ["red", "RED ARM"], ["white", "WHITE ARM"], ["both", "FULL CHROME", "c_fullchrome"], ["gold", "GOLD ARM", "c_goldarm"], ["neonarm", "NEON ARM", "c_arm_neon"], ["bonearm", "BONE ARM", "c_arm_bone"], ["voidarm", "VOID ARM", "c_arm_void"]] },
  { key: "legs", label: "TROUSERS", opts: [["black", "BLACK", "", "#242136"], ["grey", "GREY", "", "#4a4a58"], ["navy", "NAVY", "", "#1e2a4a"], ["khaki", "KHAKI", "", "#5a5236"], ["red", "RED", "", "#6a1e24"], ["white", "WHITE", "", "#9a96a8"], ["denim", "DENIM", "", "#2e4a6a"]] },
  { key: "boots", label: "BOOTS", opts: [["combat", "COMBAT"], ["knee", "KNEE-HIGH"], ["sneakers", "SNEAKERS"], ["glow", "GLOW SOLES"], ["chrome", "CHROME FEET"], ["rocket", "ROCKET BOOTS", "c_boot_rocket"], ["goldboots", "GOLD BOOTS", "c_boot_gold"]] },
  { key: "skin", label: "SKIN", opts: [["s0", "TONE 1", "", "#fbe0c8"], ["s1", "TONE 2", "", "#f2c9a8"], ["s2", "TONE 3", "", "#dfaa8e"], ["s3", "TONE 4", "", "#b97d68"], ["s4", "TONE 5", "", "#8f5a44"], ["s5", "TONE 6", "", "#6a3e2e"], ["s6", "TONE 7", "", "#4a2a22"], ["s7", "TONE 8", "", "#2e1a16"], ["synth", "SYNTH GREY", "", "#8a90a8"], ["bluesynth", "BLUE SYNTH", "", "#5a7aa8"], ["chromeskin", "CHROME SKIN", "c_skin_chrome", "#a8a8c0"], ["ghost", "PALE GHOST", "c_skin_ghost", "#d8e8f0"], ["demon", "INFERNAL", "c_skin_demon", "#8a2a2a"], ["holoskin", "HOLOGRAM", "c_skin_holo", "#2ab8b8"]] },
  { key: "face", label: "FACE", opts: [["none", "CLEAN"], ["scar", "SCAR"], ["tattoo", "GLOW TATTOO"], ["freckles", "FRECKLES"], ["paint", "WAR PAINT"], ["chrome", "CHEEK CHROME"], ["barcode", "BARCODE"], ["beard", "BEARD"], ["lips", "NEON LIPS"], ["glitchface", "FACE GLITCH", "c_face_glitch"], ["stitches", "STITCHES", "c_face_stitch"], ["grill", "GOLD GRILL", "c_face_grill"]] },
  { key: "hair", label: "HAIR", opts: [["bob", "BOB"], ["buzz", "BUZZ"], ["long", "LONG"], ["ponytail", "PONYTAIL"], ["undercut", "UNDERCUT"], ["spikes", "SPIKES"], ["slick", "SLICKED BACK"], ["fringe", "FRINGE"], ["sidecut", "SIDE SHAVE"], ["afro", "AFRO"], ["bun", "TOP KNOT"], ["braids", "BRAIDS"], ["pigtails", "PIGTAILS"], ["dreads", "DREADS"], ["bald", "BALD"], ["mohawk", "NEON MOHAWK", "c_mohawk"], ["flame", "FLAME HAIR", "c_hair_flame"], ["wild", "WILD SPIKES", "c_hair_wild"], ["crystal", "CRYSTAL CUT", "c_hair_crystal"]] },
  { key: "hairCol", label: "HAIR COLOUR", opts: [["black", "BLACK", "", "#221d40"], ["brown", "BROWN", "", "#4a2e1e"], ["auburn", "AUBURN", "", "#7a3a1a"], ["red", "RED", "", "#8a2a20"], ["orange", "ORANGE", "", "#c8601e"], ["blonde", "BLONDE", "", "#c8a050"], ["white", "WHITE", "", "#d8d4e8"], ["silver", "SILVER", "", "#a8a4b8"], ["pink", "PINK", "", "#d86aa8"], ["magenta", "MAGENTA", "", "#a02a78"], ["lavender", "LAVENDER", "", "#9a8ac8"], ["blue", "BLUE", "", "#2a4aa8"], ["cyan", "CYAN", "", "#2a8aa0"], ["teal", "TEAL", "", "#1e7a7a"],
    ["green", "TOXIC DYE", "c_dye_green", "#3a8a2a"], ["violet", "UV DYE", "c_dye_violet", "#6a3aa0"], ["gold", "GOLD", "c_hc_gold", "#e0b040"], ["fire", "FIRE", "c_hc_fire", "#e8481e"], ["void", "VOID", "c_hc_void", "#0a0814"], ["neon", "NEON MINT", "c_hc_neon", "#30f0d0"], ["rose", "ROSE", "c_hc_rose", "#f0a0c0"]] },
  { key: "head", label: "HEADWEAR", opts: [["none", "NONE"], ["hood", "HOOD UP"], ["beanie", "BEANIE"], ["cap", "CAP"], ["bandana", "BANDANA"], ["headphones", "HEADPHONES"], ["straw", "STRAW HAT"], ["horns", "CYBER HORNS"], ["antenna", "ANTENNA"], ["crown", "GOLD CROWN", "c_hat_crown"], ["halo", "HALO", "c_hat_halo"], ["tophat", "TOP HAT", "c_hat_top"], ["catears", "NEON CAT EARS", "c_hat_cat"], ["helmet", "FULL HELMET", "c_hat_helm"], ["cowl", "BAT COWL", "c_hat_cowl"]] },
  { key: "eyes", label: "EYES", opts: [["visor", "VISOR"], ["eyes", "OPTICS"], ["goggles", "GOGGLES"], ["shades", "SHADES"], ["mono", "MONO OPTIC"], ["spider", "SPIDER OPTICS"], ["patch", "EYEPATCH"], ["respirator", "RESPIRATOR"], ["bandit", "FACE WRAP"], ["skull", "SKULL MASK"], ["oni", "ONI MASK"], ["kitsune", "FOX MASK"],
    ["mask", "RIPPER MASK", "c_mask"], ["trophy", "CROW TROPHY", "c_trophy"], ["scarecrow", "SCARECROW MASK", "c_scare"], ["crt", "CRT FACE", "c_eye_crt"], ["laser", "LASER SIGHT", "c_eye_laser"], ["plague", "PLAGUE BEAK", "c_eye_plague"], ["gasmask", "GAS MASK", "c_eye_gas"], ["stars", "STAR EYES", "c_eye_star"], ["hockey", "HOCKEY MASK", "c_eye_hockey"]] },
  { key: "glow", label: "GLOW", opts: [["cyan", "CYAN", "", COL.cyan], ["magenta", "MAGENTA", "", COL.magenta], ["amber", "AMBER", "", COL.amber], ["pink", "PINK", "", "#ff7ad9"], ["blue", "BLUE", "", "#3d7dff"], ["orange", "ORANGE", "", "#ff7a1a"], ["green", "GREEN", "", "#3dff7a"], ["ice", "ICE", "", "#9ff3ff"], ["gold", "GOLD", "", "#ffd23a"],
    ["lime", "LIME", "c_glow_lime", "#9dff4a"], ["white", "GHOST WHITE", "c_glow_white", "#e8f6ff"], ["corvus", "CORVUS RED", "c_end_crown", "#ff3d3d"], ["violet", "UV", "c_glow_violet", "#b06cff"], ["blood", "BLOOD", "c_glow_blood", "#ff1e3c"], ["toxic", "TOXIC", "c_glow_toxic", "#b8ff1e"], ["sunset", "SUNSET", "c_glow_sunset", "#ff9a5a"], ["void", "VOID", "c_glow_void", "#7a3aff"], ["rose", "ROSE", "c_glow_rose", "#ff9ac8"]] },
  { key: "back", label: "ON YOUR BACK", opts: [["none", "NOTHING"], ["pack", "BACKPACK"], ["katana", "KATANA"], ["cape", "CAPE"], ["wings", "CYBER WINGS"], ["tanks", "AIR TANKS"], ["jetpack", "JETPACK", "c_back_jet"], ["angel", "ANGEL WINGS", "c_back_angel"], ["crowwings", "CROW WINGS", "c_back_crow"], ["banner", "WAR BANNER", "c_back_banner"], ["spider", "SPIDER ARMS", "c_back_spider"]] },
  { key: "extra", label: "EXTRA", opts: [["none", "NONE"], ["crow", "PET CROW"], ["drone", "DRONE"], ["belt", "UTILITY BELT"], ["chain", "CHAIN"], ["scarf", "RAIN SCARF", "c_scarf"], ["crown", "AUGUR'S HALO", "c_crown"], ["cat", "PET CAT", "c_ex_cat"], ["orbs", "ORBITING ORBS", "c_ex_orbs"], ["lantern", "SPIRIT LANTERN", "c_ex_lantern"], ["wisp", "GHOST WISP", "c_ex_wisp"]] },
  { key: "trail", label: "AFTERIMAGE", opts: [["glow", "MATCH GLOW"], ["cyan", "CYAN", "", COL.cyan], ["amber", "AMBER", "", COL.amber], ["violet", "VIOLET", "", "#b06cff"], ["magenta", "MAGENTA", "c_trail_mag", COL.magenta], ["gold", "GOLD", "c_trail_gold", "#ffd27a"], ["glitch", "GLITCH", "c_trail_glitch"], ["clean", "CLEAN SKY", "c_end_delete", "#e8f6ff"], ["rainbow", "RAINBOW", "c_tr_rainbow"], ["fire", "FIRE", "c_tr_fire", "#ff7a1a"], ["ice", "ICE", "c_tr_ice", "#9ff3ff"], ["void", "VOID", "c_tr_void", "#7a3aff"], ["toxic", "TOXIC", "c_tr_toxic", "#b8ff1e"]] },
  { key: "gun", label: "GUN FINISH", opts: [["steel", "GUNMETAL"], ["white", "WHITE"], ["red", "RED"], ["carbon", "CARBON", "c_gun_carbon"], ["gold", "GOLD", "c_gun_gold"], ["neon", "NEON", "c_gun_neon"], ["chromefin", "CHROME", "c_gun_chrome"], ["pink", "HOT PINK", "c_gun_pink"], ["holo", "HOLO", "c_gun_holo"]] },
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
  ["c_scarf", "Rain Scarf", 200, null, "", "Extra. A scarf in your lining colour."],
  // Magpie's wider wardrobe.
  ["c_plate", "Halvorsen Plate", 700, null, "", "Coat. Halvorsen riot plate, liberated."],
  ["c_feather", "Feather Coat", 900, null, "", "Coat. A coat stitched from a thousand crow feathers."],
  ["c_neoncoat", "Neon-Edge Coat", 700, null, "", "Coat. A long coat with light running along every edge."],
  ["c_royal", "Royal Greatcoat", 900, null, "", "Coat. Gold trim for someone who owns the night."],
  ["c_col_gold", "Gilded", 300, null, "", "Coat colour. Gilded."],
  ["c_col_void", "Void Black", 300, null, "", "Coat colour. Void Black."],
  ["c_col_pink", "Neon Pink", 300, null, "", "Coat colour. Neon Pink."],
  ["c_col_toxic", "Toxic Green", 300, null, "", "Coat colour. Toxic Green."],
  ["c_col_ice", "Glacier", 300, null, "", "Coat colour. Glacier."],
  ["c_col_blood", "Blood", 300, null, "", "Coat colour. Blood."],
  ["c_col_sunset", "Sunset", 300, null, "", "Coat colour. Sunset."],
  ["c_col_holo", "Holo Teal", 300, null, "", "Coat colour. Holo Teal."],
  ["c_pat_neon", "Neon Trim", 350, null, "", "Pattern. Neon Trim."],
  ["c_pat_flames", "Flames", 350, null, "", "Pattern. Flames."],
  ["c_pat_skull", "Skull Emblem", 350, null, "", "Pattern. Skull Emblem."],
  ["c_pat_tiger", "Tiger Stripes", 350, null, "", "Pattern. Tiger Stripes."],
  ["c_pat_glitch", "Glitch", 350, null, "", "Pattern. Glitch."],
  ["c_trim_elec", "Electric", 200, null, "", "Trim. Electric."],
  ["c_trim_acid", "Acid", 200, null, "", "Trim. Acid."],
  ["c_trim_scarlet", "Scarlet", 200, null, "", "Trim. Scarlet."],
  ["c_sh_mech", "Mech Pauldrons", 450, null, "", "Shoulders. Big mech pauldrons with glow strips."],
  ["c_sh_gold", "Gold Epaulettes", 450, null, "", "Shoulders. Gold epaulettes with fringe."],
  ["c_sh_bone", "Bone Pauldrons", 450, null, "", "Shoulders. Pauldrons carved from bone."],
  ["c_arm_neon", "Neon Arm", 500, null, "", "Arm. A translucent arm lit from inside."],
  ["c_arm_bone", "Bone Arm", 500, null, "", "Arm. A skeletal bone-white arm."],
  ["c_arm_void", "Void Arm", 500, null, "", "Arm. A matte black arm that eats the light."],
  ["c_boot_rocket", "Rocket Boots", 400, null, "", "Boots. Thrusters in the soles."],
  ["c_boot_gold", "Gold Boots", 400, null, "", "Boots. Solid gold boots."],
  ["c_skin_chrome", "Chrome Skin", 450, null, "", "Skin. Full chrome skin."],
  ["c_skin_ghost", "Pale Ghost", 450, null, "", "Skin. Pale blue, nearly translucent."],
  ["c_skin_demon", "Infernal", 450, null, "", "Skin. Red skin from a black-market graft."],
  ["c_skin_holo", "Hologram", 450, s => s.dashes >= 200, "Dash 200 times", "Skin. A projected hologram body."],
  ["c_face_glitch", "Face Glitch", 250, null, "", "Face. Your face flickers out of sync."],
  ["c_face_stitch", "Stitches", 250, null, "", "Face. Stitched mouth."],
  ["c_face_grill", "Gold Grill", 250, null, "", "Face. A gold grill."],
  ["c_hair_flame", "Flame Hair", 400, null, "", "Hair. Hair with burning tips."],
  ["c_hair_wild", "Wild Spikes", 400, null, "", "Hair. Spikes that defy the rain."],
  ["c_hair_crystal", "Crystal Cut", 400, null, "", "Hair. Hair with glowing crystal shards."],
  ["c_hc_gold", "Gold", 200, null, "", "Hair colour. Gold."],
  ["c_hc_fire", "Fire", 200, null, "", "Hair colour. Fire."],
  ["c_hc_void", "Void", 200, null, "", "Hair colour. Void."],
  ["c_hc_neon", "Neon Mint", 200, null, "", "Hair colour. Neon Mint."],
  ["c_hc_rose", "Rose", 200, null, "", "Hair colour. Rose."],
  ["c_hat_crown", "Gold Crown", 700, s => s.kills >= 1000, "Get 1000 kills in total", "Headwear. Heavy is the head."],
  ["c_hat_halo", "Halo", 500, s => s.ocCount >= 20, "Use Overclock 20 times", "Headwear. A ring of light that follows you."],
  ["c_hat_top", "Top Hat", 500, null, "", "Headwear. Tall, black and absurd."],
  ["c_hat_cat", "Neon Cat Ears", 500, null, "", "Headwear. Glowing ears with your optics colour."],
  ["c_hat_helm", "Full Helmet", 500, null, "", "Headwear. Full helmet, glowing visor, no face."],
  ["c_hat_cowl", "Bat Cowl", 500, null, "", "Headwear. Pointed ears. Brooding sold separately."],
  ["c_eye_crt", "Crt Face", 450, null, "", "Eyes. Your face is an old monitor."],
  ["c_eye_laser", "Laser Sight", 450, s => s.kills >= 300, "Get 300 kills in total", "Eyes. A red sight line from your eye."],
  ["c_eye_plague", "Plague Beak", 450, null, "", "Eyes. A beaked plague-doctor mask."],
  ["c_eye_gas", "Gas Mask", 450, null, "", "Eyes. Twin-lens gas mask with filter."],
  ["c_eye_star", "Star Eyes", 450, null, "", "Eyes. Star-shaped optics."],
  ["c_eye_hockey", "Hockey Mask", 450, null, "", "Eyes. White mask, red marks, bad intentions."],
  ["c_glow_blood", "Blood", 250, null, "", "Glow colour. Blood."],
  ["c_glow_toxic", "Toxic", 250, null, "", "Glow colour. Toxic."],
  ["c_glow_sunset", "Sunset", 250, null, "", "Glow colour. Sunset."],
  ["c_glow_void", "Void", 250, null, "", "Glow colour. Void."],
  ["c_glow_rose", "Rose", 250, null, "", "Glow colour. Rose."],
  ["c_back_jet", "Jetpack", 650, null, "", "On your back. Twin thrusters. Purely for show. Mostly."],
  ["c_back_angel", "Angel Wings", 850, null, "", "On your back. White wings, for irony."],
  ["c_back_crow", "Crow Wings", 850, s => (s.byType.corvid || 0) >= 100, "Kill 100 Corvids", "On your back. Wide black wings, cut from a Murder rig."],
  ["c_back_banner", "War Banner", 650, null, "", "On your back. Your own flag over the rain."],
  ["c_back_spider", "Spider Arms", 650, s => s.hackKills >= 25, "Kill 25 enemies with hacks", "On your back. Four chrome legs folded behind you."],
  ["c_ex_cat", "Pet Cat", 550, null, "", "Extra. A black cat with glowing eyes at your heel."],
  ["c_ex_orbs", "Orbiting Orbs", 550, null, "", "Extra. Little lights circling you."],
  ["c_ex_lantern", "Spirit Lantern", 550, null, "", "Extra. A floating lantern with a spirit in it."],
  ["c_ex_wisp", "Ghost Wisp", 550, null, "", "Extra. A ghost-light over your shoulder."],
  ["c_tr_rainbow", "Rainbow", 550, s => s.heatMax >= 5, "Reach Heat 5", "Afterimage. Every colour at once."],
  ["c_tr_fire", "Fire", 350, null, "", "Afterimage. Fire."],
  ["c_tr_ice", "Ice", 350, null, "", "Afterimage. Ice."],
  ["c_tr_void", "Void", 350, null, "", "Afterimage. Void."],
  ["c_tr_toxic", "Toxic", 350, null, "", "Afterimage. Toxic."],
  ["c_gun_chrome", "Chrome", 300, null, "", "Gun finish. Chrome."],
  ["c_gun_pink", "Hot Pink", 300, null, "", "Gun finish. Hot Pink."],
  ["c_gun_holo", "Holo", 300, null, "", "Gun finish. Holo."], ["c_crown", "Augur's Halo", 700, s => (s.byType.augur || 0) >= 1, "Defeat THE AUGUR", "Extra. The Augur's data halo, now orbiting you."],
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
  MAT.parm = { gold: GOLD, carbon: CARBON, red: ramp("#8a2030"), white: ramp("#b8b4c8"), neonarm: ramp("#2a9ab8"), bonearm: MAT.bone, voidarm: ["#030305", "#08080c", "#101016", "#1c1c26"] }[L.arm] || MAT.chrome;
  MAT.pgun = { carbon: CARBON, gold: GOLD, white: ramp("#b8b4c8"), red: ramp("#8a2030"), chromefin: MAT.chrome, pink: ramp("#c82a8a"), holo: ramp("#2a9ab8") }[L.gun] || MAT.gun;
  MAT.ppants = ramp(optOf(L, "legs")[3]); MAT.pboot = { chrome: MAT.chrome, sneakers: MAT.bone, goldboots: GOLD }[L.boots] || MAT.boot; MAT.poni = ramp("#8a1a22"); MAT.pgold = GOLD;
  const g = optOf(L, "glow")[3]; MAT.pglow = { e: g, core: mix(g, "#ffffff", .7) }; MAT.pneon = { e: COL.magenta, core: "#ffc2dc" };
  return g;
}
const trailColors = L => { const g = optOf(L, "glow")[3]; return L.trail === "glitch" ? [COL.magenta, COL.cyan, "#ffffff"] : L.trail === "rainbow" ? ["#ff3d3d", COL.amber, "#ffd23a", "#3dff7a", COL.cyan, "#b06cff"] : L.trail === "fire" ? ["#ff7a1a", "#ff3d3d", "#ffd23a"] : [L.trail === "glow" ? g : optOf(L, "trail")[3]]; };
const Ln = L; // the engine's line helper (inside playerDef, L is the look)
function playerDef(o, L) {
  L = Object.assign({}, DEFAULT_LOOK, L);
  const b = o.bob || 0, la = o.la || 0, ra = o.ra || 0, U = y => y + b, P = [], cs = L.coat, armR = !["none", "left"].includes(L.arm), armL = ["both", "left"].includes(L.arm);
  const bare = ["vest", "tactical", "tank"].includes(cs), collar = ["long", "jacket", "trench", "duster", "bomber", "feather", "neoncoat", "royal"].includes(cs), hooded = cs === "cloak" || L.head === "hood", noHair = hooded || L.head === "helmet" || L.head === "cowl";
  // Behind the body
  if (L.back === "cape") P.push(Pl("plin", [[6, U(13)], [18, U(13)], [22, 31], [12, 32], [2, 31]]));
  if (L.back === "wings") { const w = [[9, U(15)], [3, U(7)], [0, U(12)], [1, U(21)], [5, U(25)], [9, U(20)]]; P.push(Pl("wing", w), Pl("wing", mirror(24, w)), Px("pglow", [[3, U(8)], [0, U(13)], [21, U(8)], [24, U(13)]])); }
  if (L.back === "katana") P.push(Ln("chrome", 2, U(28), 16, U(11)), Ln("chrome", 3, U(28), 17, U(11)), Ln("plin", 17, U(10), 21, U(5)), Ln("plin", 18, U(10), 22, U(5)), Px("chrome", [[16, U(10)], [17, U(11)], [18, U(11)]]), Px("pglow", [[22, U(4)]]));
  if (L.back === "pack") P.push(R("armor", 1, U(13), 7, 10), R("pgun", 1, U(17), 7, 1), Px("pglow", [[2, U(20)], [3, U(20)]]), Px("plin", [[2, U(14)], [3, U(14)]]));
  if (L.back === "jetpack") P.push(R("armor", 1, U(14), 6, 9), R("chrome", 2, U(15), 2, 7), Px("ambE", [[2, U(23)], [3, U(23)], [2, U(24)]]), Px("redE", [[3, U(25)]]));
  if (L.back === "angel" || L.back === "crowwings") { const w = L.back === "angel" ? [[9, U(15)], [3, U(7)], [0, U(12)], [1, U(21)], [5, U(25)], [9, U(20)]] : [[9, U(14)], [2, U(4)], [0, U(10)], [0, U(21)], [3, U(28)], [7, U(24)], [9, U(20)]], m = L.back === "angel" ? "bone" : "wing";
    P.push(Pl(m, w), Pl(m, mirror(24, w))); if (L.back === "crowwings") P.push(Px("redE", [[2, U(5)], [22, U(5)]])); }
  if (L.back === "banner") P.push(Ln("pgun", 4, U(0), 4, U(26)), Pl("plin", [[4, U(1)], [0, U(1)], [0, U(9)], [2, U(7)], [4, U(9)]]), Px("pglow", [[2, U(4)]]));
  if (L.back === "spider") P.push(Ln("chrome", 8, U(16), 1, U(9)), Ln("chrome", 1, U(9), 0, U(21)), Ln("chrome", 16, U(16), 23, U(9)), Ln("chrome", 23, U(9), 24, U(21)), Px("pglow", [[1, U(9)], [23, U(9)]]));
  if (L.back === "tanks") P.push(E("chrome", 4, U(17), 2, 4.5), E("chrome", 20, U(17), 2, 4.5), Px("pglow", [[4, U(13)], [20, U(13)]]));
  // Coat tails
  if (cs === "feather") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [21, 27], [19, 30], [17, 27], [15, 31], [13, 27], [11, 31], [9, 27], [7, 30], [3, 27]]), Px("wing", [[19, 30], [15, 31], [11, 31], [7, 30]]));
  if (cs === "plate") P.push(Pl("pcoat", [[7, U(23)], [17, U(23)], [18, 27], [6, 27]]), Ln("chrome", 6, 27, 18, 27));
  if (cs === "long" || cs === "neoncoat" || cs === "royal") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [21, 29], [17, 30], [12, 26], [7, 30], [3, 29]]), Pl("plin", [[10, 22], [14, 22], [15, 27], [12, 25.5], [9, 27]]));
  if (cs === "neoncoat") P.push(Ln("pglow", 6, U(15), 3, 29), Ln("pglow", 18, U(15), 21, 29), Px("pglow", [[7, 30], [17, 30], [12, 26]]));
  if (cs === "royal") P.push(Ln("pgold", 6, U(15), 3, 29), Ln("pgold", 18, U(15), 21, 29));
  if (cs === "trench") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [22, 30], [17, 31], [12, 27], [7, 31], [2, 30]]), Pl("plin", [[10, 22], [14, 22], [15, 28], [12, 26], [9, 28]]));
  if (cs === "duster") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [21, 31], [16, 31], [13, 25], [11, 25], [8, 31], [3, 31]]));
  if (cs === "jacket") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [19, U(24)], [5, U(24)]]));
  if (cs === "bomber") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [18, U(22)], [6, U(22)]]), R("plin", 6, U(22), 12, 1));
  if (cs === "cloak") P.push(Pl("pcoat", [[4, U(11)], [20, U(11)], [24, 30], [18, 29], [12, 31], [6, 29], [0, 30]]), Pl("plin", [[9, U(20)], [15, U(20)], [16, 29], [12, 30], [8, 29]]));
  // Legs and boots
  const knee = L.boots === "knee" ? 2 : 0;
  P.push(R("ppants", 9, 24, 3, 5 + la), R("ppants", 14, 24, 3, 5 + ra), R("pboot", 8, 28 + la - knee, 4, 3 + knee), R("pboot", 14, 28 + ra - knee, 4, 3 + knee));
  if (L.boots === "glow") P.push(R("pglow", 8, 30 + la, 4, 1), R("pglow", 14, 30 + ra, 4, 1));
  if (L.boots === "rocket") P.push(Px("ambE", [[9, 31 + la], [10, 31 + la], [15, 31 + ra], [16, 31 + ra]]), Px("redE", [[9, 32], [16, 32]]));
  if (L.boots === "sneakers") P.push(Px("pglow", [[9, 29 + la], [15, 29 + ra]]));
  if (cs === "robe") P.push(Pl("pcoat", [[6, U(14)], [18, U(14)], [19, 29], [5, 29]]), R("plin", 11, U(24), 2, 5));
  // Torso
  if (cs === "cloak") P.push(Pl("pcoat", [[6, U(12)], [18, U(12)], [19, U(25)], [12, U(26)], [5, U(25)]]));
  else if (cs === "vest" || cs === "tactical") P.push(Pl("pcoat", [[8, U(13)], [16, U(13)], [16, U(23)], [8, U(23)]]), E("pcoat", 7.5, U(14), 2.4, 1.7), E("pcoat", 16.5, U(14), 2.4, 1.7));
  else if (cs === "tank") P.push(Pl("pcoat", [[8, U(14)], [16, U(14)], [16, U(23)], [8, U(23)]]), Px("pcoat", [[9, U(13)], [15, U(13)]]));
  else P.push(Pl("pcoat", [[7, U(13)], [17, U(13)], [17, U(23)], [12, U(24)], [7, U(23)]]));
  if (cs === "plate") P.push(Ln("chrome", 7, U(13), 17, U(13)), Ln("chrome", 7, U(18), 17, U(18)), Px("pglow", [[9, U(16)], [15, U(16)]]));
  if (cs === "royal") P.push(Px("pgold", [[10, U(15)], [10, U(18)], [14, U(15)], [14, U(18)]]));
  if (cs === "tactical") P.push(R("armor", 8, U(18), 3, 3), R("armor", 13, U(18), 3, 3), Px("pglow", [[9, U(19)], [14, U(19)]]));
  if (cs !== "tank") P.push(R("armor", 11, U(14), 3, 8));
  if (cs === "robe") P.push(Pl("plin", [[10, U(13)], [14, U(13)], [12, U(18)]]), R("plin", 7, U(20), 10, 2));
  // Pattern
  const pat = { stripe: [R("plin", 8, U(14), 2, 9)], chevron: [Px("plin", [[8, U(16)], [9, U(17)], [10, U(16)], [8, U(19)], [9, U(20)], [10, U(19)], [14, U(16)], [15, U(17)], [16, U(16)]])],
    circuit: [Px("pglow", [[8, U(15)], [9, U(15)], [9, U(16)], [9, U(17)], [15, U(17)], [16, U(17)], [15, U(18)], [15, U(19)], [8, U(20)], [9, U(20)]])],
    hazard: [R("hazard", 7, U(19), 10, 2), Px("pgun", [[8, U(19)], [9, U(20)], [11, U(19)], [12, U(20)], [14, U(19)], [15, U(20)]])],
    camo: [Px("plin", [[8, U(14)], [9, U(14)], [9, U(15)], [15, U(16)], [16, U(16)], [16, U(17)], [8, U(19)], [9, U(20)], [15, U(21)], [14, U(21)]])],
    studs: [Px("chrome", [[8, U(14)], [9, U(16)], [8, U(18)], [16, U(14)], [15, U(16)], [16, U(18)]])],
    neon: [Px("pglow", [[7, U(13)], [7, U(16)], [7, U(19)], [7, U(22)], [17, U(13)], [17, U(16)], [17, U(19)], [17, U(22)]])],
    flames: [Px("redE", [[8, U(22)], [10, U(21)], [14, U(22)], [16, U(21)]]), Px("ambE", [[9, U(21)], [9, U(20)], [15, U(20)], [15, U(21)], [8, U(21)]])],
    skull: [Px("bone", [[14, U(15)], [15, U(15)], [16, U(15)], [14, U(16)], [16, U(16)], [15, U(17)]]), Px("pgun", [[15, U(16)]])],
    tiger: [Px("pgun", [[8, U(14)], [9, U(15)], [8, U(18)], [9, U(19)], [16, U(14)], [15, U(15)], [16, U(18)], [15, U(19)], [8, U(21)], [16, U(21)]])],
    glitch: [Px("magE", [[8, U(15)], [15, U(17)], [9, U(20)], [16, U(14)]]), Px("cyanE", [[9, U(15)], [16, U(17)], [10, U(20)], [8, U(18)]])],
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
  if (L.shoulder === "mech") P.push(S_(E("armor", 5.5, U(14), 3.5, 2.6)), S_(E("armor", 18, U(14), 3.5, 2.6)), Px("pglow", [[5, U(14)], [18, U(14)]]));
  if (L.shoulder === "epaulettes") P.push(E("pgold", 6, U(13.5), 2.6, 1.4), E("pgold", 17.5, U(13.5), 2.6, 1.4), Px("pgold", [[4, U(15)], [6, U(15)], [16, U(15)], [19, U(15)]]));
  if (L.shoulder === "bone") { const f = [[3, U(15)], [6, U(11)], [9, U(14)], [6, U(16)]]; P.push(Pl("bone", f), Pl("bone", mirror(24, f)), Px("pgun", [[6, U(13)], [18, U(13)]])); }
  if (L.shoulder === "fur") P.push(E("plin", 12, U(13), 7, 2));
  if (L.shoulder === "plate") P.push(S_(E("chrome", 17.5, U(14), 3, 2)), Px("pglow", [[18, U(14)]]));
  if (L.extra === "scarf") P.push(S_(Pl("plin", [[7, U(12)], [17, U(12)], [17, U(15)], [14, U(15)], [15, U(20)], [12, U(20)], [12, U(15)], [7, U(15)]])));
  // Head
  if (L.hair === "afro" && !noHair) P.push(E("phair", 12, U(6), 6.5, 5.5));
  if (["long", "braids", "dreads"].includes(L.hair) && !noHair) P.push(Pl("phair", [[7, U(8)], [17, U(8)], [18, U(15)], [6, U(15)]]));
  P.push(E("pskin", 12, U(8.5), 4.5, 4.5));
  const face = { scar: [Ln("rust", 14, U(6), 15, U(12))], tattoo: [Px("pglow", [[9, U(11)], [9, U(12)], [15, U(11)], [15, U(12)], [12, U(5)]])], freckles: [Px("rust", [[9, U(11)], [10, U(10)], [14, U(10)], [15, U(11)]])],
    paint: [R("pgun", 8, U(10), 9, 1)], chrome: [R("chrome", 14, U(10), 3, 2), Px("pglow", [[15, U(10)]])], barcode: [Px("pgun", [[14, U(11)], [15, U(11)], [16, U(11)], [14, U(12)], [16, U(12)]])],
    glitchface: [Px("magE", [[9, U(10)], [14, U(7)], [16, U(11)]]), Px("cyanE", [[10, U(10)], [15, U(7)], [8, U(11)]])],
    stitches: [Ln("pgun", 9, U(12), 15, U(12)), Px("pgun", [[10, U(11)], [12, U(11)], [14, U(11)], [10, U(13)], [12, U(13)], [14, U(13)]])], grill: [R("pgold", 10, U(12), 4, 1)],
    beard: [Pl("phair", [[8, U(10)], [16, U(10)], [15, U(13)], [12, U(14)], [9, U(13)]])], lips: [R("pglow", 11, U(12), 3, 1)] }[L.face];
  if (face) P.push(...face);
  const bob = Pl("phair", [[7, U(8)], [8, U(4)], [11, U(2.5)], [15, U(3)], [17, U(6)], [17.5, U(11)], [16, U(13)], [15, U(9)], [10, U(7)], [8, U(10)], [7, U(12)]]);
  const buzz = Pl("phair", [[8, U(7)], [9, U(4)], [12, U(3)], [15, U(4)], [16, U(7)], [15, U(6)], [9, U(6)]]);
  if (cs === "cloak" || L.head === "hood") P.push(Pl("pcoat", [[6, U(10)], [7, U(4)], [12, U(1)], [17, U(4)], [18, U(10)], [17, U(14)], [16, U(8)], [8, U(8)], [7, U(14)]]));
  else if (!noHair) {
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
      flame: [Pl("phair", [[7, U(8)], [7, U(4)], [9, U(2)], [10, U(4)], [12, U(0)], [13, U(3)], [15, U(1)], [16, U(4)], [17, U(8)]]), Px("ambE", [[9, U(2)], [12, U(0)], [15, U(1)]]), Px("redE", [[10, U(3)], [13, U(2)]])],
      wild: [Pl("phair", [[6, U(8)], [2, U(4)], [8, U(4)], [8, U(0)], [11, U(3)], [13, U(0)], [15, U(3)], [18, U(0)], [17, U(4)], [22, U(4)], [18, U(8)]])],
      crystal: [bob, Pl("chrome", [[10, U(3)], [11, U(0)], [12, U(3)]]), Pl("chrome", [[14, U(4)], [16, U(1)], [16, U(5)]]), Px("pglow", [[9, U(4)], [11, U(1)], [16, U(2)], [16, U(6)]])],
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
    crown: [Pl("pgold", [[8, U(4)], [8, U(1)], [10, U(2.5)], [12, U(0)], [14, U(2.5)], [16, U(1)], [16, U(4)]]), Px("redE", [[12, U(3)]])],
    halo: [Px("pglow", [[8, U(1)], [9, U(0)], [10, U(0)], [11, U(0)], [12, U(0)], [13, U(0)], [14, U(0)], [15, U(0)], [16, U(1)], [9, U(2)], [15, U(2)], [10, U(2)], [14, U(2)]])],
    tophat: [R("pgun", 9, U(0), 7, 5), R("pgun", 7, U(5), 11, 1), R("plin", 9, U(4), 7, 1)],
    catears: [Pl("pgun", [[7, U(6)], [8, U(1)], [11, U(4)]]), Pl("pgun", [[17, U(6)], [16, U(1)], [13, U(4)]]), Px("pglow", [[8, U(3)], [16, U(3)]])],
    helmet: [E("armor", 12, U(7.5), 5.2, 5.2), R("pglow", 8, U(8), 9, 2), Px("chrome", [[12, U(3)], [11, U(3)], [13, U(3)]])],
    cowl: [Pl("pgun", [[7, U(11)], [7, U(4)], [8, U(0)], [10, U(3)], [14, U(3)], [16, U(0)], [17, U(4)], [17, U(11)], [16, U(8)], [8, U(8)]])],
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
    crt: [R("pgun", 7, U(5), 11, 8), R("armor", 8, U(6), 9, 6), Px("pglow", [[10, U(8)], [14, U(8)], [10, U(10)], [11, U(11)], [12, U(11)], [13, U(11)], [14, U(10)]])],
    laser: [eye2, Ln("redE", 15, U(9), 25, U(9))],
    plague: [Pl("pgun", [[8, U(7)], [16, U(7)], [16, U(10)], [22, U(13)], [14, U(12)], [8, U(11)]]), Px("pglow", [[10, U(8)], [14, U(8)]])],
    gasmask: [Pl("armor", [[8, U(7)], [16, U(7)], [16, U(12)], [12, U(14)], [8, U(12)]]), Px("pglow", [[10, U(9)], [14, U(9)]]), R("pgun", 11, U(12), 3, 3), Px("chrome", [[11, U(13)], [13, U(13)]])],
    stars: [Px("pglow", [[10, U(8)], [9, U(9)], [10, U(9)], [11, U(9)], [10, U(10)], [14, U(8)], [13, U(9)], [14, U(9)], [15, U(9)], [14, U(10)]])],
    hockey: [Pl("bone", [[8, U(5)], [16, U(5)], [16, U(12)], [12, U(14)], [8, U(12)]]), Px("pgun", [[10, U(8)], [14, U(8)], [11, U(11)], [13, U(11)], [12, U(12)]]), Px("redE", [[12, U(6)], [9, U(7)], [15, U(7)]])],
    mask: [Pl("chrome", [[8, U(10)], [16, U(10)], [15, U(13)], [12, U(14)], [9, U(13)]]), eye2],
    scarecrow: [Pl("rust", [[7.5, U(5)], [16.5, U(5)], [16, U(13)], [12, U(14)], [8, U(13)]]), Px("redE", [[9, U(9)], [10, U(9)], [14, U(9)], [15, U(9)]]), Px("bone", [[10, U(12)], [12, U(12)], [14, U(12)]])],
    trophy: [Pl("bone", [[8.5, U(7)], [15.5, U(7)], [14, U(11)], [12, U(15)], [10, U(11)]]), Px("pglow", [[10, U(8)], [13, U(8)]])] }[L.eyes] || [eye2];
  P.push(...EY);
  if (!noHair && L.head === "none" && ["bob", "long", "ponytail", "fringe", "braids", "pigtails"].includes(L.hair)) P.push(Px("pglow", [[14, U(4)], [15, U(5)], [16, U(7)]]));
  // Extras on top
  if (L.extra === "crown") P.push(Px("pglow", [[7, U(2)], [8, U(0)], [10, U(0)], [12, U(0)], [14, U(0)], [16, U(0)], [17, U(2)]]));
  if (L.extra === "crow") P.push(E("wing", 5, U(11), 2.6, 1.8), E("wing", 4, U(9), 1.6, 1.4), Px("bone", [[2, U(9)]]), Px("redE", [[4, U(9)]]), Px("wing", [[7, U(12)], [8, U(13)]]));
  if (L.extra === "cat") P.push(Ln("pgun", 5, 30, 6, 26), E("pgun", 3, 30, 2.5, 1.6), E("pgun", 1.5, 28, 1.5, 1.4), Px("pgun", [[0, 26], [2, 26]]), Px("pglow", [[1, 28]]));
  if (L.extra === "orbs") P.push(E("pglow", 1.5, U(12), 1, 1), E("pglow", 22.5, U(7), 1, 1), E("pglow", 23, U(23), 1, 1), E("pglow", 1.5, U(25), 1, 1));
  if (L.extra === "lantern") P.push(Ln("chrome", 2, U(13), 2, U(16)), R("pgun", 1, U(16), 3, 1), R("ambE", 1, U(17), 3, 3), R("pgun", 1, U(20), 3, 1));
  if (L.extra === "wisp") P.push(E("pglow", 21, U(5), 1.8, 1.8), Px("pglow", [[23, U(7)], [24, U(8)]]));
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
