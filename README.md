# MURDER.EXE

A one-bullet, one-life arena shooter set in a rain-soaked cyberpunk megacity. A cult of chrome-plated hackers has uploaded itself into a crow-swarm AI called CORVUS. You play Vesper Kade, a former corporate enforcer with a smart revolver and a cyberdeck, taking them apart one district at a time.

Inspired by *Kill the Crows* (5minlab / KRAFTON): every enemy dies to one bullet, and so do you.

## What's in this repo

| Folder | What it is |
|---|---|
| `prototype/` | The playable browser prototype. District 01, the Rain Market, with 100 kills to the BLACKWING boss. |
| `design/` | The game plan and art bible: research, key art, logo, sprites, enemy roster, level design, sound board and roadmap. |

Everything is plain HTML and JavaScript with no build step. All art and audio is generated in code at runtime.

## Run it

Open `prototype/index.html` in Chrome, Edge or Firefox. For the design document, open `design/index.html`.

The pages load fonts from Google Fonts, so the first load needs an internet connection. If your browser blocks scripts on `file://` pages, serve the folder instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/prototype/>.

## Controls

| Action | Keyboard and mouse | Xbox / Steam Deck | PlayStation |
|---|---|---|---|
| Move | WASD | Left stick or D-pad | Left stick or D-pad |
| Aim | Mouse | Right stick (with aim assist) | Right stick |
| Shoot | Left click | RT / R2 | R2 |
| Phase dash | Space | A or LB / L1 | ✕ or L1 |
| Overclock (slow time, sweep to lock up to 6 targets) | Hold right click or F | Hold LT / L2 | Hold L2 |
| Short Circuit hack | Q | Y or RB / R1 | △ or R1 |
| Reload | R | X | □ |
| Pause | P or Esc | Menu | Options |

Browsers only detect a controller after you press one of its buttons. Rumble works in Chrome and Edge.

## Prototype features

- One-hit kills both ways, with a small player hitbox and near-misses ("grazes") that charge Overclock.
- Kestrel .44 smart revolver: 6 rounds, 1.1s reload. Bullets fly until they hit something solid.
- Cover system: hard cover, low cover you can dash over and shoot across, crates that break, and barrels and signs you can hack.
- Six enemy types, each with its own visual and audio tell: Shrike, Rook, Jackdaw, Carrion, Corvid and Bulwark.
- Heat rises every 15 kills, bringing harder enemy mixes and adding layers to the music.
- Phase 2 at kill 50: a tram starts sweeping the south lane and kills anything on the rails.
- BLACKWING boss at kill 100, only vulnerable for a moment after each landing.
- Darksynth soundtrack and a layered SFX bank, rendered in the browser with the Web Audio API.

## Code map (`prototype/`)

| File | Responsibility |
|---|---|
| `engine.js` | Shared utilities and the shaded pixel-sprite renderer |
| `defs.js` | Sprite definitions for Vesper, enemies, bosses and weapons |
| `scenes.js`, `keyart.js` | Backdrops, rain and painted-art helpers used by the map renderer |
| `maptiles.js`, `maps.js` | Tile painters, district map data, map renderer and tactical overlay |
| `audio.js` | Synth SFX, ambience beds and the Heat-driven music sequencer |
| `sfx-bank.js` | Layered combat sounds rendered offline into variants |
| `g-core.js` | Game state, input, collision, line of sight, pathfinding |
| `g-pad.js` | Controller input, aim assist, rumble and button prompts |
| `g-actors.js` | Player, enemies, bullets, explosions and hacking |
| `g-director.js` | Wave director, Heat, the Phase 2 tram and the boss |
| `g-render.js` | World, effects, HUD and screens |
| `g-main.js` | Boot, run reset and the game loop |

## Roadmap

1. District 02, the Chrome Rookery, with the Hexer and Nest enemies and the anti-camping Trace rule.
2. Loadout and unlocks: more sidearms, Overclock programs, implants and milestone challenges.
3. Port to Godot 4 for a native Steam build (Steam Deck Verified, Steam Input, achievements and leaderboards).
4. Steam page and a free demo for Steam Next Fest.

The full plan is in `design/index.html`.
