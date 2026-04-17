import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';

/**
 * HabitsScreen: Schermata dedicata al monitoraggio delle abitudini.
 * [Punto di estensione]: Qui verrà implementata la logica per le habit streak.
 */
export default function HabitsScreen() {
  return (
    <View style={styles.container}>
      {/* Icona o placeholder per la sezione in sviluppo */}
      <Text style={styles.text}>Abitudini</Text>
      <Text style={styles.subtitle}>Presto disponibile: traccia le tue routine quotidiane.</Text>
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
