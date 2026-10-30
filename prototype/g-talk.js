/* Conversations: portraits, typewriter lines, reply choices (Cold, Sharp, Hard, Ask, plus an origin reply),
   timed choices, trust and Resonance, and the radio chatter shown during play. */
"use strict";
const STYLES = { cold: ["COLD", COL.cyan], sharp: ["SHARP", COL.amber], hard: ["HARD", COL.red], ask: ["ASK", COL.magenta] };
const TRUSTS = [["magpie", "MAGPIE"], ["wren", "WREN"], ["vane", "VANE"], ["dex", "DEX"]];
const FLAG_PAIRS = { freed: "leftThem", leftThem: "freed" };

// Your BODYSHOP name, split for lines like "{LAST}." or "{FIRST}!".
function nameParts() { const n = (SAVE.char.name || "VESPER KADE").trim().split(/\s+/); return { first: n[0], last: n[n.length - 1], name: n.join(" ") }; }
function fillName(s) { const N = nameParts(); return s.replace(/\{FIRST\}/g, N.first).replace(/\{LAST\}/g, N.last).replace(/\{NAME\}/g, N.name); }
const speakerName = w => { const S = SPEAKERS[w]; return typeof S.name === "function" ? S.name() : S.name; };

/* ---- Portraits ---- */
const NPC_LOOKS = {
  vane: { coat: "long", coatCol: "white", lining: "black", hair: "bob", hairCol: "silver", skin: "s1", eyes: "eyes", arm: "none", glow: "amber", trail: "glow", gun: "gold", extra: "none" },
  dex: { coat: "long", coatCol: "graphite", lining: "magenta", hair: "buzz", hairCol: "silver", skin: "s2", eyes: "eyes", arm: "both", glow: "magenta", trail: "glow", gun: "steel", extra: "none" },
  wren: { coat: "jacket", coatCol: "olive", lining: "amber", hair: "mohawk", hairCol: "green", skin: "s4", eyes: "goggles", arm: "none", glow: "lime", trail: "glow", gun: "carbon", extra: "scarf" },
};
function portrait(who) {
  if (who === "you") return SP.vesper;
  if (NPC_LOOKS[who]) return SP["npc_" + who] || (SP["npc_" + who] = previewSprite(NPC_LOOKS[who]));
  if (who === "magpie") shopSprites();
  return SP[who] || null;
}

/* ---- Effects of a choice ---- */
function applyFx(fx) {
  const C = SAVE.camp, T = G.talk, note = (txt, col) => T && T.notes.push({ txt, col, life: 2.6 }), log = C.log[C.cur] || (C.log[C.cur] = []);
  TRUSTS.forEach(([k, nm]) => { if (!fx[k]) return; const was = C.trust[k]; C.trust[k] = Math.max(-3, Math.min(3, was + fx[k])); log.push({ trust: k, d: C.trust[k] - was }); note(`${nm} TRUST ${fx[k] > 0 ? "+" : ""}${fx[k]}`, fx[k] > 0 ? COL.cyan : COL.red); });
  if (fx.res) { C.res += fx.res; log.push({ res: fx.res }); note("CORVUS RESONANCE +" + fx.res, COL.red); }
  if (fx.ending) { C.endings = C.endings || {}; C.endings[fx.ending] = true; C.ending = fx.ending; }
  if (fx.flag) { C.flags[fx.flag] = true; if (FLAG_PAIRS[fx.flag]) delete C.flags[FLAG_PAIRS[fx.flag]]; log.push({ flag: fx.flag }); }
  // Scrip from a conversation is paid once per chapter, so replays can't farm it.
  if (fx.scrip < 0) { SAVE.scrip = Math.max(0, SAVE.scrip + fx.scrip); note(fx.scrip + " SCRIP", COL.red); }
  else if (fx.scrip && !C.paid[C.cur]) { SAVE.scrip += fx.scrip; C.paidNow = true; note("+" + fx.scrip + " SCRIP", COL.amber); }
  persist();
}
// Replaying a chapter takes back the trust, Resonance and flags it gave last time, so choices can be remade.
function undoChapterFx(n) {
  const C = SAVE.camp; (C.log[n] || []).forEach(e => { if (e.trust) C.trust[e.trust] -= e.d; if (e.res) C.res -= e.res; if (e.flag) delete C.flags[e.flag]; }); C.log[n] = []; persist();
}

