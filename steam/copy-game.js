// Copies the browser game from ../prototype into ./game for the desktop build, and bundles the two web fonts
// (Silkscreen and Chakra Petch) so the Steam build never needs the internet.
const fs = require("fs"), path = require("path"), https = require("https");
const SRC = path.join(__dirname, "..", "prototype"), OUT = path.join(__dirname, "game");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });
for (const f of fs.readdirSync(SRC)) if (/\.(js|html)$/.test(f) && f !== "maplab.html" && f !== "maplab.js") fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
const get = (url, binary) => new Promise((ok, fail) => https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36" } }, r => {
  const parts = []; r.on("data", d => parts.push(d)); r.on("end", () => ok(binary ? Buffer.concat(parts) : Buffer.concat(parts).toString())); }).on("error", fail));
(async () => {
  const link = "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Silkscreen&display=swap";
  let html = fs.readFileSync(path.join(OUT, "index.html"), "utf8");
  try {
    let css = await get(link), n = 0;
    for (const m of [...css.matchAll(/url\((https:[^)]+)\)/g)]) { const file = "font" + n++ + ".woff2"; fs.writeFileSync(path.join(OUT, "fonts", file), await get(m[1], true)); css = css.replace(m[1], "fonts/" + file); }
    fs.writeFileSync(path.join(OUT, "fonts.css"), css);
    html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, "").replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts.css">');
    console.log("Bundled", n, "font files.");
  } catch (e) { console.warn("Could not download the fonts (" + e.message + "); the build will use fallback fonts."); }
  html = html.replace("<title>MURDER.EXE Prototype</title>", "<title>MURDER.EXE</title>");
  fs.writeFileSync(path.join(OUT, "index.html"), html); console.log("Game copied to", OUT);
})();
