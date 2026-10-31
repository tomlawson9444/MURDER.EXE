/* Loadout, Magpie's stock, scrip, milestones and the save file. */
"use strict";
const GUNS = {
  kestrel: { name: "KESTREL .44", mag: 6, reload: 1.1, cd: .11, speed: 760, pellets: 1, spread: 0, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel" },
  breacher: { name: "BREACHER CUSTOM", mag: 4, reload: 1.3, cd: .3, speed: 620, pellets: 5, spread: .3, pierce: 0, bounce: 0, life: .24, sfx: "kestrel", kick: 3.5 },
  coil: { name: "RICOCHET COILGUN", mag: 5, reload: 1.2, cd: .14, speed: 600, pellets: 1, spread: 0, pierce: 0, bounce: 2, life: 2.5, sfx: "kestrel" },
  hornet: { name: "HORNET SMG", mag: 16, reload: 1.4, cd: .065, speed: 700, pellets: 1, spread: .09, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel", auto: true },
  rail: { name: "RAILPIERCER", mag: 3, reload: 1.5, cd: .35, speed: 1150, pellets: 1, spread: 0, pierce: 3, bounce: 0, life: 2.5, sfx: "rail", kick: 4 },
  // Magpie's wider stock.
  duster: { name: "DUSTER DOUBLE", mag: 2, reload: 1.2, cd: .2, speed: 600, pellets: 8, spread: .38, pierce: 0, bounce: 0, life: .22, sfx: "kestrel", kick: 5 },
  needler: { name: "NEEDLER", mag: 24, reload: 1.3, cd: .075, speed: 900, pellets: 1, spread: .05, pierce: 1, bounce: 0, life: .55, sfx: "kestrel", auto: true, col: "#9dff4a" },
  tripletap: { name: "TRIPLE-TAP", mag: 4, reload: 1.1, cd: .34, speed: 780, pellets: 1, spread: .02, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel", burst: 3 },
  pipe: { name: "PIPE LAUNCHER", mag: 3, reload: 1.5, cd: .5, speed: 380, pellets: 1, spread: 0, pierce: 0, bounce: 0, life: 2, sfx: "rail", kick: 4, blast: 30, col: "#ffb22e", big: 1 },
  arccaster: { name: "ARC CASTER", mag: 5, reload: 1.2, cd: .2, speed: 700, pellets: 1, spread: 0, pierce: 0, bounce: 0, life: 2.5, sfx: "rail", arc: 2, col: "#ff2d8a" },
  cryo: { name: "CRYO PISTOL", mag: 6, reload: 1.1, cd: .14, speed: 720, pellets: 1, spread: 0, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel", freeze: 44, col: "#9ff3ff" },
  pinball: { name: "PINBALL SMG", mag: 20, reload: 1.4, cd: .08, speed: 520, pellets: 1, spread: .08, pierce: 0, bounce: 3, life: 1.6, sfx: "kestrel", auto: true, col: "#ff7ad9" },
  magnum: { name: "SAINT'S MAGNUM", mag: 6, reload: 1.2, cd: .2, speed: 1000, pellets: 1, spread: 0, pierce: 1, bounce: 0, life: 2.5, sfx: "rail", kick: 3, vamp: 1 },
  longbow: { name: "LONGBOW", mag: 1, reload: .9, cd: .3, speed: 1600, pellets: 1, spread: 0, pierce: 6, bounce: 0, life: 2.5, sfx: "rail", kick: 6, big: 1, col: "#e8f6ff" },
  fanhammer: { name: "FAN HAMMER", mag: 6, reload: 1, cd: .05, speed: 740, pellets: 1, spread: .12, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel", auto: true },
  splitter: { name: "SPLITTER", mag: 5, reload: 1.2, cd: .22, speed: 640, pellets: 1, spread: 0, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel", split: .14, col: "#b06cff" },
  wisp: { name: "WISP LAUNCHER", mag: 4, reload: 1.4, cd: .35, speed: 180, pellets: 1, spread: 0, pierce: 2, bounce: 0, life: 3.2, sfx: "rail", homing: 1, col: "#9ff3ff", big: 1 },
  // Act reward weapons: never sold.
  harpoon: { name: "FERRYMAN'S HARPOON", mag: 2, reload: 1.3, cd: .4, speed: 540, pellets: 1, spread: 0, pierce: 99, bounce: 0, life: 2.5, sfx: "rail", kick: 5, col: "#ffb22e", big: 1 },
  bellows: { name: "CINDER'S BELLOWS", mag: 40, reload: 1.6, cd: .045, speed: 330, pellets: 2, spread: .2, pierce: 1, bounce: 0, life: .32, sfx: "kestrel", auto: true, col: "#ff7a1a" },
  repeater: { name: "ARCHIVE REPEATER", mag: 8, reload: 1.2, cd: .16, speed: 760, pellets: 1, spread: 0, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel", echo: .18 },
  wasp: { name: "VANE'S WASP", mag: 6, reload: 1.4, cd: .3, speed: 300, pellets: 3, spread: .35, pierce: 0, bounce: 0, life: 2.2, sfx: "rail", homing: 1, col: "#ffb22e" },
  requiem: { name: "CORVINA'S REQUIEM", mag: 7, reload: 1.1, cd: .12, speed: 800, pellets: 1, spread: 0, pierce: 0, bounce: 1, life: 2.5, sfx: "kestrel", feathers: 6, col: "#ff3d3d" },
};
const OCP = { deadlink: { locks: 6 }, arc: { locks: 3 }, swarm: { locks: 4 }, ghost: { locks: 5 }, crown: { locks: 8 }, nova: { locks: 3 }, hydra: { locks: 2 }, leech: { locks: 5 }, blackout: { locks: 6 }, mirror: { locks: 5 }, reaper: { locks: 6 }, bastion: { locks: 4 } };
const it = (id, cat, name, price, req, reqText, desc, stats = []) => ({ id, cat, name, price, req, reqText, desc, stats });
const ITEMS = [
  it("kestrel", "gun", "Kestrel .44", 0, null, "", "Your smart revolver. Accurate, reliable, six rounds.", ["MAG 6", "RELOAD 1.1S", "FAST TRAVEL"]),
  it("breacher", "gun", "Breacher Custom", 450, null, "", "Five-pellet scatter shot. Brutal up close, useless at range.", ["MAG 4", "5 PELLETS", "SHORT RANGE"]),
  it("coil", "gun", "Ricochet Coilgun", 500, s => s.kills >= 150, "Get 150 kills in total", "Rounds bounce off walls twice. Hit Bulwarks from behind.", ["MAG 5", "2 BOUNCES", "RELOAD 1.2S"]),
  it("hornet", "gun", "Hornet SMG", 750, s => s.heatMax >= 5, "Reach Heat 5", "Sixteen-round auto. Hold the trigger and spray.", ["MAG 16", "FULL AUTO", "SPREAD"]),
  it("rail", "gun", "Railpiercer", 900, s => !!s.clears.market, "Clear the Rain Market", "Three slugs. Each one punches through three bodies.", ["MAG 3", "PIERCES 3", "RELOAD 1.5S"]),
  it("deadlink", "oc", "DEADLINK.sys", 0, null, "", "Slow time, lock up to six targets, fire every round at once. Full reload.", ["6 LOCKS"]),
  it("arc", "oc", "ARC//CHAIN", 500, s => s.hackKills >= 10, "Kill 10 enemies with hacks", "Only three locks, but every kill arcs into two more enemies.", ["3 LOCKS", "CHAINS x2"]),
  it("swarm", "oc", "SWARMKEY", 650, s => s.blastMulti >= 3, "Kill 3 enemies with one explosion", "Every locked target's implants detonate. You are not immune to the blast.", ["4 LOCKS", "DETONATE"]),
  it("ghost", "oc", "GHOST_PROTOCOL", 800, s => !!s.clears.rookery, "Clear the Chrome Rookery", "Kill five locks, then blink to where the last one stood.", ["5 LOCKS", "TELEPORT"]),
  it("reflex", "imp", "Reflex Splice", 300, null, "", "Dash recharges 30% faster but covers 15% less ground.", ["DASH CD -30%", "DASH -15%"]),
  it("deck", "imp", "Expanded Deck", 300, null, "", "Cyberdeck upgrade. Holds 9 RAM instead of 6.", ["RAM 9"]),
  it("graze", "imp", "Graze Coil", 350, s => s.grazes >= 25, "Graze 25 bullets", "Near-misses charge Overclock twice as fast. Your hitbox grows by a pixel.", ["GRAZE x2", "HITBOX +1"]),
  it("prism", "imp", "Prism Optics", 400, s => (s.byType.jackdaw || 0) >= 10, "Kill 10 Jackdaws", "Enemy tells last 35% longer. You see it coming.", ["TELLS +35%"]),
  it("trigger", "imp", "Trigger Daemon", 400, s => (s.byType.shrike || 0) >= 30, "Kill 30 Shrikes", "The last round in every magazine pierces two enemies.", ["LAST ROUND PIERCES"]),
  it("overdrive", "imp", "Overdrive Heart", 450, s => s.falls >= 5, "Knock 5 enemies into the chasm", "+5% speed for every 10-kill streak. Stand still for 2 seconds and it resets.", ["SPEED UP TO +25%"]),
  it("redline", "imp", "Redline Cache", 600, s => s.ocCount >= 15, "Use Overclock 15 times", "Overclock holds three charges, but the meter slowly drains.", ["3 OC CHARGES", "DRAINS"]),
  it("backup", "imp", "Backup Ego", 1200, s => !!s.clears.rookery, "Clear the Chrome Rookery", "Flatline once and come back. Your score multiplier is halved after.", ["1 REVIVE / RUN"]),
  // Act rewards: never sold. Each one is earned by finishing an act of the story, then works in the story and in Arcade.
  it("duster", "gun", "Duster Double", 650, null, "", "Two barrels, eight pellets each. Clears a doorway in one pull.", ["MAG 2", "8 PELLETS", "SHORT RANGE"]),
  it("fanhammer", "gun", "Fan Hammer", 550, null, "", "A revolver you fan with your palm. Hold to empty it in a blink.", ["MAG 6", "FULL AUTO", "WILD SPREAD"]),
  it("tripletap", "gun", "Triple-Tap", 600, null, "", "Every pull fires a tight three-round burst.", ["4 BURSTS", "3 ROUNDS", "ACCURATE"]),
  it("needler", "gun", "Needler", 700, s => s.kills >= 250, "Get 250 kills in total", "Full-auto flechettes that pass through one body. Short reach.", ["MAG 24", "PIERCES 1", "MID RANGE"]),
  it("cryo", "gun", "Cryo Pistol", 750, s => s.grazes >= 40, "Graze 40 bullets", "Every kill flash-freezes enemies around it for two seconds.", ["MAG 6", "KILLS FREEZE", "STUN 2S"]),
  it("magnum", "gun", "Saint's Magnum", 800, s => (s.byType.rook || 0) >= 40, "Kill 40 Rooks", "Heavy rounds that pierce once. Every kill puts a round back in the cylinder.", ["MAG 6", "KILLS REFUND", "PIERCES 1"]),
  it("arccaster", "gun", "Arc Caster", 850, s => s.hackKills >= 20, "Kill 20 enemies with hacks", "Kills arc into the two nearest enemies.", ["MAG 5", "CHAINS x2", "ACT LIKE A HACK"]),
  it("splitter", "gun", "Splitter", 900, s => s.kills >= 600, "Get 600 kills in total", "Each round splits into three a moment after it leaves the barrel.", ["MAG 5", "SPLITS x3", "MID RANGE"]),
  it("pinball", "gun", "Pinball SMG", 950, s => s.kills >= 500, "Get 500 kills in total", "Full-auto rounds that bounce off walls three times.", ["MAG 20", "3 BOUNCES", "FULL AUTO"]),
  it("longbow", "gun", "Longbow", 1000, s => s.heatMax >= 4, "Reach Heat 4", "One shot per load. It goes through six bodies and the far wall's patience.", ["MAG 1", "PIERCES 6", "FAST RELOAD"]),
  it("pipe", "gun", "Pipe Launcher", 1100, s => s.blastMulti >= 3, "Kill 3 enemies with one explosion", "Lobs slow grenades that burst on contact. Your own blasts can't hurt you.", ["MAG 3", "EXPLOSIVE", "SLOW"]),
  it("wisp", "gun", "Wisp Launcher", 1200, s => s.ocCount >= 30, "Use Overclock 30 times", "Drifting ghost-lights that hunt the nearest enemy and pass through two.", ["MAG 4", "HOMING", "PIERCES 2"]),
  it("hydra", "oc", "HYDRA.exe", 650, null, "", "Only two locks, but every kill chains into four more.", ["2 LOCKS", "CHAINS x4"]),
  it("reaper", "oc", "REAPER_TAX", 600, null, "", "Six locks. Every kill in the volley pays triple scrip.", ["6 LOCKS", "SCRIP x3"]),
  it("nova", "oc", "NOVA//BLOOM", 700, s => s.blastMulti >= 2, "Kill 2 enemies with one explosion", "Three locks. Each one bursts in a big blast that can't hurt you.", ["3 LOCKS", "SAFE BLASTS"]),
  it("leech", "oc", "LEECH.sys", 750, s => s.ocCount >= 10, "Use Overclock 10 times", "Five locks. Every kill drinks back Overclock and RAM.", ["5 LOCKS", "REFUNDS OC", "+RAM"]),
  it("bastion", "oc", "BASTION", 800, s => s.dashes >= 150, "Dash 150 times", "Four locks, then you're untouchable for 2.5 seconds with a full RAM bar.", ["4 LOCKS", "INVULNERABLE", "RAM REFILL"]),
  it("mirror", "oc", "MIRRORSHARD", 850, s => s.kills >= 400, "Get 400 kills in total", "Five locks. Every kill bursts into six shards that fly out and kill again.", ["5 LOCKS", "SHARD BURST"]),
  it("blackout", "oc", "BLACKOUT", 900, s => s.ocCount >= 25, "Use Overclock 25 times", "Six locks. The volley wipes every enemy bullet and freezes everyone left.", ["6 LOCKS", "CLEARS BULLETS", "FREEZE 1.5S"]),
  it("adrenal", "imp", "Adrenal Pump", 350, null, "", "You run 12% faster. Everything else is your problem.", ["SPEED +12%"]),
  it("quickload", "imp", "Quickloader", 400, null, "", "Reloads take 35% less time.", ["RELOAD -35%"]),
  it("ricochet", "imp", "Ricochet Module", 400, null, "", "Every round bounces off one more wall.", ["BOUNCE +1"]),
  it("focus", "imp", "Focus Lens", 400, null, "", "Stand still and your rounds fly 50% faster and pierce one more body.", ["STILL: SPEED +50%", "PIERCE +1"]),
  it("static", "imp", "Static Skin", 450, null, "", "Dashing fries every enemy bullet close to you.", ["DASH CLEARS BULLETS"]),
  it("hollow", "imp", "Hollow Points", 450, null, "", "Every round pierces one more body. One less round per magazine.", ["PIERCE +1", "MAG -1"]),
  it("cryocore", "imp", "Cryo Core", 450, s => s.hackKills >= 5, "Kill 5 enemies with hacks", "Hack kills freeze everything near the target for two seconds.", ["HACKS FREEZE"]),
  it("phase", "imp", "Phase Step", 500, s => s.dashes >= 50, "Dash 50 times", "Dashes go 25% further and you stay untouchable a little longer.", ["DASH +25%", "I-FRAMES +"]),
  it("overcharger", "imp", "Overcharger", 500, null, "", "Kills charge Overclock 60% more.", ["OC FROM KILLS +60%"]),
  it("scavenger", "imp", "Scavenger Chip", 500, s => s.kills >= 300, "Get 300 kills in total", "Every shot kill puts a round back in your magazine.", ["KILLS REFUND A ROUND"]),
  it("extmag", "imp", "Extended Mags", 550, null, "", "Half again as many rounds in every magazine.", ["MAG +50%"]),
  it("bounty", "imp", "Bounty Chip", 600, null, "", "Kills pay 40% more scrip. Magpie approves.", ["SCRIP +40%"]),
  it("berserk", "imp", "Berserker Chip", 600, s => s.heatMax >= 4, "Reach Heat 4", "Every 8-kill streak doubles your fire rate for four seconds.", ["STREAK: FIRE RATE x2"]),
  it("shockdash", "imp", "Shockwave Dash", 650, s => s.dashes >= 100, "Dash 100 times", "The end of a dash bursts in a blast that can't hurt you. Every 4 seconds.", ["DASH BLAST", "4S COOLDOWN"]),
  it("chainmod", "imp", "Chain Reaction", 650, s => s.hackKills >= 15, "Kill 15 enemies with hacks", "Shot kills have a 35% chance to arc into the nearest enemy.", ["35% ARC ON KILL"]),
  it("twin", "imp", "Twin Barrel", 700, s => s.kills >= 400, "Get 400 kills in total", "Every trigger pull fires one extra round, angled slightly.", ["+1 ROUND PER SHOT"]),
  Object.assign(it("harpoon", "gun", "Ferryman's Harpoon", 0, null, "Finish Act 1", "Two heavy bolts that punch through every body in a line.", ["MAG 2", "PIERCES ALL", "ACT 1 REWARD"]), { relic: 1 }),
  Object.assign(it("bellows", "gun", "Cinder's Bellows", 0, null, "Finish Act 2", "A slag thrower. Hold the trigger for a short, wide gout of fire.", ["MAG 40", "FULL AUTO", "SHORT RANGE"]), { relic: 2 }),
  Object.assign(it("repeater", "gun", "Archive Repeater", 0, null, "Finish Act 3", "Every shot is fired again a moment later by your own echo.", ["MAG 8", "SHOTS REPEAT", "ACT 3 REWARD"]), { relic: 3 }),
  Object.assign(it("wasp", "gun", "Vane's Wasp", 0, null, "Finish Act 4", "Fires three micro-missiles that hunt the nearest enemy.", ["MAG 6", "3 HOMING", "ACT 4 REWARD"]), { relic: 4 }),
  Object.assign(it("requiem", "gun", "Corvina's Requiem", 0, null, "Finish the story", "Every kill bursts into six feathers that fly out and kill again.", ["MAG 7", "KILLS BURST", "ACT 5"]), { relic: 5 }),
  Object.assign(it("toll", "imp", "Toll Chain", 0, null, "Finish Act 1", "The Ferryman's chain. Dash through an enemy to kill it, once a second.", ["DASH KILLS", "ACT 1 REWARD"]), { relic: 1 }),
  Object.assign(it("kiln", "imp", "Kiln Rounds", 0, null, "Finish Act 2", "Cinder's slag in your bullets. Every shot kill bursts in a blast that can't hurt you.", ["KILLS EXPLODE", "ACT 2 REWARD"]), { relic: 2 }),
  Object.assign(it("echo", "imp", "Echo Shell", 0, null, "Finish Act 3", "The Archivist kept a copy of you. Now it fights beside you.", ["ECHO ALLY", "ACT 3 REWARD"]), { relic: 3 }),
  Object.assign(it("aegis", "imp", "Aegis Lattice", 0, null, "Finish Act 4", "Halvorsen's prototype. Shrugs off one hit, then recharges after 20 kills.", ["1 SHIELD", "RECHARGES", "ACT 4 REWARD"]), { relic: 4 }),
  Object.assign(it("crown", "oc", "CORVUS//CROWN", 0, null, "Finish the story", "Eight locks. Locks crack boss armour, and every kill gives Overclock back.", ["8 LOCKS", "HITS BOSSES", "ACT 5"]), { relic: 5 }),
];
// Scrip for finishing each act, paid once.
const ACT_SCRIP = { 1: 1000, 2: 1500, 3: 2000, 4: 2500, 5: 4000 };
const IMP_SLOTS = 3;
// Economy tuning: gear (not styles, not act rewards) costs 30% more than its listed price, rounded to 50,
// so a story run pays for roughly all the gear and leaves the wardrobe to save up for.
const GEAR_PRICE_K = 1.3;
ITEMS.forEach(i => { if (i.price && !i.relic && i.cat !== "style") i.price = Math.round(i.price * GEAR_PRICE_K / 50) * 50; });
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const CATS = [["gun", "SIDEARMS"], ["oc", "OVERCLOCK"], ["imp", "IMPLANTS"]];

const SAVE_KEY = "murder-save-v1";
function defaultSave() { return { scrip: 300, owned: ["kestrel", "deadlink"], loadout: { gun: "kestrel", oc: "deadlink", imp: [] }, unlocked: 1, best: 0, mapMode: "gen", builds: [null, null, null], ach: {}, daily: {}, rush: {}, extra: {},
  stats: { kills: 0, byType: {}, hackKills: 0, grazes: 0, blastMulti: 0, falls: 0, ocCount: 0, ocFull: 0, dashes: 0, heatMax: 0, clears: {} }, seen: [] }; }
// Where the save lives: save.json in the app-data folder in the Steam build (so Steam Cloud can sync it between PC and Deck),
// the browser's localStorage everywhere else. The first Steam launch picks up an existing browser save and moves it into the file.
const SAVE_FILE = typeof window !== "undefined" && window.steamBridge && window.steamBridge.readSave ? window.steamBridge : null;
function readSaveText() { if (SAVE_FILE) { try { const t = SAVE_FILE.readSave(); if (t) return t; } catch (e) {} } try { return localStorage.getItem(SAVE_KEY); } catch (e) { return null; } }
function loadSave() {
  let s = null; try { s = JSON.parse(readSaveText()); } catch (e) {}
  const d = defaultSave();
  if (!s) { s = d; try { s.best = +localStorage.getItem("murder-best") || 0; s.unlocked = +localStorage.getItem("murder-unlock") || 1; if (s.unlocked > 1) s.stats.clears.market = true; } catch (e) {} }
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  for (const k in d.stats) if (s.stats[k] === undefined) s.stats[k] = d.stats[k];
  ITEMS.forEach(i => { if (i.req && i.req(s.stats) && !s.seen.includes(i.id)) s.seen.push(i.id); });
  return s;
}
let SAVE = loadSave();
function persist() { const t = JSON.stringify(SAVE); if (SAVE_FILE) { try { SAVE_FILE.writeSave(t); } catch (e) {} } try { localStorage.setItem(SAVE_KEY, t); } catch (e) {} }
const owns = id => SAVE.owned.includes(id);
// Magpie's prices: 20% off if you forgave her in the campaign, 20% more if you cut her off.
const priceOf = i => { const f = SAVE.camp && SAVE.camp.flags || {}; return Math.round(i.price * (f.forgaveMagpie ? .8 : f.cutMagpie ? 1.2 : 1)); };
const available = i => !i.relic && (!i.req || i.req(SAVE.stats));
const hasImp = id => !!(G.p && G.p.imps && G.p.imps.includes(id));

function earn(n) { n = Math.round(n); G.runScrip = (G.runScrip || 0) + n; SAVE.scrip += n; }
function scripFor(e) { const base = e.type === D().boss ? 300 : e.type === "nest" ? 40 : 6; return base * (1 + G.heat * .2); }
function track(ev, a) {
  if (G.range) return; // nothing in the firing range counts towards milestones
  const s = SAVE.stats;
  if (ev === "kill") { s.kills++; s.byType[a] = (s.byType[a] || 0) + 1; }
  else if (ev === "hack") s.hackKills++; else if (ev === "graze") s.grazes++; else if (ev === "blast") s.blastMulti = Math.max(s.blastMulti, a);
  else if (ev === "fall") s.falls++; else if (ev === "oc") { s.ocCount++; if (a >= 6) s.ocFull++; } else if (ev === "dash") s.dashes++;
  else if (ev === "heat") s.heatMax = Math.max(s.heatMax, a); else if (ev === "clear") s.clears[a] = true;
  checkMilestones();
}
function checkMilestones() {
  for (const i of ITEMS) { if (!i.req || SAVE.seen.includes(i.id) || !i.req(SAVE.stats)) continue;
    SAVE.seen.push(i.id); earn(100); G.banner = { txt: "MAGPIE HAS NEW STOCK: " + i.name.toUpperCase() + " · +100", col: COL.amber, life: 2.8 }; AU.sfx("milestone"); persist(); }
}
// Copy the equipped loadout onto the player at the start of a run or district.
function applyLoadout(p, fresh) {
  const L = G.tryLoadout || SAVE.loadout; p.gunId = L.gun; p.ocId = L.oc; p.maxLocks = OCP[L.oc].locks; p.imps = L.imp.slice(0, IMP_SLOTS);
  // Your gun with your implants applied: magazine, pierce, bounce and reload.
  const g = p.gun = Object.assign({}, GUNS[L.gun]), has = id => p.imps.includes(id);
  if (has("extmag")) g.mag = Math.max(g.mag + 1, Math.round(g.mag * 1.5)); if (has("hollow")) { g.pierce += 1; g.mag = Math.max(1, g.mag - 1); }
  if (has("ricochet")) g.bounce += 1; if (has("quickload")) g.reload *= .65;
  p.ocMax = p.imps.includes("redline") ? 150 : 100; p.ramMax = p.imps.includes("deck") ? 9 : 6; p.hitR = p.imps.includes("graze") ? 5.5 : 4.5;
  p.ammo = p.gun.mag; p.reload = 0; p.ram = p.ramMax; if (fresh) { p.egoUsed = false; p.streak = 0; p.oc = 50; p.aegis = true; p.aegisK = 0; } p.oc = Math.min(p.oc, p.ocMax); p.still = 0;
}
// Saved builds: three slots holding a sidearm, an Overclock and implants.
const buildName = B => B ? [B.gun, B.oc, ...B.imp].map(id => ITEM[id] ? ITEM[id].name.toUpperCase() : "?").join(" · ") : "EMPTY";
function saveBuild(i) { const L = SAVE.loadout; SAVE.builds[i] = { gun: L.gun, oc: L.oc, imp: L.imp.slice() }; persist(); achieve("build"); }
function loadBuild(i) { const B = SAVE.builds[i]; if (!B) return false; const ok = id => owns(id) && ITEM[id];
  SAVE.loadout = { gun: ok(B.gun) ? B.gun : SAVE.loadout.gun, oc: ok(B.oc) ? B.oc : SAVE.loadout.oc, imp: B.imp.filter(ok).slice(0, IMP_SLOTS) }; persist(); return true; }
const tellK = () => hasImp("prism") ? 1.35 : 1;
