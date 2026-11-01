import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borders, colors, sizes, spacing } from '../tokens';
import { AppText } from './AppText';
import { ChevronLeft } from './icons';
import { IconButton } from './Buttons';

/* Page shell: green background, safe-area padding, side gutters, centred column on tablets.
   `safe` — apply device insets. (The current App root already pads for insets, so pass safe={false}
   for screens rendered inside it until the root is migrated.) */
export function ScreenContainer({ children, scroll, safe = true, style, contentStyle }: { children: React.ReactNode; scroll?: boolean; safe?: boolean; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle> }) {
  const ins = useSafeAreaInsets();
  const pad = safe ? { paddingTop: ins.top, paddingBottom: ins.bottom, paddingLeft: ins.left, paddingRight: ins.right } : null;
  const inner = [st.column, contentStyle];
  return (
    <View style={[st.root, pad, style]}>
      {scroll
        ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}><View style={inner}>{children}</View></ScrollView>
        : <View style={[st.fill, inner]}>{children}</View>}
    </View>
  );
}

/* Top bar: optional back button, centred-left title (Playfair), optional right slot. */
export function AppHeader({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={st.header}>
      {onBack ? <IconButton label="Back" onPress={onBack}><ChevronLeft /></IconButton> : null}
      <View style={{ flex: 1 }}>
        <AppText variant="h2" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="bodySm" tone="muted" numberOfLines={1}>{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
}

/* Small-caps gold label with a hairline rule; optional right-hand action text. */
export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={st.section}>
      <AppText variant="label" tone="gold">{title}</AppText>
      <View style={st.rule} />
      {action ? <AppText variant="label" tone="muted" onPress={onAction}>{action}</AppText> : null}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 }, fill: { flex: 1 },
  column: { width: '100%', maxWidth: sizes.maxContent, alignSelf: 'center', paddingHorizontal: sizes.gutter },
  header: { minHeight: sizes.header, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  section: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  rule: { flex: 1, height: borders.hair, backgroundColor: colors.line },
});
