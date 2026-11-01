import React from 'react';
import { StyleSheet, View } from 'react-native';
import { act } from '../net';
import { AppText, CardHand, DealFx, EventToast, GameActionButton, GamePanel, GameTable, Geo, NoticeBar, PileStack, PlayerStatus, PlayingCard, ScoreBoard, TurnIndicator, TurnTimer, VisibilityTag, Fly, colors, spacing, useFlights, useGameNotice } from '../design';
import { fontFamily } from '../design/typography';
import { Suit, nameOf } from '../ui';
import type { RoomState } from '../types';

const SUIT: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/* effects: the finished trick sweeping to the winner / the discard pile */
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

/* Bhabhi Thulla: survival. Tracker of who still holds cards, the lead suit in the middle, the cards played on the rim. */
export default function Thulla({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const myTurn = g.turn === me;
  const { notice, show } = useGameNotice();
  const fresh = g.trickNo <= 1 && g.plays.length <= 1 && !g.lastTrick;
  const seat = (id: string) => g.seats.find((x: any) => x.id === id);
  const lead = g.leadSuit && g.stage === 'turn' ? g.leadSuit : null;
  const hint = g.stage === 'consent' ? (g.consent.targetId === me ? 'Answer the request below' : `${nameOf(P, g.consent.pid)} is asking ${nameOf(P, g.consent.targetId)} for their hand…`)
    : g.stage === 'pick' ? (g.you.mustPick ? 'Pick one of their cards' : `${nameOf(P, g.pick.pid)} is picking a card`)
    : g.stage === 'settle' ? (g.settle?.text ?? '') : myTurn ? (g.firstTrick ? 'Your turn — first round: follow ♠ or throw a card below 10' : g.leadSuit ? `Your turn — follow ${SUIT[g.leadSuit]}` : 'Your turn — lead any card')
    : g.turn ? `${nameOf(P, g.turn)}'s turn` : '';
  const invalid = () => show(!myTurn ? 'Wait for your turn.' : g.firstTrick ? 'First round: follow ♠, or throw a card below 10.' : g.leadSuit ? `You must follow ${SUIT[g.leadSuit]} — you still hold one.` : 'That card can’t be played right now.');
  const rows = P.map(p => { const sd = seat(p.id); return { id: p.id, name: p.name, count: sd?.count, out: sd?.out, me: p.id === me, away: !p.connected, active: g.turn === p.id || g.pick?.pid === p.id || g.consent?.targetId === p.id }; });
  return (
    <View style={{ flex: 1 }}>
      <ScoreBoard rows={rows} label="Still in the game" />
      <View style={{ flex: 1, marginBottom: 30 }}>
      <EventToast ev={g.event} />
      <GameTable players={P} meId={me} tone="thulla">
        {geo => (
          <>
            <PileStack geo={geo} count={g.discarded > 0 ? g.discarded : 0} />
            {lead && (
              <View style={[st.lead, { left: geo.cx - geo.u * 7, top: geo.cy + geo.u * 6, width: geo.u * 14 }]} pointerEvents="none">
                <Suit s={lead} size={geo.u * 4.4} color={lead === 'H' || lead === 'D' ? colors.table.bad : colors.text} />
                <AppText variant="caption" tone="muted" style={{ fontSize: Math.max(9, geo.u * 2.4) }}>Lead</AppText>
              </View>
            )}
            <TurnIndicator geo={geo} i={geo.idx(g.turn || g.pick?.pid || g.consent?.targetId || '')} />
            {P.map((p, i) => {
              const sd = seat(p.id), play = g.plays.find((q: any) => q.pid === p.id);
              return (
                <React.Fragment key={p.id}>
                  <PlayerStatus geo={geo} i={i} name={p.name} count={sd?.count} me={p.id === me} off={!p.connected} out={sd?.out}
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
      </GameTable>
      </View>

      <AppText variant="title" style={st.hint} numberOfLines={2}>{g.duel ? 'Final duel · ' : ''}{hint}</AppText>
      <NoticeBar notice={notice} />

      {g.stage === 'consent' && g.you.mustAnswer && (
        <GamePanel title={`${nameOf(P, g.consent.pid)} asks for your hand`}>
          <AppText variant="bodySm" tone="muted" style={{ textAlign: 'center', marginBottom: spacing.sm }}>Give all your cards away and be out of the game?</AppText>
          <TurnTimer ms={g.consent.ms} total={15000} />
          <View style={st.row}>
            <GameActionButton title="Give" flex onPress={() => act('respond', { accept: true })} />
            <GameActionButton title="Refuse" kind="danger" flex onPress={() => act('respond', { accept: false })} />
          </View>
        </GamePanel>
      )}
      {g.you.mustPick && (
        <GamePanel title={`Pick a card from ${nameOf(P, g.pick.fromId)}`}>
          <View style={st.backs}>{Array.from({ length: g.pick.n }).map((_, i) => <PlayingCard key={i} faceDown width={44} onPress={() => act('pick', { i })} />)}</View>
        </GamePanel>
      )}
      {g.you.reveal && (
        <GamePanel title={`${g.you.reveal.name}'s hand`}>
          <View style={st.backs}>{g.you.reveal.hand.map((c: string) => <PlayingCard key={c} id={c} width={34} />)}</View>
        </GamePanel>
      )}
      {g.you.canRequest && <GameActionButton title={`Ask ${g.you.requestTarget} for their hand`} kind="quiet" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.xs }} onPress={() => act('request')} />}
      {g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: spacing.lg, marginBottom: 2 }}><TurnTimer ms={g.timer.ms} /></View>}

      <VisibilityTag kind="private" text="Your hand · only you" />
      <CardHand cards={g.you.hand} legal={myTurn ? g.you.legal : undefined} animateIn={fresh} onTap={c => (myTurn ? act('play', { card: c }) : invalid())} onInvalid={invalid} />
      {g.you.hand.length === 0 && <AppText variant="title" tone="gold" style={st.hint}>You are out — safe!</AppText>}
    </View>
  );
}

const st = StyleSheet.create({
  hint: { textAlign: 'center', paddingHorizontal: spacing.lg, minHeight: 24, fontFamily: fontFamily.semibold },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  backs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  lead: { position: 'absolute', alignItems: 'center' },
});
