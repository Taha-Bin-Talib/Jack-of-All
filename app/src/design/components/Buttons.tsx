import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadows, sizes, spacing } from '../tokens';
import { AppText } from './AppText';

type BtnProps = { title: string; onPress?: () => void; disabled?: boolean; loading?: boolean; size?: 'sm' | 'md' | 'lg'; fullWidth?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string };

/* ── 3D button: a face that sits on a darker edge and presses down into it ── */
export type Tone3D = { face: string; edge: string; hi: string; fg: string };
export const TONES: Record<'gold' | 'green' | 'red' | 'off', Tone3D> = {
  gold: { face: colors.gold, edge: '#7C6030', hi: '#DCC48C', fg: colors.onGold },
  green: { face: '#2D5646', edge: '#0D241C', hi: '#4A7A66', fg: colors.text },
  red: { face: '#8E3A44', edge: '#4B1B22', hi: '#B0606A', fg: colors.text },
  off: { face: '#2A3C34', edge: '#1B2822', hi: '#2A3C34', fg: colors.textMuted },
};
export function Raised({ tone, height, edge = 5, radius = radii.md, onPress, disabled, accessibilityLabel, accessibilityHint, style, children, hitSlop }: {
  tone: Tone3D; height: number; edge?: number; radius?: number; onPress?: () => void; disabled?: boolean; accessibilityLabel: string; accessibilityHint?: string; style?: StyleProp<ViewStyle>; children: React.ReactNode; hitSlop?: number;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} accessibilityState={{ disabled: !!disabled }} hitSlop={hitSlop}
      onPress={disabled ? undefined : onPress} style={[{ height: height + edge }, style]}>
      {({ pressed }) => {
        const down = pressed && !disabled, dy = down ? edge - 1 : 0;
        return (
          <>
            <View pointerEvents="none" style={[st.edge, { top: edge, borderRadius: radius, backgroundColor: tone.edge }, !disabled && shadows.sm]} />
            <View pointerEvents="none" style={[st.face, { height, borderRadius: radius, backgroundColor: tone.face, borderTopColor: tone.hi, transform: [{ translateY: dy }] }]}>{children}</View>
          </>
        );
      }}
    </Pressable>
  );
}

function Base({ title, onPress, disabled, loading, size = 'md', fullWidth = true, style, accessibilityLabel, kind }: BtnProps & { kind: 'primary' | 'secondary' }) {
  const primary = kind === 'primary', off = disabled || loading;
  const tone = off && !loading ? TONES.off : primary ? TONES.gold : TONES.green;
  return (
    <Raised tone={tone} height={sizes.button[size]} edge={size === 'sm' ? 3 : 5} onPress={onPress} disabled={off} accessibilityLabel={accessibilityLabel || title}
      style={[fullWidth ? st.full : st.auto, style]}>
      {loading ? <ActivityIndicator color={tone.fg} /> : <AppText variant="button" style={{ color: tone.fg }}>{title}</AppText>}
    </Raised>
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
    <Raised tone={TONES.green} height={d - 3} edge={3} onPress={onPress} accessibilityLabel={label} hitSlop={spacing.xs} style={[{ width: d }, style]}>
      <View>{children}</View>
    </Raised>
  );
}

const st = StyleSheet.create({
  full: { alignSelf: 'stretch' }, auto: { alignSelf: 'flex-start' },
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  face: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, borderTopWidth: 1.5 },
});
