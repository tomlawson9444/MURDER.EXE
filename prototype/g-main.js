/* Boot, run reset, fixed-step loop. */
"use strict";
(() => {
  const cv = document.getElementById("game"), c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
  function fit() { const s = Math.min(innerWidth / GW, (innerHeight - 40) / GH); const k = s >= 1 ? Math.max(1, Math.floor(s * 2) / 2) : s; cv.style.width = GW * k + "px"; cv.style.height = GH * k + "px"; }
  addEventListener("resize", fit); fit();
  function reset() {
    G.grid = buildGrid(MAPS.market, false); G.base = renderMap("market", false, SP, G.grid); G.dirty = false;
    G.p = newPlayer(14 * TS + 8, 9 * TS + 12); G.en = []; G.bul = []; G.parts = []; G.texts = []; G.blasts = []; G.zaps = []; G.tracers = []; G.pending = [];
    G.kills = 0; G.score = 0; G.heat = 0; G.lastHeat = 0; G.mult = 1; G.spawnT = 1.5; G.phase2 = false; G.tram = null; G.boss = false; G.oc = null;
    G.shake = 0; G.hitstop = 0; G.flash = 0; G.time = 0; G.flowT = 0; G.crateHp = {}; G.banner = { txt: "SURVIVE TO 100", col: COL.cyan, life: 2 };
  }
  function start() { reset(); G.mode = "play"; G.paused = false; AU.init(); BANK.attach(); AU.setHeat(2); AU.setOC(false); AU.start(); setTimeout(() => AU.ambience("market"), 60); buildFlow(); }
  function step(rdt, t) {
    const wantStart = hit("lmb") || hit("r") || hit(" ");
    if (G.mode === "title") { if (hit("lmb")) start(); return; }
    if (G.mode === "dead") { G.deadT += rdt; if (G.deadT > .8 && wantStart) start(); }
    if (G.mode === "clear") { G.clearT += rdt; if (G.clearT > 1 && hit("lmb")) start(); return; }
    if (G.mode === "intro") { G.introT += rdt; if (G.introT > 3) { G.mode = "play"; spawnEnemy("blackwing", G.p.x, G.p.y); } return; }
    if (G.mode === "play") {
      if (hit("p") || hit("escape")) G.paused = !G.paused; if (G.paused) { if (hit("lmb")) G.paused = false; return; }
      if (G.hitstop > 0) { G.hitstop -= rdt; return; }
    }
    const dt = G.oc ? rdt * .12 : rdt;
    if (G.mode === "play") { G.time += rdt; updatePlayer(dt, rdt); if (G.oc) updateOC(rdt); G.flowT -= dt; if (G.flowT <= 0) { buildFlow(); G.flowT = .25; } updateDirector(dt); updateTram(dt); }
    for (const e of G.en) if (e.alive) updateEnemy(e, dt);
    G.en = G.en.filter(e => e.alive);
    updateBullets(dt);
    for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= .96; q.life -= dt; } G.parts = G.parts.filter(q => q.life > 0);
    for (const q of G.texts) { q.y -= 14 * rdt; q.life -= rdt; } G.texts = G.texts.filter(q => q.life > 0);
    [G.blasts, G.zaps, G.tracers].forEach(a => a.forEach(o => o.life -= rdt)); G.blasts = G.blasts.filter(o => o.life > 0); G.zaps = G.zaps.filter(o => o.life > 0); G.tracers = G.tracers.filter(o => o.life > 0);
    if (G.banner) { G.banner.life -= rdt; if (G.banner.life <= 0) G.banner = null; }
    G.shake = Math.max(0, G.shake - rdt * 20); G.flash -= rdt; if (G.kick) G.kick.t -= rdt;
    if (G.dirty) { G.base = renderMap("market", false, SP, G.grid); G.dirty = false; }
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
  const fonts = Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('32px "Silkscreen"'), document.fonts.load('700 44px "Chakra Petch"')]), new Promise(r => setTimeout(r, 2500))]);
  BANK.build(); fonts.then(() => { updateHelp(); buildSprites(); reset(); G.mode = "title"; if (location.hash === "#autostart") start(); requestAnimationFrame(frame); });
  window.__G = G;
})();
