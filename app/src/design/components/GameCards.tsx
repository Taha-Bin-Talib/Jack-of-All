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
export function GameRow({ game, onPress }: { game: GameMeta; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${game.name}. ${game.tagline}`} onPress={onPress}
      style={({ pressed }) => [st.row2, pressed && { opacity: 0.88 }]}>
      <GameArt gameId={game.id} width={116} height={148} />
      <View style={{ flex: 1, paddingVertical: spacing.md, paddingRight: spacing.md, paddingLeft: spacing.lg }}>
        <AppText variant="h2">{game.name}</AppText>
        <AppText variant="bodySm" style={{ fontFamily: fontFamily.displaySemi, color: game.accent, marginTop: 2 }}>{game.tagline}</AppText>
        <AppText variant="bodySm" tone="muted" numberOfLines={3} style={{ marginTop: spacing.sm }}>{game.blurb}</AppText>
        <AppText variant="label" tone="gold" style={{ marginTop: 'auto', paddingTop: spacing.sm }}>{game.players}</AppText>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.bgAlt, borderWidth: borders.hair, borderColor: colors.line, borderRadius: radii.md, overflow: 'hidden' },
  rule: { height: 2, opacity: 0.9 },
  body: { padding: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  row2: { flexDirection: 'row', backgroundColor: colors.bgAlt, borderWidth: borders.hair, borderColor: colors.line, borderRadius: radii.md, overflow: 'hidden', minHeight: 148 },
});
