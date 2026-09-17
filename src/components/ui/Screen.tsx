import { View, StyleSheet, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, spacing } from '@/theme/tokens';

type ScreenProps = ViewProps & { centered?: boolean };

// Handoff: "use react-native-safe-area-context for top status-bar clearance
// and bottom home-indicator padding instead of the fixed 64-70px/26px
// paddings in the HTML."
export function Screen({ style, centered, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
        centered && styles.centered,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background, paddingHorizontal: spacing.xl, gap: spacing.md },
  centered: { justifyContent: 'center' },
});
