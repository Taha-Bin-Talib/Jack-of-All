import React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { C } from '../theme';
import { act } from '../net';
import { Btn, Card, TimerBar, Toast, nameOf, rankLabel } from '../ui';
import { Hand, SeatChip } from './Common';
import type { RoomState } from '../types';

export default function Bluff({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const [sel, setSel] = React.useState<string[]>([]);
  React.useEffect(() => { setSel([]); }, [g.turn, g.stage]);
  const myTurn = g.turn === me;
  const toggle = (c: string) => setSel(s => s.includes(c) ? s.filter(x => x !== c) : s.length >= 4 ? s : [...s, c]);
  const ch = g.challenge;
  return (
    <View style={{ flex: 1 }}>
      <Toast ev={g.event} />
      <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 6 }} showsHorizontalScrollIndicator={false}>
        {P.map(p => <SeatChip key={p.id} name={p.id === me ? 'You' : p.name} count={g.seats.find((x: any) => x.id === p.id)?.count} active={g.turn === p.id} off={!p.connected} />)}
      </ScrollView>

      <View style={st.table}>
        <Text style={st.need}>Claim: <Text style={{ color: C.gold }}>{g.needName}s</Text> ({rankLabel(g.need)})</Text>
        <View style={{ marginVertical: 10, alignItems: 'center', minHeight: 80 }}>
          {g.reveal ? (
            <>
              <Text style={st.sub}>{nameOf(P, g.reveal.callerId)} called {nameOf(P, g.reveal.playerId)} — {g.reveal.truthful ? 'TRUTH' : 'BLUFF!'}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>{g.reveal.cards.map((c: string) => <Card key={c} id={c} w={48} />)}</View>
            </>
          ) : g.pile > 0 ? (
            <>
              <View><Card back w={54} /><Text style={st.badge}>{g.pile}</Text></View>
              {g.last && <Text style={st.sub}>{nameOf(P, g.last.pid)} says: {g.last.n} × {rankLabel(g.last.rank)}</Text>}
            </>
          ) : <Text style={st.sub}>The pile is empty</Text>}
        </View>
        <Text style={st.sub}>{g.stage === 'turn' ? (myTurn ? 'Your turn — pick 1 to 4 cards' : `${nameOf(P, g.turn)}'s turn`) : ''}</Text>
      </View>

      {g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: 16 }}><TimerBar ms={g.timer.ms} /></View>}

      {ch && (
        <View style={st.panel}>
          {ch.by === me ? <Text style={st.sub}>Waiting for others to call or pass…</Text> : ch.decided ? <Text style={st.sub}>You passed.</Text> : (
            <>
              <Text style={st.pT}>{nameOf(P, ch.by)} played {g.last.n} × {rankLabel(g.last.rank)}. Do you believe?</Text>
              <TimerBar ms={ch.ms} total={8000} />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Btn title="Believe" kind="green" style={{ flex: 1 }} onPress={() => act('pass')} />
                <Btn title="Call BLUFF!" kind="danger" style={{ flex: 1 }} onPress={() => act('call')} />
              </View>
            </>
          )}
        </View>
      )}

      {myTurn && (
        <Btn title={sel.length ? `Play ${sel.length} as ${g.needName}${sel.length > 1 ? 's' : ''}` : 'Select cards to play'} disabled={!sel.length} style={{ marginHorizontal: 16, marginBottom: 6 }} onPress={() => { act('play', { cards: sel }); setSel([]); }} />
      )}
      <Hand cards={g.you.hand} selected={sel} onTap={myTurn ? toggle : undefined} />
    </View>
  );
}

const st = StyleSheet.create({
  table: { flex: 1, margin: 12, borderRadius: 24, backgroundColor: C.felt, borderWidth: 6, borderColor: C.rim, alignItems: 'center', justifyContent: 'center', padding: 10 },
  need: { color: C.text, fontSize: 20, fontWeight: '900' },
  sub: { color: C.text, fontSize: 14, textAlign: 'center', marginTop: 6 },
  badge: { position: 'absolute', right: -8, top: -8, backgroundColor: C.gold, color: '#1d1405', fontWeight: '900', borderRadius: 11, minWidth: 22, textAlign: 'center', overflow: 'hidden', paddingVertical: 1 },
  panel: { marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.45)', borderWidth: 1, borderColor: C.gold },
  pT: { color: C.gold, fontWeight: '800', fontSize: 15, textAlign: 'center', marginBottom: 6 },
});
