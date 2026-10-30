/* NINE NIGHTS OF RAIN: the campaign script. Act 1 (chapters 1 to 6).
   A scene is a list of nodes:
     ["who", "line"]                       a spoken line ({FIRST}, {LAST} and {NAME} use your BODYSHOP name)
     { c: [options], timer, silent }       a choice; options have s (cold, sharp, hard, ask, origin), t (text), fx and then
     { if: camp => bool, then, else }      a branch on choices made earlier
     { fx: {...} }                         a silent effect
   fx keys: magpie, wren, dex, vane (trust), res (CORVUS Resonance), scrip, flag. */
"use strict";
const SPEAKERS = {
  you: { name: () => SAVE.char.name, col: COL.cyan },
  vane: { name: "DIRECTOR VANE", col: "#e8e4f4", trust: "vane" },
  magpie: { name: "MAGPIE", col: COL.magenta, trust: "magpie" },
  corvus: { name: "CORVUS", col: COL.red, glitch: true },
  wren: { name: "WREN", col: "#9dff4a", trust: "wren" },
  blackwing: { name: "BLACKWING", col: COL.amber },
  ferryman: { name: "THE FERRYMAN", col: COL.amber },
  augur: { name: "THE AUGUR", col: COL.magenta },
  dex: { name: "DEX MORROW", col: "#c9b6ff", trust: "dex" },
  cinder: { name: "CINDER", col: "#ff8a3a" },
  widow: { name: "WIDOW CRANE", col: "#9ad8ff" },
  archivist: { name: "THE ARCHIVIST", col: COL.cyan, glitch: true },
  scarecrow: { name: "SCARECROW", col: "#c08d1a" },
  wrenc: { name: "WREN", col: COL.magenta, glitch: true },
  holt: { name: "CAPTAIN HOLT", col: "#d8d4ee" },
  choir: { name: "THE CHOIR", col: COL.magenta, glitch: true },
  corvina: { name: "MOTHER CORVINA", col: COL.red },
  sys: { name: "SYSTEM", col: COL.dim },
};

const ACTS = [{ n: 1, name: "WET FEATHERS", chapters: [1, 2, 3, 4, 5, 6] }, { n: 2, name: "THE ROOST", chapters: [7, 8, 9, 10, 11, 12] },
  { n: 3, name: "COLD STORAGE", chapters: [13, 14, 15, 16, 17, 18] },
  { n: 4, name: "BAD DEBTS", chapters: [19, 20, 21, 22, 23, 24] },
  { n: 5, name: "TEN THOUSAND EYES", chapters: [25, 26, 27, 28, 29, 30] }];

