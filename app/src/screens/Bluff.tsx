import React from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { act } from '../net';
import { Btn, Card, TimerBar, Toast, nameOf, rankLabel } from '../ui';
import { DealFx, Geo, Hand, PileStack, Ring, Seat, useFlights } from '../table/Table';
import type { RoomState } from '../types';

const RANKS = [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

function Fx({ geo, g }: { geo: Geo; g: any }) {
  const { push, layer } = useFlights();
  const lastId = React.useRef<number | null>(g.last ? g.last.id : 0);
  const prev = React.useRef({ pile: g.pile, reveal: g.reveal });
  React.useEffect(() => {
    if (g.last && g.last.id !== lastId.current) {            // cards fly from the player into the pile
      lastId.current = g.last.id;
      push(Array.from({ length: g.last.n }).map((_, k) => ({ from: geo.seat(geo.idx(g.last.pid)), to: geo.center, w: geo.u * 8, delay: k * 90, duration: 420, fade: true })));
    }
    const p = prev.current;
    if (p.reveal && !g.reveal && g.phase === 'playing') {      // the pile goes to whoever lost the challenge
      const to = geo.seat(geo.idx(p.reveal.loserId));
      push(Array.from({ length: Math.min(6, p.reveal.taken) }).map((_, k) => ({ from: geo.center, to, w: geo.u * 8, delay: k * 70, duration: 520, fade: true })));
    } else if (p.pile > 0 && g.pile === 0 && !p.reveal && !g.reveal) {   // everybody passed: pile is thrown away
      push(Array.from({ length: Math.min(5, p.pile) }).map((_, k) => ({ from: geo.center, to: { x: geo.w + 40, y: geo.cy - geo.u * 10 }, w: geo.u * 8, delay: k * 60, duration: 550, fade: true })));
    }
    prev.current = { pile: g.pile, reveal: g.reveal };
  }, [g.last?.id, g.pile, g.reveal]);
  return <>{layer}</>;
}

export default function Bluff({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const [sel, setSel] = React.useState<string[]>([]);
  const [rk, setRk] = React.useState<number | null>(null);
  React.useEffect(() => { setSel([]); setRk(null); }, [g.turn, g.stage]);
  const myTurn = g.turn === me, opening = myTurn && g.stage === 'open', responding = myTurn && g.stage === 'respond';
  const max = opening ? 4 : responding ? 2 : 0;
  const toggle = (c: string) => setSel(s => s.includes(c) ? s.filter(x => x !== c) : s.length >= max ? [...s.slice(1), c] : [...s, c]);
  const fresh = !g.last && g.stage === 'open' && !g.claim;
  const claim = g.claim;
  const hint = g.reveal ? '' : opening ? 'You open — choose a rank and 1 to 4 cards' : responding ? 'Call bluff, add 1–2 cards, or pass' : g.turn ? `${nameOf(P, g.turn)}'s turn` : '';
  return (
    <View style={{ flex: 1 }}>
      <Toast ev={g.event} />
      <Ring players={P} meId={me}>
        {geo => (
          <>
            <PileStack geo={geo} count={g.pile} />
            {claim && g.pile > 0 && (
              <View style={{ position: 'absolute', left: geo.cx - geo.u * 17, width: geo.u * 34, top: geo.cy + geo.u * 8, alignItems: 'center' }}>
                <Text style={st.claim}>{claim.count} × {claim.name}{claim.count > 1 ? 's' : ''}</Text>
              </View>
            )}
            {P.map((p, i) => {
              const sd = g.seats.find((x: any) => x.id === p.id);
              return <Seat key={p.id} geo={geo} i={i} name={p.name} count={sd?.count} me={p.id === me} off={!p.connected}
                active={g.turn === p.id} timerMs={g.timer && g.timer.pid === p.id ? g.timer.ms : null} />;
            })}
            <DealFx geo={geo} run={fresh} />
            <Fx geo={geo} g={g} />
          </>
        )}
      </Ring>

      {g.reveal ? (
        <View style={st.panel}>
          <Text style={[st.pT, { color: g.reveal.truthful ? '#7be29f' : '#ff8a80' }]}>{nameOf(P, g.reveal.callerId)} called — {g.reveal.truthful ? 'TRUTH!' : 'BLUFF!'}</Text>
          <View style={st.row}>{g.reveal.cards.map((c: string) => <Card key={c} id={c} w={46} />)}</View>
          <Text style={st.pS}>{nameOf(P, g.reveal.loserId)} picks up {g.reveal.taken} cards</Text>
        </View>
      ) : (
        <>
          <Text style={st.hint}>{claim && g.pile > 0 ? `Claim: ${claim.count} × ${claim.name}${claim.count > 1 ? 's' : ''} · ` : ''}{hint}</Text>
          {g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: 16 }}><TimerBar ms={g.timer.ms} /></View>}
          {opening && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 10, gap: 6, paddingVertical: 4 }}>
                {RANKS.map(r => (
                  <Pressable key={r} onPress={() => setRk(r)} style={[st.chip, rk === r && st.chipOn]}><Text style={[st.chipT, rk === r && { color: '#1d1405' }]}>{rankLabel(r)}</Text></Pressable>
                ))}
              </ScrollView>
              <Btn title={sel.length && rk ? `Play ${sel.length} as ${sel.length} × ${rankLabel(rk)}` : rk ? 'Select 1–4 cards' : 'Choose a rank above'} disabled={!sel.length || !rk}
                style={{ marginHorizontal: 14, marginTop: 4, paddingVertical: 10 }} onPress={() => { act('open', { rank: rk, cards: sel }); setSel([]); }} />
            </>
          )}
          {responding && (
            <View style={st.respond}>
              <Btn title="Call BLUFF" kind="danger" disabled={!g.you.canCall} style={{ flex: 1, paddingHorizontal: 6 }} onPress={() => act('call')} />
              <Btn title={sel.length ? `Add ${sel.length}` : 'Add 1–2'} disabled={!sel.length} style={{ flex: 1, paddingHorizontal: 6 }} onPress={() => { act('add', { cards: sel }); setSel([]); }} />
              <Btn title="Pass" kind="ghost" style={{ flex: 1, paddingHorizontal: 6 }} onPress={() => act('pass')} />
            </View>
          )}
        </>
      )}
      <Hand cards={g.you.hand} selected={sel} animateIn={fresh} onTap={max ? toggle : undefined} />
    </View>
  );
}

const st = StyleSheet.create({
  hint: { color: C.text, fontSize: 13, textAlign: 'center', paddingHorizontal: 14, minHeight: 20, fontWeight: '600' },
  claim: { color: C.gold, fontWeight: '900', fontSize: 15, textShadowColor: '#000', textShadowRadius: 4 },
  panel: { marginHorizontal: 12, marginBottom: 4, padding: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.45)', borderWidth: 1, borderColor: C.gold },
  pT: { color: C.gold, fontWeight: '900', fontSize: 16, textAlign: 'center' },
  pS: { color: C.text, fontSize: 13, textAlign: 'center', marginTop: 4 },
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 },
  respond: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 4 },
  chip: { minWidth: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: C.dim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  chipOn: { backgroundColor: C.gold, borderColor: C.gold },
  chipT: { color: C.text, fontWeight: '800', fontSize: 16 },
});
