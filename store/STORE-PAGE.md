# MURDER.EXE · Steam store page kit

Everything for the Steam store page and library, ready to paste or upload. Everything below is filled in with the game's real numbers (30 chapters, 10 districts, 10 bosses, 39 achievements and so on). Read it through once and change anything that doesn't sound like you.

- `screenshots/`: 10 store screenshots at 1920×1080, in the order to upload them, plus spares in `screenshots/extra/`.
- `capsules/`: every store and library image at Steam's exact sizes.
- `tools/make-capsules.js`: redraws the capsules from the game's key art (`prototype/keyart.js`) and logo. Run it again if the art or logo changes.

Where each piece goes in Steamworks: open your app, then **Edit Store Page** (the text, tags and requirements) and **Graphical Assets** (the images).

---

## 1. Basic info

| Field | Value |
|---|---|
| Name | MURDER.EXE |
| Genre | Action, Indie |
| Release date | Set when ready ("Coming Soon" must be live 2 weeks before release) |
| Languages | English: Interface ✔ · Full audio ✘ · Subtitles ✘ (no voice acting) |
| Controller support | **Full controller support** (Xbox, PlayStation and Steam Deck tested) |
| Players | Single-player, Online co-op (2–4), Shared/split-screen co-op (2–4, one screen) |
| Steam features | Achievements, Steam Cloud, Steam Leaderboards (Steam Deck compatibility is rated by Valve after release) |

## 2. Short description (shown at the top right; 300 characters max)

> One bullet kills. One bullet kills you. Hunt a crow-swarm AI through a drowning neon city in a fast top-down shooter: freeze time, lock targets, and hack your way through 30 story chapters, endless runs and 1–4 player co-op.

(224 characters)

## 3. About This Game (paste into the long description box; Steam's formatting tags are included)

```
[h2]ONE BULLET. ONE LIFE.[/h2]
Saint Varrow has drowned in nine nights of rain. A cult of chrome-plated hackers has uploaded itself into CORVUS, a crow-swarm AI that sees through every camera in the city. You are Vesper Kade, a former corporate enforcer with a smart revolver, a cyberdeck and nothing left to lose.

Every enemy dies to one bullet. So do you.

[h2]FREEZE TIME. LOCK ON. DELETE.[/h2]
Trigger your Overclock and the world slows to a crawl. Paint targets across the room, then release and watch every shot land at once. Hack turrets, freeze crowds and chain kills, but every second of Overclock has to be earned.

[h2]A STORY THAT REMEMBERS YOU[/h2]
[list]
[*]30 chapters across 10 districts and five acts, from the Rain Market to the Nest
[*]Reply choices that change who trusts you, what Magpie sells you and how the night ends
[*]Three endings
[*]10 bosses, each with its own weak point: Blackwing, the Ferryman, the Augur, Cinder, the Widow Crane and more
[/list]

[h2]BUILD YOUR OPERATIVE[/h2]
[list]
[*]22 sidearms, 12 Overclock programs and 28 implants to buy from Magpie, the city's least honest fixer
[*]Test anything on the firing range before you buy it
[*]Four origins, each with its own starter kit
[*]Over 100 cosmetic pieces across 19 look slots in the BODYSHOP
[/list]

[h2]PLAY TOGETHER[/h2]
Bring up to three friends online through Steam, or plug in controllers and play on one screen, or mix both. Each player brings their own build, the difficulty scales up for every extra operative, and the Linked Overclock lets you freeze time together.

[h2]NEVER THE SAME CITY TWICE[/h2]
[list]
[*]Arcade runs build fresh districts every time, and Endless takes you as deep as you dare
[*]A Daily Challenge with the same seed, twist and kit for everyone
[*]Boss Rush: all ten bosses back to back, against the clock
[*]Global and friends leaderboards, and 39 achievements
[/list]

[h2]MADE FOR STEAM DECK[/h2]
Full controller support with aim assist, rumble, adjustable deadzones and Steam's on-screen keyboard. Settings for volume, screen shake and reduced flashing effects.
```

