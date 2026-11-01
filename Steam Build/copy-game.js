// Copies the browser game from ../prototype into ./game for the desktop build (including the bundled fonts in
// prototype/fonts, so the Steam build never needs the internet). Developer pages (Map Lab) are left out.
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "..", "prototype"), OUT = path.join(__dirname, "game");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC)) if (/\.(js|html)$/.test(f) && !/^maplab\./.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
fs.cpSync(path.join(SRC, "fonts"), path.join(OUT, "fonts"), { recursive: true });
const html = path.join(OUT, "index.html"); fs.writeFileSync(html, fs.readFileSync(html, "utf8").replace("<title>MURDER.EXE Prototype</title>", "<title>MURDER.EXE</title>"));
// Stamp the build: package version, commit and date, shown on the title screen and in the credits.
let sha = (process.env.GITHUB_SHA || "").slice(0, 7);
if (!sha) try { sha = require("child_process").execSync("git rev-parse --short HEAD", { cwd: __dirname, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}
const V = { v: require("./package.json").version, sha, date: new Date().toISOString().slice(0, 10) };
fs.writeFileSync(path.join(OUT, "version.js"), "window.MURDER_VERSION = " + JSON.stringify(V) + ";\n");
console.log("Game copied to", OUT, "· v" + V.v, sha);
