# MURDER.EXE · Steam Build

This folder builds MURDER.EXE as a desktop game for Steam using [Electron](https://www.electronjs.org/). The game itself lives in `../prototype` and is copied in at build time, so there is only ever one copy of the game to work on. [steamworks-ffi-node](https://www.npmjs.com/package/steamworks-ffi-node) connects it to Steam (Steamworks SDK 1.64) for achievements, leaderboards, Steam Cloud saves, friends, lobbies and co-op networking.

## What's in here

| Path | What it is |
|---|---|
| `main.js` | The Electron app: opens the game fullscreen, reads and writes the save file, passes Steam calls and co-op messages to the game |
| `steam.js` | Everything that talks to Steam: achievements, leaderboards, lobbies, invites, peer-to-peer messages |
| `steamworks_sdk/` | Where Valve's Steam API libraries go (not in git; see below) |
| `preload.js` | The safe bridge the game sees as `window.steamBridge` |
| `copy-game.js` | Copies `../prototype` into `game/` and bundles the fonts, so the build works offline |
| `package.json` | Versions, scripts and the electron-builder settings |
| `build/icon.png` | The app icon (512×512); remake it with `node tools/make-app-icon.js` |
| `steam_appid.txt` | Your Steam App ID for local testing (starts as `480`, Valve's test app) |
| `achievements.csv`, `achievements.json`, `icons/` | Everything to enter on the Steamworks partner site; remake with `node tools/make-icons.js` |
| `steampipe/` | SteamPipe scripts for uploading builds with `steamcmd` |

## Desktop behaviour

- Starts **fullscreen**; **F11** or **Alt+Enter** switches to a window (`MURDER_WINDOWED=1` starts windowed).
- The browser help line is gone and the game fills the screen. The title menu gets **QUIT GAME**.
- Works offline: the game files and the Silkscreen and Chakra Petch fonts are packed in.
- If Steam isn't running, the game still plays; achievements reach Steam the next time it starts with Steam open.
- Saves are a single `save.json` in the app-data folder, which Steam Cloud syncs between PC and Steam Deck (see step 3).

## 1. Run it on your computer

Install [Node.js](https://nodejs.org/) 20 or newer, open the Steam client and sign in, then in this folder:

```bash
npm install
```

Then add Valve's Steam API libraries, which can't be in a public repo: download the [Steamworks SDK](https://partner.steamgames.com/downloads/list) (1.64 or newer) and copy its `redistributable_bin` folder into `steamworks_sdk/` (details in `steamworks_sdk/README.md`). Without them the game runs, but every Steam feature is off.

```bash
npm start
```

To check a build quickly without playing, `npm run smoke` starts the game, checks it reached the title screen with the Steam bridge in place, saves `smoke-test.png` and quits.

## 2. Set up achievements on Steamworks

On the Steamworks partner site: your app → **Edit Steamworks Settings → Stats & Achievements → Achievements**. Add each row below with:

- **API Name:** exactly as written. The game uses `MURDER_` + the in-game id, so **never rename an achievement id after release**.
- **Display name / Description:** as listed (you can reword these).
- **Icons:** `icons/<API name>.jpg` (achieved) and `icons/<API name>_locked.jpg` (not yet achieved), 64×64.

Then **Publish** on the Steamworks site. Put your App ID in `steam_appid.txt`, run `npm start`, and test with a quick one: **TRY BEFORE YOU BUY** (press TRY IT on any item at Magpie's) or **BLUEPRINT** (save a build in the BODYSHOP). The Steam overlay should pop up.

| API name | Display name | Description |
|---|---|---|
| `MURDER_CH1` | FIRST BLOOD | Finish Chapter 1 |
| `MURDER_ACT1` | WET FEATHERS | Finish Act 1 |
| `MURDER_ACT2` | THE ROOST | Finish Act 2 |
| `MURDER_ACT3` | COLD STORAGE | Finish Act 3 |
| `MURDER_ACT4` | BAD DEBTS | Finish Act 4 |
| `MURDER_ACT5` | TEN THOUSAND EYES | Finish the story |
| `MURDER_ENDINGS` | EVERY WAY OUT | See all three endings |
| `MURDER_SHARDS` | THE WHOLE ARCHIVE | Recover all 30 datashards |
| `MURDER_STALL` | GOOD FOR BUSINESS | Finish Chapter 2, stall above 75% |
| `MURDER_RACKS` | NOTHING WENT DARK | Save all four racks in Chapter 16 |
| `MURDER_RESONANCE` | TOO CLOSE | Reach CORVUS Resonance 6 |
| `MURDER_K100` | CROW HUNTER | Get 100 kills |
| `MURDER_K1000` | MURDER OF ONE | Get 1,000 kills |
| `MURDER_K5000` | EXTINCTION EVENT | Get 5,000 kills |
| `MURDER_HACKS` | SHORT CIRCUIT | Kill 50 enemies with hacks |
| `MURDER_ARC3` | PASS IT ON | Kill three with one hack |
| `MURDER_BLAST5` | BLAST RADIUS | Kill 5 enemies with one explosion |
| `MURDER_VOLLEY` | FULL VOLLEY | Kill 6 with one Overclock |
| `MURDER_MASS` | MASS DELETE | Kill 10 with one Overclock volley |
| `MURDER_GRAZE` | GRAZE ARTIST | Graze 100 bullets |
| `MURDER_FALLS` | MIND THE GAP | Knock 25 enemies into the chasm |
| `MURDER_DASHKILL` | TOLL PAID | Kill an enemy by dashing through it |
| `MURDER_FREEZE` | ICE AGE | Freeze 6 enemies at once |
| `MURDER_RICOCHET` | TRICK SHOT | Kill an enemy with a bounced round |
| `MURDER_LONGSHOT` | SKEWER | Kill 4 enemies with one round |
| `MURDER_HEAT5` | BURNING UP | Reach Heat 5 |
| `MURDER_MARKET` | RAIN CHECK | Clear the Rain Market in Arcade |
| `MURDER_ROOKERY` | ROOST RULER | Clear the Chrome Rookery in Arcade |
| `MURDER_DEEP` | DEEP DIVE | Reach Endless district 5 |
| `MURDER_SCORE` | HIGH ROLLER | Score 250,000 in one Arcade run |
| `MURDER_GEAR` | COLLECTOR | Own 25 pieces of gear |
| `MURDER_STYLE` | DRESSED TO KILL | Own 25 styles |
| `MURDER_RANGE` | TRY BEFORE YOU BUY | Test something in the firing range |
| `MURDER_BUILD` | BLUEPRINT | Save a build |
| `MURDER_RANDOM` | IDENTITY CRISIS | Randomise your operative 10 times |
| `MURDER_DAILY` | DAILY GRIND | Play a Daily Challenge |
| `MURDER_DAILY3` | REGULAR | Play three different Daily Challenges |
| `MURDER_RUSH` | BOSS RUSH | Beat Boss Rush |
| `MURDER_RUSHFAST` | NO TIME TO WASTE | Beat Boss Rush in under 15 minutes |

## 3. Steam Cloud saves

The game keeps its whole save (progress, gear, builds, achievements, local bests) in one file, `save.json`:

| System | Folder |
|---|---|
| Windows | `%APPDATA%\MURDER.EXE` |
| Linux and Steam Deck | `~/.config/MURDER.EXE` |
| macOS | `~/Library/Application Support/MURDER.EXE` |

Writes are safe against crashes (written to a temp file, then swapped in), the previous save is kept as `save.json.bak`, and an unreadable save is set aside as `save.json.corrupt-…` instead of being overwritten. The first time the desktop game runs it moves any older save across automatically.

To sync it, on Steamworks open **Edit Steamworks Settings → Application → Steam Cloud**:

1. Set **Byte quota per user** to `10000000` and **Number of files allowed per user** to `10`.
2. Under **Auto-Cloud**, add three root paths, each with **Subdirectory** `MURDER.EXE`, **Pattern** `save.json`, **Recursive** off:

| Root | OS |
|---|---|
| `WinAppDataRoaming` | Windows |
| `LinuxXdgConfigHome` | Linux (covers Steam Deck) |
| `MacAppSupport` | macOS |

3. **Save**, then **Publish**. Steam uploads the file when the game closes and downloads it before the game starts on another machine.

## 4. Leaderboards

Steam creates each board the first time a score is posted, so there's nothing to set up on Steamworks (you can rename the display names there afterwards).

| Board | What it ranks |
|---|---|
| `MURDER_ARCADE_SCORE` | Best score in a solo Arcade run |
| `MURDER_ARCADE_KILLS` | Most kills in a solo Arcade run |
| `MURDER_ARCADE_DEPTH` | Furthest district reached in Arcade |
| `MURDER_DAILY_YYYYMMDD` | That day's Daily Challenge score |
| `MURDER_BOSS_RUSH` | Fastest Boss Rush, in seconds (lowest wins) |

Only your best is kept. Players see the boards from **CHALLENGES → LEADERBOARDS**, with Global, Friends and Around Me tabs; offline, it shows their own best runs. Co-op runs aren't posted.

## 5. Co-op

Co-op needs no Steamworks setup: it uses friends-only Steam lobbies (up to 4 players) and Steam's peer-to-peer networking, which work for any app ID, including 480 while you test.

- **Hosting:** CO-OP → HOST A GAME creates the lobby and sets Rich Presence, so friends see **Join Game** on the host in their Steam friends list. INVITE FRIENDS lists online friends to invite, or opens the Steam overlay's invite dialog.
- **Joining:** accepting an invite (or Join Game) while MURDER.EXE is running joins straight away. If the game isn't running, Steam starts it with `+connect_lobby <id>` and it joins once it has loaded.
- **How it works:** the host's game runs the world. Each friend sends their controls about 60 times a second and receives the world about 20 times a second (around 2 KB each). Friends' own movement is shown immediately and corrected towards the host's copy. Only lobby members can connect to the host.
- **Testing:** you need two Steam accounts on two machines (Steam allows one account per machine). Set the same App ID on both (`steam_appid.txt`), host on one, and invite the other.

## 6. Build for release

| Command | Builds | Where |
|---|---|---|
| `npm run dist:win` | Windows (run this on Windows) | `dist/win-unpacked/MURDER.EXE.exe` |
| `npm run dist:linux` | Linux and Steam Deck | `dist/linux-unpacked/murder-exe` |
| `npm run dist:mac` | macOS (run this on a Mac) | `dist/mac/` |
| `npm run dist` | Windows and Linux | `dist/` |

You don't need a Windows PC for the Windows build: the **Steam Build** workflow in GitHub Actions builds Windows and Linux whenever the game changes on `main` (or when you press *Run workflow* on the Actions tab), smoke-tests the Linux build, and attaches both folders to the run for download.

The builds pack `steamworks_sdk/redistributable_bin` in beside the app. To have GitHub Actions include it, zip the SDK's `redistributable_bin` folder (so the zip contains `redistributable_bin/…`) and add it as a repository secret named `STEAMWORKS_REDIST` (**Settings → Secrets and variables → Actions**), base64-encoded:

```bash
zip -r redist.zip redistributable_bin && base64 -w0 redist.zip > redist.b64
```

Without the secret, the workflow still builds, with a warning, but those builds have no Steam features.

Don't ship `steam_appid.txt`; Steam supplies the App ID when it launches the game. Release builds relaunch through Steam if someone opens the .exe directly (set `STEAM_DEV=1` to skip that while developing).

## 7. Upload to Steam (SteamPipe)

1. On Steamworks, open **SteamPipe → Depots** and note the App ID and one depot ID each for Windows and Linux.
2. Put those IDs into `steampipe/app_build.vdf`, `steampipe/depot_windows.vdf` and `steampipe/depot_linux.vdf` (they start as 1234560, 1234561 and 1234562).
3. Build (step 6) so that `dist/win-unpacked` and `dist/linux-unpacked` exist.
4. Install [steamcmd](https://developer.valvesoftware.com/wiki/SteamCMD) and run, from this folder:

```bash
steamcmd +login YOUR_STEAM_BUILD_ACCOUNT +run_app_build "$(pwd)/steampipe/app_build.vdf" +quit
```

5. On Steamworks, open **SteamPipe → Builds**, set the new build live on a branch, and set the launch options: `MURDER.EXE.exe` for Windows and `murder-exe` for Linux.
