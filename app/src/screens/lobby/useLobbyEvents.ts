import React from 'react';
import type { Player } from '../../types';

export type LobbyEvent = { seq: number; text: string; tone: 'info' | 'good' | 'warn' };

/* Turns real room-state changes into human messages: joined, left, disconnected, reconnected,
   ready, host changed. Nothing is invented — it only diffs the players the server sends. */
export function useLobbyEvents(players: Player[], hostId: string, meId: string): LobbyEvent | null {
  const prev = React.useRef<{ map: Map<string, Player>; host: string } | null>(null);
  const seq = React.useRef(0);
  const [ev, setEv] = React.useState<LobbyEvent | null>(null);
  React.useEffect(() => {
    const old = prev.current, map = new Map(players.map(p => [p.id, p]));
    prev.current = { map, host: hostId };
    if (!old) return;
    const out: Omit<LobbyEvent, 'seq'>[] = [];
    const nm = (p: Player) => (p.id === meId ? 'You' : p.name);
    for (const p of players) {
      const o = old.map.get(p.id);
      if (!o) { if (p.id !== meId) out.push({ text: `${p.name} joined the table`, tone: 'good' }); continue; }
      if (o.connected && !p.connected) out.push({ text: `${nm(p)} disconnected`, tone: 'warn' });
      else if (!o.connected && p.connected) out.push({ text: `${nm(p)} reconnected`, tone: 'good' });
      else if (!o.ready && p.ready && p.id !== meId && p.id !== hostId) out.push({ text: `${p.name} is ready`, tone: 'info' });
    }
    for (const o of old.map.values()) if (!map.has(o.id) && o.id !== meId) out.push({ text: `${o.name} left`, tone: 'warn' });
    if (old.host !== hostId) { const h = map.get(hostId); if (h) out.push({ text: h.id === meId ? 'You are now the host' : `${h.name} is now the host`, tone: 'info' }); }
    if (out.length) setEv({ seq: ++seq.current, ...out[out.length - 1] });
  }, [players, hostId, meId]);
  return ev;
}
