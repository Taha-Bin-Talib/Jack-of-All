import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { borders, colors, radii, spacing } from '../tokens';
import { fontFamily } from '../typography';
import { AppText } from './AppText';
import { GameArt } from './GameArt';
import type { GameMeta } from '../../games';

/* Showcase card for the home carousel: artwork on top, title / tagline / player count below.
   The title colour and the edge accent follow each game's identity. */
export function GameCard({ game, width, onPress }: { game: GameMeta; width: number; onPress: () => void }) {
  const art = Math.round(width * 0.68);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${game.name}. ${game.tagline}`} onPress={onPress}
      style={({ pressed }) => [st.card, { width }, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}>
      <GameArt gameId={game.id} width={width} height={art} />
      <View style={[st.rule, { backgroundColor: game.accent }]} />
      <View style={st.body}>
        <AppText variant="h1" style={{ fontSize: 24, lineHeight: 30 }}>{game.name}</AppText>
        <AppText variant="body" style={{ fontFamily: fontFamily.displaySemi, color: game.accent, marginTop: spacing.xs }}>{game.tagline}</AppText>
        <View style={st.row}>
          <AppText variant="label" tone="muted">{game.players}</AppText>
          <AppText variant="label" tone="gold">Open  →</AppText>
        </View>
      </View>
    </Pressable>
  );
}

/* List row for the Games screen: square artwork + description + personality. */
/* A wide card that stretches to the width of the screen. Several can share a screen: each row takes an equal slice of the height. */
export function GameRow({ game, onPress, height }: { game: GameMeta; onPress: () => void; height?: number }) {
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const narrow = box.w > 0 && box.w < 330, artW = Math.round(box.w * (narrow ? 0.3 : 0.4)), lines = box.h > 215 ? 4 : box.h > 185 ? 3 : box.h >= 150 ? 2 : 0, tight = lines === 0;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${game.name}. ${game.tagline}`} onPress={onPress}
      onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={({ pressed }) => [st.row2, height ? { flex: undefined, flexGrow: 0, flexShrink: 0, flexBasis: 'auto', height, minHeight: 0, maxHeight: undefined } : null, pressed && { opacity: 0.88 }]}>
      {box.w > 0 && <GameArt gameId={game.id} width={artW} height={box.h} />}
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing.md, paddingRight: spacing.md, paddingLeft: narrow ? spacing.md : spacing.lg }}>
        <AppText variant="h2" numberOfLines={1} style={narrow ? { fontSize: 20, lineHeight: 26 } : undefined}>{game.name}</AppText>
        <AppText variant="bodySm" numberOfLines={1} style={{ fontFamily: fontFamily.displaySemi, color: game.accent, marginTop: 2 }}>{game.tagline}</AppText>
        {!tight && <AppText variant="bodySm" tone="muted" numberOfLines={lines} style={{ marginTop: spacing.sm }}>{game.blurb}</AppText>}
        <AppText variant="label" tone="gold" style={{ marginTop: spacing.sm }}>{game.players}</AppText>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.bgAlt, borderWidth: borders.hair, borderColor: colors.line, borderRadius: radii.md, overflow: 'hidden' },
  rule: { height: 2, opacity: 0.9 },
  body: { padding: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  row2: { flexDirection: 'row', backgroundColor: colors.bgAlt, borderWidth: borders.hair, borderColor: colors.line, borderRadius: radii.md, overflow: 'hidden', flex: 1, minHeight: 100, maxHeight: 250 },
});
