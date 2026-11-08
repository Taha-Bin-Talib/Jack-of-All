import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borders, cardSizes, colors, shadows } from '../tokens';
import { fontFamily } from '../typography';
import Svg, { Path } from 'react-native-svg';
import { JackCardFace } from './JackFace';

const LABEL: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const RANK_WORD: Record<number, string> = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
const SUIT_WORD: Record<string, string> = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const cardName = (id?: string) => { if (!id) return 'Face-down card'; const r = parseInt(id, 10); return `${RANK_WORD[r] || r} of ${SUIT_WORD[/[SHDC]/.exec(id)![0]]}`; };

/* Playing card — ivory face, ink / oxblood suits, Playfair rank, SVG suits (never emoji).
   `id` uses the game's card ids: rank + suit letter, e.g. "14S" (ace of spades), "10H", and "12H:1" for a second deck.
   States: faceDown (hidden), selected (lifted + gold edge), glow (gold edge, e.g. a pair), disabled (dimmed, not pressable).
   `court` draws Jacks as court cards (used by Jack Thief).  `width` overrides `size`. */
function PlayingCardImpl({ id, size = 'md', width, faceDown, selected, glow, disabled, court, lift: lifted, onPress, onPressDisabled }: {
  id?: string; size?: 'xs' | 'sm' | 'md' | 'lg'; width?: number; faceDown?: boolean; selected?: boolean; glow?: boolean; disabled?: boolean; court?: boolean; lift?: boolean;
  onPress?: () => void; onPressDisabled?: () => void;
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
    if (court && rank === 11) {
      face = <View style={[box, st.court, (selected || glow) && st.edge, shadows.sm]}><JackCardFace width={w} suit={s} /></View>;
    } else {
      const G = { S: '♠', H: '♥', D: '♦', C: '♣' } as Record<string, string>;
      const fs = w * 0.27;
      const idx = (
        <Text allowFontScaling={false} style={{ fontFamily: fontFamily.card, color: ink, fontSize: fs, lineHeight: fs * 1.05, textAlign: 'center' }}>{`${LABEL[rank] || rank}\n${G[s]}`}</Text>
      );
      face = (
        <View style={[box, st.face, (selected || glow) && st.edge]}>
          <View style={{ position: 'absolute', left: w * 0.1, top: w * 0.07 }}>{idx}</View>
          <View style={{ position: 'absolute', right: w * 0.1, bottom: w * 0.07, transform: [{ rotate: '180deg' }] }}>{idx}</View>
          <Text allowFontScaling={false} style={{ fontFamily: fontFamily.card, color: ink, fontSize: w * 0.567, lineHeight: w * 0.7 }}>{G[s]}</Text>
        </View>
      );
    }
  }
  const shade = disabled ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: rad, backgroundColor: 'rgba(24,52,42,0.3)' }} /> : null;
  const badge = selected ? <View pointerEvents="none" style={[st.check, { width: Math.max(14, w * 0.3), height: Math.max(14, w * 0.3), borderRadius: Math.max(7, w * 0.15), top: -w * 0.1, right: -w * 0.1 }]}><Svg width={Math.max(8, w * 0.17)} height={Math.max(8, w * 0.17)} viewBox="0 0 24 24" fill="none" stroke={colors.onGold} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 13l4 4 10-10" /></Svg></View> : null;
  const lift = selected && lifted ? { transform: [{ translateY: -8 }] } : null;
  const inner = <View style={lift}>{face}{shade}{badge}</View>;
  if (!onPress && !onPressDisabled) return inner;
  return <Pressable onPress={disabled ? onPressDisabled : onPress} accessibilityRole="button" accessibilityLabel={faceDown ? 'Face-down card' : cardName(id)} accessibilityState={{ disabled: !!disabled, selected: !!selected }}>{inner}</Pressable>;
}
export const PlayingCard = React.memo(PlayingCardImpl);
const st = StyleSheet.create({
  check: { position: 'absolute', backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  face: { backgroundColor: colors.card.face, borderWidth: borders.hair, borderColor: colors.card.edge, alignItems: 'center', justifyContent: 'center' },
  court: { backgroundColor: colors.card.face, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  edge: { borderColor: colors.gold, borderWidth: 2 },
  back: { backgroundColor: colors.card.back, borderWidth: borders.hair, borderColor: colors.card.backLine },
});
