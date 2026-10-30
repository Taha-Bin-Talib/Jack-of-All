import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Btn } from '../ui';
import { getSnap, saveName, savedName, send, setServer, useNet } from '../net';
import { RULES } from '../rules';

const GAMES = [{ id: 'thulla', name: 'Bhabhi Thulla', sub: '3–8 players' }, { id: 'bluff', name: 'Bluff', sub: '3–10 players' }, { id: 'jackthief', name: 'Jack Thief', sub: '2–10 players' }];

export default function Home() {
  const net = useNet();
  const [name, setName] = React.useState(''), [code, setCode] = React.useState('');
  const [game, setGame] = React.useState('thulla'), [mode, setMode] = React.useState<'home' | 'rules' | 'server'>('home');
  const [url, setUrl] = React.useState(getSnap().server), [busy, setBusy] = React.useState(false);
  React.useEffect(() => { savedName().then(n => n && setName(n)); }, []);
  React.useEffect(() => { setBusy(false); }, [net.errSeq, net.room]);
  const go = (m: any) => { if (!name.trim()) return; saveName(name.trim()); setBusy(true); send({ ...m, name: name.trim() }); };

  if (mode === 'rules') return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {Object.values(RULES).map(r => (
        <View key={r.title} style={{ marginBottom: 18 }}>
          <Text style={s.h2}>{r.title}</Text>
          {r.text.map((t, i) => <Text key={i} style={s.p}>• {t}</Text>)}
        </View>
      ))}
      <Btn title="Back" kind="ghost" onPress={() => setMode('home')} />
    </ScrollView>
  );
  if (mode === 'server') return (
    <View style={{ padding: 20 }}>
      <Text style={s.h2}>Server address</Text>
      <Text style={s.p}>Normally you never need to change this. Use wss://your-server for a hosted server.</Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} style={s.input} placeholderTextColor={C.dim} />
      <Btn title="Save" onPress={() => { setServer(url); setMode('home'); }} />
      <Btn title="Back" kind="ghost" style={{ marginTop: 10 }} onPress={() => setMode('home')} />
    </View>
  );
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>♠ Jack of All ♥</Text>
        <Text style={s.tag}>Play cards with friends online</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.dim} maxLength={14} style={s.input} />

        <Text style={s.h2}>Host a room</Text>
        {GAMES.map(g => (
          <Btn key={g.id} title={`${g.name}  ·  ${g.sub}`} kind={game === g.id ? 'gold' : 'ghost'} style={{ marginBottom: 8 }} onPress={() => setGame(g.id)} />
        ))}
        <Btn title="Create room" kind="green" disabled={!name.trim() || busy} onPress={() => go({ t: 'create', game })} />

        <Text style={[s.h2, { marginTop: 22 }]}>Join a friend</Text>
        <TextInput value={code} onChangeText={t => setCode(t.toUpperCase())} placeholder="Room code" placeholderTextColor={C.dim} autoCapitalize="characters" maxLength={4} style={[s.input, { textAlign: 'center', letterSpacing: 6, fontSize: 24 }]} />
        <Btn title="Join room" disabled={!name.trim() || code.length !== 4 || busy} onPress={() => go({ t: 'join', code })} />

        {busy && <ActivityIndicator color={C.gold} style={{ marginTop: 14 }} />}
        {net.error ? <Text style={s.err}>{net.error}</Text> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 }}>
          <Text style={s.link} onPress={() => setMode('rules')}>How to play</Text>
          <Text style={s.link} onPress={() => setMode('server')}>Server</Text>
        </View>
        <Text style={[s.p, { textAlign: 'center', marginTop: 14 }]}>{net.conn === 'online' ? '● connected' : net.conn === 'connecting' ? '○ connecting…' : '○ not connected yet'}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  logo: { color: C.gold, fontSize: 32, fontWeight: '900', textAlign: 'center', marginTop: 20 },
  tag: { color: C.dim, textAlign: 'center', marginBottom: 20 },
  h2: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 10, marginTop: 6 },
  p: { color: C.dim, fontSize: 14, lineHeight: 20, marginBottom: 6 },
  input: { backgroundColor: 'rgba(0,0,0,.35)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17, marginBottom: 14 },
  err: { color: C.danger, textAlign: 'center', marginTop: 12 },
  link: { color: C.gold, fontWeight: '700', fontSize: 15 },
});
