'use strict';
// node test/run-all.js [rules|sim]   — fast timings so whole games finish in milliseconds
Object.assign(process.env, { SETTLE_MS: '5', CONSENT_MS: '40', TURN_MS: '800', BOT_MS: '5', CHALLENGE_MS: '30', REVEAL_MS: '5' });
const assert = require('assert');
const crypto = require('crypto');
const games = require('../src/games');
const { rank, suit } = require('../src/cards');

const which = process.argv[2];
let pass = 0, fail = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function t(name, fn) {
  try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + '\n      ' + (e.stack || e).split('\n').slice(0, 3).join('\n      ')); }
}

function mkRoom(gameId, n, settings) {
  const engine = games.get(gameId);
  const room = { code: 'TEST', game: gameId, engine, hostId: 'p0', settings: Object.assign(engine.defaults(), settings || {}),
    phase: 'lobby', players: [], timer: null, gen: 0, g: null, lastActive: 0 };
  for (let i = 0; i < n; i++) room.players.push({ id: 'p' + i, name: 'P' + i, ws: null, connected: true, hand: [], out: false, place: 0 });
  return room;
}
const allCards = room => room.players.flatMap(p => p.hand);

/* ---------- RULES ---------- */
async function rules() {
  console.log('Thulla'); const th = games.get('thulla');
  await t('deals 52 cards, A♠ holder opens, first card is A♠', () => {
    const r = mkRoom('thulla', 4); th.start(r);
    assert.strictEqual(allCards(r).length + r.g.trick.plays.length, 52);
    assert.strictEqual(r.g.trick.plays[0].card, '14S');
  });
  await t('follow suit enforced, off-suit first-trick limited to <10', () => {
    const r = mkRoom('thulla', 3); th.start(r);
    const p = r.players.find(x => x.id === r.g.turn);
    p.hand = ['14H', '9H', '5D', '12D'];
    const legal = th._t.legalCards(r, p);
    assert.ok(legal.every(c => rank(c) < 10 && suit(c) !== 'S') && legal.includes('9H') && legal.includes('5D') && !legal.includes('14H'));
  });
  await t('first trick can never be a Thulla; non-spade <10 is discarded safely', async () => {
    const r = mkRoom('thulla', 3); th.start(r);
    const p = r.players.find(x => x.id === r.g.turn);
    p.hand = ['5D', '13D'];
    th.action(r, p, { a: 'play', card: '5D' });
    assert.notStrictEqual(r.g.stage, 'settle' && r.g.settle && r.g.settle.kind === 'thulla' ? 'x' : 'y', 'x');
    clearTimeout(r.timer);
  });
  await t('Thulla: highest led-suit card picks up everything', async () => {
    const r = mkRoom('thulla', 3); th.start(r); clearTimeout(r.timer);
    r.g.trick.first = false; r.g.discarded = 0;
    r.g.trick.plays = [{ pid: 'p0', card: '10H' }]; r.g.trick.leadSuit = 'H'; r.g.trick.order = ['p0', 'p1', 'p2']; r.g.trick.pos = 1;
    r.players[0].hand = ['2D']; r.players[1].hand = ['12H', '3C']; r.players[2].hand = ['4D', '5D'];
    r.g.turn = 'p1'; r.g.stage = 'turn'; r.g.turnUntil = Date.now() + 5000;
    th.action(r, r.players[1], { a: 'play', card: '12H' });
    th.action(r, r.players[2], { a: 'play', card: '4D' });
    assert.strictEqual(r.g.settle.kind, 'thulla');
    assert.strictEqual(r.g.settle.toId, 'p1');
    await sleep(40);
    assert.ok(r.players[1].hand.includes('10H') && r.players[1].hand.includes('4D'));
  });
  await t('hand request only with <5 cards in target, needs consent', () => {
    const r = mkRoom('thulla', 4); th.start(r); clearTimeout(r.timer);
    r.g.trick.first = false; r.g.trick.plays = []; r.g.trick.pos = 0; r.g.trick.order = ['p0', 'p1', 'p2', 'p3'];
    r.g.turn = 'p0'; r.g.stage = 'turn';
    r.players[0].hand = ['2C', '3C']; r.players[1].hand = ['4C', '5C', '6C', '7C', '8C'];
    assert.strictEqual(th._t.canRequest(r, r.players[0]), null);
    r.players[1].hand = ['4C', '5C'];
    assert.ok(th._t.canRequest(r, r.players[0]));
    assert.strictEqual(th.action(r, r.players[0], { a: 'request' }), null);
    assert.strictEqual(r.g.stage, 'consent');
    th.action(r, r.players[1], { a: 'respond', accept: true });
    assert.strictEqual(r.players[0].hand.length, 4);
    assert.strictEqual(r.g.turn, 'p0');
    clearTimeout(r.timer);
  });

  console.log('Bluff'); const bl = games.get('bluff');
  await t('deals all cards; 2 decks auto at 6+ players', () => {
    const a = mkRoom('bluff', 4); bl.start(a); assert.strictEqual(allCards(a).length, 52);
    const b = mkRoom('bluff', 6); bl.start(b); assert.strictEqual(allCards(b).length, 104);
    clearTimeout(a.timer); clearTimeout(b.timer);
  });
  await t('bluff caught: liar takes pile; honest call: caller takes pile', async () => {
    const r = mkRoom('bluff', 3); bl.start(r); clearTimeout(r.timer);
    const p = r.players.find(x => x.id === r.g.turn), need = r.g.rankIdx;
    p.hand.push('2H', '9S'); const before = p.hand.length;
    bl.action(r, p, { a: 'play', cards: ['9S'] });           // claims Ace(s) with a 9: lie
    const q = r.players.find(x => x !== p);
    bl.action(r, q, { a: 'call' });
    assert.strictEqual(r.g.reveal.truthful, false);
    await sleep(30);
    assert.strictEqual(p.hand.length, before);              // played 1, took 1 back
    assert.ok(need === 0);
    clearTimeout(r.timer);
  });
  await t('empty hand without being called wins', async () => {
    const r = mkRoom('bluff', 3); bl.start(r); clearTimeout(r.timer);
    const p = r.players.find(x => x.id === r.g.turn);
    p.hand = ['14H'];
    bl.action(r, p, { a: 'play', cards: ['14H'] });
    r.players.filter(x => x !== p).forEach(x => bl.action(r, x, { a: 'pass' }));
    assert.strictEqual(r.phase, 'over'); assert.strictEqual(r.g.winnerId, p.id);
  });

  console.log('Jack Thief'); const jt = games.get('jackthief');
  await t('one Jack removed, pairs gone, exactly one odd Jack remains', () => {
    const r = mkRoom('jackthief', 4); jt.start(r); clearTimeout(r.timer);
    const cards = allCards(r), by = {};
    cards.forEach(c => by[rank(c)] = (by[rank(c)] || 0) + 1);
    assert.strictEqual(by[11] % 2, 1);
    r.players.forEach(p => { const ks = p.hand.map(rank); assert.strictEqual(new Set(ks).size, ks.length); });
    assert.strictEqual(cards.length + r.g.discarded, 51);
  });
  await t('drawing a match discards the pair', () => {
    const r = mkRoom('jackthief', 3); jt.start(r); clearTimeout(r.timer);
    const p = r.players.find(x => x.id === r.g.turn), v = r.players.find(x => x.id === r.g.pick.fromId);
    p.hand = ['5H', '9C']; v.hand = ['5D', '12S'];
    r.g.pick.perm = [0, 1]; r.g.pick.n = 2;
    jt.action(r, p, { a: 'draw', i: 0 });
    assert.deepStrictEqual(p.hand, ['9C']);
    clearTimeout(r.timer);
  });
}

