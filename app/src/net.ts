import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { DEFAULT_SERVER } from './config';
import type { GameInfo, RoomState } from './types';

export type Conn = 'connecting' | 'online' | 'offline';
export type ChatMsg = { id: string; name: string; text: string; ts: number };
type Snap = { local: boolean; chat: ChatMsg[]; waking: boolean; warming: boolean; conn: Conn; room: RoomState | null; catalog: GameInfo[]; error: string | null; errSeq: number; server: string; ready: boolean };

const KEY = 'joa.session', SKEY = 'joa.server', NKEY = 'joa.name';
let snap: Snap = { local: false, chat: [], waking: false, warming: false, conn: 'offline', room: null, catalog: [], error: null, errSeq: 0, server: DEFAULT_SERVER, ready: false };
const subs = new Set<() => void>();
let ws: WebSocket | null = null, session: { code: string; token: string } | null = null;
let retry: any = null, ping: any = null, wanted = false, attempts = 0, deadline = 0;
const pendingFirst: any[] = [];
const reactSubs = new Set<(m: { pid: string; name: string; e: string }) => void>();
export const onReact = (f: (m: { pid: string; name: string; e: string }) => void) => { reactSubs.add(f); return () => { reactSubs.delete(f); }; };

function set(p: Partial<Snap>) { snap = { ...snap, ...p }; subs.forEach(f => f()); }
export const useNet = () => { const [, f] = useState(0); useEffect(() => { const s = () => f(x => x + 1); subs.add(s); return () => { subs.delete(s); }; }, []); return snap; };
export const getSnap = () => snap;

async function persist() { try { if (session) await AsyncStorage.setItem(KEY, JSON.stringify(session)); else await AsyncStorage.removeItem(KEY); } catch {} }

/* Render free servers sleep: a plain HTTP request wakes them while the user is still typing a name */
export function warmUp() {
  const url = snap.server.replace(/^ws/, 'http');
  if (!/^https?:/.test(url)) return;
  set({ warming: true });
  const stop = () => set({ warming: false });
  const t = setTimeout(stop, 75000);
  fetch(url + (url.endsWith('/') ? 'healthz' : '/healthz')).then(() => { clearTimeout(t); stop(); }).catch(() => { clearTimeout(t); stop(); });
}

/* Is the internet there at all? A request that fails straight away (no network / DNS) means offline; one that just sits
   there is a sleeping server (still waking up), which is not an error. */
type Probe = 'ok' | 'down' | 'slow';
function probe(): Promise<Probe> {
  return new Promise(res => {
    const url = snap.server.replace(/^ws/, 'http');
    if (!/^https?:/.test(url)) return res('ok');
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => { res('slow'); try { ac && ac.abort(); } catch {} }, 5000);
    fetch(url + (url.endsWith('/') ? 'healthz' : '/healthz'), { mode: 'no-cors', signal: ac ? ac.signal : undefined } as any)
      .then(() => { clearTimeout(t); res('ok'); }).catch(() => { clearTimeout(t); res('down'); });
  });
}
const OFFLINE_MSG = 'No internet connection. Check your connection and try again.';
function goOffline() {
  pendingFirst.length = 0; wanted = false; clearTimeout(retry);
  set({ conn: 'offline', waking: false, error: OFFLINE_MSG, errSeq: snap.errSeq + 1 });
}

export async function boot() {
  try {
    const s = await AsyncStorage.getItem(SKEY); if (s) snap = { ...snap, server: s };
    const j = await AsyncStorage.getItem(KEY); if (j) session = JSON.parse(j);
  } catch {}
  set({ ready: true });
  if (session) connect(); else warmUp();
}
export const savedName = async () => { try { return (await AsyncStorage.getItem(NKEY)) || ''; } catch { return ''; } };
export const saveName = (n: string) => { AsyncStorage.setItem(NKEY, n).catch(() => {}); };
export async function setServer(url: string) { url = url.trim(); set({ server: url || DEFAULT_SERVER }); try { await AsyncStorage.setItem(SKEY, url || DEFAULT_SERVER); } catch {} close(); warmUp(); }

function close() { wanted = false; clearTimeout(retry); clearInterval(ping); if (ws) { ws.onclose = null; try { ws.close(); } catch {} } ws = null; set({ conn: 'offline' }); }

