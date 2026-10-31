import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { C } from './theme';

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

/* Playing card: rank (horizontal) + small suit in the top-left and, turned over, bottom-right corners,
   one big suit in the middle. */
export function Card({ id, w = 54, back, selected, dim, glow, onPress, style }: {
  id?: string; w?: number; back?: boolean; selected?: boolean; dim?: boolean; glow?: boolean; onPress?: () => void; style?: ViewStyle;
}) {
  const h = Math.round(w * 1.4), rad = Math.max(4, w * 0.12);
  const wrap: ViewStyle = {
    width: w, height: h, borderRadius: rad,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2.5, shadowOffset: { width: 0, height: 1.5 }, elevation: 3,
  };
  let inner: React.ReactNode;
  if (back || !id) {
    const dm = w * 0.42;
    inner = (
      <View style={[wrap, st.back, { padding: w * 0.07 }, selected && st.sel, style]}>
        <View style={[st.backIn, { borderRadius: rad * 0.6 }]}>
          <View style={{ width: dm, height: dm, borderWidth: 1.5, borderColor: C.backLine, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: dm * 0.45, height: dm * 0.45, backgroundColor: C.backLine, opacity: 0.55 }} />
          </View>
        </View>
      </View>
    );
  } else {
    const s = suitOf(id), r = rankOf(id), red = s === 'H' || s === 'D', col = red ? C.red : C.black, lab = rankLabel(r);
    if (w < 40) {            // tiny cards (thrown pile): rank and suit stacked in the middle
      inner = (
        <View style={[wrap, st.face, style]}>
          <Text allowFontScaling={false} numberOfLines={1} style={[st.rk, { color: col, fontSize: w * 0.44 }]}>{lab}</Text>
          <Suit s={s} size={w * 0.42} color={col} />
        </View>
      );
    } else {
      const idx = (
        <View style={{ alignItems: 'center' }}>
          <Text allowFontScaling={false} numberOfLines={1} style={[st.rk, { color: col, fontSize: w * 0.3, lineHeight: w * 0.34 }]}>{lab}</Text>
          <Suit s={s} size={w * 0.2} color={col} />
        </View>
      );
      inner = (
        <View style={[wrap, st.face, selected && st.sel, glow && st.glow, style]}>
          <View style={{ position: 'absolute', left: w * 0.09, top: w * 0.05 }}>{idx}</View>
          <View style={{ position: 'absolute', right: w * 0.09, bottom: w * 0.05, transform: [{ rotate: '180deg' }] }}>{idx}</View>
          <Suit s={s} size={w * 0.5} color={col} />
        </View>
      );
    }
    if (dim) inner = <View>{inner}<View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: rad, backgroundColor: 'rgba(20,30,25,.5)' }} /></View>;
  }
  return onPress ? <Pressable onPress={onPress} hitSlop={3}>{inner}</Pressable> : <View>{inner}</View>;
}

export function Btn({ title, onPress, kind = 'gold', disabled, style }: { title: string; onPress: () => void; kind?: 'gold' | 'ghost' | 'danger' | 'green'; disabled?: boolean; style?: ViewStyle }) {
  const bg = kind === 'gold' ? C.gold : kind === 'danger' ? C.danger : kind === 'green' ? C.ok : 'transparent';
  const col: TextStyle = { color: kind === 'ghost' || kind === 'danger' ? (kind === 'danger' ? '#fff' : C.text) : '#1d1405' };
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={({ pressed }) => [st.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, kind === 'ghost' && { borderWidth: 1, borderColor: C.dim }, style]}>
      <Text style={[st.btnT, col]}>{title}</Text>
    </Pressable>
  );
}

export function TimerBar({ ms, total = 60000, h = 5 }: { ms: number; total?: number; h?: number }) {
  const [left, setLeft] = React.useState(ms);
  React.useEffect(() => { setLeft(ms); const t0 = Date.now(); const i = setInterval(() => setLeft(Math.max(0, ms - (Date.now() - t0))), 250); return () => clearInterval(i); }, [ms]);
  const pct = Math.max(0, Math.min(1, left / total));
  return <View style={[st.tb, { height: h }]}><View style={{ height: h, width: `${pct * 100}%`, backgroundColor: pct < 0.25 ? C.danger : C.gold }} /></View>;
}

export function Toast({ ev }: { ev?: { seq: number; type?: string; text: string } | null }) {
  const [shown, setShown] = React.useState<{ text: string; type?: string } | null>(null);
  React.useEffect(() => { if (!ev) return; setShown({ text: ev.text, type: ev.type }); const t = setTimeout(() => setShown(null), 3200); return () => clearTimeout(t); }, [ev?.seq]);
  if (!shown) return <View style={{ height: 34 }} />;
  const bg = shown.type === 'thulla' ? '#e0453d' : shown.type === 'duel' ? '#2a1a5e' : shown.type === 'call' ? '#e0453d' : C.gold;
  const fg = shown.type === 'thulla' || shown.type === 'duel' || shown.type === 'call' ? '#fff' : '#1d1405';
  return <View style={[st.toast, { backgroundColor: bg }, shown.type === 'duel' && { borderWidth: 2, borderColor: C.gold }]}><Text style={[st.toastT, { color: fg }]} numberOfLines={2}>{shown.text}</Text></View>;
}

export const nameOf = (players: { id: string; name: string }[], id?: string | null) => players.find(p => p.id === id)?.name ?? '';

export const st = StyleSheet.create({
  face: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth * 2, borderColor: '#bdbdb2', alignItems: 'center', justifyContent: 'center' },
  back: { backgroundColor: C.back, borderWidth: 2, borderColor: '#fff' },
  backIn: { flex: 1, borderWidth: 1.2, borderColor: C.backLine, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.06)' },
  sel: { borderColor: C.gold, borderWidth: 2.5 },
  glow: { borderColor: C.gold, borderWidth: 2 },
  rk: { fontWeight: '800', textAlign: 'center', includeFontPadding: false, lineHeight: undefined },
  sm: { textAlign: 'center', includeFontPadding: false },
  court: { alignItems: 'center', justifyContent: 'center' },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnT: { fontSize: 16, fontWeight: '800' },
  tb: { backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 3, overflow: 'hidden' },
  toast: { minHeight: 30, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'center', maxWidth: '94%' },
  toastT: { fontSize: 13, textAlign: 'center', fontWeight: '800' },
});
