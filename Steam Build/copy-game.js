// Copies the browser game from ../prototype into ./game for the desktop build (including the bundled fonts in
// prototype/fonts, so the Steam build never needs the internet). Developer pages (Map Lab) are left out.
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "..", "prototype"), OUT = path.join(__dirname, "game");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC)) if (/\.(js|html)$/.test(f) && !/^maplab\./.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
fs.cpSync(path.join(SRC, "fonts"), path.join(OUT, "fonts"), { recursive: true });
const html = path.join(OUT, "index.html"); fs.writeFileSync(html, fs.readFileSync(html, "utf8").replace("<title>MURDER.EXE Prototype</title>", "<title>MURDER.EXE</title>"));
console.log("Game copied to", OUT);
