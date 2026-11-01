import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppHeader, AppText, GameArt, PrimaryButton, ScreenContainer, SectionHeading, borders, colors, radii, sizes, spacing } from '../../design';
import { GAMES, GameId } from '../../games';
import { WaitNote } from './parts';
import type { Ctx } from './types';

const eng = require('../../engine/games');

export default function CreateRoom({ c, id }: { c: Ctx; id: GameId }) {
  const g = GAMES[id], { width } = useWindowDimensions();
  const e = eng.get(id), def = e.defaults();
  const w = Math.min(width, sizes.maxContent + 40) - sizes.gutter * 2;
  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingBottom: spacing.giant }}>
      <AppHeader title="Create a room" subtitle={g.name} onBack={c.nav.pop} />
      <View style={st.hero}>
        <View style={{ borderRadius: radii.md, overflow: 'hidden' }}><GameArt gameId={id} width={w * 0.34} height={w * 0.34 * 1.05} /></View>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{g.name}</AppText>
          <AppText variant="body" style={{ fontStyle: 'italic', color: g.accent, marginTop: 2 }}>{g.tagline}</AppText>
          <AppText variant="label" tone="gold" style={{ marginTop: spacing.md }}>{g.players}</AppText>
        </View>
      </View>

      <SectionHeading title="Your table" />
      <Line k="Players" v={`${g.min} to ${g.max} can sit down`} />
      <Line k="Who can join" v="Anyone with the four-letter code" />
      <Line k="Host" v={c.name ? `${c.name} (you)` : 'You'} />
      {e.settings.map((sp: any) => (
        <Line key={sp.key} k={sp.label} v={sp.options.find((o: any) => o.value === def[sp.key])?.label || ''} />
      ))}
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.md }}>As host you can change the game and these options in the lobby, before you start.</AppText>

      <PrimaryButton title="Create room" size="lg" loading={c.busy} style={{ marginTop: spacing.xl }} onPress={() => c.create(id)} />
      <WaitNote busy={c.busy} what="host" />
    </ScreenContainer>
  );
}
const Line = ({ k, v }: { k: string; v: string }) => (
  <View style={st.line}><AppText variant="bodySm" tone="muted">{k}</AppText><AppText variant="bodySm" style={{ flex: 1, textAlign: 'right' }}>{v}</AppText></View>
);
const st = StyleSheet.create({
  hero: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: borders.hair, borderColor: colors.line },
});
