import { StyleSheet, Text, View } from 'react-native';
import { color, font, fontSize, radius } from '@/theme/tokens';

// Handoff: avatar initials badge — Today header (38x38, radius 12,
// bg #E7F0EA) and Settings profile row (52x52, radius 16).
export function AvatarInitials({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size >= 48 ? radius.lg : radius.md }]}>
      <Text style={[styles.text, { fontSize: size >= 48 ? fontSize.md : fontSize.base }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: color.primaryTint, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: font.bold, color: color.primary },
});
