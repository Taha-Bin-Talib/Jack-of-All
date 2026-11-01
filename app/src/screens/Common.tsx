import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Btn } from '../ui';
import type { RoomState } from '../types';

export function Header({ room, onLeave, local }: { room: RoomState; onLeave: () => void; local?: boolean }) {
  const g = room.g;
  const extra = room.game === 'thulla' && g ? <> · Trick <Text style={s.b}>{g.trickNo}</Text></> : <> · <Text style={s.b}>{room.gameName}</Text></>;
  return (
    <View style={s.head}>
      <Text style={s.headT}>{local ? <Text style={s.b}>Play now</Text> : <>Room <Text style={s.b}>{room.code}</Text></>}{extra}</Text>
      <Pressable onPress={onLeave} style={s.leaveBtn}><Text style={s.leave}>Leave</Text></Pressable>
    </View>
  );
}

export function Overlay({ title, lines, host, onAgain, onLeave, local }: { title: string; lines?: string[]; host: boolean; onAgain: () => void; onLeave: () => void; local?: boolean }) {
  return (
    <View style={s.over}>
      <View style={s.overBox}>
        <Text style={s.overT}>{title}</Text>
        {lines?.map((l, i) => <Text key={i} style={s.overL}>{l}</Text>)}
        {host ? <Btn title={local ? 'Play again' : 'Back to lobby'} onPress={onAgain} style={{ marginTop: 14, alignSelf: 'stretch' }} /> : <Text style={[s.overL, { marginTop: 12 }]}>Waiting for the host…</Text>}
        <Btn title={local ? 'Back to home' : 'Leave room'} kind="ghost" onPress={onLeave} style={{ marginTop: 10, alignSelf: 'stretch' }} />
      </View>
    </View>
  );
}

export const s = StyleSheet.create({
  chip: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(0,0,0,.35)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, minWidth: 64, maxWidth: 96, alignItems: 'center' },
  chipN: { color: C.text, fontWeight: '700', fontSize: 12 },
  chipC: { color: C.dim, fontSize: 11 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  headT: { color: '#e8efe9', fontSize: 16 },
  b: { fontWeight: '800', color: '#fff' },
  leaveBtn: { backgroundColor: 'rgba(255,255,255,.14)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  leave: { color: '#fff', fontSize: 16, fontWeight: '800' },
  over: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  overBox: { backgroundColor: '#12281e', borderRadius: 18, padding: 22, alignSelf: 'stretch', borderWidth: 1, borderColor: C.gold },
  overT: { color: C.gold, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  overL: { color: C.text, fontSize: 15, textAlign: 'center', marginTop: 6 },
});
