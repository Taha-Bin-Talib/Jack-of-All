import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { C } from '../theme';
import { act } from '../net';
import { Btn, Card, TimerBar, Toast, nameOf, rankOf } from '../ui';
import { DealFx, Geo, Hand, PileStack, Ring, Seat, TurnArrow, useFlights } from '../table/Table';
import type { RoomState } from '../types';

function Fx({ geo, g }: { geo: Geo; g: any }) {
  const { push, layer } = useFlights();
  const seen = React.useRef<number | null>(g.last ? g.last.id : 0);
  React.useEffect(() => {
    const l = g.last;
    if (!l || l.id === seen.current) return;
    seen.current = l.id;
    push([{ from: geo.seat(geo.idx(l.fromId)), to: geo.seat(geo.idx(l.pid)), w: geo.u * 8, id: l.card ?? undefined, back: !l.card, duration: 600, fade: true }]);
  }, [g.last?.id]);
  return <>{layer}</>;
}

export default function Jack({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const sorting = g.stage === 'sort';
  const [pick, setPick] = React.useState<string | null>(null);
  React.useEffect(() => { setPick(null); }, [g.stage]);
  const myTurn = g.you.mustDraw, pk = g.pick;
  // while sorting the hand is shown by rank so pairs are easy to see
  const hand: string[] = sorting ? [...g.you.hand].sort((a, b) => rankOf(a) - rankOf(b)) : g.you.hand;
  const counts: Record<number, number> = {};
  for (const c of hand) counts[rankOf(c)] = (counts[rankOf(c)] || 0) + 1;
  const glow = sorting ? hand.filter(c => counts[rankOf(c)] > 1) : [];
  const onTap = (c: string) => {
    if (!sorting || g.you.done) return;
    if (pick === c) return setPick(null);
    if (pick && rankOf(pick) === rankOf(c)) { act('throw', { cards: [pick, c] }); return setPick(null); }
    setPick(c);
  };
  const thrown: string[] = [...g.thrown].sort((a, b) => rankOf(a) - rankOf(b));
  const hint = sorting ? (g.you.done ? 'Waiting for the others to finish…' : g.you.pairs ? 'Tap two cards of the same rank to throw the pair away' : 'No pairs left — tap Done')
    : myTurn ? `Your turn — draw a card from ${nameOf(P, pk.fromId)}` : pk ? `${nameOf(P, pk.pid)} is drawing from ${nameOf(P, pk.fromId)}` : '';
  return (
    <View style={{ flex: 1 }}>
      <Toast ev={g.event} />
      <Ring players={P} meId={me}>
        {geo => (
          <>
            <TurnArrow geo={geo} i={sorting ? -1 : geo.idx(g.turn || '')} />
            <View style={{ position: 'absolute', left: geo.cx - geo.u * 14, width: geo.u * 28, top: geo.cy - geo.u * 4, alignItems: 'center' }}>
              <Text style={st.big}>{g.thrown.length}</Text>
              <Text style={st.small}>cards thrown away</Text>
            </View>
            {P.map((p, i) => {
              const sd = g.seats.find((x: any) => x.id === p.id);
              return <Seat key={p.id} geo={geo} i={i} name={p.name} count={sd?.count} me={p.id === me} off={!p.connected}
                badge={sorting ? (sd?.ready ? '✓ done' : 'sorting…') : undefined}
                active={!sorting && (g.turn === p.id || pk?.fromId === p.id && false)}
                timerMs={g.timer && g.timer.pid === p.id ? g.timer.ms : null} />;
            })}
            <DealFx geo={geo} run={sorting && g.thrown.length === 0} />
            <Fx geo={geo} g={g} />
          </>
        )}
      </Ring>

      <Text style={st.hint}>{hint}</Text>
      {sorting && g.sortMs > 0 && <View style={{ paddingHorizontal: 16 }}><TimerBar ms={g.sortMs} total={90000} /></View>}
      {!sorting && g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: 16 }}><TimerBar ms={g.timer.ms} /></View>}

      {myTurn && pk && (
        <View style={st.panel}>
          <View style={st.backs}>{Array.from({ length: pk.n }).map((_, i) => <Card key={i} back w={44} onPress={() => act('draw', { i })} />)}</View>
        </View>
      )}
      {sorting && !g.you.done && <Btn title="Done" kind="green" disabled={g.you.pairs} style={{ marginHorizontal: 14, paddingVertical: 10, marginBottom: 2 }} onPress={() => act('done')} />}

      {thrown.length > 0 && (
        <View style={st.thrown}>
          <Text style={st.small}>Thrown away</Text>
          <ScrollView style={{ maxHeight: 64 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {thrown.map((c, i) => <Card key={c + i} id={c} w={22} />)}
          </ScrollView>
        </View>
      )}
      <Hand cards={hand} selected={pick ? [pick] : []} glow={glow} animateIn={sorting && g.thrown.length === 0} onTap={sorting && !g.you.done ? onTap : undefined} />
    </View>
  );
}

const st = StyleSheet.create({
  hint: { color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 14, minHeight: 24, fontWeight: '800' },
  big: { color: C.gold, fontSize: 26, fontWeight: '900' },
  small: { color: C.dim, fontSize: 11, textAlign: 'center' },
  panel: { marginHorizontal: 12, marginBottom: 4, padding: 8, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.45)', borderWidth: 1, borderColor: C.gold },
  backs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  thrown: { marginHorizontal: 12, marginBottom: 2, padding: 6, borderRadius: 12, backgroundColor: 'rgba(0,0,0,.28)' },
});
