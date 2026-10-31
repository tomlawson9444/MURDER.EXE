# MURDER.EXE · Steam Build

This folder builds MURDER.EXE as a desktop game for Steam using [Electron](https://www.electronjs.org/). The game itself lives in `../prototype` and is copied in at build time, so there is only ever one copy of the game to work on. [steamworks.js](https://github.com/ceifa/steamworks.js) connects it to Steam for achievements and the overlay.

## What's in here

| Path | What it is |
|---|---|
| `main.js` | The Electron app: opens the game fullscreen, starts Steam, unlocks achievements, quits from the title menu |
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
- Saves live in the app's own storage, separate from the browser version.

## 1. Run it on your computer

Install [Node.js](https://nodejs.org/) 20 or newer, open the Steam client and sign in, then in this folder:

```bash
npm install
```

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

## 3. Build for release

| Command | Builds | Where |
|---|---|---|
| `npm run dist:win` | Windows (run this on Windows) | `dist/win-unpacked/MURDER.EXE.exe` |
| `npm run dist:linux` | Linux and Steam Deck | `dist/linux-unpacked/murder-exe` |
| `npm run dist:mac` | macOS (run this on a Mac) | `dist/mac/` |
| `npm run dist` | Windows and Linux | `dist/` |

You don't need a Windows PC for the Windows build: the **Steam Build** workflow in GitHub Actions builds Windows and Linux whenever the game changes on `main` (or when you press *Run workflow* on the Actions tab), smoke-tests the Linux build, and attaches both folders to the run for download.

Don't ship `steam_appid.txt`; Steam supplies the App ID when it launches the game. Release builds relaunch through Steam if someone opens the .exe directly (set `STEAM_DEV=1` to skip that while developing).

## 4. Upload to Steam (SteamPipe)

1. On Steamworks, open **SteamPipe → Depots** and note the App ID and one depot ID each for Windows and Linux.
2. Put those IDs into `steampipe/app_build.vdf`, `steampipe/depot_windows.vdf` and `steampipe/depot_linux.vdf` (they start as 1234560, 1234561 and 1234562).
3. Build (step 3) so that `dist/win-unpacked` and `dist/linux-unpacked` exist.
4. Install [steamcmd](https://developer.valvesoftware.com/wiki/SteamCMD) and run, from this folder:

```bash
steamcmd +login YOUR_STEAM_BUILD_ACCOUNT +run_app_build "$(pwd)/steampipe/app_build.vdf" +quit
```

5. On Steamworks, open **SteamPipe → Builds**, set the new build live on a branch, and set the launch options: `MURDER.EXE.exe` for Windows and `murder-exe` for Linux.
