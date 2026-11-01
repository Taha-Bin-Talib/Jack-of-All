import { colors } from './design/tokens';

/* Legacy colour map kept so older components (chat, lobby leftovers) share the new palette. New code should import from './design'. */
export const C = {
  bg: colors.bg, felt: colors.table.felt, feltDark: colors.table.feltDeep, rim: colors.table.wood, card: colors.card.face, back: colors.card.back, backLine: colors.card.backLine,
  red: colors.card.red, black: colors.card.ink, gold: colors.gold, text: colors.text, dim: colors.textMuted, panel: 'rgba(0,0,0,.28)', danger: colors.oxblood, ok: colors.table.good,
};
