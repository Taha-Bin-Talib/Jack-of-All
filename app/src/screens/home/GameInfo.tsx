import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppHeader, AppText, GameArt, PrimaryButton, ScreenContainer, SecondaryButton, SectionHeading, borders, colors, radii, sizes, spacing } from '../../design';
import { fontFamily } from '../../design/typography';
import { GAMES, GameId } from '../../games';
import type { Ctx } from './types';

export default function GameInfo({ c, id }: { c: Ctx; id: GameId }) {
  const g = GAMES[id], { width } = useWindowDimensions();
  const [all, setAll] = React.useState(false);
  const w = Math.min(width, sizes.maxContent + 40) - sizes.gutter * 2;
  const rules = all ? g.rulesFull : g.rulesPreview;
  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingBottom: spacing.giant }}>
      <AppHeader title={g.name} subtitle={g.players} onBack={c.nav.pop} />
      <View style={{ marginTop: spacing.sm, borderRadius: radii.md, overflow: 'hidden', borderWidth: borders.hair, borderColor: colors.line }}>
        <GameArt gameId={g.id} width={w} height={Math.round(w * 0.66)} />
      </View>

      <AppText variant="display" style={{ marginTop: spacing.xl }}>{g.name}</AppText>
      <AppText variant="h2" style={{ color: g.accent, marginTop: spacing.xs, fontStyle: 'italic' }}>{g.tagline}</AppText>
      <AppText variant="label" tone="muted" style={{ marginTop: spacing.md }}>{g.personality.join('  ·  ')}</AppText>
      <AppText variant="body" style={{ marginTop: spacing.lg }}>{g.blurb}</AppText>

      <View style={st.facts}>
        <Fact label="Players" value={`${g.min}–${g.max}`} />
        <View style={st.vr} />
        <Fact label="Play" value="Online or offline" />
      </View>

      <SectionHeading title="How it plays" />
      {rules.map((t, i) => (
        <View key={i} style={st.rule}>
          <AppText style={st.n}>{i + 1}</AppText>
          <AppText variant="bodySm" tone="muted" style={{ flex: 1 }}>{t}</AppText>
        </View>
      ))}
      <AppText variant="bodySm" tone="gold" onPress={() => setAll(!all)} style={{ marginTop: spacing.sm }}>{all ? 'Show fewer' : 'Read all the rules'}</AppText>

      <SectionHeading title="Take a seat" />
      <PrimaryButton title="Play now" size="lg" onPress={() => c.playOffline(id)} />
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm, textAlign: 'center' }}>You and 3 bots · no internet needed</AppText>
      <SecondaryButton title="Create a room" style={{ marginTop: spacing.lg }} onPress={() => c.nav.push({ k: 'create', id })} />
      <SecondaryButton title="Join a room" style={{ marginTop: spacing.md }} onPress={() => c.nav.push({ k: 'join' })} />
    </ScreenContainer>
  );
}

const Fact = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flex: 1 }}><AppText variant="label" tone="muted">{label}</AppText><AppText variant="title" style={{ marginTop: spacing.xs }}>{value}</AppText></View>
);
const st = StyleSheet.create({
  facts: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: borders.hair, borderBottomWidth: borders.hair, borderColor: colors.line },
  vr: { width: borders.hair, alignSelf: 'stretch', backgroundColor: colors.line, marginHorizontal: spacing.lg },
  rule: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  n: { fontFamily: fontFamily.display, color: colors.gold, fontSize: 18, lineHeight: 22, width: 18 },
  joinRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, alignItems: 'center' },
  code: { width: 128, height: sizes.button.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: borders.hair, borderColor: colors.line, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: 6, textAlign: 'center' },
});