/* ---------- SIM: whole games with random bots, card conservation ---------- */
function pickAction(room, p, v) {
  const id = room.game;
  if (id === 'thulla') {
    if (v.you.mustAnswer) return { a: 'respond', accept: Math.random() < 0.5 };
    if (v.you.mustPick) return { a: 'pick', i: crypto.randomInt(v.pick.n) };
    if (v.turn === p.id && v.you.legal.length) {
      if (v.you.canRequest && Math.random() < 0.3) return { a: 'request' };
      return { a: 'play', card: v.you.legal[crypto.randomInt(v.you.legal.length)] };
    }
  } else if (id === 'bluff') {
    if (v.turn === p.id) {
      const h = v.you.hand, n = 1 + crypto.randomInt(Math.min(4, h.length));
      return { a: 'play', cards: h.slice().sort(() => Math.random() - 0.5).slice(0, n) };
    }
    if (v.challenge && !v.challenge.decided) return { a: Math.random() < 0.25 ? 'call' : 'pass' };
  } else if (v.you.mustDraw) return { a: 'draw', i: crypto.randomInt(v.pick.n) };
  return null;
}
function total(room) {
  const g = room.g;
  if (room.game === 'thulla') return allCards(room).length + g.discarded + (g.settle && g.settle.kind === 'thulla' ? g.trick.plays.length : 0) + (g.settle && g.settle.kind === 'discard' ? g.trick.plays.length : 0) + (g.trick && !g.settle ? g.trick.plays.length : 0);
  if (room.game === 'bluff') return allCards(room).length + g.pile.length;
  return allCards(room).length + g.discarded;
}
async function sim() {
  const cases = [['thulla', 3], ['thulla', 5], ['thulla', 8], ['bluff', 3], ['bluff', 5], ['bluff', 8], ['jackthief', 2], ['jackthief', 4], ['jackthief', 10]];
  for (const [g, n] of cases) {
    await t(`${g} x${n}: 8 random games finish & conserve cards`, async () => {
      for (let k = 0; k < 8; k++) {
        const r = mkRoom(g, n); r.engine.start(r);
        const expect = g === 'jackthief' ? 51 : (g === 'bluff' ? (n >= 6 ? 104 : 52) : 52);
        let guard = 0;
        while (r.phase === 'playing' && guard++ < 6000) {
          for (const p of r.players) {
            if (r.phase !== 'playing') break;
            const a = pickAction(r, p, r.engine.view(r, p));
            if (a) r.engine.action(r, p, a);
          }
          if (g !== 'thulla') assert.strictEqual(total(r), expect, 'conservation ' + g);
          await sleep(1);
        }
        assert.strictEqual(r.phase, 'over', 'game did not finish');
        if (g === 'thulla') assert.ok(r.g.loserId === null || r.players.find(p => p.id === r.g.loserId));
        if (g === 'jackthief') assert.ok(r.g.thiefId);
        if (g === 'bluff') assert.ok(r.g.winnerId);
      }
    });
  }
  await t('timeout autoplay finishes a game with nobody acting (all idle)', async () => {
    for (const g of ['thulla', 'bluff', 'jackthief']) {
      const r = mkRoom(g, 3); r.engine.cfg.TURN_MS = 15; r.players.forEach(p => { p.connected = false; });
      r.engine.start(r);
      const t0 = Date.now();
      while (r.phase === 'playing' && Date.now() - t0 < 20000) await sleep(20);
      assert.strictEqual(r.phase, 'over', g + ' did not finish');
    }
  });
}

(async () => {
  if (!which || which === 'rules') await rules();
  if (!which || which === 'sim') await sim();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
