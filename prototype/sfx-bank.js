/* Rendered SFX bank. Each sound is layered and rendered offline into several variants, then played back
   with small pitch and pan changes. Until the bank is ready, the live synth sounds in audio.js play instead. */
"use strict";
const BANK = (() => {
  const SR = 44100, B = {}; let building = false;
  const rr = (a, b) => a + Math.random() * (b - a);

  function kit(c) {
    const nb = c.createBuffer(1, SR * 2, SR), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const env = (g, t, a, p, d) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(p, .0002), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); };
    const K = {
      gain(v, dest) { const g = c.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; },
      filt(type, f, q = 1, dest) { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; if (dest) n.connect(dest); return n; },
      shaper(k, dest) { const w = c.createWaveShaper(), n = 2048, cu = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; cu[i] = (1 + k) * x / (1 + k * Math.abs(x)); } w.curve = cu; if (dest) w.connect(dest); return w; },
      pan(p, dest) { const n = c.createStereoPanner(); n.pan.value = p; if (dest) n.connect(dest); return n; },
      osc(type, f, t, dur, peak, dest, o = {}) { const n = c.createOscillator(), g = c.createGain(); n.type = type; n.frequency.setValueAtTime(f, t); if (o.f2) n.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fT || dur)); if (o.detune) n.detune.value = o.detune;
        if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg).connect(n.frequency); l.start(t); l.stop(t + dur + .1); }
        env(g, t, o.a || .002, peak, dur); n.connect(g).connect(dest); n.start(t); n.stop(t + (o.a || .002) + dur + .05); return n; },
      noise(t, dur, peak, dest, o = {}) { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; const f = c.createBiquadFilter(); f.type = o.type || "bandpass"; f.frequency.setValueAtTime(o.f || 1000, t);
        if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fT || dur)); if (o.f3) f.frequency.exponentialRampToValueAtTime(o.f3, t + dur); f.Q.value = o.q || 1;
        const g = c.createGain(); env(g, t, o.a || .001, peak, dur); s.connect(f).connect(g).connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + (o.a || .001) + dur + .05); return s; },
      verb(len, decay, wet, dest, er = true) { const n = SR * len | 0, ir = c.createBuffer(2, n, SR);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay) * .5;
          if (er) [.011, .023, .041, .067, .089].forEach((tt, k) => { const i = (tt + ch * .004) * SR | 0; d[i] += (k % 2 ? -1 : 1) * (.7 - k * .1); }); }
        const cv = c.createConvolver(); cv.buffer = ir; const g = K.gain(wet, dest); cv.connect(g); return cv; },
      echo(time, fb, wet, dest) { const d = c.createDelay(1); d.delayTime.value = time; const f = K.gain(fb), lp = K.filt("lowpass", 2200); d.connect(lp).connect(f).connect(d); lp.connect(K.gain(wet, dest)); return d; },
    };
    return K;
  }
  async function render(dur, fn) {
    const c = new OfflineAudioContext(2, Math.ceil(SR * dur), SR);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 6; comp.attack.value = .001; comp.release.value = .12; comp.connect(c.destination);
    const out = c.createGain(); out.connect(comp); fn(kit(c), out); const buf = await c.startRendering();
    let pk = 0; for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); }
    if (pk > 0) { const k = .95 / pk; for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; } }
    return buf;
  }

  /* ---- Recipes ---- */
  const R = {
    kestrel: v => render(1.7, (K, o) => {
      const bus = K.gain(1, o); K.verb(1.5, 3, .5, o); bus.connect(K.verb(1.5, 3, .45, o)); const slap = K.echo(.09 + v * .01, .28, .35, o);
      K.noise(0, .004, .5, bus, { type: "highpass", f: 7000 });
      const t = .004, crack = K.shaper(8, bus); crack.connect(slap); K.noise(t, .016, 1, crack, { type: "highpass", f: 1400 + v * 200 });
      const punch = K.shaper(4, bus); punch.connect(slap); K.noise(t, .055, .95, punch, { f: 1000 + v * 120, q: 1.1 });
      K.osc("sine", 215 + v * 12, t, .17, 1, K.shaper(2.5, bus), { f2: 46, fT: .07 }); K.osc("sine", 55, t, .14, .7, bus);
      K.osc("sine", 3400, t, .045, .2, bus, { f2: 650 }); K.osc("square", 7200, t + .006, .02, .05, bus);
      K.noise(t + .01, .45, .28, bus, { type: "lowpass", f: 2200, f2: 180 });
    }),
    shotE: v => render(1.1, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(1, 3, .35, o));
      const fm = K.osc("sawtooth", 1100 + v * 140, 0, .14, .35, K.filt("lowpass", 4200, 2, bus), { f2: 210 }); K.osc("square", 2200 + v * 200, 0, .05, .12, bus, { f2: 600 });
      K.noise(0, .03, .55, K.shaper(3, bus), { f: 2600, q: 1.5 }); K.osc("sine", 170, 0, .08, .55, bus, { f2: 60 });
    }),
    rail: () => render(2.8, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(2.4, 2.5, .6, o));
      K.noise(0, .02, 1, K.shaper(10, bus), { type: "highpass", f: 1800 }); K.noise(0, .1, .9, K.shaper(5, bus), { f: 900, q: .8 });
      K.osc("sine", 120, 0, .5, 1, K.shaper(3, bus), { f2: 32, fT: .2 }); K.osc("sawtooth", 1900, .01, .7, .2, K.filt("bandpass", 1500, 6, bus), { f2: 300 });
      K.osc("sine", 4200, 0, .35, .12, bus, { f2: 900, vib: [40, 120] });
    }),
    boom: v => render(3.2, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(2.8, 2.2, .55, o));
      K.osc("sine", 90, 0, 1, 1, K.shaper(4, bus), { f2: 24, fT: .6 }); K.noise(0, 1.3, 1, K.shaper(10, bus), { type: "lowpass", f: 5000, f2: 90 });
      K.noise(0, .03, 1, bus, { type: "highpass", f: 2000 });
      for (let i = 0; i < 34; i++) K.noise(.15 + Math.random() * 1.6, .015 + Math.random() * .03, rr(.05, .25), K.pan(rr(-.8, .8), bus), { f: rr(1500, 6000), q: 3 });
      for (let i = 0; i < 9; i++) K.osc("sine", rr(3000, 6500), .3 + Math.random() * 1.2, rr(.06, .2), rr(.04, .1), K.pan(rr(-.9, .9), bus));
    }),
    impactWall: v => render(1, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(.8, 3, .3, o));
      K.noise(0, .006, .9, K.shaper(5, bus), { type: "highpass", f: 2600 }); K.noise(.002, .13, .45, bus, { f: 1100, q: .7 });
      for (let i = 0; i < 5; i++) K.noise(.02 + Math.random() * .15, .008, rr(.1, .3), bus, { f: rr(2000, 5000), q: 4 });
      if (v % 2) K.osc("sine", rr(2800, 3600), .01, .4, .14, K.pan(rr(-.6, .6), bus), { f2: rr(1500, 2000), vib: [rr(25, 40), 70] });
    }),
    impactMetal: v => render(1.2, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(1, 3, .3, o)); const b = 800 + v * 90;
      [[1, .5, .5], [2.37, .35, .35], [4.12, .22, .25], [5.9, .15, .15]].forEach(([k, d, p]) => K.osc("sine", b * k, 0, d, p * .5, bus));
      K.noise(0, .04, .7, K.shaper(4, bus), { f: 3200, q: 1.5 }); if (v % 2 === 0) K.osc("sine", 3300, .01, .35, .12, bus, { f2: 1800, vib: [32, 80] });
    }),
    hit: v => render(1.3, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(1.2, 3, .35, o));
      K.osc("sine", 130 + v * 10, 0, .12, 1, K.shaper(3, bus), { f2: 48 }); K.noise(0, .09, .75, K.shaper(4, bus), { type: "lowpass", f: 900, f2: 300 });
      K.noise(.005, .3, .3, bus, { type: "highpass", f: 5200 }); for (let i = 0; i < 7; i++) K.osc("sine", rr(3500, 7000), .01 + Math.random() * .25, rr(.05, .14), .07, K.pan(rr(-.7, .7), bus));
      for (let i = 0; i < 6; i++) K.osc("square", rr(150, 900), .02 + i * .011, .01, .12, bus);
      K.osc("square", 1320, .05, .07, .12, bus); K.osc("square", 1980, .1, .1, .1, bus);
    }),
    dash: v => render(1, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(.9, 3, .25, o)); const p = K.pan(-.6, bus); p.pan.linearRampToValueAtTime(.6, .22);
      K.noise(0, .22, .8, p, { f: 260, f2: 3800, fT: .09, f3: 800, q: 1.6, a: .05 }); K.noise(0, .16, .3, p, { type: "highpass", f: 6000, a: .04 });
      K.osc("sine", 380, 0, .13, .25, bus, { f2: 2600 }); K.osc("sine", 1200 + v * 200, .02, .1, .1, bus, { f2: 4200, vib: [60, 300] });
      [0, .035, .07].forEach(t => K.noise(t, .02, .2, bus, { type: "lowpass", f: 1300 }));
      K.noise(.2, .08, .4, bus, { type: "lowpass", f: 700 }); K.noise(.205, .1, .22, bus, { f: 2600, q: 2 });
    }),
    graze: v => render(.6, (K, o) => {
      const p = K.pan(v % 2 ? -.7 : .7, o); p.pan.linearRampToValueAtTime(v % 2 ? .7 : -.7, .2);
      K.noise(0, .2, .6, p, { f: 5200, f2: 1100, q: 6, a: .04 }); K.osc("sine", 2600, 0, .17, .14, p, { f2: 1300 }); K.osc("sine", 5200, .02, .1, .06, o);
    }),
    reload: () => render(1.4, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(.6, 3, .15, o)); const clack = (t, f, p) => { K.noise(t, .025, p, K.shaper(3, bus), { f, q: 4 }); K.osc("square", f / 4, t, .015, p * .4, bus); };
      clack(0, 2200, .7);
      for (let i = 0; i < 6; i++) { const t = .12 + i * .03 + Math.random() * .03, f = rr(3600, 5600); K.osc("sine", f, t, .08, .22, K.pan(rr(-.5, .5), bus)); K.osc("sine", f * 1.01, t + .07, .05, .1, bus); }
      clack(.62, 900, .8); K.noise(.63, .05, .4, bus, { type: "lowpass", f: 400 }); clack(.73, 2600, .4);
      K.noise(.9, .012, .9, K.shaper(6, bus), { type: "highpass", f: 3000 }); K.osc("sine", 700, .9, .04, .5, bus, { f2: 300 });
      for (let i = 0; i < 6; i++) clack(.96 + i * .022, 4200, .18);
    }),
    ocIn: () => render(2, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(2.4, 2, .6, o));
      K.noise(0, .02, .7, bus, { type: "lowpass", f: 180, f2: 6000, fT: .38, a: .38 });
      K.osc("sawtooth", 900, .05, .8, .22, K.filt("lowpass", 2400, 3, bus), { f2: 45 }); K.osc("sawtooth", 905, .05, .8, .18, K.filt("lowpass", 2400, 3, bus), { f2: 47 });
      K.osc("sine", 70, .38, .9, 1, K.shaper(3, bus), { f2: 28 });
      [.75, .98].forEach(t => K.osc("sine", 64, t, .16, .8, bus, { f2: 38 }));
    }),
    ocSnap: () => render(1.6, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(2, 2.5, .55, o));
      K.noise(0, .02, .6, bus, { type: "highpass", f: 400, f2: 9000, fT: .12, a: .12 }); K.noise(.12, .02, 1, K.shaper(10, bus), { type: "highpass", f: 1500 });
      K.osc("sine", 160, .12, .5, 1, K.shaper(3, bus), { f2: 35 });
    }),
    lock: () => render(.4, (K, o) => { const bus = K.gain(1, o); bus.connect(K.verb(.5, 3, .2, o)); K.noise(0, .006, .6, bus, { type: "highpass", f: 4000 }); K.osc("square", 1500, .003, .03, .3, K.filt("lowpass", 5000, 2, bus)); K.osc("sine", 3000, .01, .05, .2, bus); }),
    step: v => render(.25, (K, o) => { K.noise(0, .035, .5, K.shaper(2, o), { type: "lowpass", f: 800 + v * 80 }); K.noise(.008, .06, .25, o, { f: 2600 + v * 300, q: 2 }); }),
    // Weapon families for Magpie's wider stock.
    scatter: v => render(1.9, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(1.8, 2.6, .5, o));
      K.noise(0, .09, 1, K.shaper(9, bus), { type: "lowpass", f: 5200, f2: 600 }); K.osc("sine", 110 + v * 8, 0, .3, 1, K.shaper(3, bus), { f2: 30, fT: .12 });
      for (let i = 0; i < 8; i++) K.noise(.005 + Math.random() * .03, .02, rr(.2, .45), K.pan(rr(-.6, .6), bus), { f: rr(1500, 4500), q: 2 });
      K.noise(.06, .5, .25, bus, { type: "lowpass", f: 1400, f2: 120 });
    }),
    smg: v => render(.8, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(.7, 3, .25, o));
      K.noise(0, .012, .9, K.shaper(6, bus), { type: "highpass", f: 2200 + v * 300 }); K.noise(0, .035, .7, bus, { f: 1800, q: 1.2 }); K.osc("sine", 260 + v * 20, 0, .07, .6, bus, { f2: 80 });
    }),
    needle: v => render(.7, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(.6, 3, .2, o));
      K.osc("sawtooth", 3800 + v * 300, 0, .06, .3, K.filt("bandpass", 4200, 4, bus), { f2: 1600 }); K.noise(0, .02, .6, bus, { type: "highpass", f: 5000 }); K.osc("sine", 900, 0, .03, .3, bus, { f2: 300 });
    }),
    zap: v => render(1.2, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(1, 3, .4, o));
      for (let i = 0; i < 9; i++) K.noise(i * .012 + Math.random() * .01, .012, rr(.3, .7), K.shaper(6, bus), { f: rr(2000, 7000), q: 5 });
      K.osc("square", 120, 0, .15, .35, K.filt("lowpass", 1800, 3, bus), { f2: 60, vib: [55, 40] }); K.osc("sawtooth", 1600 + v * 200, 0, .2, .2, K.filt("bandpass", 2000, 4, bus), { f2: 400 });
    }),
    cryo: v => render(1.4, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(1.6, 2.5, .55, o));
      K.noise(0, .02, .8, K.shaper(5, bus), { type: "highpass", f: 3000 }); K.osc("sine", 180, 0, .1, .6, bus, { f2: 60 });
      [2637, 3520, 4186].forEach((fq, i) => K.osc("sine", fq * (1 + v * .02), .01 + i * .025, .35, .12, K.pan(-.4 + i * .4, bus)));
    }),
    thump: v => render(1.6, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(1.2, 3, .35, o));
      K.osc("sine", 140, 0, .18, 1, K.shaper(3, bus), { f2: 45 }); K.noise(0, .05, .7, bus, { type: "lowpass", f: 900 }); K.noise(.03, .45, .3, bus, { f: 600, f2: 2600, q: 2, a: .05 });
    }),
    flame: v => render(1, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(.8, 3, .3, o));
      K.noise(0, .22, .8, K.shaper(3, bus), { type: "lowpass", f: 1800 + v * 200, f2: 500, a: .02 }); K.noise(0, .15, .3, bus, { type: "highpass", f: 3500, a: .02 }); K.osc("sine", 70, 0, .2, .4, bus);
    }),
    wisp: v => render(1.6, (K, o) => {
      const bus = K.gain(1, o); bus.connect(K.verb(2.2, 2, .7, o));
      K.osc("sine", 880 + v * 40, 0, .5, .3, bus, { f2: 1320, vib: [7, 30], a: .03 }); K.osc("triangle", 440, 0, .4, .2, bus, { f2: 660 }); K.noise(0, .3, .15, bus, { f: 3000, f2: 6000, q: 3, a: .05 });
    }),
    crateBreak: v => render(1, (K, o) => { const bus = K.gain(1, o); bus.connect(K.verb(.8, 3, .25, o)); K.noise(0, .15, .9, K.shaper(5, bus), { f: 700, q: 1 }); for (let i = 0; i < 12; i++) K.noise(Math.random() * .3, .02, rr(.15, .4), bus, { f: rr(800, 3000), q: 3 }); K.osc("sine", 110, 0, .12, .7, bus, { f2: 50 }); }),
  };
  const VARIANTS = { scatter: 2, smg: 3, needle: 2, zap: 2, cryo: 2, thump: 2, flame: 2, wisp: 2, kestrel: 4, shotE: 3, rail: 1, boom: 2, impactWall: 4, impactMetal: 3, hit: 3, dash: 3, graze: 2, reload: 1, ocIn: 1, ocSnap: 1, lock: 1, step: 4, crateBreak: 2 };

  function play(k, o = {}) {
    const list = B[k]; if (!list) return false; const { ctx, sfx } = AU.raw();
    const s = ctx.createBufferSource(); s.buffer = list[Math.random() * list.length | 0]; s.playbackRate.value = (o.rate || 1) * rr(.96, 1.04);
    const g = ctx.createGain(); g.gain.value = o.vol == null ? 1 : o.vol; const p = ctx.createStereoPanner(); p.pan.value = Number.isFinite(o.pan) ? Math.max(-1, Math.min(1, o.pan)) : 0;
    AU.voice(s); s.connect(g).connect(p).connect(sfx); s.start(ctx.currentTime + (o.at || 0)); return true;
  }
  function hook() {
    const wrap = (key, fn) => AU.setSFX(key, fn);
    wrap("kestrel", () => play("kestrel", { vol: .85 }));
    wrap("shotE", p => play("shotE", { pan: p, vol: .5 }));
    wrap("rail", p => play("rail", { pan: p, vol: .9 }));
    wrap("boom", p => play("boom", { pan: p, vol: 1 }));
    wrap("land", p => play("boom", { pan: p, vol: .9, rate: .7 }));
    wrap("impactWall", p => play("impactWall", { pan: p, vol: .35 }));
    wrap("impactMetal", p => play("impactMetal", { pan: p, vol: .35 }));
    wrap("kill", p => play("hit", { pan: p, vol: .7 }));
    wrap("dash", () => play("dash", { vol: .6 }));
    wrap("graze", () => play("graze", { vol: .55 }));
    wrap("reload", () => play("reload", { vol: .6 }));
    wrap("ocIn", () => play("ocIn", { vol: .8 }));
    wrap("lock", i => play("lock", { vol: .55, rate: Math.pow(1.122, i || 0) }));
    wrap("ocFire", n => { for (let i = 0; i < Math.max(1, n); i++) play("kestrel", { vol: .8, at: i * .035, pan: -.5 + i * .2 }); play("ocSnap", { vol: .9 }); });
    wrap("step", p => play("step", { pan: p, vol: .16 }));
    wrap("crateBreak", p => play("crateBreak", { pan: p, vol: .5 }));
    wrap("crate", p => play("impactWall", { pan: p, vol: .3, rate: .7 }));
    // Every sidearm gets its own voice: a sound family plus pitch and volume.
    for (const id in GUN_SFX) { const [k, rate, vol, extra] = GUN_SFX[id]; wrap("gun_" + id, () => { play(k, { rate, vol }); if (extra) play(extra[0], { rate: extra[1], vol: extra[2], at: extra[3] || 0 }); }); }
  }
  const ORDER = [["kestrel", "dash", "hit", "impactWall", "shotE"], ["impactMetal", "graze", "reload", "step", "lock", "ocIn", "ocSnap"], ["boom", "rail", "crateBreak"], ["scatter", "smg", "needle", "zap", "cryo", "thump", "flame", "wisp"]];
  // gun id: [sound, pitch, volume, optional extra layer [sound, pitch, volume, delay]]
  const GUN_SFX = {
    kestrel: ["kestrel", 1, .85], breacher: ["scatter", 1.1, .8], coil: ["kestrel", 1.25, .7, ["impactMetal", 1.6, .25]], hornet: ["smg", 1, .55], rail: ["rail", 1, .9],
    duster: ["scatter", .85, .95], fanhammer: ["kestrel", 1.12, .6], tripletap: ["smg", .8, .7], needler: ["needle", 1, .45], cryo: ["cryo", 1, .7], magnum: ["kestrel", .72, 1, ["boom", 2.2, .25]],
    arccaster: ["zap", 1, .7], splitter: ["kestrel", 1.2, .7, ["needle", .8, .25, .1]], pinball: ["smg", 1.25, .5, ["impactMetal", 2, .12]], longbow: ["rail", .8, 1], pipe: ["thump", 1, .9], wisp: ["wisp", 1, .6],
    harpoon: ["rail", .62, 1, ["impactMetal", .7, .35]], bellows: ["flame", 1, .5], repeater: ["kestrel", 1.05, .75], wasp: ["thump", 1.35, .7, ["wisp", 1.6, .2]], requiem: ["kestrel", .85, .8, ["shotE", .6, .25]],
  };
  async function build() {
    if (building) return; building = true; const t0 = performance.now();
    for (const group of ORDER) await Promise.all(group.map(async k => { const list = await Promise.all(Array.from({ length: VARIANTS[k] }, (_, v) => R[k](v))); B[k] = list; }));
    if (AU.raw().ctx) hook(); BANK.ready = true; BANK.ms = Math.round(performance.now() - t0);
  }
  function attach() { if (BANK.ready) hook(); }
  return { build, play, attach, ready: false, _B: B };
})();
