// Draws every Steam store and library image from the game's own key art (prototype/keyart.js) and logo.
// Needs Playwright and the game served locally:  cd prototype && python3 -m http.server 8765
// then:  node store/tools/make-capsules.js   (writes store/capsules/)
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "capsules"), URL = process.env.GAME_URL || "http://localhost:8765/index.html#testchar";
// name, width, height, how the key art is laid out (kaW x kaH drawn at ox, oy), logo { x, y, size, align } or null, darken
const SPECS = [
  ["header_capsule", 920, 430, { kaW: 920, kaH: 430, ox: 0, oy: 0 }, { x: .05, y: .86, size: .2, align: "left", tag: true, maxW: .64 }],
  ["small_capsule", 462, 174, { kaW: 520, kaH: 174, ox: -40, oy: 0 }, { x: .5, y: .72, size: .38, align: "center", maxW: .86 }, .45],
  ["main_capsule", 1232, 706, { kaW: 1232, kaH: 706, ox: 0, oy: 0 }, { x: .05, y: .87, size: .17, align: "left", tag: true, maxW: .62 }],
  ["vertical_capsule", 748, 896, { kaW: 1380, kaH: 896, ox: -400, oy: 0 }, { x: .5, y: .9, size: .19, align: "center", tag: true }],
  ["library_capsule", 600, 900, { kaW: 1340, kaH: 900, ox: -400, oy: 0 }, { x: .5, y: .9, size: .17, align: "center", tag: true }],
  ["library_header", 920, 430, { kaW: 920, kaH: 430, ox: 0, oy: 0 }, { x: .05, y: .86, size: .2, align: "left", maxW: .64 }],
  ["library_hero", 3840, 1240, { kaW: 3840, kaH: 1240, ox: 0, oy: 0 }, null],
  ["page_background", 1438, 810, { kaW: 1438, kaH: 810, ox: 0, oy: 0 }, null, .35],
];
(async () => {
  const b = await chromium.launch(), p = await b.newPage(); await p.goto(URL); await p.waitForTimeout(2000);
  await p.evaluate(() => Promise.all([document.fonts.load('700 100px "Chakra Petch"'), document.fonts.load('16px Silkscreen')]));
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, W, H, ka, logo, dark] of SPECS) {
    const big = !logo; // the large logo-free backgrounds are JPEG: the film grain makes them huge as PNG
    const url = await p.evaluate(([W, H, ka, logo, dark, big]) => {
      const C = document.createElement("canvas"); C.width = W; C.height = H; const c = C.getContext("2d");
      const K = buildKA(ka.kaW, ka.kaH, 11), A = document.createElement("canvas"); A.width = ka.kaW; A.height = ka.kaH; drawKA(A.getContext("2d"), K, 1000);
      c.drawImage(A, ka.ox, ka.oy);
      if (dark) { c.fillStyle = `rgba(5,4,11,${dark})`; c.fillRect(0, 0, W, H); }
      if (logo) {
        const fit = 100 / ((c.font = '700 100px "Chakra Petch"', c.measureText("MURDER").width) + 6 + (c.font = "36px Silkscreen", c.measureText(".EXE").width)); // logo width per pixel of size
        const S = Math.min(Math.min(W, H * 1.6) * logo.size, W * (logo.maxW || .88) * fit), x = W * logo.x, y = H * logo.y;
        const g = c.createLinearGradient(0, y - S * 1.6, 0, H); g.addColorStop(0, "rgba(5,4,11,0)"); g.addColorStop(.55, "rgba(5,4,11,.72)"); g.addColorStop(1, "rgba(5,4,11,.9)"); c.fillStyle = g; c.fillRect(0, y - S * 1.6, W, H);
        c.font = `700 ${S}px "Chakra Petch"`; c.textBaseline = "alphabetic"; const mw = c.measureText("MURDER").width;
        c.font = `${Math.round(S * .36)}px Silkscreen`; const ew = c.measureText(".EXE").width; const total = mw + S * .06 + ew;
        const x0 = logo.align === "center" ? x - total / 2 : x, off = Math.max(2, S * .045);
        c.save(); c.shadowColor = "#ff2d8a"; c.shadowBlur = S * .35; c.font = `700 ${S}px "Chakra Petch"`; c.textAlign = "left"; c.fillStyle = "rgba(255,45,138,.35)"; c.fillText("MURDER", x0, y); c.restore();
        c.font = `700 ${S}px "Chakra Petch"`; c.textAlign = "left"; [["#ff2d8a", -off], ["#2be4ff", off], ["#f5f2ff", 0]].forEach(([col, dx]) => { c.fillStyle = col; c.fillText("MURDER", x0 + dx, y); });
        c.font = `${Math.round(S * .36)}px Silkscreen`; c.fillStyle = "#ff2d8a"; c.save(); c.shadowColor = "#ff2d8a"; c.shadowBlur = S * .2; c.fillText(".EXE", x0 + mw + S * .06, y - S * .42); c.restore();
        if (logo.tag) { c.font = `${Math.max(12, Math.round(S * .16))}px Silkscreen`; c.fillStyle = "#e9e6f5"; c.textAlign = logo.align === "center" ? "center" : "left";
          c.fillText("ONE BULLET. ONE LIFE.", logo.align === "center" ? x : x0 + S * .03, y + S * .34); }
      }
      return big ? C.toDataURL("image/jpeg", .93) : C.toDataURL("image/png");
    }, [W, H, ka, logo, dark, big]);
    fs.writeFileSync(path.join(OUT, name + (big ? ".jpg" : ".png")), Buffer.from(url.split(",")[1], "base64")); console.log("wrote", name, W + "x" + H);
  }
  // Library logo: transparent, logo only.
  const L = await p.evaluate(() => { const W = 1280, H = 720, C = document.createElement("canvas"); C.width = W; C.height = H; const c = C.getContext("2d"), S = 260;
    c.font = `700 ${S}px "Chakra Petch"`; const mw = c.measureText("MURDER").width; c.font = `${Math.round(S * .36)}px Silkscreen`; const ew = c.measureText(".EXE").width, x0 = (W - (mw + S * .06 + ew)) / 2, y = H / 2 + S * .35;
    c.font = `700 ${S}px "Chakra Petch"`; [["#ff2d8a", -11], ["#2be4ff", 11], ["#f5f2ff", 0]].forEach(([col, dx]) => { c.fillStyle = col; c.fillText("MURDER", x0 + dx, y); });
    c.font = `${Math.round(S * .36)}px Silkscreen`; c.fillStyle = "#ff2d8a"; c.fillText(".EXE", x0 + mw + S * .06, y - S * .42); return C.toDataURL("image/png"); });
  fs.writeFileSync(path.join(OUT, "library_logo.png"), Buffer.from(L.split(",")[1], "base64")); console.log("wrote library_logo 1280x720 (transparent)");
  await b.close();
})();
