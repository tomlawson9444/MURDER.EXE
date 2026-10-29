/* Sound section wiring: sound board pads and the Heat mixer. */
"use strict";
(() => {
  const $ = s => document.querySelector(s);
  const GROUPS = [
    ["Vesper", [["kestrel", "Kestrel .44 shot", "Dry, loud, centred. Has a faint crow caw layered in."], ["reload", "Cylinder reload", "Six clicks and a snap, 1.4s. You can hear when you're exposed."], ["lastRound", "Last round", "An amber double-tick when one bullet is left."], ["dash", "Phase dash", "Rising shimmer. The i-frames sound bright."], ["graze", "Graze", "A high sparkle when a bullet just misses. Charges Overclock."], ["overclock", "Overclock: DEADLINK", "The mix drops out, heartbeat, six lock ticks, then one crack."]]],
    ["The Murder", [["corvid", "Corvid dive", "Caw, then a falling whistle. Panned right."], ["shrike", "Shrike lunge", "The blade hum pitches up during the 0.4s crouch."], ["rook", "Rook burst", "A glint chime warns you, then three shots."], ["jackdaw", "Jackdaw rail shot", "A 1.2s charge whine, a lock tone, then the crack."], ["carrion", "Carrion detonation", "Beeps speed up to the blast. Count them."], ["bulwark", "Bulwark shield ping", "Metallic ring: your shot hit the front. Flank it."], ["hexer", "Hexer hack", "Data stutter. Your Overclock is locked."], ["nest", "Nest spawn", "Wet mechanical churn, then a burst of caws."]]],
    ["World", [["tram", "Tram pass", "Warning bell, then a rumble and horn with doppler."], ["sign", "Sign drop", "Creak, snap, crash and sparks."], ["vent", "Steam vent", "A hiss that tells you the vent will hide you for a moment."], ["circuit", "Short Circuit", "Distorted buzz with arcing crackles."]]],
    ["UI and stings", [["kill", "Kill confirm", "A two-note chip on every kill."], ["milestone", "Milestone unlocked", "A bright arpeggio over the music."], ["flatline", "Flatline", "ECG beeps, then the long tone."]]],
  ];
  const board = $("#board");
  GROUPS.forEach(([g, pads]) => {
    const wrap = document.createElement("div"); wrap.innerHTML = `<h4>${g}</h4>`; const grid = document.createElement("div"); grid.className = "pads";
    pads.forEach(([k, name, cap]) => { const b = document.createElement("button"); b.type = "button"; b.className = "pad"; b.id = "sfx-" + k; b.innerHTML = `${name}<small>${cap}</small>`;
      b.addEventListener("click", () => { AU.play(k); b.classList.add("fire"); setTimeout(() => b.classList.remove("fire"), 220); }); grid.appendChild(b); });
    wrap.appendChild(grid); board.appendChild(wrap);
  });
  const names = ["Intro pad · Heat 0", "Kick + bass · Heat 1", "Snare + 16th bass · Heat 2", "Arp + stabs · Heat 3", "Supersaw lead · Heat 4", "Crow choir · Heat 5"];
  const lay = $("#mu-layers"); const els = names.map((n, i) => { const d = document.createElement("div"); d.className = "layer"; d.innerHTML = `${n}<i></i>`; lay.appendChild(d); return d; });
  const paint = () => els.forEach((e, i) => e.classList.toggle("on", i <= AU.heat));
  AU.onHit = i => { const e = els[i]; if (!e) return; e.classList.add("hit"); setTimeout(() => e.classList.remove("hit"), 90); };
  const status = () => { $("#mu-status").textContent = `${AU.playing ? "PLAYING" : "STOPPED"} · 132 BPM · D MINOR${AU.oc ? " · OVERCLOCK" : ""}`; };
  $("#mu-play").addEventListener("click", () => { if (AU.playing) { AU.stop(); $("#mu-play").textContent = "Play"; } else { AU.start(); if (!ambOn) { AU.ambience($("#mu-dist").value); ambOn = true; } $("#mu-play").textContent = "Stop"; } status(); });
  let ambOn = false;
  $("#mu-dist").addEventListener("change", e => { AU.ambience(e.target.value); ambOn = true; });
  $("#mu-heat").addEventListener("input", e => { AU.setHeat(+e.target.value); $("#mu-heat-v").textContent = e.target.value; paint(); });
  $("#mu-oc").addEventListener("click", e => { const on = !AU.oc; AU.setOC(on); e.currentTarget.setAttribute("aria-pressed", on ? "true" : "false"); status(); });
  paint();
})();
