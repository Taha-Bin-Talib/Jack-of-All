import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader, AppText, GameTile, IconButton, Icons, PlayerAvatar, PlayingCard, PrimaryButton, ScreenContainer, SecondaryButton, SectionHeading, colors, radii, spacing, shadows, durations, sizes, cardSizes, borders } from '..';

const SWATCHES: [string, string][] = [['Background', colors.bg], ['Background alt', colors.bgAlt], ['Surface', colors.surface], ['Text', colors.text], ['Text muted', colors.textMuted], ['Antique gold', colors.gold], ['Oxblood', colors.oxblood]];

/* Living style guide — every foundation of the design system in one scroll. */
export default function DesignPreview({ onBack }: { onBack: () => void }) {
  const [game, setGame] = React.useState('thulla'), [pick, setPick] = React.useState<string | null>('12H');
  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingBottom: spacing.giant }}>
      <AppHeader title="Design system" subtitle="Modern vintage card club" onBack={onBack} right={<IconButton label="Chat" filled><Icons.Chat /></IconButton>} />

      <AppText variant="display" style={{ marginTop: spacing.lg }}>Jack of All</AppText>
      <AppText variant="body" tone="muted" style={{ marginTop: spacing.sm }}>A private card club, rebuilt for the phone in your pocket.</AppText>

      <SectionHeading title="Colour" />
      <View style={st.wrap}>
        {SWATCHES.map(([n, c]) => (
          <View key={n} style={st.swatch}>
            <View style={[st.chip, { backgroundColor: c }]} />
            <AppText variant="caption">{n}</AppText>
            <AppText variant="caption" tone="muted">{c}</AppText>
          </View>
        ))}
      </View>

      <SectionHeading title="Typography" />
      <AppText variant="display">Display 36</AppText>
      <AppText variant="h1" style={st.gap}>Heading one 28</AppText>
      <AppText variant="h2" style={st.gap}>Heading two 22</AppText>
      <AppText variant="title" style={st.gap}>Title — DM Sans 18</AppText>
      <AppText variant="body" style={st.gap}>Body text is DM Sans 16 on a 24 line, set for easy reading at the table.</AppText>
      <AppText variant="bodySm" tone="muted" style={st.gap}>Small body 14 · secondary text</AppText>
      <AppText variant="label" tone="gold" style={st.gap}>Label · small caps</AppText>

      <SectionHeading title="Buttons" action="44dp+ targets" />
      <PrimaryButton title="Play now" onPress={() => {}} />
      <SecondaryButton title="Create a room" onPress={() => {}} style={{ marginTop: spacing.md }} />
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
        <PrimaryButton title="Small" size="sm" fullWidth={false} />
        <SecondaryButton title="Disabled" size="sm" fullWidth={false} disabled />
        <IconButton label="Back"><Icons.ChevronLeft /></IconButton>
        <IconButton label="Close" filled><Icons.Close /></IconButton>
      </View>

      <SectionHeading title="Players" />
      <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
        <PlayerAvatar name="Taha Talib" size="lg" active online />
        <PlayerAvatar name="Sara" online />
        <PlayerAvatar name="Ali" size="sm" online={false} />
        <View>
          <AppText variant="title">Taha</AppText>
          <AppText variant="bodySm" tone="muted">Your turn</AppText>
        </View>
      </View>

      <SectionHeading title="Playing cards" />
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <PlayingCard id="14S" size="lg" />
        <PlayingCard id="12H" size="md" selected={pick === '12H'} lift onPress={() => setPick(pick === '12H' ? null : '12H')} />
        <PlayingCard id="10D" size="md" />
        <PlayingCard id="7C" size="sm" />
        <PlayingCard faceDown size="md" />
        <PlayingCard faceDown size="sm" />
      </View>

      <SectionHeading title="Games" />
      <View style={{ gap: spacing.md }}>
        <GameTile gameId="thulla" title="Bhabhi Thulla" meta="3–8 players" description="Shed every card. The last one holding cards is the Bhabhi." selected={game === 'thulla'} onPress={() => setGame('thulla')} />
        <GameTile gameId="bluff" title="Bluff" meta="3–10 players" description="Play cards face down, name a rank, and dare the table to call you." selected={game === 'bluff'} onPress={() => setGame('bluff')} />
        <GameTile gameId="jackthief" title="Jack Thief" meta="2–10 players" description="Pair off your cards and don't get stuck with the lone Jack." selected={game === 'jackthief'} onPress={() => setGame('jackthief')} />
      </View>

      <SectionHeading title="Spacing · radii · shadow" />
      <View style={st.wrap}>
        {Object.entries(spacing).filter(([, v]) => v > 0).map(([k, v]) => (
          <View key={k} style={{ alignItems: 'center', marginRight: spacing.md, marginBottom: spacing.md }}>
            <View style={{ width: v, height: v, backgroundColor: colors.gold, opacity: 0.8 }} />
            <AppText variant="caption" tone="muted">{k} {v}</AppText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
        {(['sm', 'md', 'lg'] as const).map(k => <View key={k} style={[st.box, { borderRadius: radii[k] }, shadows[k]]}><AppText variant="caption" tone="muted">{k}</AppText></View>)}
      </View>
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.lg }}>
        Buttons {sizes.button.sm}/{sizes.button.md}/{sizes.button.lg} · cards {cardSizes.sm}/{cardSizes.md}/{cardSizes.lg} wide · motion {durations.fast}/{durations.base}/{durations.slow} ms · hairline {borders.hair}
      </AppText>
    </ScreenContainer>
  );
}
const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  swatch: { width: '33.33%', paddingRight: spacing.md, marginBottom: spacing.lg },
  chip: { height: 44, borderRadius: radii.sm, borderWidth: borders.hair, borderColor: colors.line, marginBottom: spacing.xs },
  gap: { marginTop: spacing.sm },
  box: { width: 72, height: 56, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
});
