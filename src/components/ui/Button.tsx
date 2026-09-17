import { Pressable, Text, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { color, spacing, radius, fontSize, font } from '@/theme/tokens';

type Variant = 'primary' | 'destructive' | 'secondary' | 'text';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

// Handoff: primary button 52px height, radius 14, 16/700 text.
export function Button({
  title,
  variant = 'primary',
  style,
  disabled,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      style={[styles.base, variantStyles[variant].container, disabled && styles.disabled, style]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      {...rest}
    >
      <Text style={[styles.text, variantStyles[variant].text]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: fontSize.md, fontFamily: font.bold },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: color.primary },
    text: { color: color.onPrimary },
  }),
  secondary: StyleSheet.create({
    container: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
    text: { color: color.text },
  }),
  destructive: StyleSheet.create({
    container: { backgroundColor: color.destructiveStrong },
    text: { color: color.onPrimary },
  }),
  text: StyleSheet.create({
    container: { backgroundColor: 'transparent', paddingHorizontal: 0, minHeight: 44 },
    text: { color: color.textSecondary, textDecorationLine: 'underline' },
  }),
} as const;
