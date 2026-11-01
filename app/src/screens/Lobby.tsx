import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppHeader, AppText, PrimaryButton, ScreenContainer, SecondaryButton, SectionHeading, borders, colors, radii, spacing } from '../design';
import { leaveRoom, send, useNet } from '../net';
import { GAMES, GameId } from '../games';
import { LobbyTable, PlayerRow, RoomCode, isReady } from './lobby/parts';
import { useLobbyEvents } from './lobby/useLobbyEvents';

const SUIT: Record<string, string> = { thulla: 'S', bluff: 'D', jackthief: 'C' };

export default function Lobby() {
  const { room, catalog, error, errSeq, conn } = useNet();
  const [starting, setStarting] = React.useState(false), [toast, setToast] = React.useState<{ text: string; tone: string } | null>(null);
  const players = room?.players || [];
  const ev = useLobbyEvents(players, room?.hostId || '', room?.you.id || '');
  React.useEffect(() => { setStarting(false); }, [errSeq]);
  React.useEffect(() => { if (!ev) return; setToast(ev); const t = setTimeout(() => setToast(null), 3600); return () => clearTimeout(t); }, [ev?.seq]);
  if (!room) return null;

  const me = room.you.id, host = room.hostId === me, meP = players.find(p => p.id === me);
  const info = catalog.find(g => g.id === room.game), meta = GAMES[room.game as GameId];
  const n = players.length, min = info?.min ?? 2, max = info?.max ?? 10;
  const away = players.filter(p => !p.connected), readyN = players.filter(p => p.connected && isReady(p, room.hostId)).length;
  const allReady = n >= min && away.length === 0 && readyN === n;
  const canStart = !!info && n >= min && n <= max && away.length === 0 && conn === 'online';
  const hostName = players.find(p => p.id === room.hostId)?.name || 'the host';
  const exit = () => {
    if (Platform.OS === 'web') return leaveRoom();
    Alert.alert('Exit room?', host ? 'You will leave the table and the host passes to another player.' : 'You will leave this table.', [{ text: 'Stay', style: 'cancel' }, { text: 'Exit', style: 'destructive', onPress: leaveRoom }]);
  };

  /* one honest status line for every state the table can be in */
  let status: { text: string; tone: 'gold' | 'muted' | 'warn' };
  if (conn !== 'online') status = { text: 'Connection lost — trying to reconnect…', tone: 'warn' };
  else if (starting) status = { text: 'Game starting…', tone: 'gold' };
  else if (n < min) status = { text: `Waiting for players — need ${min - n} more`, tone: 'muted' };
  else if (away.length) status = { text: `Waiting for ${away.map(p => p.name).join(', ')} to reconnect`, tone: 'warn' };
  else if (allReady) status = { text: host ? 'Everyone is ready — deal the cards!' : `Everyone is ready — waiting for ${hostName} to start`, tone: 'gold' };
  else status = { text: `${readyN} of ${n} ready`, tone: 'muted' };

  return (
    <ScreenContainer scroll safe={false} contentStyle={{ paddingBottom: 96 }}>
      <AppHeader title={meta?.name || room.gameName} subtitle={`${n} of ${max} seats taken`} right={<SecondaryButton title="Exit" size="sm" fullWidth={false} onPress={exit} />} />

      <View style={st.toastSlot}>
        {toast ? <View style={[st.toast, toast.tone === 'warn' && { borderColor: colors.oxblood }, toast.tone === 'good' && { borderColor: colors.lineStrong }]} accessibilityLiveRegion="polite"><AppText variant="bodySm">{toast.text}</AppText></View> : null}
      </View>

      <RoomCode code={room.code} gameName={meta?.name || room.gameName} />

      <SectionHeading title="Around the table" />
      <LobbyTable players={players} meId={me} hostId={room.hostId} seats={Math.max(min, Math.min(max, n + 1))} suit={SUIT[room.game] || 'S'} />
      <AppText variant="body" tone={status.tone === 'gold' ? 'gold' : 'muted'} accessibilityLiveRegion="polite"
        style={[{ textAlign: 'center', marginTop: spacing.sm }, status.tone === 'warn' && { color: '#E2B1B6' }]}>{status.text}</AppText>

      {/* actions */}
      <View style={{ marginTop: spacing.lg }}>
        {host ? (
          <>
            <PrimaryButton title={starting ? 'Starting…' : allReady || n < min ? 'Start game' : 'Start anyway'} size="lg" loading={starting} disabled={!canStart}
              onPress={() => { setStarting(true); send({ t: 'start' }); }} />
            {n < min
              ? <AppText variant="caption" tone="muted" style={st.hint}>The game needs at least {min} players.</AppText>
              : !allReady && canStart ? <AppText variant="caption" tone="muted" style={st.hint}>Not everyone is ready yet — you can still start.</AppText> : null}
          </>
        ) : (
          <>
            {meP?.ready
              ? <SecondaryButton title="Not ready" size="lg" onPress={() => send({ t: 'ready', on: false })} />
              : <PrimaryButton title="I’m ready" size="lg" onPress={() => send({ t: 'ready', on: true })} />}
            <AppText variant="caption" tone="muted" style={st.hint}>Waiting for {hostName} to start the game.</AppText>
          </>
        )}
        {error ? <View style={st.err}><AppText variant="bodySm">{error}</AppText></View> : null}
      </View>

      <SectionHeading title={`Players · ${n}`} />
      {players.map(p => <PlayerRow key={p.id} p={p} meId={me} hostId={room.hostId} canKick={host} onKick={() => send({ t: 'kick', id: p.id })} />)}

      {/* game + settings: the host can change them, everyone can see them */}
      <SectionHeading title="The game" />
      <View style={st.chips}>
        {catalog.map(g => {
          const on = room.game === g.id;
          return (
            <Pressable key={g.id} disabled={!host || on} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !host }} onPress={() => send({ t: 'setGame', game: g.id })}
              style={({ pressed }) => [st.chip, on && st.chipOn, !host && !on && { opacity: 0.45 }, pressed && { opacity: 0.8 }]}>
              <AppText variant="bodySm" tone={on ? 'gold' : 'primary'} style={{ textAlign: 'center' }}>{g.name}</AppText>
              <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>{g.min}–{g.max}</AppText>
            </Pressable>
          );
        })}
      </View>
      {info?.settings.map(sp => (
        <View key={sp.key} style={{ marginTop: spacing.lg }}>
          <AppText variant="label" tone="muted" style={{ marginBottom: spacing.sm }}>{sp.label}</AppText>
          <View style={st.chips}>
            {sp.options.map(o => {
              const on = room.settings[sp.key] === o.value;
              return (
                <Pressable key={o.value} disabled={!host || on} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !host }} onPress={() => send({ t: 'settings', key: sp.key, value: o.value })}
                  style={({ pressed }) => [st.chip, on && st.chipOn, !host && !on && { opacity: 0.45 }, pressed && { opacity: 0.8 }]}>
                  <AppText variant="bodySm" tone={on ? 'gold' : 'primary'} style={{ textAlign: 'center' }}>{o.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {!host && <AppText variant="caption" tone="muted" style={{ marginTop: spacing.md }}>Only the host can change the game and its settings.</AppText>}
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  toastSlot: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  toast: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.line, backgroundColor: colors.surface },
  hint: { textAlign: 'center', marginTop: spacing.sm },
  err: { marginTop: spacing.md, padding: spacing.md, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.oxblood, backgroundColor: 'rgba(118,47,54,0.35)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexGrow: 1, minWidth: 96, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.line, backgroundColor: colors.bgAlt },
  chipOn: { borderColor: colors.gold, borderWidth: borders.strong },
});
