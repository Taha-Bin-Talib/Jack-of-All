import React from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { PlayingCard } from '../components/PlayingCard';
import { useNet } from '../../net';

/* CardHand — your private hand as one flat, centred, wrapped grid (max three rows), sized to fit the phone.
   `legal` limits what can be played (others dim and call onInvalid when tapped), `selected` lifts cards,
   `glow` rings cards in gold (e.g. matching pairs). Newly dealt hands animate in; selection springs up. */
export function CardHand({ cards, legal, selected, glow, onTap, onInvalid, animateIn, court }: {
  cards: string[]; legal?: string[]; selected?: string[]; glow?: string[]; onTap?: (c: string) => void; onInvalid?: (c: string) => void; animateIn?: boolean; court?: boolean;
}) {
  const [W, setW] = React.useState(0);
  const local = useNet().local;             // offline games have no chat button to leave room for
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
        const ok = !legal || legal.includes(c), sel = !!selected?.includes(c);
        const lift = sel ? -12 : legal && ok && onTap ? -7 : 0;
        return (
          <HandCard key={c} i={i} animateIn={animateIn} lift={lift}>
            <PlayingCard id={c} width={cw} court={court} selected={sel} glow={glow?.includes(c)} disabled={!ok}
              onPress={onTap ? () => onTap(c) : undefined} onPressDisabled={onInvalid ? () => onInvalid(c) : undefined} />
          </HandCard>
        );
      })}
    </View>
  );
  const maxH = 3 * (ch + gap) + 22;
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ paddingBottom: local ? 10 : 58, minHeight: ch + (local ? 30 : 78) }}>
      {rows > 3 ? <ScrollView style={{ maxHeight: maxH }} nestedScrollEnabled showsVerticalScrollIndicator={false}>{grid}</ScrollView> : grid}
    </View>
  );
}

function HandCard({ children, i, lift, animateIn }: { children: React.ReactNode; i: number; lift: number; animateIn?: boolean }) {
  const enter = React.useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const up = React.useRef(new Animated.Value(lift)).current;
  React.useEffect(() => {
    if (animateIn) Animated.timing(enter, { toValue: 1, duration: 420, delay: 450 + i * 70, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
  }, []);
  React.useEffect(() => { Animated.spring(up, { toValue: lift, friction: 7, tension: 140, useNativeDriver: true }).start(); }, [lift]);
  return <Animated.View style={{ opacity: enter.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: Animated.add(enter.interpolate({ inputRange: [0, 1], outputRange: [-130, 0] }), up) }, { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }, { rotate: enter.interpolate({ inputRange: [0, 1], outputRange: [i % 2 ? '-14deg' : '14deg', '0deg'] }) }] }}>{children}</Animated.View>;
}
