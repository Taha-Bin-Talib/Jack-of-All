/* JACK OF ALL — design tokens ("modern vintage card club").
   Single source of truth: components import from here, never hard-code colours, sizes or timings. */
import { Platform, ViewStyle } from 'react-native';

export const colors = {
  // surfaces — green dominates
  bg: '#142D26',           // primary background
  bgAlt: '#203D32',        // secondary background (raised panels, tiles)
  surface: '#252825',      // dark surface (inputs, sheets, modals)
  // text
  text: '#F1E8D5',         // primary text (parchment)
  textMuted: '#C9BFA9',    // secondary text
  // accents — gold is a restrained accent, oxblood is for emphasis / danger
  gold: '#BD9857',
  oxblood: '#762F36',
  // derived (do not add new hues; derive from the above)
  goldDim: 'rgba(189,152,87,0.45)',
  line: 'rgba(241,232,213,0.14)',        // hairline borders on green
  lineStrong: 'rgba(189,152,87,0.55)',   // gold hairline
  scrim: 'rgba(10,20,17,0.72)',
  onGold: '#142D26',                      // text on gold fills
  onOxblood: '#F1E8D5',
  // card table
  table: { felt: '#1F4D3B', feltDeep: '#17402F', wood: '#3A2E22', woodLine: '#6B5A3F', oxbloodRim: '#5C2229', ivoryRim: '#B9AE92', good: '#8FB58A', bad: '#D9A3A8' },
  // playing cards
  card: { face: '#F6EFDD', ink: '#1F2220', red: '#762F36', edge: '#CFC4A8', back: '#762F36', backLine: '#BD9857' },
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
