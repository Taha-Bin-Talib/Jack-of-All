import React from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Card, Btn } from '../ui';
import type { RoomState } from '../types';

export function Hand({ cards, legal, selected, onTap, w = 58 }: { cards: string[]; legal?: string[]; selected?: string[]; onTap?: (c: string) => void; w?: number }) {
  const n = cards.length;
  const overlap = n > 9 ? -w * 0.52 : n > 6 ? -w * 0.3 : 6;
  return (
    <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, alignItems: 'flex-end', minWidth: '100%', justifyContent: 'center' }}>
      {cards.map((c, i) => {
        const ok = !legal || legal.includes(c);
        return (
          <View key={c} style={{ marginLeft: i === 0 ? 0 : overlap }}>
            <Card id={c} w={w} selected={selected?.includes(c)} dim={!ok} onPress={onTap && ok ? () => onTap(c) : undefined} />
          </View>
        );
      })}
    </ScrollView>
  );
}

export function SeatChip({ name, count, active, off, out, small }: { name: string; count?: number; active?: boolean; off?: boolean; out?: boolean; small?: boolean }) {
  return (
    <View style={[s.chip, active && { borderColor: C.gold, backgroundColor: 'rgba(242,193,78,.22)' }, (off || out) && { opacity: 0.55 }]}>
      <Text style={[s.chipN, small && { fontSize: 11 }]} numberOfLines={1}>{name}{off ? ' ⚡' : ''}</Text>
      {count !== undefined && <Text style={s.chipC}>{out ? 'out ✓' : `${count} 🂠`}</Text>}
    </View>
  );
}

export function Header({ room, onLeave }: { room: RoomState; onLeave: () => void }) {
  return (
    <View style={s.head}>
      <Text style={s.headT}>{room.gameName} · <Text style={{ color: C.gold }}>{room.code}</Text></Text>
      <Pressable onPress={onLeave} hitSlop={10}><Text style={s.leave}>Leave</Text></Pressable>
    </View>
  );
}

export function Overlay({ title, lines, host, onAgain, onLeave }: { title: string; lines?: string[]; host: boolean; onAgain: () => void; onLeave: () => void }) {
  return (
    <View style={s.over}>
      <View style={s.overBox}>
        <Text style={s.overT}>{title}</Text>
        {lines?.map((l, i) => <Text key={i} style={s.overL}>{l}</Text>)}
        {host ? <Btn title="Back to lobby" onPress={onAgain} style={{ marginTop: 14, alignSelf: 'stretch' }} /> : <Text style={[s.overL, { marginTop: 12 }]}>Waiting for the host…</Text>}
        <Btn title="Leave room" kind="ghost" onPress={onLeave} style={{ marginTop: 10, alignSelf: 'stretch' }} />
      </View>
    </View>
  );
}

export const s = StyleSheet.create({
  chip: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(0,0,0,.35)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, minWidth: 64, maxWidth: 96, alignItems: 'center' },
  chipN: { color: C.text, fontWeight: '700', fontSize: 12 },
  chipC: { color: C.dim, fontSize: 11 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  headT: { color: C.text, fontSize: 16, fontWeight: '800' },
  leave: { color: C.dim, fontSize: 15, fontWeight: '700' },
  over: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  overBox: { backgroundColor: '#12281e', borderRadius: 18, padding: 22, alignSelf: 'stretch', borderWidth: 1, borderColor: C.gold },
  overT: { color: C.gold, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  overL: { color: C.text, fontSize: 15, textAlign: 'center', marginTop: 6 },
});
