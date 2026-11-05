import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '../tokens';
import { fontFamily } from '../typography';
import { Suit } from '../../ui';

/* Court-style Jack: mirrored figure, plumed cap. Used as artwork and as the face of every Jack in Jack Thief. */
export function JackCardFace({ width, suit = 'S' }: { width: number; suit?: string }) {
  const h = width * 1.4, ink = suit === 'H' || suit === 'D' ? colors.card.red : colors.card.ink, red = colors.oxblood, green = colors.bg, ivory = colors.card.face;
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
        <Text allowFontScaling={false} style={{ fontFamily: fontFamily.card, color: ink, fontSize: width * 0.15, lineHeight: width * 0.17 }}>J</Text>
        <Suit s={suit} size={width * 0.1} color={ink} />
      </View>
      <View style={{ position: 'absolute', right: width * 0.05, bottom: width * 0.03, alignItems: 'center', transform: [{ rotate: '180deg' }] }}>
        <Text allowFontScaling={false} style={{ fontFamily: fontFamily.card, color: ink, fontSize: width * 0.15, lineHeight: width * 0.17 }}>J</Text>
        <Suit s={suit} size={width * 0.1} color={ink} />
      </View>
    </View>
  );
}
