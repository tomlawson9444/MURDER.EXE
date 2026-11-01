#!/usr/bin/env bash
# Install (or update) the Linux build of MURDER.EXE on SteamOS / Steam Deck, or any Linux desktop.
#
#   bash install-steamos.sh                          download the newest build of main with the GitHub CLI (gh auth login first)
#   bash install-steamos.sh ~/Downloads/MURDER.EXE-linux-unpacked.zip   install a build you downloaded from GitHub Actions
#   bash install-steamos.sh build.tar.gz             install a .tar.gz of dist/linux-unpacked
#   MURDER_URL=https://… bash install-steamos.sh     download from a link
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

# Unpack whatever we were given into $tmp/unpacked.
if [[ ! -d "$tmp/unpacked" ]]; then
  mkdir -p "$tmp/unpacked"
  # Python (on every SteamOS) checks and unpacks the archive itself, rather than trusting its name or first bytes.
  kind="$(python3 -c 'import sys, zipfile, tarfile; p = sys.argv[1]; print("zip" if zipfile.is_zipfile(p) else "tar" if tarfile.is_tarfile(p) else "")' "$src" 2>/dev/null || true)"
  case "$kind" in
    zip) say "Unpacking zip"; python3 -m zipfile -e "$src" "$tmp/unpacked" ;;
    tar) say "Unpacking tar.gz"; tar -xzf "$src" -C "$tmp/unpacked" ;;
    *) die "$src isn't a .zip or .tar.gz build ($(du -h "$src" | cut -f1), $(file -b "$src" 2>/dev/null || echo "unknown type")). If it's small, download it again while signed in to GitHub." ;;
  esac
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
say "Done. MURDER.EXE is installed in $DEST (start it from Steam, the app menu, or $DEST/murder-exe)."
