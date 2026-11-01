import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { borders, colors, radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { Suit } from '../../ui';

/* Each game is marked by one suit — a meaningful emblem rather than a decorative icon. */
const EMBLEM: Record<string, { s: string; red: boolean }> = { thulla: { s: 'S', red: false }, bluff: { s: 'D', red: true }, jackthief: { s: 'C', red: false } };

export function GameTile({ gameId, title, meta, description, selected, onPress }: { gameId: 'thulla' | 'bluff' | 'jackthief' | string; title: string; meta: string; description?: string; selected?: boolean; onPress?: () => void }) {
  const e = EMBLEM[gameId] || EMBLEM.thulla;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}
      style={({ pressed }) => [st.tile, selected && st.selected, pressed && { opacity: 0.85 }]}>
      <View style={st.emblem}><Suit s={e.s} size={26} color={e.red ? '#D9A3A8' : colors.text} /></View>
      <View style={{ flex: 1 }}>
        <AppText variant="h2">{title}</AppText>
        <AppText variant="label" tone="gold" style={{ marginTop: spacing.xs }}>{meta}</AppText>
        {description ? <AppText variant="bodySm" tone="muted" style={{ marginTop: spacing.sm }}>{description}</AppText> : null}
      </View>
    </Pressable>
  );
}
const st = StyleSheet.create({
  tile: { flexDirection: 'row', gap: spacing.lg, padding: spacing.lg, borderRadius: radii.md, backgroundColor: colors.bgAlt, borderWidth: borders.hair, borderColor: colors.line },
  selected: { borderColor: colors.gold, borderWidth: borders.strong },
  emblem: { width: 48, height: 48, borderRadius: radii.sm, backgroundColor: colors.bg, borderWidth: borders.hair, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
});
