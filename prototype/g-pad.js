/* Controller support: Xbox, PlayStation, Steam Deck and other standard-mapping gamepads.
   Twin-stick aim with aim assist, rumble, and button prompts that match the connected controller. */
"use strict";
const PAD = { active: false, kind: "xbox", prev: [], aimA: 0, mx: 0, my: 0, mag: 0, name: "" };
const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const LABELS = {
  xbox: { move: "L STICK", aim: "R STICK", fire: "RT", dash: "A / LB", oc: "HOLD LT", hack: "Y / RB", reload: "X", pause: "MENU", confirm: "A", hackShort: "Y", ocShort: "LT", name: "XBOX" },
  ps: { move: "L STICK", aim: "R STICK", fire: "R2", dash: "✕ / L1", oc: "HOLD L2", hack: "△ / R1", reload: "□", pause: "OPTIONS", confirm: "✕", hackShort: "△", ocShort: "L2", name: "PLAYSTATION" },
  deck: { move: "L STICK", aim: "R STICK", fire: "R2", dash: "A / L1", oc: "HOLD L2", hack: "Y / R1", reload: "X", pause: "MENU", confirm: "A", hackShort: "Y", ocShort: "L2", name: "STEAM DECK" },
  kb: { move: "WASD", aim: "MOUSE", fire: "CLICK", dash: "SPACE", oc: "HOLD RMB / F", hack: "Q", reload: "R", pause: "P", confirm: "CLICK", hackShort: "Q", ocShort: "RMB", name: "KEYBOARD" },
};
const lab = () => LABELS[PAD.active ? PAD.kind : "kb"];
function padKind(id) { id = id.toLowerCase(); if (/054c|dualsense|dualshock|playstation|wireless controller/.test(id)) return "ps"; if (/28de|steam deck|steam virtual|valve/.test(id)) return "deck"; return "xbox"; }
// Controller settings (pause menu): aim assist 0 off / 1 normal / 2 strong, auto-fire on the right stick, aim line, rumble, stick deadzone 0 low / 1 medium / 2 high.
const padCfg = () => (SAVE.pad = Object.assign({ assist: 1, autofire: false, aimline: true, rumble: true, dz: 1 }, SAVE.pad || {}));
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

