import { borders, cardSizes, colors, durations, elevation, radii, shadows, sizes, spacing } from './tokens';
import { fontFamily, fontSizes, lineHeights, type } from './typography';

export const theme = { colors, spacing, radii, borders, shadows, elevation, sizes, cardSizes, durations, fontFamily, fontSizes, lineHeights, type } as const;
export type Theme = typeof theme;
