import React from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReduceMotion } from '../components/Motion';
import { colors, borders } from '../tokens';
import { fontFamily } from '../typography';
import { PlayingCard } from '../components/PlayingCard';
import { PlayerAvatar } from '../components/PlayerAvatar';

/* GameTable — an oval table: dark rim, deep-green felt, seats sitting on the rim, one flat hand of cards below.
   Geometry is in "units" (the ring is 100 × 76 units) so it scales to any phone; seats are placed around the oval
   with the viewer always at the bottom. Each game picks its own rim (`tone`) but they share one table. */
const UW = 100, UH = 76;
const FELT = { x: 43.4, y: 28.6 }, ORBIT = { x: 36, y: 21.5 }, SEAT = { x: 39, y: 30 }, SLOT = { x: 21, y: 10.2 };
export type Pt = { x: number; y: number };
export type Geo = {
  w: number; h: number; u: number; cx: number; cy: number; n: number; my: number; cw: number;
  seat: (i: number) => Pt; slot: (i: number) => Pt; idx: (id: string) => number; center: Pt;
  deg: (i: number) => number;                 // screen angle of a seat, in degrees
};
export type Tone = 'thulla' | 'bluff' | 'jack';
const RIM: Record<Tone, { rim: string; line: string; felt: string }> = {
  thulla: { rim: colors.table.wood, line: colors.gold, felt: colors.table.felt },
  bluff: { rim: colors.table.oxbloodRim, line: '#9B5A62', felt: colors.table.felt },
  jack: { rim: '#2A2F2B', line: colors.table.ivoryRim, felt: colors.table.feltDeep },
};

