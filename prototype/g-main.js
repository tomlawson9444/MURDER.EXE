/* Boot, run reset, fixed-step loop. */
"use strict";
(() => {
  const cv = document.getElementById("game"), c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
  function fit() { const s = Math.min(innerWidth / GW, (innerHeight - 40) / GH); const k = s >= 1 ? Math.max(1, Math.floor(s * 2) / 2) : s; cv.style.width = GW * k + "px"; cv.style.height = GH * k + "px"; }
  addEventListener("resize", fit); fit();
  // Load a district into the current run. Score, kills and Overclock carry across a breach.
  function enterDistrict(key) {
    G.district = key; G.grid = buildGrid(MAPS[key], false); G.base = renderMap(key, false, SP, G.grid); G.dirty = false;
    const ps = playerStart(); if (!G.p) G.p = newPlayer(ps.x, ps.y); else Object.assign(G.p, { x: ps.x, y: ps.y, ammo: 6, reload: 0, ram: 6, trail: [], dash: 0, iframes: .5 });
    Object.assign(G, { en: [], bul: [], pending: [], parts: [], blasts: [], zaps: [], tracers: [], pings: [], dStart: G.kills, phase2: false, tram: null, wind: null, collapse: null,
      boss: false, oc: null, hexed: 0, trace: 0, anchor: null, crateHp: {}, spawnT: 1.5 });
    G.heat = G.heatBase; G.lastHeat = G.heat; G.mult = 1 + G.heat * .5;
    G.banner = { txt: D().name + " · SURVIVE TO 100", col: COL.cyan, life: 2.4 };
    spawnNests();
  }
  function reset(key) { Object.assign(G, { p: null, kills: 0, score: 0, time: 0, texts: [], shake: 0, hitstop: 0, flash: 0, flowT: 0, heatBase: key === "rookery" ? 1 : 0 }); enterDistrict(key); }
  function music() { AU.setOC(false); AU.start(); AU.setHeat(Math.min(5, G.heat + 2)); setTimeout(() => AU.ambience(D().amb), 60); }
  function start(key) { G.startDistrict = key; reset(key); G.mode = "play"; G.paused = false; AU.init(); BANK.attach(); music(); buildFlow(); }
  function breach() { G.heatBase = Math.min(2, G.heat); enterDistrict(D().next); G.mode = "play"; music(); buildFlow(); AU.sfx("ocIn"); }
  function cashOut() { AU.stop(); AU.ambience("off"); G.mode = "title"; reset(DORDER[G.sel || 0]); }
  function step(rdt, t) {
    const wantStart = hit("lmb") || hit("r") || hit(" ");
    if (G.mode === "title") {
      const n = G.unlocked || 1; if (hit("arrowleft") || hit("a")) G.sel = Math.max(0, (G.sel || 0) - 1); if (hit("arrowright") || hit("d")) G.sel = Math.min(n - 1, (G.sel || 0) + 1);
      if (hit("lmb")) start(DORDER[G.sel || 0]); return; }
    if (G.mode === "dead") { G.deadT += rdt; if (G.deadT > .8 && wantStart) start(G.startDistrict); }
    if (G.mode === "clear") { G.clearT += rdt; if (G.clearT > 1) { if (D().next && hit("lmb")) breach(); else if (hit("escape") || (!D().next && hit("lmb"))) cashOut(); } return; }
    if (G.mode === "intro") { G.introT += rdt; if (G.introT > 3) { G.mode = "play"; if (D().boss === "augur") augurShuffle(spawnEnemy("augur", GW / 2, 100)); else spawnEnemy("blackwing", G.p.x, G.p.y); } return; }
    if (G.mode === "play") {
      if (hit("p") || hit("escape")) G.paused = !G.paused; if (G.paused) { if (hit("lmb")) G.paused = false; return; }
      if (G.hitstop > 0) { G.hitstop -= rdt; return; }
    }
    const dt = G.oc ? rdt * .12 : rdt;
    if (G.mode === "play") { G.time += rdt; updatePlayer(dt, rdt); if (G.oc) updateOC(rdt); G.flowT -= dt; if (G.flowT <= 0) { buildFlow(); G.flowT = .25; }
      updateDirector(dt); updateTram(dt); updateWind(dt); updateCollapse(dt); updateTrace(dt); G.hexed = Math.max(0, G.hexed - dt); }
    for (const e of G.en) if (e.alive) updateEnemy(e, dt);
    G.en = G.en.filter(e => e.alive);
    updateBullets(dt);
    for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= .96; q.life -= dt; } G.parts = G.parts.filter(q => q.life > 0);
    for (const q of G.texts) { q.y -= 14 * rdt; q.life -= rdt; } G.texts = G.texts.filter(q => q.life > 0);
    [G.blasts, G.zaps, G.tracers, G.pings].forEach(a => a.forEach(o => o.life -= rdt)); G.blasts = G.blasts.filter(o => o.life > 0); G.zaps = G.zaps.filter(o => o.life > 0); G.tracers = G.tracers.filter(o => o.life > 0); G.pings = G.pings.filter(o => o.life > 0);
    if (G.banner) { G.banner.life -= rdt; if (G.banner.life <= 0) G.banner = null; }
    G.shake = Math.max(0, G.shake - rdt * 20); G.flash -= rdt; if (G.kick) G.kick.t -= rdt;
    if (G.dirty) { G.base = renderMap(G.district, false, SP, G.grid); G.dirty = false; }
  }
  function draw(t) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    if (G.mode === "title") return drawTitle(c, t);
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
  try { G.best = +localStorage.getItem("murder-best") || 0; } catch (e) { G.best = 0; }
  G.unlocked = DORDER.length; // prototype: every built district is playable from the title screen
  if (location.hash === "#rookery") G.sel = DORDER.indexOf("rookery");
  const qs = location.hash.match(/district=(\w+)/);
  const fonts = Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('32px "Silkscreen"'), document.fonts.load('700 44px "Chakra Petch"')]), new Promise(r => setTimeout(r, 2500))]);
  BANK.build(); fonts.then(() => { updateHelp(); buildSprites(); reset("market"); G.mode = "title"; if (location.hash.startsWith("#autostart")) start(qs ? qs[1] : "market"); requestAnimationFrame(frame); });
  window.__G = G;
})();
