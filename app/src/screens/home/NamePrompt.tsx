import React from 'react';
import { View } from 'react-native';
import { AppText, PrimaryButton, ScreenContainer, TextField, spacing } from '../../design';

/* Shown once, the first time the app opens (and any time no name is saved): "who is sitting down?" */
export default function NamePrompt({ onDone }: { onDone: (name: string) => void }) {
  const [n, setN] = React.useState('');
  const ok = n.trim().length > 0;
  const go = () => { if (ok) onDone(n.trim()); };
  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingTop: spacing.giant, paddingBottom: spacing.giant }}>
      <AppText variant="label" tone="gold">Welcome to the club</AppText>
      <AppText variant="display" style={{ marginTop: spacing.sm }}>What should we call you?</AppText>
      <AppText variant="body" tone="muted" style={{ marginTop: spacing.md }}>This is the name other players see at the table.</AppText>
      <View style={{ marginTop: spacing.xxl }}>
        <TextField value={n} onChangeText={setN} placeholder="Your name" maxLength={14} autoFocus accessibilityLabel="Your name" returnKeyType="done" onSubmitEditing={go} />
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>Up to 14 characters. You can change it later in Profile.</AppText>
      </View>
      <PrimaryButton title="Take a seat" disabled={!ok} onPress={go} style={{ marginTop: spacing.xl }} />
    </ScreenContainer>
  );
}
