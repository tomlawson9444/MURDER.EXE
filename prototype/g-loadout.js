/* Loadout, Magpie's stock, scrip, milestones and the save file. */
"use strict";
const GUNS = {
  kestrel: { name: "KESTREL .44", mag: 6, reload: 1.1, cd: .11, speed: 760, pellets: 1, spread: 0, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel" },
  breacher: { name: "BREACHER CUSTOM", mag: 4, reload: 1.3, cd: .3, speed: 620, pellets: 5, spread: .3, pierce: 0, bounce: 0, life: .24, sfx: "kestrel", kick: 3.5 },
  coil: { name: "RICOCHET COILGUN", mag: 5, reload: 1.2, cd: .14, speed: 600, pellets: 1, spread: 0, pierce: 0, bounce: 2, life: 2.5, sfx: "kestrel" },
  hornet: { name: "HORNET SMG", mag: 16, reload: 1.4, cd: .065, speed: 700, pellets: 1, spread: .09, pierce: 0, bounce: 0, life: 2.5, sfx: "kestrel", auto: true },
  rail: { name: "RAILPIERCER", mag: 3, reload: 1.5, cd: .35, speed: 1150, pellets: 1, spread: 0, pierce: 3, bounce: 0, life: 2.5, sfx: "rail", kick: 4 },
};
const OCP = { deadlink: { locks: 6 }, arc: { locks: 3 }, swarm: { locks: 4 }, ghost: { locks: 5 } };
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
];
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const CATS = [["gun", "SIDEARMS"], ["oc", "OVERCLOCK"], ["imp", "IMPLANTS"]];

const SAVE_KEY = "murder-save-v1";
function defaultSave() { return { scrip: 300, owned: ["kestrel", "deadlink"], loadout: { gun: "kestrel", oc: "deadlink", imp: [] }, unlocked: 1, best: 0, mapMode: "gen",
  stats: { kills: 0, byType: {}, hackKills: 0, grazes: 0, blastMulti: 0, falls: 0, ocCount: 0, ocFull: 0, dashes: 0, heatMax: 0, clears: {} }, seen: [] }; }
function loadSave() {
  let s = null; try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
  const d = defaultSave();
  if (!s) { s = d; try { s.best = +localStorage.getItem("murder-best") || 0; s.unlocked = +localStorage.getItem("murder-unlock") || 1; if (s.unlocked > 1) s.stats.clears.market = true; } catch (e) {} }
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  for (const k in d.stats) if (s.stats[k] === undefined) s.stats[k] = d.stats[k];
  ITEMS.forEach(i => { if (i.req && i.req(s.stats) && !s.seen.includes(i.id)) s.seen.push(i.id); });
  return s;
}
let SAVE = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }
const owns = id => SAVE.owned.includes(id);
const available = i => !i.req || i.req(SAVE.stats);
const hasImp = id => !!(G.p && G.p.imps && G.p.imps.includes(id));

function earn(n) { n = Math.round(n); G.runScrip = (G.runScrip || 0) + n; SAVE.scrip += n; }
function scripFor(e) { const base = e.type === D().boss ? 300 : e.type === "nest" ? 40 : 8; return base * (1 + G.heat * .2); }
function track(ev, a) {
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
  const L = SAVE.loadout; p.gunId = L.gun; p.gun = GUNS[L.gun]; p.ocId = L.oc; p.maxLocks = OCP[L.oc].locks; p.imps = L.imp.slice();
  p.ocMax = p.imps.includes("redline") ? 150 : 100; p.ramMax = p.imps.includes("deck") ? 9 : 6; p.hitR = p.imps.includes("graze") ? 5.5 : 4.5;
  p.ammo = p.gun.mag; p.reload = 0; p.ram = p.ramMax; if (fresh) { p.egoUsed = false; p.streak = 0; p.oc = 50; } p.oc = Math.min(p.oc, p.ocMax); p.still = 0;
}
const tellK = () => hasImp("prism") ? 1.35 : 1;
