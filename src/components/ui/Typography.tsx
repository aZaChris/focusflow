import { Text, StyleSheet, type TextProps } from 'react-native';
import { color, font, fontSize } from '@/theme/tokens';

// Handoff: app-name style heading (Login/Register/Subscription), 24/800.
export function Title(props: TextProps) {
  return <Text {...props} style={[styles.title, props.style]} />;
}

// Handoff: tab screen header (Today/Habits/Reflect/Settings), 22/800.
export function ScreenTitle(props: TextProps) {
  return <Text {...props} style={[styles.screenTitle, props.style]} />;
}

export function SectionTitle(props: TextProps) {
  return <Text {...props} style={[styles.sectionTitle, props.style]} />;
}

export function ErrorText(props: TextProps) {
  return <Text accessibilityLiveRegion="polite" {...props} style={[styles.error, props.style]} />;
}

export function MutedText(props: TextProps) {
  return <Text {...props} style={[styles.muted, props.style]} />;
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontFamily: font.extrabold, color: color.text },
  screenTitle: { fontSize: fontSize.screenTitle, fontFamily: font.extrabold, color: color.text },
  sectionTitle: { fontSize: fontSize.md, fontFamily: font.semibold, color: color.text, marginTop: 12 },
  error: { color: color.error, fontFamily: font.regular },
  muted: { color: color.textMuted, fontFamily: font.regular },
});
