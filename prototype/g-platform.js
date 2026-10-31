/* Platform layer: Steam when the game runs inside the Steam (Electron) build, nothing in a plain browser.
   The Steam build's preload exposes window.steamBridge (see Steam Build/preload.js; "steam" is already a drawing function in scenes.js).
   Everything here fails quietly, so a missing or offline Steam client never stops the game. */
"use strict";
// Steam API name for an achievement id. These are what you enter on the Steamworks partner site,
// so never rename an achievement id once the game has shipped.
const steamName = id => "MURDER_" + id.toUpperCase();
// Leaderboards. Solo Arcade runs post score, kills and how far they got (the district number); the Daily Challenge has
// one board per day; Boss Rush is a time in seconds (lowest wins). Steam creates each board the first time a score is posted.
const BOARDS = [
  { id: "score", name: "SCORE", steam: "MURDER_ARCADE_SCORE", fmt: v => String(v).padStart(7, "0") },
  { id: "kills", name: "KILLS", steam: "MURDER_ARCADE_KILLS", fmt: v => v + " KILLS" },
  { id: "depth", name: "FURTHEST", steam: "MURDER_ARCADE_DEPTH", fmt: v => "DISTRICT " + v },
  { id: "daily", name: "TODAY'S DAILY", steam: () => "MURDER_DAILY_" + dailyKey().replace(/-/g, ""), fmt: v => String(v).padStart(7, "0") },
  { id: "rush", name: "BOSS RUSH", steam: "MURDER_BOSS_RUSH", fmt: v => fmtTime(v), low: true },
];
const boardSteamName = B => typeof B.steam === "function" ? B.steam() : B.steam;
const PLATFORM = (() => {
  const S = () => (typeof window !== "undefined" && window.steamBridge && window.steamBridge.available) ? window.steamBridge : null;
  const localKey = id => id === "daily" ? "daily_" + dailyKey() : id;
  // Local bests (always kept): what the browser version shows, and what the Steam version falls back to offline.
  const localPost = (id, v, details) => { const L = SAVE.boards || (SAVE.boards = {}), B = BOARDS.find(b => b.id === id), k = localKey(id);
    L[k] = (L[k] || []).concat([{ v, d: details, t: Date.now() }]).sort((a, b) => B.low ? a.v - b.v : b.v - a.v).slice(0, 10); persist(); };
  return {
    get name() { return S() ? "steam" : "web"; },
    me() { const s = S(); return s && s.me ? s.me : { steamId: "", name: SAVE.char.name }; },
    unlock(id) { const s = S(); if (!s) return; try { s.activate(steamName(id)); } catch (e) {} },
    // On start-up, push every achievement already earned in this save (earned in the browser, offline, or before Steam was wired in).
    sync(ids) { const s = S(); if (!s) return; ids.forEach(id => { try { s.activate(steamName(id)); } catch (e) {} }); },
    post(id, value, details) { if (!(value > 0)) return; localPost(id, value, details); const s = S(), B = BOARDS.find(b => b.id === id); if (s && B) { try { s.lbSubmit(boardSteamName(B), value, details || []); } catch (e) {} } },
    // Rows for a board: from Steam (scope "global", "friends" or "me") in the Steam build, your own best runs otherwise.
    async rows(id, scope) { const s = S(), B = BOARDS.find(b => b.id === id), local = () => ((SAVE.boards || {})[localKey(id)] || []).map((r, i) => ({ rank: i + 1, score: r.v, name: SAVE.char.name, me: true }));
      if (!s) return { source: "local", rows: local() };
      try { const r = await s.lbGet(boardSteamName(B), scope); if (r && r.ok) return { source: "steam", rows: r.rows }; } catch (e) {}
      return { source: "offline", rows: local() }; },
  };
})();
