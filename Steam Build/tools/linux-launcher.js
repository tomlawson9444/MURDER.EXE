// electron-builder afterPack hook (Linux): turn the "murder-exe" you launch into a small shell launcher that starts the
// real program (murder-exe-bin) the way SteamOS needs:
// - --ozone-platform=x11: Electron otherwise draws through Wayland whenever a Wayland display is around, and SteamOS
//   Game Mode (gamescope) never shows such a window, so the game sits on Steam's loading spinner. The switch has to be on
//   the command line; Electron picks its display system before main.js runs. MURDER_WAYLAND=1 starts without it.
// - Steam's overlay library (gameoverlayrenderer.so, which Steam adds to LD_PRELOAD) is taken out: it crashes Chromium's
//   zygote helper process, so the game dies before its window opens. Game Mode's Steam button and Quick Access menu are
//   drawn by gamescope and still work; only the desktop Shift+Tab overlay is lost. Other LD_PRELOAD entries are kept.
//   MURDER_STEAM_OVERLAY=1 keeps it.
const fs = require("fs"), path = require("path");
exports.default = async ctx => {
  if (ctx.electronPlatformName !== "linux") return;
  const exe = path.join(ctx.appOutDir, ctx.packager.executableName), bin = exe + "-bin";
  fs.renameSync(exe, bin);
  fs.writeFileSync(exe, [
    "#!/bin/sh",
    "# MURDER.EXE launcher for Linux / SteamOS. See Steam Build/tools/linux-launcher.js for why.",
    'here="$(dirname "$(readlink -f "$0")")"',
    "# Steam's overlay crashes Chromium's helper processes: leave it out unless asked to keep it.",
    'if [ -z "$MURDER_STEAM_OVERLAY" ] && [ -n "$LD_PRELOAD" ]; then',
    '  LD_PRELOAD="$(printf "%s" "$LD_PRELOAD" | tr ": " "\\n\\n" | grep -v gameoverlayrenderer | paste -sd: -)"',
    '  if [ -n "$LD_PRELOAD" ]; then export LD_PRELOAD; else unset LD_PRELOAD; fi',
    "fi",
    '[ -n "$MURDER_WAYLAND" ] && exec "$here/' + path.basename(bin) + '" "$@"',
    'exec "$here/' + path.basename(bin) + '" --ozone-platform=x11 "$@"',
    ""].join("\n"), { mode: 0o755 });
};
