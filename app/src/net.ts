import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { DEFAULT_SERVER } from './config';
import type { GameInfo, RoomState } from './types';

export type Conn = 'connecting' | 'online' | 'offline';
type Snap = { conn: Conn; room: RoomState | null; catalog: GameInfo[]; error: string | null; errSeq: number; server: string; ready: boolean };

const KEY = 'joa.session', SKEY = 'joa.server', NKEY = 'joa.name';
let snap: Snap = { conn: 'offline', room: null, catalog: [], error: null, errSeq: 0, server: DEFAULT_SERVER, ready: false };
const subs = new Set<() => void>();
let ws: WebSocket | null = null, session: { code: string; token: string } | null = null;
let retry: any = null, ping: any = null, wanted = false, attempts = 0;
const pendingFirst: any[] = [];

function set(p: Partial<Snap>) { snap = { ...snap, ...p }; subs.forEach(f => f()); }
export const useNet = () => { const [, f] = useState(0); useEffect(() => { const s = () => f(x => x + 1); subs.add(s); return () => { subs.delete(s); }; }, []); return snap; };
export const getSnap = () => snap;

async function persist() { try { if (session) await AsyncStorage.setItem(KEY, JSON.stringify(session)); else await AsyncStorage.removeItem(KEY); } catch {} }

export async function boot() {
  try {
    const s = await AsyncStorage.getItem(SKEY); if (s) snap = { ...snap, server: s };
    const j = await AsyncStorage.getItem(KEY); if (j) session = JSON.parse(j);
  } catch {}
  set({ ready: true });
  if (session) connect();
}
export const savedName = async () => { try { return (await AsyncStorage.getItem(NKEY)) || ''; } catch { return ''; } };
export const saveName = (n: string) => { AsyncStorage.setItem(NKEY, n).catch(() => {}); };
export async function setServer(url: string) { url = url.trim(); set({ server: url || DEFAULT_SERVER }); try { await AsyncStorage.setItem(SKEY, url || DEFAULT_SERVER); } catch {} close(); }

function close() { wanted = false; clearTimeout(retry); clearInterval(ping); if (ws) { ws.onclose = null; try { ws.close(); } catch {} } ws = null; set({ conn: 'offline' }); }

function connect() {
  wanted = true; clearTimeout(retry);
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
  set({ conn: 'connecting' });
  let w: WebSocket;
  try { w = new WebSocket(snap.server); } catch { return fail(); }
  ws = w;
  w.onopen = () => {
    attempts = 0; set({ conn: 'online' });
    if (session) w.send(JSON.stringify({ t: 'rejoin', ...session }));
    else while (pendingFirst.length) w.send(JSON.stringify(pendingFirst.shift()));
    clearInterval(ping); ping = setInterval(() => { try { w.send('{"t":"ping"}'); } catch {} }, 20000);
  };
  w.onmessage = e => {
    let m: any; try { m = JSON.parse(String(e.data)); } catch { return; }
    if (m.t === 'joined') { session = { code: m.code, token: m.token }; persist(); set({ catalog: m.catalog }); }
    else if (m.t === 'state') set({ room: m.s });
    else if (m.t === 'error') set({ error: m.m, errSeq: snap.errSeq + 1 });
    else if (m.t === 'gone' || m.t === 'left' || m.t === 'kicked') {
      session = null; persist(); set({ room: null, error: m.t === 'kicked' ? 'You were removed from the room.' : m.t === 'gone' ? 'That room has ended.' : null, errSeq: snap.errSeq + 1 });
      if (m.t !== 'gone' || true) { /* keep socket for next create/join */ }
    }
  };
  w.onclose = () => { clearInterval(ping); ws = null; if (wanted) fail(); };
  w.onerror = () => {};
}
function fail() {
  set({ conn: 'offline' }); attempts++;
  if (!session && pendingFirst.length) { pendingFirst.length = 0; set({ error: 'Could not reach the server. Check the server address in Settings.', errSeq: snap.errSeq + 1 }); wanted = false; return; }
  retry = setTimeout(connect, Math.min(8000, 800 * attempts));
}

export function send(m: any) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(m));
  else if (m.t === 'create' || m.t === 'join') { pendingFirst.push(m); connect(); }
}
export const act = (a: string, extra: any = {}) => send({ t: 'act', a, ...extra });
export function leaveRoom() { send({ t: 'leave' }); session = null; persist(); set({ room: null }); }
export function reconnectNow() { if (!ws) connect(); }
