// Steam for MURDER.EXE (Electron main process), through steamworks-ffi-node (Steamworks SDK 1.64 via FFI):
// achievements, leaderboards, friends, lobbies with invites, and peer-to-peer networking for co-op.
// Needs Valve's SDK redistributables in steamworks_sdk/redistributable_bin (see README). Without them, or without a
// running Steam client, every call here is a quiet no-op and the game plays on without Steam.
const path = require("path"), fs = require("fs");

const S = { sdk: null, mod: null, me: null, boards: new Map(), lobby: null, listen: null, conns: new Map(), send: null };
const idOf = v => { const m = String(v || "").match(/(\d{15,})/); return m ? m[1] : ""; }; // Steam IDs arrive as "7656…" or "steamid:7656…"

function init({ app, appId, sdkDir, release }) {
  try {
    const mod = S.mod = require("steamworks-ffi-node"), Steam = mod.SteamworksSDK || mod.default, sdk = Steam.getInstance();
    sdk.setSdkPath(sdkDir);
    // Release builds: someone who starts the .exe directly gets relaunched through Steam (skipped for the 480 test app).
    if (release && appId && appId !== 480 && sdk.restartAppIfNecessary(appId)) { app.quit(); return false; }
    if (!sdk.init({ appId: appId || 480 })) throw new Error("SteamAPI_Init failed (is Steam running?)");
    S.sdk = sdk; S.me = { steamId: idOf(sdk.getStatus().steamId), name: safe(() => sdk.friends.getPersonaName(), "PLAYER") };
    setInterval(() => { try { sdk.runCallbacks(); } catch (e) {} }, 50);
    console.log("[steam] ready for", S.me.name);
    return true;
  } catch (e) { S.sdk = null; console.warn("[steam] not available (" + e.message + "); the game plays on without Steam"); return false; }
}
const safe = (fn, fallback) => { try { const v = fn(); return v == null ? fallback : v; } catch (e) { return fallback; } };
const ready = () => !!S.sdk;

/* ---- Achievements ---- */
async function unlock(name) {
  if (!ready() || !/^MURDER_[A-Z0-9_]+$/.test(name)) return false;
  try { if (await S.sdk.achievements.isAchievementUnlocked(name)) return true; return await S.sdk.achievements.unlockAchievement(name); } catch (e) { return false; }
}

/* ---- Leaderboards ---- */
// Boards are created on first use. Names start MURDER_; Boss Rush is a time (lowest wins), everything else highest wins.
async function board(name) {
  if (S.boards.has(name)) return S.boards.get(name);
  const L = S.mod, asc = /BOSS_RUSH/.test(name);
  const info = await S.sdk.leaderboards.findOrCreateLeaderboard(name, asc ? L.LeaderboardSortMethod.Ascending : L.LeaderboardSortMethod.Descending, asc ? L.LeaderboardDisplayType.TimeSeconds : L.LeaderboardDisplayType.Numeric);
  if (info && info.handle) S.boards.set(name, info.handle); return info ? info.handle : null;
}
async function submit(name, score, details) {
  if (!ready() || !/^MURDER_[A-Z0-9_]+$/.test(name)) return null;
  try { const h = await board(name); if (!h) return null; const r = await S.sdk.leaderboards.uploadScore(h, Math.round(score), S.mod.LeaderboardUploadScoreMethod.KeepBest, (details || []).map(n => Math.round(n)).slice(0, 8)); return r ? { ok: true, rank: r.globalRankNew || r.globalRank || 0 } : null; }
  catch (e) { return null; }
}
// scope: "global" (top 10), "friends", or "me" (the 10 around you). Returns rows with Steam persona names.
async function top(name, scope) {
  if (!ready()) return { ok: false, rows: [] };
  try {
    const h = await board(name); if (!h) return { ok: false, rows: [] }; const R = S.mod.LeaderboardDataRequest;
    const rows = scope === "friends" ? await S.sdk.leaderboards.downloadLeaderboardEntries(h, R.Friends, 0, 0)
      : scope === "me" ? await S.sdk.leaderboards.downloadLeaderboardEntries(h, R.GlobalAroundUser, -4, 5) : await S.sdk.leaderboards.downloadLeaderboardEntries(h, R.Global, 1, 10);
    return { ok: true, rows: (rows || []).slice(0, 10).map(r => { const id = idOf(r.steamId); return { rank: r.globalRank, score: r.score, details: r.details, me: id === S.me.steamId, name: personaOf(id) }; }) };
  } catch (e) { return { ok: false, rows: [] }; }
}
const personaOf = id => { if (S.me && id === S.me.steamId) return S.me.name; const n = safe(() => S.sdk.friends.getFriendPersonaName(id), ""); return n && n !== "[unknown]" ? n : "PLAYER " + id.slice(-4); };

