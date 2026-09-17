import { StyleSheet, Text, View } from 'react-native';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

type BadgeVariant = 'filled' | 'muted' | 'outline';

// Handoff: Pro/Free badge, "SAVE 40%" plan badge, streak label — a small
// pill of text, filled green when it means something achieved/active,
// muted grey otherwise.
export function Badge({ label, variant = 'muted' }: { label: string; variant?: BadgeVariant }) {
  return (
    <View style={[styles.base, containerByVariant[variant]]}>
      <Text style={[styles.text, textByVariant[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: fontSize.sm, fontFamily: font.bold },
  filledContainer: { backgroundColor: color.primary },
  filledText: { color: color.onPrimary },
  mutedContainer: { backgroundColor: color.borderLight },
  mutedText: { color: color.textMuted },
  outlineContainer: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.border },
  outlineText: { color: color.textSecondary },
});

const containerByVariant = {
  filled: styles.filledContainer,
  muted: styles.mutedContainer,
  outline: styles.outlineContainer,
};

const textByVariant = {
  filled: styles.filledText,
  muted: styles.mutedText,
  outline: styles.outlineText,
};
