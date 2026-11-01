import React from 'react';
import { View } from 'react-native';
import { AppHeader, AppText, PrimaryButton, ScreenContainer, spacing } from '../../design';
import { CodeInput, WaitNote } from './parts';
import type { Ctx } from './types';

export default function JoinRoom({ c }: { c: Ctx }) {
  const [code, setCode] = React.useState('');
  const ok = code.length === 4;
  const go = () => {
    if (!ok || c.busy) return;
    if (!c.name.trim()) return c.nav.push({ k: 'profile', hint: 'Choose a name so your friends can see who is at the table.' });
    c.join(code);
  };
  return (
    <ScreenContainer scroll safe={false}>
      <AppHeader title="Join a room" subtitle="Take a seat at a friend’s table" onBack={c.nav.pop} />
      <AppText variant="body" tone="muted" style={{ marginTop: spacing.xl, textAlign: 'center' }}>Enter the four-letter code your host is showing.</AppText>
      <View style={{ marginTop: spacing.xl }}><CodeInput value={code} onChange={setCode} autoFocus /></View>
      <AppText variant="caption" tone="muted" style={{ textAlign: 'center', marginTop: spacing.md }}>{code.length === 0 ? 'Letters only — it is not case-sensitive.' : ok ? 'Ready to join.' : `${4 - code.length} more letter${4 - code.length > 1 ? 's' : ''}`}</AppText>
      <PrimaryButton title="Join room" size="lg" disabled={!ok} loading={c.busy} onPress={go} style={{ marginTop: spacing.xl }} />
      <AppText variant="bodySm" tone="muted" style={{ textAlign: 'center', marginTop: spacing.lg }}>
        {c.name ? <>Joining as <AppText variant="bodySm">{c.name}</AppText> · </> : null}
        <AppText variant="bodySm" tone="gold" onPress={() => c.nav.push({ k: 'profile' })}>{c.name ? 'Change name' : 'Set your name'}</AppText>
      </AppText>
      <WaitNote busy={c.busy} what="join" />
    </ScreenContainer>
  );
}
