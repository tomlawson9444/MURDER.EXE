/* Boot, run reset, fixed-step loop. */
"use strict";
(() => {
  const cv = document.getElementById("game"), c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
  // The desktop (Steam) build has no help line under the game, so the game gets the whole window.
  const desktop = !!window.steamBridge; if (desktop) document.body.classList.add("desktop");
  function fit() { const s = Math.min(innerWidth / GW, (innerHeight - (desktop ? 0 : 40)) / GH); const k = s >= 1 ? Math.max(1, Math.floor(s * 2) / 2) : s; cv.style.width = GW * k + "px"; cv.style.height = GH * k + "px"; }
  addEventListener("resize", fit); fit();
  // Load a district into the current run. Score, kills and Overclock carry across a breach.
  function enterDistrict(key) {
    G.district = key; G.mapKey = chooseMap(key); G.grid = buildGrid(MAPS[G.mapKey], false); G.base = renderMap(G.mapKey, false, SP, G.grid); G.dirty = false; G.perch = perchSpot(); G.gapTiles = gapTiles();
    const ps = playerStart(), fresh = !G.p; if (!G.p) { G.p = newPlayer(ps.x, ps.y); applyLoadout(G.p, true); } else { Object.assign(G.p, { x: ps.x, y: ps.y, trail: [], dash: 0, iframes: .5 }); applyLoadout(G.p, false); } coopPlaceCrew(ps, fresh); placeEchoAlly();
    Object.assign(G, { en: [], bul: [], echoShots: [], pending: [], parts: [], blasts: [], zaps: [], tracers: [], pings: [], dStart: G.kills, phase2: false, tram: null, wind: null, collapse: null,
      boss: false, oc: null, hexed: 0, trace: 0, anchor: null, crateHp: {}, spawnT: 1.5 });
    G.heat = G.heatBase; G.lastHeat = G.heat; G.mult = 1 + G.heat * .5;
    G.banner = { txt: mapName() + " · SURVIVE TO 100", col: COL.cyan, life: 2.4 };
    spawnNests();
  }
  function reset(key) { Object.assign(G, { p: null, runScrip: 0, kills: 0, score: 0, time: 0, texts: [], shake: 0, hitstop: 0, flash: 0, flowT: 0, heatBase: key === "rookery" ? 1 : /^x\d+$/.test(key) ? 2 : 0 }); enterDistrict(key); }
  function music() { AU.setOC(false); AU.start(); AU.setHeat(Math.min(5, G.heat + 2)); setTimeout(() => AU.ambience(D().amb), 60); }
  const leaveCampaign = () => Object.assign(G, { camp: null, rules: null, chapMap: null, radioQ: [], stalls: null, gates: null, shard: null, flood: null, vents: null, drops: null, rackFlow: null, lull: false, fog: 0, hazard: null, dropName: null, god: false, allies: [], rw: null, zone: null, exit: null, choirRounds: 0, range: null, tryLoadout: null, daily: null, rush: null });
  function start(key, sameSeed) { leaveCampaign(); if (key === "endless") key = "x3"; G.startDistrict = key; if (!sameSeed) { G.runSeed = G.queuedSeed != null ? G.queuedSeed : PG.randomSeed(); G.queuedSeed = null; } resetEndless(); reset(key); G.runPosted = false; G.mode = "play"; G.paused = false; AU.init(); BANK.attach(); music(); buildFlow(); }
  function breach() { const next = getDist(D().next); G.heatBase = Math.min(4, Math.min(2, G.heat) + Math.floor(Math.max(0, next.n - 2) / 2)); enterDistrict(D().next); G.mode = "play"; music(); buildFlow(); AU.sfx("ocIn"); }
  // The title screen always sits on the Rain Market ("endless" is a menu entry, not a map, so it can't be rebuilt).
  function cashOut() { if (G.daily) recordDaily(); recordRun(); persist(); AU.stop(); AU.ambience("off"); leaveCampaign(); G.mode = "title"; reset("market"); }
  // FIRING RANGE: try any item from Magpie's (owned or not) on targets that never fight back. Nothing you do here pays or counts.
  function startRange(item) {
    const L = SAVE.loadout, T = { gun: L.gun, oc: L.oc, imp: L.imp.slice() }; if (item.cat === "gun") T.gun = item.id; else if (item.cat === "oc") T.oc = item.id; else if (item.cat === "imp" && !T.imp.includes(item.id)) { if (T.imp.length >= IMP_SLOTS) T.imp.shift(); T.imp.push(item.id); }
    const back = { from: G.shop.from, tab: G.shop.tab, sel: G.shop.sel, camp: G.camp };
    achieve("range"); leaveCampaign(); G.tryLoadout = T; G.range = { item, back, kills: 0, t: 0, spawnT: 0 }; reset("market"); G.mode = "play"; G.paused = false; G.god = true; G.lull = true; G.rules = { p2: null, boss: null };
    AU.init(); BANK.attach(); music(); buildFlow(); G.banner = { txt: "FIRING RANGE · " + item.name.toUpperCase(), col: COL.amber, life: 2.4 };
  }
  function updateRange(dt) {
    const R = G.range, P = G.p; R.t += dt; P.oc = Math.min(P.ocMax, P.oc + 18 * dt); P.ram = Math.min(P.ramMax, P.ram + dt);
    R.spawnT -= dt; const n = G.en.filter(e => e.alive && e.dummy).length;
    if (n < 7 && R.spawnT <= 0) { R.spawnT = .35; const q = floorSpots(70).filter(q => Math.hypot(q.x - P.x, q.y - P.y) < 210).sort(() => Math.random() - .5)[0];
      if (q) { const types = ["rook", "rook", "shrike", "jackdaw", "bulwark", "carrion", "rook"], e = spawnEnemy(types[Math.random() * types.length | 0], q.x, q.y); e.dummy = true; fx(q.x, q.y - 12, 8, [COL.amber, "#ffffff"], 50, .3); } }
  }
  function endRange() { const b = G.range.back; G.range = null; G.tryLoadout = null; G.god = false; G.lull = false; AU.stop(); AU.ambience("off"); reset("market");
    G.camp = b.camp; openShop(b.from); Object.assign(G.shop, { tab: b.tab, sel: b.sel }); G.shop.line = "WELL? WORTH THE SCRIP?"; G.shop.lineT = 0; }
  // DAILY CHALLENGE: today's seed, twist and kit (see g-extras.js). Scored like Arcade; the run ends when you flatline or cash out.
  function startDaily() { const d = dailyOf(); leaveCampaign(); G.daily = Object.assign({ recorded: false }, d); G.tryLoadout = d.kit; G.startDistrict = "market"; G.runSeed = d.seed; G.queuedSeed = null; SAVE.mapMode = "gen";
    resetEndless(); reset("market"); G.mode = "play"; G.paused = false; AU.init(); BANK.attach(); music(); buildFlow(); G.banner = { txt: "DAILY · " + d.mod[1] + " · " + d.mod[2], col: COL.amber, life: 3.2 }; }
  Object.assign(RUN, { reset, music, enter: enterDistrict, startRange, startDaily, leave: leaveCampaign });
  // Pause menu: resume, settings (g-settings.js) and quit.
  function pauseItems() {
    return [{ k: "resume", label: "RESUME" }, { k: "settings", label: "SETTINGS" },
      { k: "quit", label: G.range ? "LEAVE THE RANGE" : G.camp ? "QUIT TO CAMPAIGN MENU" : "QUIT TO TITLE" }]; }
  function updatePause() {
    const items = G.pauseItems = pauseItems(), n = items.length; G.pauseSel = Math.max(0, Math.min(n - 1, G.pauseSel || 0));
    if (hit("arrowup") || hit("w")) { G.pauseSel = (G.pauseSel + n - 1) % n; AU.sfx("lock", 0); } if (hit("arrowdown") || hit("s")) { G.pauseSel = (G.pauseSel + 1) % n; AU.sfx("lock", 0); }
    items.forEach((it, i) => { it.box = [GW / 2 - 120, 92 + i * 14 - 3, 240, 13]; }); const hov = items.findIndex(it => inBox(it.box, mouse.x, mouse.y));
    if (!PAD.active && (mouse.x !== G.pmx || mouse.y !== G.pmy)) { G.pmx = mouse.x; G.pmy = mouse.y; if (hov >= 0) G.pauseSel = hov; }
    const it = items[G.pauseSel], d = hit("arrowleft") || hit("a") ? -1 : hit("arrowright") || hit("d") ? 1 : 0;
    if (d && it.step) { it.step(d); persist(); AU.sfx("lock", 2); }
    if (hit("enter") || hit(" ") || (hit("lmb") && hov === G.pauseSel)) { if (it.k === "resume") G.paused = false; else if (it.k === "settings") openSettings("pause"); else if (it.k === "quit") { G.paused = false; if (G.range) endRange(); else if (G.rush) { AU.stop(); leaveCampaign(); openExtras(); } else if (G.camp) { AU.setOC(false); G.oc = null; toCamp(); } else cashOut(); } else { it.step(1); persist(); AU.sfx("lock", 2); } }
  }
  const toCamp = () => { persist(); AU.stop(); AU.ambience("off"); openCamp(); };
  const chapActions = { toCamp };
  const bodyActions = { back: () => { persist(); G.mode = "title"; G.menuMode = null; } };
  const shopActions = {
    jackIn: () => { persist(); const f = G.shop.from; if (f === "clear") breach(); else if (f === "campNext") startChapter(G.camp.n + 1); else if (f === "campRetry") startChapter(G.camp.n, true); else start(DORDER[G.sel || 0]); },
    back: () => { persist(); const f = G.shop.from; if (f === "clear") G.mode = "clear"; else if (f === "campNext") G.mode = "chap"; else if (f === "campRetry") toCamp(); else if (f === "arcade") G.mode = "arcade"; else { G.mode = "title"; AU.stop(); AU.ambience("off"); } },
  };
  function step(rdt, t) {
    if (coopClientStep(rdt)) return; // in a friend's co-op game: their game runs it, this one sends controls and shows it
    if (G.mode === "play" || G.mode === "shop" || G.mode === "intro" || G.mode === "body" || G.mode === "talk") G.menuMode = null; // menus always reopen on their first option
    const wantStart = hit("lmb") || hit("r") || hit(" ");
    if (G.titleMsg && G.mode !== "title" && G.mode !== "body") G.titleMsg = null; // a title notice never outlives the title screen
    if (G.mode === "title") {
      if (G.titleMsg) { G.titleMsg.life -= rdt; if (G.titleMsg.life <= 0) G.titleMsg = null; }
      // Four clear choices. Story and Arcade go through the BODYSHOP first if there is no operative yet.
      const made = SAVE.char.created, need = "CREATE YOUR OPERATIVE FIRST", S = SAVE.camp, begun = Object.keys(S.done).length > 0;
      const next = CHAPTERS[nextChapter()], finished = !!S.done[maxChapter()] && !!S.ending, found = Object.keys(S.endings || {}).length;
      G.menu = layoutMenu([
        { label: finished ? "STORY · COMPLETE" : begun ? `STORY · CONTINUE ${chLabel(nextChapter())}` : "STORY · NEW CAMPAIGN", col: COL.amber, act: () => made ? openCamp() : openBodyshop("create"),
          desc: !made ? need : finished ? `ENDINGS FOUND ${found}/3 · REPLAY ANY CHAPTER OR CHASE ANOTHER ENDING` : begun ? `ACT ${actOf(nextChapter()).n} · ${actOf(nextChapter()).name} · NEXT: ${next.title}` : "NINE NIGHTS OF RAIN · ACT 1 · YOUR CHOICES CHANGE THE STORY" },
        { label: "ARCADE", act: () => made ? openArcade() : openBodyshop("create"), desc: made ? "PICK A DISTRICT · KILL 100 · BEAT THE BOSS · GO DEEPER" : need },
        { label: made ? "OPERATIVE" : "CREATE OPERATIVE", act: () => openBodyshop(made ? "title" : "create"), desc: "YOUR LOOK, NAME, ORIGIN AND GEAR" },
        { label: "MAGPIE'S", col: COL.magenta, act: () => openShop("title"), desc: "SPEND SCRIP ON GUNS, IMPLANTS AND STYLE" },
        { label: "CHALLENGES", col: COL.red, act: () => made ? openExtras() : openBodyshop("create"), desc: made ? `DAILY CHALLENGE · BOSS RUSH · ACHIEVEMENTS ${Object.keys(SAVE.ach).length}/${ACH.length}` : need },
        { label: COOP.role === "host" ? `CO-OP · ${COOP.members.size + 1} IN YOUR GAME` : "CO-OP", col: COL.cyan, act: () => made ? openCoop() : openBodyshop("create"), desc: made ? "PLAY ARCADE AND THE STORY WITH UP TO THREE FRIENDS" : need },
        { label: "SETTINGS", col: COL.dim, act: () => openSettings("title"), desc: "SOUND · DISPLAY · CONTROLS · KEYS · CREDITS" }]
        .concat(desktop ? [{ label: "QUIT GAME", col: COL.dim, act: () => { persist(); window.steamBridge.quit(); }, desc: "SEE YOU IN THE RAIN" }] : []), desktop ? 162 : 163, desktop ? 9 : 10); runMenu(G.menu); return; }
    if (G.mode === "arcade") {
      // New maps every run: no district to pick, runs start at District 1 (or jump into the Endless Sprawl once unlocked).
      const n = Math.min(DORDER.length, G.unlocked || 1), fresh = arcadeFresh(), move = d => { G.sel = Math.max(0, Math.min(n - 1, (G.sel || 0) + d)); AU.sfx("lock", 1); };
      if (!fresh) { if (hit("arrowleft") || hit("a")) move(-1); if (hit("arrowright") || hit("d")) move(1); }
      if (hit("escape")) { G.mode = "title"; G.menuMode = null; return; }
      const mapLabel = SAVE.mapMode === "gen" ? (G.queuedSeed != null ? "MAP: SEED " + PG.seedName(G.queuedSeed) : "MAP: NEW EVERY RUN") : "MAP: CLASSIC LAYOUT";
      const runs = fresh ? [{ label: "START RUN", act: () => { G.sel = 0; start(DORDER[0]); } }].concat(n >= DORDER.length ? [{ label: "ENDLESS RUN", act: () => { G.sel = DORDER.indexOf("endless"); start("endless"); } }] : [])
        : [{ label: "START RUN", act: () => start(DORDER[G.sel || 0]) }];
      G.menu = layoutMenu(runs.concat([
        { label: mapLabel, col: COL.amber, act: () => { if (G.queuedSeed != null) G.queuedSeed = null; else SAVE.mapMode = SAVE.mapMode === "gen" ? "classic" : "gen"; persist(); AU.sfx("lock", 2); } },
        { label: "MAGPIE'S FIRST", col: COL.magenta, act: () => { if (fresh) G.sel = 0; openShop("arcade"); } },
        { label: "BACK", col: COL.dim, act: () => { G.mode = "title"; G.menuMode = null; } }]), fresh ? 134 : 174, 13); runMenu(G.menu); return; }
    if (G.mode === "settings") { updateSettings(rdt); return; }
    if (G.mode === "extras") { updateExtras(rdt); return; }
    if (G.mode === "coop") { updateCoop(rdt); return; }
    if (G.mode === "talk") { updateTalk(rdt); return; }
    if (G.mode === "camp") { updateCamp(rdt); return; }
    if (G.mode === "chap") { updateChap(rdt, chapActions); return; }
    if (G.mode === "shop") { updateShop(rdt, shopActions); return; }
    if (G.mode === "body") { updateBodyshop(rdt, bodyActions); return; }
    if (G.mode === "dead") { G.deadT += rdt; G.menu = null; if (G.daily) recordDaily(); recordRun();
      if (G.deadT > .8 && G.rush) { const R = G.rush, again = () => { leaveCampaign(); startRush(); };
        if (hit("r")) again(); else if (hit("escape")) { leaveCampaign(); openExtras(); }
        else { G.menu = layoutMenu([{ label: "TRY THE RUSH AGAIN", act: again }, { label: "CHALLENGES", col: COL.dim, act: () => { leaveCampaign(); openExtras(); } }], 176); runMenu(G.menu); } }
      else if (G.deadT > .8 && G.daily) { const again = () => RUN.startDaily();
        if (hit("r")) again(); else if (hit("escape")) { leaveCampaign(); openExtras(); }
        else { G.menu = layoutMenu([{ label: "TRY TODAY'S DAILY AGAIN", act: again }, { label: "CHALLENGES", col: COL.dim, act: () => { leaveCampaign(); openExtras(); } }], 176); runMenu(G.menu); } }
      else if (G.deadT > .8 && G.camp) { const retry = () => startChapter(G.camp.n, true);
        if (hit("r")) retry(); else if (hit("escape")) toCamp();
        else { G.menu = layoutMenu([{ label: "RETRY " + chLabel(G.camp.n), act: retry }, { label: "MAGPIE'S · RE-GEAR", col: COL.magenta, act: () => openShop("campRetry") }, { label: "CAMPAIGN MENU", col: COL.dim, act: toCamp }], 170); runMenu(G.menu); } }
      else if (G.deadT > .8) { const regear = () => { G.sel = DORDER.indexOf(/^x\d+$/.test(G.startDistrict) ? "endless" : G.startDistrict); openShop("title"); };
        const retrySame = () => start(G.startDistrict, true);
        if (hit("r")) { start(G.startDistrict); } else if (hit("escape")) { regear(); return; }
        else { G.menu = layoutMenu([{ label: G.mapKey === "run" ? "REBOOT · NEW MAP" : "REBOOT", act: () => start(G.startDistrict) }].concat(G.mapKey === "run" ? [{ label: "RETRY SAME MAP", act: retrySame }] : [], [{ label: "MAGPIE'S · RE-GEAR", col: COL.magenta, act: regear }, { label: "QUIT TO TITLE", col: COL.dim, act: cashOut }]), 170); runMenu(G.menu); } } }
    if (G.mode === "clear") { G.clearT += rdt; G.menu = null;
      if (G.clearT > 1) { if (hit("escape")) { cashOut(); return; }
        G.menu = layoutMenu(D().next ? [{ label: "BREACH NOW", act: breach }].concat(G.daily ? [] : [{ label: "MAGPIE'S, THEN BREACH", col: COL.magenta, act: () => openShop("clear") }], [{ label: G.daily ? "END THE DAILY · BANK THE SCORE" : "CASH OUT", col: COL.dim, act: cashOut }])
          : [{ label: "RETURN TO TITLE", act: cashOut }, { label: "MAGPIE'S", col: COL.magenta, act: () => { cashOut(); openShop("title"); } }], 176); runMenu(G.menu); }
      return; }
    if (G.mode === "intro") { G.introT += rdt; if (G.introT > 3) { G.mode = "play"; if (D().boss === "augur") augurShuffle(spawnEnemy("augur", GW / 2, 100)); else if (STORY_BOSSES[D().boss]) STORY_BOSSES[D().boss](); else spawnEnemy("blackwing", G.p.x, G.p.y); } return; }
    if (G.mode === "play" && G.range && !G.paused) { if (hit("escape")) { endRange(); return; } updateRange(rdt); } // Esc leaves; P / Start opens the pause menu
    if (G.mode === "play") {
      if (G.paused && G.settingsOpen) { updateSettings(rdt); return; }
      if (hit("p") || hit("escape")) { G.paused = !G.paused; G.pauseSel = 0; } if (G.paused) { updatePause(); return; }
      if (G.hitstop > 0) { G.hitstop -= rdt; return; }
    }
    const dt = G.oc ? rdt * .12 : rdt;
    if (G.mode === "play") { G.time += rdt; if (!G.p.down) updatePlayer(dt, rdt); if (G.oc) updateOC(rdt); coopUpdateMates(dt, rdt); G.flowT -= dt; if (G.flowT <= 0) { buildFlow(); G.flowT = .25; }
      updateDirector(dt); campTick(dt); if (!G.camp) updateAllies(dt); updateRadio(rdt); updateTram(dt); updateWind(dt); updateCollapse(dt); updateTrace(dt); G.hexed = Math.max(0, G.hexed - dt); }
    updateEnemies(dt); // each enemy goes for the nearest player (just you, solo)
    G.en = G.en.filter(e => e.alive);
    updateBullets(dt);
    for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= .96; q.life -= dt; } G.parts = G.parts.filter(q => q.life > 0);
    for (const q of G.texts) { q.y -= 14 * rdt; q.life -= rdt; } G.texts = G.texts.filter(q => q.life > 0);
    [G.blasts, G.zaps, G.tracers, G.pings].forEach(a => a.forEach(o => o.life -= rdt)); G.blasts = G.blasts.filter(o => o.life > 0); G.zaps = G.zaps.filter(o => o.life > 0); G.tracers = G.tracers.filter(o => o.life > 0); G.pings = G.pings.filter(o => o.life > 0);
    if (G.banner) { G.banner.life -= rdt; if (G.banner.life <= 0) G.banner = null; }
    G.shake = Math.max(0, G.shake - rdt * 20); G.flash -= rdt; if (G.kick) G.kick.t -= rdt;
    if (G.dirty) { G.base = renderMap(G.mapKey, false, SP, G.grid); G.dirty = false; }
  }
  function draw(t) { drawScene(t); achTick(1 / 60); drawAchToast(c, t); } // achievement toasts sit on top of every screen
  function drawScene(t) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    if (coopClientDraw(c, t)) return;
    if (G.mode === "coop") return drawCoop(c, t);
    if (G.mode === "settings") return drawSettings(c, t);
    if (G.mode === "extras") return drawExtras(c, t);
    if (G.mode === "title") return drawTitle(c, t);
    if (G.mode === "arcade") return drawArcade(c, t);
    if (G.mode === "shop") return drawShop(c, t);
    if (G.mode === "body") return drawBodyshop(c, t);
    if (G.mode === "talk") return drawTalk(c, t);
    if (G.mode === "camp") return drawCamp(c, t);
    if (G.mode === "chap") return drawChap(c, t);
    drawWorld(c, t); drawFog(c, t);
    if (G.oc) drawOC(c, t);
    if (G.mode === "play" || G.mode === "intro") { drawHUD(c, t); drawCoopHud(c, t); }
    if (G.mode === "dead") drawDead(c, t);
    if (G.mode === "intro") drawIntro(c, t);
    if (G.mode === "clear") drawClear(c, t);
    if (G.mode === "play" && G.paused) { if (G.settingsOpen) drawSettings(c, t); else drawPause(c); }
  }
  let last = 0;
  function tick(t) { const rdt = Math.min(.05, (t - last) / 1000 || 0); last = t; pollLocals(rdt); pollPad(rdt); step(rdt, t); coopAfterStep(rdt); G.pressed.clear(); draw(t); }
  function frame(t) { tick(t); requestAnimationFrame(frame); }
  // A hidden or minimised window stops animation frames; in co-op the game keeps ticking so friends aren't dropped.
  setInterval(() => { if (COOP.role && performance.now() - last > 250) tick(performance.now()); }, 100);
  setupInput(cv);
  G.best = SAVE.best || 0; G.unlocked = SAVE.unlocked || 1;
  const qs = location.hash.match(/district=(\w+)/);
  if (location.hash.includes("testchar")) SAVE.char.created = true; // automated tests skip character creation
  if (location.hash.includes("classic")) SAVE.mapMode = "classic"; // e.g. #classic or #autostart-classic: play the hand-made maps
  // Shared seed links: #seed-ABC123 or #seed-ABC123-rookery queue that map for the next run.
  const sq = location.hash.match(/^#seed-([0-9a-z]{1,6})(?:-(\w+))?$/i); if (sq) { G.queuedSeed = PG.parseSeed(sq[1]); SAVE.mapMode = "gen"; if (sq[2] && DORDER.indexOf(sq[2].toLowerCase()) >= 0 && DORDER.indexOf(sq[2].toLowerCase()) < (G.unlocked || 1)) G.sel = DORDER.indexOf(sq[2].toLowerCase()); }
  const fonts = Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('32px "Silkscreen"'), document.fonts.load('700 44px "Chakra Petch"')]), new Promise(r => setTimeout(r, 2500))]);
  PLATFORM.sync(Object.keys(SAVE.ach)); // Steam build: make sure Steam has every achievement this save already earned
  BANK.build(); fonts.then(() => { updateHelp(); buildSprites(); reset("market"); G.mode = "title"; if (location.hash.startsWith("#autostart")) start(qs ? qs[1] : "market"); else if (sq && SAVE.char.created) openArcade();
    const cq = location.hash.match(/chapter-(\d+)/); if (cq && CHAPTERS[+cq[1]]) { SAVE.camp.cur = Math.max(SAVE.camp.cur, +cq[1]); startChapter(+cq[1], location.hash.includes("nobrief")); } requestAnimationFrame(frame); });
  window.__G = G;
})();
