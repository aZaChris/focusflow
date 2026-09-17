import { StyleSheet, View } from 'react-native';
import { color, radius } from '@/theme/tokens';

// Handoff: "progress bar (6px height, track #EEF1EC, fill #2F6B4F)".
export function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: radius.pill, backgroundColor: color.borderLight, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: color.primary },
});
