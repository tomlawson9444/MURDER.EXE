# MURDER.EXE

A one-bullet, one-life arena shooter set in a rain-soaked cyberpunk megacity. A cult of chrome-plated hackers has uploaded itself into a crow-swarm AI called CORVUS. You play Vesper Kade, a former corporate enforcer with a smart revolver and a cyberdeck, taking them apart one district at a time.

Inspired by *Kill the Crows* (5minlab / KRAFTON): every enemy dies to one bullet, and so do you.

## What's in this repo

| Folder | What it is |
|---|---|
| `prototype/` | The playable browser prototype: the story campaign (Act 1 of *Nine Nights of Rain*), plus arcade runs through the Rain Market (boss: BLACKWING), the Chrome Rookery (boss: THE AUGUR) and an endless chain of procedurally styled districts. |
| `design/` | The game plan and art bible: research, key art, logo, sprites, enemy roster, level design, sound board and roadmap. |

Everything is plain HTML and JavaScript with no build step. All art and audio is generated in code at runtime.

## Run it

Open `prototype/index.html` in Chrome, Edge or Firefox. For the design document, open `design/index.html`. To browse procedurally generated maps, open `prototype/maplab.html`.

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
| Cash out after a district clear | Esc | B | ○ |
| Pick a district on the title screen | A / D or ← / → | D-pad or left stick | D-pad or left stick |
| Magpie's: switch tab | Q / E or Tab | LB / RB | L1 / R1 |
| Magpie's: move / buy or equip | W / S or ↑ / ↓, Enter or click | D-pad, A | D-pad, ✕ |
| Magpie's: jack in / back | Space / Esc | Start / B | Options / ○ |
| Conversations: next line / skip / reply | Enter or click / Esc / 1 to 5 or click | A / B / D-pad and A | ✕ / ○ / D-pad and ✕ |
| BODYSHOP: tab / change option / done | Q/E, A/D or ←/→, Space (Enter edits the name) | LB/RB, D-pad, Start (A rolls a random name) | L1/R1, D-pad, Options |

Browsers only detect a controller after you press one of its buttons. Rumble works in Chrome and Edge.

## Campaign: Nine Nights of Rain

The story campaign is planned as 30 chapters across 10 districts in five acts. **Act 1, Wet Feathers, is playable now** (chapters 1 to 6, from the Rain Market to the Gutterline Canals). Pick CAMPAIGN on the title screen.

- **Chapters with story objectives:** survive an ambush (Wet Feathers), protect Magpie's stall (Price of Chrome), draw out BLACKWING (Blackwing), survive rising floodwater (Low Water), open three floodgates (Lock and Key) and kill THE FERRYMAN (The Ferryman).
- **Conversations:** briefings and debriefs with portraits for Director Vane, Magpie, Wren, CORVUS, Blackwing and the Ferryman. Replies come in four styles (Cold, Sharp, Hard, Ask), and your BODYSHOP origin adds its own reply in key scenes. Some choices run on a 10-second timer, and staying silent counts as an answer.
- **Your name:** the story uses the name you gave your operative in the BODYSHOP.
- **Trust and Resonance:** Magpie, Wren and Vane remember how you treat them (Dex joins in Act 2), and talking back to CORVUS raises your Resonance. Freeing or abandoning the barge sleepers in chapter 5 changes who helps you afterwards.
- **Radio chatter:** short lines from your contacts and CORVUS during play, with tutorial tips in the early chapters that match your keyboard or controller.
- **Gutterline Canals:** a new story district built by the map generator from fixed seeds. Floodwater rises in stages (tiles flash, then go under, and anything standing there sinks), while every door and floodgate is kept reachable.
- **THE FERRYMAN:** a harpoon boss. He is armoured until he reels his chain back in. Get hooked and he drags you towards him, and towards the water; dash to break the chain.
- **Datashards and the ARCHIVE:** one hidden shard per chapter unlocks a witness log about the Night of Feathers.
- **Story difficulty:** two shields soak hits, and a fall into the water puts you back on dry ground. Normal keeps one life.
- **Replays:** replaying a chapter takes back the trust it gave last time, so you can make different choices. Scrip from conversations is paid once per chapter.

