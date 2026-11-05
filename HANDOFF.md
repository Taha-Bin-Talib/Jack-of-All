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
app/src/engine/           AUTO-COPY of server/src (cards, net, rooms, games) + a crypto shim, made by `node app/scripts/sync-engine.js`. Re-run it after ANY change in server/src, then commit both.
app/src/net.ts             connection layer (also hosts offline mode: playOffline() runs the engine in-app with 3 bots) (warmUp() ping of /healthz, retries first create/join ~100 s, rejoin, act/send)
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

## Design system (Stage 1 — new, additive; old screens not yet migrated)
`app/src/design/` — import everything from `'../design'`:
- `tokens.ts` colours (#142D26 bg, #203D32 bgAlt, #252825 surface, #F1E8D5 text, #C9BFA9 textMuted, #BD9857 gold, #762F36 oxblood), spacing (4-pt), radii, borders, shadows, elevation (z layers), sizes (buttons/avatars/header/gutter), cardSizes, durations.
- `typography.ts` Playfair Display (display/headings) + DM Sans (UI); `type` variants: display,h1,h2,title,body,bodySm,label,caption,button. One font family per weight — never use fontWeight with them. `fonts.ts` `useAppFonts()` (loaded in App.tsx via expo-font + @expo-google-fonts).
- `components/`: AppText, PrimaryButton, SecondaryButton, IconButton, ScreenContainer (safe-area; pass safe={false} inside the current App root, which already pads), AppHeader, SectionHeading, PlayerAvatar, PlayingCard (ivory face, oxblood/ink suits), GameTile, icons.
- `preview/DesignPreview.tsx` — style guide, opened from the Home screen footer link "Design".
- Old `src/theme.ts` (`C`) and `src/ui.tsx` still drive the existing screens; later stages migrate them to the design system.

## Home & game discovery (Stage 2 — done)
`app/src/screens/Home.tsx` is now a shell with a small route stack (no nav library in the project): Home → Games list → Game info, plus Profile, Settings (→ How to play, Server address, Design system). Android back pops the stack. Sub-screens live in `app/src/screens/home/` (HomeMain, GamesList, GameInfo, Profile, Settings/Rules/Server, parts, types).
`app/src/games.ts` = UI catalogue (taglines, personalities, blurbs; player counts read from the engine; rules preview from rules.ts). Artwork is in `design/components/GameArt.tsx` (Thulla: gold-framed spade fan; Bluff: oxblood + hidden cards + "?"; Jack Thief: court-style Jack card), tiles in `GameCards.tsx` (GameCard carousel, GameRow list). Home "Play now" starts an offline game of the last-played game (stored in AsyncStorage `joa.lastGame`). Create/Join need a display name; without one the app opens Profile first.

## Multiplayer & lobby UI (Stage 3 — done)
- New routes in the Home stack: `create` (CreateRoom.tsx: game info, real player limits, game options read from the engine; private-by-code only — there is no public/private option in the server) and `join` (JoinRoom.tsx: 4-plate CodeInput, validation, loading, server/connection errors via `WaitNote` in `home/parts.tsx`).
- `screens/Lobby.tsx` rewritten with the design system: RoomCode (tap/copy via expo-clipboard + Share sheet), oval felt `LobbyTable` with real seats + open seats, `PlayerRow` list (host/you/ready/away, host-only Remove), live status line, ready/unready for guests, Start / "Start anyway" for the host, host-only game + settings chips. `lobby/useLobbyEvents.ts` turns real player-list diffs into joined / left / disconnected / reconnected / ready / host-changed messages.
- Server (additive only): new `ready` message (lobby only) and `ready` flag in each player of the state; reset on rematch. Host counts as ready; the server does not require ready to start. `app/src/engine` was re-synced (`node app/scripts/sync-engine.js`).
- Tested with real server + 2 browsers + ws bots: create, copy, invalid code, join, joined event, ready, everyone-ready, disconnect, host change, kick, setting change, start.

## Gameplay interfaces (Stage 4 — done)
Game logic, server and protocol untouched. Shared components live in `app/src/design/game/` (exported from `design/index.ts`): `GameTable` (oval table; `tone` = thulla|bluff|jack sets the rim), `PlayerStatus` (seat: hidden-card fan + avatar + name + count + countdown), `TurnIndicator`, `CardHand` (flat hand grid, legal/selected/glow, `onInvalid`, `court` = Jacks as court cards), `GameHeader`, `ScoreBoard`, `GameActionButton`, `GamePanel`, `TurnTimer`, `EventToast`, `NoticeBar` + `useGameNotice` (also shows server rejections), `VisibilityTag` (public vs private info), `FlipCard`, `GameResultModal`, `GameSettingsMenu` (rules, room code, leave). `PlayingCard` (design/components) is the only card renderer (SVG suits, glow/disabled/court/faceDown states, accessibility labels like "Queen of Hearts"); `JackFace.tsx` draws the court Jack. `screens/GameShell.tsx` wraps header + game + result + menu; screens Thulla/Bluff/Jack keep their original state wiring. Old `ui.tsx` Card/Btn/Toast and `screens/Common.tsx` were removed; `theme.ts` (`C`) now maps to the new palette for leftovers (Chat). Reanimated is not installed; animations use the built-in Animated API.

## Final polish & QA (Stage 5 — done)
- Icons/splash regenerated (gold spade on forest green); `app.json` backgrounds #142D26.
- New: `design/components/TextField.tsx` (gold focus border, invalid state), `design/components/Motion.tsx` (`Appear`, `useReduceMotion`). Used for Profile, Server and Chat inputs; Home route changes and the lobby/home switch fade in; lobby seats/rows ease in. Reduce-motion is respected.
- Disabled primary buttons are visibly distinct (faint gold + hairline, muted text). Selected cards get a ✓ badge (not colour-only). `PlayingCard` is memoised.
- Game screens are wrapped in a ScrollView (`GameShell`) so 320x568 phones scroll instead of overlapping; ScoreBoard hides under 700px height; table min-height 250 there.
- Chat restyled with the design tokens (icon FAB, oxblood badge, DM Sans).
- Touch targets: text links, Remove, Bluff rank chips enlarged / hit-slop. Extra accessibility labels.
- Not done: Reanimated (not installed), landscape, real-device testing.

## Play now (offline vs 3 bots)
Home screen button "Play now — offline vs 3 bots" starts the selected game with the user + Bot Ali/Sara/Zain (4 players, no internet). Implemented in `net.ts` (`playOffline`, `localAct`, `stopLocal`): the copied server engine and `rooms.js` run inside the app, the human gets a fake ws object, bots are players with `connected:false` (the engines' existing auto-play for disconnected players, BOT_MS tuned to ~1.2–1.8 s). `net.local` flag hides chat/reconnect banner; rematch restarts immediately with the same bots.

## Commit history (newest first)
- (this change) Play now offline mode
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

## Update: name prompt, wide collection, unlabelled opponents
- First launch (no saved name) shows `screens/home/NamePrompt.tsx` before Home; Profile still lets players rename later.
- `GameRow` is a full-width card that splits the screen height, so the three games fit without scrolling (narrow layout under 330px wide).
- Offline opponents are ordinary names (Ali, Sara, Zain; swapped if the player has the same name); no UI text says "bot". Internally they are still `bot0..2` players with `connected:false` in `net.ts`.

## Update: Play flow
- Home (`screens/home/HomeMain.tsx`): about the three games (tap → game info) with a pinned **Play** button.
- Play opens `screens/home/PlayDialog.tsx` (a centred modal dialog): Local → pick a game → offline table; Online → Create a room (uses the last game; host switches in the lobby) or Enter room code (opens the Join screen).
- The old "All games" list route still exists in code but is no longer linked from Home.
- Buttons are 3D: `Raised` + `TONES` in `design/components/Buttons.tsx` (face on a darker edge, presses down). Used by Primary/Secondary/IconButton/GameActionButton, chat FAB/Send; chips and dialog options use the same raised border look.

## Update: smarter computer seats, offline error, splash
- `server/src/bots.js` is the brain for computer-controlled seats (offline opponents and players who dropped from an online room): Thulla (duck under the highest, dump high cards when last or void, lead low from long suits), Bluff (calls via a Bayes estimate of whether they could hold the cards, remembers revealed cards in `g.known`/`g.last.knew`, honest adds, occasional bluffs). Jack Thief draws are blind, so it is unchanged. Remember `node app/scripts/sync-engine.js` after editing `server/src` (it now also copies `bots.js`).
- Bluff bots used to always pass; that was the bug.
- `net.ts` `probe()`: create/join first checks the network — an immediate network failure shows "No internet connection…"; a slow server is treated as waking up (keeps waiting).
- `App.tsx` keeps the splash artwork on screen for at least 1 s after JS starts.

## Update: Thulla slam
- When a Thulla happens, the off-suit card is lifted (≈36px, scale 1.4), accelerates down (`Easing.bezier(.7,0,1,.5)`) and lands tilted at a random spot; on landing it squashes (1.18→0.94→1), a gold ring expands, and the whole Thulla screen shakes (`useShake` in `design/components/Motion.tsx`; `SlamFly` in `design/game/GameTable.tsx`; wired in `screens/Thulla.tsx`). Reduce-motion skips lift, ring, squash and shake.

## Deal + haptics update
- Thulla slam now buzzes (RN `Vibration`, pattern 0/70/45/35) when the card lands; SlamFly's reduce-motion path also fires `onLand`.
- `DealFx` redesigned: deck stack appears at centre, 4 rounds of cards arc out with spin, seats pulse on landing, deck fades away. Reduce-motion shows the deck only.
- `CardHand` hand-in now fans from the deck (scale/rotate/overshoot) timed with the deal.
- Jack Thief deals on first view (`fresh` state, so it still plays when computer players sort instantly).
- Not tested on a device: haptics (web has no vibration), Android frame rate.

## Two-font system
- Playfair Display 800 (`fontFamily.display`: app name, game titles, hero/section headings) and 600 (`displaySemi`: card titles, tagline); 700 (`fontFamily.card`) only for card faces / rank chips / room-code letters.
- DM Sans 400/500/700 only (600 dropped; `semibold` now aliases bold). Buttons are bold.
- Type scale: display 40/43 (-0.8 tracking), h1 30, h2 26 (22 in app bars), body 16/26, small/label/caption 14. No all-caps labels; tagline "Three Games. Endless Fun."
- Scores and small UI text moved off Playfair (Jack thrown count, rules step numbers, game-card taglines).

## Brighter cards, Redaction 10, Bluff n+1 passes
- Card tokens brighter (face #FFFEF8, red #D3202E, ink #15181A, back #B8404D / gold line #EBCB82); disabled shade lighter.
- Card faces use Redaction 10 Bold (OFL, MCKL) bundled as `app/assets/Redaction10-Bold.ttf` (converted from the @fontsource/redaction-10 woff; no new dependency).
- Bluff: when every other player passes, the last player to add gets another go (`g.own`): they can add 1–2 more (others respond again) or pass (pile thrown away, they open). They cannot call their own play. Computer seats extend honestly if they hold the rank. Engine synced to app; tests added (26 pass).

## Sound effects
- New dependency: `expo-audio` (~58.0.11) — the only way to play sound in Expo; needs a fresh APK build.
- `app/src/sfx.ts`: `playSfx(name)`, `useGameSfx(g, me)` (claims, calls, passes, turn ping, win/lose), `useSfxEnabled` + Settings → "Sound effects" toggle (persisted).
- Clips are synthesised WAVs in `app/assets/sfx` (tap, deal, play, turn, pass, call, win, lose, slam); hooked into button taps, the deal, Thulla card plays and the slam.
- Tested on web only (clips fire, no errors); Android bundle exports. Not heard on a device; volume/loudness untested.

## Smarter Thulla computer players
- Engine now records public info: `g.seen` (cards played) and `g.voids` (who couldn't follow which suit). Used only by `bots.thullaChoose`.
- Void throws pick the card most dangerous to keep (unbeatable "boss" cards, high cards, short suits, suits others are void in); leads avoid suits where opponents are void; choices have a little randomness so they aren't predictable.
- Bot-vs-old-bot sim (400 games, 4 players): new bot loses 63 vs 100 expected if equal (3p 74/100, 5p 33/60).
