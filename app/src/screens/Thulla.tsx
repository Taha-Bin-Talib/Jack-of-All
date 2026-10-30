import React from 'react';
import { Text, View, LayoutChangeEvent, StyleSheet } from 'react-native';
import { C } from '../theme';
import { act } from '../net';
import { Btn, Card, TimerBar, Toast, nameOf } from '../ui';
import { Hand, SeatChip } from './Common';
import type { RoomState } from '../types';

const SUIT: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

export default function Thulla({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const n = P.length, myIdx = Math.max(0, P.findIndex(p => p.id === me));
  const rx = box.w * 0.40, ry = box.h * 0.38, cx = box.w / 2, cy = box.h / 2;
  const cw = Math.max(30, Math.min(48, box.w / 8.5)), ch = cw * 1.4;
  const ang = (i: number) => (Math.PI / 2) + ((((i - myIdx) % n) + n) % n) * 2 * Math.PI / n;
  const turnName = nameOf(P, g.turn), myTurn = g.turn === me;
  const seatOf = (id: string) => g.seats.find((x: any) => x.id === id);
  const hint = g.stage === 'consent' ? (g.consent.targetId === me ? 'Answer the request below' : `${nameOf(P, g.consent.pid)} is asking ${nameOf(P, g.consent.targetId)}…`)
    : g.stage === 'pick' ? (g.you.mustPick ? 'Pick one of their cards' : `${nameOf(P, g.pick.pid)} is picking a card`)
    : g.stage === 'settle' ? (g.settle?.text ?? '') : myTurn ? (g.firstTrick ? 'Your turn — first round' : 'Your turn') : turnName ? `${turnName}'s turn` : '';
  return (
    <View style={{ flex: 1 }}>
      <Toast ev={g.event} />
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {box.w > 0 && (
          <>
            <View style={[st.table, { left: cx - rx - 10, top: cy - ry - 10, width: 2 * rx + 20, height: 2 * ry + 20, borderRadius: 999 }]} />
            <View style={{ position: 'absolute', left: cx - 70, top: cy - 22, width: 140, alignItems: 'center' }}>
              <Text style={st.center}>{g.leadSuit ? `Lead ${SUIT[g.leadSuit]}` : g.duel ? '⚔ Final duel' : ' '}</Text>
              <Text style={st.sub}>{hint}</Text>
            </View>
            {P.map((p, i) => {
              const a = ang(i), x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a), sd = seatOf(p.id);
              const play = g.plays.find((q: any) => q.pid === p.id);
              const px = cx + rx * 0.5 * Math.cos(a), py = cy + ry * 0.5 * Math.sin(a);
              return (
                <React.Fragment key={p.id}>
                  <View style={{ position: 'absolute', left: x - 48, top: y - 18, width: 96, alignItems: 'center' }}>
                    <SeatChip name={p.id === me ? 'You' : p.name} count={sd?.count} active={g.turn === p.id || g.pick?.pid === p.id} off={!p.connected} out={sd?.out} small />
                  </View>
                  {play && <View style={{ position: 'absolute', left: px - cw / 2, top: py - ch / 2 }}><Card id={play.card} w={cw} /></View>}
                </React.Fragment>
              );
            })}
          </>
        )}
      </View>

      {g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: 16 }}><TimerBar ms={g.timer.ms} /></View>}

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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            {Array.from({ length: g.pick.n }).map((_, i) => <Card key={i} back w={44} onPress={() => act('pick', { i })} />)}
          </View>
        </View>
      )}

      {g.you.reveal && (
        <View style={st.panel}>
          <Text style={st.pT}>{g.you.reveal.name}'s hand</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 6 }}>
            {g.you.reveal.hand.map((c: string) => <Card key={c} id={c} w={34} />)}
          </View>
        </View>
      )}

      {g.you.canRequest && (
        <Btn title={`Ask ${g.you.requestTarget} for their hand`} kind="ghost" style={{ marginHorizontal: 16, marginBottom: 6, paddingVertical: 8 }} onPress={() => act('request')} />
      )}

      <Hand cards={g.you.hand} legal={myTurn ? g.you.legal : undefined} onTap={c => act('play', { card: c })} />
      {g.you.hand.length === 0 && <Text style={st.sub}>You are out — safe!</Text>}
    </View>
  );
}

const st = StyleSheet.create({
  table: { position: 'absolute', backgroundColor: C.felt, borderWidth: 8, borderColor: C.rim },
  center: { color: C.gold, fontWeight: '900', fontSize: 16, textAlign: 'center' },
  sub: { color: C.text, fontSize: 12, textAlign: 'center', marginTop: 2 },
  panel: { marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.45)', borderWidth: 1, borderColor: C.gold },
  pT: { color: C.gold, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  pS: { color: C.text, fontSize: 13, textAlign: 'center', marginVertical: 4 },
});
