'use strict';
// Tiny stand-in for node's crypto (React Native has none) — used only for shuffling and ids in offline games.
const randomInt = n => Math.floor(Math.random() * n);
const randomBytes = n => { let h = ''; for (let i = 0; i < n; i++) h += ('0' + randomInt(256).toString(16)).slice(-2); return { toString: () => h }; };
module.exports = { randomInt, randomBytes };
