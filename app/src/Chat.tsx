import React from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { C } from './theme';
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
              {REACTS.map(e => <Pressable key={e} style={st.rbtn} onPress={() => send({ t: 'react', e })}><Text style={{ fontSize: 22 }}>{e}</Text></Pressable>)}
            </View>
            <ScrollView ref={scroller} style={st.log} contentContainerStyle={{ padding: 8 }}>
              {net.chat.length === 0 && <Text style={st.empty}>No messages yet — say hi!</Text>}
              {net.chat.map((m, i) => (
                <Text key={i} style={st.msg}><Text style={[st.who, m.id === me && { color: '#9fe6b4' }]}>{m.name}: </Text>{m.text}</Text>
              ))}
            </ScrollView>
            <View style={st.form}>
              <TextInput value={text} onChangeText={setText} onSubmitEditing={submit} maxLength={120} placeholder="Say something…" placeholderTextColor={C.dim} style={st.input} returnKeyType="send" />
              <Pressable onPress={submit} style={st.send}><Text style={{ color: '#1d1405', fontWeight: '800' }}>Send</Text></Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
      <Pressable onPress={() => setOpen(o => !o)} style={st.fab} accessibilityLabel="Chat">
        <Text style={{ fontSize: 24 }}>💬</Text>
        {unread > 0 && <View style={st.badge}><Text style={st.badgeT}>{unread}</Text></View>}
      </Pressable>
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
  fab: { position: 'absolute', right: 14, bottom: 18, width: 54, height: 54, borderRadius: 27, borderWidth: 2.5, borderColor: C.gold, backgroundColor: '#0a3d29', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 6 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ff5252', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeT: { color: '#fff', fontSize: 12, fontWeight: '800' },
  avoid: { position: 'absolute', left: 0, right: 0, bottom: 82, alignItems: 'flex-end', paddingRight: 10 },
  panel: { backgroundColor: '#0a3d29', borderWidth: 2, borderColor: C.gold, borderRadius: 16, maxHeight: 340, elevation: 12, overflow: 'hidden' },
  reacts: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 8 },
  rbtn: { backgroundColor: 'rgba(255,255,255,.08)', borderRadius: 10, paddingHorizontal: 4, paddingVertical: 4 },
  log: { minHeight: 90, maxHeight: 170 },
  empty: { color: C.dim, textAlign: 'center', marginTop: 12 },
  msg: { color: '#fff', fontSize: 14, marginVertical: 2 },
  who: { color: C.gold, fontWeight: '800' },
  form: { flexDirection: 'row', gap: 6, padding: 8 },
  input: { flex: 1, minWidth: 0, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(0,0,0,.35)', color: '#fff', paddingHorizontal: 10, paddingVertical: 8, fontSize: 16 },
  send: { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  fname: { color: '#fff', backgroundColor: 'rgba(0,0,0,.6)', borderRadius: 10, paddingHorizontal: 8, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
});
