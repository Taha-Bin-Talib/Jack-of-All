import React from 'react';
import { TextInput, View } from 'react-native';
import { AppHeader, AppText, PlayerAvatar, PrimaryButton, ScreenContainer, borders, colors, fontFamilyRef, radii, sizes, spacing } from '../../design';
import type { Ctx } from './types';

export default function Profile({ c, hint }: { c: Ctx; hint?: string }) {
  const [n, setN] = React.useState(c.name);
  const ok = n.trim().length > 0;
  return (
    <ScreenContainer scroll safe={false}>
      <AppHeader title="Profile" subtitle="How you appear at the table" onBack={c.nav.pop} />
      <View style={{ alignItems: 'center', marginTop: spacing.xl }}><PlayerAvatar name={n || '?'} size="lg" /></View>
      {hint ? <AppText variant="bodySm" tone="gold" style={{ textAlign: 'center', marginTop: spacing.lg }}>{hint}</AppText> : null}
      <AppText variant="label" tone="muted" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Display name</AppText>
      <TextInput value={n} onChangeText={setN} placeholder="Your name" placeholderTextColor={colors.textMuted} maxLength={14} autoFocus={!!hint} accessibilityLabel="Display name"
        style={{ height: sizes.button.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: borders.hair, borderColor: colors.line, color: colors.text, paddingHorizontal: spacing.lg, fontFamily: fontFamilyRef.medium, fontSize: 17 }} />
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>Up to 14 characters. Other players see this name in rooms.</AppText>
      <PrimaryButton title="Save" disabled={!ok} style={{ marginTop: spacing.xl }} onPress={() => { c.saveProfile(n.trim()); c.nav.pop(); }} />
    </ScreenContainer>
  );
}