## 4. Tags (add in this order; the first few count most)

1. Action
2. Top-Down Shooter
3. Cyberpunk
4. Pixel Graphics
5. Bullet Time
6. Twin Stick Shooter
7. One Hit Kill (if not available, use "Difficult")
8. Online Co-Op
9. Local Co-Op
10. Story Rich
11. Choices Matter
12. Multiple Endings
13. Arena Shooter
14. Character Customization
15. Procedural Generation
16. Replay Value
17. Neon
18. Indie
19. Singleplayer
20. Controller

## 5. System requirements

| | Minimum | Recommended |
|---|---|---|
| **Windows** | Windows 10 64-bit · 2 GHz dual-core · 4 GB RAM · Intel HD 4000 or better · 500 MB space | Windows 10/11 64-bit · quad-core · 8 GB RAM · any dedicated GPU · 500 MB space |
| **SteamOS + Linux** | SteamOS 3, or Ubuntu 22.04 64-bit or similar · 2 GHz dual-core · 4 GB RAM · OpenGL 3.3 graphics · 500 MB space | Same as minimum, with 8 GB RAM |
| **macOS** | Leave unticked until there is a Mac build | |

Additional notes field: *Online co-op needs a Steam account and an internet connection.*

## 6. Content survey (answers to check before submitting)

- **Violence:** frequent, stylised pixel-art gun violence against human and robotic enemies. No gore, no blood pools, no dismemberment.
- **Language, sexual content, gambling:** none. (Scrip is earned in-game only; there are no purchases or loot boxes.)
- **Flashing lights:** muzzle flashes and screen effects; a REDUCED flashing option is in Settings.
- **AI-generated content disclosure (required by Steam):** Steam asks whether the game ships content made with AI tools. This game's code, pixel art (drawn by code), sound (synthesised by code), dialogue and store text were written with the help of an AI assistant (Claude). Tick the **pre-generated content** box and describe it in your own words, for example: *"An AI coding assistant helped write the game's code, which draws all of its art and synthesises its sound, as well as its dialogue and store text. Everything was reviewed and edited by the developer. No AI generates content while the game runs."* Steam shows this on the store page.

## 7. Images: what goes where

| Steamworks field | File | Size |
|---|---|---|
| Header capsule | `capsules/header_capsule.png` | 920×430 |
| Small capsule | `capsules/small_capsule.png` | 462×174 |
| Main capsule | `capsules/main_capsule.png` | 1232×706 |
| Vertical capsule | `capsules/vertical_capsule.png` | 748×896 |
| Page background (optional) | `capsules/page_background.jpg` | 1438×810 |
| Library capsule | `capsules/library_capsule.png` | 600×900 |
| Library header | `capsules/library_header.png` | 920×430 |
| Library hero (no text) | `capsules/library_hero.jpg` | 3840×1240 |
| Library logo (transparent) | `capsules/library_logo.png` | 1280×720 |
| Community icon | `capsules/community_icon.jpg` | 184×184 |
| Screenshots | `screenshots/01…10` | 1920×1080 |

Upload the screenshots in number order. The first four show when someone hovers over the game in Steam's lists, so co-op, the rain market, Overclock and a boss go first. In the library logo settings, place the logo bottom-left over the hero.

## 8. Trailer (still to make)

Steam strongly recommends a trailer, and it plays first on the page. Plan for 45–75 seconds, gameplay first:

1. 0–5s: rain over the Rain Market, title card "ONE BULLET."
2. 5–15s: fast kills, a dash through bullets, a flatline. Card: "ONE LIFE."
3. 15–25s: Overclock freezing time, six locks, all six fire.
4. 25–40s: districts montage (canals flooding, kiln vents, docks fog, the Nest), dialogue choices, boss weak points.
5. 40–55s: co-op, three players and a Linked Overclock.
6. 55–65s: BODYSHOP and Magpie's quick cuts. Title card, "Wishlist now" and the release window.

I can record the gameplay clips and cut a first version with the game's own music if you want one.
