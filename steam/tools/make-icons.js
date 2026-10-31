// Writes the Steamworks achievement setup pack from the game's own data:
//   achievements.json / achievements.csv  - API name, display name, description (enter these on the partner site)
//   icons/<API_NAME>.jpg and icons/<API_NAME>_locked.jpg - 64x64 icons drawn with the game's sprites
// Needs Playwright (npm i -D playwright) and runs the game page headless: node tools/make-icons.js
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), GAME = "file://" + path.join(ROOT, "..", "prototype", "index.html");
// Which game sprite stands for each achievement (falls back to a glyph).
const ART = { ch1: "vesper", act1: "ferryman", act2: "cinder", act3: "archivist", act4: "vanexo", act5: "corvina", endings: "corvus", shards: "shard", stall: "stall", racks: "rack",
  resonance: "corvus", k100: "corvid", k1000: "shrike", k5000: "blackwing", hacks: "hexer", arc3: "hexer", blast5: "carrion", volley: "#6", mass: "#10", graze: "#~", falls: "corvid",
  dashkill: "harpoon", freeze: "cryo", ricochet: "coil", longshot: "longbow", heat5: "#5", market: "blackwing", rookery: "augur", deep: "nest", score: "#$", gear: "kestrel", style: "magpie",
  range: "wisp", build: "#3", random: "vesper", daily: "#D", daily3: "#3D", rush: "choir", rushfast: "#15" };
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto(GAME + "#testchar"); await p.waitForTimeout(2500);
  const out = await p.evaluate(ART => {
    shopSprites(); propSprites(); storySprites(); ["ferryman", "cinder", "widow", "archivist", "scarecrow", "vanexo", "corvina", "choir"].forEach(k => { try { bossSprite && bossSprite(k); } catch (e) {} });
    const icon = (A, locked) => { const C = document.createElement("canvas"); C.width = C.height = 64; const c = C.getContext("2d"); c.imageSmoothingEnabled = false;
      const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, locked ? "#14121c" : "#2a0d22"); g.addColorStop(1, "#05040b"); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      const art = ART[A[0]] || "#" + A[1][0], s = art[0] !== "#" && (SP[art] || (typeof sprOf === "function" && sprOf(art, 1)));
      if (s) { const k = Math.min(52 / s.w, 48 / s.h), w = Math.round(s.w * k), h = Math.round(s.h * k); c.drawImage(s.cv, Math.round((64 - w) / 2), Math.round((60 - h) / 2) + 2, w, h); }
      else { c.font = "700 " + (art.length > 3 ? 18 : 26) + 'px "Chakra Petch", sans-serif'; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#ffb22e"; c.fillText(art.slice(1), 32, 34); }
      c.strokeStyle = locked ? "#3a3456" : "#ffb22e"; c.lineWidth = 2; c.strokeRect(1, 1, 62, 62);
      if (locked) { const d = c.getImageData(0, 0, 64, 64); for (let i = 0; i < d.data.length; i += 4) { const v = (d.data[i] * .3 + d.data[i + 1] * .59 + d.data[i + 2] * .11) * .55; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; } c.putImageData(d, 0, 0); }
      return C.toDataURL("image/jpeg", .95); };
    return ACH.map(A => ({ api: steamName(A[0]), id: A[0], name: A[1], desc: A[2], reward: A[3] || 200, on: icon(A, false), off: icon(A, true) }));
  }, ART);
  fs.mkdirSync(path.join(ROOT, "icons"), { recursive: true });
  for (const a of out) { fs.writeFileSync(path.join(ROOT, "icons", a.api + ".jpg"), Buffer.from(a.on.split(",")[1], "base64")); fs.writeFileSync(path.join(ROOT, "icons", a.api + "_locked.jpg"), Buffer.from(a.off.split(",")[1], "base64")); }
  const rows = out.map(a => ({ api: a.api, name: a.name, description: a.desc, icon: "icons/" + a.api + ".jpg", icon_locked: "icons/" + a.api + "_locked.jpg", hidden: false }));
  fs.writeFileSync(path.join(ROOT, "achievements.json"), JSON.stringify(rows, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "achievements.csv"), "api_name,display_name,description,icon,icon_locked\n" + rows.map(r => [r.api, r.name, r.description, r.icon, r.icon_locked].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n") + "\n");
  console.log("Wrote", rows.length, "achievements and", rows.length * 2, "icons."); await b.close();
})();
