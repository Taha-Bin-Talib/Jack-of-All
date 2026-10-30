'use strict';
const http = require('http');
const { WebSocketServer } = require('ws');
const rooms = require('./rooms');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/healthz' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('Jack of All server OK');
  }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ server, maxPayload: 4096 });

wss.on('connection', ws => {
  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', data => {
    let m;
    try { m = JSON.parse(data.toString()); } catch (e) { return; }
    try { rooms.handle(ws, m); } catch (e) { console.error(e); }
  });
  ws.on('close', () => rooms.disconnect(ws));
  ws.on('error', () => {});
});

// heartbeat: drop dead sockets so the player is shown as disconnected (and auto-played)
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false; try { ws.ping(); } catch (e) { /* ignore */ }
  }
  rooms.sweep();
}, 15000).unref();

if (require.main === module) {
  server.listen(PORT, () => console.log('Jack of All server on :' + PORT));
}
module.exports = { server, wss };
