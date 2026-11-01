import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { borders, cardSizes, colors, shadows } from '../tokens';
import { fontFamily } from '../typography';
import { Text } from 'react-native';
import { Suit } from '../../ui';

const LABEL: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

/* Playing card — ivory face, ink / oxblood suits, Playfair rank.
   `id` uses the game's card ids: rank + suit letter, e.g. "14S" (ace of spades), "10H". */
export function PlayingCard({ id, size = 'md', width, faceDown, selected, disabled, onPress }: {
  id?: string; size?: 'xs' | 'sm' | 'md' | 'lg'; width?: number; faceDown?: boolean; selected?: boolean; disabled?: boolean; onPress?: () => void;
}) {
  const w = width ?? cardSizes[size], h = Math.round(w * cardSizes.ratio), rad = cardSizes.radius(w);
  const box = [{ width: w, height: h, borderRadius: rad }, shadows.sm];
  let face: React.ReactNode;
  if (faceDown || !id) {
    const m = Math.max(3, w * 0.07);
    face = (
      <View style={[box, st.back]}>
        <View style={{ position: 'absolute', left: m, top: m, right: m, bottom: m, borderWidth: borders.hair, borderColor: colors.card.backLine, borderRadius: Math.max(2, rad - 2), alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: w * 0.3, height: w * 0.3, borderWidth: borders.hair, borderColor: colors.card.backLine, transform: [{ rotate: '45deg' }] }} />
        </View>
      </View>
    );
  } else {
    const rank = parseInt(id, 10), s = /[SHDC]/.exec(id)![0], red = s === 'H' || s === 'D', ink = red ? colors.card.red : colors.card.ink;
    const idx = (
      <View style={{ alignItems: 'center' }}>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: fontFamily.display, color: ink, fontSize: w * 0.3, lineHeight: w * 0.34 }}>{LABEL[rank] || rank}</Text>
        <Suit s={s} size={w * 0.19} color={ink} />
      </View>
    );
    face = (
      <View style={[box, st.face, selected && st.selected]}>
        <View style={{ position: 'absolute', left: w * 0.09, top: w * 0.05 }}>{idx}</View>
        <View style={{ position: 'absolute', right: w * 0.09, bottom: w * 0.05, transform: [{ rotate: '180deg' }] }}>{idx}</View>
        <Suit s={s} size={w * 0.46} color={ink} />
      </View>
    );
  }
  const lift = selected ? { transform: [{ translateY: -8 }] } : null;
  return onPress
    ? <Pressable onPress={disabled ? undefined : onPress} accessibilityRole="button" style={[lift, disabled && { opacity: 0.45 }]}>{face}</Pressable>
    : <View style={[lift, disabled && { opacity: 0.45 }]}>{face}</View>;
}
const st = StyleSheet.create({
  face: { backgroundColor: colors.card.face, borderWidth: borders.hair, borderColor: colors.card.edge, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: colors.gold, borderWidth: 2 },
  back: { backgroundColor: colors.card.back, borderWidth: borders.hair, borderColor: colors.card.backLine },
});
