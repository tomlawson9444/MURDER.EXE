/* Map Lab: generate, inspect and share procedural district maps. */
"use strict";
(() => {
  const PLAY_URL = "index.html"; // where "Play this map" links go
  const NAMES = { market: "Rain Market", rookery: "Chrome Rookery", datacrypt: "Datacrypt", spire: "Spire Zero", endless: "Endless" }, PLAYABLE = new Set(["market", "rookery", "endless"]);
  const $ = s => document.querySelector(s), st = { dist: "endless", view: "art", phase: 1, maps: [] };
  let SPL = null;

  // Endless cards use the same derivation as the game (run seed → district 3), so "Play this map" reproduces them exactly.
  function build(base, seed, i) {
    const key = "lab" + i, e = base === "endless" ? PG.endless(seed, 3) : null, m = e ? PG.generate(e.style, e.seed, key) : PG.generate(base, seed, key);
    return { key, base, seed, m, style: e && e.style, r1: renderMap(key, false, SPL), r2: renderMap(key, true, SPL) };
  }
  function draw(card) {
    const c = card.cv.getContext("2d"), R = st.phase === 2 ? card.r2 : card.r1; c.imageSmoothingEnabled = false;
    c.drawImage(R.C, 0, 0); if (st.view === "tac") drawTactical(c, R);
  }
  function chip(text, cls) { const s = document.createElement("span"); s.className = "chip" + (cls ? " " + cls : ""); s.textContent = text; return s; }
  function cardEl(item) {
    const { m, base, seed } = item, code = PG.seedName(seed), el = document.createElement("article"); el.className = "card";
    const cv = document.createElement("canvas"); cv.width = 480; cv.height = 272; cv.setAttribute("aria-label", `${m.name}, a generated ${NAMES[base]} map, seed ${code}`); el.appendChild(cv);
    const inn = document.createElement("div"); inn.className = "in"; el.appendChild(inn);
    const nm = document.createElement("div"); nm.className = "name"; nm.textContent = m.name; inn.appendChild(nm);
    const S = item.style, meta = document.createElement("div"); meta.className = "meta";
    meta.innerHTML = (S ? `${S.family.toUpperCase()} · ${S.mood.toUpperCase()} MOOD` : NAMES[base].toUpperCase()) + ` · ${m.arch}${m.mirror ? " · MIRRORED" : ""} · SEED <b>${code}</b>`; inn.appendChild(meta);
    if (S) { const ing = document.createElement("div"); ing.className = "chips";
      ing.append(chip("FLOOR: " + S.floor.toUpperCase()), chip("BACKDROP: " + S.backdrop.replace(/([A-Z])/g, " $1").toUpperCase()), chip("HAZARD: " + S.hole.toUpperCase()), chip("WEATHER: " + S.weather.toUpperCase())); inn.appendChild(ing); }
    const chips = document.createElement("div"); chips.className = "chips";
    chips.append(chip("VALID", "ok"), chip(`${m.stats.coverKits} COVER SETS`), chip(`${m.stats.reachPct}% OPEN FLOOR`), chip(`${m.stats.doors} DOORS`), chip(`BUILT IN ${m.stats.ms} MS · ${m.stats.attempts} TRY${m.stats.attempts > 1 ? "S" : ""}`), chip("PHASE 2: " + (m.phaseTxt || "NONE"), "p2"));
    inn.appendChild(chips);
    const act = document.createElement("div"); act.className = "actions";
    const copy = document.createElement("button"); copy.type = "button"; copy.className = "btn"; copy.textContent = "Copy seed";
    copy.addEventListener("click", () => { navigator.clipboard.writeText(code).then(() => { copy.textContent = "Copied " + code; }, () => { copy.textContent = code; }); setTimeout(() => copy.textContent = "Copy seed", 1600); });
    act.appendChild(copy);
    if (PLAYABLE.has(base)) { const a = document.createElement("a"); a.className = "btn primary"; a.href = `${PLAY_URL}#seed-${code.toLowerCase()}-${base}`; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Play this map"; act.appendChild(a); }
    else { const n = document.createElement("span"); n.className = "note"; n.textContent = "Preview: this district isn't playable yet."; act.appendChild(n); }
    inn.appendChild(act);
    item.cv = cv; draw(item); return el;
  }
  function render() { const g = $("#grid"); g.textContent = ""; st.maps.forEach(m => g.appendChild(cardEl(m))); $("#legend").hidden = st.view !== "tac"; }
  function generate() {
    st.maps = Array.from({ length: 6 }, (_, i) => build(st.dist, PG.randomSeed(), i)); render();
  }
  function seg(id, attr, fn) { document.querySelectorAll(`#${id} button`).forEach(b => b.addEventListener("click", () => { document.querySelectorAll(`#${id} button`).forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")); fn(b.dataset[attr]); })); }
  function bench() {
    const t0 = performance.now(); let ok = 0, tries = 0; const N = 200;
    for (let i = 0; i < N; i++) { const e = PG.endless(PG.randomSeed(), 3), m = PG.generate(e.style, e.seed, "bench"); if (m) { ok++; tries += m.stats.attempts; } }
    const ms = performance.now() - t0;
    $("#bench").innerHTML = `<span>LIVE CHECK: <b>${N}</b> MAPS BUILT IN <b>${Math.round(ms)} MS</b></span><span>PASSED THE VALIDATOR: <b>${ok}/${N}</b></span><span>AVERAGE TRIES PER MAP: <b>${(tries / ok).toFixed(1)}</b></span><span>STYLE PARTS: <b>10</b> FAMILIES · <b>6</b> MOODS · <b>10</b> FLOORS · <b>10</b> BACKDROPS · <b>5</b> HAZARDS · <b>8</b> WEATHERS · ANY HUE</span>`;
  }
  async function boot() {
    try { await Promise.race([Promise.all([document.fonts.load('8px "Silkscreen"'), document.fonts.load('700 20px "Chakra Petch"')]), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
    SPL = { nest: sprite(DEFS.nest, { rimL: COL.magenta, rimR: "#6f66b0" }) };
    seg("dist", "d", d => { st.dist = d; generate(); }); seg("view", "v", v => { st.view = v; st.maps.forEach(draw); $("#legend").hidden = v !== "tac"; }); seg("phase", "p", p => { st.phase = +p; st.maps.forEach(draw); });
    $("#gen").addEventListener("click", generate);
    $("#seedform").addEventListener("submit", e => { e.preventDefault(); const s = PG.parseSeed($("#seedin").value); if (s == null) return;
      st.maps = [build(st.dist, s, 0)]; render(); });
    generate(); setTimeout(bench, 50);
  }
  boot();
})();
