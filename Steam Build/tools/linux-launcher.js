// electron-builder afterPack hook (Linux): turn the "murder-exe" you launch into a small shell launcher that starts the
// real program (murder-exe-bin) with --ozone-platform=x11. Electron otherwise draws through Wayland whenever a Wayland
// display is around, and SteamOS Game Mode (gamescope) never shows such a window: the game sits on Steam's loading
// spinner. The switch has to be on the command line; Electron picks its display system before main.js runs.
// Set MURDER_WAYLAND=1 to start without it.
const fs = require("fs"), path = require("path");
exports.default = async ctx => {
  if (ctx.electronPlatformName !== "linux") return;
  const exe = path.join(ctx.appOutDir, ctx.packager.executableName), bin = exe + "-bin";
  fs.renameSync(exe, bin);
  fs.writeFileSync(exe, `#!/bin/sh
# MURDER.EXE launcher: runs the game through X11 (XWayland) so it shows up in SteamOS Game Mode. See tools/linux-launcher.js.
here="$(dirname "$(readlink -f "$0")")"
[ -n "$MURDER_WAYLAND" ] && exec "$here/${path.basename(bin)}" "$@"
exec "$here/${path.basename(bin)}" --ozone-platform=x11 "$@"
`, { mode: 0o755 });
};
