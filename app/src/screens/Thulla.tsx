import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { C } from '../theme';
import { act } from '../net';
import { Btn, Card, TimerBar, Toast, nameOf } from '../ui';
import { DealFx, Fly, Geo, Hand, PileStack, Ring, Seat, TurnArrow, useFlights } from '../table/Table';
import type { RoomState } from '../types';

const SUIT: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/* effects: the deal at the start, and the finished trick sweeping to the winner / the discard pile */
function Fx({ geo, g }: { geo: Geo; g: any }) {
  const { push, layer } = useFlights();
  const seen = React.useRef<number | null>(g.lastTrick ? g.lastTrick.id : 0);
  React.useEffect(() => {
    const lt = g.lastTrick;
    if (!lt || lt.id === seen.current) return;
    seen.current = lt.id;
    const to = lt.kind === 'thulla' && lt.toId ? geo.seat(geo.idx(lt.toId)) : geo.center;
    push(lt.plays.map((pl: any, k: number) => ({ from: geo.slot(geo.idx(pl.pid)), to, w: geo.cw, id: pl.card, back: false, delay: k * 60, duration: 650, fade: true })));
  }, [g.lastTrick?.id]);
  return <>{layer}</>;
}

export default function Thulla({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const myTurn = g.turn === me;
  const fresh = g.trickNo <= 1 && g.plays.length <= 1 && !g.lastTrick;
  const seat = (id: string) => g.seats.find((x: any) => x.id === id);
  const hint = g.stage === 'consent' ? (g.consent.targetId === me ? 'Answer the request below' : `${nameOf(P, g.consent.pid)} is asking ${nameOf(P, g.consent.targetId)} for their hand…`)
    : g.stage === 'pick' ? (g.you.mustPick ? 'Pick one of their cards' : `${nameOf(P, g.pick.pid)} is picking a card`)
    : g.stage === 'settle' ? (g.settle?.text ?? '') : myTurn ? (g.firstTrick ? 'Your turn — first round: follow ♠ or throw a card below 10' : g.leadSuit ? `Your turn — follow ${SUIT[g.leadSuit]}` : 'Your turn — lead any card')
    : g.turn ? `${nameOf(P, g.turn)}'s turn` : '';
  return (
    <View style={{ flex: 1 }}>
      <Toast ev={g.event} />
      <Ring players={P} meId={me}>
        {geo => (
          <>
            <PileStack geo={geo} count={g.discarded > 0 ? g.discarded : 0} />
            <TurnArrow geo={geo} i={geo.idx(g.turn || g.pick?.pid || g.consent?.targetId || '')} />
            {P.map((p, i) => {
              const sd = seat(p.id), play = g.plays.find((q: any) => q.pid === p.id);
              return (
                <React.Fragment key={p.id}>
                  <Seat geo={geo} i={i} name={p.name} count={sd?.count} me={p.id === me} off={!p.connected} out={sd?.out}
                    active={g.turn === p.id || g.pick?.pid === p.id || g.consent?.targetId === p.id}
                    timerMs={g.timer && g.timer.pid === p.id ? g.timer.ms : null} />
                  {play && <Fly key={play.card} from={geo.seat(i)} to={geo.slot(i)} w={geo.cw} id={play.card} back={false} duration={360} rot={Math.round(-Math.cos(geo.deg(i) * Math.PI / 180) * 22 + (i % 2 ? 6 : -6))} />}
                </React.Fragment>
              );
            })}
            <DealFx geo={geo} run={fresh} />
            <Fx geo={geo} g={g} />
          </>
        )}
      </Ring>

      <Text style={st.hint}>{g.leadSuit && g.stage === 'turn' ? `Lead ${SUIT[g.leadSuit]} · ` : ''}{g.duel ? '⚔ Final duel · ' : ''}{hint}</Text>

      {g.stage === 'consent' && g.you.mustAnswer && (
        <View style={st.panel}>
          <Text style={st.pT}>{nameOf(P, g.consent.pid)} asks for your hand</Text>
          <Text style={st.pS}>Give all your cards away and be out of the game?</Text>
          <TimerBar ms={g.consent.ms} total={15000} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Btn title="Give" kind="green" style={{ flex: 1 }} onPress={() => act('respond', { accept: true })} />
            <Btn title="Refuse" kind="danger" style={{ flex: 1 }} onPress={() => act('respond', { accept: false })} />
          </View>
        </View>
      )}
      {g.you.mustPick && (
        <View style={st.panel}>
          <Text style={st.pT}>Pick a card from {nameOf(P, g.pick.fromId)}</Text>
          <View style={st.backs}>{Array.from({ length: g.pick.n }).map((_, i) => <Card key={i} back w={44} onPress={() => act('pick', { i })} />)}</View>
        </View>
      )}
      {g.you.reveal && (
        <View style={st.panel}>
          <Text style={st.pT}>{g.you.reveal.name}'s hand</Text>
          <View style={st.backs}>{g.you.reveal.hand.map((c: string) => <Card key={c} id={c} w={34} />)}</View>
        </View>
      )}
      {g.you.canRequest && <Btn title={`Ask ${g.you.requestTarget} for their hand`} kind="ghost" style={{ marginHorizontal: 16, marginBottom: 4, paddingVertical: 8 }} onPress={() => act('request')} />}

      <Hand cards={g.you.hand} legal={myTurn ? g.you.legal : undefined} animateIn={fresh} onTap={c => act('play', { card: c })} />
      {g.you.hand.length === 0 && <Text style={st.hint}>You are out — safe!</Text>}
    </View>
  );
}

const st = StyleSheet.create({
  hint: { color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 14, minHeight: 24, fontWeight: '800' },
  panel: { marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.45)', borderWidth: 1, borderColor: C.gold },
  pT: { color: C.gold, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  pS: { color: C.text, fontSize: 13, textAlign: 'center', marginVertical: 4 },
  backs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 },
});
