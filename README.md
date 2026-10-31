# Jack of All — Thulla · Bluff · Jack Thief (online, Android)

A React Native (Expo) app plus a small Node WebSocket server. One player **hosts a room**, picks the game
(Bhabhi Thulla, Bluff or Jack Thief) and its options, and friends **join with a 4-letter code**.

```
server/   Node + ws game server (all rules are server-side; hands are never sent to other players)
app/      Expo / React Native Android app
```

## 1. Run the server
```bash
cd server && npm install && npm start      # listens on :3000, health check at /healthz
npm test                                   # rule tests + bot simulations (all 3 games)
```
Deploy for free-ish on **Render**: push this repo, create a Blueprint from `render.yaml` (or a Web Service with
root dir `server`, start command `npm start`). You get `https://<name>.onrender.com`; the app uses
`wss://<name>.onrender.com`. (Free instances sleep when idle — the first connect can take ~30 s.)

## 2. Run the app while developing
```bash
cd app && npm install
EXPO_PUBLIC_SERVER_URL=ws://<your-computer-LAN-ip>:3000 npx expo start
```
Open it with Expo Go on a phone (same Wi-Fi). Android emulator default is `ws://10.0.2.2:3000`.
You can also change the server address inside the app (Home → Server).

## 3. Build for the Play Store
1. Put your real server in `app/eas.json` (`EXPO_PUBLIC_SERVER_URL=wss://…`). **Release builds must use wss://** (Android blocks cleartext).
2. `cd app && npm i -g eas-cli && eas login && eas build -p android --profile production` → downloads a signed `.aab`.
   Use `--profile preview` for an installable `.apk` to test with friends first.
3. Google Play Console (one-time US$25 developer account): create app → upload the `.aab` → fill Store listing
   (screenshots, 512×512 icon = `app/assets/icon.png`), Content rating questionnaire, Data safety
   (no data collected beyond a display name sent to your server), and a Privacy-policy URL (template: `PRIVACY_POLICY.md`).
   New personal accounts must run a closed test with 12+ testers for 14 days before production access.
4. Change `android.package` in `app/app.json` (`com.jackofall.app`) to an id you own before the first upload; it can never change afterwards.

## Games
| Game | Players | Notes |
|---|---|---|
| Bhabhi Thulla | 3–8 | A♠ opens, follow suit or Thulla, first round safe (no spade → card <10), hand requests (next player, <5 cards, must agree), final duel, 1-min move timer |
| Bluff | 3–10 | Opener names a rank and plays 1–4 face-down; next players in turn can call bluff, add 1–2 cards or pass; all pass → pile thrown away; 1 or 2 decks (auto 2 at 6+), 1-min timer |
| Jack Thief | 2–10 | one random Jack removed, all cards dealt, players throw their own pairs (face-up pile), then draw blind from the next player; last Jack holder loses |

Disconnected players are auto-played so the game never stalls, and can rejoin (token saved on the device).
