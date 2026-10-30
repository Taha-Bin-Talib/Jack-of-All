'use strict';
// BHABHI THULLA — rules as agreed in the project chat:
//  * 3–8 players, 52 cards dealt out, aces high, clockwise. Holder of A♠ opens.
//  * Follow suit; no suit = Thulla: highest card of the led suit picks up the whole trick and leads.
//  * First round can never be a Thulla; no spade -> any card lower than 10 (or pass if none).
//  * 1-minute move timer: the server plays your highest legal card.
//  * Hand request: on your turn BEFORE you play, next player only (not yet played, fewer than 5 cards,
//    not first trick, not in the final duel, once per turn) and the asked player must agree.
//  * Final duel (two players left): a last card that loses ends it for that player (safe); a last card that
//    wins forces a blind pick of one of the opponent's cards, which is played at once. Repeat.
const crypto = require('crypto');
const { later, setEvent, num } = require('../net');
const { rank, suit, sortHand, shuffle, newDeck, label, SYM } = require('../cards');

const cfg = {
  SETTLE_MS: num(process.env.SETTLE_MS, 1800),
  THULLA_MS: num(process.env.SETTLE_MS, 2600),
  CONSENT_MS: num(process.env.CONSENT_MS, 15000),
  TURN_MS: num(process.env.TURN_MS, 60000),
  BOT_MS: Math.max(1, num(process.env.BOT_MS, 4000)),
  REQUEST_MAX_CARDS: 5,
};

const byId = (room, id) => room.players.find(p => p.id === id);
const seatOf = (room, p) => room.players.indexOf(p);
const nonOut = room => room.players.filter(p => !p.out);

function activeFrom(room, startSeat) {
  const n = room.players.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = room.players[(startSeat + i) % n];
    if (p.hand.length > 0) out.push(p);
  }
  return out;
}
function nextActiveAfter(room, p) {
  const n = room.players.length, s = seatOf(room, p);
  for (let i = 1; i < n; i++) {
    const q = room.players[(s + i) % n];
    if (q.hand.length > 0) return q;
  }
  return null;
}

/* ---------- setup ---------- */
function freshState(room) {
  room.g = {
    stage: 'turn', turn: null, trick: null, trickNo: 0, discarded: 0, loserId: null, seq: 0, event: null,
    outCounter: 0, consent: null, pick: null, settle: null, lastTrick: null, fxSeq: 0, duelSeen: false, turnUntil: 0,
  };
  room.players.forEach(p => { p.hand = []; p.out = false; p.place = 0; p.reveal = null; p.requestedThisTurn = false; });
}

function start(room) {
  clearTimeout(room.timer); room.timer = null; room.gen++;
  room.phase = 'playing';
  freshState(room);
  const deck = newDeck();
  deck.forEach((c, i) => room.players[i % room.players.length].hand.push(c));
  room.players.forEach(p => sortHand(p.hand));
  const leader = room.players.find(p => p.hand.includes('14S'));
  setEvent(room, 'start', `${leader.name} opens with A♠`);
  newTrick(room, leader, true);
  playCard(room, leader, '14S');
}

function newTrick(room, leader, first = false) {
  const g = room.g;
  g.trickNo++;
  const order = activeFrom(room, seatOf(room, leader)).map(p => p.id);
  g.trick = { first, leadSuit: null, plays: [], order, pos: 0 };
  setTurn(room, order[0]);
}

function setTurn(room, pid) {
  const g = room.g;
  g.stage = 'turn';
  g.turn = pid;
  g.consent = null; g.pick = null; g.settle = null;
  const p = byId(room, pid);
  if (p) p.requestedThisTurn = false;           // one hand request per turn
  g.turnUntil = Date.now() + cfg.TURN_MS;       // 1-minute move timer
  scheduleBot(room);
}

function legalCards(room, p) {
  const g = room.g;
  if (room.phase !== 'playing' || g.stage !== 'turn' || g.turn !== p.id) return [];
  const t = g.trick;
  if (t.plays.length === 0) return t.first ? p.hand.filter(c => c === '14S') : p.hand.slice();
  const same = p.hand.filter(c => suit(c) === t.leadSuit);
  if (same.length) return same;
  return t.first ? p.hand.filter(c => rank(c) < 10) : p.hand.slice();   // first round, no spade: any card below 10
}

