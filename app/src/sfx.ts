/* Sound effects — short synthesised clips in assets/sfx. A few players per sound are rotated so quick repeats overlap
   instead of cutting each other off. Everything is wrapped in try/catch: sound is a nicety, never a crash. */
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';

const SRC = {
  tap: require('../assets/sfx/tap.wav'), deal: require('../assets/sfx/deal.wav'), play: require('../assets/sfx/play.wav'),
  turn: require('../assets/sfx/turn.wav'), pass: require('../assets/sfx/pass.wav'), call: require('../assets/sfx/call.wav'),
  win: require('../assets/sfx/win.wav'), lose: require('../assets/sfx/lose.wav'), slam: require('../assets/sfx/slam.wav'),
};
export type Sfx = keyof typeof SRC;
const POOL: Partial<Record<Sfx, number>> = { deal: 4, play: 3, tap: 2 };
const KEY = 'joa.sound';
const players: Partial<Record<Sfx, AudioPlayer[]>> = {};
const next: Partial<Record<Sfx, number>> = {};
let on = true;
const subs = new Set<() => void>();
AsyncStorage.getItem(KEY).then(v => { if (v === 'off') { on = false; subs.forEach(f => f()); } }).catch(() => {});

export const sfxEnabled = () => on;
export function setSfxEnabled(v: boolean) { on = v; subs.forEach(f => f()); AsyncStorage.setItem(KEY, v ? 'on' : 'off').catch(() => {}); if (v) playSfx('tap'); }
export function useSfxEnabled(): boolean {
  const [, tick] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => { subs.add(tick); return () => { subs.delete(tick); }; }, []);
  return on;
}

export function playSfx(name: Sfx, volume = 1) {
  if (!on) return;
  try {
    const list = players[name] || (players[name] = Array.from({ length: POOL[name] || 1 }, () => createAudioPlayer(SRC[name])));
    const i = ((next[name] ?? -1) + 1) % list.length; next[name] = i;
    const p = list[i]; p.volume = volume;
    Promise.resolve(p.seekTo(0)).catch(() => {}).then(() => { try { p.play(); } catch {} });
  } catch {}
}

/* Plays the game's announcements and your turn. `g` is the game view; `me` is your player id. */
export function useGameSfx(g: any, me: string) {
  const seq = React.useRef<number>(g.event?.seq ?? 0);
  const turn = React.useRef<string | null>(g.turn ?? null);
  React.useEffect(() => {
    const ev = g.event; if (!ev || ev.seq === seq.current) return;
    seq.current = ev.seq;
    const t = ev.type;
    if (t === 'claim' || t === 'draw') playSfx('play');
    else if (t === 'call' || t === 'duel') playSfx('call');
    else if (t === 'over') playSfx((g.loserId ?? g.thiefId) === me ? 'lose' : 'win');
    else if (t === 'request' || t === 'pick') playSfx('tap');
    else if (t === 'info' && /passes/.test(ev.text || '')) playSfx('pass');
  }, [g.event?.seq]);
  React.useEffect(() => {
    if (g.turn === me && turn.current !== me && g.phase === 'playing') playSfx('turn');
    turn.current = g.turn ?? null;
  }, [g.turn]);
}