/* ---- The conversation runner ---- */
function startTalk(scene, done, o = {}) {
  G.talk = { stack: [{ nodes: scene, i: 0 }], done, title: o.title || "", cur: null, shown: 0, choice: null, sel: 0, notes: [], t: 0 };
  G.mode = "talk"; G.menuMode = null; talkNext();
}
function talkNext() {
  const T = G.talk;
  for (;;) {
    const top = T.stack[T.stack.length - 1];
    if (!top) { const d = T.done; G.talk = null; if (d) d(); return; }
    if (top.i >= top.nodes.length) { T.stack.pop(); continue; }
    const n = top.nodes[top.i++];
    if (Array.isArray(n)) { T.cur = { who: n[0], text: fillName(typeof n[1] === "function" ? n[1]() : n[1]).toUpperCase() }; T.shown = 0; AU.sfx("lock", 0); return; }
    if (n.if) { const br = n.if(SAVE.camp) ? n.then : n.else; if (br) T.stack.push({ nodes: br, i: 0 }); continue; }
    if (n.c) { const opts = n.c.filter(op => (op.s !== "origin" || op.o === SAVE.char.origin) && (!op.if || op.if(SAVE.camp))); if (n.silent) opts.push(Object.assign({ silent: true }, n.silent));
      T.choice = { opts, timer: n.timer || 0, t: n.timer || 0 }; T.sel = 0; T.shown = 999; AU.sfx("hexer"); return; }
    if (n.fx) { applyFx(n.fx); continue; }
  }
}
function pickReply(op) {
  const T = G.talk; T.choice = null; if (op.fx) applyFx(op.fx); AU.sfx("lock", 2);
  T.stack.push({ nodes: (op.silent ? [] : [["you", op.t]]).concat(op.then || []), i: 0 }); talkNext();
}
// Boxes for the reply rows, shared by input and drawing.
const replyBox = i => [16, 166 + i * 14, 448, 13];
function updateTalk(rdt) {
  const T = G.talk; if (!T) return; T.t += rdt; T.notes.forEach(n => n.life -= rdt); T.notes = T.notes.filter(n => n.life > 0);
  if (T.choice) {
    const C = T.choice, n = C.opts.length;
    if (C.timer) { C.t -= rdt; if (C.t <= 0) { const s = C.opts.find(o => o.silent) || C.opts[0]; return pickReply(s); } }
    if (hit("arrowup") || hit("w")) { T.sel = (T.sel - 1 + n) % n; AU.sfx("lock", 0); }
    if (hit("arrowdown") || hit("s")) { T.sel = (T.sel + 1) % n; AU.sfx("lock", 0); }
    const hov = C.opts.findIndex((o, i) => inBox(replyBox(i), mouse.x, mouse.y));
    if (!PAD.active && (mouse.x !== T.mx || mouse.y !== T.my)) { T.mx = mouse.x; T.my = mouse.y; if (hov >= 0) T.sel = hov; }
    for (let i = 0; i < n; i++) if (hit(String(i + 1))) return pickReply(C.opts[i]);
    if (hit("enter") || hit(" ")) return pickReply(C.opts[T.sel]);
    if (hit("lmb") && hov >= 0) return pickReply(C.opts[hov]);
    return;
  }
  T.shown += rdt * 75;
  if (hit("escape")) { // skip ahead to the next reply, or the end of the scene
    while (G.talk === T && !T.choice) talkNext(); if (G.talk === T) T.shown = 999; return; }
  if (hit("enter") || hit(" ") || hit("lmb")) { if (T.shown < T.cur.text.length) T.shown = 999; else talkNext(); }
}