export function GameTable({ players, meId, tone = 'thulla', children }: { players: { id: string }[]; meId: string; tone?: Tone; children: (g: Geo) => React.ReactNode }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const n = players.length, my = Math.max(0, players.findIndex(p => p.id === meId)), t = RIM[tone];
  const short = useWindowDimensions().height < 700;
  let body: React.ReactNode = null;
  if (box.w > 0 && box.h > 0) {
    const u = Math.min(box.w / UW, box.h / UH), cx = box.w / 2, cy = box.h / 2;
    const ang = (i: number) => Math.PI / 2 + ((((i - my) % n) + n) % n) * 2 * Math.PI / n;
    const at = (i: number, r: Pt): Pt => ({ x: cx + r.x * u * Math.cos(ang(i)), y: cy + r.y * u * Math.sin(ang(i)) });
    const geo: Geo = { w: box.w, h: box.h, u, cx, cy, n, my, cw: u * 12, center: { x: cx, y: cy },
      seat: i => at(i, SEAT), slot: i => at(i, SLOT), idx: id => players.findIndex(p => p.id === id), deg: i => ang(i) * 180 / Math.PI };
    const rim = Math.max(5, u * 1.4);
    body = (
      <>
        <View style={{ position: 'absolute', left: cx - FELT.x * u - rim, top: cy - FELT.y * u - rim, width: 2 * FELT.x * u + 2 * rim, height: 2 * FELT.y * u + 2 * rim, borderRadius: 999, backgroundColor: t.rim, borderWidth: borders.hair, borderColor: t.line, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }} />
        <View style={{ position: 'absolute', left: cx - FELT.x * u, top: cy - FELT.y * u, width: 2 * FELT.x * u, height: 2 * FELT.y * u, borderRadius: 999, backgroundColor: t.felt, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {/* soft light over the middle of the cloth: stacked ovals, strongest at the centre */}
          {[0.96, 0.86, 0.76, 0.66, 0.56, 0.46, 0.36, 0.26].map(k => <View key={k} pointerEvents="none" style={{ position: 'absolute', width: k * 2 * FELT.x * u, height: k * 2 * FELT.y * u, borderRadius: 999, backgroundColor: 'rgba(196,240,214,0.03)' }} />)}
          <View style={{ position: 'absolute', width: 1.5 * FELT.x * u, height: 1.5 * FELT.y * u, borderRadius: 999, borderWidth: borders.hair, borderColor: 'rgba(241,232,213,0.10)' }} />
          <View style={{ position: 'absolute', width: 0.8 * FELT.x * u, height: 0.8 * FELT.y * u, borderRadius: 999, borderWidth: borders.hair, borderColor: 'rgba(241,232,213,0.08)' }} />
        </View>
        {children(geo)}
      </>
    );
  }
  return <View style={{ flex: 1, minHeight: short ? 250 : 210 }} onLayout={onLayout}>{body}</View>;
}

function useCountdown(ms: number | null | undefined) {
  const [left, setLeft] = React.useState(ms ?? 0);
  React.useEffect(() => {
    if (!ms) return;
    setLeft(ms); const t0 = Date.now();
    const i = setInterval(() => setLeft(Math.max(0, ms - (Date.now() - t0))), 500);
    return () => clearInterval(i);
  }, [ms]);
  return left;
}

/* PlayerStatus — one seat: a small fan of hidden cards behind the avatar, name, cards left, and a countdown on their turn.
   Only counts are shown — never the cards themselves. */
export function PlayerStatus({ geo, i, name, count, active, off, out, me, badge, timerMs, total = 60000 }: {
  geo: Geo; i: number; name: string; count?: number; active?: boolean; off?: boolean; out?: boolean; me?: boolean;
  badge?: string; timerMs?: number | null; total?: number;
}) {
  const { u } = geo, p = geo.seat(i), W = u * 22, H = u * 20;
  const fanN = me || out ? 0 : Math.min(count ?? 0, 5), fw = u * 3.8, d = Math.max(28, u * 7.2);
  const left = useCountdown(timerMs);
  const sub = out ? 'safe' : badge ?? (count !== undefined ? `${count} card${count === 1 ? '' : 's'}` : ' ');
  const secs = Math.ceil(left / 1000), hot = left < 15000;
  return (
    <View style={{ position: 'absolute', left: p.x - W / 2, top: p.y - H / 2, width: W, height: H, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      <View style={{ alignItems: 'center', opacity: off || out ? 0.55 : 1 }}>
        <View style={{ height: d * 0.5 + fw * 0.4, alignItems: 'center', justifyContent: 'flex-end' }}>
          <View style={{ flexDirection: 'row', position: 'absolute', top: 0 }}>
            {Array.from({ length: fanN }).map((_, k) => <View key={k} style={{ marginLeft: k ? -fw * 0.6 : 0, transform: [{ rotate: `${(k - (fanN - 1) / 2) * 7}deg` }] }}><PlayingCard faceDown width={fw} /></View>)}
          </View>
        </View>
        <View style={[active && st.glow, { borderRadius: d }]}><PlayerAvatar name={name} diameter={d} active={active} online={undefined} /></View>
        <View style={[st.pill, { paddingHorizontal: u * 1.8, paddingVertical: u * 0.5, borderRadius: u * 1.6, marginTop: -u * 0.8 }, active && st.pillOn]}>
          <Text numberOfLines={1} style={{ color: colors.text, fontFamily: fontFamily.semibold, fontSize: Math.max(11, u * 3.2), maxWidth: u * 19 }}>{me ? 'You' : name}{off ? ' · away' : ''}</Text>
          <Text numberOfLines={1} style={{ color: out ? colors.table.good : colors.textMuted, fontFamily: fontFamily.regular, fontSize: Math.max(11, u * 2.7) }}>{sub}</Text>
        </View>
        {timerMs != null && timerMs > 0 && (
          <View style={{ alignItems: 'center', marginTop: 2 }}>
            <Text style={{ color: hot ? colors.table.bad : colors.gold, fontFamily: fontFamily.semibold, fontSize: Math.max(11, u * 2.7) }}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</Text>
            <View style={{ width: u * 12, height: Math.max(3, u * 0.6), borderRadius: 2, backgroundColor: 'rgba(241,232,213,.18)', overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.min(1, left / total) * 100}%`, backgroundColor: hot ? colors.table.bad : colors.gold }} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

/* TurnIndicator — a gold pointer on the rim aimed at whoever must act; it gently pulses */
export function TurnIndicator({ geo, i }: { geo: Geo; i: number }) {
  const pulse = React.useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  React.useEffect(() => {
    if (reduce) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [reduce]);
  if (i < 0) return null;
  const a = geo.deg(i) * Math.PI / 180, u = geo.u;
  const x = geo.cx + ORBIT.x * u * Math.cos(a), y = geo.cy + ORBIT.y * u * Math.sin(a);
  const size = u * 4.4;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }), transform: [{ rotate: `${geo.deg(i) + 90}deg` }, { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }}>
      <Text style={{ color: colors.gold, fontSize: size, lineHeight: size * 1.05 }}>▲</Text>
    </Animated.View>
  );
}

/* A card that flies from one point to another (and stays there unless `fade`), optionally ending tilted */
export function Fly({ from, to, w, id, back = true, delay = 0, duration = 420, fade, rot = 0, spin = 0, arc = 0, onEnd, court }: {
  from: Pt; to: Pt; w: number; id?: string; back?: boolean; delay?: number; duration?: number; fade?: boolean; rot?: number; spin?: number; arc?: number; onEnd?: () => void; court?: boolean;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished && onEnd) onEnd(); });
  }, []);
  const h = w * 1.4;
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [from.x - w / 2, to.x - w / 2] });
  const ty = arc ? t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [from.y - h / 2, (from.y + to.y) / 2 - h / 2 - arc, to.y - h / 2] }) : t.interpolate({ inputRange: [0, 1], outputRange: [from.y - h / 2, to.y - h / 2] });
  const sc = t.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const rz = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rot + spin}deg`] });
  const op = fade ? t.interpolate({ inputRange: [0, 0.08, 0.8, 1], outputRange: [0, 1, 1, 0] }) : t.interpolate({ inputRange: [0, 0.06, 1], outputRange: [0, 1, 1] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: op, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }, { rotate: rz }], zIndex: 30 }}>
      <PlayingCard id={id} faceDown={back} width={w} court={court} />
    </Animated.View>
  );
}

/* The Thulla slam: the card is lifted high, then accelerates down onto the table.
   On landing it squashes, a ring spreads out from the spot and the whole screen shakes (`onLand`). */
export function SlamFly({ from, to, w, id, onLand, court }: { from: Pt; to: Pt; w: number; id?: string; onLand?: () => void; court?: boolean }) {
  const reduce = useReduceMotion();
  const spot = React.useRef({ rot: (Math.random() * 56 - 28), dx: (Math.random() - 0.5) * w * 0.5, dy: (Math.random() - 0.5) * w * 0.4 }).current;
  const end = { x: to.x + spot.dx, y: to.y + spot.dy };
  const v = React.useRef(new Animated.Value(0)).current;          // 0 → 1 lift, 1 → 2 slam down
  const sq = React.useRef(new Animated.Value(0)).current;         // squash after landing
  const ring = React.useRef(new Animated.Value(0)).current;
  const [landed, setLanded] = React.useState(false);
  const h = w * 1.4;
  React.useEffect(() => {
    if (reduce) {
      Animated.timing(v, { toValue: 2, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => { setLanded(true); onLand && onLand(); });
      return;
    }
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 213, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(v, { toValue: 2, duration: 347, easing: Easing.bezier(0.7, 0, 1, 0.5), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setLanded(true);
      onLand && onLand();
      Animated.timing(sq, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(ring, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }, []);
  const lift = from.y - h / 2 - 36;
  const fly = (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, zIndex: 40,
      opacity: v.interpolate({ inputRange: [0, 0.1, 2], outputRange: [0, 1, 1] }),
      transform: [
        { translateX: v.interpolate({ inputRange: [0, 1, 2], outputRange: [from.x - w / 2, from.x + (end.x - from.x) * 0.12 - w / 2, end.x - w / 2] }) },
        { translateY: v.interpolate({ inputRange: [0, 1, 2], outputRange: [from.y - h / 2, lift, end.y - h / 2] }) },
        { scale: v.interpolate({ inputRange: [0, 1, 2], outputRange: [0.8, 1.4, 0.9] }) },
        { rotate: v.interpolate({ inputRange: [0, 1, 2], outputRange: ['0deg', `${spot.rot * -0.3}deg`, `${spot.rot}deg`] }) },
      ] }}>
      <PlayingCard id={id} faceDown={false} width={w} court={court} />
    </Animated.View>
  );
  if (!landed) return fly;
  return (
    <>
      {!reduce && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: end.x - w * 0.6, top: end.y - w * 0.6, width: w * 1.2, height: w * 1.2, borderRadius: w * 0.6, borderWidth: 3, borderColor: colors.gold, zIndex: 39,
          opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 3] }) }] }} />
      )}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: end.x - w / 2, top: end.y - h / 2, zIndex: 40,
        transform: [{ rotate: `${spot.rot}deg` }, { scale: reduce ? 1 : sq.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.18, 0.94, 1] }) }] }}>
        <PlayingCard id={id} faceDown={false} width={w} court={court} />
      </Animated.View>
    </>
  );
}

