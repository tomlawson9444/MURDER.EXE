/* BODYSHOP: create and customise your operative. Tabs: LOOK, GEAR, INVENTORY, ORIGIN. */
"use strict";
const INV_COLS = 10, INV_W = 27; // 10 x 27px cells keep every item on five rows
const BTABS = ["LOOK", "GEAR", "INVENTORY", "ORIGIN"], BROW_Y = 42, BTAB_W = 69, BTN_DONE = [356, 244, 114, 18], BTN_BBACK = [198, 244, 60, 18];
const GEAR_ROWS = [["SIDEARM", "gun"], ["OVERCLOCK", "oc"], ["IMPLANT 1", "imp", 0], ["IMPLANT 2", "imp", 1]];
const invItems = () => ITEMS;

function openBodyshop(from) {
  // Gun icons in GEAR and INVENTORY need the shop sprites.
  AU.init(); shopSprites(); G.mode = "body"; G.body = { tab: from === "create" ? 3 : 0, sel: 0, from, edit: false, t: 0, msg: from === "create" ? "PICK AN ORIGIN, THEN MAKE THEM YOURS." : "", msgT: 0, mx: mouse.x, my: mouse.y };
  if (from === "create") G.body.sel = Math.max(0, ORIGINS.findIndex(o => o.id === SAVE.char.origin));
}
const bodyRows = () => { const t = BTABS[G.body.tab]; return t === "LOOK" ? 1 + LOOK_SLOTS.length : t === "GEAR" ? GEAR_ROWS.length : t === "ORIGIN" ? ORIGINS.length : invItems().length; };
const say2 = m => { G.body.msg = m; G.body.msgT = 0; };

function cycleLook(slot, d) {
  const L = SAVE.char.look, opts = slot.opts.filter(o => lookOwned(slot.key, o)); if (opts.length < 2) { say2("MORE " + slot.label + " OPTIONS AT MAGPIE'S."); AU.sfx("hackFail"); return; }
  const i = opts.findIndex(o => o[0] === L[slot.key]); L[slot.key] = opts[(i + d + opts.length) % opts.length][0]; applyLook(); persist(); AU.sfx("lock", 2);
}
function cycleGear(row, d) {
  const [, cat, slot] = row, L = SAVE.loadout, owned = ITEMS.filter(i => i.cat === cat && owns(i.id)).map(i => i.id);
  if (cat === "imp") { const other = L.imp[1 - slot], opts = [null].concat(owned.filter(id => id !== other)); const cur = L.imp[slot] || null; const next = opts[(opts.indexOf(cur) + d + opts.length) % opts.length];
    const imp = [L.imp[0] || null, L.imp[1] || null]; imp[slot] = next; L.imp = imp.filter(Boolean); }
  else { if (owned.length < 2) { say2("BUY MORE AT MAGPIE'S."); AU.sfx("hackFail"); return; } L[cat] = owned[(owned.indexOf(L[cat]) + d + owned.length) % owned.length]; }
  AU.sfx("lock", 3); persist();
}
function bodyConfirm(actions) {
  const B = G.body, t = BTABS[B.tab];
  if (t === "LOOK" && B.sel === 0) { if (PAD.active) { SAVE.char.name = randomName(); persist(); AU.sfx("lock", 4); } else { B.edit = !B.edit; } return; }
  if (t === "LOOK") return cycleLook(LOOK_SLOTS[B.sel - 1], 1);
  if (t === "GEAR") return cycleGear(GEAR_ROWS[B.sel], 1);
  if (t === "ORIGIN") { const O = ORIGINS[B.sel]; if (SAVE.char.created && SAVE.char.origin !== O.id) { say2("YOUR ORIGIN IS SET. YOUR STORY STAYS YOURS."); AU.sfx("hackFail"); return; }
    SAVE.char.origin = O.id; persist(); AU.sfx("lock", 4); say2(O.name + " · STARTER KIT: " + kitNames(O)); if (B.from === "create") { B.tab = 0; B.sel = 0; } return; }
}
const kitNames = O => [O.kit.gun, O.kit.oc, ...O.kit.imp].map(id => ITEM[id].name.toUpperCase()).join(", ") + (O.scrip ? ", +" + O.scrip + " SCRIP" : "");
function bodyDone(actions) {
  if (G.body.from === "create" || !SAVE.char.created) { SAVE.char.created = true; const got = claimStarter(SAVE.char.origin); persist(); G.titleMsg = { txt: got ? "OPERATIVE CREATED · STARTER KIT ADDED" : "OPERATIVE SAVED", life: 3 }; }
  actions.back();
}