function connect() {
  wanted = true; clearTimeout(retry);
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
  set({ conn: 'connecting' });
  let w: WebSocket;
  try { w = new WebSocket(snap.server); } catch { return fail(); }
  ws = w;
  w.onopen = () => {
    attempts = 0; set({ conn: 'online', waking: false });
    if (session) w.send(JSON.stringify({ t: 'rejoin', ...session }));
    else while (pendingFirst.length) w.send(JSON.stringify(pendingFirst.shift()));
    clearInterval(ping); ping = setInterval(() => { try { w.send('{"t":"ping"}'); } catch {} }, 20000);
  };
  w.onmessage = e => { let m: any; try { m = JSON.parse(String(e.data)); } catch { return; } onMsg(m); };
  w.onclose = () => { clearInterval(ping); ws = null; if (wanted) fail(); };
  w.onerror = () => {};
}
function onMsg(m: any) {
  if (m.t === 'joined') { if (!snap.local) { session = { code: m.code, token: m.token }; persist(); } set({ catalog: m.catalog }); }
  else if (m.t === 'state') set({ room: snap.local ? { ...m.s, players: m.s.players.map((p: any) => ({ ...p, connected: true })) } : m.s });
  else if (m.t === 'chatlog') set({ chat: m.log });
  else if (m.t === 'chat') set({ chat: [...snap.chat, m.m].slice(-60) });
  else if (m.t === 'react') reactSubs.forEach(f => f(m));
  else if (m.t === 'error') set({ error: m.m, errSeq: snap.errSeq + 1 });
  else if (m.t === 'gone' || m.t === 'left' || m.t === 'kicked') {
    session = null; persist(); set({ room: null, chat: [], error: m.t === 'kicked' ? 'You were removed from the room.' : m.t === 'gone' ? 'That room has ended.' : null, errSeq: snap.errSeq + 1 });
  }
}

/* ---------- offline "Play now": the same game engine runs inside the app, with 3 bots ---------- */
let L: { rooms: any; games: any; ws: any; room: any } | null = null;
const BOT_NAMES = ['Ali', 'Sara', 'Zain', 'Maya', 'Omar'];   // ordinary names; the table never labels them as computer players
export function playOffline(game: string, name: string) {
  stopLocal();
  const rooms = require('./engine/rooms'), games = require('./engine/games'), net = require('./engine/net');
  const eng = games.get(game);
  if (eng && eng.cfg) eng.cfg.BOT_MS = game === 'jackthief' ? 1200 : game === 'bluff' ? 1800 : 1400;   // bots move at a friendly pace
  const ws: any = { readyState: 1, room: null, pid: null, send: (str: string) => { try { onMsg(JSON.parse(str)); } catch {} } };
  set({ local: true, chat: [], error: null, room: null });
  rooms.handle(ws, { t: 'create', name, game });
  const room = ws.room;
  if (!room) { set({ local: false }); return; }
  const taken = name.trim().toLowerCase();
  BOT_NAMES.filter(n => n.toLowerCase() !== taken).slice(0, 3).forEach((n, i) => room.players.push({ id: 'bot' + i, token: 'bot' + i, name: n, ws: null, connected: false, hand: [], out: false, place: 0 }));
  L = { rooms, games, ws, room };
  room.engine.start(room);
  net.broadcast(room);
}
function stopLocal() {
  if (!L) { if (snap.local) set({ local: false }); return; }
  const r = L.room; clearTimeout(r.timer); r.timer = null; r.gen++; r.phase = 'lobby'; L = null;
  set({ local: false, room: null, chat: [] });
}
function localAct(m: any) {
  if (!L) return;
  const { room, ws, rooms } = L;
  if (m.t === 'leave') { stopLocal(); return; }
  if (m.t === 'rematch') {            // straight into a new game with the same bots
    if (room.phase !== 'over') return;
    room.engine.reset(room); room.phase = 'lobby'; room.g = null;
    room.engine.start(room); require('./engine/net').broadcast(room);
    return;
  }
  rooms.handle(ws, m);
}
function fail() {
  attempts++;
  if (!session && pendingFirst.length) {
    // the user pressed Create/Join: a sleeping Render server needs 30–60 s, so keep trying quietly
    if (Date.now() > deadline) {
      pendingFirst.length = 0; wanted = false;
      set({ conn: 'offline', waking: false, error: 'The server did not wake up. Check your internet or the server address in Settings, then try again.', errSeq: snap.errSeq + 1 });
      return;
    }
    set({ conn: 'connecting', waking: true });
    retry = setTimeout(() => { probe().then(r => { if (r === 'down') goOffline(); else connect(); }); }, 2500);
    return;
  }
  set({ conn: 'offline' });
  retry = setTimeout(connect, Math.min(8000, 800 * attempts));
}

export function send(m: any) {
  if (snap.local) return localAct(m);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(m));
  else if (m.t === 'create' || m.t === 'join') { pendingFirst.length = 0; pendingFirst.push(m); deadline = Date.now() + 100000; set({ waking: true, error: null }); probe().then(r => { if (r === 'down') goOffline(); else connect(); }); }
}
export const act = (a: string, extra: any = {}) => send({ t: 'act', a, ...extra });
export function leaveRoom() { if (snap.local) return stopLocal(); send({ t: 'leave' }); session = null; persist(); set({ room: null, chat: [] }); }
export function reconnectNow() { if (!ws) connect(); }
