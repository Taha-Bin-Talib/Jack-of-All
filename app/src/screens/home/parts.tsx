import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText, borders, colors, radii, sizes, spacing } from '../../design';
import { fontFamily } from '../../design/typography';
import { useNet } from '../../net';

export function PressNote({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => pressed && { opacity: 0.7 }}>{children}</Pressable>;
}

/* In-flight create/join feedback (the free server may need to wake up) plus any server / connection error. */
export function WaitNote({ busy, what = 'host' }: { busy: boolean; what?: 'host' | 'join' }) {
  const net = useNet();
  const offline = /did not wake|internet/i.test(net.error || '');
  return (
    <View>
      {busy && (
        <View style={st.wait}>
          <ActivityIndicator color={colors.gold} />
          <AppText variant="bodySm" style={{ flex: 1 }}>{net.conn === 'online' ? 'Almost there…' : `Please wait — it can take up to 30–60 seconds to ${what} while the server wakes up. Keep the app open.`}</AppText>
        </View>
      )}
      {!busy && net.warming && net.conn !== 'online' && <AppText variant="bodySm" tone="muted" style={{ marginTop: spacing.md }}>Waking up the server… this can take up to 30–60 seconds the first time.</AppText>}
      {!busy && net.error ? (
        <View style={st.err} accessibilityLiveRegion="polite">
          <AppText variant="label" style={{ color: '#E2B1B6' }}>{offline ? 'Connection problem' : what === 'join' ? 'Couldn’t join' : 'Couldn’t create the room'}</AppText>
          <AppText variant="bodySm" style={{ marginTop: spacing.xs }}>{net.error}</AppText>
        </View>
      ) : null}
    </View>
  );
}

/* Four card-like plates showing a room code; a hidden TextInput does the typing so it is easy on any keyboard. */
export function CodeInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const ref = React.useRef<React.ComponentRef<typeof TextInput>>(null);
  const [focus, setFocus] = React.useState(!!autoFocus);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Room code" style={st.codeRow}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[st.plate, focus && i === Math.min(value.length, 3) && st.plateOn, value[i] && st.plateFull]}>
          <AppText style={st.letter}>{value[i] || ''}</AppText>
        </View>
      ))}
      <TextInput ref={ref} value={value} autoFocus={autoFocus} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChangeText={t => onChange(t.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
        autoCapitalize="characters" autoCorrect={false} maxLength={8} caretHidden style={st.hidden} accessibilityLabel="Room code" />
    </Pressable>
  );
}
const st = StyleSheet.create({
  wait: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.lineStrong, backgroundColor: 'rgba(189,152,87,0.08)' },
  err: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.oxblood, backgroundColor: 'rgba(118,47,54,0.35)' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  plate: { width: 64, height: 84, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: borders.hair, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  plateOn: { borderColor: colors.gold, borderWidth: borders.strong },
  plateFull: { backgroundColor: colors.card.face, borderColor: colors.card.edge },
  letter: { fontFamily: fontFamily.display, fontSize: 40, lineHeight: 48, color: colors.card.ink },
  hidden: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.01, color: 'transparent', fontSize: 1 },
});
