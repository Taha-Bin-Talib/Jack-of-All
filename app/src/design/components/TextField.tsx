import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { borders, colors, radii, sizes, spacing } from '../tokens';
import { fontFamily } from '../typography';

/* Text input with a visible focus state (gold edge) and a quiet error state. */
export const TextField = React.forwardRef<React.ComponentRef<typeof TextInput>, TextInputProps & { invalid?: boolean }>(function TextField({ style, invalid, onFocus, onBlur, ...rest }, ref) {
  const [focus, setFocus] = React.useState(false);
  return (
    <TextInput ref={ref} placeholderTextColor={colors.textMuted} selectionColor={colors.gold} {...rest}
      onFocus={e => { setFocus(true); onFocus?.(e); }} onBlur={e => { setFocus(false); onBlur?.(e); }}
      style={[st.input, focus && st.focus, invalid && st.invalid, style]} />
  );
});
const st = StyleSheet.create({
  input: { minHeight: sizes.button.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: borders.hair, borderColor: colors.line, color: colors.text, paddingHorizontal: spacing.lg, fontFamily: fontFamily.medium, fontSize: 17 },
  focus: { borderColor: colors.gold, borderWidth: borders.strong },
  invalid: { borderColor: colors.oxblood },
});
