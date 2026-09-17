import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { color, spacing, radius, fontSize, font } from '@/theme/tokens';

// Handoff: inputs 52px height, radius 14, border #E6E9E4, white bg.
export function TextField({ style, ...rest }: TextInputProps) {
  return <TextInput style={[styles.input, style]} placeholderTextColor={color.textSubtle} {...rest} />;
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    fontFamily: font.regular,
    color: color.text,
    backgroundColor: color.surface,
  },
});
