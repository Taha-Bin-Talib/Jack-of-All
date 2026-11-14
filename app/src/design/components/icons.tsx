import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../tokens';

/* Only the icons the product needs. Stroke icons, 24px grid, drawn in the current tone. */
type P = { size?: number; color?: string };
export const ChevronLeft = ({ size = 22, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M15 5l-7 7 7 7" /></Svg>
);
export const Close = ({ size = 22, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const Chat = ({ size = 22, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 5h16v11H9l-5 4V5z" /></Svg>
);
export const Eye = ({ size = 22, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z" /><Circle cx={12} cy={12} r={3} /></Svg>
);
export const Sliders = ({ size = 22, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><Path d="M15 5v4M9 15v4" /></Svg>
);
