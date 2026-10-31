/* Extras: achievements, the Daily Challenge and Boss Rush, and the CHALLENGES screen that holds them. */
"use strict";

/* ---- Achievements ---- */
// [id, name, how to get it, scrip reward, check (optional: checked every second; the rest unlock from events)]
const ownedOf = cat => ITEMS.filter(i => i.cat === cat && owns(i.id)).length;
const ACH = [
  ["ch1", "FIRST BLOOD", "Finish Chapter 1", 100, () => !!SAVE.camp.done[1]],
  ["act1", "WET FEATHERS", "Finish Act 1", 250, () => actDone(ACTS[0])],
  ["act2", "THE ROOST", "Finish Act 2", 250, () => actDone(ACTS[1])],
  ["act3", "COLD STORAGE", "Finish Act 3", 250, () => actDone(ACTS[2])],
  ["act4", "BAD DEBTS", "Finish Act 4", 250, () => actDone(ACTS[3])],
  ["act5", "TEN THOUSAND EYES", "Finish the story", 500, () => actDone(ACTS[4])],
  ["endings", "EVERY WAY OUT", "See all three endings", 1000, () => Object.keys(SAVE.camp.endings || {}).length >= 3],
  ["shards", "THE WHOLE ARCHIVE", "Recover all 30 datashards", 1000, () => Object.keys(SAVE.camp.shards).length >= 30],
  ["stall", "GOOD FOR BUSINESS", "Finish Chapter 2, stall above 75%"],
  ["racks", "NOTHING WENT DARK", "Save all four racks in Chapter 16", 300, () => !!SAVE.camp.flags.allRacks],
  ["resonance", "TOO CLOSE", "Reach CORVUS Resonance 6", 200, () => SAVE.camp.res >= 6],
  ["k100", "CROW HUNTER", "Get 100 kills", 100, () => SAVE.stats.kills >= 100],
  ["k1000", "MURDER OF ONE", "Get 1,000 kills", 300, () => SAVE.stats.kills >= 1000],
  ["k5000", "EXTINCTION EVENT", "Get 5,000 kills", 1000, () => SAVE.stats.kills >= 5000],
  ["hacks", "SHORT CIRCUIT", "Kill 50 enemies with hacks", 200, () => SAVE.stats.hackKills >= 50],
  ["arc3", "PASS IT ON", "Kill three with one hack"],
  ["blast5", "BLAST RADIUS", "Kill 5 enemies with one explosion", 300, () => SAVE.stats.blastMulti >= 5],
  ["volley", "FULL VOLLEY", "Kill 6 with one Overclock"],
  ["mass", "MASS DELETE", "Kill 10 with one Overclock volley"],
  ["graze", "GRAZE ARTIST", "Graze 100 bullets", 200, () => SAVE.stats.grazes >= 100],
  ["falls", "MIND THE GAP", "Knock 25 enemies into the chasm", 200, () => SAVE.stats.falls >= 25],
  ["dashkill", "TOLL PAID", "Kill an enemy by dashing through it"],
  ["freeze", "ICE AGE", "Freeze 6 enemies at once"],
  ["ricochet", "TRICK SHOT", "Kill an enemy with a bounced round"],
  ["longshot", "SKEWER", "Kill 4 enemies with one round"],
  ["heat5", "BURNING UP", "Reach Heat 5", 200, () => SAVE.stats.heatMax >= 5],
  ["market", "RAIN CHECK", "Clear the Rain Market in Arcade", 150, () => !!SAVE.stats.clears.market],
  ["rookery", "ROOST RULER", "Clear the Chrome Rookery in Arcade", 200, () => !!SAVE.stats.clears.rookery],
  ["deep", "DEEP DIVE", "Reach Endless district 5", 400, () => !G.camp && /^x\d+$/.test(G.district || "") && +G.district.slice(1) >= 5],
  ["score", "HIGH ROLLER", "Score 250,000 in one Arcade run", 400, () => !G.camp && G.score >= 250000],
  ["gear", "COLLECTOR", "Own 25 pieces of gear", 300, () => ownedOf("gun") + ownedOf("oc") + ownedOf("imp") >= 25],
  ["style", "DRESSED TO KILL", "Own 25 styles", 300, () => ownedOf("style") >= 25],
  ["range", "TRY BEFORE YOU BUY", "Test something in the firing range"],
  ["build", "BLUEPRINT", "Save a build"],
  ["random", "IDENTITY CRISIS", "Randomise your operative 10 times", 100, () => (SAVE.extra.randoms || 0) >= 10],
  ["daily", "DAILY GRIND", "Play a Daily Challenge"],
  ["daily3", "REGULAR", "Play three different Daily Challenges", 400, () => Object.keys(SAVE.daily).length >= 3],
  ["rush", "BOSS RUSH", "Beat Boss Rush", 1000],
  ["rushfast", "NO TIME TO WASTE", "Beat Boss Rush in under 15 minutes", 1500],
];
const ACH_BY = Object.fromEntries(ACH.map(a => [a[0], a]));
// Unlock an achievement once: pays its scrip and shows a toast. Nothing counts in the firing range.
function achieve(id) {
  const A = ACH_BY[id]; if (!A || SAVE.ach[id] || G.range) return; SAVE.ach[id] = Date.now(); const reward = A[3] || 200; SAVE.scrip += reward; persist(); PLATFORM.unlock(id); // Steam, in the Steam build
  (G.toasts || (G.toasts = [])).push({ txt: A[1], sub: A[2].toUpperCase() + " · +" + reward + " SCRIP", life: 4 }); AU.sfx("milestone");
}
function achTick(rdt) { G.achT = (G.achT || 0) - rdt; if (G.achT > 0) return; G.achT = 1; for (const A of ACH) if (A[4] && !SAVE.ach[A[0]]) { try { if (A[4]()) achieve(A[0]); } catch (e) {} } }
function drawAchToast(c, t) {
  const T = G.toasts; if (!T || !T.length) return; const a = T[0]; a.life -= 1 / 60; if (a.life <= 0) { T.shift(); return; }
  const k = Math.min(1, (4 - a.life) * 4, a.life * 3), y = 6 - (1 - k) * 30, x = GW - 236;
  c.save(); c.globalAlpha = Math.max(0, k); c.fillStyle = "rgba(8,6,16,.94)"; c.fillRect(x, y, 230, 30); c.strokeStyle = COL.amber; c.strokeRect(x + .5, y + .5, 229, 29);
  txt(c, "ACHIEVEMENT · " + a.txt, x + 8, y + 5, COL.amber); txt(c, a.sub.length > 44 ? a.sub.slice(0, 43) + "…" : a.sub, x + 8, y + 17, COL.ink); c.restore();
}