/* Flights spawned by effects: push() adds, each removes itself when finished */
export type Flight = { key: string; from: Pt; to: Pt; w: number; id?: string; back?: boolean; delay?: number; duration?: number; fade?: boolean; rot?: number; spin?: number; arc?: number; court?: boolean };
export function useFlights() {
  const [list, setList] = React.useState<Flight[]>([]);
  const seq = React.useRef(0);
  const push = React.useCallback((items: Omit<Flight, 'key'>[]) => {
    setList(l => [...l, ...items.map(f => ({ ...f, key: 'f' + ++seq.current }))]);
  }, []);
  const layer = (
    <>{list.map(({ key, ...f }) => <Fly key={key} {...f} onEnd={() => setList(l => l.filter(x => x.key !== key))} />)}</>
  );
  return { push, layer };
}

/* the deal: cards fly from the middle to every seat, three rounds */
/* The deal: a small deck appears at the centre, then cards are dealt round the table one by one —
   each arcs out with a spin, landing at a seat that gives a little pulse. Your own hand fans in after it. */
export const DEAL_STEP = 55, DEAL_START = 260;
export function DealFx({ geo, run }: { geo: Geo; run: boolean }) {
  const { push, layer } = useFlights();
  const reduce = useReduceMotion();
  const done = React.useRef(false);
  const deck = React.useRef(new Animated.Value(0)).current;
  const pulses = React.useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  React.useEffect(() => {
    if (!run || done.current) return;
    done.current = true;
    const rounds = 4, items: Omit<Flight, 'key'>[] = [];
    if (reduce) { Animated.timing(deck, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }
    else {
      Animated.sequence([
        Animated.timing(deck, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
        Animated.delay(DEAL_START + rounds * geo.n * DEAL_STEP + 250),
        Animated.timing(deck, { toValue: 2, duration: 260, useNativeDriver: true }),
      ]).start();
    }
    if (reduce) return;
    for (let r = 0; r < rounds; r++) for (let i = 0; i < geo.n; i++) {
      const k = r * geo.n + i, delay = DEAL_START + k * DEAL_STEP, a = (geo.deg(i) * Math.PI) / 180;
      items.push({ from: geo.center, to: geo.seat(i), w: geo.u * 5, delay, duration: 360, fade: true, spin: (i % 2 ? 1 : -1) * (160 + r * 25), rot: Math.round(-Math.cos(a) * 14), arc: geo.u * 4 });
      const pv = pulses[i % pulses.length];
      setTimeout(() => { pv.setValue(0); Animated.timing(pv, { toValue: 1, duration: 280, useNativeDriver: true }).start(); }, delay + 340);
    }
    push(items);
  }, [run]);
  const cw = geo.u * 5, ch = cw * 1.4;
  return (
    <>
      {run && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: geo.center.x - cw / 2, top: geo.center.y - ch / 2, zIndex: 28,
          opacity: deck.interpolate({ inputRange: [0, 0.5, 1, 2], outputRange: [0, 1, 1, 0] }),
          transform: [{ scale: deck.interpolate({ inputRange: [0, 1, 2], outputRange: [0.4, 1, 0.8] }) }] }}>
          {[2, 1, 0].map(k => <View key={k} style={{ position: k ? 'absolute' : 'relative', left: k * 1.5, top: -k * 2 }}><PlayingCard faceDown width={cw} /></View>)}
        </Animated.View>
      )}
      {!reduce && run && Array.from({ length: geo.n }).map((_, i) => {
        const c = geo.seat(i), d = geo.u * 9;
        return <Animated.View key={i} pointerEvents="none" style={{ position: 'absolute', left: c.x - d / 2, top: c.y - d / 2, width: d, height: d, borderRadius: d / 2, borderWidth: 2, borderColor: colors.gold, zIndex: 27,
          opacity: pulses[i % pulses.length].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.8, 0] }),
          transform: [{ scale: pulses[i % pulses.length].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) }] }} />;
      })}
      {layer}
    </>
  );
}

