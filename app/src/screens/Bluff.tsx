import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { act } from '../net';
import { AppText, CardHand, DealFx, EventToast, FlipCard, GameActionButton, GamePanel, GameTable, Geo, NoticeBar, PileStack, PlayerStatus, ScoreBoard, TurnIndicator, TurnTimer, VisibilityTag, borders, colors, radii, spacing, useFlights, useGameNotice } from '../design';
import { fontFamily } from '../design/typography';
import { nameOf, rankLabel, rankOf } from '../ui';
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

/* Bluff: hidden information. The face-down pile and the spoken claim are public; your hand is private. */
export default function Bluff({ room }: { room: RoomState }) {
  const g = room.g, me = room.you.id, P = room.players;
  const { notice, show } = useGameNotice();
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
  const say = sel.length && rk ? `“${plural(rk, sel.length)}”` : '';
  const rows = P.map(p => { const sd = g.seats.find((x: any) => x.id === p.id); return { id: p.id, name: p.name, count: sd?.count, out: sd?.out, me: p.id === me, away: !p.connected, active: g.turn === p.id }; });
  const tapCard = (c: string) => { if (max) toggle(c); else show(g.reveal ? 'Wait — the cards are being revealed.' : `Wait for ${nameOf(P, g.turn)} — it is not your turn.`); };
  return (
    <View style={{ flex: 1 }}>
      <ScoreBoard rows={rows} label="Cards in hand (public)" />
      <View style={{ flex: 1, marginBottom: 30 }}>
      <EventToast ev={g.event} />
      <GameTable players={P} meId={me} tone="bluff">
        {geo => (
          <>
            <PileStack geo={geo} count={g.pile} />
            <TurnIndicator geo={geo} i={geo.idx(g.turn || '')} />
            {claim && g.pile > 0 && (
              <View style={[st.claim, { left: geo.cx - geo.u * 13, width: geo.u * 26, top: geo.cy + geo.u * 7 }]} pointerEvents="none">
                <AppText style={{ fontFamily: fontFamily.display, fontSize: Math.max(13, geo.u * 3.6), color: colors.card.ink }} numberOfLines={1}>“{claimTxt}”</AppText>
              </View>
            )}
            {P.map((p, i) => {
              const sd = g.seats.find((x: any) => x.id === p.id);
              return <PlayerStatus key={p.id} geo={geo} i={i} name={p.name} count={sd?.count} out={sd?.out} me={p.id === me} off={!p.connected}
                active={g.turn === p.id} timerMs={g.timer && g.timer.pid === p.id ? g.timer.ms : null} />;
            })}
            <DealFx geo={geo} run={fresh} />
            <Fx geo={geo} g={g} />
          </>
        )}
      </GameTable>
      </View>
      <View style={st.vis}><VisibilityTag kind="public" text={g.pile > 0 ? `Pile · ${g.pile} face-down${claim ? ' · claim: ' + claimTxt : ''}` : 'Pile · empty'} /></View>
      <NoticeBar notice={notice} />

      {g.reveal ? (
        <GamePanel title={`${nameOf(P, g.reveal.callerId)} called — ${g.reveal.truthful ? 'TRUTH!' : 'BLUFF!'}`} accent={g.reveal.truthful ? colors.table.good : colors.table.bad}>
          <View style={st.revealRow}>{g.reveal.cards.map((c: string, i: number) => <FlipCard key={c} id={c} width={46} delay={i * 160} />)}</View>
          <AppText variant="bodySm" tone="muted" style={{ textAlign: 'center', marginTop: spacing.sm }}>{nameOf(P, g.reveal.loserId)} picks up {g.reveal.taken} cards</AppText>
        </GamePanel>
      ) : (
        <>
          {opening ? (
            <GamePanel title="Your turn — open the round">
              <AppText variant="bodySm" style={{ textAlign: 'center' }}><AppText variant="bodySm" tone="gold">1</AppText>  Tap 1 to 4 cards{sel.length ? ` · ${sel.length} selected` : ''}     <AppText variant="bodySm" tone="gold">2</AppText>  Say what they are (you may bluff)</AppText>
              <View style={st.ranks}>
                {RANKS.map(r => (
                  <Pressable key={r} hitSlop={5} accessibilityLabel={`Declare ${r}`} accessibilityRole="button" accessibilityState={{ selected: rk === r }} onPress={() => setRk(r)} style={[st.chip, rk === r && st.chipOn]}>
                    <AppText style={{ fontFamily: fontFamily.display, fontSize: 16, color: rk === r ? colors.onGold : colors.text }}>{rankLabel(r)}</AppText>
                  </Pressable>
                ))}
              </View>
              <GameActionButton title={say ? `Play ${sel.length} card${sel.length > 1 ? 's' : ''} — say ${say}` : !sel.length ? 'Pick your cards first' : 'Now pick a rank'} disabled={!sel.length || !rk}
                style={{ marginTop: spacing.sm }} onPress={() => { act('open', { rank: rk, cards: sel }); setSel([]); }} />
            </GamePanel>
          ) : responding ? (
            <GamePanel title={`${nameOf(P, claim.by)} says: ${claimTxt}`}>
              <AppText variant="bodySm" tone="muted" style={{ textAlign: 'center', marginBottom: spacing.sm }}>Call their bluff, add 1–2 more cards to the pile, or pass{sel.length ? `  ·  ${sel.length} selected` : ''}</AppText>
              <View style={st.row}>
                <GameActionButton title="Call Bluff" kind="danger" flex disabled={!g.you.canCall} onPress={() => act('call')} />
                <GameActionButton title={sel.length ? `Add ${sel.length}` : 'Add 1–2'} flex disabled={!sel.length} onPress={() => { act('add', { cards: sel }); setSel([]); }} />
                <GameActionButton title="Pass" kind="quiet" flex onPress={() => act('pass')} />
              </View>
            </GamePanel>
          ) : (
            <AppText variant="title" style={st.hint}>{g.turn ? `Waiting for ${nameOf(P, g.turn)}…` : ''}</AppText>
          )}
          {g.timer && g.timer.pid === me && <View style={{ paddingHorizontal: spacing.lg, marginBottom: 2 }}><TurnTimer ms={g.timer.ms} /></View>}
        </>
      )}
      <VisibilityTag kind="private" text="Your hand · only you" />
      <CardHand cards={g.you.hand} selected={sel} animateIn={fresh} onTap={tapCard} />
    </View>
  );
}

const st = StyleSheet.create({
  hint: { textAlign: 'center', paddingHorizontal: spacing.lg, minHeight: 24, fontFamily: fontFamily.semibold },
  vis: { alignItems: 'center', marginVertical: 2 },
  claim: { position: 'absolute', alignItems: 'center', backgroundColor: colors.card.face, borderRadius: radii.sm, paddingVertical: 2, borderWidth: borders.hair, borderColor: colors.card.edge },
  row: { flexDirection: 'row', gap: spacing.sm },
  revealRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: spacing.sm },
  ranks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: spacing.sm },
  chip: { minWidth: 38, height: 40, borderRadius: radii.md, backgroundColor: '#2D5646', borderTopWidth: 1.5, borderTopColor: '#4A7A66', borderBottomWidth: 4, borderBottomColor: '#0D241C', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  chipOn: { backgroundColor: colors.gold, borderTopColor: '#DCC48C', borderBottomColor: '#7C6030', borderBottomWidth: 2, marginTop: 2 },
});
