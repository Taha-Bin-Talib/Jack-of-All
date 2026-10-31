import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { act } from '../net';
import { Btn, Card, TimerBar, Toast, nameOf, rankLabel, rankOf } from '../ui';
import { DealFx, Geo, Hand, PileStack, Ring, Seat, TurnArrow, useFlights } from '../table/Table';
import type { RoomState } from '../types';

const RANKS = [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const NAME: Record<number, string> = { 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
const plural = (r: number, n: number) => `${n} ${NAME[r]}${n === 1 ? '' : r === 6 ? 'es' : 's'}`;

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
  // honest default: if every selected card has the same rank, pre-pick that rank (you can still change it)
  React.useEffect(() => {
    if (!opening || !sel.length) return;
    const rs = Array.from(new Set(sel.map(rankOf)));
    if (rs.length === 1) setRk(rs[0]);
  }, [sel.join(','), opening]);
  const fresh = !g.last && g.stage === 'open' && !g.claim;
  const claim = g.claim;
  const claimTxt = claim ? plural(claim.rank, claim.count) : '';
  const hint = g.reveal ? '' : opening ? '' : responding ? '' : g.turn ? `Waiting for ${nameOf(P, g.turn)}…` : '';
  const say = sel.length && rk ? `“${plural(rk, sel.length)}”` : '';
  return (
    <View style={{ flex: 1 }}>
      <Toast ev={g.event} />
      <Ring players={P} meId={me}>
        {geo => (
          <>
            <PileStack geo={geo} count={g.pile} />
            <TurnArrow geo={geo} i={geo.idx(g.turn || '')} />
            {claim && g.pile > 0 && (
              <View style={{ position: 'absolute', left: geo.cx - geo.u * 17, width: geo.u * 34, top: geo.cy + geo.u * 8, alignItems: 'center' }}>
                <Text style={st.claim}>{claimTxt}</Text>
              </View>
            )}
            {P.map((p, i) => {
              const sd = g.seats.find((x: any) => x.id === p.id);
              return <Seat key={p.id} geo={geo} i={i} name={p.name} count={sd?.count} out={sd?.out} me={p.id === me} off={!p.connected}
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
          {opening ? (
            <View style={st.panel}>
              <Text style={st.pT}>Your turn — open the round</Text>
              <Text style={st.step}><Text style={st.num}>1 </Text>Tap 1 to 4 cards from your hand{sel.length ? `  ·  ${sel.length} selected` : ''}</Text>
              <Text style={st.step}><Text style={st.num}>2 </Text>Say what they are (you may bluff)</Text>
              <View style={st.ranks}>
                {RANKS.map(r => (
                  <Pressable key={r} onPress={() => setRk(r)} style={[st.chip, rk === r && st.chipOn]}><Text style={[st.chipT, rk === r && { color: '#1d1405' }]}>{rankLabel(r)}</Text></Pressable>
                ))}
              </View>
              <Btn title={say ? `Play ${sel.length} card${sel.length > 1 ? 's' : ''} — say ${say}` : !sel.length ? 'Pick your cards first' : 'Now pick a rank'} disabled={!sel.length || !rk}
                style={{ marginTop: 8, paddingVertical: 11 }} onPress={() => { act('open', { rank: rk, cards: sel }); setSel([]); }} />
            </View>
          ) : responding ? (
            <View style={st.panel}>
              <Text style={st.pT}>{nameOf(P, claim.by)} says: {claimTxt}</Text>
              <Text style={st.pS}>Call their bluff, add 1–2 more cards to the pile, or pass{sel.length ? `  ·  ${sel.length} selected` : ''}</Text>
              <View style={st.respond}>
                <Btn title="Call BLUFF" kind="danger" disabled={!g.you.canCall} style={{ flex: 1, paddingHorizontal: 6, paddingVertical: 11 }} onPress={() => act('call')} />
                <Btn title={sel.length ? `Add ${sel.length}` : 'Add 1–2'} disabled={!sel.length} style={{ flex: 1, paddingHorizontal: 6, paddingVertical: 11 }} onPress={() => { act('add', { cards: sel }); setSel([]); }} />
                <Btn title="Pass" kind="ghost" style={{ flex: 1, paddingHorizontal: 6, paddingVertical: 11 }} onPress={() => act('pass')} />
              </View>
            </View>
          ) : (
            <Text style={st.hint}>{claim && g.pile > 0 ? `${claimTxt} · ` : ''}{hint}</Text>
          )}
          {g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: 16, marginBottom: 2 }}><TimerBar ms={g.timer.ms} /></View>}
        </>
      )}
      <Hand cards={g.you.hand} selected={sel} animateIn={fresh} onTap={max ? toggle : undefined} />
    </View>
  );
}

const st = StyleSheet.create({
  hint: { color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 14, minHeight: 24, fontWeight: '800' },
  claim: { color: C.gold, fontWeight: '900', fontSize: 16, textShadowColor: '#000', textShadowRadius: 4 },
  panel: { marginHorizontal: 12, marginBottom: 4, padding: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.45)', borderWidth: 1, borderColor: C.gold },
  pT: { color: C.gold, fontWeight: '900', fontSize: 16, textAlign: 'center', marginBottom: 4 },
  pS: { color: '#fff', fontSize: 13, textAlign: 'center', marginTop: 2, marginBottom: 6 },
  step: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4 },
  num: { color: C.gold, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 },
  ranks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: 6 },
  respond: { flexDirection: 'row', gap: 8 },
  chip: { minWidth: 38, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: C.dim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  chipOn: { backgroundColor: C.gold, borderColor: C.gold },
  chipT: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
