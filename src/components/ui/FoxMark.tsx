import { Image, StyleSheet } from 'react-native';

// Current prototype shows the fox mark plain, no background badge behind it
// (the icon asset itself already carries the brand color) — Login (64x64),
// Register (56x56), Subscription paywall header (56x56).
export function FoxMark({ size = 64 }: { size?: number }) {
  return <Image source={require('../../../assets/images/fox-icon.png')} style={[styles.image, { width: size, height: size }]} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  image: {},
});
