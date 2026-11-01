import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText, Icons, IconButton, PlayerAvatar, PrimaryButton, ScreenContainer, SecondaryButton, SectionHeading, GameCard, borders, colors, radii, sizes, spacing } from '../../design';
import { fontFamily } from '../../design/typography';
import { GAME_IDS, GAMES } from '../../games';
import { PressNote } from './parts';
import type { Ctx } from './types';

export default function HomeMain({ c }: { c: Ctx }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(300, Math.round((Math.min(width, sizes.maxContent + 40) - sizes.gutter) * 0.78));
  const last = GAMES[c.lastGame];
  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingBottom: spacing.giant }}>
      {/* header */}
      <View style={st.head}>
        <View style={{ flex: 1 }}>
          <AppText style={st.mark}>JACK OF ALL</AppText>
          <AppText style={st.tag}>Every hand has a story.</AppText>
        </View>
        <IconButton label="Settings" onPress={() => c.nav.push({ k: 'settings' })}><Icons.Sliders /></IconButton>
        <PressNote label={c.name ? `Profile: ${c.name}` : 'Profile'} onPress={() => c.nav.push({ k: 'profile' })}>
          <PlayerAvatar name={c.name || '?'} size="md" />
        </PressNote>
      </View>
      <View style={st.rule} />

      {/* welcome */}
      <View style={{ marginTop: spacing.xxl }}>
        <AppText variant="label" tone="gold">{c.name ? `Welcome back, ${c.name}` : 'Welcome to the club'}</AppText>
        <AppText variant="display" style={{ marginTop: spacing.sm }}>Pull up a chair.</AppText>
        <AppText variant="body" tone="muted" style={{ marginTop: spacing.md }}>Three classic card games, one table. Host a room for your friends, or sit down against the house any time — no internet needed.</AppText>
        <PrimaryButton title="Play now" size="lg" onPress={() => c.playOffline(c.lastGame)} style={{ marginTop: spacing.xl }} />
        <View style={st.under}>
          <AppText variant="bodySm" tone="muted" style={{ flex: 1 }}>{last.name} · offline, 4 players</AppText>
          <AppText variant="bodySm" tone="gold" onPress={() => c.nav.push({ k: 'games' })} suppressHighlighting accessibilityRole="link" style={{ paddingVertical: spacing.md }}>Choose another game</AppText>
        </View>
      </View>

      {/* collection */}
      <SectionHeading title="The collection" action="All games" onAction={() => c.nav.push({ k: 'games' })} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardW + spacing.md} decelerationRate="fast"
        style={{ marginHorizontal: -sizes.gutter }} contentContainerStyle={{ paddingHorizontal: sizes.gutter, gap: spacing.md }}>
        {GAME_IDS.map(id => <GameCard key={id} game={GAMES[id]} width={cardW} onPress={() => c.nav.push({ k: 'game', id })} />)}
      </ScrollView>

      {/* join a room */}
      <SectionHeading title="Join a friend" />
      <AppText variant="bodySm" tone="muted" style={{ marginBottom: spacing.md }}>Got a four-letter room code? Take your seat at their table.</AppText>
      <SecondaryButton title="Enter room code" onPress={() => c.nav.push({ k: 'join' })} />
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md },
  mark: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 28, letterSpacing: 3.5, color: colors.text },
  tag: { fontFamily: fontFamily.displaySemi, fontSize: 13, lineHeight: 18, color: colors.gold, fontStyle: 'italic' },
  rule: { height: borders.hair, backgroundColor: colors.line },
  under: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  joinRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  code: { width: 128, height: sizes.button.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: borders.hair, borderColor: colors.line, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: 6, textAlign: 'center' },
});
