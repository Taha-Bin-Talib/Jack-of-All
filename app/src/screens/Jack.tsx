import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { act } from '../net';
import { AppText, CardHand, DealFx, EventToast, FlipCard, GameActionButton, GamePanel, GameTable, Geo, NoticeBar, PlayerStatus, PlayingCard, ScoreBoard, TurnIndicator, TurnTimer, VisibilityTag, colors, radii, spacing, useFlights, useGameNotice } from '../design';
import { fontFamily } from '../design/typography';
import { playSfx, useGameSfx } from '../sfx';
import { nameOf, rankLabel, rankOf, suitOf } from '../ui';
import type { RoomState } from '../types';

/* a card flies from the drawn-from player to the drawer; thrown pairs fly to the middle */
function Fx({ geo, g }: { geo: Geo; g: any }) {
  const { push, layer } = useFlights();
  const seen = React.useRef<number | null>(g.last ? g.last.id : 0);
  const thrown = React.useRef<number>(g.thrown.length);
  React.useEffect(() => {
    const l = g.last;
    if (l && l.id !== seen.current) {
      seen.current = l.id;
      push([{ from: geo.seat(geo.idx(l.fromId)), to: geo.seat(geo.idx(l.pid)), w: geo.u * 8, id: l.card ?? undefined, back: !l.card, duration: 600, fade: true, court: true }]);
    }
  }, [g.last?.id]);
  React.useEffect(() => {
    const was = thrown.current; thrown.current = g.thrown.length;
    if (g.stage === 'sort' || g.thrown.length < was + 2) return;
    const who = geo.idx(g.turn || ''), from = who >= 0 ? geo.seat(who) : geo.center;
    push(g.thrown.slice(-2).map((c: string, k: number) => ({ from, to: geo.center, w: geo.u * 8, id: c, back: false, delay: k * 80, duration: 560, fade: true, court: true })));
  }, [g.thrown.length]);
  return <>{layer}</>;
}

