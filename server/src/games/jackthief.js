'use strict';
// JACK THIEF (Old-Maid style) — 2–10 players. One random Jack is removed, the other 51 cards are dealt and
// pairs (same rank) are thrown away. Then you draw one hidden card from the next player; a match is
// discarded. Whoever is left holding the unpaired Jack is the Jack Thief.
const crypto = require('crypto');
const { later, setEvent, num } = require('../net');
const { rank, newDeck, shuffle, label } = require('../cards');

const cfg = {
  TURN_MS: num(process.env.TURN_MS, 60000),
  SETTLE_MS: num(process.env.SETTLE_MS, 1600),
  BOT_MS: Math.max(1, num(process.env.BOT_MS, 3000)),
};
const byId = (room, id) => room.players.find(p => p.id === id);

/* next player after `p` (in direction) who still holds cards */
function nextHolder(room, p) {
  const n = room.players.length, dir = room.settings.direction === 'ccw' ? -1 : 1;
  const s = room.players.indexOf(p);
  for (let i = 1; i < n; i++) {
    const q = room.players[(s + dir * i + n * 2) % n];
    if (q.hand.length) return q;
  }
  return null;
}

/* remove pairs: keep one card of a rank if the count is odd */
function dropPairs(hand) {
  const by = {};
  for (const c of hand) (by[rank(c)] = by[rank(c)] || []).push(c);
  const keep = [], dropped = [];
  for (const r in by) {
    const cs = by[r];
    if (cs.length % 2) keep.push(cs.pop());
    dropped.push(...cs);
  }
  return { keep, dropped };
}

function start(room) {
  clearTimeout(room.timer); room.timer = null; room.gen++;
  room.phase = 'playing';
  room.g = { stage: 'turn', turn: null, seq: 0, event: null, discarded: 0, pick: null, turnUntil: 0, thiefId: null, last: null, fx: 0 };
  const g = room.g;
  const deck = newDeck();
  const jacks = deck.filter(c => rank(c) === 11);
  deck.splice(deck.indexOf(jacks[crypto.randomInt(jacks.length)]), 1);   // one random Jack removed
  room.players.forEach(p => { p.hand = []; p.out = false; p.place = 0; });
  deck.forEach((c, i) => room.players[i % room.players.length].hand.push(c));
  for (const p of room.players) {
    const { keep, dropped } = dropPairs(p.hand);
    p.hand = shuffle(keep); g.discarded += dropped.length;
  }
  const holders = room.players.filter(p => p.hand.length);
  if (holders.length <= 1) return finish(room);
  const first = holders[crypto.randomInt(holders.length)];
  setEvent(room, 'start', `Pairs thrown away. ${first.name} draws first`);
  setTurn(room, first);
}

function setTurn(room, p) {
  const g = room.g;
  const victim = nextHolder(room, p);
  g.stage = 'turn'; g.turn = p.id;
  g.pick = { pid: p.id, fromId: victim.id, n: victim.hand.length, perm: shuffle(victim.hand.map((_, i) => i)) };
  g.turnUntil = Date.now() + cfg.TURN_MS;
  scheduleBot(room);
}

function draw(room, p, i) {
  const g = room.g, pk = g.pick;
  const victim = byId(room, pk.fromId);
  clearTimeout(room.timer); room.timer = null;
  const card = victim.hand.splice(pk.perm[i], 1)[0];
  const matched = p.hand.find(c => rank(c) === rank(card));
  let text;
  if (matched) {
    p.hand.splice(p.hand.indexOf(matched), 1); g.discarded += 2;
    text = `${p.name} drew ${label(card)} from ${victim.name} — pair!`;
  } else {
    p.hand.push(card);
    p.hand = shuffle(p.hand);
    text = `${p.name} drew a card from ${victim.name}`;
  }
  g.last = { id: ++g.fx, pid: p.id, fromId: victim.id, card, matched: !!matched };
  g.stage = 'settle'; g.turn = null; g.pick = null;
  setEvent(room, 'draw', text);
  const holders = room.players.filter(q => q.hand.length);
  if (holders.length <= 1) return later(room, cfg.SETTLE_MS, () => finish(room));
  later(room, cfg.SETTLE_MS, () => {
    // the victim plays next (or, if emptied, the next holder after them in turn order)
    const nxt = victim.hand.length ? victim : (p.hand.length ? nextHolder(room, victim) || p : nextHolder(room, p));
    const who = nxt && nxt.hand.length ? nxt : room.players.find(q => q.hand.length);
    setTurn(room, who);
  });
}

function finish(room) {
  const g = room.g;
  clearTimeout(room.timer); room.timer = null;
  const thief = room.players.find(p => p.hand.length) || null;
  room.phase = 'over'; g.stage = 'over'; g.turn = null; g.pick = null;
  g.thiefId = thief ? thief.id : null;
  setEvent(room, 'over', thief ? `${thief.name} is the Jack Thief!` : 'Nobody holds the Jack — draw!');
}

function scheduleBot(room) {
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
    if (p.connected && Date.now() < g.turnUntil - 5) return scheduleBot(room);
    if (p.connected) setEvent(room, 'info', `${p.name} ran out of time — a card was drawn for them`);
    draw(room, p, crypto.randomInt(g.pick.perm.length));
  });
}

function action(room, p, m) {
  const g = room.g;
  if (m.a === 'draw') {
    if (g.stage !== 'turn' || g.turn !== p.id || !g.pick) return 'It is not your turn.';
    if (!Number.isInteger(m.i) || m.i < 0 || m.i >= g.pick.perm.length) return 'Pick one of the cards.';
    draw(room, p, m.i);
    return null;
  }
  return 'Unknown action.';
}

function view(room, p) {
  const g = room.g;
  const playing = room.phase === 'playing';
  const over = room.phase === 'over';
  return {
    phase: room.phase, stage: g.stage, turn: playing && g.stage === 'turn' ? g.turn : null,
    pick: playing && g.pick ? { pid: g.pick.pid, fromId: g.pick.fromId, n: g.pick.n } : null,
    last: g.last ? { id: g.last.id, pid: g.last.pid, fromId: g.last.fromId, matched: g.last.matched,
      card: g.last.pid === p.id || g.last.matched || over ? g.last.card : null } : null,
    discarded: g.discarded, thiefId: g.thiefId, event: g.event,
    timer: playing && g.stage === 'turn' && g.turn ? { pid: g.turn, ms: Math.max(0, g.turnUntil - Date.now()) } : null,
    direction: room.settings.direction,
    seats: room.players.map(q => ({ id: q.id, count: q.hand.length })),
    you: { hand: p.hand, mustDraw: playing && g.stage === 'turn' && g.turn === p.id },
  };
}

function onPresence(room) { if (room.phase === 'playing') scheduleBot(room); }
function reset(room) { clearTimeout(room.timer); room.timer = null; room.gen++; room.g = null; room.players.forEach(p => { p.hand = []; }); }

module.exports = {
  id: 'jackthief', name: 'Jack Thief', min: 2, max: 10,
  defaults: () => ({ direction: 'cw' }),
  settings: [{ key: 'direction', label: 'Draw direction', options: [
    { value: 'cw', label: 'Clockwise' }, { value: 'ccw', label: 'Anti-clockwise' } ] }],
  start, action, view, onPresence, reset, cfg,
};
