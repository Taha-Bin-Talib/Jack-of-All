import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { C } from './theme';

const SYM: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RN: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export const rankOf = (id: string) => parseInt(id, 10);
export const suitOf = (id: string) => /[SHDC]/.exec(id)![0];
export const rankLabel = (r: number) => RN[r] || String(r);

export function Card({ id, w = 54, back, selected, dim, onPress, style }: { id?: string; w?: number; back?: boolean; selected?: boolean; dim?: boolean; onPress?: () => void; style?: ViewStyle }) {
  const h = Math.round(w * 1.4);
  const base: ViewStyle = { width: w, height: h, borderRadius: Math.max(4, w * 0.12), opacity: dim ? 0.4 : 1, transform: selected ? [{ translateY: -12 }] : undefined };
  let inner;
  if (back || !id) {
    inner = <View style={[st.back, base, selected && st.sel, style]}><View style={[st.backIn, { borderRadius: Math.max(3, w * 0.08) }]} /></View>;
  } else {
    const s = suitOf(id), red = s === 'H' || s === 'D', col = red ? C.red : C.black;
    inner = (
      <View style={[st.face, base, selected && st.sel, style]}>
        <Text style={[st.corner, { color: col, fontSize: w * 0.3 }]}>{rankLabel(rankOf(id))}{'\n'}{SYM[s]}</Text>
        <Text style={[st.center, { color: col, fontSize: w * 0.55 }]}>{SYM[s]}</Text>
      </View>
    );
  }
  return onPress ? <Pressable onPress={onPress} hitSlop={4}>{inner}</Pressable> : inner;
}

export function Btn({ title, onPress, kind = 'gold', disabled, style }: { title: string; onPress: () => void; kind?: 'gold' | 'ghost' | 'danger' | 'green'; disabled?: boolean; style?: ViewStyle }) {
  const bg = kind === 'gold' ? C.gold : kind === 'danger' ? C.danger : kind === 'green' ? C.ok : 'transparent';
  const col: TextStyle = { color: kind === 'ghost' ? C.text : '#1d1405' };
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={({ pressed }) => [st.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, kind === 'ghost' && { borderWidth: 1, borderColor: C.dim }, style]}>
      <Text style={[st.btnT, col]}>{title}</Text>
    </Pressable>
  );
}

export function TimerBar({ ms, total = 60000 }: { ms: number; total?: number }) {
  const [left, setLeft] = React.useState(ms);
  React.useEffect(() => { setLeft(ms); const t0 = Date.now(); const i = setInterval(() => setLeft(Math.max(0, ms - (Date.now() - t0))), 250); return () => clearInterval(i); }, [ms]);
  const pct = Math.max(0, Math.min(1, left / total));
  return <View style={st.tb}><View style={[st.tbIn, { width: `${pct * 100}%`, backgroundColor: pct < 0.25 ? C.danger : C.gold }]} /></View>;
}

export function Toast({ ev }: { ev?: { seq: number; text: string } | null }) {
  const [shown, setShown] = React.useState<string | null>(null);
  React.useEffect(() => { if (!ev) return; setShown(ev.text); const t = setTimeout(() => setShown(null), 3200); return () => clearTimeout(t); }, [ev?.seq]);
  if (!shown) return <View style={{ height: 30 }} />;
  return <View style={st.toast}><Text style={st.toastT} numberOfLines={2}>{shown}</Text></View>;
}

export const nameOf = (players: { id: string; name: string }[], id?: string | null) => players.find(p => p.id === id)?.name ?? '';

export const st = StyleSheet.create({
  face: { backgroundColor: C.card, borderWidth: 1, borderColor: '#cfcfc6', padding: 3, justifyContent: 'center', alignItems: 'center' },
  back: { backgroundColor: C.back, borderWidth: 2, borderColor: '#fff', padding: 4 },
  backIn: { flex: 1, borderWidth: 1.5, borderColor: C.backLine },
  sel: { borderColor: C.gold, borderWidth: 2 },
  corner: { position: 'absolute', left: 3, top: 1, fontWeight: '800', lineHeight: undefined },
  center: { opacity: 0.9 },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnT: { fontSize: 16, fontWeight: '800' },
  tb: { height: 5, backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 3, overflow: 'hidden' },
  tbIn: { height: 5 },
  toast: { minHeight: 30, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'center', maxWidth: '94%' },
  toastT: { color: C.text, fontSize: 13, textAlign: 'center' },
});
