/* Typography: Playfair Display for display + branding, DM Sans for the interface.
   Custom fonts come in one family name per weight, so never combine them with `fontWeight`. */
import { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'PlayfairDisplay_700Bold',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const fontSizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, display: 36 } as const;
export const lineHeights = { xs: 16, sm: 20, md: 24, lg: 26, xl: 28, xxl: 34, display: 42 } as const;

export type Variant = 'display' | 'h1' | 'h2' | 'title' | 'body' | 'bodySm' | 'label' | 'caption' | 'button' | 'cardRank';

export const type: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamily.display, fontSize: fontSizes.display, lineHeight: lineHeights.display, letterSpacing: 0.2 },
  h1: { fontFamily: fontFamily.display, fontSize: fontSizes.xxl, lineHeight: lineHeights.xxl },
  h2: { fontFamily: fontFamily.displaySemi, fontSize: fontSizes.xl, lineHeight: lineHeights.xl },
  title: { fontFamily: fontFamily.semibold, fontSize: fontSizes.lg, lineHeight: lineHeights.lg },
  body: { fontFamily: fontFamily.regular, fontSize: fontSizes.md, lineHeight: lineHeights.md },
  bodySm: { fontFamily: fontFamily.regular, fontSize: fontSizes.sm, lineHeight: lineHeights.sm },
  label: { fontFamily: fontFamily.medium, fontSize: fontSizes.xs, lineHeight: lineHeights.xs, letterSpacing: 1.4, textTransform: 'uppercase' },
  caption: { fontFamily: fontFamily.regular, fontSize: fontSizes.xs, lineHeight: lineHeights.xs },
  button: { fontFamily: fontFamily.semibold, fontSize: fontSizes.md, lineHeight: lineHeights.sm, letterSpacing: 0.3 },
  cardRank: { fontFamily: fontFamily.display, fontSize: fontSizes.md, lineHeight: lineHeights.sm },
};