/* ---- Daily Challenge: today's date picks the map seed, a twist and a fixed kit, so everyone gets the same run ---- */
const DAILY_MODS = [
  ["boom", "BOOM TOWN", "EVERY KILL EXPLODES (YOUR BLASTS CAN'T HURT YOU)"],
  ["frost", "COLD SNAP", "EVERY KILL FREEZES THE ENEMIES AROUND IT"],
  ["bottomless", "BOTTOMLESS", "YOUR MAGAZINE NEVER EMPTIES · HEAT STARTS AT 3"],
  ["glass", "GLASS JAW", "ENEMY BULLETS FLY 35% FASTER · DOUBLE SCORE"],
  ["swarm", "SWARM", "HALF AGAIN AS MANY ENEMIES · DOUBLE SCORE"],
  ["charged", "OVERCHARGED", "OVERCLOCK CHARGES THREE TIMES FASTER"],
  ["heat", "RED ALERT", "HEAT STARTS AT 3 AND NEVER COOLS"],
];
const dailyKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function dailyOf(key = dailyKey()) {
  let h = 2166136261; for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } const r = rngF(h);
  const pick = cat => { const l = ITEMS.filter(i => i.cat === cat); return l[r() * l.length | 0].id; };
  const imps = ITEMS.filter(i => i.cat === "imp").map(i => i.id).sort(() => r() - .5).slice(0, 2);
  return { key, seed: h % 2176782336, mod: DAILY_MODS[r() * DAILY_MODS.length | 0], kit: { gun: pick("gun"), oc: pick("oc"), imp: imps } };
}
const dailyMod = id => !!(G.daily && G.daily.mod[0] === id);
function recordDaily() {
  const D2 = G.daily; if (!D2 || D2.recorded) return; D2.recorded = true; const rec = SAVE.daily[D2.key] || (SAVE.daily[D2.key] = { best: 0, tries: 0, top: [] });
  rec.tries++; rec.best = Math.max(rec.best, G.score); rec.top = rec.top.concat([G.score]).sort((a, b) => b - a).slice(0, 5); persist(); achieve("daily");
}

