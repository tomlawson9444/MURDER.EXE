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

Everything works offline: the Chakra Petch and Silkscreen fonts are bundled in `prototype/fonts/` (SIL Open Font License). If your browser blocks scripts on `file://` pages, serve the folder instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/prototype/>.

## Controls

| Action | Keyboard and mouse | Xbox / Steam Deck | PlayStation |
|---|---|---|---|
| Move | WASD | Left stick or D-pad | Left stick or D-pad |
| Aim | Mouse | Right stick (sticky aim assist, aim line) | Right stick (sticky aim assist, aim line) |
| Shoot | Left click | RT / R2 | R2 |
| Phase dash | Space | A or LB / L1 | ✕ or L1 |
| Overclock (slow time, sweep to lock up to 6 targets) | Hold right click or F | Hold LT and sweep (Y / RB locks the nearest); tap LT to auto-lock | Hold L2 and sweep (△ / R1 locks the nearest); tap L2 to auto-lock |
| Short Circuit hack | Q | Y or RB / R1 (hits what you're roughly aiming at) | △ or R1 |
| Reload | R | X | □ |
| Pause (and controller settings) | P or Esc | Menu | Options |
| Cash out after a district clear | Esc | B | ○ |
| Pick a district on the ARCADE screen | A / D or ← / → | D-pad or left stick | D-pad or left stick |
| Magpie's: switch tab | Q / E or Tab | LB / RB | L1 / R1 |
| Magpie's: move / buy or equip | W / S or ↑ / ↓, Enter or click | D-pad, A | D-pad, ✕ |
| Magpie's: jack in / back / try in the range | Space / Esc / T | Start / B / X | Options / ○ / □ |
| Conversations: next line / skip / reply | Enter or click / Esc / 1 to 5 or click | A / B / D-pad and A | ✕ / ○ / D-pad and ✕ |
| BODYSHOP: tab / change option / done | Q/E, A/D or ←/→, Space (Enter edits the name; R random, X default; pad X random, Y default) | LB/RB, D-pad, Start (A rolls a random name) | L1/R1, D-pad, Options |

Browsers only detect a controller after you press one of its buttons. Rumble works in Chrome and Edge.

**Controller settings (pause menu):** aim assist (off, normal or strong), auto-fire when the right stick is pushed fully, the aim line, rumble, and the stick deadzone (raise it for worn or drifting sticks, such as an older Steam Deck). They save automatically. Holding the stick or D-pad in any menu keeps scrolling, and the pause menu can also quit to the title or campaign menu, or leave the firing range.

## Title screen

The title screen lists these choices, with a one-line description under the selected one:

- **STORY:** the campaign. It shows the next chapter to play and opens the chapter list.
- **ARCADE:** score runs. With MAP set to NEW EVERY RUN, each run builds fresh districts and starts at District 1, and ENDLESS RUN jumps straight into the Endless Sprawl once it's unlocked. With MAP set to CLASSIC LAYOUT, you pick the district (Rain Market or Chrome Rookery) on a card. MAGPIE'S FIRST opens the shop before the run. Seed links open this screen with the seed and its district ready.
- **OPERATIVE:** the BODYSHOP (or CREATE OPERATIVE before your first game).
- **MAGPIE'S:** the shop.
- **CHALLENGES:** the Daily Challenge, Boss Rush, leaderboards and achievements.
- **CO-OP:** play Arcade or the story with friends (see below).

## Co-op

Up to four players can play **Arcade** and the **story** together. One player hosts: their game runs the world and the others send their controls and see it live.

- **Hosting:** CO-OP → HOST A GAME, then INVITE FRIENDS (your online Steam friends, or the Steam overlay). Friends can also join from your name in their Steam friends list. Then PLAY ARCADE TOGETHER or PLAY STORY TOGETHER takes you to the normal Arcade or chapter screens.
- **Everyone brings their own operative, look and loadout.** Scrip from every kill is shared with the whole team; each player's kills, milestones and achievements go into their own save.
- **Harder with more players:** ordinary enemies still die to one hit, but more of them come at once and they arrive faster (with two players, up to 1.8 times as many on screen, arriving 2.2 times as fast; with four, 3.4 and 4.6 times), and Heat starts higher (+1 with two or three players, +2 with four), so tougher enemy types show up sooner. Bosses take more hits: Blackwing and the Augur take one more hit than the number of players, and story bosses take about 75% more per extra player (the Ferryman takes 3 hits solo, 5 with two, 10 with four). Bosses also move and attack faster (+15% per extra player, up to +45%), and more enemies come through the doors during boss fights. Story kill targets rise 35% per extra player. A downed player counts as half a player for enemy numbers, so the pressure eases a little while you revive them.
- **Down, not out:** when you'd flatline and a teammate is still standing, you go DOWN instead. Stand beside a downed teammate for about two seconds to revive them. The run ends when everyone is down. Clearing a district or an objective brings everyone back up.
- **Story:** the host chooses the chapter and the dialogue replies, and the chapter counts on the host's save. Any player can work objectives: stand in the hold zone, hack gates, reboot racks, push the cargo crane or reach the exit.
- **Linked Overclock:** anyone can start an Overclock (50 OC). Time slows for everyone, and teammates can press Overclock to **link in for 25 OC** and lock targets with their own cursor (yours show in blue, teammates' in amber). Everyone fires together when the starter lets go or after 3 seconds. Players who don't link in keep moving, in slow motion. To keep it fair, the team shares one pool of locks (the starter's own number plus 2 for each player who links in), each enemy can only be locked once, a boss takes one hit per Overclock however many lock it, and there's an 8 second team cooldown before anyone can start another. If two or more players land locks in the same Overclock, each of them gets 15 OC back (SYNC). Linking in without locking anything takes the nearest targets left in the pool.
- Friends can drop into a run already in progress. The Daily Challenge, Boss Rush and the firing range stay solo, and co-op runs don't post to the leaderboards.

### Local co-op (same screen)

Plug in up to three extra controllers and play together on one screen: CO-OP → LOCAL CO-OP · SAME SCREEN, then press **A** on each extra controller to join (B leaves again, X rolls a new look). Player 1 keeps their own keyboard and mouse or controller (whichever they used to open the screen). Then PLAY ARCADE TOGETHER or PLAY STORY TOGETHER. Each extra player has the full twin-stick controls with aim assist (left stick move, right stick aim, RT shoot, LT Overclock or link in, A or LB dash, X reload, Y or RB hack, Start pauses), their own reticle colour and a small panel along the bottom with ammo, Overclock and RAM. Each joined controller picks its own loadout in the lobby (up / down picks a line, left / right changes it): SAME AS PLAYER 1, any of the three saved builds, or MY OWN BUILD, which starts from the starter kit and cycles through every sidearm, Overclock and implant the save owns. Changing a part while a saved build is picked makes it that player's own copy (the saved build isn't touched). Each controller's loadout and look are remembered for next time. Everything earned goes into the one save. Revives, the Linked Overclock and the difficulty scaling all work the same as online. Works in the browser and the Steam Build, with or without Steam.

### Mixing local and online players

Local and online players can share one game (still up to four in all). In an online lobby, extra controllers on the host's computer press A to join just like in local co-op. A friend who has joined someone's game can also bring extra controllers: on their waiting screen, press A on another controller and that player joins the host's game over the friend's connection, named after the friend (for example RAVEN P2). Every controller picks its loadout and look on its own row, and a friend's extra players earn into that friend's save. If a friend leaves, their extra players leave with them.

Online co-op uses Steam, so it's in the Steam Build. In a browser you can try it with two tabs: in one, CO-OP → HOST ON THIS COMPUTER (TEST); in the other, JOIN ON THIS COMPUTER (TEST). The two tabs share one save, so this is for testing only.

## Steam Build

The `Steam Build/` folder builds the game as a desktop app for Steam with [Electron](https://www.electronjs.org/): fullscreen, offline, an app icon, a QUIT GAME option, **Steam achievements** (all 39 map to Steam API names like `MURDER_CH1` and re-sync on every launch), **Steam leaderboards**, **Steam Cloud saves** and **co-op with Steam invites**. It also holds the Steamworks achievement list and icons, SteamPipe upload scripts, and a GitHub Actions workflow that builds Windows and Linux for you. Start with [Steam Build/README.md](Steam%20Build/README.md).

## Challenges

Pick CHALLENGES on the title screen.

- **Daily Challenge:** today's date picks the map seed, a twist and a fixed kit (any sidearm, Overclock and two implants, even ones you don't own), so everyone gets the same run. The twists are BOOM TOWN (every kill explodes), COLD SNAP (kills freeze nearby enemies), BOTTOMLESS (no ammo use, Heat starts at 3), GLASS JAW (faster enemy bullets, double score), SWARM (half again as many enemies, double score), OVERCHARGED (Overclock charges three times faster) and RED ALERT (Heat starts at 3). It plays like Arcade with no shop stops; flatlining or ending the run banks the score, and the screen keeps your best five scores for the day.
- **Boss Rush:** all ten story bosses back to back (Blackwing, the Ferryman, the Augur, Cinder, the Widow Crane, the Archivist, Scarecrow, Director Vane, the Choir and Mother Corvina) with your own gear and three shields for the whole run. The clock never stops, your best time is saved, and it never touches your story progress.
- **Leaderboards:** best score, most kills and furthest district for solo Arcade runs, plus each day's Daily Challenge and the fastest Boss Rush. The Steam version ranks you against everyone and against your Steam friends (Global, Friends and Around Me); in a browser it shows your own best runs.
- **Achievements:** 39 of them across the story, combat, Arcade, builds, the challenges and style (FIRST BLOOD, EVERY WAY OUT, BLAST RADIUS, MASS DELETE, ICE AGE, TRICK SHOT, SKEWER, DEEP DIVE, IDENTITY CRISIS, NO TIME TO WASTE and more). Each pays 100 to 1,500 scrip and pops up on any screen; the ACHIEVEMENTS list shows what's left.

## Campaign: Nine Nights of Rain

The story campaign is complete: **30 chapters across 10 districts in five acts, with three endings**. Pick STORY on the title screen, and switch acts with A / D (or left / right) on the chapter list.

- **Locked progression:** chapters open one at a time, and each act stays locked (no name, no chapter titles) until you finish the act before it.
- **Act rewards:** finishing an act pays out once: a weapon and a piece of gear Magpie never sells, plus a pile of scrip. The new weapon goes straight into your hand and reward implants into a free slot (swap them back any time at Magpie's or the BODYSHOP). Every reward works in the story and in Arcade, and the BODYSHOP inventory shows the ones still to earn.
  - **Act 1 · Ferryman's Harpoon + Toll Chain** (+1000 scrip): two heavy bolts that punch through every body in a line; dash through an enemy to kill it, once a second.
  - **Act 2 · Cinder's Bellows + Kiln Rounds** (+1500 scrip): a full-auto slag thrower with a short, wide spray; every shot kill bursts in a blast that can't hurt you or anything you're guarding.
  - **Act 3 · Archive Repeater + Echo Shell** (+2000 scrip): every shot is fired again a beat later by your echo; a copy of you walks behind you and shoots the Murder.
  - **Act 4 · Vane's Wasp + Aegis Lattice** (+2500 scrip): three micro-missiles per shot that hunt the nearest enemy; shrugs off one hit, then recharges after 20 kills (shown on the HUD).
  - **Act 5 · Corvina's Requiem + CORVUS//CROWN** (+4000 scrip): every kill bursts into six feathers that fly out and kill again; an Overclock with eight locks where a lock on a story boss lands a hit through its armour (the final hit is still yours) and every kill gives Overclock back.
  - Saves that already finished acts get any rewards they're missing the next time the campaign menu opens (the scrip is never paid twice).

- **Act 1, Wet Feathers (Rain Market, Gutterline Canals):** survive an ambush, protect Magpie's stall, draw out BLACKWING, survive rising floodwater, open three floodgates and kill THE FERRYMAN.
- **Act 2, The Roost (Chrome Rookery, The Kiln):** cut three roost beacons in the wind, sync four relays in order while a CORVUS flashback plays and the north bridge falls, unmask THE AUGUR (it's Dex Morrow), survive the Kiln's night shift while the floor vents erupt, sabotage four furnaces after a timed ransom choice, and kill CINDER.
- **Act 3, Cold Storage (Saltgate Docks, Datacrypt):** fight through a container yard in thick fog, escort a cargo crane carrying forty uploaded minds, bring down the WIDOW CRANE, keep four server racks online, read five index nodes in order while Hexers lock your hacks, and delete THE ARCHIVIST. Act 3 ends with the truth about CORVUS and rack 00.
- **Act 4, Bad Debts (The Stacks, Halvorsen Galleria):** hold a stairwell during a raid, survive until Magpie's van arrives and then reach it, bring down SCARECROW, fight through a Galleria lockdown with a Halvorsen bounty on you, survive a three-way crossfire, and face DIRECTOR VANE in an exo-frame. Magpie confesses she sold the server keys: forgiving her makes her shop 20% cheaper for the rest of the game, and cutting her off makes it 20% dearer. You decide Vane's fate at the end.
- **Act 5, Ten Thousand Eyes (Spire Zero, The Nest):** climb Spire Zero floor by floor at maximum Heat, hold the uplink against every enemy type, silence THE CHOIR, survive inside CORVUS while the floor rewrites itself, hold the last door, and end MOTHER CORVINA. Earlier choices pay off: sparing Vane skips a floor, leaving Scarecrow's mask brings two Stacks fighters to fight beside you, and enough of Dex's trust brings his ghost to the last door.
- **Three endings:** DELETE (kill CORVUS and every mind in it), CROWN (become the flock's mind) and RELEASE (free every uploaded mind into the open net). RELEASE only appears if you forgave Magpie and Dex trusts you (trust 2 or more). Each ending has its own epilogue, shows how your choices played out, and unlocks a cosmetic: the Clean Sky afterimage, CORVUS Red optics or the Open Sky coat.
- **Conversations:** briefings and debriefs with portraits for Director Vane, Magpie, Wren, Dex Morrow, CORVUS, Blackwing, the Augur, the Ferryman, Cinder, the Widow Crane and the Archivist. Replies come in four styles (Cold, Sharp, Hard, Ask), and your BODYSHOP origin adds its own reply in key scenes. Some choices run on a 10-second timer, and staying silent counts as an answer.
- **Your name:** the story uses the name you gave your operative in the BODYSHOP.
- **Trust and Resonance:** Magpie, Wren, Vane and Dex remember how you treat them, and talking back to CORVUS raises your Resonance. Choices carry forward: freeing or abandoning the barge sleepers in chapter 5 decides whether Wren or Magpie's runner Pip is taken hostage in chapter 11, and how you answer the ransom (pay 300 scrip, trade a memory for Resonance, or storm in and face a hotter fight) shapes chapter 12.
- **Radio chatter:** short lines from your contacts and CORVUS during play, with tutorial tips in the early chapters that match your keyboard or controller.
- **Gutterline Canals:** a new story district built by the map generator from fixed seeds. Floodwater rises in stages (tiles flash, then go under, and anything standing there sinks), while every door and floodgate is kept reachable.
- **The Kiln:** a story foundry district with slag pools. Floor vents glow for a second, then erupt for a few seconds, killing anything standing on them (enemies included).
- **CINDER:** the Kiln's priest. He fans slag across the floor in three lines towards you, then his chest furnace has to vent, and that's the only time he can be hurt. Three hits; each one opens more vents and calls adds.
- **Saltgate Docks:** a story docks district. Some chapters are fogged in: you see a small circle around you, plus enemy eyes glowing through the murk (red when they're about to attack).
- **Escort objective:** the cargo crane only rolls while you're beside it and no enemy is on top of it, and stray shots damage its racks.
- **WIDOW CRANE:** a crane-mech that drops shipping containers where you stand. A shadow marks each drop for 1.4 seconds; the containers crush anything under them, stand as cover for 9 seconds, then lift away (a drop never seals off a door). Her cab opens after each drop, and that's the only time she can be hurt.
- **Datacrypt:** a story server-hall district under the river.
- **Rack defence (Cold Storage):** four numbered racks, placed away from the enemies' main routes. The fight comes in three waves with short breaks, and the last wave is the hardest. Most Carrions hunt a rack (a red dashed line shows which) and blow up on it. Stand beside a damaged rack to reboot it, or quickhack it for a quick +30. Trace pauses while you reboot. A rack under attack flashes and Magpie calls out its number. You can lose one rack; a second ends the chapter. Saving all four pays 200 scrip and changes lines from Magpie, Vane and Dex.
- **THE ARCHIVIST:** hides inside a shield while echoes of you walk paths you really took earlier in the chapter, firing as they go. Break every echo and it's exposed for 5 seconds (the HUD counts the echoes left, then the exposed time, and warns you if you're stuck behind cover without a clear shot); it drifts towards you while shielded, and an echo that stays out of sight for 8 seconds steps back into view.
- **Enemies go for the objective:** in objective chapters some ground enemies become raiders and head for the objective instead of only hunting you, while Corvids, Hexers and snipers keep hunting you. A red dashed line shows who's coming and Magpie calls it out.
  - **Magpie's stall and the cargo crane:** Shrikes slash, Bulwarks ram and Rooks shoot the stall or the cargo, and Carrions blow up on it. Cargo raiders keep pushing in until you're right on them.
  - **Server racks:** Shrikes and Rooks join the Carrion hunters.
  - **Floodgates, beacons, relays, furnaces and index nodes:** guards gather at the terminal, and an enemy standing at it blocks your progress (CONTESTED).
  - **Hold rings:** raiders shove into the ring to contest it.
  - **Extraction:** when the van arrives, raiders rush it.
  - **Peelers and committed raiders:** most raiders break off to chase you when they spot you nearby (a red "!" pops up) and head back to the objective once they've lost sight of you. The rest stay committed and only turn on you at close range. Either way, defending means fighting them at the objective.
- **Hold and extract objectives:** stand in a ring to fill it (enemies inside stop the clock), or survive until a van arrives and then reach it. Trace pauses while you hold a ring.
- **Wren, if you abandoned the sleepers:** in Chapter 19 Wren comes at you as a crow-masked cultist. Two hits kill them; a quickhack on the implant frees them, and they rejoin your side.
- **SCARECROW:** plants drone Nests on the walls, calls Corvid swarms and sweeps a cone of shots. He can only be hurt while his arms are raised. Taking his mask unlocks a Scarecrow's Mask cosmetic.
- **Halvorsen Wardens:** troopers with an amber laser sight and a fast round. In crossfire chapters they shoot the Murder too, and Murder rounds hit them.
- **DIRECTOR VANE:** fires homing missiles, then charges in a straight line along a telegraphed path. The frame overheats after each charge, and that's your window.
- **Climb objective:** clear each floor and a lift comes down; step in to ride up to a freshly generated floor.
- **Allies:** Stacks fighters and Dex's ghost follow you, can't be hurt, and only shoot the Murder.
- **The Nest:** a story district inside CORVUS. Clusters of floor flash red, then drop out into raw data while the old holes close up, always leaving every door reachable.
- **THE CHOIR:** three singers firing rotating spirals. Each one you drop gets back up after a few seconds unless all three are down at once; they rise once more, faster, before they fall for good. A countdown ring over each downed singer, and the HUD's "1/3 DOWN · 2.1S", show how long you have to drop the rest.
- **MOTHER CORVINA:** six hits across three phases, two hits each. Rings and Corvids, then homing feathers while the floor rewrites, then a dense spiral while she teleports, with shorter openings and more Corvids. On her last hit she comes apart: the floor rewrites faster and the flock pours in. She is only vulnerable after she screams.
- **THE FERRYMAN:** a harpoon boss. He is armoured until he reels his chain back in. Get hooked and he drags you towards him, and towards the water; dash to break the chain.
- **Datashards and the ARCHIVE:** one hidden shard per chapter unlocks a witness log about the Night of Feathers.
- **Story difficulty:** two shields soak hits, and a fall into the water puts you back on dry ground. Normal keeps one life.
- **Replays:** replaying a chapter takes back the trust it gave last time, so you can make different choices. Scrip from conversations is paid once per chapter.

## Prototype features

- One-hit kills both ways, with a small player hitbox and near-misses ("grazes") that charge Overclock.
- **BODYSHOP (character creator):** build your operative before the first run, then come back any time from the title screen. LOOK has 19 slots and 188 options, nearly all free from the start: 11 coat styles (trench, duster, bomber, robe, poncho, tactical rig, tank top and more), 19 coat colours, 8 patterns, 9 trim colours, shoulders (pads, spikes, crow feathers, fur collar), cyberarms in 8 finishes, trousers, boots (knee-high, sneakers, glow soles, chrome feet), 10 skin tones including two synthetic ones, face details (scars, glow tattoos, war paint, beard, neon lips), 16 hairstyles in 16 colours, headwear (hood, beanie, cap, bandana, headphones, straw hat, cyber horns, antenna), 15 eye options and masks (shades, mono optic, spider optics, respirator, skull, oni and fox masks), 13 glow colours, something on your back (backpack, katana, cape, cyber wings, air tanks), extras (pet crow, drone, utility belt, chain), afterimage and gun finish. RANDOM (the button under the preview, the R key or the row at the top) changes everything: every look slot, your name, and your origin while you're still creating. DEFAULT (button, X key or row) puts the look back to the standard operative, keeping your name and origin; the list scrolls with the keys, mouse wheel or pad, and everything shows on a live animated preview. GEAR equips any owned gun, Overclock program and implants. INVENTORY shows every item in the game, owned or locked, and where it comes from. ORIGIN picks your background at creation: Corpo Defector, Street Netrunner, Merc Breacher or Ghost, each with its own starter kit.
- **MAGPIE'S · CHROME & IRON:** a back-alley fixer who is both the shop and the loadout screen. Visit her before every run, between districts, or after a death. Spend scrip on gear, then equip anything you own.
- **Scrip:** earned from every kill (more at higher Heat), Nests, bosses, district clears and milestones. Saved between runs, even when you die. You start with 300.
- **STYLE at Magpie's:** 103 cosmetics, grouped by look slot, each with a live preview on your operative: Halvorsen plate, feather and neon-edge coats, gilded and void colours, neon trim, flame and skull patterns, mech and bone pauldrons, neon, bone and void arms, rocket boots, chrome and hologram skin, gold grills, flame and crystal hair, gold crowns, halos, top hats, cat ears, full helmets, bat cowls, CRT faces, laser sights, plague beaks, gas masks, jetpacks, angel and crow wings, war banners, spider arms, a pet cat, orbiting orbs, spirit lanterns, rainbow and fire afterimages, and more. Some unlock through milestones.
- **Economy:** ordinary kills pay 6 scrip (more at higher Heat) and gear costs 30% over its base price, so one story run pays for roughly all the sidearms, Overclocks and implants, with the wardrobe left to save up for.
- **Builds:** Magpie stocks 17 sidearms, 11 Overclock programs and 24 implants, and you can run **three implants** at once, so effects stack into real builds.
  - **New sidearms:** Duster Double (8-pellet double barrel), Fan Hammer (full-auto revolver), Triple-Tap (3-round bursts), Needler (piercing flechettes), Cryo Pistol (kills freeze nearby enemies), Saint's Magnum (kills refund a round), Arc Caster (kills chain into two more), Splitter (rounds split in three), Pinball SMG (triple-bounce auto), Longbow (pierces six), Pipe Launcher (grenades that can't hurt you) and Wisp Launcher (slow homing ghost-lights).
  - **New Overclocks:** HYDRA.exe (2 locks, chains x4), REAPER_TAX (triple scrip), NOVA//BLOOM (safe blasts), LEECH.sys (refunds OC and RAM), BASTION (2.5s invulnerable), MIRRORSHARD (kills burst into shards) and BLACKOUT (wipes enemy bullets and freezes everyone).
  - **New implants:** Adrenal Pump, Quickloader, Ricochet Module, Focus Lens, Static Skin, Hollow Points, Cryo Core, Phase Step, Overcharger, Scavenger Chip, Extended Mags, Bounty Chip, Berserker Chip, Shockwave Dash, Chain Reaction and Twin Barrel.
  - **Every sidearm sounds different:** eight new sound families (scatter, SMG, needle, arc zap, cryo, launcher thump, flame and wisp) plus pitch and layer changes give each of the 22 guns its own voice.
  - **Firing range:** at Magpie's, TRY IT (T, the button, or X/□ on a pad) drops you into a range with the selected sidearm, Overclock or implant, even one you don't own or haven't unlocked yet. Targets keep respawning, you can't die, Overclock and RAM refill fast, and the HUD shows kills per minute. Nothing in the range pays scrip or counts towards milestones. Esc (Start on a pad) takes you straight back to the same item. Not available between districts mid-run.
  - **Saved builds:** three build slots in the BODYSHOP GEAR tab (A/D picks LOAD or SAVE HERE, Enter does it). At Magpie's, keys 1-3 load a build instantly.
  - Frozen enemies stop dead (bosses can't be frozen), with an ice outline. Lists scroll with the keys, mouse wheel or pad; the BODYSHOP inventory scrolls too.
- **Gear:** 5 sidearms (Kestrel .44, Breacher Custom, Ricochet Coilgun, Hornet SMG, Railpiercer), 4 Overclock programs (DEADLINK, ARC//CHAIN, SWARMKEY, GHOST_PROTOCOL) and 8 implants, with 2 implant slots.
- **Milestone unlocks:** most gear is locked until you hit a milestone (for example, the Railpiercer needs a Rain Market clear). Hitting one pays 100 scrip and Magpie restocks.
- **Procedural maps:** every run builds a brand-new arena for each district from a seed (about 2.18 billion per district). A layout archetype, buildings pushed in from the walls, spawn doors, hand-designed cyberpunk set pieces, hazards, signage, colour tint and weather are all generated, then a validator checks the level-design rules (everything reachable, no dead ends, safe start, doors reachable, cover on both sides) and rebuilds any map that fails. Phase 2 events (tram lane, bridge collapse, barricades) come from the generated layout.
- **Endless districts:** after the Chrome Rookery, breaching continues forever (District 3, 4, 5…). Each district gets a procedurally generated style and map, the bosses alternate between BLACKWING and THE AUGUR, and Heat and spawn pressure creep up with depth. Clearing the Rookery unlocks an ENDLESS start on the ARCADE screen.
- **Procedural district styles:** a style mixes one of 10 families (streets, night markets, rooftops, server halls, summits, foundries, docks, slums, galleria, canals) with one of 6 moods and a generated palette from any hue, one of 10 floors, one of 10 backdrops (shopfronts, skyline, server walls, storm glass, giant billboards, highway overpass, shanty stacks, dockside cranes, factory, mall), a hazard look (city drop, flood water, toxic sludge, molten slag, raw data), one of 8 weathers (rain, downpour, acid rain, snow, ash, embers, smog, clear) and a family-specific set-piece pool, including shipping containers, container yards, canals, sludge pools and shanty shacks.
- **Seeds:** the seed shows in the HUD and on the death and clear screens. After a death you can retry the same map or reboot into a new one. Links ending `#seed-ABC123`, `#seed-ABC123-rookery` or `#seed-ABC123-endless` load that exact run. The ARCADE screen's MAP option switches between generated and the classic hand-made maps (`#classic` forces classic).
- **Map Lab (`maplab.html`):** a gallery of freshly generated maps for all four districts, with art and tactical views, Phase 2 previews, validator stats, seed search and a "Play this map" link.
- Bullets fly until they hit something solid.
- Cover system: hard cover, low cover you can dash over and shoot across, crates that break, and barrels and signs you can hack.
- Eight enemy types, each with its own visual and audio tell: Shrike, Rook, Jackdaw, Carrion, Corvid, Bulwark, Hexer and Nest.
- Heat rises every 15 kills, bringing harder enemy mixes and adding layers to the music.
- Phase 2 at kill 50: a tram starts sweeping the south lane and kills anything on the rails.
- BLACKWING boss at kill 100, only vulnerable for a moment after each landing.
- Beat a district boss to **breach** into the next one with your score, and up to 2 Heat, carried over, or cash out. Cleared districts can be picked on the ARCADE screen.
- **District 02, Chrome Rookery:** two rooftops over a lethal chasm joined by two bridges. Wind gusts bend bullets over the gap, drone Nests spawn Corvids (armoured except while open, hackable any time), and at kill 50 the north bridge collapses. Enemies that lunge into the chasm fall.
- **Hexer:** keeps its distance and hexes you, locking Overclock and hacking for 3 seconds and scrambling the HUD.
- **THE AUGUR:** splits into five copies and only the real one casts a shadow. Shooting a fake fires a bullet ring at you; hacking any copy reveals the real one.
- **Trace (all districts):** stay near one spot for 4 seconds and the Murder sends a Shrike or Carrion through the nearest door.
- Darksynth soundtrack and a layered SFX bank, rendered in the browser with the Web Audio API.

## Save data

Progress (operative and look, scrip, owned gear and cosmetics, loadout, milestones, best score, and campaign chapters, choices, trust and datashards) is saved in the browser's local storage under `murder-save-v1`. Clearing site data resets it.

The Steam version saves to `save.json` in the app-data folder instead (`%APPDATA%\MURDER.EXE` on Windows, `~/.config/MURDER.EXE` on Linux and Steam Deck), which Steam Cloud syncs between PC and Deck. It moves an older save across the first time it runs. See [Steam Build/README.md](Steam%20Build/README.md).

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
| `g-story.js` | The campaign script: chapters, objectives, conversations, radio lines and datashard logs for all five acts |
| `g-talk.js` | Conversation screen, reply choices, trust and Resonance, and in-game radio chatter |
| `g-campaign.js` | Campaign mode: chapter runs and objectives, story district styles, the Gutterline Canals and floodwater, the Kiln and its vents, the docks fog, escort and guard objectives, hold and extract objectives, Halvorsen Wardens and crossfire, THE FERRYMAN, CINDER, the WIDOW CRANE, THE ARCHIVIST, SCARECROW, DIRECTOR VANE, THE CHOIR and MOTHER CORVINA, climbing, allies, the Nest's rewriting floor, the endings, the campaign menu, archive and chapter-complete screen |
| `g-extras.js` | Achievements, the Daily Challenge, Boss Rush and the CHALLENGES screen |
| `g-platform.js` | Platform layer: Steam achievements and leaderboards in the Steam build, local bests in a browser |
| `g-local.js` | Local co-op: extra controllers join on one screen, their twin-stick controls, and their panels |
| `g-net.js` | Co-op: Steam or two-tab transport, lobby and invites, the host running friends' players, snapshots, and the friend's view |
| `g-districts.js` | District definitions, Trace, Rookery wind and bridge collapse, Hexer, Nest and THE AUGUR |
| `g-render.js` | World, effects, HUD and screens |
| `g-main.js` | Boot, run reset and the game loop |

## Roadmap

1. Unique enemies and bosses per family, so endless districts differ in how they fight as well as how they look.
2. Steam Input action sets and Steam Deck Verified testing.
3. Steam page and a free demo for Steam Next Fest.

The full plan is in `design/index.html`.
