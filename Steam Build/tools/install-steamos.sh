#!/usr/bin/env bash
# Install (or update) the Linux build of MURDER.EXE on SteamOS / Steam Deck, or any Linux desktop.
#
#   bash install-steamos.sh                          download the newest build of main with the GitHub CLI (gh auth login first)
#   bash install-steamos.sh ~/Downloads/MURDER.EXE-linux-unpacked.zip   install a build you downloaded from GitHub Actions
#   bash install-steamos.sh build.tar.gz             install a .tar.gz of dist/linux-unpacked
#   MURDER_URL=https://… bash install-steamos.sh     download from a link
#   bash install-steamos.sh --art                    only (re)apply the Steam library artwork
#
# It installs into ~/Games/MURDER.EXE (set MURDER_DIR to change it), adds an application-menu entry, and on the first
# install adds the game to Steam as a non-Steam game, so it shows up in Game Mode. Run it again to update; your save
# lives in ~/.config/MURDER.EXE and is never touched.
set -euo pipefail
REPO="${MURDER_REPO:-tomlawson9444/MURDER.EXE}"
DEST="${MURDER_DIR:-$HOME/Games/MURDER.EXE}"
ARTIFACT="MURDER.EXE-linux-unpacked"
DESKTOP="$HOME/.local/share/applications/murder-exe.desktop"
say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

# Steam library artwork for the non-Steam shortcut: the card, wide card, banner, logo and icon. Steam keeps custom art
# for a shortcut in userdata/<account>/config/grid/, named after the shortcut's ID (read from shortcuts.vdf). The images
# come from the repo's store kit (store/capsules), or from MURDER_ART_DIR if set. Steam shows them after a restart.
apply_art() {
  local art="$tmp/art" base="https://raw.githubusercontent.com/$REPO/main/store/capsules"; mkdir -p "$art"
  local files=(library_capsule.png library_header.png library_hero.jpg library_logo.png)
  for f in "${files[@]}"; do
    if [[ -n "${MURDER_ART_DIR:-}" ]]; then cp "$MURDER_ART_DIR/$f" "$art/$f" 2>/dev/null || true
    else curl -fsSL "$base/$f" -o "$art/$f" 2>/dev/null || rm -f "$art/$f"; fi
  done
  [[ -f "$DEST/icon.png" ]] && cp "$DEST/icon.png" "$art/icon.png"
  [[ -f "$art/library_capsule.png" ]] || { say "Couldn't fetch the library artwork (offline?); the game still works. Run 'bash $0 --art' later to add it."; return 0; }
  command -v python3 >/dev/null 2>&1 || { say "Python 3 is needed to add the library artwork; skipping it."; return 0; }
  python3 - "$art" "$DEST" <<'PY'
import sys, os, glob, struct, zlib, shutil, json
art, dest = sys.argv[1], sys.argv[2]
roots = [os.path.expanduser(p) for p in ("~/.steam/steam/userdata", "~/.local/share/Steam/userdata", "~/.var/app/com.valvesoftware.Steam/data/Steam/userdata")]
def shortcuts(data):
    # Binary VDF: 0x00 key (map start), 0x01 key string, 0x02 key int32, 0x08 map end. Yields each shortcut's fields.
    i, stack, cur = 0, [], None
    def cstr(j):
        k = data.index(b"\0", j); return data[j:k].decode("utf-8", "replace"), k + 1
    while i < len(data):
        t = data[i]; i += 1
        if t == 8:
            if stack:
                done = stack.pop()
                if len(stack) == 1: yield done  # a shortcut entry just closed (the list itself is the one left)
            continue
        key, i = cstr(i)
        if t == 0: m = {}; stack.append(m)
        elif t == 1: v, i = cstr(i); stack and stack[-1].__setitem__(key.lower(), v)
        elif t == 2: v = struct.unpack("<i", data[i:i + 4])[0]; i += 4; stack and stack[-1].__setitem__(key.lower(), v)
        elif t == 7: i += 8
        else: return
done = set()
for root in roots:
    for vdf in glob.glob(os.path.join(root, "*", "config", "shortcuts.vdf")):
        try: data = open(vdf, "rb").read()
        except OSError: continue
        for sc in shortcuts(data):
            name, exe = sc.get("appname", ""), sc.get("exe", "")
            if name.upper() != "MURDER.EXE" and "murder-exe" not in exe: continue
            appid = sc.get("appid")
            appid = (appid & 0xFFFFFFFF) if appid is not None else (zlib.crc32((exe + name).encode()) | 0x80000000)
            grid = os.path.join(os.path.dirname(vdf), "grid"); os.makedirs(grid, exist_ok=True)
            for src, out in (("library_capsule.png", f"{appid}p.png"), ("library_header.png", f"{appid}.png"), ("library_hero.jpg", f"{appid}_hero.jpg"), ("library_logo.png", f"{appid}_logo.png"), ("icon.png", f"{appid}_icon.png")):
                if os.path.exists(os.path.join(art, src)): shutil.copyfile(os.path.join(art, src), os.path.join(grid, out))
            json.dump({"nVersion": 1, "logoPosition": {"pinnedPosition": "BottomLeft", "nWidthPct": 42, "nHeightPct": 60}}, open(os.path.join(grid, f"{appid}.json"), "w"))
            done.add((vdf, appid))
for vdf, appid in sorted(done): print(f"   artwork added for shortcut {appid} ({vdf.split('/userdata/')[-1].split('/')[0]})")
sys.exit(0 if done else 3)
PY
  case $? in
    0) say "Library artwork added. Restart Steam (or switch to Game Mode) to see the card, banner and logo." ;;
    3) say "Steam hasn't saved the MURDER.EXE shortcut yet. Restart Steam once, then run: bash $0 --art" ;;
    *) say "Couldn't add the library artwork; the game still works." ;;
  esac
}
if [[ "${1:-}" == "--art" ]]; then apply_art; exit 0; fi

