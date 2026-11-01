import React from 'react';
import { View } from 'react-native';
import { AppHeader, AppText, GameRow, ScreenContainer, spacing } from '../../design';
import { GAME_IDS, GAMES } from '../../games';
import type { Ctx } from './types';

export default function GamesList({ c }: { c: Ctx }) {
  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingBottom: spacing.giant }}>
      <AppHeader title="The collection" subtitle="Pick a game to see how it plays" onBack={c.nav.pop} />
      <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
        {GAME_IDS.map(id => <GameRow key={id} game={GAMES[id]} onPress={() => c.nav.push({ k: 'game', id })} />)}
      </View>
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xl }}>Every game can be played offline against bots, or online with friends in a room.</AppText>
    </ScreenContainer>
  );
}