/* ---- Boss Rush: the ten story bosses back to back, with your own gear and three shields for the whole run ---- */
const RUSH = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
const fmtTime = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
function startRush() { G.rush = { i: 0, total: 0, shields: 3 }; rushBoss(); }
function rushBoss() {
  const R = G.rush, n = RUSH[R.i]; startChapter(n, true); G.rush = R; G.p.shield = R.shields;
  G.kills = G.dStart + (G.rules.boss || 0); G.camp.t = 999; // skip straight to the boss
  G.banner = { txt: `BOSS ${R.i + 1}/${RUSH.length} · ${DIST[CHAPTERS[n].district] && CHAPTERS[n].title}`, col: COL.red, life: 2.4 };
}
// Called instead of the chapter outro when a boss falls.
function rushNext() {
  const R = G.rush; R.total += G.time; R.shields = G.p.shield || 0; R.i++;
  if (R.i < RUSH.length) return rushBoss();
  const best = SAVE.rush.best; SAVE.rush.best = best ? Math.min(best, R.total) : R.total; SAVE.rush.wins = (SAVE.rush.wins || 0) + 1; persist();
  achieve("rush"); if (R.total < 15 * 60) achieve("rushfast");
  G.rushDone = { total: R.total, newBest: !best || R.total < best }; G.rush = null; AU.stop(); openExtras("rushdone");
}

