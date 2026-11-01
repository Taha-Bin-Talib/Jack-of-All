import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText, GameArt, IconButton, Icons, PrimaryButton, SecondaryButton, borders, colors, radii, spacing } from '../../design';
import { GAME_IDS, GAMES, GameId } from '../../games';
import { WaitNote } from './parts';
import type { Ctx } from './types';

type Step = 'mode' | 'local' | 'online';

/* "Play" sheet: Local or Online → (Local) pick a game, (Online) create a room or enter a code. */
export default function PlaySheet({ c, visible, onClose }: { c: Ctx; visible: boolean; onClose: () => void }) {
  const [step, setStep] = React.useState<Step>('mode');
  React.useEffect(() => { if (visible) setStep('mode'); }, [visible]);
  const back = () => (step === 'mode' ? onClose() : setStep('mode'));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={back}>
      <Pressable style={st.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={st.sheet}>
        <View style={st.grab} />
        <View style={st.head}>
          {step !== 'mode' && <IconButton label="Back" onPress={back}><Icons.ChevronLeft /></IconButton>}
          <AppText variant="h2" style={{ flex: 1 }}>{step === 'mode' ? 'How do you want to play?' : step === 'local' ? 'Choose a game' : 'Play online'}</AppText>
        </View>

        {step === 'mode' && (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <Option title="Local" note="Play offline at a table of four. No internet needed." onPress={() => setStep('local')} />
            <Option title="Online" note="Play with friends in a room, using a four-letter code." onPress={() => setStep('online')} />
          </View>
        )}

        {step === 'local' && (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            {GAME_IDS.map(id => <GameOption key={id} id={id} onPress={() => { onClose(); c.playOffline(id); }} />)}
          </View>
        )}

        {step === 'online' && (
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton title="Create a room" size="lg" loading={c.busy} onPress={() => c.create(c.lastGame)} />
            <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm, textAlign: 'center' }}>You pick the game in the lobby, before you start.</AppText>
            <SecondaryButton title="Enter room code" size="lg" disabled={c.busy} style={{ marginTop: spacing.lg }} onPress={() => { onClose(); c.nav.push({ k: 'join' }); }} />
            <WaitNote busy={c.busy} what="host" />
          </View>
        )}
      </View>
    </Modal>
  );
}

function Option({ title, note, onPress }: { title: string; note: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${note}`} onPress={onPress} style={({ pressed }) => [st.option, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1 }}>
        <AppText variant="h2">{title}</AppText>
        <AppText variant="bodySm" tone="muted" style={{ marginTop: 2 }}>{note}</AppText>
      </View>
      <AppText variant="title" tone="gold">›</AppText>
    </Pressable>
  );
}

function GameOption({ id, onPress }: { id: GameId; onPress: () => void }) {
  const g = GAMES[id];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${g.name}. ${g.tagline}`} onPress={onPress} style={({ pressed }) => [st.option, { padding: 0, overflow: 'hidden' }, pressed && { opacity: 0.85 }]}>
      <GameArt gameId={id} width={96} height={76} />
      <View style={{ flex: 1, paddingLeft: spacing.lg }}>
        <AppText variant="title" numberOfLines={1}>{g.name}</AppText>
        <AppText variant="bodySm" numberOfLines={1} style={{ color: g.accent }}>{g.tagline}</AppText>
      </View>
      <AppText variant="title" tone="gold" style={{ paddingRight: spacing.lg }}>›</AppText>
    </Pressable>
  );
}

const st = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.bgAlt, padding: spacing.xl, paddingBottom: spacing.xxl, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, borderTopWidth: borders.hair, borderColor: colors.lineStrong },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, minHeight: 76, borderRadius: radii.md, backgroundColor: colors.bg, borderWidth: borders.hair, borderColor: colors.line },
});
