import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';

/**
 * SettingsScreen: Schermata di configurazione dell'app.
 * Permette di gestire il profilo, l'abbonamento (RevenueCat) e le preferenze di notifica.
 */
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Impostazioni</Text>
      <Text style={styles.subtitle}>Configura il tuo account e le preferenze dell'app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: colors.accent,
    fontFamily: typography.sans,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.sans,
    fontSize: 16,
    textAlign: 'center',
  }
});
