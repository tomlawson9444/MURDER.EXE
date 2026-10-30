/* Boot, run reset, fixed-step loop. */
"use strict";
(() => {
  const cv = document.getElementById("game"), c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
  function fit() { const s = Math.min(innerWidth / GW, (innerHeight - 40) / GH); const k = s >= 1 ? Math.max(1, Math.floor(s * 2) / 2) : s; cv.style.width = GW * k + "px"; cv.style.height = GH * k + "px"; }
  addEventListener("resize", fit); fit();
  // Load a district into the current run. Score, kills and Overclock carry across a breach.
  function enterDistrict(key) {
    G.district = key; G.mapKey = chooseMap(key); G.grid = buildGrid(MAPS[G.mapKey], false); G.base = renderMap(G.mapKey, false, SP, G.grid); G.dirty = false; G.perch = perchSpot(); G.gapTiles = gapTiles();
    const ps = playerStart(); if (!G.p) { G.p = newPlayer(ps.x, ps.y); applyLoadout(G.p, true); } else { Object.assign(G.p, { x: ps.x, y: ps.y, trail: [], dash: 0, iframes: .5 }); applyLoadout(G.p, false); }
    Object.assign(G, { en: [], bul: [], pending: [], parts: [], blasts: [], zaps: [], tracers: [], pings: [], dStart: G.kills, phase2: false, tram: null, wind: null, collapse: null,
      boss: false, oc: null, hexed: 0, trace: 0, anchor: null, crateHp: {}, spawnT: 1.5 });
    G.heat = G.heatBase; G.lastHeat = G.heat; G.mult = 1 + G.heat * .5;
    G.banner = { txt: mapName() + " · SURVIVE TO 100", col: COL.cyan, life: 2.4 };
    spawnNests();
  }
  function reset(key) { Object.assign(G, { p: null, runScrip: 0, kills: 0, score: 0, time: 0, texts: [], shake: 0, hitstop: 0, flash: 0, flowT: 0, heatBase: key === "rookery" ? 1 : /^x\d+$/.test(key) ? 2 : 0 }); enterDistrict(key); }
  function music() { AU.setOC(false); AU.start(); AU.setHeat(Math.min(5, G.heat + 2)); setTimeout(() => AU.ambience(D().amb), 60); }
  const leaveCampaign = () => Object.assign(G, { camp: null, rules: null, chapMap: null, radioQ: [], stall: null, gates: null, shard: null, flood: null, dropName: null, god: false });
  function start(key, sameSeed) { leaveCampaign(); if (key === "endless") key = "x3"; G.startDistrict = key; if (!sameSeed) { G.runSeed = G.queuedSeed != null ? G.queuedSeed : PG.randomSeed(); G.queuedSeed = null; } resetEndless(); reset(key); G.mode = "play"; G.paused = false; AU.init(); BANK.attach(); music(); buildFlow(); }
  function breach() { const next = getDist(D().next); G.heatBase = Math.min(4, Math.min(2, G.heat) + Math.floor(Math.max(0, next.n - 2) / 2)); enterDistrict(D().next); G.mode = "play"; music(); buildFlow(); AU.sfx("ocIn"); }
  function cashOut() { persist(); AU.stop(); AU.ambience("off"); leaveCampaign(); G.mode = "title"; reset(DORDER[G.sel || 0]); }
  Object.assign(RUN, { reset, music });
  const toCamp = () => { persist(); AU.stop(); AU.ambience("off"); openCamp(); };
  const chapActions = { toCamp };
  const bodyActions = { back: () => { persist(); G.mode = "title"; G.menuMode = null; } };
  const shopActions = {
    jackIn: () => { persist(); const f = G.shop.from; if (f === "clear") breach(); else if (f === "campNext") startChapter(G.camp.n + 1); else if (f === "campRetry") startChapter(G.camp.n, true); else start(DORDER[G.sel || 0]); },
    back: () => { persist(); const f = G.shop.from; if (f === "clear") G.mode = "clear"; else if (f === "campNext") G.mode = "chap"; else if (f === "campRetry") toCamp(); else { G.mode = "title"; AU.stop(); AU.ambience("off"); } },
  };
  function step(rdt, t) {
    if (G.mode === "play" || G.mode === "shop" || G.mode === "intro" || G.mode === "body" || G.mode === "talk") G.menuMode = null; // menus always reopen on their first option
    const wantStart = hit("lmb") || hit("r") || hit(" ");
    if (G.mode === "title") {
      const n = Math.min(DORDER.length, G.unlocked || 1); if (hit("arrowleft") || hit("a")) G.sel = Math.max(0, (G.sel || 0) - 1); if (hit("arrowright") || hit("d")) G.sel = Math.min(n - 1, (G.sel || 0) + 1);
      const mapLabel = SAVE.mapMode === "gen" ? (G.queuedSeed != null ? "MAP: SEED " + PG.seedName(G.queuedSeed) : "MAP: GENERATED · NEW EVERY RUN") : "MAP: CLASSIC";
      if (G.titleMsg) { G.titleMsg.life -= rdt; if (G.titleMsg.life <= 0) G.titleMsg = null; }
      // First JACK IN goes through the BODYSHOP so every run has an operative.
      G.menu = layoutMenu([{ label: "CAMPAIGN · NINE NIGHTS OF RAIN", col: COL.amber, act: () => SAVE.char.created ? openCamp() : openBodyshop("create") },
        { label: "ARCADE · JACK IN", act: () => SAVE.char.created ? start(DORDER[G.sel || 0]) : openBodyshop("create") },
        { label: SAVE.char.created ? "BODYSHOP · CHARACTER" : "BODYSHOP · CREATE OPERATIVE", act: () => openBodyshop(SAVE.char.created ? "title" : "create") },
        { label: "MAGPIE'S · CHROME & IRON", col: COL.magenta, act: () => openShop("title") },
        { label: mapLabel, col: COL.amber, act: () => { if (G.queuedSeed != null) G.queuedSeed = null; else SAVE.mapMode = SAVE.mapMode === "gen" ? "classic" : "gen"; persist(); AU.sfx("lock", 2); } }], 189, 10); runMenu(G.menu); return; }
    if (G.mode === "talk") { updateTalk(rdt); return; }
    if (G.mode === "camp") { updateCamp(rdt); return; }
    if (G.mode === "chap") { updateChap(rdt, chapActions); return; }
    if (G.mode === "shop") { updateShop(rdt, shopActions); return; }
    if (G.mode === "body") { updateBodyshop(rdt, bodyActions); return; }
    if (G.mode === "dead") { G.deadT += rdt; G.menu = null;
      if (G.deadT > .8 && G.camp) { const retry = () => startChapter(G.camp.n, true);
        if (hit("r")) retry(); else if (hit("escape")) toCamp();
        else { G.menu = layoutMenu([{ label: "RETRY " + chLabel(G.camp.n), act: retry }, { label: "MAGPIE'S · RE-GEAR", col: COL.magenta, act: () => openShop("campRetry") }, { label: "CAMPAIGN MENU", col: COL.dim, act: toCamp }], 170); runMenu(G.menu); } }
      else if (G.deadT > .8) { const regear = () => { G.sel = DORDER.indexOf(/^x\d+$/.test(G.startDistrict) ? "endless" : G.startDistrict); openShop("title"); };
        const retrySame = () => start(G.startDistrict, true);
        if (hit("r")) { start(G.startDistrict); } else if (hit("escape")) { regear(); return; }
        else { G.menu = layoutMenu([{ label: G.mapKey === "run" ? "REBOOT · NEW MAP" : "REBOOT", act: () => start(G.startDistrict) }].concat(G.mapKey === "run" ? [{ label: "RETRY SAME MAP", act: retrySame }] : [], [{ label: "MAGPIE'S · RE-GEAR", col: COL.magenta, act: regear }, { label: "QUIT TO TITLE", col: COL.dim, act: cashOut }]), 170); runMenu(G.menu); } } }
    if (G.mode === "clear") { G.clearT += rdt; G.menu = null;
      if (G.clearT > 1) { if (hit("escape")) { cashOut(); return; }
        G.menu = layoutMenu(D().next ? [{ label: "BREACH NOW", act: breach }, { label: "MAGPIE'S, THEN BREACH", col: COL.magenta, act: () => openShop("clear") }, { label: "CASH OUT", col: COL.dim, act: cashOut }]
          : [{ label: "RETURN TO TITLE", act: cashOut }, { label: "MAGPIE'S", col: COL.magenta, act: () => { cashOut(); openShop("title"); } }], 176); runMenu(G.menu); }
      return; }
    if (G.mode === "intro") { G.introT += rdt; if (G.introT > 3) { G.mode = "play"; if (D().boss === "augur") augurShuffle(spawnEnemy("augur", GW / 2, 100)); else if (D().boss === "ferryman") spawnFerryman(); else spawnEnemy("blackwing", G.p.x, G.p.y); } return; }
    if (G.mode === "play") {
      if (hit("p") || hit("escape")) G.paused = !G.paused; if (G.paused) { if (hit("lmb")) G.paused = false; return; }
      if (G.hitstop > 0) { G.hitstop -= rdt; return; }
    }
    const dt = G.oc ? rdt * .12 : rdt;
    if (G.mode === "play") { G.time += rdt; updatePlayer(dt, rdt); if (G.oc) updateOC(rdt); G.flowT -= dt; if (G.flowT <= 0) { buildFlow(); G.flowT = .25; }
      updateDirector(dt); campTick(dt); updateRadio(rdt); updateTram(dt); updateWind(dt); updateCollapse(dt); updateTrace(dt); G.hexed = Math.max(0, G.hexed - dt); }
    for (const e of G.en) if (e.alive) updateEnemy(e, dt);
    G.en = G.en.filter(e => e.alive);
    updateBullets(dt);
    for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= .96; q.life -= dt; } G.parts = G.parts.filter(q => q.life > 0);
    for (const q of G.texts) { q.y -= 14 * rdt; q.life -= rdt; } G.texts = G.texts.filter(q => q.life > 0);
    [G.blasts, G.zaps, G.tracers, G.pings].forEach(a => a.forEach(o => o.life -= rdt)); G.blasts = G.blasts.filter(o => o.life > 0); G.zaps = G.zaps.filter(o => o.life > 0); G.tracers = G.tracers.filter(o => o.life > 0); G.pings = G.pings.filter(o => o.life > 0);
    if (G.banner) { G.banner.life -= rdt; if (G.banner.life <= 0) G.banner = null; }
    G.shake = Math.max(0, G.shake - rdt * 20); G.flash -= rdt; if (G.kick) G.kick.t -= rdt;
    if (G.dirty) { G.base = renderMap(G.mapKey, false, SP, G.grid); G.dirty = false; }
  }
  function draw(t) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    if (G.mode === "title") return drawTitle(c, t);
    if (G.mode === "shop") return drawShop(c, t);
    if (G.mode === "body") return drawBodyshop(c, t);
    if (G.mode === "talk") return drawTalk(c, t);
    if (G.mode === "camp") return drawCamp(c, t);
    if (G.mode === "chap") return drawChap(c, t);
    drawWorld(c, t);
    if (G.oc) drawOC(c, t);
    if (G.mode === "play" || G.mode === "intro") drawHUD(c, t);
    if (G.mode === "dead") drawDead(c, t);
    if (G.mode === "intro") drawIntro(c, t);
    if (G.mode === "clear") drawClear(c, t);
    if (G.mode === "play" && G.paused) drawPause(c);
  }
  let last = 0;
  function frame(t) { const rdt = Math.min(.05, (t - last) / 1000 || 0); last = t; pollPad(rdt); step(rdt, t); G.pressed.clear(); draw(t); requestAnimationFrame(frame); }
  setupInput(cv);
  G.best = SAVE.best || 0; G.unlocked = SAVE.unlocked || 1;
  const qs = location.hash.match(/district=(\w+)/);
  if (location.hash.includes("testchar")) SAVE.char.created = true; // automated tests skip character creation
  if (location.hash.includes("classic")) SAVE.mapMode = "classic"; // e.g. #classic or #autostart-classic: play the hand-made maps
  // Shared seed links: #seed-ABC123 or #seed-ABC123-rookery queue that map for the next run.
  const sq = location.hash.match(/^#seed-([0-9a-z]{1,6})(?:-(\w+))?$/i); if (sq) { G.queuedSeed = PG.parseSeed(sq[1]); SAVE.mapMode = "gen"; if (sq[2] && DORDER.indexOf(sq[2].toLowerCase()) >= 0 && DORDER.indexOf(sq[2].toLowerCase()) < (G.unlocked || 1)) G.sel = DORDER.indexOf(sq[2].toLowerCase()); }
  const fonts = Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('32px "Silkscreen"'), document.fonts.load('700 44px "Chakra Petch"')]), new Promise(r => setTimeout(r, 2500))]);
  BANK.build(); fonts.then(() => { updateHelp(); buildSprites(); reset("market"); G.mode = "title"; if (location.hash.startsWith("#autostart")) start(qs ? qs[1] : "market");
    const cq = location.hash.match(/chapter-(\d)/); if (cq && CHAPTERS[+cq[1]]) { SAVE.camp.cur = Math.max(SAVE.camp.cur, +cq[1]); startChapter(+cq[1], location.hash.includes("nobrief")); } requestAnimationFrame(frame); });
  window.__G = G;
})();
