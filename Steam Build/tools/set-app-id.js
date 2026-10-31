// Point the Steam build at your Steam app in one go:
//   npm run set-app-id -- <appId> [windowsDepotId] [linuxDepotId]
// Updates "steamAppId" in package.json (what release builds use), steam_appid.txt (for running it locally), and the
// SteamPipe scripts' app and depot IDs. Depot IDs default to appId + 1 (Windows) and appId + 2 (Linux); check them on
// your app's SteamPipe > Depots page in Steamworks.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), num = v => /^\d{1,10}$/.test(String(v || "")) ? String(v) : null;
const [appArg, winArg, linArg] = process.argv.slice(2), appId = num(appArg);
if (!appId) { console.error("Usage: npm run set-app-id -- <appId> [windowsDepotId] [linuxDepotId]"); process.exit(1); }
const win = num(winArg) || String(+appId + 1), lin = num(linArg) || String(+appId + 2);

const pkgFile = path.join(root, "package.json"), pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
pkg.steamAppId = +appId; fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
fs.writeFileSync(path.join(root, "steam_appid.txt"), appId + "\n");
const vdf = (file, fn) => { const f = path.join(root, "steampipe", file); fs.writeFileSync(f, fn(fs.readFileSync(f, "utf8"))); };
// The "Depots" block lists the Windows depot first, then Linux (see app_build.vdf).
vdf("app_build.vdf", s => { return s.replace(/"AppID" "\d+"/, `"AppID" "${appId}"`).replace(/^(\t\t)"\d+"( "depot_(windows|linux)\.vdf")/gm, (m, tab, rest, os) => `${tab}"${os === "windows" ? win : lin}"${rest}`); });
vdf("depot_windows.vdf", s => s.replace(/"DepotID" "\d+"/, `"DepotID" "${win}"`));
vdf("depot_linux.vdf", s => s.replace(/"DepotID" "\d+"/, `"DepotID" "${lin}"`));
console.log(`Steam App ID ${appId} · Windows depot ${win} · Linux depot ${lin}`);
console.log("Updated package.json (steamAppId), steam_appid.txt and steampipe/*.vdf. Commit them, then build.");
