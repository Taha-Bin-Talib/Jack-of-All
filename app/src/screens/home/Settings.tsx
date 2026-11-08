import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppHeader, AppText, PrimaryButton, ScreenContainer, TextField, SecondaryButton, borders, colors, fontFamilyRef, radii, sizes, spacing } from '../../design';
import { GAME_IDS, GAMES } from '../../games';
import { getSnap, setServer } from '../../net';
import { setSfxEnabled, useSfxEnabled } from '../../sfx';
import type { Ctx } from './types';

const Row = ({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [st.row, pressed && { opacity: 0.7 }]}>
    <View style={{ flex: 1 }}><AppText variant="title">{title}</AppText><AppText variant="bodySm" tone="muted" style={{ marginTop: 2 }}>{sub}</AppText></View>
    <AppText variant="title" tone="gold">›</AppText>
  </Pressable>
);

export function Settings({ c }: { c: Ctx }) {
  const sound = useSfxEnabled();
  return (
    <ScreenContainer scroll safe={false}>
      <AppHeader title="Settings" onBack={c.nav.pop} />
      <View style={{ marginTop: spacing.md }}>
        <Row title="Sound effects" sub={sound ? 'On — tap to turn off' : 'Off — tap to turn on'} onPress={() => setSfxEnabled(!sound)} />
        <Row title="Profile" sub={c.name ? `Playing as ${c.name}` : 'Choose a display name'} onPress={() => c.nav.push({ k: 'profile' })} />
        <Row title="How to play" sub="Rules for all three games" onPress={() => c.nav.push({ k: 'rules' })} />
      </View>
    </ScreenContainer>
  );
}

export function Rules({ c }: { c: Ctx }) {
  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingBottom: spacing.giant }}>
      <AppHeader title="How to play" onBack={c.nav.pop} />
      {GAME_IDS.map(id => (
        <View key={id} style={{ marginTop: spacing.xl }}>
          <AppText variant="h2">{GAMES[id].name}</AppText>
          <AppText variant="label" tone="gold" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>{GAMES[id].players}</AppText>
          {GAMES[id].rulesFull.map((t, i) => <AppText key={i} variant="bodySm" tone="muted" style={{ marginBottom: spacing.sm }}>{`${i + 1}.  ${t}`}</AppText>)}
        </View>
      ))}
    </ScreenContainer>
  );
}

export function Server({ c }: { c: Ctx }) {
  const [url, setUrl] = React.useState(getSnap().server);
  return (
    <ScreenContainer scroll safe={false}>
      <AppHeader title="Server address" onBack={c.nav.pop} />
      <AppText variant="bodySm" tone="muted" style={{ marginVertical: spacing.lg }}>Normally you never need to change this. Use wss://your-server for a hosted server.</AppText>
      <TextField value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} accessibilityLabel="Server address" style={{ fontSize: 15 }} />
      <PrimaryButton title="Save" style={{ marginTop: spacing.xl }} onPress={() => { setServer(url); c.nav.pop(); }} />
    </ScreenContainer>
  );
}
const st = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, borderBottomWidth: borders.hair, borderColor: colors.line } });