/* Jack Thief: suspense. Everyone throws their own pairs in the open; then you draw blind from your neighbour. Every Jack is drawn as a court card. */
export default function Jack({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const sorting = g.stage === 'sort';
  const { notice, show } = useGameNotice();
  useGameSfx(g, me);
  const [fresh] = React.useState(sorting);          // dealt on first view, even if computer players sort at once
  const [pick, setPick] = React.useState<string | null>(null);
  React.useEffect(() => { setPick(null); }, [g.stage, g.last?.id]);
  const myTurn = g.you.mustDraw, pk = g.pick, resolving = !!g.you.resolving, drawn: string | null = g.you.drawn || null;
  const throwing = (sorting && !g.you.done) || resolving;
  // while sorting (or checking a drawn card) the hand is shown by rank so pairs are easy to see
  const hand: string[] = [...g.you.hand].sort((a, b) => rankOf(a) - rankOf(b));
  const counts: Record<number, number> = {};
  for (const c of hand) counts[rankOf(c)] = (counts[rankOf(c)] || 0) + 1;
  const glow = sorting || resolving ? hand.filter(c => counts[rankOf(c)] > 1) : [];
  const onTap = (c: string) => {
    if (!throwing) return show(g.stage === 'turn' ? 'Wait for your turn to draw.' : 'You can’t throw cards right now.');
    if (pick === c) return setPick(null);
    if (pick && rankOf(pick) === rankOf(c)) { act('throw', { cards: [pick, c] }); return setPick(null); }
    if (pick && rankOf(pick) !== rankOf(c)) show('Those two are not a pair — a pair is two cards of the same rank.');
    setPick(c);
  };
  const thrown: string[] = [...g.thrown].sort((a, b) => rankOf(a) - rankOf(b));
  const SYM: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const drawnName = drawn ? `${rankLabel(rankOf(drawn))}${SYM[suitOf(drawn)]}` : '';
  const resolver = g.turn && !myTurn ? nameOf(P, g.turn) : '';
  const hint = resolving ? (g.you.pairs ? `You picked ${drawnName} — tap the two matching cards to throw the pair away` : `You picked ${drawnName} — no pair, tap Done`)
    : g.stage === 'resolve' && resolver ? `${resolver} picked a card and is checking for a pair…`
    : sorting ? (g.you.done ? 'Waiting for the others to finish…' : g.you.pairs ? 'Tap two cards of the same rank to throw the pair away' : 'No pairs left — tap Done')
    : myTurn ? `Your turn — draw a card from ${nameOf(P, pk.fromId)}` : pk ? `${nameOf(P, pk.pid)} is drawing from ${nameOf(P, pk.fromId)}` : '';
  const rows = P.map(p => { const sd = g.seats.find((x: any) => x.id === p.id); return { id: p.id, name: p.name, count: sd?.count, me: p.id === me, away: !p.connected, active: g.turn === p.id, tag: sorting ? (sd?.ready ? 'done' : 'sorting') : undefined }; });
  return (
    <View style={{ flex: 1 }}>
      <ScoreBoard rows={rows} label={sorting ? 'Sorting pairs' : 'Cards left (public)'} />
      <View style={{ flex: 1, marginBottom: 30 }}>
      <EventToast ev={g.event} />
      <GameTable players={P} meId={me} tone="jack">
        {geo => (
          <>
            <TurnIndicator geo={geo} i={sorting ? -1 : geo.idx(g.turn || '')} />
            <View style={{ position: 'absolute', left: geo.cx - geo.u * 14, width: geo.u * 28, top: geo.cy - geo.u * 5, alignItems: 'center' }} pointerEvents="none">
              <AppText style={{ fontFamily: fontFamily.bold, color: colors.gold, fontSize: Math.max(24, geo.u * 7) }}>{g.thrown.length}</AppText>
              <AppText variant="caption" tone="muted" style={{ fontSize: Math.max(10, geo.u * 2.6) }}>cards thrown away</AppText>
            </View>
            {P.map((p, i) => {
              const sd = g.seats.find((x: any) => x.id === p.id);
              const next = !sorting && pk && pk.fromId === p.id ? `${nameOf(P, pk.pid).split(' ')[0]} draws here` : undefined;
              return <PlayerStatus key={p.id} geo={geo} i={i} name={p.name} count={sd?.count} me={p.id === me} off={!p.connected}
                badge={sorting ? (sd?.ready ? '✓ done' : 'sorting…') : next}
                active={!sorting && g.turn === p.id}
                timerMs={g.timer && g.timer.pid === p.id ? g.timer.ms : null} />;
            })}
            <DealFx geo={geo} run={fresh} />
            <Fx geo={geo} g={g} />
          </>
        )}
      </GameTable>
      </View>

      <AppText variant="title" style={st.hint} numberOfLines={2}>{hint}</AppText>
      <NoticeBar notice={notice} />
      {sorting && g.sortMs > 0 && <View style={{ paddingHorizontal: spacing.lg }}><TurnTimer ms={g.sortMs} total={90000} /></View>}
      {!sorting && g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: spacing.lg }}><TurnTimer ms={g.timer.ms} /></View>}

      {myTurn && pk && (
        <GamePanel title={`Draw one from ${nameOf(P, pk.fromId)}`}>
          <View style={st.backs}>{Array.from({ length: pk.n }).map((_, i) => <PlayingCard key={i} faceDown width={44} onPress={() => act('draw', { i })} />)}</View>
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center', marginTop: spacing.sm }}>You can’t see these cards — pick any one.</AppText>
        </GamePanel>
      )}
      {resolving && drawn && (
        <GamePanel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <FlipCard key={g.last?.id} id={drawn} width={46} court />
            <View style={{ flex: 1 }}>
              <AppText variant="label" tone="muted">You picked</AppText>
              <AppText variant="bodySm" style={{ marginBottom: spacing.sm }}>{g.you.pairs ? 'Throw the new pair away, then tap Done.' : 'No pair — tap Done.'}</AppText>
              <GameActionButton title="Done" disabled={g.you.pairs} onPress={() => act('done')} />
            </View>
          </View>
        </GamePanel>
      )}
      {sorting && !g.you.done && <GameActionButton title="Done" disabled={g.you.pairs} style={{ marginHorizontal: spacing.md, marginBottom: spacing.xs }} onPress={() => act('done')} />}

      {thrown.length > 0 && (
        <View style={st.thrown}>
          <AppText variant="label" tone="muted" style={{ textAlign: 'center', marginBottom: 2 }}>Thrown away · public</AppText>
          <ScrollView style={{ maxHeight: 56 }} nestedScrollEnabled contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {thrown.map((c, i) => <PlayingCard key={c + i} id={c} width={20} />)}
          </ScrollView>
        </View>
      )}
      <VisibilityTag kind="private" text="Your hand · only you" />
      <CardHand cards={hand} selected={pick ? [pick] : []} glow={glow} court animateIn={fresh} onTap={onTap} />
    </View>
  );
}

const st = StyleSheet.create({
  hint: { textAlign: 'center', paddingHorizontal: spacing.lg, minHeight: 24, fontFamily: fontFamily.semibold },
  backs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  thrown: { marginHorizontal: spacing.md, marginBottom: 2, padding: 6, borderRadius: radii.md, backgroundColor: 'rgba(14,30,25,.6)' },
});
