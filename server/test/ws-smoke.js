'use strict';
process.env.PORT = '3555';
const WebSocket = require('ws');
const { server } = require('../src/index');
const assert = require('assert');
server.listen(3555, async () => {
  const mk = () => new Promise(r => { const w = new WebSocket('ws://localhost:3555'); w.msgs = []; w.st = null;
    w.on('message', d => { const m = JSON.parse(d); w.msgs.push(m); if (m.t === 'state') w.st = m.s; }); w.on('open', () => r(w)); });
  const wait = async f => { for (let i = 0; i < 100; i++) { if (f()) return; await new Promise(r => setTimeout(r, 20)); } throw new Error('timeout'); };
  const a = await mk(); a.send(JSON.stringify({ t: 'create', name: 'Host', game: 'bluff' }));
  await wait(() => a.st); const code = a.st.code;
  const b = await mk(), c = await mk();
  b.send(JSON.stringify({ t: 'join', name: 'Bee', code })); c.send(JSON.stringify({ t: 'join', name: 'Cee', code }));
  await wait(() => a.st.players.length === 3);
  b.send(JSON.stringify({ t: 'start' })); await wait(() => b.msgs.some(m => m.t === 'error'));   // non-host refused
  b.send(JSON.stringify({ t: 'ready', on: true })); await wait(() => a.st.players.find(p => p.name === 'Bee').ready === true);
  b.send(JSON.stringify({ t: 'ready', on: false })); await wait(() => a.st.players.find(p => p.name === 'Bee').ready === false);
  a.send(JSON.stringify({ t: 'setGame', game: 'jackthief' })); await wait(() => a.st.game === 'jackthief');
  a.send(JSON.stringify({ t: 'settings', key: 'direction', value: 'ccw' })); await wait(() => a.st.settings.direction === 'ccw');
  a.send(JSON.stringify({ t: 'start' })); await wait(() => a.st.phase === 'playing');
  assert.ok(a.st.g.you.hand.length > 0 && !('perm' in a.st.g));
  const tok = a.msgs.find(m => m.t === 'joined').token; a.close();
  const a2 = await mk(); a2.send(JSON.stringify({ t: 'rejoin', code, token: tok })); await wait(() => a2.st && a2.st.you.id === a.st.you.id);
  console.log('ws smoke ok'); process.exit(0);
});
