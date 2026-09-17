import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { WidgetState } from '@/features/widget/widgetState';
import { getBlocks, type Block } from '@/features/lockscreen/blockStrip';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

function accessibleLabelFor(block: Block): string {
  if (block.kind === 'current') return `Now: ${block.label}`;
  if (block.kind === 'next') return `Next: ${block.label}`;
  return block.label;
}

// FR-003b/FR-014: the full-size block/level presentation — same data and
// ordering as the lock-screen notification's compact text (blockStrip.ts),
// rendered as real styled blocks since there's no notification-styling
// constraint here (research.md §2).
export function LockscreenTimelineView({ state }: { state: WidgetState }) {
  const blocks = getBlocks(state);

  return (
    <ScrollView horizontal contentContainerStyle={styles.strip} showsHorizontalScrollIndicator={false}>
      {blocks.map((block, index) => (
        <View
          key={index}
          style={[styles.block, block.kind === 'current' && styles.currentBlock]}
          accessible
          accessibilityLabel={accessibleLabelFor(block)}
        >
          <Text style={[styles.label, block.kind === 'current' && styles.currentLabel]} numberOfLines={2}>
            {block.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  block: {
    minWidth: 96,
    minHeight: 96,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  currentBlock: {
    backgroundColor: color.primary,
    borderColor: color.primaryDark,
    transform: [{ scale: 1.15 }],
  },
  label: { fontSize: fontSize.base, color: color.text, textAlign: 'center', fontFamily: font.semibold },
  currentLabel: { color: color.onPrimary },
});