function rumble(strong, weak, ms) {
  if (!PAD.active || !padCfg().rumble || G.noRumble) return; const gp = navigator.getGamepads && [...navigator.getGamepads()].find(g => g && g.connected && g.index === PAD.idx); const a = gp && gp.vibrationActuator;
  if (a && a.playEffect) a.playEffect("dual-rumble", { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch(() => {});
}
// Radial deadzone with an outer edge, so a worn stick still reaches full speed.
function stick(x, y, dz) { const m = Math.hypot(x, y); if (m < dz) return [0, 0, 0]; const v = Math.min(1, (m - dz) / (.94 - dz)), k = v / m; return [x * k, y * k, v]; }

// Aim assist: snap the reticle to the best target inside a cone along the aim direction. It stays on the same
// enemy while that enemy is still roughly where you're aiming, so the reticle doesn't flick between targets.
const aimable = e => e.alive && !e.dummyHidden && !(e.type === "blackwing" && (e.state === "air" || e.state === "target" || e.state === "lock"));
function assistTarget(ox, oy, a) {
  const str = [0, 1, 1.7][padCfg().assist]; if (!str) { PAD.lockE = null; return null; }
  const L = PAD.lockE; if (L && aimable(L)) { const x = L.x, y = L.y - BODY - (L.alt || 0), d = Math.hypot(x - ox, y - oy);
    if (d > 10 && d < 460 && Math.abs(angDiff(Math.atan2(y - oy, x - ox), a)) < (.2 + 10 / d) * str * 1.8 && los(ox, oy, x, y, 1e9)) return [x, y]; }
  PAD.lockE = null; let best = null, bs = 1e9;
  const consider = (x, y, pri, e) => { const d = Math.hypot(x - ox, y - oy); if (d < 10 || d > 440) return; const da = angDiff(Math.atan2(y - oy, x - ox), a);
    const cone = (.2 + 10 / d) * str; if (Math.abs(da) > cone) return; if (!los(ox, oy, x, y, 1e9)) return; const s = Math.abs(da) * 300 + d * .15 + pri; if (s < bs) { bs = s; best = [x, y]; PAD.lockE = e || null; } };
  for (const e of G.en) if (aimable(e)) consider(e.x, e.y - BODY - (e.alt || 0), 0, e);
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) { const ch = G.grid[j][i]; if (ch === "b" || ch === "n") consider(i * TS + 8, j * TS + (ch === "n" ? 2 : 10), 60); }
  return best;
}

// Hack with a pad: when nothing is under the reticle, take the best target roughly in the aim direction.
function padHackTarget(ox, oy) { let best = null, bs = 1e9;
  for (const e of G.en) { if (!e.alive || (BOSSY.has(e.type) && e.type !== "nest" && !(e.hp > 1 && !armored(e))) || (e.type === "blackwing" && e.state !== "vuln")) continue;
    const ey = e.y - BODY - (e.alt || 0), d = Math.hypot(e.x - ox, ey - oy), da = Math.abs(angDiff(Math.atan2(ey - oy, e.x - ox), PAD.aimA)); if (d > 260 || da > .55 || !los(ox, oy, e.x, ey, 1e9)) continue;
    const sc = da * 300 + d * .2; if (sc < bs) { bs = sc; best = { kind: "enemy", e, x: e.x, y: ey, r: BOSSY.has(e.type) && e.type !== "nest" ? 18 : 10 }; } }
  return best; }
// Menus: holding the stick or D-pad keeps scrolling after a short delay.
function navRepeat(rdt, dir, key) { const R = PAD.rep || (PAD.rep = {}); if (!dir) { R[key] = null; return; } if (!R[key]) { R[key] = .32; G.pressed.add(key); return; } R[key] -= rdt; if (R[key] <= 0) { R[key] = .07; G.pressed.add(key); } }
function menuNav(rdt, lx, ly, b, horiz) {
  navRepeat(rdt, b(BTN.UP) || ly < -.6, "arrowup"); navRepeat(rdt, b(BTN.DOWN) || ly > .6, "arrowdown");
  if (horiz) { navRepeat(rdt, b(BTN.LEFT) || lx < -.6, "arrowleft"); navRepeat(rdt, b(BTN.RIGHT) || lx > .6, "arrowright"); }
}
function pollPad(rdt) {
  // Player 1 gets the first controller that a local co-op player hasn't claimed.
  const claimed = typeof localPads === "function" ? localPads() : new Set(), pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected && !claimed.has(g.index)) : [];
  const gp = pads.find(g => g.index === PAD.idx) || pads[0]; if (gp) PAD.idx = gp.index;
  if (!gp) { mouse.padDown = mouse.padRdown = false; if (PAD.active) { PAD.active = false; updateHelp(); } return; }
  const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .35)), was = i => !!PAD.prev[i];
  const press = i => b(i) && !was(i);
  const dz = [.12, .2, .3][padCfg().dz], [lx, ly, lm] = stick(gp.axes[0] || 0, gp.axes[1] || 0, dz), [rx, ry, rm] = stick(gp.axes[2] || 0, gp.axes[3] || 0, dz + .05);
  const dx = (b(BTN.RIGHT) ? 1 : 0) - (b(BTN.LEFT) ? 1 : 0), dy = (b(BTN.DOWN) ? 1 : 0) - (b(BTN.UP) ? 1 : 0);
  const any = lm || rm || gp.buttons.some(x => x.pressed);
  if (any && !PAD.active) { PAD.active = true; PAD.kind = padKind(gp.id); G.banner = { txt: LABELS[PAD.kind].name + " CONTROLLER", col: COL.cyan, life: 1.6 }; updateHelp(); }
  if (!PAD.active) { mouse.padDown = mouse.padRdown = false; PAD.prev = gp.buttons.map(x => x.pressed); return; }
  PAD.mx = dx || dy ? dx / (Math.hypot(dx, dy) || 1) : lx; PAD.my = dx || dy ? dy / (Math.hypot(dx, dy) || 1) : ly; PAD.mag = dx || dy ? 1 : lm;
  const p = G.p, ox = p ? p.x + p.face * 12 : GW / 2, oy = p ? p.y - BODY - 2 : GH / 2;
  if (G.mode === "shop") { /* menu: sticks navigate, no aim */ } else if (G.mode === "play" && ocIn(G.p)) {
    // Overclock cursor: faster the further you push, and pulled onto enemies you haven't locked yet.
    const sp = 240 + 560 * rm * rm; mouse.x = Math.max(4, Math.min(GW - 4, mouse.x + rx * sp * rdt)); mouse.y = Math.max(4, Math.min(GH - 4, mouse.y + ry * sp * rdt));
    if (rm < .5) { let n = null, nd = 30; for (const e of G.en) { if (!e.alive || G.oc.locks.includes(e)) continue; const d = Math.hypot(e.x - mouse.x, e.y - (e.alt || 0) - 10 - mouse.y); if (d < nd) { nd = d; n = e; } }
      if (n) { const k = Math.min(1, rdt * 9); mouse.x += (n.x - mouse.x) * k; mouse.y += (n.y - (n.alt || 0) - 10 - mouse.y) * k; } }
  } else if (p && !G.paused) {
    // Aim: the right stick, smoothed a little so it doesn't jitter; without it, aim follows your movement until you first touch it.
    let want = null; if (rm > .15) { want = Math.atan2(ry, rx); PAD.aimed = true; } else if (PAD.mag > .3 && !PAD.aimed) want = Math.atan2(PAD.my, PAD.mx);
    if (want != null) PAD.aimA += angDiff(want, PAD.aimA) * Math.min(1, rdt * 28);
    const t = assistTarget(ox, oy, PAD.aimA); if (t) { mouse.x = t[0]; mouse.y = t[1]; } else { mouse.x = ox + Math.cos(PAD.aimA) * 90; mouse.y = oy + Math.sin(PAD.aimA) * 90; }
  }
  mouse.padDown = b(BTN.RT) || (padCfg().autofire && G.mode === "play" && !G.oc && !G.paused && rm > .82); mouse.padRdown = b(BTN.LT);
  if (G.mode === "play" && G.paused) { // pause menu
    if (press(BTN.A)) G.pressed.add("enter"); if (press(BTN.B) || press(BTN.START) || press(BTN.BACK)) G.pressed.add("p"); menuNav(rdt, lx, ly, b, true);
  } else if (G.mode === "play") {
    if (press(BTN.RT)) G.pressed.add("lmb"); if (press(BTN.LT)) G.pressed.add("rmb");
    if (press(BTN.A) || press(BTN.LB)) G.pressed.add(" "); if (press(BTN.X)) G.pressed.add("r");
    if (press(BTN.Y) || press(BTN.RB)) G.pressed.add(ocIn(G.p) ? "oclock" : "q"); if (press(BTN.START) || press(BTN.BACK)) G.pressed.add("p");
  } else if (G.mode === "body") {
    if (press(BTN.X)) G.pressed.add("r"); if (press(BTN.Y)) G.pressed.add("x");
    if (press(BTN.A)) G.pressed.add("enter"); if (press(BTN.START)) G.pressed.add(" "); if (press(BTN.B) || press(BTN.BACK)) G.pressed.add("escape");
    if (press(BTN.LB)) G.pressed.add("q"); if (press(BTN.RB)) G.pressed.add("e"); menuNav(rdt, lx, ly, b, true);
  } else if (G.mode === "shop") {
    if (press(BTN.X)) G.pressed.add("t");
    if (press(BTN.A)) G.pressed.add("enter"); if (press(BTN.START)) G.pressed.add(" "); if (press(BTN.B) || press(BTN.BACK)) G.pressed.add("escape");
    if (press(BTN.LB)) G.pressed.add("q"); if (press(BTN.RB)) G.pressed.add("e"); if (press(BTN.LEFT)) G.pressed.add("arrowleft"); if (press(BTN.RIGHT)) G.pressed.add("arrowright"); menuNav(rdt, lx, ly, b, false);
  } else {
    if (press(BTN.A) || press(BTN.START) || press(BTN.RT)) G.pressed.add("enter"); if (press(BTN.B) || press(BTN.BACK)) G.pressed.add("escape");
    menuNav(rdt, lx, ly, b, true);
  }
  PAD.prev = gp.buttons.map((x, i) => b(i));
}
function updateHelp() {
  const el = document.querySelector(".help"); if (!el) return; const L = lab();
  el.innerHTML = `<b>${L.move}</b> move · <b>${L.aim}</b> aim · <b>${L.fire}</b> shoot · <b>${L.dash}</b> dash · <b>${L.oc}</b> Overclock · <b>${L.hack}</b> hack · <b>${L.reload}</b> reload · <b>${L.pause}</b> pause`;
}
addEventListener("gamepadconnected", e => { PAD.kind = padKind(e.gamepad.id); });
addEventListener("pointermove", () => { if (PAD.active) { PAD.active = false; updateHelp(); } });
addEventListener("keydown", () => { if (PAD.active) { PAD.active = false; updateHelp(); } });
