/* MAGPIE'S · CHROME & IRON — the fixer's stall. Doubles as the loadout screen before runs and between districts. */
"use strict";
DEFS.coil = { w: 30, h: 12, parts: [Pl("rust", [[2, 6], [8, 6], [7, 11], [1, 11]]), R("gun", 4, 3, 12, 5), R("chrome", 16, 4, 12, 3), R("ambE", 18, 3, 1, 5), R("ambE", 21, 3, 1, 5), R("ambE", 24, 3, 1, 5), Px("chrome", [[27, 3]])] };
DEFS.breacher = { w: 30, h: 14, parts: [Pl("rust", [[2, 6], [8, 6], [7, 12], [1, 12]]), R("gun", 4, 3, 10, 5), E("chrome", 11, 5.5, 3.5, 3), R("chrome", 13, 3, 14, 3), R("armor", 12, 7, 13, 3), R("ambE", 24, 8, 1, 1)] };
DEFS.hornet = { w: 30, h: 14, parts: [R("gun", 3, 4, 18, 5), R("armor", 6, 2, 10, 2), R("chrome", 21, 5, 8, 2), Pl("gun", [[9, 9], [13, 9], [12, 13], [8, 13]]), R("gun", 15, 9, 3, 5), R("cyanE", 7, 5, 8, 1)] };
DEFS.magpie = { w: 44, h: 46, parts: [
  Pl("coat", [[1, 46], [4, 34], [12, 28], [32, 28], [40, 34], [43, 46]]),
  Pl("coatIn", [[18, 30], [22, 41], [26, 30]]),
  E("chrome", 8, 33, 4.5, 3), E("chrome", 36, 33, 4.5, 3),
  Pl("wing", [[8, 30], [14, 26], [22, 33], [30, 26], [36, 30], [32, 36], [22, 38], [12, 36]]), Px("bone", [[13, 31], [16, 33], [28, 33], [31, 31]]),
  R("skin", 18, 23, 8, 6), Px("cyanE", [[19, 26], [20, 27], [24, 26], [25, 27]]),
  E("skin", 22, 15, 9, 11),
  S_(Pl("chrome", [[14, 17], [30, 17], [29, 24], [22, 27], [15, 24]])), R("gun", 18, 22, 8, 1), Px("ambE", [[20, 22]]),
  Pl("hair", [[12, 13], [15, 4], [22, 0], [29, 4], [32, 13], [30, 9], [22, 6], [14, 9]]), Pl("bone", [[22, 0], [26, 1], [25, 8], [22, 6]]),
  Px("redE", [[17, 13], [18, 13]]), E("chrome", 26.5, 13.5, 2.6, 2.2), Px("magE", [[26, 13], [27, 13]]),
  Px("ambE", [[12, 15], [12, 17], [32, 15]]),
] };
const LINES = {
  warm: ["PARTNER. FRIENDS-AND-FAMILY PRICES TODAY.", "STILL CAN'T BELIEVE YOU FORGAVE ME. TWENTY PERCENT OFF.", "YOU KEEP ME HONEST. IT'S EXHAUSTING."],
  cold: ["BEHIND THE GLASS NOW. PRICES WENT UP.", "BUSINESS ONLY. PAY OR WALK.", "I KNOW. I KNOW. JUST BUY SOMETHING."],
  greet: ["VESPER. YOU SMELL LIKE WET CROW.", "BACK ALREADY? CHROME DOESN'T BUY ITSELF.", "FRESH STOCK OFF A HALVORSEN TRUCK. DON'T ASK.", "THE MURDER'S TWITCHY TONIGHT. GOOD FOR BUSINESS."],
  between: ["STILL BREATHING. I'M IMPRESSED.", "THAT BOSS OF THEIRS? I'D HAVE CHARGED DOUBLE.", "SPEND IT BEFORE THE CROWS DO."],
  buy: ["PLEASURE DOING CRIMES WITH YOU.", "TREAT IT NICE. NO REFUNDS.", "STILL WARM. THE LAST OWNER ISN'T."],
  poor: ["SCRIP FIRST, SWEETHEART.", "I RUN A BUSINESS, NOT A CHARITY."],
  locked: ["PROVE YOU CAN HANDLE IT. THEN WE TALK.", "NOT YET. COME BACK WITH MORE CROW ON YOUR BOOTS."],
  equip: ["GOOD PICK.", "BRING IT BACK DIRTY.", "SUITS YOU."], unequip: ["TRAVELLING LIGHT. BRAVE."],
};
const say = k => { const l = LINES[k]; G.shop.line = l[Math.random() * l.length | 0]; G.shop.lineT = 0; };
let SHOPBG = null;
function shopSprites() { if (SP.magpie) return; ["magpie", "coil", "breacher", "hornet"].forEach(k => SP[k] = sprite(DEFS[k], k === "magpie" ? { rimR: COL.magenta, rimL: COL.cyan } : { rimR: COL.cyan })); SP.kestrel = SP.kestrel || sprite(DEFS.kestrel, { rimR: COL.cyan }); SP.rail = SP.rail || sprite(DEFS.rail, { rimR: COL.cyan }); ["harpoon", "bellows", "repeater", "wasp", "requiem"].forEach(k => SP[k] = SP[k] || sprite(DEFS[k], { rimR: COL.amber })); ["duster", "fanhammer", "tripletap", "needler", "cryo", "magnum", "arccaster", "splitter", "pinball", "longbow", "pipe", "wisp"].forEach(k => SP[k] = SP[k] || sprite(DEFS[k], { rimR: COL.cyan })); }
function buildShopBG() {
  const C = mk(GW, GH), c = C.getContext("2d"), r = rngF(77); c.imageSmoothingEnabled = false;
  c.fillStyle = "#0b0912"; c.fillRect(0, 0, GW, GH);
  for (let y = 0; y < GH; y += 8) for (let x = -(y / 8 % 2) * 8; x < GW; x += 16) { c.fillStyle = r() < .5 ? "#1a1528" : "#1e1930"; c.fillRect(x + 1, y + 1, 15, 7); }
  c.fillStyle = "#231d34"; c.fillRect(10, 46, 172, 128); c.fillStyle = "#16121f"; for (let y = 52; y < 170; y += 8) for (let x = 16; x < 178; x += 8) c.fillRect(x, y, 2, 2);
  c.strokeStyle = "#3a3156"; c.strokeRect(10.5, 46.5, 171, 127);
  [["kestrel", 18, 56], ["breacher", 140, 56], ["coil", 16, 140], ["hornet", 142, 140], ["rail", 66, 154]].forEach(([k, x, y]) => { c.fillStyle = "#0b0912"; c.fillRect(x + 6, y - 3, 1, 3); c.fillRect(x + 20, y - 3, 1, 3); drawSpr(c, SP[k], x, y); });
  c.fillStyle = "#3a3050"; c.fillRect(0, 196, 190, 6); c.fillStyle = "#241c34"; c.fillRect(0, 202, 190, 70); c.fillStyle = "#4a3e66"; c.fillRect(0, 196, 190, 1);
  c.fillStyle = "#0f0c18"; c.fillRect(8, 208, 174, 56); c.strokeStyle = rgba(COL.magenta, .5); c.strokeRect(8.5, 208.5, 173, 55);
  c.save(); c.shadowColor = COL.magenta; c.shadowBlur = 10; txt(c, "MAGPIE'S", 16, 8, COL.magenta, 16); c.restore(); txt(c, "MAGPIE'S", 16, 8, "#ffd1e6", 16);
  c.save(); c.shadowColor = COL.cyan; c.shadowBlur = 6; txt(c, "CHROME · IRON · NO QUESTIONS", 16, 28, COL.cyan); c.restore();
  c.globalCompositeOperation = "lighter"; glow(c, 96, 110, 120, COL.magenta, .14); glow(c, 96, 196, 90, COL.amber, .12); glow(c, 330, 0, 200, COL.cyan, .06); c.globalCompositeOperation = "source-over";
  c.fillStyle = "rgba(6,5,14,.86)"; poly(c, [[196, 4], [476, 4], [476, 262], [470, 268], [190, 268], [190, 10]]); c.fill(); c.strokeStyle = "#3a3456"; c.save(); c.translate(.5, .5); poly(c, [[196, 4], [475, 4], [475, 261], [469, 267], [190, 267], [190, 10]]); c.stroke(); c.restore();
  return C;
}
function wrapText(c, s, maxW) { c.font = "8px Silkscreen"; const out = []; let line = ""; for (const w of s.split(" ")) { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }

/* ---- State and input ---- */
function openShop(from) {
  AU.init(); shopSprites(); if (!SHOPBG) SHOPBG = buildShopBG();
  const L = SAVE.loadout; G.mode = "shop"; G.shop = { tab: 0, sel: 0, from, line: "", lineT: 0, mx: mouse.x, my: mouse.y, flash: 0 };
  G.shop.sel = Math.max(0, shopList().findIndex(i => i.id === L.gun)); const f = SAVE.camp && SAVE.camp.flags || {}; say(f.forgaveMagpie ? "warm" : f.cutMagpie ? "cold" : from === "clear" ? "between" : "greet");
}
// Act rewards only show up here once you have them. Styles are grouped by look slot, everything else cheapest first.
const shopList = () => { const cat = CATS[G.shop.tab][0], l = ITEMS.filter(i => i.cat === cat && (!i.relic || owns(i.id)));
  const slotIx = i => LOOK_SLOTS.findIndex(sl => sl.key === i.slot); return l.map((i, k) => [i, k]).sort((a, b) => cat === "style" ? slotIx(a[0]) - slotIx(b[0]) || a[1] - b[1] : (a[0].relic ? 1 : 0) - (b[0].relic ? 1 : 0) || a[0].price - b[0].price || a[1] - b[1]).map(x => x[0]); };
const equipped = id => { const L = SAVE.loadout, it3 = ITEM[id]; if (it3 && it3.cat === "style") return SAVE.char.look[it3.slot] === it3.value; return L.gun === id || L.oc === id || L.imp.includes(id); };
function shopStatus(i) { if (equipped(i.id)) return ["EQUIPPED", COL.cyan]; if (owns(i.id)) return [i.relic ? "ACT REWARD" : "OWNED", i.relic ? COL.amber : COL.dim]; if (!available(i)) return ["LOCKED", COL.magenta]; return [priceOf(i) + " SC", SAVE.scrip >= i.price ? COL.amber : COL.red]; }
function shopConfirm() {
  const i = shopList()[G.shop.sel], L = SAVE.loadout; if (!i) return;
  if (i.cat === "style" && owns(i.id)) { // wear it, or take it off (back to the slot's first free option)
    const look = SAVE.char.look; look[i.slot] = look[i.slot] === i.value ? SLOT[i.slot].opts[0][0] : i.value; applyLook(); persist(); say(look[i.slot] === i.value ? "equip" : "unequip"); AU.sfx("lock", 3); return; }
  if (owns(i.id)) {
    if (i.cat === "gun") L.gun = i.id; else if (i.cat === "oc") L.oc = i.id;
    else if (L.imp.includes(i.id)) { L.imp = L.imp.filter(x => x !== i.id); say("unequip"); AU.sfx("lock", 0); persist(); return; }
    else { if (L.imp.length >= IMP_SLOTS) L.imp.shift(); L.imp.push(i.id); }
    say("equip"); AU.sfx("lock", 3); persist(); return;
  }
  if (!available(i)) { say("locked"); AU.sfx("hackFail"); return; }
  if (SAVE.scrip < priceOf(i)) { say("poor"); AU.sfx("hackFail"); G.shop.flash = .4; return; }
  const cost = priceOf(i); SAVE.scrip -= cost; SAVE.owned.push(i.id); say("buy"); AU.sfx("milestone"); AU.sfx("reload"); G.shop.pop = { txt: "-" + cost, life: 1 };
  if (i.cat === "style") { SAVE.char.look[i.slot] = i.value; applyLook(); }
  else if (i.cat === "gun") L.gun = i.id; else if (i.cat === "oc") L.oc = i.id; else { if (L.imp.length >= IMP_SLOTS) L.imp.shift(); L.imp.push(i.id); }
  persist();
}
const ROW_Y = 42, ROW_H = 17, LIST_X = 198, TAB_W = 69, VIS = 8; // 8 rows visible; longer lists scroll
const BTN_IN = [376, 244, 94, 18], BTN_BACK = [198, 244, 60, 18], BTN_TRY = [264, 244, 106, 18];
// TRY: the selected sidearm, Overclock or implant in the firing range. Not mid-run (between districts) and not for styles.
const canTry = i => i && i.cat !== "style" && G.shop.from !== "clear";
function tryItem() { const i = shopList()[G.shop.sel]; if (!canTry(i)) { say("locked"); G.shop.line = i && i.cat === "style" ? "THE MIRROR'S RIGHT THERE, SWEETHEART." : "NO TEST FIRES MID-JOB. FINISH THE RUN."; AU.sfx("hackFail"); return; } persist(); RUN.startRange(i); }
const inBox = (b, x, y) => x >= b[0] && x < b[0] + b[2] && y >= b[1] && y < b[1] + b[3];
function updateShop(rdt, actions) {
  const S = G.shop, n = shopList().length; S.lineT += rdt; S.flash = Math.max(0, S.flash - rdt); if (S.pop) { S.pop.life -= rdt; if (S.pop.life <= 0) S.pop = null; }
  const tab = d => { S.tab = (S.tab + d + CATS.length) % CATS.length; S.sel = 0; S.scroll = 0; AU.sfx("lock", 1); };
  S.scroll = Math.max(0, Math.min(S.scroll || 0, n - VIS)); if (S.sel < S.scroll) S.scroll = S.sel; if (S.sel >= S.scroll + VIS) S.scroll = S.sel - VIS + 1;
  if (hit("q") || hit("arrowleft")) tab(-1); if (hit("e") || hit("arrowright") || hit("tab")) tab(1);
  if (hit("arrowup") || hit("w")) { S.sel = (S.sel - 1 + n) % n; AU.sfx("lock", 0); } if (hit("arrowdown") || hit("s")) { S.sel = (S.sel + 1) % n; AU.sfx("lock", 0); }
  if (hit("enter")) shopConfirm();
  if (hit("t")) tryItem();
  ["1", "2", "3"].forEach((k, i) => { if (hit(k)) { if (loadBuild(i)) { S.line = "BUILD " + (i + 1) + " LOADED. " + buildName(SAVE.builds[i]); S.lineT = 0; AU.sfx("lock", 4); } else { S.line = "BUILD " + (i + 1) + " IS EMPTY. SAVE ONE IN THE BODYSHOP."; S.lineT = 0; AU.sfx("hackFail"); } } });
  if (G.wheel) { S.sel = Math.max(0, Math.min(n - 1, S.sel + Math.sign(G.wheel) * 3)); G.wheel = 0; }
  if (Math.hypot(mouse.x - S.mx, mouse.y - S.my) > .5) { S.mx = mouse.x; S.my = mouse.y; const row = Math.floor((mouse.y - ROW_Y) / ROW_H); if (mouse.x > LIST_X && mouse.y >= ROW_Y && row >= 0 && row < VIS && S.scroll + row < n) S.sel = S.scroll + row; }
  if (hit("lmb")) {
    const x = mouse.x, y = mouse.y, row = Math.floor((y - ROW_Y) / ROW_H), idx = (S.scroll || 0) + row;
    if (y >= 20 && y < 36 && x > 196) { const t = Math.min(CATS.length - 1, Math.floor((x - 198) / TAB_W)); if (t !== S.tab) { S.tab = t; S.sel = 0; S.scroll = 0; AU.sfx("lock", 1); } }
    else if (x > LIST_X && y >= ROW_Y && row >= 0 && row < VIS && idx < n) { if (idx === S.sel) shopConfirm(); else S.sel = idx; }
    else if (inBox(BTN_IN, x, y)) actions.jackIn();
    else if (inBox(BTN_BACK, x, y)) actions.back();
    else if (inBox(BTN_TRY, x, y)) tryItem();
  }
  if (hit(" ")) actions.jackIn();
  if (hit("escape")) actions.back();
}

/* ---- Drawing ---- */
function itemIcon(c, i, x, y) {
  if (i.relic) { c.fillStyle = COL.amber; poly(c, [[x + 20, y - 1], [x + 23, y + 2], [x + 20, y + 5], [x + 17, y + 2]]); c.fill(); } // gold diamond: an act reward
  if (i.cat === "style") { c.fillStyle = "#0b0912"; c.fillRect(x + 4, y + 1, 15, 13); c.strokeStyle = COL.amber; c.strokeRect(x + 4.5, y + 1.5, 14, 12);
    if (i.col) { c.fillStyle = i.col; c.fillRect(x + 6, y + 3, 11, 9); } else txt(c, SLOT[i.slot].label[0], x + 12, y + 4, COL.amber, 8, "center"); return; }
  if (i.cat === "gun") { const s = SP[i.id]; c.save(); c.translate(x + 11 - s.w * .3, y + 7 - s.h * .3); c.scale(.6, .6); c.drawImage(s.cv, 0, 0); c.restore(); return; }
  const col = i.cat === "oc" ? COL.cyan : COL.magenta; c.strokeStyle = col; c.fillStyle = col;
  if (i.cat === "oc") { c.beginPath(); c.arc(x + 11.5, y + 7.5, 5, 0, TAU); c.stroke(); c.fillRect(x + 11, y + 1, 1, 3); c.fillRect(x + 11, y + 11, 1, 3); c.fillRect(x + 5, y + 7, 3, 1); c.fillRect(x + 15, y + 7, 3, 1); }
  else { c.strokeRect(x + 6.5, y + 2.5, 10, 10); for (let k = 0; k < 3; k++) { c.fillRect(x + 8 + k * 3, y, 1, 2); c.fillRect(x + 8 + k * 3, y + 13, 1, 2); } c.fillRect(x + 10, y + 6, 3, 3); }
}
function drawShop(c, t) {
  const S = G.shop, list = shopList(), L = SAVE.loadout, Lb = lab();
  c.drawImage(SHOPBG, 0, 0);
  const bob = Math.round(Math.sin(t * .002) * 1.5); c.save(); c.translate(29, 60 + bob); c.scale(3, 3); drawSpr(c, SP.magpie, 0, 0); c.restore();
  c.save(); c.globalCompositeOperation = "lighter"; glow(c, 29 + 26.5 * 3 + 3, 60 + bob + 13.5 * 3 + 3, 10 + Math.sin(t * .006) * 3, COL.magenta, .6); c.restore();
  c.fillStyle = "#3a3050"; c.fillRect(0, 196, 190, 6); c.fillStyle = "#4a3e66"; c.fillRect(0, 196, 190, 1);
  txt(c, "MAGPIE", 14, 212, COL.magenta);
  const shown = S.line.slice(0, Math.floor(S.lineT * 60)); wrapText(c, shown, 160).slice(0, 4).forEach((l, k) => txt(c, l, 14, 224 + k * 10, COL.ink));
  // header
  const dist = G.shop.from === "clear" && D().next ? getDist(D().next) : DIST[DORDER[G.sel || 0]];
  txt(c, (S.from === "clear" ? "BETWEEN DISTRICTS · NEXT " : "LOADOUT · ") + dist.code + " " + dist.name, 200, 8, COL.dim);
  txt(c, SAVE.scrip + " SCRIP", 470, 8, S.flash > 0 && Math.floor(t / 80) % 2 ? COL.red : COL.amber, 8, "right");
  if (S.pop) txt(c, S.pop.txt, 470, 16 - (1 - S.pop.life) * 8, rgba(COL.red, S.pop.life), 8, "right");
  CATS.forEach(([k, name], i) => { const x = 198 + i * TAB_W, on = i === S.tab; c.fillStyle = on ? COL.cyan : "#16121f"; c.fillRect(x, 20, TAB_W - 4, 15);
    txt(c, name, x + (TAB_W - 4) / 2, 24, on ? "#05040b" : COL.dim, 8, "center"); });
  const sc = S.scroll || 0; if (list.length > VIS) { const h = 136 * VIS / list.length; c.fillStyle = "#2a2640"; c.fillRect(473, ROW_Y, 2, 136); c.fillStyle = COL.cyan; c.fillRect(473, ROW_Y + 136 * sc / list.length, 2, h); }
  list.slice(sc, sc + VIS).forEach((i, kk) => { const k = kk + sc;
    const y = ROW_Y + kk * ROW_H, sel = k === S.sel, [st, col] = shopStatus(i);
    if (sel) { c.fillStyle = "rgba(43,228,255,.12)"; c.fillRect(LIST_X - 2, y - 1, 274, ROW_H - 1); c.fillStyle = COL.cyan; c.fillRect(LIST_X - 2, y - 1, 1, ROW_H - 1); }
    c.globalAlpha = available(i) || owns(i.id) ? 1 : .45; itemIcon(c, i, LIST_X, y); c.globalAlpha = 1;
    txt(c, i.name.toUpperCase(), LIST_X + 28, y + 4, available(i) || owns(i.id) ? COL.ink : COL.dim); txt(c, st, 470, y + 4, col, 8, "right");
  });
  // details
  const i = list[S.sel]; c.fillStyle = "#3a3456"; c.fillRect(198, 182, 274, 1);
  if (i) { txt(c, i.name.toUpperCase(), 200, 186, COL.ink);
    wrapText(c, i.desc.toUpperCase(), i.cat === "style" ? 212 : 268).slice(0, 2).forEach((l, k) => txt(c, l, 200, 196 + k * 9, COL.dim));
    if (!owns(i.id) && !available(i)) txt(c, "UNLOCK: " + i.reqText.toUpperCase(), 200, 216, COL.magenta);
    if (i.cat === "style") { const PL = Object.assign({}, SAVE.char.look, { [i.slot]: i.value }), ps = previewSprite(PL); c.save(); c.beginPath(); c.rect(420, 184, 52, 44); c.clip(); c.fillStyle = "#0b0912"; c.fillRect(420, 184, 52, 44); c.imageSmoothingEnabled = false; c.drawImage(ps.cv, 420 - 1, 184 - 4, ps.w * 2, ps.h * 2); c.restore(); c.strokeStyle = "#3a3456"; c.strokeRect(420.5, 184.5, 51, 43); }
    if (owns(i.id) || available(i)) { let x = 200; c.font = "8px Silkscreen"; i.stats.forEach(s => { const w = c.measureText(s).width + 8; c.fillStyle = "rgba(255,178,46,.15)"; c.fillRect(x, 214, w, 11); txt(c, s, x + 4, 216, COL.amber); x += w + 4; }); } }
  // buttons
  c.fillStyle = "#16121f"; c.fillRect(...BTN_BACK); txt(c, "BACK", BTN_BACK[0] + 30, 249, COL.dim, 8, "center");
  const pulse = .75 + .25 * Math.sin(t * .006); c.fillStyle = rgba(COL.cyan, pulse); c.fillRect(...BTN_IN); txt(c, "JACK IN >", BTN_IN[0] + 47, 249, "#05040b", 8, "center");
  const confirm = PAD.active ? Lb.confirm : "ENTER/CLICK", tabs = PAD.active ? (PAD.kind === "ps" ? "L1/R1" : "LB/RB") : "Q/E", go = PAD.active ? (PAD.kind === "ps" ? "OPTIONS" : "START") : "SPACE";
  const ti = list[S.sel], tryOn = canTry(ti); c.fillStyle = tryOn ? rgba(COL.amber, inBox(BTN_TRY, mouse.x, mouse.y) ? .3 : .14) : "#16121f"; c.fillRect(...BTN_TRY); c.strokeStyle = rgba(COL.amber, tryOn ? .7 : .2); c.strokeRect(BTN_TRY[0] + .5, BTN_TRY[1] + .5, BTN_TRY[2] - 1, BTN_TRY[3] - 1);
  txt(c, PAD.active ? (PAD.kind === "ps" ? "TRY IT (□)" : "TRY IT (X)") : "TRY IT (T)", BTN_TRY[0] + BTN_TRY[2] / 2, 249, tryOn ? COL.amber : "#3a3456", 8, "center");
  txt(c, PAD.active ? `${confirm} BUY/EQUIP · ${tabs} TAB · ${go} JACK IN` : `ENTER BUY/EQUIP · 1-3 BUILDS · ${go} JACK IN`, 334, 232, rgba(COL.dim, .8), 8, "center");
}

/* Small vertical menus for the title, district-clear and death screens. Mouse, keyboard and controller. */
function layoutMenu(items, y0, gap = 12) { items.forEach((it, i) => { it.y = y0 + i * gap; it.box = [GW / 2 - 110, it.y - 2, 220, 11]; }); return items; }
function runMenu(items) {
  if (G.menuMode !== G.mode) { G.menuMode = G.mode; G.menuSel = 0; G.menuMx = mouse.x; G.menuMy = mouse.y; }
  const n = items.length; G.menuSel = Math.min(G.menuSel, n - 1);
  if (hit("arrowup") || hit("w")) { G.menuSel = (G.menuSel - 1 + n) % n; AU.sfx("lock", 0); }
  if (hit("arrowdown") || hit("s")) { G.menuSel = (G.menuSel + 1) % n; AU.sfx("lock", 0); }
  const hov = items.findIndex(it => inBox(it.box, mouse.x, mouse.y));
  if (mouse.x !== G.menuMx || mouse.y !== G.menuMy) { G.menuMx = mouse.x; G.menuMy = mouse.y; if (hov >= 0) G.menuSel = hov; }
  if (hit("enter") || hit(" ")) items[G.menuSel].act(); else if (hit("lmb") && hov >= 0) items[hov].act();
}
function drawMenu(c, items, t) {
  if (!items) return;
  items.forEach((it, i) => { const on = i === G.menuSel && G.menuMode === G.mode;
    if (on) { c.fillStyle = rgba(it.col || COL.cyan, .16 + .06 * Math.sin(t * .008)); c.fillRect(...it.box); }
    txt(c, on ? "> " + it.label + " <" : it.label, GW / 2, it.y, on ? (it.col || COL.cyan) : COL.dim, 8, "center"); });
}
const loadoutLine = () => { const L = SAVE.loadout; return [ITEM[L.gun].name, ITEM[L.oc].name, ...(L.imp.length ? L.imp.map(i => ITEM[i].name) : ["NO IMPLANTS"])].join(" · ").toUpperCase(); };
