import React from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { Card, TimerBar } from '../ui';

/* Geometry copied from the website: a 100 × 72 unit ring, felt ellipse 35 × 23.5, seats on 42 × 29.5, cards on 26 × 16.5 */
const SEAT = { x: 42, y: 29.5 }, SLOT = { x: 26, y: 16.5 };
export type Pt = { x: number; y: number };
export type Geo = {
  w: number; h: number; u: number; cx: number; cy: number; n: number; my: number; cw: number;
  seat: (i: number) => Pt; slot: (i: number) => Pt; idx: (id: string) => number; center: Pt;
};

export function Ring({ players, meId, children }: { players: { id: string }[]; meId: string; children: (g: Geo) => React.ReactNode }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const n = players.length, my = Math.max(0, players.findIndex(p => p.id === meId));
  let body: React.ReactNode = null;
  if (box.w > 0 && box.h > 0) {
    const u = Math.min(box.w / 100, box.h / 72), cx = box.w / 2, cy = box.h / 2;
    const ang = (i: number) => Math.PI / 2 + ((((i - my) % n) + n) % n) * 2 * Math.PI / n;
    const at = (i: number, r: Pt): Pt => ({ x: cx + r.x * u * Math.cos(ang(i)), y: cy + r.y * u * Math.sin(ang(i)) });
    const geo: Geo = { w: box.w, h: box.h, u, cx, cy, n, my, cw: u * 10, center: { x: cx, y: cy },
      seat: i => at(i, SEAT), slot: i => at(i, SLOT), idx: id => players.findIndex(p => p.id === id) };
    const rim = Math.max(4, u * 1.1);
    body = (
      <>
        <View style={{ position: 'absolute', left: cx - 35 * u - rim, top: cy - 23.5 * u - rim, width: 70 * u + 2 * rim, height: 47 * u + 2 * rim, borderRadius: 999, backgroundColor: C.rim, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }} />
        <View style={{ position: 'absolute', left: cx - 35 * u, top: cy - 23.5 * u, width: 70 * u, height: 47 * u, borderRadius: 999, backgroundColor: C.felt, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 62 * u, height: 39 * u, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.12)', borderStyle: 'dashed' }} />
        </View>
        {children(geo)}
      </>
    );
  }
  return <View style={{ flex: 1, minHeight: 230 }} onLayout={onLayout}>{body}</View>;
}

/* One seat: fan of face-down cards (not for you), name pill, count, timer */
export function Seat({ geo, i, name, count, active, off, out, me, badge, timerMs, onPress }: {
  geo: Geo; i: number; name: string; count?: number; active?: boolean; off?: boolean; out?: boolean; me?: boolean;
  badge?: string; timerMs?: number | null; onPress?: () => void;
}) {
  const { u } = geo, p = geo.seat(i), W = u * 24, H = u * 16;
  const fanN = me || out ? 0 : Math.min(count ?? 0, 7), fw = u * 3.8;
  const inner = (
    <View style={{ alignItems: 'center', opacity: off || out ? 0.55 : 1 }}>
      {active && <Text style={{ color: C.gold, fontSize: u * 3.4, lineHeight: u * 3.4, marginBottom: -u * 0.4 }}>▼</Text>}
      {fanN > 0 && (
        <View style={{ flexDirection: 'row', height: fw * 1.4, marginBottom: u * 0.4 }}>
          {Array.from({ length: fanN }).map((_, k) => <View key={k} style={{ marginLeft: k ? -fw * 0.5 : 0 }}><Card back w={fw} /></View>)}
        </View>
      )}
      <View style={[sx.pill, { paddingHorizontal: u * 1.8, paddingVertical: u * 0.6, borderRadius: u * 2.4, minWidth: u * 14 }, active && sx.pillOn, me && { borderColor: 'rgba(242,193,78,.5)' }]}>
        <Text numberOfLines={1} style={{ color: C.text, fontWeight: '800', fontSize: Math.max(10, u * 3.1), maxWidth: u * 18 }}>{me ? 'You' : name}{off ? ' ⚡' : ''}</Text>
        <Text style={{ color: C.dim, fontSize: Math.max(9, u * 2.6) }}>{out ? 'safe ✓' : badge ?? (count !== undefined ? `${count} card${count === 1 ? '' : 's'}` : ' ')}</Text>
        {timerMs != null && timerMs > 0 && <View style={{ width: u * 12, marginTop: 2 }}><TimerBar ms={timerMs} h={Math.max(3, u * 0.7)} /></View>}
      </View>
    </View>
  );
  return (
    <View style={{ position: 'absolute', left: p.x - W / 2, top: p.y - H / 2, width: W, height: H, alignItems: 'center', justifyContent: 'center' }} pointerEvents={onPress ? 'auto' : 'box-none'}>
      {onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner}
    </View>
  );
}

/* A card that flies from one point to another (and stays there unless `fade`) */
export function Fly({ from, to, w, id, back = true, delay = 0, duration = 420, fade, onEnd }: {
  from: Pt; to: Pt; w: number; id?: string; back?: boolean; delay?: number; duration?: number; fade?: boolean; onEnd?: () => void;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished && onEnd) onEnd(); });
  }, []);
  const h = w * 1.4;
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [from.x - w / 2, to.x - w / 2] });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [from.y - h / 2, to.y - h / 2] });
  const sc = t.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const op = fade ? t.interpolate({ inputRange: [0, 0.08, 0.8, 1], outputRange: [0, 1, 1, 0] }) : t.interpolate({ inputRange: [0, 0.06, 1], outputRange: [0, 1, 1] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: op, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }], zIndex: 30 }}>
      <Card id={id} back={back} w={w} />
    </Animated.View>
  );
}

