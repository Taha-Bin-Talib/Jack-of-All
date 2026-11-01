import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { borders, colors, radii, shadows, sizes, spacing } from '../tokens';
import { AppText } from './AppText';

type BtnProps = { title: string; onPress?: () => void; disabled?: boolean; loading?: boolean; size?: 'sm' | 'md' | 'lg'; fullWidth?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string };

function Base({ title, onPress, disabled, loading, size = 'md', fullWidth = true, style, accessibilityLabel, kind }: BtnProps & { kind: 'primary' | 'secondary' }) {
  const primary = kind === 'primary', off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        st.base, { height: sizes.button[size] }, fullWidth ? st.full : st.auto,
        primary ? [st.primary, off ? st.primaryOff : shadows.sm] : st.secondary,
        pressed && !off && (primary ? st.primaryDown : st.secondaryDown),
        off && !primary && { opacity: 0.45 }, style,
      ]}>
      {loading ? <ActivityIndicator color={primary ? colors.onGold : colors.gold} /> : <AppText variant="button" tone={primary ? (off ? 'muted' : 'onGold') : 'primary'}>{title}</AppText>}
    </Pressable>
  );
}

/* One primary action per screen: solid antique gold. */
export const PrimaryButton = (p: BtnProps) => <Base {...p} kind="primary" />;
/* Everything else: quiet gold hairline on green. */
export const SecondaryButton = (p: BtnProps) => <Base {...p} kind="secondary" />;

/* Square-ish icon button (44dp touch target by default). Pass an icon from ./icons as children. */
export function IconButton({ children, onPress, label, size = 'md', filled, style }: { children: React.ReactNode; onPress?: () => void; label: string; size?: 'sm' | 'md' | 'lg'; filled?: boolean; style?: StyleProp<ViewStyle> }) {
  const d = sizes.iconButton[size];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={spacing.xs}
      style={({ pressed }) => [st.icon, { width: d, height: d }, filled && { backgroundColor: colors.bgAlt }, pressed && { opacity: 0.65 }, style]}>
      <View>{children}</View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  base: { borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  full: { alignSelf: 'stretch' }, auto: { alignSelf: 'flex-start' },
  primary: { backgroundColor: colors.gold },
  primaryOff: { backgroundColor: 'rgba(189,152,87,0.16)', borderWidth: borders.hair, borderColor: colors.line },
  primaryDown: { backgroundColor: '#A98549' },
  secondary: { backgroundColor: 'transparent', borderWidth: borders.hair, borderColor: colors.lineStrong },
  secondaryDown: { backgroundColor: 'rgba(189,152,87,0.12)' },
  icon: { borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', borderWidth: borders.hair, borderColor: colors.line },
});