/* ---- Drawing ---- */
function wrapText(c, s, maxW) {
  c.font = "8px Silkscreen"; const out = []; let line = "";
  for (const w of s.split(" ")) { const tryL = line ? line + " " + w : w; if (c.measureText(tryL).width > maxW && line) { out.push(line); line = w; } else line = tryL; }
  if (line) out.push(line); return out;
}
function trustPips(c, x, y, v) { for (let i = -3; i <= 3; i++) { if (!i) continue; c.fillStyle = (i < 0 ? v <= i : v >= i) ? (i < 0 ? COL.red : COL.cyan) : "#2a2640"; c.fillRect(x + (i + 3) * 6 - (i > 0 ? 6 : 0), y, 5, 3); } }
function drawPortrait(c, who, x, y, w, h, t) {
  const s = portrait(who);
  if (!s) { // narrator: the city itself
    c.save(); c.beginPath(); c.rect(x + 1, y + 1, w - 2, h - 2); c.clip(); for (let i = 0; i < 18; i++) { const rx = x + (i * 37 + t * .05) % w, ry = y + (i * 53 + t * .3) % h; c.fillStyle = rgba(COL.cyan, .25); c.fillRect(Math.round(rx), Math.round(ry), 1, 5); }
    c.font = '700 20px "Chakra Petch", sans-serif'; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = rgba(COL.ink, .85); c.fillText("SAINT", x + w / 2, y + h / 2 - 2); c.fillText("VARROW", x + w / 2, y + h / 2 + 18); c.textAlign = "left";
    txt(c, mapName(), x + w / 2, y + h - 16, COL.amber, 8, "center"); c.restore(); return; }
  const k = Math.max(1, Math.min(3, Math.floor((w - 8) / s.w), Math.floor((h - 8) / s.h))), dx = Math.round(x + (w - s.w * k) / 2), dy = Math.round(y + h - 6 - s.h * k);
  c.save(); c.beginPath(); c.rect(x + 1, y + 1, w - 2, h - 2); c.clip(); c.imageSmoothingEnabled = false;
  const S = SPEAKERS[who]; c.globalCompositeOperation = "lighter"; glow(c, x + w / 2, y + h * .55, w * .6, S.col, .14); c.globalCompositeOperation = "source-over";
  if (S.glitch) { const r = rngF(Math.floor(t / 90)); for (let sy = 0; sy < s.h; sy += 3) { const off = r() < .2 ? Math.round((r() - .5) * 6) : 0; c.drawImage(s.cv, 0, sy, s.w, 3, dx + off * k, dy + sy * k, s.w * k, 3 * k); } }
  else c.drawImage(s.cv, dx, dy, s.w * k, s.h * k);
  c.globalCompositeOperation = "lighter"; c.globalAlpha = .7; c.drawImage(s.gc, dx - s.G * k, dy - s.G * k, s.gc.width * k, s.gc.height * k); c.restore();
}
function drawTalk(c, t) {
  const T = G.talk; if (!T) return;
  if (G.base) { c.drawImage(G.base.C, 0, 0); drawRain(c, G.base, t); } veil(c, .8);
  if (T.title) txt(c, T.title, 16, 10, rgba(COL.amber, .9));
  const who = T.cur ? T.cur.who : "sys", S = SPEAKERS[who];
  panel(c, 14, 24, 124, 132, S.col); drawPortrait(c, who, 14, 24, 124, 132, t);
  panel(c, 146, 24, 320, 132, "#3a3456");
  let name = speakerName(who); if (S.glitch && Math.random() < .15) name = name.replace(/[AEOU]/g, "#");
  txt(c, name, 156, 32, S.col);
  if (S.trust) { txt(c, "TRUST", 400, 32, COL.dim, 8, "right"); trustPips(c, 406, 34, SAVE.camp.trust[S.trust]); }
  if (T.cur) { const show = T.cur.text.slice(0, Math.floor(T.shown)), lines = wrapText(c, T.cur.text, 296);
    let left = show.length; lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length + 1; let s2 = part;
      if (S.glitch) s2 = part.split("").map(ch => ch !== " " && Math.random() < .04 ? "#" : ch).join("");
      txt(c, s2, 156, 46 + i * 11, who === "sys" ? COL.dim : COL.ink); }); }
  T.notes.forEach((n, i) => txt(c, n.txt, 458, 142 - i * 10, rgba(n.col, Math.min(1, n.life * 2)), 8, "right"));
  if (T.choice) {
    const C = T.choice; if (C.timer) { const k = Math.max(0, C.t / C.timer); c.fillStyle = "#2a2640"; c.fillRect(16, 161, 448, 2); c.fillStyle = k < .3 && Math.floor(t / 120) % 2 ? "#ffffff" : COL.red; c.fillRect(16, 161, Math.round(448 * k), 2); }
    C.opts.forEach((o, i) => { const [bx, by, bw, bh] = replyBox(i), on = i === T.sel;
      const tag = o.silent ? ["SILENT", COL.dim] : o.s === "origin" ? [o.o.toUpperCase(), "#ffffff"] : STYLES[o.s];
      c.fillStyle = on ? rgba(tag[1], .18) : "rgba(6,5,14,.7)"; c.fillRect(bx, by, bw, bh);
      if (on) { c.fillStyle = tag[1]; c.fillRect(bx, by, 2, bh); }
      txt(c, String(i + 1), bx + 7, by + 3, on ? COL.ink : COL.dim); txt(c, tag[0], bx + 18, by + 3, tag[1]);
      txt(c, fillName(o.t).toUpperCase(), bx + 86, by + 3, on ? COL.ink : rgba(COL.ink, .7)); });
  }
  const L = lab(), hint = T.choice ? (PAD.active ? "UP / DOWN + " + L.confirm + ": REPLY" : "1-" + T.choice.opts.length + " OR CLICK: REPLY") + (T.choice.timer ? " · CHOOSE BEFORE THE TIMER RUNS OUT" : "")
    : (PAD.active ? L.confirm + ": NEXT · B: SKIP" : "ENTER OR CLICK: NEXT · ESC: SKIP");
  txt(c, hint, GW / 2, GH - 14, rgba(COL.dim, .8), 8, "center");
}