function playCard(room, p, cardId) {
  const g = room.g, t = g.trick;
  p.hand.splice(p.hand.indexOf(cardId), 1);
  p.reveal = null;
  const isLead = t.plays.length === 0;
  const off = !isLead && suit(cardId) !== t.leadSuit;
  if (isLead) t.leadSuit = suit(cardId);
  t.plays.push({ pid: p.id, card: cardId });
  g.turn = null;
  if (off && !t.first) return resolveThulla(room, p, cardId);   // the first round can never be a Thulla
  advance(room, p);
}

function advance(room) {
  const g = room.g, t = g.trick;
  t.pos++;
  // first round: no-spade players throw a card below 10 (or pass if they have none)
  while (t.pos < t.order.length && t.first) {
    const q = byId(room, t.order[t.pos]);
    if (q.hand.some(c => suit(c) === t.leadSuit || rank(c) < 10)) break;
    t.pos++;
  }
  if (t.pos >= t.order.length) return resolveNormal(room);
  setTurn(room, t.order[t.pos]);
}

function highest(room) {
  const t = room.g.trick;
  let best = null;
  for (const pl of t.plays) if (suit(pl.card) === t.leadSuit && (!best || rank(pl.card) > rank(best.card))) best = pl;
  return best;
}

/* ---- trick resolution (the finished trick stays on the table for a moment) ---- */
function resolveThulla(room) {
  const g = room.g, t = g.trick;
  const best = highest(room);
  const taker = byId(room, best.pid);
  const plays = t.plays.slice();
  const text = `THULLA! ${taker.name} picks up ${plays.length} cards`;
  g.stage = 'settle'; g.turn = null; g.consent = null;
  g.settle = { kind: 'thulla', toId: taker.id, bestPid: taker.id, text };
  setEvent(room, 'thulla', text);
  later(room, cfg.THULLA_MS, () => {
    taker.hand.push(...plays.map(x => x.card));
    sortHand(taker.hand);
    g.lastTrick = { id: ++g.fxSeq, kind: 'thulla', toId: taker.id, plays };
    g.settle = null;
    finishTrick(room, taker);
  });
}

function resolveNormal(room) {
  const g = room.g, t = g.trick;
  const best = highest(room);
  const winner = byId(room, best.pid);
  const plays = t.plays.slice();
  g.stage = 'settle'; g.turn = null; g.consent = null;
  g.settle = { kind: 'discard', toId: null, bestPid: winner.id, text: `${winner.name} wins the trick` };
  if (t.first) setEvent(room, 'info', 'First round safe — cards discarded');
  later(room, cfg.SETTLE_MS, () => {
    g.discarded += plays.length;
    g.lastTrick = { id: ++g.fxSeq, kind: 'discard', toId: null, plays };
    g.settle = null;
    afterDiscard(room, winner);
  });
}

/* FINAL DUEL (exactly two players still in the game): if a player's LAST card wins the trick they are not
   safe — they blindly pick one card from the other player's hand and lead it. If it loses they are out. */
function afterDiscard(room, winner) {
  const live = nonOut(room);
  if (live.length === 2) {
    const empty = live.filter(p => p.hand.length === 0);
    if (empty.length === 1 && empty[0] === winner) {
      return startPick(room, winner, live.find(p => p !== winner));
    }
  }
  const leader = winner.hand.length > 0 ? winner : nextActiveAfter(room, winner);
  finishTrick(room, leader);
}

function startPick(room, picker, other) {
  const g = room.g;
  g.trickNo++;
  g.trick = { first: false, leadSuit: null, plays: [], order: [picker.id, other.id], pos: 0 };
  g.stage = 'pick'; g.turn = picker.id; g.consent = null;
  g.pick = { pid: picker.id, fromId: other.id, perm: shuffle(other.hand.map((_, i) => i)) };
  g.turnUntil = Date.now() + cfg.TURN_MS;
  setEvent(room, 'duel', `⚔ ${picker.name}'s last card won — picks a card from ${other.name}`);
  scheduleBot(room);
}

function doPick(room, p, i) {
  const g = room.g, pk = g.pick;
  if (room.phase !== 'playing' || g.stage !== 'pick' || !pk || pk.pid !== p.id) return 'You can’t pick a card right now.';
  if (!Number.isInteger(i) || i < 0 || i >= pk.perm.length) return 'Pick one of the cards.';
  const other = byId(room, pk.fromId);
  clearTimeout(room.timer); room.timer = null;
  const card = other.hand.splice(pk.perm[i], 1)[0];   // blind pick (random permutation hides hand order)
  p.hand.push(card);
  g.pick = null;
  setEvent(room, 'pick', `${p.name} picked a card from ${other.name}`);
  if (other.hand.length === 0) {                       // took their very last card: they are safe, picker is stuck with it
    markOuts(room);
    return endGame(room, p);
  }
  g.stage = 'turn';
  playCard(room, p, card);                             // ...and deals it straight away
  return null;
}

