import React from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { Card } from '../ui';

/* Layout modelled on the website: a big oval table, seats sitting on the rim, one flat grid of cards below. */
const UW = 100, UH = 76;                       // ring is 100 × 76 units
const FELT = { x: 43.4, y: 28.6 }, ORBIT = { x: 36, y: 21.5 }, SEAT = { x: 39, y: 30 }, SLOT = { x: 25, y: 15.5 };
export type Pt = { x: number; y: number };
export type Geo = {
  w: number; h: number; u: number; cx: number; cy: number; n: number; my: number; cw: number;
  seat: (i: number) => Pt; slot: (i: number) => Pt; idx: (id: string) => number; center: Pt;
  deg: (i: number) => number;                 // screen angle of a seat, in degrees
};

export function Ring({ players, meId, children }: { players: { id: string }[]; meId: string; children: (g: Geo) => React.ReactNode }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const n = players.length, my = Math.max(0, players.findIndex(p => p.id === meId));
  let body: React.ReactNode = null;
  if (box.w > 0 && box.h > 0) {
    const u = Math.min(box.w / UW, box.h / UH), cx = box.w / 2, cy = box.h / 2;
    const ang = (i: number) => Math.PI / 2 + ((((i - my) % n) + n) % n) * 2 * Math.PI / n;
    const at = (i: number, r: Pt): Pt => ({ x: cx + r.x * u * Math.cos(ang(i)), y: cy + r.y * u * Math.sin(ang(i)) });
    const geo: Geo = { w: box.w, h: box.h, u, cx, cy, n, my, cw: u * 12, center: { x: cx, y: cy },
      seat: i => at(i, SEAT), slot: i => at(i, SLOT), idx: id => players.findIndex(p => p.id === id), deg: i => ang(i) * 180 / Math.PI };
    const rim = Math.max(4, u * 1.2);
    body = (
      <>
        <View style={{ position: 'absolute', left: cx - FELT.x * u - rim, top: cy - FELT.y * u - rim, width: 2 * FELT.x * u + 2 * rim, height: 2 * FELT.y * u + 2 * rim, borderRadius: 999, backgroundColor: C.rim, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 }} />
        <View style={{ position: 'absolute', left: cx - FELT.x * u, top: cy - FELT.y * u, width: 2 * FELT.x * u, height: 2 * FELT.y * u, borderRadius: 999, backgroundColor: C.felt, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: 1.2 * FELT.x * u, height: 1.2 * FELT.y * u, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.05)' }} />
          <View style={{ position: 'absolute', width: 0.7 * FELT.x * u, height: 0.7 * FELT.y * u, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.05)' }} />
        </View>
        <View style={{ position: 'absolute', left: cx - ORBIT.x * u, top: cy - ORBIT.y * u, width: 2 * ORBIT.x * u, height: 2 * ORBIT.y * u, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.2)', borderStyle: 'dashed' }} />
        {children(geo)}
      </>
    );
  }
  return <View style={{ flex: 1, minHeight: 210 }} onLayout={onLayout}>{body}</View>;
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

/* One seat: fan of face-down cards (not for you), name pill with card count and timer */
export function Seat({ geo, i, name, count, active, off, out, me, badge, timerMs }: {
  geo: Geo; i: number; name: string; count?: number; active?: boolean; off?: boolean; out?: boolean; me?: boolean;
  badge?: string; timerMs?: number | null;
}) {
  const { u } = geo, p = geo.seat(i), W = u * 26, H = u * 17;
  const fanN = me || out ? 0 : Math.min(count ?? 0, 7), fw = u * 4.3;
  const left = useCountdown(timerMs);
  const sub = out ? 'safe ✓' : badge ?? (count !== undefined ? `${me ? 'You · ' : ''}${count} card${count === 1 ? '' : 's'}` : ' ');
  const fs = Math.max(11, u * 3.4);
  return (
    <View style={{ position: 'absolute', left: p.x - W / 2, top: p.y - H / 2, width: W, height: H, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      <View style={{ alignItems: 'center', opacity: off || out ? 0.55 : 1 }}>
        {fanN > 0 && (
          <View style={{ flexDirection: 'row', height: fw * 1.4, marginBottom: -u * 0.2 }}>
            {Array.from({ length: fanN }).map((_, k) => <View key={k} style={{ marginLeft: k ? -fw * 0.55 : 0, transform: [{ rotate: `${(k - (fanN - 1) / 2) * 5}deg` }] }}><Card back w={fw} /></View>)}
          </View>
        )}
        <View style={[sx.pill, { paddingHorizontal: u * 2.2, paddingVertical: u * 0.8, borderRadius: u * 2.4, minWidth: u * 15 }, active && sx.pillOn]}>
          <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '800', fontSize: fs, maxWidth: u * 20 }}>{name}{off ? ' ⚡' : ''}</Text>
          <Text numberOfLines={1} style={{ color: '#c9d6cf', fontSize: Math.max(10, u * 2.9) }}>{sub}</Text>
          {timerMs != null && timerMs > 0 && (
            <>
              <Text style={{ color: left < 15000 ? '#ff8a80' : '#ffe9a8', fontWeight: '800', fontSize: Math.max(10, u * 2.8) }}>⏱ {Math.floor(Math.ceil(left / 1000) / 60)}:{String(Math.ceil(left / 1000) % 60).padStart(2, '0')}</Text>
              <View style={{ width: u * 13, height: Math.max(3, u * 0.7), borderRadius: 3, backgroundColor: 'rgba(255,255,255,.2)', overflow: 'hidden', marginTop: 1 }}>
                <View style={{ height: '100%', width: `${Math.min(1, left / 60000) * 100}%`, backgroundColor: left < 15000 ? '#ff6b6b' : C.gold }} />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/* gold arrow on the orbit pointing out at whoever's turn it is */
export function TurnArrow({ geo, i }: { geo: Geo; i: number }) {
  if (i < 0) return null;
  const a = geo.deg(i) * Math.PI / 180, u = geo.u;
  const x = geo.cx + ORBIT.x * u * Math.cos(a), y = geo.cy + ORBIT.y * u * Math.sin(a);
  const size = u * 5;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${geo.deg(i) + 90}deg` }] }}>
      <Text style={{ color: C.gold, fontSize: size, lineHeight: size * 1.05, textShadowColor: '#000', textShadowRadius: 3 }}>▲</Text>
    </View>
  );
}

/* A card that flies from one point to another (and stays there unless `fade`), optionally ending tilted */
export function Fly({ from, to, w, id, back = true, delay = 0, duration = 420, fade, rot = 0, onEnd }: {
  from: Pt; to: Pt; w: number; id?: string; back?: boolean; delay?: number; duration?: number; fade?: boolean; rot?: number; onEnd?: () => void;
}) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished && onEnd) onEnd(); });
  }, []);
  const h = w * 1.4;
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [from.x - w / 2, to.x - w / 2] });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [from.y - h / 2, to.y - h / 2] });
  const sc = t.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const rz = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rot}deg`] });
  const op = fade ? t.interpolate({ inputRange: [0, 0.08, 0.8, 1], outputRange: [0, 1, 1, 0] }) : t.interpolate({ inputRange: [0, 0.06, 1], outputRange: [0, 1, 1] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: op, transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }, { rotate: rz }], zIndex: 30 }}>
      <Card id={id} back={back} w={w} />
    </Animated.View>
  );
}

/* Flights spawned by effects: push() adds, each removes itself when finished */
export type Flight = { key: string; from: Pt; to: Pt; w: number; id?: string; back?: boolean; delay?: number; duration?: number; fade?: boolean; rot?: number };
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
    for (let r = 0; r < 3; r++) for (let i = 0; i < geo.n; i++) {
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

/* Your hand: a flat wrapped grid of cards, centred, like the website */
export function Hand({ cards, legal, selected, glow, onTap, animateIn }: {
  cards: string[]; legal?: string[]; selected?: string[]; glow?: string[]; onTap?: (c: string) => void; animateIn?: boolean;
}) {
  const [W, setW] = React.useState(0);
  const n = cards.length, gap = 6, pad = 10;
  let cw = 34, perRow = 6;
  if (W) {
    for (let c = Math.min(60, Math.max(44, W * 0.125)); c >= 34; c -= 2) {
      const pr = Math.max(1, Math.floor((W - 2 * pad + gap) / (c + gap)));
      cw = c; perRow = pr;
      if (Math.ceil(n / pr) <= 3) break;
    }
  }
  const rows = Math.max(1, Math.ceil(n / perRow)), ch = cw * 1.4;
  perRow = Math.max(1, Math.ceil(n / rows));            // balance the rows (no lonely last card)
  const gridW = perRow * (cw + gap) - gap + 2 * pad;
  const grid = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap, paddingHorizontal: pad, paddingTop: 14, width: gridW, alignSelf: 'center' }}>
      {cards.map((c, i) => {
        const ok = !legal || legal.includes(c);
        const lift = selected?.includes(c) ? -12 : legal && ok && onTap ? -7 : 0;
        return (
          <HandCard key={c} i={i} animateIn={animateIn} lift={lift}>
            <Card id={c} w={cw} selected={selected?.includes(c)} glow={glow?.includes(c)} dim={!ok} onPress={onTap && ok ? () => onTap(c) : undefined} />
          </HandCard>
        );
      })}
    </View>
  );
  const maxH = 3 * (ch + gap) + 22;
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ paddingBottom: 58, minHeight: ch + 78 }}>
      {rows > 3 ? <ScrollView style={{ maxHeight: maxH }} showsVerticalScrollIndicator={false}>{grid}</ScrollView> : grid}
    </View>
  );
}

function HandCard({ children, i, lift, animateIn }: { children: React.ReactNode; i: number; lift: number; animateIn?: boolean }) {
  const t = React.useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  React.useEffect(() => {
    if (animateIn) Animated.timing(t, { toValue: 1, duration: 320, delay: 900 + i * 45, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return <Animated.View style={{ opacity: t, transform: [{ translateY: Animated.add(t.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }), lift) }] }}>{children}</Animated.View>;
}

const sx = StyleSheet.create({
  pill: { backgroundColor: 'rgba(0,0,0,.62)', borderWidth: 2, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center' },
  pillOn: { borderColor: C.gold, backgroundColor: 'rgba(40,30,0,.78)', shadowColor: C.gold, shadowOpacity: 0.9, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  badge: { position: 'absolute', right: -9, top: -9, backgroundColor: C.gold, borderRadius: 11, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeT: { color: '#1d1405', fontWeight: '900', fontSize: 12 },
});
