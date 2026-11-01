// Copies the server's game engine into the app so "Play now" can run a full game offline (3 bots).
// Run from app/:  node scripts/sync-engine.js      (re-run whenever server/src changes)
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', '..', 'server', 'src'), dst = path.join(__dirname, '..', 'src', 'engine');
const files = ['cards.js', 'net.js', 'rooms.js', 'games/index.js', 'games/thulla.js', 'games/bluff.js', 'games/jackthief.js'];
for (const f of files) {
  let s = fs.readFileSync(path.join(src, f), 'utf8');
  const up = f.includes('/') ? '../' : './';
  s = s.replace(/require\('crypto'\)/g, `require('${up}crypto')`).replace(/\)\.unref\(\);/g, ');');
  s = '// AUTO-COPIED from server/src/' + f + ' by scripts/sync-engine.js — do not edit here.\n' + s;
  fs.mkdirSync(path.dirname(path.join(dst, f)), { recursive: true });
  fs.writeFileSync(path.join(dst, f), s);
}
fs.writeFileSync(path.join(dst, 'crypto.js'), `'use strict';
// Tiny stand-in for node's crypto (React Native has none) — used only for shuffling and ids in offline games.
const randomInt = n => Math.floor(Math.random() * n);
const randomBytes = n => { let h = ''; for (let i = 0; i < n; i++) h += ('0' + randomInt(256).toString(16)).slice(-2); return { toString: () => h }; };
module.exports = { randomInt, randomBytes };
`);
console.log('engine synced');