/* little stack of face-down cards in the middle with a count */
export function PileStack({ geo, count, label }: { geo: Geo; count: number; label?: string }) {
  if (count <= 0) return null;
  const w = geo.u * 8, layers = Math.min(4, Math.ceil(count / 4));
  return (
    <View style={{ position: 'absolute', left: geo.cx - w / 2, top: geo.cy - w * 0.7 }}>
      {Array.from({ length: layers }).map((_, k) => (
        <View key={k} style={{ position: k ? 'absolute' : 'relative', left: k * 1.5, top: -k * 1.5, transform: [{ rotate: `${(k - 1.5) * 4}deg` }] }}><PlayingCard faceDown width={w} /></View>
      ))}
      <View style={st.badge}><Text style={st.badgeT}>{label ?? count}</Text></View>
    </View>
  );
}

const st = StyleSheet.create({
  pill: { backgroundColor: 'rgba(14,30,25,.78)', borderWidth: borders.hair, borderColor: colors.line, alignItems: 'center' },
  pillOn: { borderColor: colors.gold },
  glow: { shadowColor: colors.gold, shadowOpacity: 0.85, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  badge: { position: 'absolute', right: -9, top: -9, backgroundColor: colors.gold, borderRadius: 11, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeT: { color: colors.onGold, fontFamily: fontFamily.bold, fontSize: 12 },
});