/* ---- Radio chatter during play ---- */
function radio(who, text) { const R = G.radioQ || (G.radioQ = []); R.push({ who, text: fillName(text).toUpperCase(), life: Math.max(3.2, text.length * .055) }); if (R.length === 1) AU.sfx("lock", 1); }
function updateRadio(rdt) { const R = G.radioQ; if (!R || !R.length) return; R[0].life -= rdt; if (R[0].life <= 0) { R.shift(); if (R.length) AU.sfx("lock", 1); } }
function drawRadio(c, t) {
  const R = G.radioQ; if (!R || !R.length) return; const m = R[0], S = SPEAKERS[m.who], lines = wrapText(c, m.text, 196).slice(0, 3);
  const x = 168, h = 18 + lines.length * 9, y = GH - 8 - h; c.globalAlpha = Math.min(1, m.life * 3);
  panel(c, x, y, 244, h, S.col);
  const s = portrait(m.who); if (s) { c.save(); c.beginPath(); c.rect(x + 3, y + 3, 30, h - 6); c.clip(); c.drawImage(s.cv, Math.round(x + 18 - s.w / 2), y + 3); c.restore(); }
  let nm = speakerName(m.who); if (S.glitch && Math.floor(t / 80) % 3 === 0) nm = nm.replace(/[AEOU]/g, "#");
  txt(c, nm, x + 38, y + 4, S.col); lines.forEach((l, i) => txt(c, l, x + 38, y + 14 + i * 9, COL.ink));
  c.globalAlpha = 1;
}
