/* Page wiring: builds every piece of art and runs one animation loop for visible canvases. */
"use strict";
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => document.querySelector(s);
  const fonts = Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('32px "Silkscreen"'), document.fonts.load('700 48px "Chakra Petch"')]), new Promise(r => setTimeout(r, 2500))]);

  function stage(cvEl, spr, tint, o = {}) {
    const W = cvEl.width, H = cvEl.height, c = cvEl.getContext("2d"); c.imageSmoothingEnabled = false; const r = rngF(spr.w * 31 + spr.h + (o.seed || 0));
    floorTiles(c, W, H, r, { t: 8, base: o.floor || "#3a3456", j: .12, seam: "#24203a", cracks: 2 });
    c.globalCompositeOperation = "multiply"; c.fillStyle = "#4b4670"; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "lighter"; glow(c, W / 2, H * .66, W * .45, tint, .4); glow(c, W * .5, 0, W * .7, "#3b2f7a", .35);
    c.globalCompositeOperation = "source-over";
    const x = Math.round((W - spr.w) / 2), y = Math.round((H - spr.h) / 2) + (o.dy || 0);
    shadowUnder(c, x, y, spr, o.fly); drawSpr(c, spr, x, y);
    return { c, x, y };
  }

  function init() {
    const enemyRim = { rimL: COL.magenta, rimR: "#6f66b0" };
    const SP = {
      vesper: sprite(vesperDef(), { rimR: COL.cyan, rimL: "#7f74c9" }), vesperB: sprite(vesperDef({ bob: -1 }), { rimR: COL.cyan, rimL: "#7f74c9" }),
      run1: sprite(vesperDef({ la: -1, ra: 1, bob: -1 }), { rimR: COL.cyan, rimL: "#7f74c9" }), run2: sprite(vesperDef({ la: 1, ra: -1, bob: -1 }), { rimR: COL.cyan, rimL: "#7f74c9" }),
    };
    ["corvid", "shrike", "rook", "jackdaw", "carrion", "bulwark", "hexer", "nest", "blackwing", "augur", "scarecrow", "corvus"].forEach(k => SP[k] = sprite(DEFS[k], enemyRim));
    SP.kestrel = sprite(DEFS.kestrel, { rimR: COL.cyan }); SP.rail = sprite(DEFS.rail, { rimR: COL.cyan });
    SP.vesperT = tinted(SP.vesper, COL.cyan);
    const anim = []; // {el, draw(t)}

    // Vesper sheet
    const frames = [["Idle", SP.vesper], ["Idle B", SP.vesperB], ["Run A", SP.run1], ["Run B", SP.run2], ["Phase dash", "dash"], ["Overclock", "oc"], ["Fire", "fire"]];
    frames.forEach(([name, s]) => {
      const f = document.createElement("div"); f.className = "frame"; const cvs = mk(44, 46); cvs.className = "px"; cvs.setAttribute("aria-label", "Vesper " + name);
      const spr = typeof s === "string" ? SP.vesper : s; const { c, x, y } = stage(cvs, spr, s === "oc" || s === "dash" ? COL.cyan : "#7f74c9", { seed: name.length });
      if (s === "dash") { c.clearRect(0, 0, 44, 46); stage(cvs, SP.vesper, COL.cyan, { seed: 3 }); c.globalAlpha = .25; c.drawImage(SP.vesperT, x - 12, y); c.globalAlpha = .5; c.drawImage(SP.vesperT, x - 6, y); c.globalAlpha = 1; drawSpr(c, SP.vesper, x, y); }
      if (s === "oc") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x + 13, y + 18, 22, COL.cyan, .45); c.restore(); c.strokeStyle = rgba(COL.cyan, .8); c.beginPath(); c.ellipse(x + 13.5, y + 33.5, 12, 3, 0, 0, TAU); c.stroke(); drawSpr(c, SP.vesper, x, y); }
      if (s === "fire") { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x + 27, y + 21, 10, COL.cyan, .9); c.restore(); c.fillStyle = "#effdff"; c.fillRect(x + 25, y + 20, 5, 3); c.fillRect(x + 27, y + 18, 1, 7); }
      f.appendChild(cvs); const sp = document.createElement("span"); sp.textContent = name; f.appendChild(sp); $("#sheet").appendChild(f);
    });
    [["coat", "Coat"], ["coatIn", "Coat lining"], ["hair", "Hair"], ["skin", "Skin"], ["chrome", "Cyber arm"], ["gun", "Kestrel"]].forEach(([k, n]) => {
      const d = document.createElement("div"); d.className = "ramp"; d.innerHTML = MAT[k].map(h => `<i style="background:${h}"></i>`).join("") + `<b>${n}</b>`; $("#ramps").appendChild(d);
    });

    // Enemies
    const foes = [
      ["corvid", "Corvid Drone", "SWARM · DIVES", "Crow-shaped surveillance drones that circle in flocks, then dive in a straight line. Tell: the red eye flares before a dive. Counter: sidestep and shoot.", COL.red, 1],
      ["shrike", "Shrike", "MELEE · MONOBLADE", "A beak-masked rusher that dashes in to slash, like Kill the Crows' axe crows. Tell: crouches for 0.4s. Counter: dash through it, then shoot its back.", COL.magenta],
      ["rook", "Rook", "GUNNER · 3-ROUND BURST", "A cult gunslinger that fires in bursts and strafes between shots. Tell: magenta muzzle glint. Counter: shoot during the gap between bursts.", COL.magenta],
      ["jackdaw", "Jackdaw", "SNIPER · ARENA EDGE", "A long-range rail sniper. Tell: an amber laser that turns solid before firing. Counter: break line of sight or use Blindspot.", COL.amber],
      ["carrion", "Carrion", "BOMBER · SUICIDE", "A walking battery pack that sprints in and detonates. Tell: blinking amber cells. Counter: Short Circuit it near its allies.", COL.amber],
      ["bulwark", "Bulwark", "SHIELD · FRONT IMMUNE", "Carries a hard-light riot shield that blocks every shot from the front. Counter: flank it with a dash, ricochet a shot, or drop the shield with Short Circuit.", COL.magenta],
      ["hexer", "Hexer", "NETRUNNER · DEBUFF", "A new enemy type. It hacks you, scrambling your HUD and locking Overclock for 3s. Tell: magenta sigils on its chest. Counter: make it your first target.", COL.magenta, 1],
      ["nest", "Nest", "SPAWNER · STATIC", "A wall-mounted node that releases Corvids until it is destroyed. Its armoured core only opens while it is spawning.", COL.red],
    ];
    foes.forEach(([k, name, stat, desc, tint, fly]) => {
      const card = document.createElement("div"); card.className = "card foe art-card"; const cvs = mk(64, 48); cvs.className = "px"; cvs.setAttribute("aria-label", name + " sprite");
      stage(cvs, SP[k], tint, { fly, dy: fly ? -3 : 0 }); card.appendChild(cvs);
      const inn = document.createElement("div"); inn.className = "in"; inn.innerHTML = `<span class="stat">${stat}</span><h3>${name}</h3><p>${desc}</p>`; card.appendChild(inn); $("#foes").appendChild(card);
    });

    // Bosses
    const bosses = [
      ["blackwing", "BLACKWING", "RAIN MARKET · KILL 100", "A cult enforcer in a jump-jet suit. It dives at you, and its thrusters stay exposed for 0.8s after each landing.", COL.amber, "#4a4468"],
      ["augur", "THE AUGUR", "CHROME ROOKERY · KILL 200", "A netrunner who splits into 5 holograms. Only the real one casts a shadow, and Blindspot reveals it.", COL.magenta, "#566082"],
      ["scarecrow", "SCARECROW", "DATACRYPT · KILL 300", "An industrial loader mech. Its cockpit only opens while it vents heat. Turncoat a turret to make it overheat.", COL.red, "#46526e"],
      ["corvus", "CORVUS", "SPIRE ZERO · KILL 400", "The swarm AI. It forms giant shapes out of thousands of drones, and its core is exposed for a single frame at the end of each pattern.", COL.magenta, "#3a3446"],
    ];
    bosses.forEach(([k, name, stat, desc, tint, floor]) => {
      const card = document.createElement("div"); card.className = "card foe art-card"; const cvs = mk(88, 66); cvs.className = "px"; cvs.setAttribute("aria-label", name + " boss sprite");
      const { c, x, y } = stage(cvs, SP[k], tint, { floor, fly: k === "corvus" || k === "augur" });
      if (k === "augur") { c.globalAlpha = .28; c.drawImage(tinted(SP.augur, COL.magenta), x - 26, y + 4); c.drawImage(tinted(SP.augur, COL.magenta), x + 26, y + 4); c.globalAlpha = 1; drawSpr(c, SP.augur, x, y); }
      card.appendChild(cvs); const inn = document.createElement("div"); inn.className = "in"; inn.innerHTML = `<span class="stat">${stat}</span><h3>${name}</h3><p>${desc}</p>`; card.appendChild(inn); $("#bossCards").appendChild(card);
    });

    // Districts (colour script uses the real arena maps)
    const MR = {}; Object.keys(MAPS).forEach(k => { MR[k] = { 1: renderMap(k, false, SP), 2: renderMap(k, true, SP) }; });
    Object.entries(DISTRICTS).forEach(([k, cfg]) => {
      const R = MR[k][1];
      const d = document.createElement("div"); d.className = "district"; const cvs = mk(480, 272); cvs.className = "px"; cvs.setAttribute("aria-label", cfg.name + " arena");
      d.appendChild(cvs); const inn = document.createElement("div"); inn.className = "in";
      inn.innerHTML = `<div class="sw">${cfg.sw.map(h => `<i style="background:${h}"></i>`).join("")}</div><span class="stat">${cfg.kills.toUpperCase()}</span><h3>${cfg.name}</h3><p class="dim">${cfg.desc}</p>`;
      d.appendChild(inn); $("#districtGrid").appendChild(d);
      const c = cvs.getContext("2d");
      anim.push({ el: cvs, draw: t => { c.drawImage(R.C, 0, 0); R.steam.forEach(([x, y]) => steam(c, x, y, t)); drawMapActors(c, R, SP, t); drawRain(c, R, t); } });
    });

    // Map viewer
    const mv = { map: "market", view: "art", phase: 1 }; const mc = $("#mapc").getContext("2d");
    const notes = () => { const n = MAPS[mv.map].notes; $("#mapnotes").innerHTML = [["COVER", n.cover], ["CHOKEPOINTS", n.choke], ["HAZARDS", n.hazard], ["PHASE 2 · KILL 50", n.phase]].map(([k, v], i) => `<div class="card${i === 3 ? " ph" : ""}"><span class="stat">${k}</span><p>${v}</p></div>`).join(""); };
    const drawMV = t => { const R = MR[mv.map][mv.phase]; mc.drawImage(R.C, 0, 0); R.steam.forEach(([x, y]) => steam(mc, x, y, t)); if (mv.view === "tac") drawTactical(mc, R); else { drawMapActors(mc, R, SP, t); drawRain(mc, R, t); } };
    document.querySelectorAll(".mv-bar button").forEach(b => b.addEventListener("click", () => {
      const key = b.dataset.map ? "map" : b.dataset.view ? "view" : "phase"; mv[key] = b.dataset.map || b.dataset.view || +b.dataset.phase;
      b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")); notes(); drawMV(performance.now());
    }));
    notes(); anim.push({ el: $("#mapc"), draw: drawMV });

    // In-game
    const GS = MR.market[1]; const g = $("#game").getContext("2d"); let mode = "combat";
    document.querySelectorAll(".modes button").forEach(b => b.addEventListener("click", () => { mode = b.dataset.mode; document.querySelectorAll(".modes button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")); if (reduce) drawGameFull(0); }));
    const drawGameFull = t => { drawGame(g, SP, GS, mode, t); if (mode !== "flat") drawRain(g, GS, t, mode === "oc" ? 0 : 1); };
    anim.push({ el: $("#game"), draw: drawGameFull });

    // Loadout + boss intro
    stage($("#loVesper"), SP.vesper, COL.cyan);
    document.querySelectorAll("[data-icon]").forEach(el => { const s = SP[el.dataset.icon]; el.width = s.w + 4; el.height = s.h + 4; const c = el.getContext("2d"); drawSpr(c, s, 2, 2, false); });
    (() => { const cv = $("#bossIntro"), c = cv.getContext("2d"); c.imageSmoothingEnabled = false; c.fillStyle = "#0c0712"; c.fillRect(0, 0, 120, 90);
      c.globalCompositeOperation = "lighter"; glow(c, 60, 52, 50, COL.magenta, .35); glow(c, 60, 70, 30, COL.amber, .3); c.globalCompositeOperation = "source-over";
      c.fillStyle = "rgba(255,45,138,.5)"; c.fillRect(0, 76, 120, 1); for (let i = 0; i < 14; i++) c.fillRect(i * 9, 77 + (i % 3), 5, 1);
      shadowUnder(c, 35, 22, SP.blackwing); drawSpr(c, SP.blackwing, 35, 22); reticle(c, 35 + 16, 22 + 32, 4, COL.amber); reticle(c, 35 + 33, 22 + 32, 4, COL.amber); })();

    // Key art
    const ka = $("#ka"), kc = ka.getContext("2d"); let K = null;
    const buildHero = () => { const dpr = Math.min(devicePixelRatio || 1, 2); const W = Math.min(2600, Math.round(ka.clientWidth * dpr)), H = Math.round(ka.clientHeight * dpr); ka.width = W; ka.height = H; K = buildKA(W, H); drawKA(kc, K, 1200); };
    buildHero(); let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(buildHero, 250); });
    anim.push({ el: ka, draw: t => K && drawKA(kc, K, t + 1200) });

    // Steam capsule
    (() => { const cv = $("#capsule"), c = cv.getContext("2d"), Kc = buildKA(920, 430, 21); drawKA(c, Kc, 3000);
      const gr = c.createLinearGradient(0, 0, 520, 0); gr.addColorStop(0, "rgba(5,4,11,.85)"); gr.addColorStop(1, "rgba(5,4,11,0)"); c.fillStyle = gr; c.fillRect(0, 0, 920, 430);
      c.font = '700 104px "Chakra Petch", sans-serif'; c.textBaseline = "alphabetic";
      [[COL.magenta, -4], [COL.cyan, 4], [COL.ink, 0]].forEach(([col, dx]) => { c.fillStyle = col; c.fillText("MURDER", 40 + dx, 300); });
      const w = c.measureText("MURDER").width; c.font = "44px Silkscreen"; c.fillStyle = COL.magenta; c.save(); c.shadowColor = COL.magenta; c.shadowBlur = 16; c.fillText(".EXE", 40, 352); c.restore();
      c.font = "16px Silkscreen"; c.fillStyle = COL.ink; c.fillText("ONE BULLET. ONE LIFE.", 46, 386); })();

    // Palette swatches
    [["Void", "#0a0912", "Ground, 90% of the screen"], ["Signal Cyan", "#2be4ff", "Player, your bullets, your tech"], ["Murder Magenta", "#ff2d8a", "Enemies, hazards, cult glyphs"], ["Telegraph Amber", "#ffb22e", "Incoming attack warnings"], ["Flatline Red", "#ff4545", "Death, kill confirm"], ["Rain Indigo", "#3b3160", "Architecture, enemy bodies"]]
      .forEach(([n, h, u]) => { const d = document.createElement("div"); d.className = "swc"; d.innerHTML = `<i style="background:${h}"></i><div>${n}<br><code>${h}</code><br><span class="dim">${u}</span></div>`; $("#swatches").appendChild(d); });

    // Animation loop, only for canvases on screen
    const vis = new Set(); const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)));
    anim.forEach(a => io.observe(a.el));
    anim.forEach(a => a.draw(1200));
    if (!reduce) { const loop = t => { anim.forEach(a => vis.has(a.el) && a.draw(t)); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }
  fonts.then(init);
})();
