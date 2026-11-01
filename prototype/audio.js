/* MURDER.EXE audio sketch: Web Audio synth SFX, district ambience beds, and a Heat-driven music sequencer. */
"use strict";
const AU = (() => {
  let ctx, master, sfx, music, amb, busLP, noiseBuf, delay;
  let voices = 0; const MAX_VOICES = 90; // sound pieces playing at once; past this, new effects are skipped so the audio thread keeps up
  const voice = n => { voices++; n.addEventListener("ended", () => { voices--; }); return n; };
  const A = { heat: 1, oc: false, playing: false, onHit: null };
  let volM = 1, volS = 1; // player volume settings (0-1), set from the settings menu
  const applyVol = () => { if (!ctx) return; const t = ctx.currentTime; music.gain.setTargetAtTime(.5 * volM, t, .03); amb.gain.setTargetAtTime(.42 * volM, t, .03); sfx.gain.setTargetAtTime(.9 * volS, t, .03); };
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = .85; master.connect(comp);
    sfx = ctx.createGain(); sfx.gain.value = .9 * volS; sfx.connect(master);
    busLP = ctx.createBiquadFilter(); busLP.type = "lowpass"; busLP.frequency.value = 18000; busLP.Q.value = 2; busLP.connect(master);
    music = ctx.createGain(); music.gain.value = .5 * volM; music.connect(busLP);
    amb = ctx.createGain(); amb.gain.value = .42 * volM; amb.connect(busLP);
    delay = ctx.createDelay(1); delay.delayTime.value = 60 / 132 * .75; const fb = ctx.createGain(); fb.gain.value = .35; const dl = ctx.createBiquadFilter(); dl.type = "lowpass"; dl.frequency.value = 2500;
    delay.connect(dl).connect(fb).connect(delay); dl.connect(music);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // The system can suspend the audio output (a device change, another app taking the sound card). Resume it rather than
    // staying silent until the next run starts.
    const wake = () => { if (ctx.state !== "running" && ctx.state !== "closed" && document.visibilityState === "visible") ctx.resume().catch(() => {}); };
    ctx.addEventListener("statechange", () => setTimeout(wake, 100)); setInterval(wake, 1000);
  }
  const T = () => ctx.currentTime;
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, .0002), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function osc(type, f, t, dur, peak, out = sfx, o = {}) {
    const n = ctx.createOscillator(), g = ctx.createGain(); n.type = type; n.frequency.setValueAtTime(f, t);
    if (o.f2) n.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fT || dur)); if (o.detune) n.detune.value = o.detune;
    voice(n); env(g, t, o.a || .003, peak, dur); let last = n; if (o.through) { n.connect(o.through); last = o.through; } last.connect(g).connect(out); n.start(t); n.stop(t + (o.a || .003) + dur + .05); return n;
  }
  function noise(t, dur, peak, out = sfx, o = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = o.type || "bandpass";
    fl.frequency.setValueAtTime(o.f || 1000, t); if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fT || dur)); fl.Q.value = o.q || 1;
    voice(s); const g = ctx.createGain(); env(g, t, o.a || .002, peak, dur); s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 1.5); s.stop(t + (o.a || .002) + dur + .05); return s;
  }
  function pan(x) { const p = ctx.createStereoPanner(); p.pan.value = Number.isFinite(x) ? x : 0; p.connect(sfx); return p; }
  function shaper(k) { const ws = ctx.createWaveShaper(), n = 1024, cu = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; cu[i] = (1 + k) * x / (1 + k * Math.abs(x)); } ws.curve = cu; return ws; }
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function caw(t, out = sfx, p = 1, vol = .45) {
    const src = ctx.createOscillator(); src.type = "sawtooth"; src.frequency.setValueAtTime(700 * p, t); src.frequency.linearRampToValueAtTime(820 * p, t + .05); src.frequency.exponentialRampToValueAtTime(480 * p, t + .26);
    const am = ctx.createGain(); am.gain.value = .6; const lfo = ctx.createOscillator(); lfo.type = "square"; lfo.frequency.value = 42; const lg = ctx.createGain(); lg.gain.value = .4; lfo.connect(lg).connect(am.gain);
    const f1 = ctx.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = 1400 * p; f1.Q.value = 5; const f2 = ctx.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = 2700 * p; f2.Q.value = 6;
    const g = ctx.createGain(); env(g, t, .012, vol, .27); src.connect(am); am.connect(f1).connect(g); am.connect(f2).connect(g); g.connect(out);
    src.start(t); lfo.start(t); src.stop(t + .35); lfo.stop(t + .35); noise(t, .12, vol * .25, out, { f: 2200, q: 2 });
  }
  function kestrel(t, out = sfx) {
    noise(t, .14, .9, out, { type: "lowpass", f: 7000, f2: 350 }); noise(t, .03, .5, out, { type: "highpass", f: 3500 });
    osc("sine", 170, t, .2, .95, out, { f2: 38 }); osc("square", 95, t, .06, .2, out, { f2: 50 });
    noise(t + .02, .6, .07, out, { f: 900, f2: 250, q: .7 }); caw(t + .005, out, 1.4, .05);
  }
  const SFX = {
    kestrel: () => kestrel(T()),
    reload: () => { const t = T(); for (let i = 0; i < 6; i++) { osc("square", 2400 - i * 60, t + i * .07, .015, .15); noise(t + i * .07, .02, .2, sfx, { type: "highpass", f: 4000 }); } noise(t + .5, .06, .6, sfx, { f: 1800, q: 3 }); osc("square", 320, t + .5, .05, .3, sfx, { f2: 200 }); },
    lastRound: () => { const t = T(); osc("square", 1760, t, .05, .22); osc("square", 1760, t + .1, .05, .22); osc("square", 2349, t + .2, .08, .18); },
    dash: () => { const t = T(); noise(t, .22, .55, sfx, { f: 400, f2: 6000, q: 2 }); osc("sine", 200, t, .2, .3, sfx, { f2: 1300 }); osc("triangle", 2400, t + .05, .18, .1, sfx, { f2: 3800 }); },
    graze: () => { const t = T(); osc("sine", 2600, t, .14, .22, sfx, { f2: 3500 }); osc("sine", 3900, t + .04, .12, .12); },
    overclock: () => { const t = T(); busLP.frequency.cancelScheduledValues(t); busLP.frequency.setValueAtTime(busLP.frequency.value, t); busLP.frequency.exponentialRampToValueAtTime(450, t + .35);
      osc("sine", 900, t, .7, .4, sfx, { f2: 55 }); noise(t, .08, .45, sfx, { type: "lowpass", f: 300, f2: 5000, a: .4 });
      [.6, .82, 1.5, 1.72].forEach(d => osc("sine", 62, t + d, .16, .9, sfx, { f2: 38 }));
      for (let i = 0; i < 6; i++) osc("square", 1100 * Math.pow(1.122, i), t + .7 + i * .12, .04, .2);
      for (let i = 0; i < 6; i++) kestrel(t + 2.0 + i * .035, pan(-.6 + i * .24));
      busLP.frequency.setValueAtTime(450, t + 2.0); busLP.frequency.exponentialRampToValueAtTime(A.oc ? 450 : 18000, t + 2.5); },
    corvid: () => { const t = T(), p = pan(.5); caw(t, p, 1.15, .5); osc("sine", 2300, t + .25, .55, .14, p, { f2: 500 }); noise(t + .25, .5, .2, p, { f: 3200, f2: 700, q: 3 }); },
    shrike: () => { const t = T(), p = pan(-.4); osc("sawtooth", 110, t, .45, .1, p, { f2: 260, a: .3 }); noise(t + .42, .16, .55, p, { f: 1200, f2: 5000, q: 2 }); osc("triangle", 3200, t + .44, .25, .22, p, { f2: 1100 }); },
    rook: () => { const t = T(), p = pan(.3); osc("sine", 2637, t, .25, .2, p); osc("sine", 3951, t, .2, .1, p);
      for (let i = 0; i < 3; i++) { const s = t + .32 + i * .09; noise(s, .08, .65, p, { type: "lowpass", f: 3200, f2: 300 }); osc("square", 230, s, .06, .3, p, { f2: 80 }); noise(s, .14, .12, p, { f: 1500, q: 6 }); } },
    jackdaw: () => { const t = T(), p = pan(.7); const n = osc("sawtooth", 180, t, .05, .16, p, { f2: 1700, fT: 1.15, a: 1.15 });
      osc("square", 1700, t + 1.15, .08, .22, p); noise(t + 1.25, .3, .95, p, { type: "highpass", f: 2200 }); noise(t + 1.25, .7, .5, p, { type: "lowpass", f: 9000, f2: 180 }); osc("sine", 85, t + 1.25, .45, .95, p, { f2: 28 }); },
    carrion: () => { const t = T(); let s = t; [.4, .3, .22, .16, .12, .09, .07, .06, .05, .05].forEach(g => { osc("square", 1250, s, .04, .22); s += g; });
      const ws = shaper(8); ws.connect(sfx); noise(s, 1.3, 1, ws, { type: "lowpass", f: 3500, f2: 70 }); osc("sine", 75, s, 1, 1, sfx, { f2: 24 });
      for (let i = 0; i < 14; i++) noise(s + .3 + Math.random() * 1, .02, .12, sfx, { type: "highpass", f: 3000 + Math.random() * 3000 }); },
    bulwark: () => { const t = T(); [[523, .9], [1307, .7], [2210, .5], [3170, .35]].forEach(([f, d]) => osc("sine", f, t, d, .16)); noise(t, .03, .4, sfx, { type: "highpass", f: 5000 }); osc("sawtooth", 55, t, .6, .05); },
    hexer: () => { const t = T(); for (let i = 0; i < 16; i++) osc("square", 200 + Math.random() * 2800, t + i * .035, .03, .13); osc("square", 1800, t + .1, .5, .07, sfx, { f2: 90 }); },
    nest: () => { const t = T(); noise(t, .6, .45, sfx, { type: "lowpass", f: 180, f2: 700, q: 8 }); osc("sawtooth", 48, t, .6, .18); [[.6, 1], [.75, 1.2], [.86, .9], [.95, 1.1]].forEach(([d, p]) => caw(t + d, pan(Math.random() - .5), p, .3)); },
    tram: () => { const t = T(); osc("sine", 1975, t, .35, .18); osc("sine", 1975, t + .4, .35, .18);
      noise(t + .5, 2.2, .5, sfx, { f: 250, f2: 600, fT: 1.2, q: .8, a: 1.1 }); const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800; lp.connect(sfx);
      [330, 415, 494].forEach(f => osc("sawtooth", f, t + .9, 1.4, .05, lp, { f2: f * .84, fT: 1.6, a: .5 })); },
    sign: () => { const t = T(); const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 9; bp.connect(sfx); osc("sawtooth", 95, t, .45, .3, bp, { f2: 60 });
      noise(t + .45, .05, .5, sfx, { type: "highpass", f: 3000 }); noise(t + .55, .7, .8, sfx, { type: "lowpass", f: 4500, f2: 250 }); osc("sine", 65, t + .55, .35, .7, sfx, { f2: 30 });
      for (let i = 0; i < 12; i++) osc("square", 3000 + Math.random() * 3000, t + .6 + Math.random() * .7, .01, .1); },
    vent: () => { const t = T(); noise(t, 1.1, .4, sfx, { f: 3500, f2: 1400, q: .7, a: .08 }); },
    circuit: () => { const t = T(); const ws = shaper(20); ws.connect(sfx); osc("sawtooth", 60, t, .7, .35, ws); osc("sawtooth", 61.5, t, .7, .25, ws); for (let i = 0; i < 18; i++) noise(t + Math.random() * .7, .015, .4, sfx, { type: "highpass", f: 2500 }); },
    kill: () => { const t = T(); osc("square", 880, t, .06, .18); osc("square", 1320, t + .06, .14, .18); noise(t, .04, .3, sfx, { type: "highpass", f: 2000 }); },
    milestone: () => { const t = T(); [74, 77, 81, 86].forEach((m, i) => osc("square", mf(m), t + i * .08, .14, .14)); osc("sine", mf(98), t + .32, .6, .08); },
    flatline: () => { const t = T(); osc("sine", 1000, t, .09, .25); osc("sine", 1000, t + .55, .09, .25); const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(8000, t + 1.1); lp.frequency.exponentialRampToValueAtTime(300, t + 3); lp.connect(sfx);
      osc("sine", 1000, t + 1.1, 1.9, .22, lp, { a: .01 }); osc("sawtooth", 400, t + 1.1, .9, .12, sfx, { f2: 30 }); for (let i = 0; i < 10; i++) osc("square", 100 + Math.random() * 1500, t + 1.1 + i * .04, .03, .08); },
  };

  /* Ambience beds */
  let ambNodes = [], ambTimers = [];
  function loopNoise(o) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = o.type; f.frequency.value = o.f; f.Q.value = o.q || .7; const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(o.g, T() + 1.5); s.connect(f).connect(g).connect(amb); s.start(); ambNodes.push(s, g); return { s, f, g }; }
  function loopOsc(type, fr, gv, lpf) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lpf; const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(gv, T() + 1.5); o.connect(f).connect(g).connect(amb); o.start(); ambNodes.push(o, g); return { o, g }; }
  function lfo(param, rate, depth) { const o = ctx.createOscillator(); o.frequency.value = rate; const g = ctx.createGain(); g.gain.value = depth; o.connect(g).connect(param); o.start(); ambNodes.push(o); }
  const every = (lo, hi, fn) => { let id; const go = () => { fn(); id = setTimeout(go, (lo + Math.random() * (hi - lo)) * 1000); ambTimers.push(id); }; id = setTimeout(go, lo * 1000); ambTimers.push(id); };
  /* Rain: a 6s stereo loop built from thousands of individual droplets over a soft brown-noise bed. */
  let rainBuf = null;
  function rainBuffer() {
    if (rainBuf) return rainBuf; const sr = ctx.sampleRate, len = sr * 6, b = ctx.createBuffer(2, len, sr);
    const d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 1.6; }
    const drop = (f, amp, decS) => { const st = Math.random() * len | 0, dec = sr * decS, L = Math.min(len - st, dec * 4 | 0), w = f * TAU / sr, ph = Math.random() * TAU; for (let i = 0; i < L; i++) d[st + i] += Math.sin(ph + i * w) * amp * Math.exp(-i / dec); };
    for (let k = 0; k < 4200; k++) drop(1400 + Math.random() * 5200, Math.pow(Math.random(), 3) * .22, .0015 + Math.random() * .005);
    for (let k = 0; k < 140; k++) drop(180 + Math.random() * 320, .08 + Math.random() * .12, .02 + Math.random() * .025);
    const X = sr * .08 | 0; for (let i = 0; i < X; i++) { const a = i / X; d[i] = d[i] * a + d[len - X + i] * (1 - a); }
    const d2 = b.getChannelData(1), off = len / 2 | 0; for (let i = 0; i < len; i++) d2[i] = d[(i + off) % len];
    return (rainBuf = b);
  }
  function rain(g) {
    const s = ctx.createBufferSource(); s.buffer = rainBuffer(); s.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000; const gg = ctx.createGain(); gg.gain.value = 0; gg.gain.linearRampToValueAtTime(g * .5, T() + 2);
    s.connect(lp).connect(gg).connect(amb); s.start(); ambNodes.push(s, gg); lfo(gg.gain, .07, g * .12);
    every(.12, .7, () => { const t = T(), f = 1500 + Math.random() * 2500; osc("sine", f, t, .03 + Math.random() * .04, .03 * g, P(Math.random() * 1.6 - .8), { f2: f * .85 }); });
  }
  function wind() { const w = loopNoise({ type: "bandpass", f: 500, q: 1.5, g: .3 }); lfo(w.f.frequency, .09, 300); lfo(w.g.gain, .13, .1); }
  function ambience(name) {
    init(); ambNodes.forEach(n => { if (n.gain) { n.gain.cancelScheduledValues(T()); n.gain.setTargetAtTime(0, T(), .3); } else { try { n.stop(T() + 1.5); } catch (e) {} } }); ambTimers.forEach(clearTimeout); ambNodes = []; ambTimers = [];
    if (name === "market") { rain(1); const h = loopOsc("sawtooth", 60, .035, 380); every(.3, 2, () => { h.g.gain.setValueAtTime(.005, T()); h.g.gain.setTargetAtTime(.035, T() + .06, .02); }); const m = loopNoise({ type: "bandpass", f: 480, q: 2, g: .08 }); lfo(m.g.gain, .3, .04);
      every(4, 9, () => { const t = T(); osc("triangle", 1300 + Math.random() * 300, t, .12, .03, amb); }); }
    if (name === "rookery") { wind(); rain(.6); every(6, 12, () => { const t = T(); const o = osc("sine", 700, t, 3.5, .03, amb, { a: 1.2 }); const l = ctx.createOscillator(); l.frequency.value = .7; const lg = ctx.createGain(); lg.gain.value = 180; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + 5); });
      every(3, 7, () => caw(T(), amb, .8 + Math.random() * .3, .06)); }
    if (name === "datacrypt") { const f = loopNoise({ type: "lowpass", f: 170, q: 5, g: .35 }); lfo(f.f.frequency, .5, 15); loopOsc("sawtooth", 50, .05, 300); loopNoise({ type: "highpass", f: 6000, g: .03 });
      every(.6, 2.5, () => { const t = T(); for (let i = 0; i < 1 + Math.random() * 3; i++) osc("square", 2000 + Math.random() * 2500, t + i * .08, .03, .03, amb); }); every(1.5, 4, () => noise(T(), .05, .08, amb, { f: 800, q: 6 })); }
    if (name === "spire") { wind(); rain(1.4); loopOsc("sine", 41, .12, 200);
      every(5, 11, () => { const t = T(); noise(t, .08, .5, amb, { type: "highpass", f: 2000 }); noise(t + .05, 3, .6, amb, { type: "lowpass", f: 500, f2: 50, a: .05 }); osc("sine", 50, t + .05, 2.5, .3, amb, { f2: 28 }); }); }
  }

  /* Music: 132 BPM darksynth in D minor. Sidechained bass and pads, gated snare with reverb, supersaw lead.
     Heat 0 intro → 1 kick + bass → 2 full drums + 16th bass → 3 arp + stabs → 4 lead → 5 crow choir, double hats, rolls. */
  const BPM = 132, SPB = 60 / BPM / 4; let step = 0, nextT = 0, timer = null, M = null;
  const ROOT = [38, 34, 36, 33], CH = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]];
  const LEAD = [[[0, 74, 3], [3, 77, 3], [6, 81, 2], [8, 79, 4], [12, 77, 2], [14, 76, 2]], [[0, 74, 3], [3, 77, 3], [6, 82, 2], [8, 81, 4], [12, 77, 4]],
    [[0, 76, 3], [3, 79, 3], [6, 84, 2], [8, 83, 2], [10, 81, 2], [12, 79, 4]], [[0, 81, 6], [6, 79, 2], [8, 77, 2], [10, 76, 2], [12, 73, 4]]];
  const hit = (layer, t) => A.onHit && setTimeout(() => A.onHit(layer), Math.max(0, (t - T()) * 1000));
  function mInit() {
    if (M) return M; M = {};
    M.out = ctx.createGain(); M.out.gain.value = .9; const clip = shaper(1.2); M.out.connect(clip).connect(music);
    M.pump = ctx.createGain(); M.pump.connect(M.out);
    const sr = ctx.sampleRate, len = sr * 2.4 | 0, ir = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.5); }
    M.verb = ctx.createConvolver(); M.verb.buffer = ir; M.vsend = ctx.createGain(); M.vsend.gain.value = .5; M.vsend.connect(M.verb).connect(M.out);
    return M;
  }
  const filt = (type, f, q = 1) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  function duck(t) { M.pump.gain.cancelScheduledValues(t); M.pump.gain.setValueAtTime(.18, t); M.pump.gain.linearRampToValueAtTime(1, t + SPB * 2.6); }
  function kick(t, v = 1) { const ws = shaper(4); ws.connect(M.out); osc("sine", 170, t, .34, v, ws, { f2: 44, fT: .09 }); noise(t, .012, .45 * v, M.out, { type: "highpass", f: 3500 }); duck(t); }
  function snare(t) { const g = ctx.createGain(); g.connect(M.out); g.connect(M.vsend); [0, .011, .022].forEach((o, i) => noise(t + o, i === 2 ? .2 : .02, .5, g, { f: 1700, q: .8 })); osc("triangle", 210, t, .09, .35, g, { f2: 150 }); }
  function hat(t, open, v = 1) { noise(t, open ? .16 : .03, (open ? .13 : .09) * v, M.out, { type: "highpass", f: 8200 }); }
  function bass(t, m, len, bright) { const lp = filt("lowpass", 200, 7); lp.frequency.setValueAtTime(bright ? 3000 : 1800, t); lp.frequency.exponentialRampToValueAtTime(160, t + len * .9); const ws = shaper(5); lp.connect(ws).connect(M.pump);
    osc("sawtooth", mf(m), t, len, .16, lp, { detune: -12 }); osc("sawtooth", mf(m), t, len, .16, lp, { detune: 12 }); osc("sine", mf(m - 12), t, len, .32, M.pump); }
  function pad(t, chord, len, dark) { const lp = filt("lowpass", dark ? 650 : 1500, 1); lp.connect(M.pump); lp.connect(M.vsend); chord.forEach(m => [-14, -5, 5, 14].forEach(dt => osc("sawtooth", mf(m), t, len, .018, lp, { a: .35, detune: dt }))); }
  function arp(t, m, dark) { const lp = filt("lowpass", dark ? 900 : 3800, 4); lp.connect(M.pump); lp.connect(delay); osc("square", mf(m), t, SPB * .7, .05, lp); osc("sawtooth", mf(m), t, SPB * .7, .03, lp, { detune: 7 }); }
  function supersaw(t, m, len, v, cutoff) { const lp = filt("lowpass", cutoff, 1.5), ws = shaper(3); ws.connect(lp); lp.connect(M.pump); lp.connect(M.vsend); lp.connect(delay);
    [-28, -18, -8, 0, 8, 18, 28].forEach(dt => osc("sawtooth", mf(m), t, len, v, ws, { detune: dt, a: .01 })); osc("square", mf(m - 12), t, len, v * 1.2, ws); }
  function riser(t, len) { noise(t, .02, .25, M.out, { f: 300, f2: 9000, fT: len, q: 3, a: len }); osc("sawtooth", 200, t, .02, .04, M.vsend, { f2: 1600, fT: len, a: len }); }
  function crash(t) { noise(t, 1.6, .22, M.out, { type: "highpass", f: 4500 }); noise(t, 1.2, .2, M.vsend, { type: "highpass", f: 3000 }); }
  function playStep(s, t) {
    mInit(); const bar = (s / 16 | 0) % 4, st = s % 16, H = A.heat, oc = A.oc, chord = CH[bar], r = ROOT[bar];
    if (st === 0) { pad(t, chord, SPB * 16, H < 2); hit(0, t); if (bar === 0 && H >= 2 && s > 0) crash(t); }
    if (H === 0 || oc) { if (st === 0 || st === 3) kick(t, .55); if (st % 2 === 0) arp(t, chord[(st / 2) % 3] + 12, true); return; }
    // drums
    const roll = H >= 5 && bar === 3 && st >= 12;
    if (st % 4 === 0 || roll) { kick(t, roll ? .7 : 1); hit(1, t); }
    if (H >= 2 && (st === 4 || st === 12)) { snare(t); hit(2, t); }
    if (H >= 2) { if (st % 4 === 2) hat(t, true); else if (H >= 3 || st % 2 === 0) hat(t, false, H >= 5 ? 1.2 : .8); }
    if (H >= 5 && st % 2 === 1) hat(t + SPB / 2, false, .6);
    // bass: 8ths at Heat 1, galloping 16ths after
    const pat = [0, 0, 12, 0, 0, 0, 12, 0];
    if (H >= 2 || st % 2 === 0) { bass(t, r + pat[(st >> 1) % 8] * (st % 2 ? 0 : 1), SPB * (H >= 2 ? .9 : 1.8), H >= 4); }
    // arp + stabs
    if (H >= 3) { const seq = [0, 1, 2, 3, 2, 1, 0, 2]; const notes = [...chord, chord[0] + 12].map(m => m + 12); arp(t, notes[seq[st % 8]] + (st >= 8 ? 12 : 0), false); hit(3, t);
      if ([3, 6, 10].includes(st)) chord.forEach(m => supersaw(t, m + 12, SPB * .9, .012, 2600)); }
    // lead
    if (H >= 4) { const n = LEAD[bar].find(x => x[0] === st); if (n) { supersaw(t, n[1], SPB * n[2] * .95, .02, H >= 5 ? 5200 : 3800); hit(4, t); } }
    // risers and choir
    if (H >= 2 && bar === 3 && st === 8) riser(t, SPB * 8);
    if (H >= 5) { if (st === 0 || st === 8) { caw(t, M.vsend, [1, .9, .95, .85][bar], .22); hit(5, t); } if (st === 0) osc("sawtooth", 700, t, SPB * 15, .02, M.vsend, { f2: 1100, fT: SPB * 8, a: .2 }); }
  }
  // A stall (a long frame) would otherwise make the loop play every missed note at once; skip them instead.
  function sched() { if (nextT < T() - .1) { const missed = Math.ceil((T() - nextT) / SPB); step = (step + missed) % 64; nextT += missed * SPB; } while (nextT < T() + .15) { playStep(step, nextT); step = (step + 1) % 64; nextT += SPB; } }

  const P = p => pan(Math.max(-1, Math.min(1, p || 0)));
  Object.assign(SFX, {
    boom: p => { const t = T(), o = P(p), ws = shaper(8); ws.connect(o); noise(t, 1.1, 1, ws, { type: "lowpass", f: 3500, f2: 70 }); osc("sine", 75, t, .9, 1, o, { f2: 24 }); for (let i = 0; i < 10; i++) noise(t + .2 + Math.random() * .8, .02, .12, o, { type: "highpass", f: 3000 + Math.random() * 3000 }); },
    beep: p => osc("square", 1250, T(), .04, .2, P(p)),
    shotE: p => { const t = T(), o = P(p); noise(t, .07, .4, o, { type: "lowpass", f: 3000, f2: 300 }); osc("square", 230, t, .05, .18, o, { f2: 80 }); },
    glint: p => { const t = T(), o = P(p); osc("sine", 2637, t, .2, .15, o); osc("sine", 3951, t, .16, .08, o); },
    charge: p => { const t = T(), o = P(p); osc("sawtooth", 180, t, .05, .14, o, { f2: 1700, fT: 1.15, a: 1.15 }); osc("square", 1700, t + 1.15, .06, .18, o); },
    rail: p => { const t = T(), o = P(p); noise(t, .25, .8, o, { type: "highpass", f: 2200 }); noise(t, .6, .45, o, { type: "lowpass", f: 9000, f2: 180 }); osc("sine", 85, t, .4, .8, o, { f2: 28 }); },
    crouch: p => osc("sawtooth", 110, T(), .4, .1, P(p), { f2: 260, a: .3 }),
    lunge: p => { const t = T(), o = P(p); noise(t, .16, .5, o, { f: 1200, f2: 5000, q: 2 }); osc("triangle", 3200, t + .02, .22, .18, o, { f2: 1100 }); },
    caw: p => caw(T(), P(p), 1 + Math.random() * .25, .3),
    dive: p => { const t = T(), o = P(p); osc("sine", 2300, t, .5, .12, o, { f2: 500 }); noise(t, .45, .16, o, { f: 3200, f2: 700, q: 3 }); },
    door: p => { const t = T(), o = P(p); osc("square", 660, t, .06, .1, o); osc("square", 990, t + .08, .06, .1, o); },
    lock: i => osc("square", 1100 * Math.pow(1.122, i || 0), T(), .04, .2),
    ocIn: () => { const t = T(); osc("sine", 900, t, .6, .35, sfx, { f2: 55 }); noise(t, .08, .4, sfx, { type: "lowpass", f: 300, f2: 5000, a: .3 }); },
    ocFire: n => { const t = T(); for (let i = 0; i < Math.max(1, n); i++) kestrel(t + i * .035, P(-.5 + i * .2)); },
    land: p => { const t = T(), o = P(p); osc("sine", 90, t, .6, 1, o, { f2: 25 }); noise(t, .5, .8, o, { type: "lowpass", f: 1500, f2: 80 }); },
    crate: p => noise(T(), .08, .5, P(p), { f: 900, q: 2 }),
    crateBreak: p => { const t = T(), o = P(p); noise(t, .3, .6, o, { type: "lowpass", f: 2500, f2: 200 }); for (let i = 0; i < 6; i++) noise(t + Math.random() * .2, .03, .3, o, { f: 1500 + Math.random() * 2000, q: 3 }); },
    hackFail: () => osc("square", 200, T(), .12, .15),
    bell: () => { const t = T(); osc("sine", 1975, t, .3, .2); osc("sine", 1975, t + .4, .3, .2); },
    tramRun: () => { const t = T(); noise(t, 1.4, .55, sfx, { f: 250, f2: 600, fT: .7, q: .8, a: .4 }); const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800; lp.connect(sfx); [330, 415, 494].forEach(f => osc("sawtooth", f, t, 1, .05, lp, { f2: f * .84, a: .2 })); },
  });
  const lim = {};
  A.sfx = (k, p) => { if (!ctx || !SFX[k] || voices > MAX_VOICES) return; const n = performance.now(); if (lim[k] && n - lim[k] < 45) return; lim[k] = n; SFX[k](p); };
  A.raw = () => ({ ctx, sfx });
  A.voice = voice; // the sound bank counts its voices too
  A.voices = () => voices;
  A.setSFX = (k, fn) => { SFX[k] = fn; };
  A.has = k => !!SFX[k];
  A.init = init;
  A.setVolumes = (m, s) => { volM = Math.max(0, Math.min(1, +m || 0)); volS = Math.max(0, Math.min(1, +s || 0)); applyVol(); };
  A.play = k => { init(); SFX[k](); };
  A.ambience = ambience;
  A.start = () => { init(); if (A.playing) return; A.playing = true; step = 0; nextT = T() + .1; timer = setInterval(sched, 25); };
  A.stop = () => { A.playing = false; clearInterval(timer); };
  A.setHeat = h => { A.heat = h; };
  A.setOC = on => { A.oc = on; if (!ctx) return; busLP.frequency.cancelScheduledValues(T()); busLP.frequency.setValueAtTime(busLP.frequency.value, T()); busLP.frequency.exponentialRampToValueAtTime(on ? 450 : 18000, T() + .35); if (on) { osc("sine", 900, T(), .6, .3, sfx, { f2: 60 }); } };
  return A;
})();
