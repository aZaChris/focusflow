import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';

/**
 * InsightsScreen: Modulo per l'analisi dei dati dell'utente.
 * Analizza i dati del mood e del diario per fornire feedback sull'andamento del benessere.
 */
export default function InsightsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Analisi Insights</Text>
      <Text style={styles.subtitle}>Statistiche sull'umore e riassunti settimanali in arrivo.</Text>
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