function markOut(room, p) { if (!p.out) { p.out = true; p.place = ++room.g.outCounter; } }
function markOuts(room) { for (const p of room.players) if (p.hand.length === 0) markOut(room, p); }

function finishTrick(room, leader) {
  const g = room.g;
  markOuts(room);
  const active = room.players.filter(p => p.hand.length > 0);
  if (active.length <= 1 || !leader || leader.hand.length === 0) return endGame(room, active[0] || null);
  if (!g.duelSeen && nonOut(room).length === 2) {
    g.duelSeen = true;
    setEvent(room, 'duel', '⚔ Final duel — two players left!');
  }
  newTrick(room, leader, false);
}

function endGame(room, loser) {
  const g = room.g;
  room.phase = 'over'; g.stage = 'over';
  g.turn = null; g.consent = null; g.pick = null; g.settle = null;
  g.loserId = loser ? loser.id : null;
  clearTimeout(room.timer); room.timer = null;
  if (loser) setEvent(room, 'over', `${loser.name} is the Bhabhi!`);
  else setEvent(room, 'over', 'Nobody is the Bhabhi — draw!');
}

/* ---- hand requests: BEFORE you deal your card, and the asked player must agree ---- */
function canRequest(room, p) {
  const g = room.g;
  if (room.phase !== 'playing' || g.stage !== 'turn' || g.turn !== p.id) return null;
  if (p.requestedThisTurn || room.settings.requestMode === 'off') return null;
  const t = g.trick;
  if (t.first || p.hand.length === 0 || nonOut(room).length <= 2) return null;   // not in the opening trick / final duel
  const target = byId(room, t.order[t.pos + 1]);                                   // next player, who hasn't played yet
  if (!target || target === p || target.hand.length === 0) return null;
  if (target.hand.length >= cfg.REQUEST_MAX_CARDS) return null;                    // only players with fewer than 5 cards
  return target;
}

function doRequest(room, p) {
  const g = room.g;
  const target = canRequest(room, p);
  if (!target) return 'You cannot request a hand right now.';
  p.requestedThisTurn = true;
  if (!target.connected) {
    setEvent(room, 'request', `${target.name} is away — request declined`);
    return null;                                          // still your turn, just play
  }
  g.stage = 'consent'; g.turn = null;
  g.consent = { pid: p.id, targetId: target.id, until: Date.now() + cfg.CONSENT_MS };
  setEvent(room, 'request', `${p.name} asks ${target.name} for their hand…`);
  later(room, cfg.CONSENT_MS, () => resolveConsent(room, false));   // no answer = no
  return null;
}

function doRespond(room, p, accept) {
  const g = room.g;
  if (room.phase !== 'playing' || g.stage !== 'consent' || !g.consent || g.consent.targetId !== p.id) {
    return 'Nobody is asking for your hand right now.';
  }
  resolveConsent(room, !!accept);
  return null;
}

function resolveConsent(room, accept) {
  const g = room.g;
  clearTimeout(room.timer); room.timer = null;
  if (g.stage !== 'consent' || !g.consent) return;
  const p = byId(room, g.consent.pid), target = byId(room, g.consent.targetId), t = g.trick;
  g.consent = null;
  if (!accept) {
    setEvent(room, 'request', `${target.name} refused ${p.name}'s request`);
  } else if (room.settings.requestMode === 'reveal') {
    p.reveal = { name: target.name, hand: sortHand(target.hand.slice()) };
    setEvent(room, 'request', `${target.name} showed their hand to ${p.name}`);
  } else {
    const n = target.hand.length;
    p.hand.push(...target.hand);
    sortHand(p.hand);
    target.hand = [];
    t.order.splice(t.order.indexOf(target.id), 1);
    markOut(room, target);
    setEvent(room, 'request', `${target.name} gave ${n} cards to ${p.name}!`);
  }
  g.stage = 'turn'; g.turn = p.id;                        // back to the requester: now they must play a card
  scheduleBot(room);
}

/* Move timer: a connected player who doesn't move within TURN_MS gets their HIGHEST legal card played.
   Disconnected players are auto-played quickly (random legal card). Duel picks time out randomly. */
