'use strict';
// BLUFF (Cheat) — 3–10 players. All cards are dealt out; the holder of A♠ starts.
// The rank to claim goes A,2,3,…,K,A,… . On your turn put 1–4 cards face-down and say they are all of that rank
// (you may lie). Everyone else may CALL (challenge) within a short window. Caught lying -> you pick up the whole
// pile; wrongly accused -> the caller picks it up. First player to empty their hand without being caught wins.
const crypto = require('crypto');
const { later, setEvent, num } = require('../net');
const { rank, sortHand, newDeck, rankName, rankWord, label } = require('../cards');

const cfg = {
  TURN_MS: num(process.env.TURN_MS, 60000),
  CHALLENGE_MS: num(process.env.CHALLENGE_MS, 8000),
  REVEAL_MS: num(process.env.REVEAL_MS, 3500),
  BOT_MS: Math.max(1, num(process.env.BOT_MS, 4000)),
  MAX_PLAY: 4,
};
const SEQ = [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const byId = (room, id) => room.players.find(p => p.id === id);

function nextWithCards(room, p) {
  const n = room.players.length, s = room.players.indexOf(p);
  for (let i = 1; i <= n; i++) {
    const q = room.players[(s + i) % n];
    if (q.hand.length) return q;
  }
  return p;
}

function decksFor(room) {
  const d = room.settings.decks;
  if (d === '2') return 2;
  if (d === '1') return 1;
  return room.players.length >= 6 ? 2 : 1;
}

function start(room) {
  clearTimeout(room.timer); room.timer = null; room.gen++;
  room.phase = 'playing';
  const copies = decksFor(room);
  room.g = { stage: 'turn', turn: null, seq: 0, event: null, rankIdx: 0, pile: [], last: null, passed: [], challengeUntil: 0,
    reveal: null, winnerId: null, turnUntil: 0, decks: copies, plays: 0 };
  room.players.forEach(p => { p.hand = []; p.out = false; p.place = 0; });
  newDeck(copies).forEach((c, i) => room.players[i % room.players.length].hand.push(c));
  room.players.forEach(p => sortHand(p.hand));
  const starter = room.players.find(p => p.hand.includes('14S')) || room.players[0];
  setEvent(room, 'start', `${starter.name} starts — claim ${rankName(SEQ[0])}s`);
  setTurn(room, starter.id);
}

const needRank = room => SEQ[room.g.rankIdx % SEQ.length];

function setTurn(room, pid) {
  const g = room.g;
  g.stage = 'turn'; g.turn = pid; g.reveal = null; g.passed = [];
  g.turnUntil = Date.now() + cfg.TURN_MS;
  scheduleTurn(room);
}

function play(room, p, cards) {
  const g = room.g;
  const r = needRank(room);
  for (const c of cards) p.hand.splice(p.hand.indexOf(c), 1);
  g.pile.push(...cards);
  g.last = { pid: p.id, cards: cards.slice(), n: cards.length, rank: r };
  g.rankIdx++;
  g.plays++;
  g.turn = null;
  g.stage = 'challenge';
  // players who are offline can't answer: they pass for themselves
  g.passed = room.players.filter(q => q.id !== p.id && !q.connected).map(q => q.id);
  g.challengeUntil = Date.now() + cfg.CHALLENGE_MS;
  setEvent(room, 'claim', `${p.name} plays ${rankWord(r, cards.length)}`);
  if (allPassed(room)) return afterNoCall(room);
  later(room, cfg.CHALLENGE_MS, () => afterNoCall(room));
}

function allPassed(room) {
  const g = room.g;
  return room.players.every(q => q.id === g.last.pid || g.passed.includes(q.id));
}

function afterNoCall(room) {
  const g = room.g;
  if (g.stage !== 'challenge') return;
  clearTimeout(room.timer); room.timer = null;
  const p = byId(room, g.last.pid);
  if (p.hand.length === 0) return endGame(room, p);
  setTurn(room, nextWithCards(room, p).id);
}

function call(room, caller) {
  const g = room.g, L = g.last;
  const p = byId(room, L.pid);
  clearTimeout(room.timer); room.timer = null;
  const truthful = L.cards.every(c => rank(c) === L.rank);
  const loser = truthful ? caller : p;
  g.stage = 'reveal'; g.turn = null;
  g.reveal = { callerId: caller.id, playerId: p.id, cards: L.cards.slice(), truthful, loserId: loser.id, rank: L.rank, taken: g.pile.length };
  setEvent(room, 'call', truthful
    ? `${caller.name} called — ${p.name} told the truth! ${caller.name} takes ${g.pile.length} cards`
    : `${caller.name} called — ${p.name} was bluffing! ${p.name} takes ${g.pile.length} cards`);
  later(room, cfg.REVEAL_MS, () => {
    loser.hand.push(...g.pile); sortHand(loser.hand);
    g.pile = []; g.reveal = null;
    if (p.hand.length === 0) return endGame(room, p);   // told the truth with their last cards
    setTurn(room, nextWithCards(room, p).id);
  });
}

function endGame(room, winner) {
  const g = room.g;
  clearTimeout(room.timer); room.timer = null;
  room.phase = 'over'; g.stage = 'over'; g.turn = null; g.winnerId = winner.id;
  setEvent(room, 'over', `${winner.name} wins!`);
}

function scheduleTurn(room) {
  const g = room.g;
  if (room.phase !== 'playing' || g.stage !== 'turn') return;
  clearTimeout(room.timer); room.timer = null;
  const p = byId(room, g.turn);
  if (!p) return;
  const turn = g.turn, gen = room.gen;
  const remaining = Math.max(0, g.turnUntil - Date.now());
  const wait = p.connected ? remaining : Math.min(remaining, cfg.BOT_MS);
  later(room, Math.max(1, wait), () => {
    if (room.gen !== gen || g.stage !== 'turn' || g.turn !== turn) return;
    if (p.connected && Date.now() < g.turnUntil - 5) return scheduleTurn(room);
    const r = needRank(room);
    const match = p.hand.filter(c => rank(c) === r).slice(0, cfg.MAX_PLAY);
    const cards = match.length ? match : [p.hand[crypto.randomInt(p.hand.length)]];
    if (p.connected) setEvent(room, 'info', `${p.name} ran out of time — cards played for them`);
    play(room, p, cards);
  });
}

function action(room, p, m) {
  const g = room.g;
  switch (m.a) {
    case 'play': {
      if (g.stage !== 'turn' || g.turn !== p.id) return 'It is not your turn.';
      const cards = Array.isArray(m.cards) ? m.cards.map(String) : [];
      if (cards.length < 1 || cards.length > cfg.MAX_PLAY) return `Play between 1 and ${cfg.MAX_PLAY} cards.`;
      if (new Set(cards).size !== cards.length || !cards.every(c => p.hand.includes(c))) return 'Those cards are not in your hand.';
      clearTimeout(room.timer); room.timer = null;
      play(room, p, cards);
      return null;
    }
    case 'call': {
      if (g.stage !== 'challenge') return 'Too late to call.';
      if (g.last.pid === p.id) return 'You can’t call your own play.';
      if (g.passed.includes(p.id)) return 'You already passed.';
      call(room, p);
      return null;
    }
    case 'pass': {
      if (g.stage !== 'challenge' || g.last.pid === p.id || g.passed.includes(p.id)) return null;
      g.passed.push(p.id);
      if (allPassed(room)) afterNoCall(room);
      return null;
    }
  }
  return 'Unknown action.';
}

function view(room, p) {
  const g = room.g;
  const playing = room.phase === 'playing';
  const ch = playing && g.stage === 'challenge';
  return {
    phase: room.phase, stage: g.stage, turn: playing && g.stage === 'turn' ? g.turn : null,
    need: needRank(room), needName: rankName(needRank(room)),
    pile: g.pile.length, decks: g.decks,
    last: g.last ? { pid: g.last.pid, n: g.last.n, rank: g.last.rank } : null,
    challenge: ch ? { ms: Math.max(0, g.challengeUntil - Date.now()), decided: g.passed.includes(p.id) || g.last.pid === p.id, by: g.last.pid } : null,
    reveal: g.reveal,
    timer: playing && g.stage === 'turn' && g.turn ? { pid: g.turn, ms: Math.max(0, g.turnUntil - Date.now()) } : null,
    winnerId: g.winnerId, event: g.event,
    seats: room.players.map(q => ({ id: q.id, count: q.hand.length })),
    you: { hand: p.hand },
  };
}

function onPresence(room, p) {
  if (room.phase !== 'playing') return;
  const g = room.g;
  if (g.stage === 'turn') return scheduleTurn(room);
  if (g.stage === 'challenge' && !p.connected && g.last.pid !== p.id && !g.passed.includes(p.id)) {
    g.passed.push(p.id);
    if (allPassed(room)) afterNoCall(room);
  }
}

function reset(room) { clearTimeout(room.timer); room.timer = null; room.gen++; room.g = null; room.players.forEach(p => { p.hand = []; }); }

module.exports = {
  id: 'bluff', name: 'Bluff', min: 3, max: 10,
  defaults: () => ({ decks: 'auto' }),
  settings: [{ key: 'decks', label: 'Decks', options: [
    { value: 'auto', label: 'Auto' }, { value: '1', label: '1 deck' }, { value: '2', label: '2 decks' } ] }],
  start, action, view, onPresence, reset, cfg,
  _t: { label },
};
