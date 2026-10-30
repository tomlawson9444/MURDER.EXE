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
function padKind(id) { id = id.toLowerCase(); if (/054c|dualsense|dualshock|playstation|wireless controller/.test(id)) return "ps"; if (/28de|steam deck|valve/.test(id)) return "deck"; return "xbox"; }

function rumble(strong, weak, ms) {
  if (!PAD.active) return; const gp = navigator.getGamepads && [...navigator.getGamepads()].find(g => g && g.connected); const a = gp && gp.vibrationActuator;
  if (a && a.playEffect) a.playEffect("dual-rumble", { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch(() => {});
}
function stick(x, y, dz) { const m = Math.hypot(x, y); if (m < dz) return [0, 0, 0]; const k = Math.min(1, (m - dz) / (1 - dz)) / m; return [x * k, y * k, Math.min(1, (m - dz) / (1 - dz))]; }

// Aim assist: snap the reticle to the closest target inside a narrow cone along the aim direction.
function assistTarget(ox, oy, a) {
  let best = null, bs = 1e9;
  const consider = (x, y, pri) => { const d = Math.hypot(x - ox, y - oy); if (d < 10 || d > 440) return; let da = Math.atan2(y - oy, x - ox) - a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    const cone = .2 + 10 / d; if (Math.abs(da) > cone) return; if (!los(ox, oy, x, y, 1e9)) return; const s = Math.abs(da) * 300 + d * .15 + pri; if (s < bs) { bs = s; best = [x, y]; } };
  for (const e of G.en) if (e.alive && !(e.type === "blackwing" && (e.state === "air" || e.state === "target" || e.state === "lock"))) consider(e.x, e.y - BODY - (e.alt || 0), 0);
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) { const ch = G.grid[j][i]; if (ch === "b" || ch === "n") consider(i * TS + 8, j * TS + (ch === "n" ? 2 : 10), 60); }
  return best;
}

function pollPad(rdt) {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected) : []; const gp = pads[0];
  if (!gp) { mouse.padDown = mouse.padRdown = false; if (PAD.active) { PAD.active = false; updateHelp(); } return; }
  const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .35)), was = i => !!PAD.prev[i];
  const press = i => b(i) && !was(i);
  const [lx, ly, lm] = stick(gp.axes[0] || 0, gp.axes[1] || 0, .2), [rx, ry, rm] = stick(gp.axes[2] || 0, gp.axes[3] || 0, .25);
  const dx = (b(BTN.RIGHT) ? 1 : 0) - (b(BTN.LEFT) ? 1 : 0), dy = (b(BTN.DOWN) ? 1 : 0) - (b(BTN.UP) ? 1 : 0);
  const any = lm || rm || gp.buttons.some(x => x.pressed);
  if (any && !PAD.active) { PAD.active = true; PAD.kind = padKind(gp.id); G.banner = { txt: LABELS[PAD.kind].name + " CONTROLLER", col: COL.cyan, life: 1.6 }; updateHelp(); }
  if (!PAD.active) { mouse.padDown = mouse.padRdown = false; PAD.prev = gp.buttons.map(x => x.pressed); return; }
  PAD.mx = dx || dy ? dx / (Math.hypot(dx, dy) || 1) : lx; PAD.my = dx || dy ? dy / (Math.hypot(dx, dy) || 1) : ly; PAD.mag = dx || dy ? 1 : lm;
  const p = G.p, ox = p ? p.x + p.face * 12 : GW / 2, oy = p ? p.y - BODY - 2 : GH / 2;
  if (G.mode === "shop") { /* menu: sticks navigate, no aim */ } else if (G.mode === "play" && G.oc) {
    mouse.x = Math.max(4, Math.min(GW - 4, mouse.x + rx * 380 * rdt)); mouse.y = Math.max(4, Math.min(GH - 4, mouse.y + ry * 380 * rdt));
  } else if (p) {
    if (rm > .15) PAD.aimA = Math.atan2(ry, rx); else if (PAD.mag > .3 && !PAD.aimed) PAD.aimA = Math.atan2(PAD.my, PAD.mx);
    if (rm > .15) PAD.aimed = true;
    const t = assistTarget(ox, oy, PAD.aimA); if (t) { mouse.x = t[0]; mouse.y = t[1]; } else { mouse.x = ox + Math.cos(PAD.aimA) * 90; mouse.y = oy + Math.sin(PAD.aimA) * 90; }
  }
  mouse.padDown = b(BTN.RT); mouse.padRdown = b(BTN.LT);
  if (G.mode === "play") {
    if (press(BTN.RT)) G.pressed.add("lmb"); if (press(BTN.LT)) G.pressed.add("rmb");
    if (press(BTN.A) || press(BTN.LB)) G.pressed.add(" "); if (press(BTN.X)) G.pressed.add("r");
    if (press(BTN.Y) || press(BTN.RB)) G.pressed.add("q"); if (press(BTN.START) || press(BTN.BACK)) G.pressed.add("p");
    if (G.paused && press(BTN.A)) G.pressed.add("lmb");
  } else if (G.mode === "body") {
    if (press(BTN.A)) G.pressed.add("enter"); if (press(BTN.START)) G.pressed.add(" "); if (press(BTN.B) || press(BTN.BACK)) G.pressed.add("escape");
    if (press(BTN.LB)) G.pressed.add("q"); if (press(BTN.RB)) G.pressed.add("e"); if (press(BTN.LEFT)) G.pressed.add("arrowleft"); if (press(BTN.RIGHT)) G.pressed.add("arrowright");
    const fh = lx < -.6 && !PAD.flick ? -1 : lx > .6 && !PAD.flick ? 1 : 0; PAD.flick = Math.abs(lx) > .6; if (fh < 0) G.pressed.add("arrowleft"); if (fh > 0) G.pressed.add("arrowright");
    const fv = ly < -.6 && !PAD.flickV ? -1 : ly > .6 && !PAD.flickV ? 1 : 0; PAD.flickV = Math.abs(ly) > .6;
    if (press(BTN.UP) || fv < 0) G.pressed.add("arrowup"); if (press(BTN.DOWN) || fv > 0) G.pressed.add("arrowdown");
  } else if (G.mode === "shop") {
    if (press(BTN.A)) G.pressed.add("enter"); if (press(BTN.START)) G.pressed.add(" "); if (press(BTN.B) || press(BTN.BACK)) G.pressed.add("escape");
    if (press(BTN.LB)) G.pressed.add("q"); if (press(BTN.RB)) G.pressed.add("e"); if (press(BTN.LEFT)) G.pressed.add("arrowleft"); if (press(BTN.RIGHT)) G.pressed.add("arrowright");
    const fv = ly < -.6 && !PAD.flickV ? -1 : ly > .6 && !PAD.flickV ? 1 : 0; PAD.flickV = Math.abs(ly) > .6;
    if (press(BTN.UP) || fv < 0) G.pressed.add("arrowup"); if (press(BTN.DOWN) || fv > 0) G.pressed.add("arrowdown");
  } else {
    if (press(BTN.A) || press(BTN.START) || press(BTN.RT)) G.pressed.add("enter"); if (press(BTN.B) || press(BTN.BACK)) G.pressed.add("escape");
    const fl = lx < -.6 && !PAD.flick ? -1 : lx > .6 && !PAD.flick ? 1 : 0; PAD.flick = Math.abs(lx) > .6;
    if (press(BTN.LEFT) || fl < 0) G.pressed.add("arrowleft"); if (press(BTN.RIGHT) || fl > 0) G.pressed.add("arrowright");
    const fv = ly < -.6 && !PAD.flickV ? -1 : ly > .6 && !PAD.flickV ? 1 : 0; PAD.flickV = Math.abs(ly) > .6;
    if (press(BTN.UP) || fv < 0) G.pressed.add("arrowup"); if (press(BTN.DOWN) || fv > 0) G.pressed.add("arrowdown");
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
