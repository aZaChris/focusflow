import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, fontSize, radius, spacing } from '@/theme/tokens';

// Handoff (Reflect screen): "segmented control (pill tabs, bg #EEF1EC,
// active tab white bg, radius 10)".
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: color.borderLight, borderRadius: radius.md, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: spacing.sm, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: color.surface },
  label: { fontSize: fontSize.base, fontFamily: font.semibold, color: color.textSecondary },
  labelActive: { color: color.text },
});