## Prototype features

- One-hit kills both ways, with a small player hitbox and near-misses ("grazes") that charge Overclock.
- **BODYSHOP (character creator):** build your operative before the first run, then come back any time from the title screen. LOOK covers coat style and colour, lining, hair and hair colour, skin tone, eyes (visor, optics, goggles, masks), cyberarm, glow colour, dash afterimage, gun finish, extras and your name, all shown on a live animated preview. GEAR equips any owned gun, Overclock program and implants. INVENTORY shows every item in the game, owned or locked, and where it comes from. ORIGIN picks your background at creation: Corpo Defector, Street Netrunner, Merc Breacher or Ghost, each with its own starter kit.
- **MAGPIE'S · CHROME & IRON:** a back-alley fixer who is both the shop and the loadout screen. Visit her before every run, between districts, or after a death. Spend scrip on gear, then equip anything you own.
- **Scrip:** earned from every kill (more at higher Heat), Nests, bosses, district clears and milestones. Saved between runs, even when you die. You start with 300.
- **STYLE at Magpie's:** 22 cosmetics (cloaks, vests, coat colours, hair styles and dyes, masks, full chrome and gold arms, optics colours, gold and glitch afterimages, gun finishes, scarf and Augur's halo), each with a live preview on your operative. A few unlock through milestones.
- **Gear:** 5 sidearms (Kestrel .44, Breacher Custom, Ricochet Coilgun, Hornet SMG, Railpiercer), 4 Overclock programs (DEADLINK, ARC//CHAIN, SWARMKEY, GHOST_PROTOCOL) and 8 implants, with 2 implant slots.
- **Milestone unlocks:** most gear is locked until you hit a milestone (for example, the Railpiercer needs a Rain Market clear). Hitting one pays 100 scrip and Magpie restocks.
- **Procedural maps:** every run builds a brand-new arena for each district from a seed (about 2.18 billion per district). A layout archetype, buildings pushed in from the walls, spawn doors, hand-designed cyberpunk set pieces, hazards, signage, colour tint and weather are all generated, then a validator checks the level-design rules (everything reachable, no dead ends, safe start, doors reachable, cover on both sides) and rebuilds any map that fails. Phase 2 events (tram lane, bridge collapse, barricades) come from the generated layout.
- **Endless districts:** after the Chrome Rookery, breaching continues forever (District 3, 4, 5…). Each district gets a procedurally generated style and map, the bosses alternate between BLACKWING and THE AUGUR, and Heat and spawn pressure creep up with depth. Clearing the Rookery unlocks an ENDLESS start on the title screen.
- **Procedural district styles:** a style mixes one of 10 families (streets, night markets, rooftops, server halls, summits, foundries, docks, slums, galleria, canals) with one of 6 moods and a generated palette from any hue, one of 10 floors, one of 10 backdrops (shopfronts, skyline, server walls, storm glass, giant billboards, highway overpass, shanty stacks, dockside cranes, factory, mall), a hazard look (city drop, flood water, toxic sludge, molten slag, raw data), one of 8 weathers (rain, downpour, acid rain, snow, ash, embers, smog, clear) and a family-specific set-piece pool, including shipping containers, container yards, canals, sludge pools and shanty shacks.
- **Seeds:** the seed shows in the HUD and on the death and clear screens. After a death you can retry the same map or reboot into a new one. Links ending `#seed-ABC123`, `#seed-ABC123-rookery` or `#seed-ABC123-endless` load that exact run. The title screen's MAP option switches between generated and the classic hand-made maps (`#classic` forces classic).
- **Map Lab (`maplab.html`):** a gallery of freshly generated maps for all four districts, with art and tactical views, Phase 2 previews, validator stats, seed search and a "Play this map" link.
- Bullets fly until they hit something solid.
- Cover system: hard cover, low cover you can dash over and shoot across, crates that break, and barrels and signs you can hack.
- Eight enemy types, each with its own visual and audio tell: Shrike, Rook, Jackdaw, Carrion, Corvid, Bulwark, Hexer and Nest.
- Heat rises every 15 kills, bringing harder enemy mixes and adding layers to the music.
- Phase 2 at kill 50: a tram starts sweeping the south lane and kills anything on the rails.
- BLACKWING boss at kill 100, only vulnerable for a moment after each landing.
- Beat a district boss to **breach** into the next one with your score, and up to 2 Heat, carried over, or cash out. Cleared districts can be picked on the title screen.
- **District 02, Chrome Rookery:** two rooftops over a lethal chasm joined by two bridges. Wind gusts bend bullets over the gap, drone Nests spawn Corvids (armoured except while open, hackable any time), and at kill 50 the north bridge collapses. Enemies that lunge into the chasm fall.
- **Hexer:** keeps its distance and hexes you, locking Overclock and hacking for 3 seconds and scrambling the HUD.
- **THE AUGUR:** splits into five copies and only the real one casts a shadow. Shooting a fake fires a bullet ring at you; hacking any copy reveals the real one.
- **Trace (all districts):** stay near one spot for 4 seconds and the Murder sends a Shrike or Carrion through the nearest door.
- Darksynth soundtrack and a layered SFX bank, rendered in the browser with the Web Audio API.

## Save data

Progress (operative and look, scrip, owned gear and cosmetics, loadout, milestones, best score, and campaign chapters, choices, trust and datashards) is saved in the browser's local storage under `murder-save-v1`. Clearing site data resets it.

## Code map (`prototype/`)

| File | Responsibility |
|---|---|
| `engine.js` | Shared utilities and the shaded pixel-sprite renderer |
| `defs.js` | Sprite definitions for Vesper, enemies, bosses and weapons |
| `scenes.js`, `keyart.js` | Backdrops, rain and painted-art helpers used by the map renderer |
| `maptiles.js`, `maps.js` | Tile painters, classic district map data, map renderer and tactical overlay |
| `styles.js` | Extra floors, backdrops, hazard-pit looks, shipping containers and colour helpers used by generated styles |
| `g-procgen.js` | Procedural district styles, map generator, validator, seeds, names and endless-district derivation |
| `maplab.html`, `maplab.js` | Map Lab: gallery and inspector for generated maps |
| `audio.js` | Synth SFX, ambience beds and the Heat-driven music sequencer |
| `sfx-bank.js` | Layered combat sounds rendered offline into variants |
| `g-core.js` | Game state, input, collision, line of sight, pathfinding |
| `g-pad.js` | Controller input, aim assist, rumble and button prompts |
| `g-actors.js` | Player, enemies, bullets, explosions and hacking |
| `g-director.js` | Wave director, Heat, the Phase 2 tram and BLACKWING |
| `g-loadout.js` | Guns, Overclock programs, implants, Magpie's stock, scrip, milestones and the save file |
| `g-shop.js` | MAGPIE'S: the fixer's stall, shop and loadout screen (sidearms, Overclock, implants, style) |
| `g-char.js` | Character model: look options, cosmetics, origins and starter kits, and the player sprite builder |
| `g-bodyshop.js` | BODYSHOP: character creation and customisation (LOOK, GEAR, INVENTORY, ORIGIN) |
| `g-story.js` | The campaign script: chapters, objectives, conversations, radio lines and datashard logs for Act 1 |
| `g-talk.js` | Conversation screen, reply choices, trust and Resonance, and in-game radio chatter |
| `g-campaign.js` | Campaign mode: chapter runs and objectives, the Gutterline Canals and floodwater, THE FERRYMAN, the campaign menu, archive and chapter-complete screen |
| `g-districts.js` | District definitions, Trace, Rookery wind and bridge collapse, Hexer, Nest and THE AUGUR |
| `g-render.js` | World, effects, HUD and screens |
| `g-main.js` | Boot, run reset and the game loop |

## Roadmap

1. Campaign Acts 2 to 5: story chapters in the Chrome Rookery, The Kiln, Saltgate Docks, Datacrypt, The Stacks, Halvorsen Galleria, Spire Zero and The Nest, with their bosses and the three endings.
2. Unique enemies and bosses per family, so endless districts differ in how they fight as well as how they look.
3. Port to Godot 4 for a native Steam build (Steam Deck Verified, Steam Input, achievements and leaderboards).
4. Steam page and a free demo for Steam Next Fest.

The full plan is in `design/index.html`.
