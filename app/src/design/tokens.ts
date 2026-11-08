/* JACK OF ALL — design tokens ("modern vintage card club").
   Single source of truth: components import from here, never hard-code colours, sizes or timings. */
import { Platform, ViewStyle } from 'react-native';

export const colors = {
  // surfaces — green dominates
  bg: '#0A5237',           // primary background
  bgAlt: '#06402A',        // secondary background (raised panels, tiles)
  surface: '#052D1E',      // dark surface (inputs, sheets, modals)
  // text
  text: '#FFFFFF',         // primary text (parchment)
  textMuted: 'rgba(255,255,255,0.76)',    // secondary text
  // accents — gold is a restrained accent, oxblood is for emphasis / danger
  gold: '#F5C542',
  oxblood: '#C94141',
  // derived (do not add new hues; derive from the above)
  goldDim: 'rgba(245,197,66,0.45)',
  line: 'rgba(255,255,255,0.16)',        // hairline borders on green
  lineStrong: 'rgba(245,197,66,0.6)',   // gold hairline
  scrim: 'rgba(0,0,0,0.65)',
  onGold: '#222222',                      // text on gold fills
  onOxblood: '#FFFFFF',
  // card table
  table: { felt: '#14875A', feltDeep: '#0B5A3B', wood: '#5B3A1E', woodLine: '#7A5230', oxbloodRim: '#5B3A1E', ivoryRim: '#5B3A1E', good: '#8FD6A8', bad: '#FF9A9A' },
  // playing cards
  card: { face: '#FFFFFF', ink: '#101418', red: '#D32F2F', edge: '#E3E3E3', back: '#A8394A', backLine: '#FFFFFF' },
} as const;

/* 4-pt spacing scale */
export const spacing = { none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48, giant: 64 } as const;

/* restrained rounding: crisp corners, a little softness */
export const radii = { none: 0, xs: 2, sm: 4, md: 8, lg: 12, pill: 999 } as const;

export const borders = { hair: 1, strong: 1.5 } as const;

/* subtle shadows (iOS shadow* + Android elevation together) */
const mk = (o: number, r: number, y: number, e: number): ViewStyle => ({
  shadowColor: '#000', shadowOpacity: o, shadowRadius: r, shadowOffset: { width: 0, height: y }, elevation: Platform.OS === 'android' ? e : 0,
});
export const shadows = { none: mk(0, 0, 0, 0), sm: mk(0.18, 2, 1, 2), md: mk(0.24, 6, 3, 4), lg: mk(0.32, 14, 8, 8) } as const;
export const elevation = { base: 0, raised: 1, overlay: 10, modal: 20, toast: 30 } as const;   // z-index layers

export const sizes = {
  button: { sm: 40, md: 52, lg: 60 },     // heights (md meets the 48dp touch target)
  iconButton: { sm: 36, md: 44, lg: 52 },
  avatar: { sm: 32, md: 44, lg: 64 },
  header: 56,
  gutter: 20,                              // screen side padding
  maxContent: 560,                         // content column on tablets
} as const;

/* card geometry: width drives everything, height = width * ratio */
export const cardSizes = {
  ratio: 1.4,
  xs: 28, sm: 44, md: 64, lg: 88,          // widths
  radius: (w: number) => Math.max(4, Math.round(w * 0.1)),
} as const;

export const durations = { instant: 80, fast: 140, base: 240, slow: 420, deal: 600, toast: 3200 } as const;
