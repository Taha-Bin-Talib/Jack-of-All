import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, borders, colors, radii, spacing } from '../../design';
import { useNet } from '../../net';

export function PressNote({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => pressed && { opacity: 0.7 }}>{children}</Pressable>;
}

/* shown while a create/join request is in flight (the free server may need to wake up) + any error */
export function WaitNote({ busy }: { busy: boolean }) {
  const net = useNet();
  return (
    <View>
      {busy && (
        <View style={st.wait}>
          <ActivityIndicator color={colors.gold} />
          <AppText variant="bodySm" style={{ flex: 1 }}>{net.conn === 'online' ? 'Almost there…' : 'Please wait — it can take up to 30–60 seconds to host while the server wakes up. Keep the app open.'}</AppText>
        </View>
      )}
      {!busy && net.warming && net.conn !== 'online' && <AppText variant="bodySm" tone="muted" style={{ marginTop: spacing.md }}>Waking up the server… this can take up to 30–60 seconds the first time.</AppText>}
      {net.error ? <AppText variant="bodySm" style={{ marginTop: spacing.md, color: '#D9A3A8' }}>{net.error}</AppText> : null}
    </View>
  );
}
const st = StyleSheet.create({
  wait: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.lineStrong, backgroundColor: 'rgba(189,152,87,0.08)' },
});
