# MURDER.EXE on Steam

This folder turns the browser game in `../prototype` into a desktop app for Steam, with **Steam achievements** wired to the game's own achievements. It uses [Electron](https://www.electronjs.org/) for the window and [steamworks.js](https://github.com/ceifa/steamworks.js) to talk to Steam.

## How the achievements connect

- Every in-game achievement (see `prototype/g-extras.js`) has a fixed **Steam API name**: `MURDER_` plus its id in capitals, for example `MURDER_CH1` or `MURDER_RUSHFAST`. The names are made in `prototype/g-platform.js`. **Never rename an achievement id after release**, or the Steam unlock stops matching.
- When the game unlocks an achievement it also calls Steam through `window.steamBridge` (exposed by `preload.js`, handled in `main.js`).
- On every start-up the game re-sends every achievement the save has already earned. Anything earned in the browser, offline, or while Steam wasn't running reaches Steam the next time the player launches it.
- In a normal browser there is no `steamBridge`, so nothing changes and the game plays exactly as before. If Steam fails or is offline, the game keeps running.
- Achievements earned in the firing range never count, on Steam or in the game.

## 1. Set up the achievements on Steamworks

On the Steamworks partner site, open your app, then **Edit Steamworks Settings → Stats & Achievements → Achievements**. Add one entry per row below (also in `achievements.csv` and `achievements.json`):

- **API Name:** the `MURDER_…` name exactly as written
- **Display name / Description:** as listed (you can rewrite the wording; only the API name has to match)
- **Achieved icon:** `icons/<API_NAME>.jpg` · **Unachieved icon:** `icons/<API_NAME>_locked.jpg` (64×64)

Then **publish** the Steamworks changes, or Steam won't know about them.

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

To regenerate the list and icons after changing achievements: `npm i -D playwright` then `node tools/make-icons.js`.

## 2. Build and test

1. Install [Node.js](https://nodejs.org/) 18 or newer, and have the Steam client running and signed in.
2. Put your Steam **App ID** in `steam_appid.txt` (it starts as `480`, Valve's test app "Spacewar", which has its own achievements, so ours only unlock once your own App ID is in there).
3. In this folder:

```bash
npm install
```

```bash
npm start
```

`npm start` copies the game from `../prototype` into `./game` (bundling the two fonts so the desktop build never needs the internet) and opens it. **F11** toggles fullscreen.

4. Unlock something quick, such as **TRY BEFORE YOU BUY** (press TRY IT on any item at Magpie's) or **BLUEPRINT** (save a build in the BODYSHOP), and check that the Steam overlay pops up with it.
5. To reset achievements while testing, use the Steamworks *Stats & Achievements* page for your test account.

## 3. Ship it

```bash
npm run dist
```

builds Windows and Linux folders in `dist/` for upload through SteamPipe. Don't ship `steam_appid.txt`: Steam provides the App ID when it launches the game. Release builds relaunch through Steam if someone opens the .exe directly; set `STEAM_DEV=1` to skip that while developing.