function scheduleBot(room) {
  const g = room.g;
  if (room.phase !== 'playing') return;
  if (g.stage !== 'turn' && g.stage !== 'pick') return;
  clearTimeout(room.timer); room.timer = null;
  const p = byId(room, g.turn);
  if (!p) return;
  const stage = g.stage, turn = g.turn, gen = room.gen;
  const remaining = Math.max(0, g.turnUntil - Date.now());
  const wait = p.connected ? remaining : Math.min(remaining, cfg.BOT_MS);
  later(room, Math.max(1, wait), () => {
    if (room.gen !== gen || g.stage !== stage || g.turn !== turn) return;
    const due = Date.now() >= g.turnUntil - 5;
    if (p.connected && !due) return scheduleBot(room);
    if (stage === 'pick') {
      if (p.connected) setEvent(room, 'info', `${p.name} ran out of time — a card was picked for them`);
      return void doPick(room, p, crypto.randomInt(g.pick.perm.length));
    }
    const legal = legalCards(room, p);
    if (!legal.length) return;
    if (p.connected) {
      const card = legal.reduce((a, b) => (rank(b) > rank(a) ? b : a));
      setEvent(room, 'info', `${p.name} ran out of time — highest card played`);
      playCard(room, p, card);
    } else {
      playCard(room, p, legal[crypto.randomInt(legal.length)]);
    }
  });
}

/* ---------- engine interface ---------- */
function action(room, p, m) {
  const g = room.g;
  switch (m.a) {
    case 'play': {
      if (room.phase !== 'playing' || g.stage !== 'turn' || g.turn !== p.id) return 'It is not your turn.';
      const card = String(m.card);
      if (!legalCards(room, p).includes(card)) return 'You can’t play that card.';
      playCard(room, p, card);
      return null;
    }
    case 'request': return doRequest(room, p);
    case 'respond': return doRespond(room, p, m.accept === true);
    case 'pick': return doPick(room, p, m.i);
  }
  return 'Unknown action.';
}

function view(room, p) {
  const g = room.g, t = g.trick;
  const playing = room.phase === 'playing';
  const consent = playing && g.stage === 'consent' ? g.consent : null;
  const pick = playing && g.stage === 'pick' ? g.pick : null;
  const target = canRequest(room, p);
  return {
    phase: room.phase, stage: g.stage,
    turn: playing && g.stage === 'turn' ? g.turn : null, trickNo: g.trickNo, discarded: g.discarded,
    leadSuit: playing && t ? t.leadSuit : null, firstTrick: playing && t ? t.first : false,
    plays: playing && t ? t.plays : [], loserId: g.loserId,
    settle: playing ? g.settle : null,
    consent: consent ? { pid: consent.pid, targetId: consent.targetId, ms: Math.max(0, consent.until - Date.now()) } : null,
    pick: pick ? { pid: pick.pid, fromId: pick.fromId, n: pick.perm.length } : null,
    timer: playing && (g.stage === 'turn' || g.stage === 'pick') && g.turn ? { pid: g.turn, ms: Math.max(0, g.turnUntil - Date.now()) } : null,
    duel: playing && nonOut(room).length === 2,
    lastTrick: g.lastTrick, event: g.event,
    seats: room.players.map(q => ({ id: q.id, count: q.hand.length, out: !!q.out, place: q.place || 0 })),
    you: {
      hand: p.hand, legal: legalCards(room, p), reveal: p.reveal,
      canRequest: !!target, requestTarget: target ? target.name : null,
      mustPick: !!(pick && pick.pid === p.id), mustAnswer: !!(consent && consent.targetId === p.id),
    },
  };
}

function onPresence(room) { if (room.phase === 'playing') scheduleBot(room); }
function reset(room) { clearTimeout(room.timer); room.timer = null; room.gen++; room.g = null; room.players.forEach(p => { p.hand = []; p.out = false; p.place = 0; p.reveal = null; }); }

module.exports = {
  id: 'thulla', name: 'Bhabhi Thulla', min: 3, max: 8,
  defaults: () => ({ requestMode: 'elimination' }),
  settings: [{ key: 'requestMode', label: 'Hand requests', options: [
    { value: 'elimination', label: 'Take cards' }, { value: 'reveal', label: 'Peek only' }, { value: 'off', label: 'Off' } ] }],
  start, action, view, onPresence, reset, cfg,
  _t: { freshState, newTrick, playCard, legalCards, doRequest, doRespond, doPick, canRequest, label, SYM },
};
