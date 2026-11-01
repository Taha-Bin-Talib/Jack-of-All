import React from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { borders, colors, radii, sizes, spacing } from '../tokens';
import { fontFamily } from '../typography';
import { AppText } from '../components/AppText';
import { IconButton, Raised, TONES } from '../components/Buttons';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { PlayingCard } from '../components/PlayingCard';
import { Sliders } from '../components/icons';
import { useNet } from '../../net';

/* ── GameActionButton: the in-game button. One accent per game state; 44dp+ tall. ── */
export function GameActionButton({ title, onPress, kind = 'primary', disabled, style, flex }: { title: string; onPress: () => void; kind?: 'primary' | 'danger' | 'quiet'; disabled?: boolean; style?: any; flex?: boolean }) {
  const tone = disabled ? TONES.off : kind === 'primary' ? TONES.gold : kind === 'danger' ? TONES.red : TONES.green;
  return (
    <Raised tone={tone} height={46} edge={4} onPress={onPress} disabled={disabled} accessibilityLabel={title} style={[flex && { flex: 1 }, style]}>
      <AppText variant="button" numberOfLines={1} style={{ color: tone.fg }}>{title}</AppText>
    </Raised>
  );
}

/* ── GameHeader: game title + a live sub-line; the menu button opens GameSettingsMenu ── */
export function GameHeader({ title, subtitle, accent = colors.gold, onMenu }: { title: string; subtitle?: string; accent?: string; onMenu: () => void }) {
  return (
    <View style={st.head}>
      <View style={{ flex: 1 }}>
        <AppText variant="h2" numberOfLines={1} style={{ lineHeight: 26 }}>{title}</AppText>
        {subtitle ? <AppText variant="label" numberOfLines={1} style={{ color: accent, marginTop: 1 }}>{subtitle}</AppText> : null}
      </View>
      <IconButton label="Game menu" onPress={onMenu} filled><Sliders /></IconButton>
    </View>
  );
}

/* ── ScoreBoard: public standings — who still holds cards, who is safe. Only public information. ── */
export type ScoreRow = { id: string; name: string; count?: number; out?: boolean; active?: boolean; me?: boolean; tag?: string; away?: boolean };
export function ScoreBoard({ rows, label = 'Cards left' }: { rows: ScoreRow[]; label?: string }) {
  const { height } = useWindowDimensions();
  if (height < 700) return null;                 // short phones: seats already show every count
  const fit = rows.length <= 4;                  // few players: an even row that always fits, names unshortened
  const chips = rows.map(r => (
    <View key={r.id} style={[st.score, fit && { flex: 1, minWidth: 0, justifyContent: 'center' }, r.active && { borderColor: colors.gold }, (r.out || r.away) && { opacity: 0.55 }]}>
      {!fit && <PlayerAvatar name={r.name} diameter={22} active={r.active} />}
      <View style={{ flexShrink: 1, alignItems: fit ? 'center' : 'flex-start' }}>
        <AppText variant="caption" numberOfLines={1} style={{ maxWidth: fit ? undefined : 70, fontFamily: fontFamily.semibold }}>{r.me ? 'You' : r.name}</AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: r.out ? colors.table.good : colors.textMuted }}>{r.out ? 'safe' : r.tag ?? (r.count !== undefined ? `${r.count}` : '')}</AppText>
      </View>
    </View>
  ));
  return (
    <View style={{ marginBottom: spacing.xs }} accessibilityLabel={label}>
      {fit
        ? <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm }}>{chips}</View>
        : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>{chips}</ScrollView>}
    </View>
  );
}

/* ── GamePanel: the action tray under the table (your options for this moment) ── */
export function GamePanel({ title, children, accent = colors.gold }: { title?: string; children: React.ReactNode; accent?: string }) {
  return (
    <View style={[st.panel, { borderColor: accent }]}>
      {title ? <AppText variant="title" style={{ color: accent, textAlign: 'center', marginBottom: spacing.xs }}>{title}</AppText> : null}
      {children}
    </View>
  );
}

/* ── TurnTimer: thin bar for the 1-minute move clock ── */
export function TurnTimer({ ms, total = 60000 }: { ms: number; total?: number }) {
  const [left, setLeft] = React.useState(ms);
  React.useEffect(() => { setLeft(ms); const t0 = Date.now(); const i = setInterval(() => setLeft(Math.max(0, ms - (Date.now() - t0))), 250); return () => clearInterval(i); }, [ms]);
  const pct = Math.max(0, Math.min(1, left / total));
  return <View style={st.tb}><View style={{ height: 4, width: `${pct * 100}%`, backgroundColor: pct < 0.25 ? colors.table.bad : colors.gold }} /></View>;
}

