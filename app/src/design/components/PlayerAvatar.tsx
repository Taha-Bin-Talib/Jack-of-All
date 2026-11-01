import React from 'react';
import { StyleSheet, View } from 'react-native';
import { borders, colors, sizes } from '../tokens';
import { AppText } from './AppText';

const FILLS = [colors.oxblood, colors.bgAlt, colors.surface, '#3B4A3F'];
const hash = (s: string) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const initials = (n: string) => { const w = n.trim().split(/\s+/); return ((w[0]?.[0] || '?') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); };

/* Round monogram avatar. `active` = it is their turn (gold ring); `online` shows a presence dot. */
export function PlayerAvatar({ name, size = 'md', active, online }: { name: string; size?: 'sm' | 'md' | 'lg'; active?: boolean; online?: boolean }) {
  const d = sizes.avatar[size];
  return (
    <View style={{ width: d, height: d }}>
      <View style={[st.disc, { width: d, height: d, borderRadius: d / 2, backgroundColor: FILLS[hash(name) % FILLS.length] }, active ? st.ring : st.edge]}>
        <AppText variant={size === 'lg' ? 'h2' : size === 'md' ? 'title' : 'bodySm'} style={{ fontFamily: 'PlayfairDisplay_600SemiBold' }}>{initials(name)}</AppText>
      </View>
      {online !== undefined && <View style={[st.dot, { backgroundColor: online ? '#7FA37A' : colors.textMuted, opacity: online ? 1 : 0.5 }]} />}
    </View>
  );
}
const st = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center' },
  edge: { borderWidth: borders.hair, borderColor: colors.line },
  ring: { borderWidth: borders.strong * 1.5, borderColor: colors.gold },
  dot: { position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: colors.bg },
});