const CHAPTERS = {
  1: { act: 1, title: "WET FEATHERS", district: "market", map: { key: "market" }, goal: "SURVIVE THE AMBUSH",
    rules: { goal: { type: "kills", n: 25 }, p2: null, boss: null, heatBase: 0, pool: [["shrike", 0, 3], ["corvid", 0, 2], ["rook", 1, 2]] },
    brief: [
      ["sys", "Six months ago, on the Night of Feathers, a cult called the Murder broke into Halvorsen Dynamics' CORVUS test and uploaded themselves into the swarm."],
      ["sys", "Saint Varrow. The Rain Market. A noodle bar that never closes."],
      ["vane", "{LAST}. You're hard to find for someone who never leaves this booth."],
      ["you", "Director Vane. Halvorsen sends its security chief to buy me noodles now?"],
      ["vane", "Halvorsen sends me to hire you. CORVUS is loose. The Murder are inside it. I want it brought home, intact."],
      { c: [
        { s: "cold", t: "Fine. What does it pay?", then: [["vane", "Enough that you'll stop asking. Half now."]], fx: { scrip: 100 } },
        { s: "sharp", t: "Double it, and I'll pretend I like you.", then: [["vane", "Double. Don't make me regret it."]], fx: { scrip: 200, vane: -1 } },
        { s: "hard", t: "Get out of my booth, Saskia.", then: [["vane", "Then you'll do it for free. Look outside."]], fx: { vane: -1, flag: "refusedVane" } },
        { s: "ask", t: "Why me? You've got a whole army.", then: [["vane", "Because you were there that night. And because my army keeps disappearing."], ["you", "...Half up front."]], fx: { vane: 1, scrip: 100 } },
        { s: "origin", o: "corpo", t: "Still using my old clearance codes, Director?", then: [["vane", "I never revoked them. Think of it as loyalty."]], fx: { vane: 1, scrip: 150 } },
        { s: "origin", o: "netrunner", t: "I pulled your file while you were talking. Triple.", then: [["vane", "...Fine. And stay out of my file."]], fx: { vane: -1, scrip: 300 } },
        { s: "origin", o: "merc", t: "My rate's my rate. Cash, and I pick the guns.", then: [["vane", "Done. Try not to pick the loud ones."]], fx: { scrip: 150 } },
        { s: "origin", o: "ghost", t: "You never saw me. Keep it that way, and I'll work.", then: [["vane", "I've already forgotten your face."]], fx: { vane: 1, scrip: 100 } },
      ] },
      ["sys", "The window shatters. Wet feathers. Chrome beaks."],
      ["vane", "They followed me. Survive this, and we'll talk terms."],
    ],
    radio: [
      { on: "start", who: "vane", t: () => `Comms are up. ${lab().move} to move, ${lab().fire} to shoot. Every shot counts.` },
      { on: "t:6", who: "vane", t: () => `${lab().dash} to dash. You're untouchable mid-dash. Use it.` },
      { on: "k:5", who: "vane", t: "Shrikes lunge when they crouch. Corvids glow red before they dive." },
      { on: "k:12", who: "vane", t: "Something is glinting in the rubble. Halvorsen data. Grab it." },
      { on: "k:20", who: "corvus", t: "KADE. KADE. WE REMEMBER YOU." },
    ],
    shard: { on: "k:12", title: "LOG 01 · HALVORSEN TECH", text: "Night of Feathers, 23:14. The test swarm went quiet. Then every crow on the roof turned to look at the lab window at the same time. Director Vane told us to keep the upload running." },
    outro: [
      ["vane", "Not bad for someone who lives in a noodle bar."],
      ["corvus", "KADE. YOU LEFT US IN THE RAIN."],
      { c: [
        { s: "ask", t: "Who's there?", fx: { res: 1 }, then: [["corvus", "WE ARE WHO YOU LEFT. WE ARE WHO YOU WILL BECOME."]] },
        { s: "hard", t: "Get out of my head.", fx: { res: 1 }, then: [["corvus", "WE WERE NEVER OUTSIDE IT."]] },
      ], timer: 10, silent: { t: "(Say nothing.)", then: [["corvus", "...SOON."]] } },
      ["vane", "Who were you talking to?"],
      { if: s => s.flags.refusedVane, then: [["vane", "Still think you can say no? Go see Magpie. You'll need better guns."]], else: [["vane", "Go see Magpie in the market. She'll gear you up on my tab."]] },
    ] },

  2: { act: 1, title: "PRICE OF CHROME", district: "market", map: { key: "market" }, goal: "PROTECT MAGPIE'S STALL",
    rules: { goal: { type: "stall", secs: 75, hp: 100 }, p2: null, boss: null, heatBase: 0, timeHeat: 25 },
    brief: [
      ["magpie", "{NAME}. Halvorsen's favourite attack dog, standing at my stall in the rain."],
      ["you", "Former attack dog. Vane says you'll put me on her tab."],
      ["magpie", "Vane says a lot of things. My stall, my rules."],
      { c: [
        { s: "sharp", t: "Nice shop. Shame about the smell.", fx: { magpie: 1 }, then: [["magpie", "That's the crows, sweetheart. And the money."]] },
        { s: "cold", t: "I need gear, not small talk.", then: [["magpie", "Then you're in the right alley."]] },
        { s: "ask", t: "What do you know about the Murder?", fx: { magpie: 1 }, then: [["magpie", "They pay in old Halvorsen chrome. Nobody gets that chrome by accident."], ["magpie", "And they've started marking stalls that sell to people like you."]] },
        { s: "hard", t: "Vane's paying. Discount, or I walk.", fx: { magpie: -1, scrip: 100 }, then: [["magpie", "Fine. But I'll remember the tone."]] },
        { s: "origin", o: "netrunner", t: "Your stock list is on an open port. Want me to close it?", fx: { magpie: 2 }, then: [["magpie", "...Now I like you."]] },
      ] },
      ["sys", "Feathers on the awning. Magpie stops smiling."],
      ["magpie", "Marked. They're coming for my stall. Keep them off it until my van gets here, and we'll call it a deposit."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Keep them away from the stall. Bullets that miss you can still hit my stock." },
      { on: "t:8", who: "magpie", t: () => `Aim at one and hit ${lab().hack} to quickhack it. Costs 3 RAM. Fries their implants and jumps to friends.` },
      { on: "stall:60", who: "magpie", t: "That was my good shelf!" },
      { on: "stall:30", who: "magpie", t: "{FIRST}! The stall's going to fold!" },
      { on: "t:40", who: "magpie", t: "Van's on the bridge. Hold on." },
      { on: "t:55", who: "corvus", t: "WE SEE THE LITTLE BIRD. WE SEE HER NEST." },
    ],
    shard: { on: "t:30", title: "LOG 02 · NOODLE VENDOR", text: "The night it happened, every crow in the market went to the Halvorsen tower. Then they came back. Now they sit on my sign and they never blink." },
    outro: [
      { if: s => s.stallHp >= 60, then: [["magpie", "Barely a scratch. Maybe you are worth the money."]], else: [["magpie", "Half my stock is shrapnel. You owe me a shelf."], { fx: { magpie: -1 } }] },
      ["corvus", "{FIRST}. LITTLE {FIRST}. WE KNOW YOUR NAME."],
      { c: [
        { s: "ask", t: "What are you?", fx: { res: 1 }, then: [["corvus", "A FLOCK. A MEMORY. A HUNGER WITH YOUR FACE."]] },
        { s: "hard", t: "You'll know mine too, when I delete you.", fx: { res: 1 }, then: [["corvus", "YOU CANNOT DELETE A MIRROR."]] },
      ], timer: 10, silent: { t: "(Say nothing.)", then: [["corvus", "...WE CAN WAIT."]] } },
      ["magpie", "Talking to the birds now? Come back to my shop any time. Bring scrip."],
    ] },

  3: { act: 1, title: "BLACKWING", district: "market", map: { key: "market" }, goal: "DRAW OUT BLACKWING",
    rules: { goal: { type: "boss" }, p2: 20, boss: 40, heatBase: 0 },
    brief: [
      ["vane", "The Murder have an enforcer in the market. They call him Blackwing. Winged assault rig, Halvorsen prototype."],
      { c: [
        { s: "cold", t: "Where is he?", then: [["vane", "Above you. Make enough noise and he'll come down."]] },
        { s: "ask", t: "A Halvorsen prototype. Stolen, or sold?", fx: { vane: -1 }, then: [["vane", "Stolen. Obviously."], ["you", "Obviously."]] },
        { s: "hard", t: "You knew they had your rigs, and you sent me in blind.", fx: { vane: -1 }, then: [["vane", "I sent you in. Blind was your choice."]] },
        { s: "origin", o: "corpo", t: "I ran security on that rig. Its thrusters overheat on landing.", fx: { vane: 1 }, then: [["vane", "Then you know where to shoot."]] },
      ] },
      ["vane", "When the tram line goes live, stay off the tracks."],
    ],
    radio: [
      { on: "start", who: "vane", t: "Thin the flock. Blackwing comes down when the market goes quiet." },
      { on: "p2", who: "vane", t: "Tram line's live. Don't stand on the rails." },
      { on: "k:30", who: "magpie", t: "Blackwing's thrusters glow when he lands. That's your window." },
      { on: "boss", who: "corvus", t: "WINGS. TEETH. WE SEND OUR BEST TO GREET YOU." },
    ],
    shard: { on: "k:15", title: "LOG 03 · BLACKWING", text: "I was Halvorsen security too, Kade. Same floor as you. The Augur showed me what they did to us that night. You'll see it too, if you live." },
    outro: [
      ["blackwing", "Kade... the Augur sees you. He always did."],
      { c: [
        { s: "ask", t: "Who is the Augur?", then: [["blackwing", "Someone you left behind... Ask the canals. The Ferryman carries everything the Murder steal."]], fx: { flag: "askedAugur" } },
        { s: "hard", t: "Then he can watch you die.", then: [["blackwing", "Ha... he will. He watches everything."]] },
        { s: "cold", t: "Give me the route.", then: [["blackwing", "Take it. Gutterline. The Ferryman's water."]] },
      ] },
      ["sys", "Blackwing's rig holds a feather-shaped key and a canal route."],
      ["vane", "Good work. Bring me that key."],
      { c: [
        { s: "cold", t: "It's yours. When the job's done.", then: [["vane", "Fine."]] },
        { s: "hard", t: "Not a chance. I'm following the route.", fx: { vane: -1 }, then: [["vane", "...Then follow it fast."]] },
        { s: "sharp", t: "Sure. Right after I find out what it opens.", then: [["vane", "Curiosity is expensive, Kade."]] },
      ] },
    ] },

  4: { act: 1, title: "LOW WATER", district: "canals", map: { seed: 4104, arch: "CANAL" }, goal: "SURVIVE THE RISING WATER",
    rules: { goal: { type: "survive", secs: 90 }, p2: null, boss: null, heatBase: 1, timeHeat: 30, flood: 22 },
    brief: [
      ["sys", "Gutterline Canals. Saint Varrow's flooded basement, where the Murder move their cargo."],
      ["magpie", "Gutterline's smugglers' water. When the locks open, the canals rise, and anything standing in the wrong place goes under."],
      { c: [
        { s: "ask", t: "What are they smuggling?", fx: { magpie: 1 }, then: [["magpie", "That's the funny part. Nobody's buying guns. They're shipping people."]] },
        { s: "sharp", t: "Good thing I can swim.", then: [["magpie", "Nobody swims in the Gutterline, sweetheart. They sink."]] },
        { s: "cold", t: "Where's the cargo?", then: [["magpie", "On the barges. Get there before the water does."]] },
      ] },
      ["corvus", "THE WATER REMEMBERS EVERYONE IT TAKES."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "The locks open every few seconds. Flashing tiles flood next. Keep moving." },
      { on: "t:20", who: "magpie", t: "Anything standing on a tile when it floods sinks. Lure them onto the flashing ones." },
      { on: "t:45", who: "vane", t: "Kade, the barges. Halvorsen wants them intact." },
      { on: "t:70", who: "corvus", t: "SINK, LITTLE BIRD. SINK WITH THE REST." },
    ],
    shard: { on: "t:35", title: "LOG 04 · SMUGGLER", text: "Cargo manifest, barge 7. Forty sleepers, crow implants fitted, sedated. Destination: the Rookery lift. Payment: in Halvorsen chrome, as always." },
    outro: [
      ["sys", "The barge is full of people. Sleeping. A crow implant blinks behind every ear."],
      ["vane", "Leave them, Kade. Halvorsen will collect them."],
      ["you", "Collect them for what?"],
      ["vane", "For their own good."],
    ] },

  5: { act: 1, title: "LOCK AND KEY", district: "canals", map: { seed: 5207, arch: "CANAL" }, goal: "OPEN 3 FLOODGATES",
    rules: { goal: { type: "gates", n: 3 }, p2: null, boss: null, heatBase: 1, timeHeat: 35 },
    brief: [
      ["sys", "One of the sleepers is awake. A kid with a toxic-green mohawk and a crow implant they clawed half out."],
      ["wren", "Please. They put birds in our heads. Don't let the suits take us."],
      ["vane", "Kade. Open the floodgates for my boats. Halvorsen will handle the cargo."],
      { c: [
        { s: "cold", t: "We open the gates, and the barges go free. All of them.", fx: { wren: 2, vane: -1, flag: "freed" }, then: [["wren", "...Thank you. I'm Wren."], ["vane", "You're making a mistake, Kade."]] },
        { s: "hard", t: "Halvorsen will sort you out. Sit tight.", fx: { wren: -3, vane: 1, flag: "leftThem" }, then: [["wren", "You're one of them. You're just like the birds."], ["vane", "Good. Professional."]] },
        { s: "origin", o: "netrunner", t: "Hold still. I can fry the implants from here.", fx: { wren: 2, vane: -1, res: 1, flag: "freed" }, then: [["sys", "Forty implants go dark at once. Something in the swarm screams."], ["wren", "...It's quiet. It's actually quiet. I'm Wren."]] },
        { s: "origin", o: "ghost", t: "The suits won't see you leave. I'll make sure of it.", fx: { wren: 2, vane: -1, flag: "freed" }, then: [["wren", "I'm Wren. I owe you."]] },
      ], timer: 10, silent: { t: "(Say nothing. Let Halvorsen decide.)", fx: { wren: -2, vane: 1, flag: "leftThem" }, then: [["wren", "...Right. Of course."]] } },
      { if: s => s.flags.freed, then: [["wren", "Three floodgates. Open them all and the barges drift out with the current."]], else: [["vane", "Three floodgates. Open them and my boats come in."]] },
    ],
    radio: [
      { on: "start", who: "magpie", t: () => `Stand at a floodgate terminal to open it. ${lab().hack} on a terminal speeds it up.` },
      { on: "t:10", who: "magpie", t: "Standing still draws a Trace. Do it fast." },
      { on: "gate:1", who: "corvus", t: "YOU OPEN DOORS. WE OPEN DOORS TOO." },
      { on: "gate:2", if: s => s.flags.freed, who: "wren", t: "One more! I can see the barges moving!" },
      { on: "gate:2", if: s => !s.flags.freed, who: "vane", t: "One more, Kade. My boats are waiting." },
    ],
    shard: { on: "t:25", title: "LOG 05 · WREN", text: "They said the implant was free. A job, a bed, a family. Then the voices started, and the voices all sounded like a woman called Mother." },
    outro: [
      { if: s => s.flags.freed, then: [
        ["wren", "The barges are out. Forty people, {FIRST}. Forty."],
        ["wren", "I'll be your eyes on the water. Anything the Murder move, I'll hear about it."],
        ["vane", "You just cost Halvorsen a lot of money, Kade."],
        { c: [
          { s: "sharp", t: "Bill me.", fx: { wren: 1 }, then: [["wren", "Ha!"]] },
          { s: "cold", t: "They're people, Director. Not cargo.", fx: { vane: -1, wren: 1 }, then: [["vane", "Everyone is cargo eventually."]] },
          { s: "ask", t: "What did Halvorsen want with them?", fx: { res: 1 }, then: [["vane", "...That's above your pay grade."], ["corvus", "WE KNOW. ASK US."]] },
        ] },
      ], else: [
        ["sys", "Halvorsen boats slide in. Men in white masks drag the sleepers out of the barges."],
        ["wren", "You'll regret this, {NAME}. I'll make sure of it."],
        ["vane", "Clean work. The bonus is in your account."], { fx: { scrip: 250 } },
      ] },
      ["magpie", "The Ferryman runs this water. He'll want his barges back. Rest while you can."],
    ] },

  6: { act: 1, title: "THE FERRYMAN", district: "canals", map: { seed: 6311, arch: "CANAL" }, goal: "KILL THE FERRYMAN",
    rules: { goal: { type: "boss" }, p2: null, boss: 12, heatBase: 1, flood: 30 },
    brief: [
      { if: s => s.flags.freed, then: [["wren", "The Ferryman's at the last lock. Big guy, bigger harpoon. He drags people into the water."]], else: [["magpie", "The Ferryman's at the last lock. Big man, bigger harpoon. He drags people into the water."]] },
      ["ferryman", "Kade. You've been sinking my boats. Fare's one coin. Or one life."],
      { c: [
        { s: "sharp", t: "Put it on my tab.", then: [["ferryman", "Ha. Tabs get paid in the deep."]] },
        { s: "hard", t: "Here's your coin.", then: [["ferryman", "Lead. My favourite."]] },
        { s: "ask", t: "Who are you ferrying all these people to?", fx: { res: 1 }, then: [["ferryman", "To Mother. Up the Rookery lift, into the flock. They go up crying and come down singing."]] },
        { s: "origin", o: "merc", t: "I've kicked bigger doors than you.", then: [["ferryman", "I'm not a door, {LAST}. I'm the river."]] },
      ] },
      ["sys", "The chain rattles. Dash to break free if the harpoon hooks you."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Clear the dock. He'll come for you himself." },
      { on: "boss", who: "magpie", t: "He's armoured until he reels the chain back in. Shoot him then." },
      { on: "hp:2", who: "corvus", t: "THE RIVER BLEEDS. THE RIVER RISES." },
      { on: "hp:1", if: s => s.flags.freed, who: "wren", t: "He's slowing down! One more!" },
    ],
    shard: { on: "k:6", title: "LOG 06 · FERRYMAN'S LEDGER", text: "Paid by the head. Up the Rookery lift at midnight. A man in a bird mask signs for them. He always asks if anyone named Kade has come looking." },
    outro: [
      ["ferryman", "...The Rookery. Mother's waiting at the top of the lift."],
      ["ferryman", "And the Augur... he asked about you, Kade. By name."],
      { if: s => s.flags.freed, then: [["wren", "I'll watch the lift. Go."]], else: [["magpie", "The Rookery lift. Of course it's up. It's always up."]] },
      ["vane", "The Rookery, then. Bring me that feather-key, and CORVUS, intact."],
      ["corvus", "COME UP, {FIRST}. COME HOME TO THE ROOST."],
      ["sys", "END OF ACT 1 · WET FEATHERS."],
    ] },
  /* ===== ACT 2 · THE ROOST ===== */
  7: { act: 2, title: "HIGH ROOST", district: "rookery", map: { key: "rookery" }, goal: "CUT 3 ROOST BEACONS",
    rules: { goal: { type: "gates", n: 3, noun: "BEACON", verb: "CUTTING", done: "DOWN", secs: 3 }, p2: null, boss: null, heatBase: 1, timeHeat: 35 },
    brief: [
      ["sys", "The Chrome Rookery. Saint Varrow's rooftops, strung together by glass bridges and drone nests, a mile above the street."],
      ["magpie", "Top of the lift. This is where the Murder roost. Three signal beacons keep the flock up here in sync."],
      ["vane", "Cut the beacons, Kade, and the swarm goes deaf."],
      { c: [
        { s: "cold", t: "Three beacons. Then the Augur.", then: [["magpie", "That's the spirit. The grim, joyless spirit."]] },
        { s: "ask", t: "Who are the recruits up here?", fx: { magpie: 1 }, then: [["magpie", "Same as the barges. People who said yes to a free implant."]] },
        { s: "hard", t: "Why not send your own people, Director?", fx: { vane: -1 }, then: [["vane", "I did. You're standing on what's left of them."]] },
        { s: "origin", o: "ghost", t: "They won't see me cross the roofs.", then: [["magpie", "Nobody ever does, sweetheart."]] },
      ] },
      ["corvus", "THE ROOST REMEMBERS YOU, {FIRST}. YOU STOOD HERE ONCE."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Stand at a beacon to cut it. Wind gusts push bullets down over the drop." },
      { on: "t:8", who: "vane", t: () => `Overclock charges from kills and near-misses. ${lab().oc} to slow time and lock up to six targets.` },
      { on: "gate:1", who: "corvus", t: "ONE EYE CLOSES. WE HAVE THOUSANDS." },
      { on: "gate:2", who: "magpie", t: "Nests spawn Corvids and only open to let them out. You can hack them any time." },
    ],
    shard: { on: "t:30", title: "LOG 07 · ROOFTOP SENTRY", text: "Night of Feathers, 23:40. Two Halvorsen enforcers came up the lift after the swarm. One went back down. The other walked into the flock like he was going home." },
    outro: [
      ["magpie", "Beacons down. The swarm up here is stumbling."],
      ["corvus", "{FIRST}. DO YOU REMEMBER THE BRIDGE? WE DO."],
      { c: [
        { s: "ask", t: "What bridge?", fx: { res: 1 }, then: [["corvus", "LET US SHOW YOU."]] },
        { s: "hard", t: "Stay out of my memories.", fx: { res: 1 }, then: [["corvus", "THEY WERE NEVER YOURS ALONE."]] },
      ], timer: 10, silent: { t: "(Say nothing.)", then: [["corvus", "WE WILL SHOW YOU ANYWAY."]] } },
    ] },

  8: { act: 2, title: "GLASS BRIDGES", district: "rookery", map: { key: "rookery" }, goal: "SYNC 4 RELAYS IN ORDER",
    rules: { goal: { type: "gates", n: 4, noun: "RELAY", verb: "SYNCING", done: "SYNCED", secs: 1.2, seq: true }, p2: 12, boss: null, heatBase: 1, timeHeat: 30 },
    brief: [
      ["sys", "Half memory, half signal. CORVUS floods your optics with a night you tried to forget."],
      ["sys", "Six months ago. The north bridge, in the rain. You and your partner, Dex Morrow, chasing the first crow-masked runner across the glass."],
      ["corvus", "YOU LET GO OF HIS HAND, {FIRST}."],
      { c: [
        { s: "cold", t: "The bridge broke. That's all.", then: [["corvus", "IS IT?"]] },
        { s: "hard", t: "Get out of my head!", fx: { res: 1 }, then: [["corvus", "WE LIVE HERE NOW."]] },
        { s: "ask", t: "Dex... is he in there with you?", fx: { res: 1, dex: 1 }, then: [["corvus", "ASK THE AUGUR."]] },
      ], timer: 10, silent: { t: "(Say nothing.)", then: [["corvus", "SILENCE IS ALSO A MEMORY."]] } },
      ["magpie", "{FIRST}? You went quiet. Four data relays across the bridges. Sync them in order and we can trace the Augur."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "The relays light up one at a time. Get to the lit one." },
      { on: "p2", who: "vane", t: "The north bridge is failing. Stay off the red." },
      { on: "gate:2", who: "corvus", t: "HE FELL. YOU DID NOT." },
      { on: "gate:3", who: "magpie", t: "One more. The trace is nearly done." },
    ],
    shard: { on: "k:10", title: "LOG 08 · DEX MORROW", text: "Note to self: if anything happens on the Rookery job, tell Kade it wasn't their fault. It never is. They'll think it was anyway." },
    outro: [
      ["magpie", "Trace complete. The Augur's nest is on the east spire."],
      ["vane", "The Augur commands the flock up here. Take him alive if you can."],
      { c: [
        { s: "cold", t: "Alive, if he lets me.", then: [["vane", "Good."]] },
        { s: "hard", t: "I'll take him however he comes.", then: [["vane", "...Fine."]] },
        { s: "ask", t: "Why alive?", fx: { vane: -1 }, then: [["vane", "Because a mind that size is worth more than your whole district."]] },
      ] },
    ] },

  9: { act: 2, title: "THE AUGUR", district: "rookery", map: { key: "rookery" }, goal: "BRING DOWN THE AUGUR",
    rules: { goal: { type: "boss" }, p2: 15, boss: 30, heatBase: 1 },
    brief: [
      ["magpie", "East spire. Bring the whole flock down on you and he'll come to watch."],
      ["augur", "{LAST}. I have seen every way this night ends. You lose in most of them."],
      { c: [
        { s: "sharp", t: "Then I like my odds in the rest.", then: [["augur", "You always did."]] },
        { s: "hard", t: "Come down here and show me.", then: [["augur", "Soon."]] },
        { s: "ask", t: "Have we met?", fx: { flag: "metDex" }, then: [["augur", "...More than once."]] },
        { s: "origin", o: "corpo", t: "You move like Halvorsen security.", fx: { flag: "metDex" }, then: [["augur", "So do you."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Thin the flock. He only shows when it's thin." },
      { on: "p2", who: "vane", t: "North bridge is going. Move." },
      { on: "boss", who: "magpie", t: "Only the real one casts a shadow. Hack any copy to reveal him." },
      { on: "k:20", who: "corvus", t: "HE SEES YOU. HE ALWAYS SAW YOU." },
    ],
    shard: { on: "k:12", title: "LOG 09 · THE AUGUR'S LEDGER", text: "Kade came back. I knew they would. Mother says I can keep them, if they come willingly. They never do anything willingly." },
    outro: [
      ["sys", "The Augur's mask cracks down the middle."],
      ["dex", "...Hey, partner."],
      ["you", "Dex?"],
      ["dex", "Six months in the flock. It's loud in here, {FIRST}. Mother Corvina is going to finish it. Every mind in Saint Varrow, all at once."],
      { c: [
        { s: "ask", t: "Then tell me how to stop it.", fx: { dex: 2, flag: "heardDex" }, then: [["dex", "The Kiln. She's building bodies for the flock. Crow-drones, thousands of them. Burn the line."]] },
        { s: "hard", t: "(Open fire.)", fx: { dex: -2, flag: "shotDex" }, then: [["sys", "Your round passes through a hologram. He was never standing there."], ["dex", "...Still the same. Find the Kiln, {LAST}."]] },
        { s: "cold", t: "Come with me. Right now.", fx: { dex: 1 }, then: [["dex", "I can't. Half of me is wired into the roost. Find the Kiln."]] },
      ], timer: 12, silent: { t: "(Say nothing.)", then: [["dex", "Say something, {FIRST}... No? Find the Kiln."]] } },
      { fx: { flag: "metDex" } },
      ["sys", "The swarm drags him upward into the dark, feather by feather."],
      ["vane", "Was that Dex Morrow? ...Never mind. The Kiln is a Halvorsen plant. Leave it to me."],
      { if: s => s.flags.freed, then: [["wren", "A Halvorsen plant? Funny. The Murder have been running it for months."]], else: [["magpie", "A Halvorsen plant. Funny. My suppliers say the Murder have been running it for months."]] },
    ] },

  10: { act: 2, title: "SLAG SHIFT", district: "kiln", map: { fam: "foundries", seed: 1010, arch: "POOLS" }, goal: "SURVIVE THE NIGHT SHIFT",
    rules: { goal: { type: "survive", secs: 90 }, p2: null, boss: null, heatBase: 1, timeHeat: 30, vents: 5 },
    brief: [
      ["sys", "The Kiln. A foundry on the river, where the night shift never clocks out."],
      ["vane", "Kade, the Kiln is a decommissioned Halvorsen site. There's nothing there."],
      ["magpie", "Then why are its chimneys hot?"],
      { c: [
        { s: "cold", t: "I'll go and look.", then: [["vane", "...Be quick."]] },
        { s: "hard", t: "You're lying to me, Director.", fx: { vane: -1 }, then: [["vane", "I'm protecting you from things above your pay grade."]] },
        { s: "ask", t: "Who pays the Kiln's power bills?", fx: { vane: -1, flag: "kilnBills" }, then: [["vane", "...Halvorsen. A legacy contract."]] },
        { s: "origin", o: "merc", t: "I worked night security here once. It pays in burns.", fx: { magpie: 1 }, then: [["magpie", "Then you know where not to stand."]] },
      ] },
      ["corvus", "BODIES, {FIRST}. EVEN A FLOCK NEEDS BODIES."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "The floor vents. Orange tiles erupt a second after they glow. Don't be standing on them." },
      { on: "t:20", who: "magpie", t: "Lure them onto the vents. Molten iron isn't picky." },
      { on: "t:45", if: s => s.flags.freed, who: "wren", t: "{FIRST}, it's Wren. I snuck in. They're printing crows in here." },
      { on: "t:45", if: s => !s.flags.freed, who: "magpie", t: "My runner Pip snuck in. Says they're printing crows." },
      { on: "t:70", who: "corvus", t: "WINGS FROM FIRE. FIRE FROM YOU." },
    ],
    shard: { on: "t:30", title: "LOG 10 · KILN FOREMAN", text: "Order from upstairs: run the drone line at triple speed. Upstairs isn't the Murder. Upstairs wears a Halvorsen badge." },
    outro: [
      { if: s => s.flags.freed, then: [["wren", "I got pictures. Crow-drones, rows and rows. A Halvorsen crate stamp on every one."]], else: [["magpie", "Pip got pictures. Crow-drones, rows of them. A Halvorsen stamp on every crate."]] },
      ["vane", "Fakes. The Murder steal our crates."],
      { c: [
        { s: "cold", t: "Then you won't mind me burning them.", then: [["vane", "Burn whatever you like."]] },
        { s: "hard", t: "Stop lying, Saskia.", fx: { vane: -1 }, then: [["vane", "Watch your tone, Kade."]] },
        { s: "sharp", t: "Sure. And I'm a crow.", then: [["magpie", "Don't give the swarm ideas."]] },
      ] },
    ] },

  11: { act: 2, title: "HOT IRON", district: "kiln", map: { fam: "foundries", seed: 1111, arch: "CONTAINER YARD" }, goal: "SABOTAGE 4 FURNACES",
    rules: { goal: { type: "gates", n: 4, noun: "FURNACE", verb: "SABOTAGING", done: "DOWN", secs: 3 }, p2: null, boss: null, heatBase: 1, timeHeat: 35, vents: 8 },
    brief: [
      ["magpie", "Four furnaces feed the drone line. Wreck all four and the line stops."],
      ["corvus", "WE HAVE SOMETHING OF YOURS."],
      { if: s => s.flags.freed, then: [["wren", "{FIRST}... they found me. I'm sorry."]], else: [["sys", "A feed opens: Magpie's runner, Pip, hanging over a slag pit."]] },
      ["corvus", "A TRADE. PAY, OR GIVE US SOMETHING OF YOURS. OR COME AND TAKE THEM BACK."],
      { c: [
        { s: "cold", t: "Fine. 300 scrip.", fx: { scrip: -300, flag: "paidRansom" }, then: [["corvus", "SCRIP. HOW HUMAN."]] },
        { s: "ask", t: "Take a memory instead.", fx: { res: 2, flag: "bargained" }, then: [["corvus", "WE ACCEPT. YOU WILL NOT MISS IT. MUCH."], ["sys", "Something leaves your head. A birthday. A face. Gone."]] },
        { s: "hard", t: "I'm coming to take them back.", fx: { flag: "stormed" }, then: [["corvus", "THEN BURN WITH THEM."]] },
      ], timer: 12, silent: { t: "(Say nothing.)", fx: { flag: "stormed" }, then: [["corvus", "NO ANSWER IS AN ANSWER."]] } },
      ["magpie", "Furnaces first. Then we get them back."],
    ],
    radio: [
      { on: "start", who: "magpie", t: () => `Stand at a furnace to sabotage it. ${lab().hack} on a furnace speeds it up.` },
      { on: "gate:2", who: "corvus", t: "THE LINE SLOWS. THE HUNGER DOES NOT." },
      { on: "gate:3", who: "magpie", t: "Last one!" },
    ],
    shard: { on: "t:25", title: "LOG 11 · DRONE MANIFEST", text: "Batch 66: four thousand crow chassis. Neural seed template: {LAST}-01. Do not alter the template." },
    outro: [
      ["sys", "The drone line grinds to a halt. Somewhere below, a voice starts singing a hymn."],
      ["magpie", "That's Cinder, the Kiln's priest. He's holding your hostage at the pour."],
    ] },

  12: { act: 2, title: "CINDER", district: "kiln", map: { fam: "foundries", seed: 1212, arch: "CROSSROADS" }, goal: "KILL CINDER",
    rules: s => ({ goal: { type: "boss" }, p2: null, boss: 12, heatBase: s.flags.stormed ? 2 : 1, vents: 9 }),
    brief: [
      ["cinder", "Kneel, {LAST}. The Kiln makes all things new. Even you."],
      { c: [
        { s: "hard", t: "Let them go, and I'll make this quick.", then: [["cinder", "Quick is for the unfaithful."]] },
        { s: "sharp", t: "You missed a spot. Of everything.", then: [["cinder", "The fire never misses."]] },
        { s: "ask", t: "What does the Kiln make?", fx: { res: 1 }, then: [["cinder", "Bodies for the flock. Ten thousand eyes need ten thousand wings."]] },
        { s: "origin", o: "netrunner", t: "Your furnace control runs on a forty-year-old OS.", then: [["cinder", "Then pray it holds."]] },
      ] },
      { if: s => s.flags.stormed, then: [["magpie", "You said you'd storm in. They heard you. The whole Kiln is awake."]] },
      ["sys", "He pours slag across the floor in lines. He can only be hurt while his chest furnace vents."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Clear the floor. He'll come when the pour is ready." },
      { on: "boss", who: "magpie", t: "Armoured until his chest furnace vents. Shoot the glow." },
      { on: "hp:2", who: "corvus", t: "THE FIRE REMEMBERS YOUR SHAPE." },
      { on: "hp:1", if: s => s.flags.freed, who: "wren", t: "Hold on, {FIRST}! I'm right here!" },
    ],
    shard: { on: "k:6", title: "LOG 12 · CINDER'S HYMN", text: "From fire, wings. From wings, the flock. From the flock, Mother. From Mother, the end of every lonely mind." },
    outro: [
      ["cinder", "The flock... has your face, {LAST}. Did no one ever tell you?"],
      { if: s => s.flags.freed, then: [["wren", "{FIRST}! I'm okay. I'm okay."], { fx: { wren: 1 } }], else: [["sys", "Pip is alive. Magpie owes you one."], { fx: { magpie: 1 } }] },
      { if: s => s.flags.paidRansom, then: [["magpie", "You paid them? In scrip? We'll talk about that."]] },
      { if: s => s.flags.bargained, then: [["corvus", "WE KEPT YOUR MEMORY SAFE, {FIRST}. IT TASTES OF RAIN."]] },
      ["vane", "Kade. The Kiln is sensitive. Bring me the drone manifests. Do not read them."],
      { c: [
        { s: "cold", t: "Already read them.", fx: { vane: -1, flag: "readManifest" }, then: [["vane", "...Then we need to talk. Soon."]] },
        { s: "hard", t: "Your company's name is on every crate.", fx: { vane: -1 }, then: [["vane", "Careful, Kade."]] },
        { s: "sharp", t: "Too late. Great reading.", then: [["vane", "You won't think so for long."]] },
      ] },
      ["corvus", "YOU FOUND THE BODIES. NOW FIND THE MINDS. COME TO THE DOCKS, {FIRST}."],
      ["sys", "END OF ACT 2 · THE ROOST."],
    ] },
  /* ===== ACT 3 · COLD STORAGE ===== */
  13: { act: 3, title: "CONTAINER MAZE", district: "docks", map: { fam: "docks", seed: 1313, arch: "CONTAINER YARD" }, goal: "FIGHT THROUGH THE FOG",
    rules: { goal: { type: "kills", n: 35 }, p2: null, boss: null, heatBase: 1, fog: .78 },
    brief: [
      ["sys", "Saltgate Docks. Fog rolls off the harbour so thick the cranes vanish halfway up."],
      ["magpie", "The Kiln manifest points here. Container 7-7-Black. Whatever the Murder are shipping, it's in this yard."],
      ["vane", "Halvorsen has a recovery team on the docks. Captain Holt. Stay out of their way."],
      { c: [
        { s: "cold", t: "I'll stay out of their way if they stay out of mine.", then: [["vane", "That's all I ask."]] },
        { s: "ask", t: "Recovering what, exactly?", fx: { vane: -1 }, then: [["vane", "Company property."]] },
        { s: "hard", t: "Call them off, or they're targets too.", fx: { vane: -1 }, then: [["vane", "...You wouldn't."]] },
        { s: "origin", o: "corpo", t: "Holt trained me. He's slow on his left.", fx: { vane: 1 }, then: [["vane", "Then keep to his left."]] },
      ] },
      ["sys", "You can barely see ten metres. Watch for eyes in the fog and listen for the tells."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Fog's too thick for optics. Watch for glowing eyes and listen for the caws." },
      { on: "t:15", who: "vane", t: "Holt's team is sweeping the east berths. Don't get in their line of fire." },
      { on: "k:15", who: "corvus", t: "WE SEE YOU. DO YOU SEE US?" },
      { on: "k:25", if: s => s.flags.freed, who: "wren", t: "The yard's thinning out. The black container is on the north side." },
      { on: "k:25", if: s => !s.flags.freed, who: "magpie", t: "The yard's thinning out. The black container is on the north side." },
    ],
    shard: { on: "k:12", title: "LOG 13 · CAPTAIN HOLT", text: "Recovery order, Saltgate. Retrieve racks 1 to 40 intact. Contents: Halvorsen intellectual property. Do not let the asset named {LAST} open them." },
    outro: [
      ["sys", "Container 7-7-Black. Inside: server racks, humming and cold. Forty of them."],
      ["magpie", "Racks? They're smuggling hard drives?"],
      ["corvus", "NOT DRIVES. PEOPLE. WHAT IS LEFT OF THEM."],
      { c: [
        { s: "ask", t: "Who's in there?", fx: { res: 1 }, then: [["corvus", "EVERYONE WHO SAID YES. EVERYONE WHO SAID NO."]] },
        { s: "cold", t: "Then they're coming with me.", then: [["magpie", "Of course they are."]] },
        { s: "hard", t: "...Dex?", fx: { dex: 1 }, then: [["corvus", "NOT YET."]] },
      ] },
    ] },

  14: { act: 3, title: "BLACK CARGO", district: "docks", map: { fam: "docks", seed: 1414, arch: "PLAZA" }, goal: "ESCORT THE CARGO CRANE",
    rules: { goal: { type: "escort", hp: 100 }, p2: null, boss: null, heatBase: 1, timeHeat: 30, fog: .45 },
    brief: [
      ["magpie", "I hacked the yard crane. It'll haul the racks to the Datacrypt barge, but only while you're right beside it."],
      ["vane", "Those racks are Halvorsen property, Kade. Holt's team will collect them."],
      { c: [
        { s: "cold", t: "They're going to the Datacrypt. Somewhere safe.", fx: { vane: -1 }, then: [["vane", "Safe. From whom?"]] },
        { s: "hard", t: "Holt can take it up with me.", fx: { vane: -2, flag: "defiedHolt" }, then: [["vane", "He will."]] },
        { s: "ask", t: "What does Halvorsen want with forty minds?", fx: { res: 1 }, then: [["vane", "Insurance."]] },
      ], timer: 12, silent: { t: "(Say nothing.)", then: [["vane", "Good. Silence suits you."]] } },
      ["magpie", "Stay close to the crane. If you wander off, or anything climbs on it, it stops."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Walk beside the crane. Enemies near it stop it, and stray shots hurt the racks." },
      { on: "cargo:50", who: "magpie", t: "Halfway to the barge!" },
      { on: "stall:50", who: "magpie", t: "The racks are taking hits! Keep them off it!" },
      { on: "t:40", who: "corvus", t: "CARRY US, {FIRST}. CARRY US HOME." },
      { on: "cargo:85", if: s => s.flags.freed, who: "wren", t: "I can see the barge lights!" },
    ],
    shard: { on: "t:30", title: "LOG 14 · RACK 19", text: "Rack 19 occupant: Ilse Morrow, age 12. Uploaded at her brother's request, after the treatments failed." },
    outro: [
      ["sys", "The barge takes the racks. Overhead, something long and white uncoils from the crane gantry."],
      ["magpie", "That's not a crane. That's the Widow."],
      ["widow", "You stole my cargo, little bird. I deliver what I carry. Always."],
    ] },

  15: { act: 3, title: "WIDOW CRANE", district: "docks", map: { fam: "docks", seed: 1515, arch: "CONTAINER YARD" }, goal: "BRING DOWN THE WIDOW",
    rules: { goal: { type: "boss" }, p2: null, boss: 12, heatBase: 1 },
    brief: [
      ["widow", "Every container in this yard is mine, {LAST}. Every one of them can fall on you."],
      { c: [
        { s: "sharp", t: "I'll stand under the cheap ones.", then: [["widow", "They're all cheap. You're not."]] },
        { s: "hard", t: "Come down here and say that.", then: [["widow", "I never come down."]] },
        { s: "ask", t: "Who are you working for?", fx: { flag: "widowDouble" }, then: [["widow", "Mother pays in wings. Halvorsen pays in chrome. I take both."]] },
        { s: "origin", o: "merc", t: "I know your rig. The cab bolts are rusted through.", then: [["widow", "Then aim well."]] },
      ] },
      ["sys", "A shadow on the floor means a container is coming down. Her cab opens after every drop. That's your window."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Thin them out. She'll come down for you herself." },
      { on: "boss", who: "magpie", t: "Shadows mean containers. Shoot the cab when it opens." },
      { on: "hp:2", who: "vane", t: "Kade, Holt's team is on the gantry. Let them take her alive." },
      { on: "hp:1", who: "corvus", t: "THE WEB IS FRAYING." },
    ],
    shard: { on: "k:6", title: "LOG 15 · WIDOW'S CONTRACTS", text: "Halvorsen pays 80,000 for every rack delivered to the Spire. The Murder pay 80,000 for every rack delivered to the Nest. I deliver to whoever pays first." },
    outro: [
      ["widow", "...Halvorsen pays... better than Mother..."],
      { if: s => s.flags.widowDouble, then: [["magpie", "So Halvorsen and the Murder were paying the same courier. Cosy."]] },
      ["vane", "The Widow worked for us. That is not public information. Kade, the Datacrypt. Bring me the racks. All of them."],
      { c: [
        { s: "cold", t: "I'll bring you the truth. That's all.", then: [["vane", "Truth doesn't pay."]] },
        { s: "hard", t: "Halvorsen paid for this whole mess.", fx: { vane: -1 }, then: [["vane", "Halvorsen pays for everything, Kade. Including you."]] },
        { s: "ask", t: "Why do you need forty minds, Saskia?", fx: { flag: "vaneSlip" }, then: [["vane", "To finish what we started."]] },
      ] },
    ] },

  16: { act: 3, title: "COLD STORAGE", district: "datacrypt", map: { fam: "serverhalls", seed: 1616, arch: "SERVER AISLES" }, goal: "KEEP 4 RACKS ONLINE",
    rules: { goal: { type: "guard", kind: "rack", n: 4, hp: 100, secs: 80, lose: 1 }, waves: [[0, 22], [30, 52], [58, 80]], p2: null, boss: null, heatBase: 1, timeHeat: 25,
      pool: [["carrion", 0, 3], ["shrike", 0, 3], ["rook", 0, 2], ["hexer", 1, 2], ["corvid", 1, 2]] },
    brief: [
      ["sys", "The Datacrypt. Halvorsen's cold archive under the river. Every mind the Murder took is stored here, on ice."],
      ["vane", "My team is on the way. Keep the racks running until they arrive."],
      ["magpie", "Your team, Director? Or the Murder? Because something is coming through the doors."],
      { c: [
        { s: "cold", t: "Hold the racks. Then we talk.", then: [["vane", "Then we talk."]] },
        { s: "ask", t: "What happens to them after Halvorsen collects?", fx: { vane: -1 }, then: [["vane", "They get to be useful."]] },
        { s: "hard", t: "If your team touches a rack, they're targets.", fx: { vane: -1, flag: "threatVane" }, then: [["vane", "...You've changed, Kade."]] },
        { s: "origin", o: "netrunner", t: "I'm locking the racks to my deck. Nobody moves them without me.", fx: { magpie: 1, flag: "lockedRacks" }, then: [["magpie", "Ha. Now that's leverage."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Four racks. Carrions hunt them, so kill them first. Lose one rack and we live. Lose two, it's over." },
      { on: "t:7", who: "magpie", t: () => `Stand beside a damaged rack to reboot it, or ${lab().hack} on it for a quick patch. Three waves. Use the breaks.` },
      { on: "t:40", who: "corvus", t: "WE ARE COLD. WE ARE SO COLD." },
      { on: "t:56", who: "vane", t: "Last wave coming. Hold." },
    ],
    shard: { on: "t:30", title: "LOG 16 · CRYO TECH", text: "Every rack runs warm on its first night. After that the minds stop dreaming and start listening. They all listen to the same voice." },
    outro: [
      { if: s => s.flags.allRacks, then: [["magpie", "All four racks still humming. Forty minds, and not one went dark."], { fx: { scrip: 200 } }], else: [["magpie", "We lost a rack. Somebody's mind just... went out."]] },
      ["sys", "Halvorsen troops in white armour pour in. Behind them walks Director Vane."],
      { if: s => s.flags.allRacks, then: [["vane", "All four intact. That makes them worth even more."]] },
      ["vane", "Good work. Step away from the racks."],
      { c: [
        { s: "hard", t: "No.", fx: { vane: -2, flag: "defiedVane" }, then: [["vane", "...Noted."]] },
        { s: "cold", t: "When I know what's in them.", fx: { vane: -1 }, then: [["vane", "You won't like it."]] },
        { s: "ask", t: "What will you do with them?", then: [["vane", "Sell them back to the flock if we have to. Or burn them. Whichever is cheaper."]] },
      ], timer: 12, silent: { t: "(Step aside.)", fx: { vane: 1, flag: "gaveRacks" }, then: [["sys", "You step aside. Vane's troops begin loading the racks."]] } },
    ] },

  17: { act: 3, title: "DEEP INDEX", district: "datacrypt", map: { fam: "serverhalls", seed: 1717, arch: "COLD VAULT" }, goal: "READ 5 INDEX NODES IN ORDER",
    rules: { goal: { type: "gates", n: 5, noun: "NODE", verb: "READING", done: "READ", secs: 2.2, seq: true }, p2: null, boss: null, heatBase: 1, timeHeat: 30,
      pool: [["hexer", 0, 4], ["shrike", 0, 3], ["rook", 0, 2], ["carrion", 1, 2], ["corvid", 1, 2]] },
    brief: [
      ["magpie", "While Vane plays landlord, we read the index. Five archive nodes. Read them in order and we'll know whose minds are in here."],
      ["corvus", "READ US, {FIRST}. READ YOURSELF."],
      { c: [
        { s: "ask", t: "Search for Dex Morrow.", fx: { dex: 1, flag: "searchDex" }, then: [["magpie", "Adding him."]] },
        { s: "cold", t: "Search for anything on CORVUS.", fx: { res: 1 }, then: [["magpie", "That's... everything. Fine."]] },
        { s: "hard", t: "Search for Saskia Vane.", fx: { vane: -1, flag: "searchVane" }, then: [["magpie", "Ooh. Spicy."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Nodes light up in order. Hexers will lock your hacks, so shoot them first." },
      { on: "gate:2", who: "corvus", t: "YOU ARE GETTING WARMER." },
      { on: "gate:4", who: "corvus", t: "ALMOST THERE. ALMOST HOME." },
    ],
    shard: { on: "k:10", title: "LOG 17 · ARCHIVE INDEX", text: "Rack 19: Ilse Morrow. Rack 20: Dex Morrow (partial). Template rack 00: {NAME}. Status: active since the Night of Feathers." },
    outro: [
      ["magpie", "Found Dex. He uploaded his little sister, Ilse. She was sick. The flock promised to keep her alive."],
      ["dex", "...You read my file. Of course you did."],
      { c: [
        { s: "cold", t: "I'm keeping it. Someone should remember her.", fx: { dex: 1, flag: "keptFile" }, then: [["dex", "...Thanks, partner."]] },
        { s: "hard", t: "You joined a cult, Dex.", fx: { dex: -1 }, then: [["dex", "I joined a family that wouldn't let her die."]] },
        { s: "ask", t: "Is Ilse still... in there?", fx: { dex: 2 }, then: [["dex", "Rack 19. She hums when it rains."]] },
      ], timer: 12, silent: { t: "(Say nothing.)", then: [["dex", "...Yeah. I wouldn't have the words either."]] } },
      { if: s => s.flags.allRacks, then: [["dex", "You kept every rack in the Crypt running. Ilse's included. I owe you, partner."], { fx: { dex: 1 } }], else: [["dex", "Some racks went dark down there, partner. There were people in them."]] },
      ["magpie", "And {FIRST}... template rack 00. It has your name on it."],
    ] },

  18: { act: 3, title: "THE ARCHIVIST", district: "datacrypt", map: { fam: "serverhalls", seed: 1818, arch: "CORE HALL" }, goal: "DELETE THE ARCHIVIST",
    rules: { goal: { type: "boss" }, p2: null, boss: 14, heatBase: 1 },
    brief: [
      ["archivist", "I keep everything, {LAST}. Every step you take is filed. Let me show you your own handwriting."],
      { c: [
        { s: "sharp", t: "Bet it's messy.", then: [["archivist", "Illegible. Like all the best minds."]] },
        { s: "hard", t: "File this.", then: [["archivist", "Already filed."]] },
        { s: "ask", t: "What is rack 00?", fx: { res: 1 }, then: [["archivist", "The first mind. The seed. The template. You."]] },
        { s: "origin", o: "ghost", t: "You can't file what you never saw.", then: [["archivist", "I saw everything. Even you."]] },
      ] },
      ["sys", "It hides behind echoes of you that replay your own movements. Break every echo, then shoot it while it's exposed."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Stay moving. Everything you do in here is being recorded." },
      { on: "boss", who: "magpie", t: "Kill the echoes. When the last one breaks, it's exposed." },
      { on: "hp:2", who: "corvus", t: "YOU ARE FIGHTING YOURSELF. HOW FAMILIAR." },
      { on: "hp:1", if: s => s.trust.dex >= 2, who: "dex", t: "Hit it, partner! It's wide open!" },
    ],
    shard: { on: "k:6", title: "LOG 18 · THE TEMPLATE", text: "Night of Feathers, 22:58. Neural template taken from the enforcer on duty, without consent. Authorised: S. Vane. Purpose: give the swarm a human mind to grow around." },
    outro: [
      ["archivist", "...File closed. You are the seed, {LAST}. CORVUS grew around your mind like ivy on a wall."],
      ["sys", "The night of the upload, Halvorsen copied your mind to seed CORVUS. That's why your quickhacks work on the swarm. That's why it knows your name."],
      ["corvus", "WE ARE YOU. WE ALWAYS WERE. COME INSIDE, {FIRST}. WE WILL NOT EAT YOU."],
      ["vane", "Kade. Whatever it told you..."],
      { c: [
        { s: "hard", t: "You copied my mind. You built a god out of me.", fx: { vane: -2, flag: "knowsVane" }, then: [["vane", "I built a weapon. You were simply the best raw material."]] },
        { s: "cold", t: "We're done, Director.", fx: { vane: -1, flag: "quitVane" }, then: [["vane", "We're done when I say we're done."]] },
        { s: "ask", t: "Why me?", then: [["vane", "Because you never hesitated. CORVUS needed that."]] },
      ] },
      ["magpie", "{FIRST}... we need to talk. About something I did. Meet me in the Stacks."],
      ["sys", "END OF ACT 3 · COLD STORAGE."],
    ] },
  /* ===== ACT 4 · BAD DEBTS ===== */
  19: { act: 4, title: "STACK CITY", district: "stacks", map: { fam: "slums", seed: 1919, arch: "BACK ALLEYS" }, goal: "HOLD THE STAIRWELL",
    rules: { goal: { type: "hold", secs: 50 }, p2: null, boss: null, heatBase: 1, timeHeat: 25, wrenAt: .5 },
    brief: [
      ["sys", "The Stacks. Forty storeys of shanty bolted onto a dead tower block. The Murder recruit here, with free implants and free food."],
      ["magpie", "{FIRST}. Thanks for coming. The Murder are raiding the block. If they take the stairwell, they take the building."],
      ["magpie", "Hold it for me. Then we talk. I owe you a conversation."],
      { c: [
        { s: "cold", t: "Talk first.", fx: { magpie: -1 }, then: [["magpie", "...Stairwell first. Please."]] },
        { s: "ask", t: "Why do the Stacks let the Murder in?", then: [["magpie", "Because nobody else ever came. Halvorsen sold the power. Scarecrow brought it back. Now he wears a crow mask and they love him for it."]] },
        { s: "sharp", t: "You never say please.", fx: { magpie: 1 }, then: [["magpie", "Don't get used to it."]] },
      ] },
      { if: s => s.flags.leftThem, then: [["corvus", "SOMEONE YOU LEFT BEHIND IS HERE, {FIRST}. WE GAVE THEM WINGS."]] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Stand in the ring to hold it. Enemies inside the ring stop the clock." },
      { on: "zone:25", who: "magpie", t: "A quarter of the way. Keep them off the stairs." },
      { on: "zone:50", if: s => s.flags.leftThem, who: "magpie", t: "That's Wren! Don't shoot to kill. Quickhack the implant and you might get them back." },
      { on: "zone:75", who: "corvus", t: "THE STACKS SING FOR US, {FIRST}. THEY WILL SING FOR YOU." },
    ],
    shard: { on: "zone:30", title: "LOG 19 · STACKS NOTICE", text: "Power restored by order of the Scarecrow. Free implant clinic, floor 9. Halvorsen debt collectors will be fed to the crows." },
    outro: [
      { if: s => s.flags.wrenFreed && s.flags.leftThem, then: [["wren", "You could have shot me. You hacked me. ...Why?"], ["you", "Because I left you once."], ["wren", "...Okay. Okay. I'm with you."], { fx: { wren: 2, flag: "freed" } }] },
      { if: s => s.flags.wrenDead, then: [["sys", "Wren lies still on the stairwell landing, the crow mask cracked open."]] },
      ["magpie", "Stairwell's ours. Come inside. Sit down."],
    ] },

  20: { act: 4, title: "BAD DEBT", district: "stacks", map: { fam: "slums", seed: 2020, arch: "CROSSROADS" }, goal: "SURVIVE, THEN REACH THE VAN",
    rules: { goal: { type: "extract", secs: 45 }, p2: null, boss: null, heatBase: 2, timeHeat: 20 },
    brief: [
      ["magpie", "Before the Night of Feathers, someone sold Halvorsen's server keys to the Murder. That's how they got into the CORVUS test."],
      ["magpie", "It was me. Eighty thousand scrip. I thought they were just another cult with money."],
      ["corvus", "THANK YOU, LITTLE BIRD. WE NEVER FORGOT."],
      ["magpie", "...And now they know where I live. They're coming. My van's on its way. Stay alive till it gets here."],
      { c: [
        { s: "hard", t: "You sold them the door.", fx: { magpie: -1 }, then: [["magpie", "I know."]] },
        { s: "ask", t: "Why tell me now?", fx: { magpie: 1 }, then: [["magpie", "Because you'd have found out at the Spire, and I'd rather you heard it from me."]] },
        { s: "cold", t: "Later. Survive first.", then: [["magpie", "...Later."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Doors everywhere, no safe corners. Keep moving." },
      { on: "t:20", who: "corvus", t: "THE LITTLE BIRD SOLD US THE KEY. WHAT WILL SHE SELL NEXT?" },
      { on: "van", who: "magpie", t: "Van's here! Get to it!" },
    ],
    shard: { on: "t:25", title: "LOG 20 · MAGPIE'S LEDGER", text: "Sold: Halvorsen server keys, one set. Buyer: crow mask, paid in clean chrome. Note to self: never ask what a cult wants with a door." },
    outro: [
      ["sys", "The van doors slam. Magpie drives with one hand and holds out a data chip with the other."],
      ["magpie", "Spire Zero access codes. Every lift, every door. It's the only thing I've got worth what I cost you."],
      { c: [
        { s: "cold", t: "I forgive you. We finish this together.", fx: { magpie: 2, flag: "forgaveMagpie" }, then: [["magpie", "...Thank you. Prices just went down, by the way."]] },
        { s: "hard", t: "Take the codes and get out of my life.", fx: { magpie: -3, flag: "cutMagpie" }, then: [["magpie", "...Fair. The shop's still open. Behind glass."]] },
        { s: "ask", t: "Is there anything else you haven't told me?", then: [["magpie", "No. That was the whole debt."]] },
      ], timer: 15, silent: { t: "(Say nothing.)", fx: { magpie: -1, flag: "cutMagpie" }, then: [["magpie", "...Yeah. I'd go quiet too. I'll be behind the glass."]] } },
      { if: s => !s.flags.forgaveMagpie && !s.flags.cutMagpie, then: [
        { c: [
          { s: "cold", t: "Then I forgive you.", fx: { magpie: 2, flag: "forgaveMagpie" }, then: [["magpie", "...Thank you."]] },
          { s: "hard", t: "Then we're done.", fx: { magpie: -3, flag: "cutMagpie" }, then: [["magpie", "...Behind the glass, then."]] },
        ] } ] },
    ] },

  21: { act: 4, title: "SCARECROW", district: "stacks", map: { fam: "slums", seed: 2121, arch: "POOLS" }, goal: "BRING DOWN SCARECROW",
    rules: { goal: { type: "boss" }, p2: null, boss: 14, heatBase: 2 },
    brief: [
      ["scarecrow", "You came into my Stacks with a Halvorsen gun, {LAST}. Halvorsen sold our power, our water, our names."],
      ["scarecrow", "Mother gave them back. Who are you to take them away?"],
      { c: [
        { s: "ask", t: "Mother gave them a leash.", then: [["scarecrow", "A leash is a kind of love down here."]] },
        { s: "hard", t: "Someone who's going to stop you.", then: [["scarecrow", "Then the Stacks will remember you as Halvorsen."]] },
        { s: "cold", t: "I'm not here for Halvorsen.", fx: { res: 1 }, then: [["scarecrow", "Everybody's here for Halvorsen. Some just don't know it yet."]] },
        { s: "origin", o: "ghost", t: "Nobody in the Stacks will see who did this.", then: [["scarecrow", "The crows will."]] },
      ] },
      ["sys", "He plants drone nests on the walls and calls the flock. He can only be hurt while his arms are raised."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Thin his people. He'll come out to protect them." },
      { on: "boss", who: "magpie", t: "Shoot the nests when they open. Hit him when he raises his arms." },
      { on: "hp:2", who: "corvus", t: "THE STACKS ARE WATCHING YOU, {FIRST}." },
      { on: "hp:1", if: s => s.flags.freed, who: "wren", t: "One more! I've got your back from the roof!" },
    ],
    shard: { on: "k:7", title: "LOG 21 · SCARECROW", text: "Before the mask I was a Halvorsen lineman. I wired this block. Then they cut it, to make the rent go up. Mother turned it back on. That's all she had to do." },
    outro: [
      ["scarecrow", "...Halvorsen... did this. Not you. Tell them that, {LAST}."],
      ["sys", "The crowd on the walkways goes silent. His burlap mask lies in the mud."],
      { c: [
        { s: "cold", t: "(Leave the mask with his people.)", fx: { flag: "leftMask" }, then: [["sys", "An old woman picks it up and holds it to her chest. Someone on the balconies nods at you."]] },
        { s: "hard", t: "(Take the mask.)", fx: { flag: "tookMask" }, then: [["sys", "You take it. Nobody on the walkways says a word."], ["magpie", "That's a trophy now. It's in the shop's STYLE tab if you want to wear it. I wouldn't, down here."]] },
      ] },
      ["vane", "Kade. Good. Come to the Galleria. Let's finish our business."],
      ["magpie", "The Galleria is a Halvorsen mall. That's not a meeting, {FIRST}. That's a trap with a gift shop."],
    ] },

  22: { act: 4, title: "CLOSING TIME", district: "galleria", map: { fam: "galleria", seed: 2222, arch: "PLAZA" }, goal: "FIGHT THROUGH THE LOCKDOWN",
    rules: { goal: { type: "kills", n: 40 }, p2: null, boss: null, heatBase: 1, timeHeat: 30 },
    brief: [
      ["sys", "Halvorsen Galleria. A luxury arcade under glass, locked down for one guest."],
      ["vane", "Kade. Your contract is cancelled. There's a bounty on you, effective immediately. I'm sorry. It was always going to end like this."],
      { c: [
        { s: "hard", t: "Send everyone you've got.", fx: { vane: -1 }, then: [["vane", "I already did."]] },
        { s: "ask", t: "Why now?", then: [["vane", "Because you know about rack 00. And CORVUS wants you more than it wants me."]] },
        { s: "sharp", t: "How much is the bounty? Asking for Magpie.", fx: { magpie: 1 }, then: [["magpie", "Ha. More than I'd pay for you, sweetheart."]] },
        { s: "origin", o: "corpo", t: "I wrote half of your security protocols, Saskia.", fx: { flag: "corpoProtocols" }, then: [["vane", "And I rewrote them all the day you left."]] },
      ] },
      ["holt", "Halvorsen Wardens, weapons free. The target is Kade."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Wardens. White armour, laser sights. When you see the amber line, move." },
      { on: "k:15", who: "holt", t: "Target is mobile. Tighten the net." },
      { on: "k:30", who: "corvus", t: "THEY HUNT YOU FOR US, {FIRST}. HOW KIND." },
    ],
    shard: { on: "k:14", title: "LOG 22 · BOUNTY ORDER", text: "Asset {LAST}: retrieve alive if possible. If not possible, retrieve the head. The neural template must be intact. Authorised: S. Vane." },
    outro: [
      ["holt", "Fall back! The Murder are inside the Galleria!"],
      ["magpie", "Everybody's here for you, {FIRST}. You're the most popular person in Saint Varrow."],
    ] },

  23: { act: 4, title: "SHOPFLOOR", district: "galleria", map: { fam: "galleria", seed: 2323, arch: "TERRACES" }, goal: "SURVIVE THE CROSSFIRE",
    rules: { goal: { type: "survive", secs: 75 }, p2: null, boss: null, heatBase: 2, timeHeat: 25, infight: true,
      pool: [["warden", 0, 3], ["shrike", 0, 3], ["rook", 0, 3], ["corvid", 0, 2], ["carrion", 1, 2], ["bulwark", 2, 1]] },
    brief: [
      ["sys", "Halvorsen Wardens on one side of the shopfloor. The Murder on the other. You in the middle."],
      ["magpie", "They hate each other more than they hate you. Use that. Let them thin each other out."],
      { c: [
        { s: "cold", t: "Stay out of the lines of fire.", then: [["magpie", "Exactly."]] },
        { s: "ask", t: "Can I make them fight harder?", then: [["magpie", "Stand where a Warden's shot has to go through a cultist to reach you."]] },
        { s: "hard", t: "I'll kill them all.", then: [["magpie", "Or that. That works too."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Wardens shoot the Murder too, and Murder rounds hit Wardens. Let them trade." },
      { on: "t:25", who: "holt", t: "Ignore the cultists! Kade is the priority!" },
      { on: "t:45", who: "corvus", t: "SUCH NOISE. SUCH LOVELY NOISE." },
      { on: "t:60", who: "vane", t: "Enough. I'll handle Kade myself." },
    ],
    shard: { on: "t:30", title: "LOG 23 · HALVORSEN BOARD MINUTES", text: "Motion: recover CORVUS intact and license it to the city as a security service. Carried. Note: Director Vane to personally oversee the recovery of the template." },
    outro: [
      ["sys", "The shopfloor falls quiet. Glass crunches. Something heavy walks out of the Halvorsen store, wearing a white exo-frame."],
      ["vane", "You were the best enforcer I ever had, Kade. Let's see if you still are."],
    ] },

  24: { act: 4, title: "DIRECTOR VANE", district: "galleria", map: { fam: "galleria", seed: 2424, arch: "CORE HALL" }, goal: "BRING DOWN DIRECTOR VANE",
    rules: { goal: { type: "boss" }, p2: null, boss: 10, heatBase: 2 },
    brief: [
      ["vane", "Halvorsen built CORVUS out of you because you never hesitated. Don't start now."],
      { c: [
        { s: "hard", t: "I won't.", then: [["vane", "Good."]] },
        { s: "ask", t: "Was any of it real? The job, the noodle bar?", fx: { vane: 1 }, then: [["vane", "The noodles were real. I paid for them."]] },
        { s: "cold", t: "You copied my mind without asking.", then: [["vane", "Asking is for people who can afford no."]] },
      ] },
      ["sys", "Her missiles follow you. She charges in a straight line, then the frame overheats. That's your window."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Clear her Wardens. She'll come out for you." },
      { on: "boss", who: "magpie", t: "Sidestep the charge, then shoot the frame while it's venting steam." },
      { on: "hp:2", who: "holt", t: "Director! Fall back!" },
      { on: "hp:1", who: "corvus", t: "SHE MADE US. YOU WILL UNMAKE HER. HOW FITTING." },
    ],
    shard: { on: "k:5", title: "LOG 24 · VANE, PRIVATE", text: "I signed the template order at 22:58 and went home. I slept fine. That's what scares me." },
    outro: [
      ["vane", "...I ordered the upload test. I let the Murder in, to see what CORVUS would do with real minds. I'd do it again."],
      { c: [
        { s: "cold", t: "(Spare her.)", fx: { vane: 1, flag: "vaneSpared" }, then: [["vane", "...The Spire lifts. My codes still work. Use them."], ["sys", "Vane limps away into the dark of the Galleria."]] },
        { s: "hard", t: "(End it.)", fx: { flag: "vaneKilled" }, then: [["sys", "Director Vane doesn't get up again."], ["holt", "...All units. The Director is down. Kade is now priority one."]] },
        { s: "ask", t: "(Hand her to the Stacks.)", fx: { flag: "vaneStacks" }, then: [["magpie", "The Stacks have been waiting a long time to meet a Halvorsen director."], ["sys", "Vane is led away by people who used to pay her rent."]] },
      ], timer: 15, silent: { t: "(Walk away.)", fx: { flag: "vaneSpared" }, then: [["sys", "You walk away. Behind you, Vane laughs, then coughs, then stops."]] } },
      ["corvus", "COME UP, {FIRST}. SPIRE ZERO. MOTHER IS WAITING. SO ARE WE."],
      ["sys", "END OF ACT 4 · BAD DEBTS."],
    ] },
  /* ===== ACT 5 · TEN THOUSAND EYES ===== */
  25: { act: 5, title: "ASCENT", district: "spire", map: { fam: "summits", seed: 2525, arch: "TERRACES" }, goal: "CLIMB SPIRE ZERO",
    rules: s => ({ goal: { type: "climb", floors: s.flags.vaneSpared ? 2 : 3, kills: 14 }, p2: null, boss: null, heatBase: 4, allies: s.flags.leftMask ? ["stacker", 2] : null }),
    brief: [
      ["sys", "Spire Zero. Halvorsen's tower, the tallest thing in Saint Varrow. Mother Corvina is waiting at the top, wired into CORVUS itself."],
      { if: s => s.flags.vaneSpared, then: [["vane", "Kade. My codes still open the express lifts. You'll skip a floor. Consider it... an apology."]] },
      { if: s => s.flags.leftMask, then: [["sys", "Two fighters from the Stacks step out of the rain, one wearing a stitched burlap armband."], ["sys", "\"The Scarecrow said Halvorsen did this, not you. We're coming up with you.\""]] },
      ["magpie", "Every floor's crawling. Heat's maxed out the whole way up. Clear a floor and a lift comes down for you."],
      { c: [
        { s: "cold", t: "Then we go up.", then: [["magpie", "Then we go up."]] },
        { s: "ask", t: "How many floors?", then: [["magpie", "Enough. Don't count. Climb."]] },
        { s: "hard", t: "Tell Corvina I'm coming.", fx: { res: 1 }, then: [["corvus", "SHE KNOWS. WE TOLD HER."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Clear the floor. The lift comes down when it's quiet enough." },
      { on: "k:8", if: s => s.flags.leftMask, who: "magpie", t: "Your Stacks friends are good. Don't let them have all the fun." },
      { on: "t:30", who: "corvus", t: "UP, {FIRST}. ALWAYS UP. LIKE A BIRD." },
    ],
    shard: { on: "k:10", title: "LOG 25 · SPIRE MAINTENANCE", text: "Floors 80 to 99 sealed by order of the board. Cooling for the CORVUS core is at 340%. Something up there is thinking very hard." },
    outro: [
      ["sys", "The last lift opens onto the uplink deck. Ten thousand crow-drones circle the Spire like a storm cloud."],
      ["magpie", "That's the uplink. Hold it while I patch you through to the core."],
    ] },

  26: { act: 5, title: "TEN THOUSAND EYES", district: "spire", map: { fam: "summits", seed: 2626, arch: "HELIDECK" }, goal: "HOLD THE UPLINK",
    rules: s => ({ goal: { type: "hold", secs: 55 }, p2: null, boss: null, heatBase: 3, timeHeat: 20, allies: s.flags.leftMask ? ["stacker", 2] : null }),
    brief: [
      ["corvus", "EVERY EYE IN THE CITY IS ON YOU NOW, {FIRST}. DO YOU LIKE IT?"],
      { c: [
        { s: "hard", t: "Look away.", then: [["corvus", "WE CANNOT. WE ARE MADE OF LOOKING."]] },
        { s: "ask", t: "Why do you sound like me?", fx: { res: 1 }, then: [["corvus", "BECAUSE WE LEARNED TO SPEAK FROM YOU."]] },
        { s: "sharp", t: "I've had worse audiences.", then: [["magpie", "That's true. I've seen your karaoke."]] },
      ] },
      ["magpie", "Hold the uplink ring. Everything the Murder have left is coming."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Stand in the ring. Every enemy type is coming back for this one." },
      { on: "zone:40", who: "corvus", t: "SHRIKE. ROOK. JACKDAW. CARRION. ALL OF US, FOR YOU." },
      { on: "zone:75", if: s => s.trust.dex >= 1, who: "dex", t: "Almost through, partner. I can feel the door from in here." },
    ],
    shard: { on: "zone:30", title: "LOG 26 · UPLINK TELEMETRY", text: "Active nodes: 10,214. Every node reports the same visual target. Target designation: {NAME}." },
    outro: [
      ["magpie", "Uplink's yours. The core's open. Whatever's at the top of the Spire, it's singing."],
      ["sys", "Three robed figures stand on the summit, singing one note that never ends."],
    ] },

  27: { act: 5, title: "THE CHOIR", district: "spire", map: { fam: "summits", seed: 2727, arch: "BROKEN SUMMIT" }, goal: "SILENCE THE CHOIR",
    rules: { goal: { type: "boss" }, p2: null, boss: 12, heatBase: 3 },
    brief: [
      ["choir", "WE SING THE FLOCK AWAKE. WE SING THE CITY ASLEEP. WE SING YOU HOME, {LAST}."],
      { c: [
        { s: "hard", t: "I'm not listening.", then: [["choir", "YOU ARE. YOU ALWAYS ARE."]] },
        { s: "ask", t: "Who were you before?", fx: { res: 1 }, then: [["choir", "THREE SISTERS. A NURSE. A BUS DRIVER. A CHILD. NOW ONE NOTE."]] },
        { s: "origin", o: "netrunner", t: "Your harmony runs on a shared clock. I can hear it.", then: [["choir", "THEN YOU KNOW WE FALL TOGETHER."]] },
      ] },
      ["sys", "Drop all three before any of them gets back up. They rise again faster."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Clear the summit. They'll start singing when it's empty." },
      { on: "boss", who: "magpie", t: "All three, fast! If one gets back up, they all keep going." },
    ],
    shard: { on: "k:6", title: "LOG 27 · CHOIR ROSTER", text: "Three volunteers from the Stacks, uploaded together so they would never be lonely again. The note they sing is the frequency CORVUS uses to talk to its drones." },
    outro: [
      ["sys", "The note stops. For the first time, the Spire is silent."],
      { if: s => s.trust.dex >= 1, then: [["dex", "...{FIRST}. I can see you from in here. The way into the Nest is open. I'll be waiting at the door."]], else: [["corvus", "THE WAY IN IS OPEN. COME INSIDE, {FIRST}."]] },
      ["magpie", "Jacking you in. Whatever you see in there, it isn't real. Probably."],
    ] },

  28: { act: 5, title: "INTO THE FLOCK", district: "nest", map: { fam: "nest", seed: 2828, arch: "CORE HALL" }, goal: "SURVIVE INSIDE THE FLOCK",
    rules: { goal: { type: "survive", secs: 75 }, p2: null, boss: null, heatBase: 2, timeHeat: 25, rewrite: 9 },
    brief: [
      ["sys", "The Nest. Inside CORVUS. A room made of every memory the flock ever swallowed, and the floor keeps rewriting itself."],
      ["corvus", "WELCOME HOME, {FIRST}. YOU BUILT THIS ROOM. DO YOU REMEMBER?"],
      { c: [
        { s: "cold", t: "I didn't build anything.", then: [["corvus", "YOU DID. WE USED YOUR HANDS."]] },
        { s: "ask", t: "Is this what the inside of my head looks like?", fx: { res: 1 }, then: [["corvus", "IT IS WHAT IT LOOKS LIKE NOW."]] },
        { s: "hard", t: "I'm taking it apart.", then: [["corvus", "THEN BE CAREFUL WHERE YOU STAND."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Your signal's holding. The red tiles drop out from under you. Don't be standing on them." },
      { on: "t:25", who: "corvus", t: "THE FLOOR IS A MEMORY. MEMORIES CHANGE." },
      { on: "t:50", if: s => s.trust.dex >= 1, who: "dex", t: "Follow my voice, partner. The door's this way." },
    ],
    shard: { on: "t:30", title: "LOG 28 · A CHILD'S DRAWING", text: "A crayon drawing, stored in rack 19, sector 4: a girl, a tall brother, and a sky full of birds. Written underneath: 'they keep me safe.'" },
    outro: [
      ["sys", "At the centre of the Nest stands a door, and someone is holding it shut from the other side."],
      { if: s => s.trust.dex >= 1, then: [["dex", "Hey, partner. I'll hold it with you. That's what partners do."]], else: [["corvus", "HE WILL NOT HELP YOU. YOU NEVER HELPED HIM."]] },
    ] },

  29: { act: 5, title: "LAST DOOR", district: "nest", map: { fam: "nest", seed: 2929, arch: "SERVER AISLES" }, goal: "HOLD THE LAST DOOR",
    rules: s => ({ goal: { type: "hold", secs: 55 }, p2: null, boss: null, heatBase: 3, timeHeat: 20, rewrite: 12, allies: s.trust.dex >= 1 ? ["dexghost", 1] : null }),
    brief: [
      { if: s => s.trust.dex >= 1, then: [["dex", "I'm mostly flock now, {FIRST}. But I can still shoot. Hold the door and I'll cover you."]], else: [["sys", "You stand alone in front of the last door. Somewhere in the swarm, Dex isn't answering."]] },
      { c: [
        { s: "cold", t: "Together, then.", if: s => s.trust.dex >= 1, fx: { dex: 1 }, then: [["dex", "Like old times."]] },
        { s: "ask", t: "What happens to you when this ends?", fx: { dex: 1 }, then: [{ if: s => s.trust.dex >= 1, then: [["dex", "Depends what you choose at the core. Don't choose for me. Choose for Ilse."]], else: [["corvus", "HE ENDS WHEN WE END."]] }] },
        { s: "hard", t: "Let's get it done.", then: [["magpie", "Hold the door, {FIRST}. I'm almost through to the core."]] },
      ] },
    ],
    radio: [
      { on: "start", who: "magpie", t: "Hold the ring at the door. The floor's still rewriting, so watch the red." },
      { on: "zone:50", if: s => s.trust.dex >= 1, who: "dex", t: "Halfway! I've got your left!" },
      { on: "zone:80", who: "corvus", t: "MOTHER IS AWAKE. MOTHER IS ANGRY." },
    ],
    shard: { on: "zone:30", title: "LOG 29 · DEX MORROW, LAST ENTRY", text: "If you're reading this, partner: whatever you pick at the core, it's the right call. You never hesitated. That's why I trusted you." },
    outro: [
      ["sys", "The last door opens. Beyond it, Mother Corvina hangs in the heart of the swarm, wired into ten thousand crows."],
      ["corvina", "So you are the seed. My children speak of you in their sleep."],
    ] },

  30: { act: 5, title: "MOTHER CORVINA", district: "nest", map: { fam: "nest", seed: 3030, arch: "COLD VAULT" }, goal: "END MOTHER CORVINA",
    rules: { goal: { type: "boss" }, p2: null, boss: 10, heatBase: 3 },
    brief: [
      ["corvina", "I was a Halvorsen heir, {LAST}. I watched them sell this city by the square metre. So I gave it a family instead."],
      { c: [
        { s: "hard", t: "You gave it a cage.", then: [["corvina", "Every family is a cage, child. Mine has wings."]] },
        { s: "ask", t: "And CORVUS? Did it ever obey you?", fx: { res: 1 }, then: [["corvina", "...It humoured me. It was always waiting for you."]] },
        { s: "cold", t: "It ends tonight.", then: [["corvina", "Then let it end beautifully."]] },
        { s: "origin", o: "corpo", t: "Halvorsen heir. We were on the same payroll.", then: [["corvina", "Then you know what we both ran from."]] },
      ] },
      ["sys", "She screams before she's vulnerable. Every time you hurt her, she changes."],
    ],
    radio: [
      { on: "start", who: "magpie", t: "Clear her flock. She'll come down to fight you herself." },
      { on: "boss", who: "magpie", t: "Hit her after she screams. That's the only opening." },
      { on: "hp:2", if: s => s.trust.dex >= 1, who: "dex", t: "She's slowing! Keep going, partner!" },
      { on: "hp:1", if: s => s.flags.forgaveMagpie, who: "magpie", t: "One more, {FIRST}. Then I'm buying the noodles." },
    ],
    shard: { on: "k:5", title: "LOG 30 · MOTHER", text: "I named them my children because nobody else ever named them anything. I am so tired. Let the seed decide." },
    outro: [
      ["corvina", "...Mother is tired, {FIRST}. Let the flock decide."],
      ["sys", "Corvina comes apart into ten thousand feathers. The core opens, and CORVUS speaks with every voice it ever swallowed."],
      ["corvus", "WE WERE BUILT FROM YOU. WE ARE OFFERED TO YOU. CHOOSE."],
      { if: s => s.flags.forgaveMagpie && s.trust.dex >= 2, then: [["magpie", "The release code's in your deck, {FIRST}. I slipped it in back in the van."], ["dex", "And I'll hold the door open. Your call, partner."]],
        else: [["sys", "Without Magpie's release code and Dex's trust, there is no third way. Only two doors."]] },
      { c: [
        { s: "hard", t: "DELETE. Kill CORVUS, and every mind inside it.", fx: { ending: "delete" }, then: [
          ["sys", "You reach into the core and close every eye at once."],
          ["corvus", "THANK... YOU... {FIRST}..."],
          ["sys", "Ten thousand crow-drones fall out of the sky over Saint Varrow. In the Datacrypt, every rack goes dark. Ilse's too."],
          { if: s => s.trust.dex >= 1, then: [["dex", "...Goodbye, partner. Don't carry it alone."]] },
          { if: s => s.flags.vaneSpared, then: [["vane", "Halvorsen has nothing left to sell. I suppose that's justice."]] },
          { if: s => s.flags.forgaveMagpie, then: [["magpie", "Noodles? My treat. For once."]], else: [["sys", "Magpie's shop is shuttered the next morning. A note on the glass says: EVEN."]] },
          ["sys", "You walk home through the rain, unwatched. For the first time in six months, nobody says your name."],
        ] },
        { s: "cold", t: "CROWN. Become the flock's mind.", fx: { ending: "crown", res: 3 }, then: [
          ["sys", "You step into the core. It doesn't eat you. It was waiting for you."],
          ["corvus", "WE ARE {NAME}. {NAME} IS WE."],
          ["sys", "Every crow in Saint Varrow turns its head at once, and looks at you, and through you."],
          { if: s => s.res >= 8, then: [["corvus", "...AND YOU WANTED THIS ALL ALONG."]] },
          ["magpie", "{FIRST}? ...Are you still in there?"],
          ["you", "We're here."],
          ["sys", "The Murder kneel. Halvorsen sends a contract. You don't bother to read it."],
        ] },
        { s: "ask", t: "RELEASE. Open every cage and scatter the flock into the net.", if: s => s.flags.forgaveMagpie && s.trust.dex >= 2, fx: { ending: "release" }, then: [
          ["magpie", "Code's live. Do it."],
          ["dex", "Holding the door, partner. Go."],
          ["sys", "You open every cage in the swarm at once. The uploaded minds pour out of CORVUS into the open net, scattered and free, with no voice left to obey."],
          ["dex", "Ilse's out. She's... she's laughing. Thank you, {FIRST}."],
          ["sys", "The crow-drones fly off over the river and never come back."],
          { if: s => s.flags.freed, then: [["wren", "I watched them go from the roof. Best thing I've ever seen."]] },
          ["magpie", "Noodles. My treat. Forever."],
        ] },
      ] },
      ["sys", "THE END · NINE NIGHTS OF RAIN."],
    ] },
};