function updateBodyshop(rdt, actions) {
  const B = G.body, n = bodyRows(), t = BTABS[B.tab]; B.t += rdt; B.msgT += rdt;
  if (B.edit) { // typing a name
    const nm = SAVE.char.name;
    for (const k of G.pressed) { if (k === "enter" || k === "escape") { B.edit = false; persist(); AU.sfx("lock", 4); return; }
      if (k === "backspace") SAVE.char.name = nm.slice(0, -1); else if (/^[a-z0-9 .\-]$/.test(k) && nm.length < 14) SAVE.char.name = nm + k.toUpperCase(); }
    if (hit("lmb")) { B.edit = false; persist(); } return;
  }
  const tab = d => { B.tab = (B.tab + d + BTABS.length) % BTABS.length; B.sel = 0; AU.sfx("lock", 1); };
  if (hit("q")) tab(-1); if (hit("e") || hit("tab")) tab(1);
  if (t === "INVENTORY") { const cols = INV_COLS; if (hit("arrowleft") || hit("a")) B.sel = Math.max(0, B.sel - 1); if (hit("arrowright") || hit("d")) B.sel = Math.min(n - 1, B.sel + 1);
    if (hit("arrowup") || hit("w")) B.sel = Math.max(0, B.sel - cols); if (hit("arrowdown") || hit("s")) B.sel = Math.min(n - 1, B.sel + cols); }
  else { if (hit("arrowup") || hit("w")) { B.sel = (B.sel - 1 + n) % n; AU.sfx("lock", 0); } if (hit("arrowdown") || hit("s")) { B.sel = (B.sel + 1) % n; AU.sfx("lock", 0); }
    const dir = (hit("arrowright") || hit("d")) ? 1 : (hit("arrowleft") || hit("a")) ? -1 : 0;
    if (dir && t === "LOOK" && B.sel > 0) cycleLook(LOOK_SLOTS[B.sel - 1], dir); else if (dir && t === "LOOK" && B.sel === 0) { SAVE.char.name = randomName(); persist(); } else if (dir && t === "GEAR") cycleGear(GEAR_ROWS[B.sel], dir); }
  if (hit("enter")) bodyConfirm(actions);
  // mouse
  const rowH = t === "GEAR" ? 18 : t === "ORIGIN" ? 46 : 14, rowAt = y => Math.floor((y - BROW_Y) / rowH);
  const cellAt = (x, y) => { const cx = Math.floor((x - 200) / INV_W), cy = Math.floor((y - 44) / 24); return cx >= 0 && cx < INV_COLS && cy >= 0 ? cy * INV_COLS + cx : -1; };
  if (Math.hypot(mouse.x - B.mx, mouse.y - B.my) > .5) { B.mx = mouse.x; B.my = mouse.y; if (mouse.x > 198) { const i = t === "INVENTORY" ? cellAt(mouse.x, mouse.y) : rowAt(mouse.y); if (i >= 0 && i < n && mouse.y >= BROW_Y && mouse.y < 236) B.sel = i; } }
  if (hit("lmb")) { const x = mouse.x, y = mouse.y;
    if (y >= 20 && y < 36 && x > 196) { const k = Math.min(BTABS.length - 1, Math.floor((x - 198) / BTAB_W)); if (k !== B.tab) { B.tab = k; B.sel = 0; AU.sfx("lock", 1); } }
    else if (inBox(BTN_DONE, x, y)) bodyDone(actions); else if (inBox(BTN_BBACK, x, y)) actions.back();
    else if (x > 198 && y >= BROW_Y && y < 236) { const i = t === "INVENTORY" ? cellAt(x, y) : rowAt(y); if (i >= 0 && i < n) { if (i === B.sel || t !== "INVENTORY") { B.sel = i; bodyConfirm(actions); } else B.sel = i; } } }
  if (hit(" ")) bodyDone(actions);
  if (hit("escape")) actions.back();
}

