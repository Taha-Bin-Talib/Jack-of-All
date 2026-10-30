import React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { C } from '../theme';
import { act } from '../net';
import { Card, TimerBar, Toast, nameOf } from '../ui';
import { Hand, SeatChip } from './Common';
import type { RoomState } from '../types';

export default function Jack({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const myTurn = g.you.mustDraw, pk = g.pick;
  return (
    <View style={{ flex: 1 }}>
      <Toast ev={g.event} />
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 6 }} showsHorizontalScrollIndicator={false}>
        {P.map(p => <SeatChip key={p.id} name={p.id === me ? 'You' : p.name} count={g.seats.find((x: any) => x.id === p.id)?.count} active={g.turn === p.id} off={!p.connected} />)}
      </ScrollView>
      <View style={st.table}>
        <Text style={st.t}>{myTurn ? `Draw a card from ${nameOf(P, pk.fromId)}` : g.stage === 'settle' && g.last ? '' : pk ? `${nameOf(P, pk.pid)} is drawing from ${nameOf(P, pk.fromId)}` : ''}</Text>
        {pk && (
          <View style={st.row}>
            {Array.from({ length: pk.n }).map((_, i) => <Card key={i} back w={50} onPress={myTurn ? () => act('draw', { i }) : undefined} />)}
          </View>
        )}
        {g.last && (
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={st.sub}>{nameOf(P, g.last.pid)} drew from {nameOf(P, g.last.fromId)}{g.last.matched ? ' — pair!' : ''}</Text>
            {g.last.card && <Card id={g.last.card} w={48} style={{ marginTop: 6 }} />}
          </View>
        )}
        <Text style={[st.sub, { marginTop: 14 }]}>{g.discarded} cards discarded</Text>
      </View>
      {g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: 16 }}><TimerBar ms={g.timer.ms} /></View>}
      <Hand cards={g.you.hand} />
    </View>
  );
}

const st = StyleSheet.create({
  table: { flex: 1, margin: 12, borderRadius: 24, backgroundColor: C.felt, borderWidth: 6, borderColor: C.rim, alignItems: 'center', justifyContent: 'center', padding: 10 },
  t: { color: C.gold, fontWeight: '900', fontSize: 17, textAlign: 'center', marginBottom: 10 },
  sub: { color: C.text, fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
});