/* ---- CHALLENGES screen ---- */
function openExtras(view) { G.mode = "extras"; G.xView = view || "menu"; G.menuMode = null; G.achScroll = 0; G.camp = null; G.rules = null; G.chapMap = null; }
function updateExtras(rdt) {
  if (G.xView === "ach") { const rows = Math.ceil(ACH.length / 2), vis = 9;
    if (hit("arrowdown") || hit("s")) G.achScroll = Math.min(rows - vis, (G.achScroll || 0) + 1); if (hit("arrowup") || hit("w")) G.achScroll = Math.max(0, (G.achScroll || 0) - 1);
    if (G.wheel) { G.achScroll = Math.max(0, Math.min(rows - vis, (G.achScroll || 0) + Math.sign(G.wheel))); G.wheel = 0; }
    if (hit("escape") || hit("enter") || hit(" ") || hit("lmb")) { G.xView = "menu"; G.menuMode = null; } return; }
  if (hit("escape")) { G.mode = "title"; G.menuMode = null; return; }
  const d = dailyOf(), rec = SAVE.daily[d.key], made = SAVE.char.created;
  const items = G.xView === "rushdone" ? [{ label: "RUN IT AGAIN", act: () => { RUN.leave(); startRush(); } }, { label: "CHALLENGES", col: COL.dim, act: () => { G.xView = "menu"; G.menuMode = null; } }]
    : [{ label: "DAILY CHALLENGE · " + d.mod[1], col: COL.amber, act: () => made ? RUN.startDaily() : openBodyshop("create") },
      { label: "BOSS RUSH", col: COL.red, act: () => { if (!made) return openBodyshop("create"); RUN.leave(); startRush(); } },
      { label: `ACHIEVEMENTS · ${Object.keys(SAVE.ach).length}/${ACH.length}`, col: COL.cyan, act: () => { G.xView = "ach"; G.achScroll = 0; } },
      { label: "BACK", col: COL.dim, act: () => { G.mode = "title"; G.menuMode = null; } }];
  G.menu = layoutMenu(items, G.xView === "rushdone" ? 190 : 170, 13); runMenu(G.menu);
}
function drawExtras(c, t) {
  if (G.base) { c.drawImage(G.base.C, 0, 0); drawRain(c, G.base, t); } veil(c, .85);
  ["#ff2d8a", "#2be4ff", "#e9e6f5"].forEach((col, i) => txt(c, G.xView === "ach" ? "ACHIEVEMENTS" : G.xView === "rushdone" ? "BOSS RUSH COMPLETE" : "CHALLENGES", GW / 2 + (i === 0 ? -1 : i === 1 ? 1 : 0), 12, col, 16, "center"));
  if (G.xView === "ach") {
    const got = Object.keys(SAVE.ach).length, earned = ACH.filter(a => SAVE.ach[a[0]]).reduce((s, a) => s + (a[3] || 200), 0); txt(c, `${got}/${ACH.length} UNLOCKED · ${earned} SCRIP EARNED`, GW / 2, 34, COL.amber, 8, "center");
    const sc = G.achScroll || 0; ACH.slice(sc * 2, sc * 2 + 18).forEach((A, k) => { const x = k % 2 ? 244 : 14, y = 50 + Math.floor(k / 2) * 22, on = !!SAVE.ach[A[0]];
      c.fillStyle = on ? "rgba(255,178,46,.12)" : "rgba(20,16,32,.8)"; c.fillRect(x, y, 222, 20); c.fillStyle = on ? COL.amber : "#2a2640"; c.fillRect(x, y, 2, 20);
      txt(c, (on ? "✓ " : "") + A[1], x + 7, y + 3, on ? COL.amber : COL.ink); txt(c, "+" + (A[3] || 200), x + 216, y + 3, on ? COL.dim : rgba(COL.amber, .7), 8, "right"); txt(c, A[2].toUpperCase(), x + 7, y + 12, on ? COL.dim : rgba(COL.dim, .8)); });
    const rows = Math.ceil(ACH.length / 2); if (rows > 9) { c.fillStyle = "#2a2640"; c.fillRect(470, 50, 2, 196); c.fillStyle = COL.cyan; c.fillRect(470, 50 + 196 * sc / rows, 2, 196 * 9 / rows); }
    txt(c, PAD.active ? "UP / DOWN SCROLL · B BACK" : "W / S OR WHEEL SCROLL · ESC BACK", GW / 2, GH - 12, rgba(COL.dim, .7), 8, "center"); return; }
  if (G.xView === "rushdone") { const R = G.rushDone || { total: 0 };
    txt(c, "ALL TEN BOSSES DOWN", GW / 2, 70, COL.red, 8, "center"); txt(c, "TIME " + fmtTime(R.total), GW / 2, 96, COL.ink, 16, "center");
    txt(c, R.newBest ? "NEW BEST TIME" : "BEST " + fmtTime(SAVE.rush.best || R.total), GW / 2, 128, R.newBest ? COL.amber : COL.dim, 8, "center"); drawMenu(c, G.menu, t); return; }
  const d = dailyOf(), rec = SAVE.daily[d.key];
  panel(c, 20, 40, 216, 112, COL.amber); txt(c, "DAILY CHALLENGE · " + d.key, 28, 46, COL.amber); txt(c, d.mod[1], 28, 60, COL.ink);
  wrapText(c, d.mod[2], 200).slice(0, 2).forEach((l, i) => txt(c, l, 28, 72 + i * 10, COL.dim));
  txt(c, "TODAY'S KIT (EVERYONE GETS THE SAME):", 28, 96, rgba(COL.cyan, .8)); wrapText(c, [d.kit.gun, d.kit.oc, ...d.kit.imp].map(id => ITEM[id].name.toUpperCase()).join(" · "), 200).slice(0, 2).forEach((l, i) => txt(c, l, 28, 107 + i * 10, COL.ink));
  txt(c, rec ? `YOUR BEST ${String(rec.best).padStart(7, "0")} · ${rec.tries} ${rec.tries === 1 ? "TRY" : "TRIES"}` : "NOT PLAYED YET TODAY", 28, 134, rec ? COL.amber : COL.dim);
  panel(c, 244, 40, 216, 112, COL.red); txt(c, "BOSS RUSH", 252, 46, COL.red); txt(c, "ALL TEN STORY BOSSES, BACK TO BACK.", 252, 60, COL.ink);
  wrapText(c, "YOUR OWN GEAR · THREE SHIELDS FOR THE WHOLE RUN · THE CLOCK NEVER STOPS.", 200).forEach((l, i) => txt(c, l, 252, 72 + i * 10, COL.dim));
  txt(c, SAVE.rush.best ? "BEST TIME " + fmtTime(SAVE.rush.best) : "NOT BEATEN YET", 252, 134, SAVE.rush.best ? COL.amber : COL.dim);
  if (rec && rec.top.length > 1) txt(c, "TODAY'S TOP: " + rec.top.map(s => s).join(" · "), GW / 2, 158, rgba(COL.amber, .7), 8, "center");
  drawMenu(c, G.menu, t);
  txt(c, PAD.active ? "UP / DOWN + " + lab().confirm + " · B: BACK" : "W / S + ENTER OR CLICK · ESC: BACK", GW / 2, GH - 12, rgba(COL.dim, .7), 8, "center");
}