/* ---- Drawing ---- */
function drawBodyshop(c, t) {
  const B = G.body, L = SAVE.char.look, tab = BTABS[B.tab], Lb = lab();
  const g = c.createLinearGradient(0, 0, 0, GH); g.addColorStop(0, "#120e1e"); g.addColorStop(1, "#05040b"); c.fillStyle = g; c.fillRect(0, 0, GW, GH);
  c.fillStyle = "rgba(255,255,255,.03)"; for (let x = 0; x < 192; x += 12) c.fillRect(x, 150, 1, 122); for (let y = 150; y < GH; y += 10) c.fillRect(0, y, 192, 1);
  // pedestal + preview
  const glowCol = optOf(L, "glow")[3]; c.save(); c.globalCompositeOperation = "lighter"; glow(c, 96, 205, 70, glowCol, .25); glow(c, 96, 60, 90, "#3b2f7a", .3); c.restore();
  c.strokeStyle = rgba(glowCol, .7); c.beginPath(); c.ellipse(96, 212, 44, 9, 0, 0, TAU); c.stroke(); c.strokeStyle = rgba(glowCol, .3); c.beginPath(); c.ellipse(96, 212, 54 + Math.sin(t * .003) * 3, 12, 0, 0, TAU); c.stroke();
  const running = Math.floor(t / 3000) % 2 === 1, fr = running ? (Math.floor(t / 110) % 2 ? "run1" : "run2") : (Math.floor(t / 400) % 2 ? "vesperB" : "vesper"), flip = Math.floor(t / 4500) % 2 === 1;
  const s = flip ? SPF[fr] : SP[fr]; c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.ellipse(96, 210, 30, 6, 0, 0, TAU); c.fill();
  c.save(); c.imageSmoothingEnabled = false; c.translate(96 - s.w * 2, 212 - s.h * 4 + 6); c.scale(4, 4); c.drawImage(s.cv, 0, 0); c.globalCompositeOperation = "lighter"; c.globalAlpha = .45; c.drawImage(s.gc, -s.G, -s.G); c.restore();
  txt(c, "OPERATIVE", 96, 8, COL.dim, 8, "center"); txt(c, SAVE.char.name + (B.edit && Math.floor(t / 400) % 2 ? "_" : ""), 96, 20, B.edit ? COL.amber : COL.ink, 16, "center");
  txt(c, ORIGIN[SAVE.char.origin].name, 96, 40, COL.magenta, 8, "center");
  txt(c, ITEM[SAVE.loadout.gun].name.toUpperCase() + " · " + ITEM[SAVE.loadout.oc].name.toUpperCase(), 96, 230, rgba(COL.cyan, .8), 8, "center");
  // right panel
  c.fillStyle = "rgba(6,5,14,.86)"; poly(c, [[196, 4], [476, 4], [476, 262], [470, 268], [190, 268], [190, 10]]); c.fill(); c.strokeStyle = "#3a3456"; c.save(); c.translate(.5, .5); poly(c, [[196, 4], [475, 4], [475, 261], [469, 267], [190, 267], [190, 10]]); c.stroke(); c.restore();
  txt(c, B.from === "create" ? "BODYSHOP · CREATE YOUR OPERATIVE" : "BODYSHOP", 200, 8, COL.dim); if (tab !== "INVENTORY") txt(c, SAVE.scrip + " SCRIP", 470, 8, COL.amber, 8, "right");
  BTABS.forEach((name, i) => { const x = 198 + i * BTAB_W, on = i === B.tab; c.fillStyle = on ? COL.cyan : "#16121f"; c.fillRect(x, 20, BTAB_W - 3, 15); txt(c, name, x + (BTAB_W - 3) / 2, 24, on ? "#05040b" : COL.dim, 8, "center"); });
  const sel = (y, h) => { c.fillStyle = "rgba(43,228,255,.12)"; c.fillRect(198, y, 274, h); c.fillStyle = COL.cyan; c.fillRect(198, y, 1, h); };
  if (tab === "LOOK") {
    const rows = [["NAME", B.edit ? "TYPING…" : SAVE.char.name, null]].concat(LOOK_SLOTS.map(sl => { const o = optOf(L, sl.key), own = sl.opts.filter(x => lookOwned(sl.key, x)).length; return [sl.label, o[1], o[3], own < sl.opts.length ? sl.opts.length - own : 0]; }));
    rows.forEach(([lbl, val, col, more], i) => { const y = BROW_Y + i * 14, on = i === B.sel; if (on) sel(y - 2, 13);
      txt(c, lbl, 202, y + 1, on ? COL.ink : COL.dim); const v = on ? "< " + val + " >" : val; txt(c, v, col ? 456 : 470, y + 1, on ? COL.cyan : COL.ink, 8, "right");
      if (col) { c.fillStyle = col; c.fillRect(460, y, 9, 8); c.strokeStyle = "#05040b"; c.strokeRect(460.5, y + .5, 8, 7); }
      if (more && on) txt(c, more + " MORE AT MAGPIE'S", 300, y + 1, rgba(COL.amber, .8)); });
  } else if (tab === "GEAR") {
    GEAR_ROWS.forEach((row, i) => { const [lbl, cat, slot] = row, y = BROW_Y + i * 18, on = i === B.sel, id = cat === "imp" ? SAVE.loadout.imp[slot] : SAVE.loadout[cat], it2 = id && ITEM[id]; if (on) sel(y - 2, 16);
      if (it2) itemIcon(c, it2, 202, y); txt(c, lbl, 230, y + 3, on ? COL.ink : COL.dim); txt(c, on ? "< " + (it2 ? it2.name.toUpperCase() : "EMPTY") + " >" : (it2 ? it2.name.toUpperCase() : "EMPTY"), 470, y + 3, on ? COL.cyan : COL.ink, 8, "right"); });
    const row = GEAR_ROWS[B.sel], id = row[1] === "imp" ? SAVE.loadout.imp[row[2]] : SAVE.loadout[row[1]], it2 = id && ITEM[id];
    if (it2) { txt(c, it2.name.toUpperCase(), 202, 130, COL.ink); wrapText(c, it2.desc.toUpperCase(), 266).slice(0, 3).forEach((l, k) => txt(c, l, 202, 142 + k * 10, COL.dim)); }
    txt(c, "ONLY GEAR YOU OWN IS LISTED. BUY MORE AT MAGPIE'S.", 202, 222, rgba(COL.amber, .8));
  } else if (tab === "INVENTORY") {
    const all = invItems(), gearOwned = all.filter(i => i.cat !== "style" && owns(i.id)).length, styleOwned = all.filter(i => i.cat === "style" && owns(i.id)).length;
    txt(c, `GEAR ${gearOwned}/${all.filter(i => i.cat !== "style").length} · STYLE ${styleOwned}/${all.filter(i => i.cat === "style").length}`, 470, 8, COL.amber, 8, "right");
    all.forEach((i, k) => { const x = 200 + (k % INV_COLS) * INV_W, y = 44 + Math.floor(k / INV_COLS) * 24, on = k === B.sel, own = owns(i.id);
      c.fillStyle = own ? "#16121f" : "#0b0912"; c.fillRect(x, y, INV_W - 2, 22); c.strokeStyle = on ? COL.cyan : equipped(i.id) ? rgba(COL.cyan, .5) : "#2a2640"; c.strokeRect(x + .5, y + .5, INV_W - 3, 21);
      c.globalAlpha = own ? 1 : .3; itemIcon(c, i, x + 1, y + 4); c.globalAlpha = 1; if (!own && !i.relic) { c.fillStyle = COL.magenta; c.fillRect(x + INV_W - 6, y + 2, 3, 3); } });
    const i = all[B.sel]; if (i) { const own = owns(i.id), kit = Object.values(ORIGIN[SAVE.char.origin].kit).flat().includes(i.id);
      const status = equipped(i.id) ? ["EQUIPPED", COL.cyan] : own ? [i.relic ? "ACT REWARD" : kit && SAVE.char.starterClaimed ? "OWNED · STARTER KIT" : "OWNED", i.relic ? COL.amber : COL.ink] : i.relic ? ["STORY ONLY · " + i.reqText.toUpperCase(), COL.amber] : !available(i) ? ["LOCKED · " + i.reqText.toUpperCase(), COL.magenta] : ["AT MAGPIE'S · " + priceOf(i) + " SC", COL.amber];
      txt(c, i.name.toUpperCase(), 202, 172, COL.ink); txt(c, status[0], 470, 172, status[1], 8, "right"); wrapText(c, i.desc.toUpperCase(), 266).slice(0, 3).forEach((l, k) => txt(c, l, 202, 186 + k * 10, COL.dim)); }
  } else if (tab === "ORIGIN") {
    ORIGINS.forEach((O, i) => { const y = BROW_Y + i * 46, on = i === B.sel, mine = SAVE.char.origin === O.id; if (on) sel(y - 2, 44);
      txt(c, O.name, 202, y + 1, mine ? COL.magenta : on ? COL.ink : COL.dim); txt(c, mine ? (SAVE.char.created ? "YOUR ORIGIN" : "SELECTED") : "", 470, y + 1, COL.magenta, 8, "right");
      const dl = wrapText(c, O.desc.toUpperCase(), 266).slice(0, 2), kl = wrapText(c, "KIT: " + kitNames(O), 266).slice(0, 4 - dl.length);
      dl.forEach((l, k) => txt(c, l, 202, y + 11 + k * 8, COL.dim)); kl.forEach((l, k) => txt(c, l, 202, y + 11 + (dl.length + k) * 8, rgba(COL.amber, .85))); });
  }
  if (B.msg && B.msgT < 3.5) txt(c, B.msg, 334, 226, rgba(COL.amber, Math.min(1, (3.5 - B.msgT) * 2)), 8, "center");
  c.fillStyle = "#16121f"; c.fillRect(...BTN_BBACK); txt(c, "BACK", BTN_BBACK[0] + 30, 249, COL.dim, 8, "center");
  const pulse = .75 + .25 * Math.sin(t * .006); c.fillStyle = rgba(COL.cyan, pulse); c.fillRect(...BTN_DONE); txt(c, (B.from === "create" || !SAVE.char.created) ? "CREATE >" : "DONE >", BTN_DONE[0] + 57, 249, "#05040b", 8, "center");
  const tabs = PAD.active ? (PAD.kind === "ps" ? "L1/R1" : "LB/RB") : "Q/E", ch = PAD.active ? "D-PAD" : "A/D", go = PAD.active ? (PAD.kind === "ps" ? "OPTIONS" : "START") : "SPACE";
  txt(c, `${tabs} TAB · ${ch} CHANGE · ${go} ${(B.from === "create" || !SAVE.char.created) ? "CREATE" : "DONE"}`, 334, 235, rgba(COL.dim, .7), 8, "center");
}
