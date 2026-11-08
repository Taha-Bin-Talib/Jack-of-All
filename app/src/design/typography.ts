/* Typography: matches the website — the system sans (Roboto on Android) for everything, Georgia-style serif (Gelasio) for card faces.
   Custom fonts come in one family name per weight, so never combine them with `fontWeight`. */
import { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Roboto_700Bold',      // app name, game titles, hero + section headings
  displaySemi: 'Roboto_500Medium',
  card: 'Gelasio_700Bold',        // playing-card faces — Georgia-style serif, like the website
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  semibold: 'Roboto_700Bold',
  bold: 'Roboto_700Bold',
} as const;

export const fontSizes = { xs: 13, sm: 14, md: 16, lg: 18, xl: 22, xxl: 30, display: 40 } as const;
export const lineHeights = { xs: 18, sm: 21, md: 26, lg: 26, xl: 28, xxl: 33, display: 43 } as const;

export type Variant = 'display' | 'h1' | 'h2' | 'title' | 'body' | 'bodySm' | 'label' | 'caption' | 'button' | 'cardRank';

export const type: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamily.display, fontSize: fontSizes.display, lineHeight: lineHeights.display, letterSpacing: -0.3 },
  h1: { fontFamily: fontFamily.display, fontSize: fontSizes.xxl, lineHeight: lineHeights.xxl, letterSpacing: 0 },
  h2: { fontFamily: fontFamily.displaySemi, fontSize: 26, lineHeight: 29, letterSpacing: 0 },
  title: { fontFamily: fontFamily.bold, fontSize: fontSizes.lg, lineHeight: lineHeights.lg },
  body: { fontFamily: fontFamily.regular, fontSize: fontSizes.md, lineHeight: lineHeights.md },
  bodySm: { fontFamily: fontFamily.regular, fontSize: fontSizes.sm, lineHeight: lineHeights.sm },
  label: { fontFamily: fontFamily.medium, fontSize: fontSizes.sm, lineHeight: lineHeights.sm, letterSpacing: 0.2 },
  caption: { fontFamily: fontFamily.regular, fontSize: fontSizes.sm, lineHeight: lineHeights.sm },
  button: { fontFamily: fontFamily.bold, fontSize: fontSizes.md, lineHeight: lineHeights.sm, letterSpacing: 0.2 },
  cardRank: { fontFamily: fontFamily.card, fontSize: fontSizes.md, lineHeight: lineHeights.sm },
};