src="${1:-}"
if [[ -n "$src" ]]; then
  [[ -f "$src" ]] || die "No such file: $src"
elif [[ -n "${MURDER_URL:-}" ]]; then
  say "Downloading $MURDER_URL"; src="$tmp/download"; curl -fL --progress-bar "$MURDER_URL" -o "$src"
elif command -v gh >/dev/null 2>&1; then
  say "Finding the newest successful build of main on $REPO"
  run="$(gh run list -R "$REPO" --workflow "Steam Build" --branch main --status success --limit 1 --json databaseId --jq '.[0].databaseId')"
  [[ -n "$run" ]] || die "No successful build found on $REPO."
  say "Downloading build $run"; gh run download "$run" -R "$REPO" -n "$ARTIFACT" -D "$tmp/unpacked"
else
  die "Give me the downloaded build (the $ARTIFACT zip from the Actions tab on GitHub), install the GitHub CLI (gh) and run 'gh auth login', or set MURDER_URL."
fi

# Unpack whatever we were given into $tmp/unpacked. Several unpackers are tried in turn: bsdtar (part of SteamOS, reads zip
# and tar.gz), unzip, Python, then tar. Newer Python (3.14 on SteamOS) refuses the zips GitHub Actions makes.
unpack() {
  local f="$1" d="$2"
  try() { rm -rf "$d"; mkdir -p "$d"; "$@" >/dev/null 2>&1; }
  command -v bsdtar >/dev/null 2>&1 && try bsdtar -xf "$f" -C "$d" && return 0
  command -v unzip >/dev/null 2>&1 && try unzip -q -o "$f" -d "$d" && return 0
  command -v python3 >/dev/null 2>&1 && try python3 -m zipfile -e "$f" "$d" && return 0
  try tar -xzf "$f" -C "$d" && return 0
  return 1
}
if [[ ! -d "$tmp/unpacked" ]]; then
  say "Unpacking $(basename "$src")"
  unpack "$src" "$tmp/unpacked" || die "Couldn't unpack $src ($(du -h "$src" | cut -f1), $(file -b "$src" 2>/dev/null || echo "unknown type")). If it's small, download it again while signed in to GitHub; check it with sha256sum against the digest shown on the GitHub run."
fi
bin="$(find "$tmp/unpacked" -maxdepth 3 -type f -name murder-exe | head -n 1)"
[[ -n "$bin" ]] || die "That doesn't look like the Linux build (no murder-exe inside)."
app="$(dirname "$bin")"

# Zips from GitHub Actions lose the executable bits; put them back.
chmod +x "$app/murder-exe"; for f in murder-exe-bin chrome_crashpad_handler chrome-sandbox; do [[ -f "$app/$f" ]] && chmod +x "$app/$f"; done

say "Installing to $DEST"
mkdir -p "$(dirname "$DEST")"; rm -rf "$DEST.new"; mv "$app" "$DEST.new"; rm -rf "$DEST"; mv "$DEST.new" "$DEST"
[[ -f "$DEST/icon.png" ]] || curl -fsSL "https://raw.githubusercontent.com/$REPO/main/Steam%20Build/build/icon.png" -o "$DEST/icon.png" || true

first=0; [[ -f "$DESKTOP" ]] || first=1
mkdir -p "$(dirname "$DESKTOP")"
cat > "$DESKTOP" <<EOF
[Desktop Entry]
Type=Application
Name=MURDER.EXE
Comment=Neon-noir top-down shooter
Exec="$DEST/murder-exe" %U
Path=$DEST
Icon=$DEST/icon.png
Terminal=false
Categories=Game;ActionGame;
EOF
chmod +x "$DESKTOP"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$(dirname "$DESKTOP")" >/dev/null 2>&1 || true

# Add it to Steam once (re-running to update keeps the same shortcut). SteamOS has a helper for this; Steam must be running.
if (( first )); then
  if command -v steamos-add-to-steam >/dev/null 2>&1; then
    say "Adding MURDER.EXE to Steam"; steamos-add-to-steam "$DESKTOP" || say "Couldn't add it automatically: in Steam, Games > Add a Non-Steam Game, pick MURDER.EXE."
  else
    say "To play from Steam: Games > Add a Non-Steam Game to My Library, then pick MURDER.EXE."
  fi
fi
apply_art || true
say "Done. MURDER.EXE is installed in $DEST (start it from Steam, the app menu, or $DEST/murder-exe)."
