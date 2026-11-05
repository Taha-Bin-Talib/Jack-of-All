// AUTO-COPIED from server/src/bots.js by scripts/sync-engine.js — do not edit here.
'use strict';
// The brain for computer-controlled seats (offline "Play now" opponents and players who dropped out of an online room).
// It only ever looks at what a human at that seat could know: its own hand and what is on the table.
// Every function returns a legal move for the situation it is given.
const { rank, suit } = require('./cards');

const rnd = () => Math.random();
const pickRandom = a => a[Math.floor(rnd() * a.length)];
const maxBy = (a, f) => a.reduce((b, c) => (f(c) > f(b) ? c : b));
const minBy = (a, f) => a.reduce((b, c) => (f(c) < f(b) ? c : b));
const countSuit = (hand, s) => hand.filter(c => suit(c) === s).length;

/* ───────── Bhabhi Thulla ─────────
   Danger = holding the highest card of the led suit when someone who can't follow throws off-suit (you pick up the trick).
   So: duck under the current highest when you can, dump your biggest card when you are the last to play (the trick is
   then discarded for free), and when you can't follow, throw your most dangerous high card from your shortest suit. */
function thullaChoose(room, p, legal) {
  const t = room.g.trick, hand = p.hand;
  if (legal.length === 1) return legal[0];
  if (t.plays.length === 0) return minBy(legal, c => rank(c) - 0.5 * countSuit(hand, suit(c)));      // lead low from a long suit
  const lead = t.leadSuit, following = legal.filter(c => suit(c) === lead);
  if (!following.length) return maxBy(legal, c => rank(c) + (4 - countSuit(hand, suit(c))) * 0.6);     // can't follow: shed danger
  let top = 0;
  for (const pl of t.plays) if (suit(pl.card) === lead) top = Math.max(top, rank(pl.card));
  const lower = following.filter(c => rank(c) < top);
  const last = t.pos >= t.order.length - 1;
  if (last) return maxBy(following, rank);                                  // nobody can thulla after me: dump my highest
  if (lower.length) return maxBy(lower, rank);                              // duck as high as is still safe
  return minBy(following, rank);                                            // must go over: go over by as little as possible
}

/* ───────── Bluff ───────── */
const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
function groups(hand) {
  const by = {};
  for (const c of hand) (by[rank(c)] = by[rank(c)] || []).push(c);
  return by;
}
/* opener: play the biggest honest group; sometimes sneak one extra card in (a bluff) to shed faster */
function bluffOpen(p, maxOpen) {
  const by = groups(p.hand), sizes = Object.values(by).map(a => a.length), max = Math.max(...sizes);
  const best = Object.keys(by).filter(r => by[r].length === max);
  const r = +pickRandom(best);
  const cards = by[r].slice(0, maxOpen);
  if (p.hand.length > 5 && cards.length < maxOpen && rnd() < (cards.length === 1 ? 0.22 : 0.1)) {
    const junk = p.hand.filter(c => rank(c) !== r && !cards.includes(c));
    if (junk.length) cards.push(pickRandom(junk));
  }
  return { r, cards };
}
/* responder: returns {do:'call'} | {do:'add', cards} | {do:'pass'} */
function bluffRespond(room, p, maxAdd) {
  const g = room.g, claim = g.claim, L = g.last;
  const adder = room.players.find(q => q.id === L.pid);
  const copies = 4 * g.decks;
  const mine = p.hand.filter(c => rank(c) === claim.rank);
  if (g.own) {                                                                // everyone passed on my own play: extend it honestly, or let it go
    if (mine.length && p.hand.length) return { do: 'add', cards: mine.slice(0, maxAdd) };
    if (p.hand.length > 4 && rnd() < 0.06) return { do: 'add', cards: [pickRandom(p.hand)] };
    return { do: 'pass' };
  }
  // the last play can't be honest if there aren't enough copies of the rank left
  const impossible = mine.length + L.n > copies;
  // How likely is it that the last player really held those cards? (Bayes: a 30% habit of lying vs the chance of holding them.)
  const left = copies - mine.length;                                          // copies of that rank still unseen by me
  const unseen = Math.max(1, 52 * g.decks - p.hand.length);
  const q = Math.min(1, (adder ? adder.hand.length + L.n : L.n) / unseen);    // chance each unseen copy sits in their hand
  let pHas = 0;                                                               // P(they hold at least n of the `left` copies)
  for (let k = L.n; k <= left; k++) pHas += choose(left, k) * Math.pow(q, k) * Math.pow(1 - q, left - k);
  const knew = (L.knew || []).filter(c => rank(c) === claim.rank).length;     // cards of that rank everybody saw them pick up
  const prior = adder && adder.connected ? 0.35 : 0.1;                       // people bluff a lot; computer seats rarely do
  let sus = prior / (prior + (1 - prior) * pHas);
  if (knew >= L.n) sus = Math.min(sus, 0.05);                                 // we watched them pick those cards up: surely honest
  if (claim.count + mine.length > copies) sus += 0.1;                         // the pile already holds more than exist
  if (adder && adder.hand.length === 0) sus += 0.2;                           // they're about to escape: worth a shot
  const cost = Math.min(0.12, g.pile.length * 0.006);                         // a wrong call costs the whole pile
  const wantCall = impossible || sus + (rnd() - 0.5) * 0.14 > 0.55 + cost;
  if (wantCall && g.pile.length) return { do: 'call' };
  const others = room.players.some(q => q !== p && q.hand.length);
  if (others && p.hand.length) {
    if (mine.length) return { do: 'add', cards: mine.slice(0, maxAdd) };                 // honest add: safe
    if (!mine.length && p.hand.length > 3 && rnd() < 0.08) return { do: 'add', cards: [pickRandom(p.hand)] }; // occasional bluff
  }
  return { do: 'pass' };
}

module.exports = { thullaChoose, bluffOpen, bluffRespond };