/* ---- Co-op: lobbies and invites ---- */
// The host makes a friends-only lobby (max 4) and listens for peer-to-peer connections; friends join from an invite,
// the Steam friends list, or the in-game friend list, then connect straight to the host's Steam ID.
async function host() {
  if (!ready()) return { ok: false, error: "Steam isn't running" };
  try {
    leave(); const r = await S.sdk.matchmaking.createLobby(S.mod.ELobbyType.FriendsOnly, 4); if (!r || !r.success) return { ok: false, error: (r && r.error) || "could not create a lobby" };
    S.lobby = { id: r.lobbyId, host: S.me.steamId }; S.sdk.matchmaking.setLobbyData(r.lobbyId, "game", "murder.exe"); S.sdk.matchmaking.setLobbyData(r.lobbyId, "host", S.me.steamId);
    safe(() => S.sdk.richPresence.setRichPresence("connect", "+connect_lobby " + r.lobbyId));
    S.listen = S.sdk.networkingSockets.createListenSocketP2P(0); watchConnections();
    return { ok: true, lobbyId: r.lobbyId };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function join(lobbyId) {
  if (!ready()) return { ok: false, error: "Steam isn't running" };
  try {
    leave(); S.retries = 0; S.everConnected = false; const r = await S.sdk.matchmaking.joinLobby(String(lobbyId)); if (!r || !r.success) return { ok: false, error: "could not join that lobby" };
    const hostId = idOf(S.sdk.matchmaking.getLobbyData(r.lobbyId, "host") || S.sdk.matchmaking.getLobbyOwner(r.lobbyId));
    S.lobby = { id: r.lobbyId, host: hostId }; watchConnections();
    const c = S.sdk.networkingSockets.connectP2P(hostId, 0); S.conns.set(hostId, c);
    return { ok: true, lobbyId: r.lobbyId, host: hostId };
  } catch (e) { return { ok: false, error: e.message }; }
}
function leave() {
  if (!ready()) return;
  for (const c of S.conns.values()) safe(() => S.sdk.networkingSockets.closeConnection(c, 0, "bye", false)); S.conns.clear();
  if (S.listen != null) { safe(() => S.sdk.networkingSockets.closeListenSocket(S.listen)); S.listen = null; }
  if (S.lobby) { safe(() => S.sdk.matchmaking.leaveLobby(S.lobby.id)); S.lobby = null; } safe(() => S.sdk.richPresence.clearRichPresence());
}
let watching = false;
function watchConnections() {
  if (watching) return; watching = true; const N = S.mod;
  S.sdk.networkingSockets.onConnectionStateChange(ch => {
    const id = idOf(ch.info && ch.info.identityRemote), st = ch.newState, E = N.ESteamNetworkingConnectionState;
    if (st === E.Connecting && S.listen != null) { if (S.lobby && memberIds().includes(id)) S.sdk.networkingSockets.acceptConnection(ch.connection); else S.sdk.networkingSockets.closeConnection(ch.connection, 0, "not in lobby", false); }
    if (st === E.Connected) { S.conns.set(id, ch.connection); S.everConnected = true; }
    if (st === E.ClosedByPeer || st === E.ProblemDetectedLocally) { S.conns.delete(id); safe(() => S.sdk.networkingSockets.closeConnection(ch.connection, 0, "", false));
      // A friend who has only just joined the lobby can reach the host before Steam tells the host they're a member: try again.
      if (S.lobby && S.listen == null && id === S.lobby.host && !S.everConnected && (S.retries = (S.retries || 0) + 1) <= 5) { setTimeout(() => { if (S.lobby && S.lobby.host === id) S.conns.set(id, S.sdk.networkingSockets.connectP2P(id, 0)); }, 1000); return; }
      if (S.onPeer) S.onPeer({ left: id }); }
    else if (st === E.Connected && S.onPeer) S.onPeer({ joined: id, name: personaOf(id) });
  });
}
const memberIds = () => S.lobby ? safe(() => S.sdk.matchmaking.getLobbyMembers(S.lobby.id), []).map(idOf) : [];
function lobbyState() { if (!S.lobby) return null; return { id: S.lobby.id, host: S.lobby.host, me: S.me.steamId, members: memberIds().map(id => ({ id, name: personaOf(id), connected: id === S.me.steamId || S.conns.has(id) })) }; }
function friends() { if (!ready()) return []; return safe(() => S.sdk.friends.getAllFriends(), []).filter(f => f.personaState > 0).slice(0, 60).map(f => ({ id: idOf(f.steamId), name: f.personaName, online: f.personaState > 0 })); }
function invite(friendId) { if (!ready() || !S.lobby) return false; return safe(() => S.sdk.matchmaking.inviteUserToLobby(S.lobby.id, String(friendId)), false); }
function inviteOverlay() { if (!ready() || !S.lobby) return false; safe(() => S.sdk.overlay.activateGameOverlayInviteDialog(S.lobby.id)); return true; }
// Invites accepted from Steam (while running), or the lobby passed on the command line when Steam launches the game from one.
function onJoinRequest(fn) { if (!ready()) return; safe(() => S.sdk.matchmaking.onGameLobbyJoinRequested(ev => fn(String(ev.lobbyId)))); const cl = safe(() => S.sdk.matchmaking.getConnectLobbyIdFromCommandLine(), null); if (cl) fn(String(cl)); }

/* ---- Messages ---- */
// to: a Steam ID, or "*" for everyone connected. Reliable for events, unreliable for the fast world updates.
function sendTo(to, text, reliable) {
  if (!ready()) return; const ns = S.sdk.networkingSockets;
  for (const [id, c] of S.conns) if (to === "*" || to === id) safe(() => reliable ? ns.sendReliable(c, text) : ns.sendUnreliable(c, text));
}
function poll() { if (!ready() || !S.conns.size) return []; const out = [];
  for (const [id, c] of S.conns) for (const m of safe(() => S.sdk.networkingSockets.receiveMessages(c, 64), [])) out.push({ from: id, text: m.data.toString("utf8") });
  return out; }

module.exports = { init, ready, me: () => S.me, unlock, submit, top, host, join, leave, lobbyState, friends, invite, inviteOverlay, onJoinRequest, sendTo, poll, onPeer: fn => { S.onPeer = fn; } };
