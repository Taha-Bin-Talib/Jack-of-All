import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '../tokens';
import { fontFamily } from '../typography';
import { PlayingCard } from './PlayingCard';
import { Suit } from '../../ui';

/* Original artwork for each game, composed from playing cards + a little vector drawing.
   Every piece takes {w,h} so it can be used as a tile thumbnail or a full hero image. */
type A = { w: number; h: number };

const FIELD = { thulla: '#1B3A30', bluff: '#4A1F25', jack: '#0F251E' };

/* ── Bhabhi Thulla: a traditional fan of spades inside a gold double frame ── */
function ThullaArt({ w, h }: A) {
  const cw = Math.min(w * 0.27, h * 0.5), ids = ['10S', '11S', '12S', '13S', '14S'];
  const m = Math.max(6, w * 0.035);
  return (
    <View style={[st.box, { width: w, height: h, backgroundColor: FIELD.thulla }]}>
      <View style={{ position: 'absolute', left: m, top: m, right: m, bottom: m, borderWidth: 1, borderColor: colors.gold, opacity: 0.8 }} />
      <View style={{ position: 'absolute', left: m + 4, top: m + 4, right: m + 4, bottom: m + 4, borderWidth: 1, borderColor: colors.goldDim }} />
      {ids.map((id, i) => {
        const a = (i - 2) * 15;
        return (
          <View key={id} style={{ position: 'absolute', left: w / 2 - cw / 2, top: h * 0.2, transform: [{ rotate: `${a}deg` }], transformOrigin: '50% 135%' as any }}>
            <PlayingCard id={id} width={cw} />
          </View>
        );
      })}
      <View style={{ position: 'absolute', left: m + 10, top: m + 8 }}><Suit s="S" size={12} color={colors.gold} /></View>
      <View style={{ position: 'absolute', right: m + 10, bottom: m + 8, transform: [{ rotate: '180deg' }] }}><Suit s="S" size={12} color={colors.gold} /></View>
    </View>
  );
}

/* ── Bluff: backs shuffled over a hidden face, a gold question mark ── */
function BluffArt({ w, h }: A) {
  const cw = Math.min(w * 0.3, h * 0.52);
  return (
    <View style={[st.box, { width: w, height: h, backgroundColor: FIELD.bluff }]}>
      <Text allowFontScaling={false} style={{ position: 'absolute', right: w * 0.09, top: h * 0.02, fontFamily: fontFamily.display, fontSize: h * 0.62, lineHeight: h * 0.7, color: colors.gold, opacity: 0.22 }}>?</Text>
      <View style={{ position: 'absolute', left: w * 0.16, top: h * 0.2, transform: [{ rotate: '-12deg' }] }}><PlayingCard id="12H" width={cw} /></View>
      <View style={{ position: 'absolute', left: w * 0.34, top: h * 0.16, transform: [{ rotate: '4deg' }] }}><PlayingCard faceDown width={cw} /></View>
      <View style={{ position: 'absolute', left: w * 0.5, top: h * 0.26, transform: [{ rotate: '16deg' }] }}><PlayingCard faceDown width={cw} /></View>
    </View>
  );
}

/* ── Jack Thief: a court-style Jack, beside a card turned face down ── */
export function JackCardFace({ width }: { width: number }) {
  const h = width * 1.4, ink = colors.card.ink, red = colors.oxblood, green = colors.bg, ivory = colors.card.face;
  const fig = (
    <>
      <Path d="M36 42 L50 22 L64 42 Z" fill={green} />
      <Path d="M36 42 L64 42 L63 37.5 L37 37.5 Z" fill={red} />
      <Path d="M50 22 C60 17 68 25 64 34 C60 28 55 27 50 29 Z" fill={red} />
      <Ellipse cx="50" cy="50" rx="8" ry="9" fill={ivory} stroke={ink} strokeWidth={1.1} />
      <Circle cx="46.6" cy="49.4" r="1" fill={ink} /><Circle cx="53.4" cy="49.4" r="1" fill={ink} />
      <Path d="M30 68 C31 58 40 59 50 59 C60 59 69 58 70 68 Z" fill={green} />
      <Path d="M45 59 L50 66 L55 59 Z" fill={ivory} />
    </>
  );
  return (
    <View style={{ width, height: h }}>
      <Svg width={width} height={h} viewBox="0 0 100 140">
        <Rect x="0.5" y="0.5" width="99" height="139" rx="9" fill={ivory} stroke={colors.card.edge} />
        <Rect x="17" y="12" width="66" height="116" fill="none" stroke={green} strokeWidth={1} />
        <Path d="M17 70 L83 70" stroke={green} strokeWidth={0.8} />
        {fig}
        <G rotation={180} origin="50, 70">{fig}</G>
      </Svg>
      <View style={{ position: 'absolute', left: width * 0.05, top: width * 0.03, alignItems: 'center' }}>
        <Text allowFontScaling={false} style={{ fontFamily: fontFamily.display, color: ink, fontSize: width * 0.15, lineHeight: width * 0.17 }}>J</Text>
        <Suit s="S" size={width * 0.1} color={ink} />
      </View>
      <View style={{ position: 'absolute', right: width * 0.05, bottom: width * 0.03, alignItems: 'center', transform: [{ rotate: '180deg' }] }}>
        <Text allowFontScaling={false} style={{ fontFamily: fontFamily.display, color: ink, fontSize: width * 0.15, lineHeight: width * 0.17 }}>J</Text>
        <Suit s="S" size={width * 0.1} color={ink} />
      </View>
    </View>
  );
}
function JackArt({ w, h }: A) {
  const jw = Math.min(w * 0.36, h * 0.66), bw = jw * 0.82;
  return (
    <View style={[st.box, { width: w, height: h, backgroundColor: FIELD.jack }]}>
      <View style={{ position: 'absolute', left: w * 0.5 - jw * 1.12, top: h * 0.2, transform: [{ rotate: '-9deg' }] }}><PlayingCard faceDown width={bw} /></View>
      <View style={[{ position: 'absolute', left: w * 0.5 - jw * 0.28, top: h * 0.1, transform: [{ rotate: '5deg' }] }, st.lift]}><JackCardFace width={jw} /></View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: h * 0.06, height: 1, backgroundColor: colors.line }} />
    </View>
  );
}

export function GameArt({ gameId, width, height }: { gameId: string; width: number; height: number }) {
  if (gameId === 'bluff') return <BluffArt w={width} h={height} />;
  if (gameId === 'jackthief') return <JackArt w={width} h={height} />;
  return <ThullaArt w={width} h={height} />;
}
const st = StyleSheet.create({
  box: { overflow: 'hidden' },
  lift: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
});