/* Flights spawned by effects: push() adds, each removes itself when finished */
export type Flight = { key: string; from: Pt; to: Pt; w: number; id?: string; back?: boolean; delay?: number; duration?: number; fade?: boolean };
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
export function DealFx({ geo, run }: { geo: Geo; run: boolean }) {
  const { push, layer } = useFlights();
  const done = React.useRef(false);
  React.useEffect(() => {
    if (!run || done.current) return;
    done.current = true;
    const items: Omit<Flight, 'key'>[] = [];
    const rounds = 3;
    for (let r = 0; r < rounds; r++) for (let i = 0; i < geo.n; i++) {
      items.push({ from: geo.center, to: geo.seat(i), w: geo.u * 5, delay: (r * geo.n + i) * 70, duration: 380, fade: true });
    }
    push(items);
  }, [run]);
  return <>{layer}</>;
}

/* little stack of face-down cards in the middle with a count */
export function PileStack({ geo, count, label }: { geo: Geo; count: number; label?: string }) {
  if (count <= 0) return null;
  const w = geo.u * 8, layers = Math.min(4, Math.ceil(count / 4));
  return (
    <View style={{ position: 'absolute', left: geo.cx - w / 2, top: geo.cy - w * 0.7 }}>
      {Array.from({ length: layers }).map((_, k) => (
        <View key={k} style={{ position: k ? 'absolute' : 'relative', left: k * 1.5, top: -k * 1.5, transform: [{ rotate: `${(k - 1.5) * 4}deg` }] }}><Card back w={w} /></View>
      ))}
      <View style={sx.badge}><Text style={sx.badgeT}>{label ?? count}</Text></View>
    </View>
  );
}

/* Your hand: one flat row of cards at the bottom, auto-fitted to the screen width */
export function Hand({ cards, legal, selected, glow, onTap, animateIn }: {
  cards: string[]; legal?: string[]; selected?: string[]; glow?: string[]; onTap?: (c: string) => void; animateIn?: boolean;
}) {
  const [W, setW] = React.useState(0);
  const n = cards.length;
  const avail = Math.max(0, W - 20);
  let cw = 62, step = 0;
  if (n > 1 && avail) {
    step = (avail - cw) / (n - 1);
    if (step > cw * 0.7) step = cw * 0.7;
    if (step < cw * 0.45) { cw = Math.max(44, Math.min(62, avail / (1 + (n - 1) * 0.45))); step = (avail - cw) / (n - 1); }
    if (step < cw * 0.4) step = cw * 0.4;
  }
  const total = n ? cw + step * (n - 1) : 0, h = cw * 1.4;
  const row = (
    <View style={{ width: total, height: h + 18 }}>
      {cards.map((c, i) => {
        const ok = !legal || legal.includes(c);
        const lift = selected?.includes(c) ? 14 : legal && ok && onTap ? 8 : 0;
        return (
          <HandCard key={c} i={i} n={n} animateIn={animateIn} style={{ position: 'absolute', left: i * step, bottom: lift, zIndex: i }}>
            <Card id={c} w={cw} selected={selected?.includes(c)} glow={glow?.includes(c)} dim={!ok} indexOnly={i < n - 1 && step < cw * 0.9}
              onPress={onTap && ok ? () => onTap(c) : undefined} />
          </HandCard>
        );
      })}
    </View>
  );
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ paddingTop: 14, paddingBottom: 8, minHeight: cw * 1.4 + 30 }}>
      {total > avail + 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>{row}</ScrollView>
        : <View style={{ alignItems: 'center' }}>{row}</View>}
    </View>
  );
}

function HandCard({ children, i, n, animateIn, style }: { children: React.ReactNode; i: number; n: number; animateIn?: boolean; style: any }) {
  const t = React.useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  React.useEffect(() => {
    if (animateIn) Animated.timing(t, { toValue: 1, duration: 320, delay: 900 + i * 45, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return <Animated.View style={[style, { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }] }]}>{children}</Animated.View>;
}

const sx = StyleSheet.create({
  pill: { backgroundColor: 'rgba(0,0,0,.58)', borderWidth: 2, borderColor: 'rgba(255,255,255,.18)', alignItems: 'center' },
  pillOn: { borderColor: C.gold, backgroundColor: 'rgba(60,40,0,.7)', shadowColor: C.gold, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  badge: { position: 'absolute', right: -9, top: -9, backgroundColor: C.gold, borderRadius: 11, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeT: { color: '#1d1405', fontWeight: '900', fontSize: 12 },
});
