import React from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AppText, Icons, Raised, TONES, TextField, borders, colors, fontFamily, radii, spacing } from './design';
import { onReact, send, useNet } from './net';

const REACTS = ['😂', '😢', '😉', '😡', '😮', '👏', '🔥', '👍'];

type Float = { key: number; e: string; name: string; x: number };

/* floating chat button (bottom right), chat panel with quick reactions, and emojis floating up the screen */
export default function Chat() {
  const net = useNet();
  const { width } = useWindowDimensions();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [seen, setSeen] = React.useState(0);
  const [floats, setFloats] = React.useState<Float[]>([]);
  const seq = React.useRef(0);
  const scroller = React.useRef<any>(null);
  const me = net.room?.you.id;
  const unread = open ? 0 : Math.max(0, net.chat.length - seen);

  React.useEffect(() => {
    return onReact(m => {
      const key = ++seq.current;
      setFloats(l => [...l, { key, e: m.e, name: m.name, x: 20 + Math.random() * Math.max(40, width - 120) }]);
      setTimeout(() => setFloats(l => l.filter(f => f.key !== key)), 2700);
    });
  }, [width]);
  React.useEffect(() => { if (open) { setSeen(net.chat.length); setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50); } }, [open, net.chat.length]);

  const submit = () => { const t = text.trim(); if (t) send({ t: 'chat', text: t }); setText(''); };
  return (
    <>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>{floats.map(({ key, ...f }) => <FloatEmoji key={key} {...f} />)}</View>
      {open && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none" style={st.avoid}>
          <View style={[st.panel, { width: Math.min(340, width - 20) }]}>
            <View style={st.reacts}>
              {REACTS.map(e => <Pressable key={e} style={({ pressed }) => [st.rbtn, pressed && { backgroundColor: colors.line }]} hitSlop={2} accessibilityRole="button" accessibilityLabel={`React ${e}`} onPress={() => send({ t: 'react', e })}><Text style={{ fontSize: 22 }}>{e}</Text></Pressable>)}
            </View>
            <ScrollView ref={scroller} style={st.log} contentContainerStyle={{ padding: 8 }}>
              {net.chat.length === 0 && <AppText variant="bodySm" tone="muted" style={st.empty}>No messages yet — say hello.</AppText>}
              {net.chat.map((m, i) => (
                <Text key={i} style={st.msg}><Text style={[st.who, m.id === me && { color: colors.text }]}>{m.id === me ? 'You' : m.name}  </Text>{m.text}</Text>
              ))}
            </ScrollView>
            <View style={st.form}>
              <TextField value={text} onChangeText={setText} onSubmitEditing={submit} maxLength={120} placeholder="Say something…" style={st.input} returnKeyType="send" accessibilityLabel="Chat message" />
              <Raised tone={text.trim() ? TONES.gold : TONES.off} height={40} edge={4} disabled={!text.trim()} onPress={submit} accessibilityLabel="Send message" style={{ width: 76 }}><Text style={[st.sendT, !text.trim() && { color: colors.textMuted }]}>Send</Text></Raised>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
      <View style={st.fab} pointerEvents="box-none">
        <Raised tone={TONES.green} height={48} edge={4} radius={26} onPress={() => setOpen(o => !o)} accessibilityLabel={unread > 0 ? `Chat, ${unread} unread` : open ? 'Close chat' : 'Open chat'} style={{ width: 52 }}>
          {open ? <Icons.Close size={22} color={colors.gold} /> : <Icons.Chat size={22} color={colors.gold} />}
        </Raised>
        {unread > 0 && <View style={st.badge} pointerEvents="none"><Text style={st.badgeT}>{unread}</Text></View>}
      </View>
    </>
  );
}

function FloatEmoji({ e, name, x }: Omit<Float, 'key'>) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(t, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, []);
  return (
    <Animated.View style={{ position: 'absolute', left: x, bottom: 100, alignItems: 'center',
      opacity: t.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -260] }) }, { scale: t.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0.5, 1.2, 1] }) }] }}>
      <Text style={{ fontSize: 46 }}>{e}</Text>
      <Text style={st.fname}>{name}</Text>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  fab: { position: 'absolute', right: 14, bottom: 14, width: 52, height: 52 },
  badge: { position: 'absolute', top: -4, right: -4, zIndex: 3, backgroundColor: colors.oxblood, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: colors.bg },
  badgeT: { color: colors.text, fontSize: 11, fontFamily: fontFamily.bold },
  avoid: { position: 'absolute', left: 0, right: 0, bottom: 80, alignItems: 'flex-end', paddingRight: 10 },
  panel: { backgroundColor: colors.bgAlt, borderWidth: borders.hair, borderColor: colors.goldDim, borderRadius: radii.lg, maxHeight: 340, elevation: 12, overflow: 'hidden' },
  reacts: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 10 },
  rbtn: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 4, paddingVertical: 4 },
  log: { minHeight: 90, maxHeight: 170 },
  empty: { textAlign: 'center', marginTop: 12 },
  msg: { color: colors.text, fontSize: 14, lineHeight: 20, marginVertical: 2, fontFamily: fontFamily.regular },
  who: { color: colors.gold, fontFamily: fontFamily.bold },
  form: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, alignItems: 'center' },
  input: { flex: 1, minWidth: 0, fontSize: 15, minHeight: 44, paddingVertical: 8 },
  
  sendT: { color: colors.onGold, fontFamily: fontFamily.bold, fontSize: 15 },
  fname: { color: colors.text, backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 10, paddingHorizontal: 8, fontSize: 12, fontFamily: fontFamily.semibold, overflow: 'hidden' },
});
