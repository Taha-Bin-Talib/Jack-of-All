import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Btn } from '../ui';
import type { RoomState } from '../types';

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
