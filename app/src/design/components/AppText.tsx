import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors } from '../tokens';
import { type, Variant } from '../typography';

type Tone = 'primary' | 'muted' | 'gold' | 'oxblood' | 'onGold';
const TONES: Record<Tone, string> = { primary: colors.text, muted: colors.textMuted, gold: colors.gold, oxblood: colors.oxblood, onGold: colors.onGold };

/* The one Text component: pick a typographic variant + a colour tone. Font scaling is capped so layouts hold. */
export function AppText({ variant = 'body', tone = 'primary', style, ...rest }: TextProps & { variant?: Variant; tone?: Tone }) {
  return <Text maxFontSizeMultiplier={1.25} {...rest} style={[type[variant], { color: TONES[tone] }, style]} />;
}
