import React from 'react';
import { Pressable, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Appear, AppText, PlayerAvatar, PrimaryButton, SecondaryButton, borders, colors, radii, sizes, spacing, Icons } from '../../design';
import { fontFamily } from '../../design/typography';
import { Suit } from '../../ui';
import type { Player } from '../../types';

export const isReady = (p: Player, hostId: string) => p.id === hostId || !!p.ready;

/* ── room code: four ivory plates, tap to copy, share sheet for invites ── */
export function RoomCode({ code, gameName }: { code: string; gameName: string }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(false), 1800); return () => clearTimeout(t); }, [copied]);
  const copy = async () => { try { await Clipboard.setStringAsync(code); setCopied(true); } catch {} };
  const share = () => Share.share({ message: `Join my ${gameName} table on Jack of All — room code ${code}` }).catch(() => {});
  return (
    <View>
      <AppText variant="label" tone="muted" style={{ textAlign: 'center' }}>Room code</AppText>
      <Pressable onPress={copy} accessibilityRole="button" accessibilityLabel={`Room code ${code.split('').join(' ')}. Tap to copy.`} style={({ pressed }) => [st.codeRow, pressed && { opacity: 0.85 }]}>
        {code.split('').map((ch, i) => <View key={i} style={st.plate}><AppText style={st.letter}>{ch}</AppText></View>)}
      </Pressable>
      <AppText variant="bodySm" tone={copied ? 'gold' : 'muted'} accessibilityLiveRegion="polite" style={{ textAlign: 'center', marginTop: spacing.sm, minHeight: 20 }}>{copied ? 'Copied to clipboard ✓' : 'Tap the code to copy it'}</AppText>
      <View style={st.btns}>
        <SecondaryButton title={copied ? 'Copied' : 'Copy code'} fullWidth={false} style={{ flex: 1 }} onPress={copy} />
        <PrimaryButton title="Invite friends" fullWidth={false} style={{ flex: 1 }} onPress={share} />
      </View>
    </View>
  );
}

/* ── the table: an oval of felt with seats around it. Real players first (you at the bottom), then open seats ── */
export function LobbyTable({ players, meId, hostId, seats, suit }: { players: Player[]; meId: string; hostId: string; seats: number; suit: string }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, sizes.maxContent + 40) - sizes.gutter * 2, H = Math.round(W * 0.82);
  const meIdx = Math.max(0, players.findIndex(p => p.id === meId));
  const ordered = [...players.slice(meIdx), ...players.slice(0, meIdx)];
  const slots: (Player | null)[] = [...ordered, ...Array(Math.max(0, seats - ordered.length)).fill(null)];
  const rx = W / 2 - 40, ry = H / 2 - 44, cx = W / 2, cy = H / 2;
  // with three seats or fewer nobody sits at the top, so trim the empty space above the felt
  const crop = Math.max(seats, players.length) <= 3 ? Math.round(cy - ry * 0.8 - 14) : 0;
  return (
    <View style={{ width: W, height: H - crop, alignSelf: 'center' }}>
      <View style={{ position: 'absolute', left: 0, top: -crop, width: W, height: H }}>
      <View style={[st.felt, { left: cx - rx * 0.86, top: cy - ry * 0.8, width: rx * 1.72, height: ry * 1.6, borderRadius: ry * 0.8 }]}>
        <View style={[st.feltIn, { borderRadius: ry * 0.8 - 8 }]}>
          <Suit s={suit} size={26} color={colors.goldDim} />
        </View>
      </View>
      {slots.map((p, k) => {
        const a = Math.PI / 2 + (k * 2 * Math.PI) / slots.length;
        const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
        return (
          <Appear key={p ? p.id : 'empty' + k} dy={6} duration={260} style={[st.seat, { left: x - 36, top: y - 28 }]}>
            {p ? (
              <View style={{ opacity: p.connected ? 1 : 0.45 }}>
                <PlayerAvatar name={p.name} size="md" active={p.id === hostId} online={p.connected} />
              </View>
            ) : <View style={st.empty} accessibilityLabel="Open seat" />}
            <AppText variant="caption" numberOfLines={1} tone={p ? 'primary' : 'muted'} style={st.seatName}>{p ? (p.id === meId ? 'You' : p.name) : 'Open'}</AppText>
          </Appear>
        );
      })}
      </View>
    </View>
  );
}

/* ── one row per player: avatar, name, host / you tags and a live status ── */
export function PlayerRow({ p, meId, hostId, canKick, onKick }: { p: Player; meId: string; hostId: string; canKick: boolean; onKick: () => void }) {
  const host = p.id === hostId, me = p.id === meId, ready = isReady(p, hostId);
  const status = !p.connected ? { t: 'Away', c: colors.textMuted } : ready ? { t: host ? 'Host' : 'Ready', c: colors.gold } : { t: 'Not ready', c: colors.textMuted };
  return (
    <Appear dy={8} style={st.row}>
      <View style={{ opacity: p.connected ? 1 : 0.45 }}><PlayerAvatar name={p.name} size="md" online={p.connected} /></View>
      <View style={{ flex: 1 }}>
        <AppText variant="title" numberOfLines={1}>{p.name}{me ? '  (you)' : ''}</AppText>
        <AppText variant="bodySm" style={{ color: status.c }}>
          {host ? (p.connected ? 'Host · ready' : 'Host · away') : status.t}
        </AppText>
      </View>
      {!host && p.connected && <View style={[st.dot, { backgroundColor: ready ? colors.gold : 'transparent', borderColor: ready ? colors.gold : colors.line }]} />}
      {canKick && !me && <AppText variant="bodySm" onPress={onKick} style={{ color: '#E2B1B6', paddingLeft: spacing.md, paddingVertical: spacing.md }} accessibilityRole="button" accessibilityLabel={`Remove ${p.name}`}>Remove</AppText>}
    </Appear>
  );
}

const st = StyleSheet.create({
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
  plate: { width: 66, height: 88, borderRadius: radii.md, backgroundColor: colors.card.face, borderWidth: borders.hair, borderColor: colors.card.edge, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  letter: { fontFamily: fontFamily.card, fontSize: 44, lineHeight: 52, color: colors.card.ink },
  btns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  felt: { position: 'absolute', backgroundColor: colors.bgAlt, borderWidth: 3, borderColor: '#3A2E22', padding: 6 },
  feltIn: { flex: 1, borderWidth: borders.hair, borderColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  seat: { position: 'absolute', width: 72, alignItems: 'center' },
  seatName: { marginTop: 3, maxWidth: 72, textAlign: 'center' },
  empty: { width: sizes.avatar.md, height: sizes.avatar.md, borderRadius: sizes.avatar.md / 2, borderWidth: borders.hair, borderColor: colors.goldDim, borderStyle: 'dashed' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: borders.hair, borderColor: colors.line },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: borders.strong },
});
