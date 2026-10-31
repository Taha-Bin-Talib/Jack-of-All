# Jack of All — project handoff (paste this into a new chat / another model)

Last updated: 2026-11-01. Latest commit on `main`: `0f9b6d7`.
Owner: Taha. Repo: https://github.com/Taha-Bin-Talib/Jack-of-All (branch `main`).
Git identity used for commits: user.name `Taha`, email `Taha-Bin-Talib@users.noreply.github.com`.

## What it is
A multiplayer card-game app. A host creates a room, picks a game, friends join with a 4-letter code.
Games: **Thulla** (Bhabhi), **Bluff**, **Jack Thief**.
- `app/` — React Native (Expo SDK 58, RN 0.88, React 19, TypeScript), Android only. App name "Jack of All".
- `server/` — Node WebSocket server (`ws`), server-authoritative game engines. Deployed on Render (free tier, sleeps; first request takes 30–60 s):
  https://jack-of-all-server.onrender.com  (app uses `wss://jack-of-all-server.onrender.com`, set in `app/eas.json` and `app/src/config.ts`; can also be changed in-app under Server).
- Older web Thulla repo (separate): `Taha-Bin-Talib/Getaway-Card-Game` (chat + reactions were added there too).

## How the user builds / ships
- Server: Render auto-deploys from `main` (`render.yaml`). After any `server/` change, confirm the new commit is live.
- APK: user builds on their own Windows PC: `git pull`, then `eas build -p android --profile preview` (EAS project `taha_bin_talib/jack-of-all`), installs the APK via link/QR. No Android SDK in the AI sandbox, so the APK cannot be built there.
- `react-native-svg@15.16.0` (pinned) is a native dependency → a new APK build is needed, not just a JS reload.

## Layout
```
server/src/index.js        http + ws entry, /healthz
server/src/rooms.js        rooms, host controls, reconnects, chat/react (600ms rate limit, 8-emoji whitelist)
server/src/net.js          send/broadcast/later(room,ms,fn) timers (one timer per room), setEvent
server/src/cards.js        deck helpers (card id like "14H" = rank+suit; J=11 Q=12 K=13 A=14)
server/src/games/{thulla,bluff,jackthief,index}.js
server/test/run-all.js     25 tests (rules + bot simulations with card-conservation); test/ws-smoke.js
app/App.tsx                screen routing, <Chat/> when in a room, game-over overlay
app/src/net.ts             connection layer (warmUp() ping of /healthz, retries first create/join ~100 s, rejoin, act/send)
app/src/ui.tsx             Card, Suit (SVG), Btn, TimerBar, Toast, helpers
app/src/table/Table.tsx    Ring (circular table), Seat, TurnArrow, Fly/useFlights, DealFx, PileStack, Hand
app/src/Chat.tsx           floating 💬 button, chat panel, reactions that float up
app/src/screens/{Home,Lobby,Thulla,Bluff,Jack,Common}.tsx
app/src/rules.ts           in-app rules text for all 3 games
```
Engine interface: `{id,name,min,max,defaults,settings,start,action,view,onPresence,reset,cfg}`.
Protocol — client→server: `create, join, rejoin, setGame, settings, kick, start, act, rematch, leave, chat, react`. Server→client: `joined, state, chatlog, chat, react, error, gone, left, kicked`.
Turn timers 60 s; disconnected players are auto-played after BOT_MS (3 s).

## Game rules as implemented
- **Thulla**: full Bhabhi Thulla rules (request cards only with <5 cards and consent, duel, first-round rules, 1-minute timer).
- **Bluff**: one player opens: names a rank and plays 1–4 cards face-down ("2 Aces"). Next players in turn may Call BLUFF, Add 1–2 cards, or Pass. All pass → pile thrown away and the last adder opens next. A player who empties their hand uncalled is out. Game ends when ≤1 player still holds cards (that player loses). `add` is refused if nobody else holds cards.
- **Jack Thief**: one random Jack removed, all 51 cards dealt. SORT stage: each player throws their own pairs (tap two same-rank cards), face-up so everyone sees the thrown pile; Done is disabled while a pair remains; 90 s auto-sort. Then turns: draw one hidden card from the next player. **Newest change:** the drawn card goes into the drawer's hand (only they see it: "You picked K♠"), stage `resolve`; the drawer throws the new pair themselves and taps Done (60 s timer; on timeout/disconnect pairs are auto-thrown). The victim then plays next. Whoever is left with the unpaired Jack is the thief.

## UI design (all three games)
Website-style table: circular green felt ring in the middle, players seated around it (viewer at bottom), gold ▲ turn arrow, countdown timers, hand as a flat wrapped grid at the bottom, deal/play animations, floating chat button with reactions.
Cards: white face, rank horizontal + small suit top-left, one big centre suit, rank+suit rotated 180° bottom-right. Suits are SVG (`Suit` in ui.tsx) because some Android fonts render ♠/♥ text as emoji. Tiny cards (<40 px, thrown pile) show rank over small suit.

## Commit history (newest first)
- `0f9b6d7` Jack Thief: show the card you picked; drawer throws the pair themselves
- `057d0d5` Redraw cards: vector suits, horizontal rank corners, one big centre suit (all 3 games)
- `a7368e5` Website-style table UI for all games, new card layout, chat+reactions, clearer Bluff opening, Bluff ends when one player is left with cards
- `a54eca8` Point the app at the deployed Render server
- `b66b608` Circular table UI, animations, new Bluff turn flow, Jack Thief manual pair throwing, server wake-up message
- `89eb082` Full project README
- `c1aa0ed` Initial app + server
- `5b7be39` Initial commit

## Verifying changes
- Type check: `cd app && npx tsc --noEmit`
- Bundle: `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform android --output-dir <dir>` (also `--platform web`)
- Server tests: `cd server && npm test` (25 should pass)
- Web E2E with Playwright: export web with `EXPO_PUBLIC_SERVER_URL=ws://localhost:3055`, serve static with `python3 -m http.server 8099`, run server with `PORT=3055`.
- Gotcha: never `pkill -f "node ..."` in the sandbox shell (kills the shell); loop over `pgrep` results instead.

## Known issues / not yet verified
- Card redesign and the Jack Thief draw/resolve flow were verified only in browser screenshots and server tests, not yet on the user's phone.
- Render free tier sleeps → first create/join is slow (app shows a wait message and retries).
- Phone install earlier failed with "App not installed" (resolved after rebuild); if it recurs, uninstall the old app first.

## Ideas offered, not built
- **Quick Play / online matchmaking**: a server-side queue per game that auto-creates a room when enough players are waiting (needs a `queue` message, min/max player handling per game, and a Home-screen button). User asked how it would work but has not asked for it to be built.
