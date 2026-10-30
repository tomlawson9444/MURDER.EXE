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
  sys: { name: "SYSTEM", col: COL.dim },
};

const ACTS = [{ n: 1, name: "WET FEATHERS", chapters: [1, 2, 3, 4, 5, 6] }, { n: 2, name: "THE ROOST", chapters: [7, 8, 9, 10, 11, 12] }];

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
        { s: "origin", o: "corpo", t: "I ran security on that rig program. Its thrusters overheat on landing.", fx: { vane: 1 }, then: [["vane", "Then you know where to shoot."]] },
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
};

