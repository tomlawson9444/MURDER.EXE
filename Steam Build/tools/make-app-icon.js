// Draws the desktop app icon (build/icon.png, 512x512) from the game: the operative over the MURDER.EXE colours.
// Needs Playwright (npm i -D playwright): node tools/make-app-icon.js
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), GAME = "file://" + path.join(ROOT, "..", "prototype", "index.html");
(async () => {
  const b = await chromium.launch(), p = await b.newPage(); await p.goto(GAME + "#testchar"); await p.waitForTimeout(2500);
  const url = await p.evaluate(() => {
    const C = document.createElement("canvas"); C.width = C.height = 512; const c = C.getContext("2d"); c.imageSmoothingEnabled = false;
    const g = c.createRadialGradient(256, 230, 20, 256, 256, 360); g.addColorStop(0, "#2a0d2e"); g.addColorStop(1, "#05040b"); c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    c.fillStyle = "rgba(43,228,255,.08)"; for (let y = 0; y < 512; y += 8) c.fillRect(0, y, 512, 2); // scanlines
    const s = SP.vesper, k = 11; c.save(); c.globalCompositeOperation = "lighter"; glow(c, 256, 250, 190, COL.cyan, .35); c.restore();
    c.drawImage(s.cv, Math.round(256 - s.w * k / 2), 40, s.w * k, s.h * k);
    c.font = '700 120px "Chakra Petch"'; c.textAlign = "center"; c.textBaseline = "alphabetic";
    [["#ff2d8a", -5], ["#2be4ff", 5], ["#f5f2ff", 0]].forEach(([col, dx]) => { c.fillStyle = col; c.fillText("M.EXE", 256 + dx, 488); });
    c.strokeStyle = "#ff2d8a"; c.lineWidth = 10; c.strokeRect(5, 5, 502, 502);
    return C.toDataURL("image/png"); });
  fs.mkdirSync(path.join(ROOT, "build"), { recursive: true }); fs.writeFileSync(path.join(ROOT, "build", "icon.png"), Buffer.from(url.split(",")[1], "base64")); console.log("Wrote build/icon.png"); await b.close();
})();
