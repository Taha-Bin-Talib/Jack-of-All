import React from 'react';
import { ScrollView, Share, Text, View, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Btn } from '../ui';
import { leaveRoom, send, useNet } from '../net';
import { RULES } from '../rules';

export default function Lobby() {
  const { room, catalog, error } = useNet();
  if (!room) return null;
  const host = room.hostId === room.you.id;
  const info = catalog.find(g => g.id === room.game);
  const n = room.players.length;
  const ok = !!info && n >= info.min && n <= info.max && room.players.every(p => p.connected);
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={s.small}>Room code — share with friends</Text>
      <Text style={s.code} onPress={() => Share.share({ message: `Join my Jack of All room: ${room.code}` })}>{room.code}</Text>
      <Btn title="Share code" kind="ghost" onPress={() => Share.share({ message: `Join my Jack of All room with code ${room.code} in the Jack of All app!` })} />

      <Text style={s.h2}>Game</Text>
      <View style={s.wrap}>
        {catalog.map(g => (
          <Btn key={g.id} title={g.name} kind={room.game === g.id ? 'gold' : 'ghost'} disabled={!host} onPress={() => send({ t: 'setGame', game: g.id })} style={{ marginRight: 8, marginBottom: 8 }} />
        ))}
      </View>
      {info && <Text style={s.small}>{info.min}–{info.max} players. {RULES[room.game]?.text[0]}</Text>}

      {info?.settings.map(sp => (
        <View key={sp.key} style={{ marginTop: 12 }}>
          <Text style={s.h2}>{sp.label}</Text>
          <View style={s.wrap}>
            {sp.options.map(o => (
              <Btn key={o.value} title={o.label} kind={room.settings[sp.key] === o.value ? 'gold' : 'ghost'} disabled={!host} onPress={() => send({ t: 'settings', key: sp.key, value: o.value })} style={{ marginRight: 8, marginBottom: 8, paddingVertical: 8 }} />
            ))}
          </View>
        </View>
      ))}

      <Text style={[s.h2, { marginTop: 16 }]}>Players ({n})</Text>
      {room.players.map(p => (
        <View key={p.id} style={s.row}>
          <Text style={s.pn}>{p.name}{p.id === room.hostId ? '  👑' : ''}{p.id === room.you.id ? '  (you)' : ''}</Text>
          {!p.connected && <Text style={s.small}>offline</Text>}
          {host && p.id !== room.you.id && <Text style={s.kick} onPress={() => send({ t: 'kick', id: p.id })}>Remove</Text>}
        </View>
      ))}

      {error ? <Text style={s.err}>{error}</Text> : null}
      {host ? (
        <Btn title={ok ? 'Start game' : info && n < info.min ? `Need ${info.min - n} more player${info.min - n > 1 ? 's' : ''}` : 'Start game'} kind="green" disabled={!ok} style={{ marginTop: 18 }} onPress={() => send({ t: 'start' })} />
      ) : <Text style={[s.small, { textAlign: 'center', marginTop: 18 }]}>Waiting for the host to start…</Text>}
      <Btn title="Leave room" kind="ghost" style={{ marginTop: 10 }} onPress={leaveRoom} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  small: { color: C.dim, fontSize: 13, textAlign: 'center', marginBottom: 6 },
  code: { color: C.gold, fontSize: 52, fontWeight: '900', textAlign: 'center', letterSpacing: 10, marginBottom: 10 },
  h2: { color: C.text, fontSize: 17, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.panel, padding: 12, borderRadius: 12, marginBottom: 6 },
  pn: { color: C.text, fontSize: 16, fontWeight: '700', flex: 1 },
  kick: { color: C.danger, fontWeight: '700', marginLeft: 12 },
  err: { color: C.danger, textAlign: 'center', marginTop: 10 },
});
