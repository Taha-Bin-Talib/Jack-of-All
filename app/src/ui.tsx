import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const SYM: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RN: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export const rankOf = (id: string) => parseInt(id, 10);
export const suitOf = (id: string) => /[SHDC]/.exec(id)![0];
export const rankLabel = (r: number) => RN[r] || String(r);

/* Suits are drawn as vector shapes (not text glyphs) so every phone renders them the same — some Android
   fonts turn ♥ ♠ into emoji, which made the cards look cluttered. */
export function Suit({ s, size, color }: { s: string; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {s === 'H' && <Path fill={color} d="M50 92 C18 66 4 49 4 30 C4 14 16 4 30 4 C40 4 47 10 50 18 C53 10 60 4 70 4 C84 4 96 14 96 30 C96 49 82 66 50 92 Z" />}
      {s === 'D' && <Path fill={color} d="M50 2 C60 22 76 38 94 50 C76 62 60 78 50 98 C40 78 24 62 6 50 C24 38 40 22 50 2 Z" />}
      {s === 'S' && <Path fill={color} d="M50 3 C58 24 92 42 92 64 C92 78 81 86 69 86 C61 86 55 82 52 77 C52 87 56 93 63 97 L37 97 C44 93 48 87 48 77 C45 82 39 86 31 86 C19 86 8 78 8 64 C8 42 42 24 50 3 Z" />}
      {s === 'C' && (
        <>
          <Circle cx="50" cy="28" r="22" fill={color} />
          <Circle cx="26" cy="62" r="22" fill={color} />
          <Circle cx="74" cy="62" r="22" fill={color} />
          <Path fill={color} d="M44 52 L56 52 C56 76 60 88 68 97 L32 97 C40 88 44 76 44 52 Z" />
        </>
      )}
    </Svg>
  );
}

export const nameOf = (players: { id: string; name: string }[], id?: string | null) => players.find(p => p.id === id)?.name ?? '';
