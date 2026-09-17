import { View, StyleSheet, type ViewProps } from 'react-native';
import { color, spacing, radius } from '@/theme/tokens';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  // Handoff: white card, radius 16-20, border #E6E9E4, padding 18.
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.divider,
    backgroundColor: color.surface,
    padding: 18,
    gap: spacing.sm,
  },
});