/* ── EventToast: the game's own announcements (thulla! bluff called! duel …) ── */
export function EventToast({ ev }: { ev?: { seq: number; type?: string; text: string } | null }) {
  const [shown, setShown] = React.useState<{ text: string; type?: string } | null>(null);
  React.useEffect(() => { if (!ev) return; setShown({ text: ev.text, type: ev.type }); const t = setTimeout(() => setShown(null), 3200); return () => clearTimeout(t); }, [ev?.seq]);
  if (!shown) return null;
  const hot = shown.type === 'thulla' || shown.type === 'call', duel = shown.type === 'duel';
  return (
    <View pointerEvents="none" style={st.toastWrap}><View style={[st.toast, hot && { backgroundColor: colors.oxblood, borderColor: '#9B5A62' }, duel && { borderColor: colors.gold }]} accessibilityLiveRegion="polite">
      <AppText variant="bodySm" numberOfLines={2} style={{ textAlign: 'center', fontFamily: fontFamily.semibold }}>{shown.text}</AppText>
    </View></View>
  );
}

/* ── notices: "not your turn", "follow ♠", and server rejections, shown in the same quiet place ── */
export function useGameNotice() {
  const net = useNet();
  const [n, setN] = React.useState<{ text: string; seq: number } | null>(null);
  const seq = React.useRef(0);
  const show = React.useCallback((text: string) => { setN({ text, seq: ++seq.current }); }, []);
  React.useEffect(() => { if (net.error && net.room?.phase === 'playing') show(net.error); }, [net.errSeq]);
  React.useEffect(() => { if (!n) return; const t = setTimeout(() => setN(null), 2600); return () => clearTimeout(t); }, [n?.seq]);
  return { notice: n, show };
}
export function NoticeBar({ notice }: { notice: { text: string } | null }) {
  if (!notice) return null;
  return <View style={st.notice} accessibilityLiveRegion="assertive"><AppText variant="bodySm" style={{ textAlign: 'center' }}>{notice.text}</AppText></View>;
}

/* ── VisibilityTag: makes public vs private information obvious ── */
export function VisibilityTag({ kind, text }: { kind: 'public' | 'private'; text?: string }) {
  const priv = kind === 'private';
  return (
    <View style={[st.vis, { borderColor: priv ? colors.gold : colors.line }]}>
      <View style={[st.visDot, { backgroundColor: priv ? colors.gold : colors.textMuted }]} />
      <AppText variant="label" style={{ color: priv ? colors.gold : colors.textMuted, fontSize: 11, lineHeight: 13 }}>{text ?? (priv ? 'Private · only you' : 'Public · everyone')}</AppText>
    </View>
  );
}

/* ── FlipCard: a card that turns face-up (reveals) ── */
export function FlipCard({ id, width, delay = 0, court }: { id: string; width: number; delay?: number; court?: boolean }) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { Animated.timing(t, { toValue: 1, duration: 480, delay, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(); }, []);
  const h = width * 1.4;
  return (
    <View style={{ width, height: h }}>
      <Animated.View style={{ position: 'absolute', transform: [{ scaleX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] }) }] }}><PlayingCard faceDown width={width} /></Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ scaleX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }) }] }}><PlayingCard id={id} width={width} court={court} /></Animated.View>
    </View>
  );
}

