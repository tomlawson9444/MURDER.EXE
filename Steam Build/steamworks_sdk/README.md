# Steamworks SDK redistributables (not in git)

The Steam features (achievements, leaderboards, co-op lobbies and invites) talk to Steam through
[steamworks-ffi-node](https://www.npmjs.com/package/steamworks-ffi-node), which loads Valve's Steam API library at run time.
Valve's licence doesn't allow those files in a public repo, so each developer (and CI) adds them here:

1. Download the Steamworks SDK (1.64 or newer) from https://partner.steamgames.com/downloads/list
2. Copy its `redistributable_bin` folder into this folder, so you have
   `Steam Build/steamworks_sdk/redistributable_bin/win64/steam_api64.dll`,
   `.../linux64/libsteam_api.so` and `.../osx/libsteam_api.dylib`.

`redistributable_bin/` is ignored by git. Without it the game still runs; Steam features just switch off.
For GitHub Actions, see "Steam SDK in CI" in `../README.md`.
