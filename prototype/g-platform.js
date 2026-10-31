/* Platform layer: Steam when the game runs inside the Steam (Electron) build, nothing in a plain browser.
   The Steam build's preload exposes window.steamBridge (see steam/preload.js; "steam" is already a drawing function in scenes.js). Everything here fails quietly,
   so a missing or offline Steam client never stops the game. */
"use strict";
// Steam API name for an achievement id. These are what you enter on the Steamworks partner site,
// so never rename an achievement id once the game has shipped.
const steamName = id => "MURDER_" + id.toUpperCase();
const PLATFORM = (() => {
  const S = () => (typeof window !== "undefined" && window.steamBridge && window.steamBridge.available) ? window.steamBridge : null;
  return {
    get name() { return S() ? "steam" : "web"; },
    unlock(id) { const s = S(); if (!s) return; try { s.activate(steamName(id)); } catch (e) {} },
    // On start-up, push every achievement already earned in this save (earned in the browser, offline, or before Steam was wired in).
    sync(ids) { const s = S(); if (!s) return; ids.forEach(id => { try { s.activate(steamName(id)); } catch (e) {} }); },
  };
})();