/* ── GameResultModal: the end of a game — result, standings and next steps ── */
export function GameResultModal({ visible, title, lines, rows, accent = colors.gold, actions, extra }: { visible: boolean; title: string; lines?: string[]; rows?: ScoreRow[]; accent?: string; actions: React.ReactNode; extra?: React.ReactNode }) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { if (visible) { t.setValue(0); Animated.timing(t, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); } }, [visible]);
  if (!visible) return null;
  return (
    <View style={st.scrim}>
      <Animated.View style={[st.result, { borderColor: accent, opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
        <AppText variant="label" style={{ color: accent, textAlign: 'center' }}>Game over</AppText>
        <AppText variant="h1" style={{ textAlign: 'center', marginTop: spacing.sm }}>{title}</AppText>
        {lines?.map((l, i) => <AppText key={i} variant="body" tone="muted" style={{ textAlign: 'center', marginTop: spacing.sm }}>{l}</AppText>)}
        {extra ? <View style={{ alignItems: 'center', marginTop: spacing.lg }}>{extra}</View> : null}
        {rows && rows.length > 0 && (
          <View style={{ marginTop: spacing.lg, borderTopWidth: borders.hair, borderColor: colors.line }}>
            {rows.map(r => (
              <View key={r.id} style={st.resRow}>
                <PlayerAvatar name={r.name} diameter={28} />
                <AppText variant="bodySm" style={{ flex: 1 }} numberOfLines={1}>{r.me ? `${r.name} (you)` : r.name}</AppText>
                <AppText variant="bodySm" style={{ color: r.tag && /thief|bhabhi|holding|loses/i.test(r.tag) ? colors.table.bad : colors.table.good }}>{r.tag}</AppText>
              </View>
            ))}
          </View>
        )}
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>{actions}</View>
      </Animated.View>
    </View>
  );
}

/* ── GameSettingsMenu: in-game sheet — rules for this game, the room code, leave ── */
export function GameSettingsMenu({ visible, onClose, gameName, rules, code, local, onLeave }: { visible: boolean; onClose: () => void; gameName: string; rules: string[]; code?: string; local?: boolean; onLeave: () => void }) {
  const [showRules, setShowRules] = React.useState(false), [copied, setCopied] = React.useState(false);
  React.useEffect(() => { if (!visible) { setShowRules(false); setCopied(false); } }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.sheetScrim} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={st.sheet}>
        <View style={st.grab} />
        <AppText variant="h2">{gameName}</AppText>
        {!local && code ? (
          <Pressable style={st.menuRow} onPress={async () => { try { await Clipboard.setStringAsync(code); setCopied(true); } catch {} }}>
            <AppText variant="body" style={{ flex: 1 }}>Room code</AppText>
            <AppText variant="title" tone="gold" style={{ letterSpacing: 4 }}>{code}</AppText>
            <AppText variant="caption" tone="muted" style={{ marginLeft: spacing.sm }}>{copied ? 'Copied ✓' : 'Copy'}</AppText>
          </Pressable>
        ) : null}
        <Pressable style={st.menuRow} onPress={() => setShowRules(!showRules)}>
          <AppText variant="body" style={{ flex: 1 }}>How this game works</AppText>
          <AppText variant="title" tone="gold">{showRules ? '–' : '+'}</AppText>
        </Pressable>
        {showRules && <ScrollView style={{ maxHeight: 260 }}>{rules.map((r, i) => <AppText key={i} variant="bodySm" tone="muted" style={{ marginBottom: spacing.sm }}>{`${i + 1}.  ${r}`}</AppText>)}</ScrollView>}
        <GameActionButton title={local ? 'Leave practice game' : 'Leave game'} kind="danger" onPress={() => { onClose(); onLeave(); }} style={{ marginTop: spacing.lg }} />
        <GameActionButton title="Back to the table" kind="quiet" onPress={onClose} style={{ marginTop: spacing.sm }} />
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  btn: { minHeight: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: sizes.header - 4 },
  score: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 5, paddingHorizontal: spacing.sm, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.line, backgroundColor: 'rgba(14,30,25,.5)' },
  tb: { height: 4, borderRadius: 2, backgroundColor: 'rgba(241,232,213,.15)', overflow: 'hidden' },
  toastWrap: { position: 'absolute', left: 0, right: 0, top: -52, alignItems: 'center', zIndex: 50 },
  toast: { minHeight: 32, maxWidth: '94%', alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radii.md, borderWidth: borders.hair, borderColor: colors.lineStrong, backgroundColor: colors.surface, justifyContent: 'center' },
  notice: { alignSelf: 'center', marginVertical: 4, paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radii.md, backgroundColor: 'rgba(118,47,54,.55)', borderWidth: borders.hair, borderColor: colors.oxblood },
  vis: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill, borderWidth: borders.hair },
  visDot: { width: 5, height: 5, borderRadius: 3 },
  panel: { marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: radii.md, backgroundColor: 'rgba(14,30,25,.72)', borderWidth: borders.hair },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  result: { alignSelf: 'stretch', maxWidth: 440, backgroundColor: colors.bg, borderRadius: radii.lg, borderWidth: borders.strong, padding: spacing.xl },
  resRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: borders.hair, borderColor: colors.line },
  sheetScrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.bgAlt, padding: spacing.xl, paddingBottom: spacing.xxl, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, borderTopWidth: borders.hair, borderColor: colors.lineStrong },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: spacing.lg },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, borderBottomWidth: borders.hair, borderColor: colors.line },
});
