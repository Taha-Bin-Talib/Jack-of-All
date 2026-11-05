import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText, GameRow, Icons, IconButton, PlayerAvatar, PrimaryButton, ScreenContainer, borders, colors, radii, sizes, spacing } from '../../design';
import { fontFamily } from '../../design/typography';
import { GAME_IDS, GAMES } from '../../games';
import { PressNote } from './parts';
import PlayDialog from './PlayDialog';
import type { Ctx } from './types';

export default function HomeMain({ c }: { c: Ctx }) {
  const { height } = useWindowDimensions();
  const [play, setPlay] = React.useState(false), [h, setH] = React.useState(0);
  const rowH = Math.max(96, Math.min(240, Math.floor((h - 2 * spacing.md) / 3)));   // three rows share the space; scroll only if the phone is tiny
  return (
    <ScreenContainer safe={false}>
      {/* header */}
      <View style={st.head}>
        <View style={{ flex: 1 }}>
          <AppText style={st.mark}>Jack of All</AppText>
          <AppText style={st.tag}>Three Games. Endless Fun.</AppText>
        </View>
        <IconButton label="Settings" onPress={() => c.nav.push({ k: 'settings' })}><Icons.Sliders /></IconButton>
        <PressNote label={c.name ? `Profile: ${c.name}` : 'Profile'} onPress={() => c.nav.push({ k: 'profile' })}>
          <PlayerAvatar name={c.name || '?'} size="md" />
        </PressNote>
      </View>
      <View style={st.rule} />

      {/* about the games — tap one to see how it plays */}
      <View style={{ paddingTop: spacing.lg }}>
        <AppText variant="label" tone="gold">{c.name ? `Welcome back, ${c.name}` : 'Welcome to the club'}</AppText>
        <AppText variant="display" style={{ marginTop: spacing.xs }}>Pull up a chair.</AppText>
        {height >= 620 && <AppText variant="bodySm" tone="muted" style={{ marginTop: spacing.sm }}>Three classic card games, one table. Tap a game to see how it plays.</AppText>}
      </View>
      <View style={{ flex: 1, marginTop: spacing.lg }} onLayout={e => setH(e.nativeEvent.layout.height)}>
        {h > 0 && (
          <ScrollView showsVerticalScrollIndicator={false} overScrollMode="never" contentContainerStyle={{ gap: spacing.md }}>
            {GAME_IDS.map(id => <GameRow key={id} game={GAMES[id]} height={rowH} onPress={() => c.nav.push({ k: 'game', id })} />)}
          </ScrollView>
        )}
      </View>

      {/* play */}
      <View style={st.bar}>
        <PrimaryButton title="Play" size="lg" onPress={() => setPlay(true)} />
      </View>
      <PlayDialog c={c} visible={play} onClose={() => setPlay(false)} />
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md },
  mark: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 29, letterSpacing: -0.4, color: colors.text },
  tag: { fontFamily: fontFamily.displaySemi, fontSize: 14, lineHeight: 19, color: colors.gold },
  rule: { height: borders.hair, backgroundColor: colors.line },
  bar: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  under: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  joinRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  code: { width: 128, height: sizes.button.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: borders.hair, borderColor: colors.line, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 22, letterSpacing: 6, textAlign: 'center' },
});
