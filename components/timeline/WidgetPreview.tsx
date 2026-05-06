import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MiniTimeline from './MiniTimeline';
import { colors, typography } from '../../constants/theme';

/**
 * WidgetPreview: Simula l'aspetto della Timeline sulla Lock Screen.
 */
export default function WidgetPreview() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔒 Lock Screen Preview</Text>
        <Text style={styles.status}>Sincronizzato</Text>
      </View>
      
      <View style={styles.phoneFrame}>
        <View style={styles.lockContent}>
          <Text style={styles.timeText}>10:45</Text>
          <Text style={styles.dateText}>Lunedì, 27 Aprile</Text>
          
          <View style={styles.widgetCard}>
             <Text style={styles.widgetLabel}>FOCUS FLOW</Text>
             <MiniTimeline />
          </View>
        </View>
      </View>
      
      <Text style={styles.hint}>
        Questo widget apparirà sulla tua Lock Screen aggiornandosi in tempo reale tra i tuoi dispositivi.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    color: colors.activities.teal,
    fontSize: 12,
    fontWeight: 'bold',
  },
  phoneFrame: {
    width: '100%',
    height: 300,
    backgroundColor: '#1a1a2e',
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#333',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    width: '100%',
  },
  timeText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '200',
    marginBottom: 5,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 40,
  },
  widgetCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 10,
  },
  widgetLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    opacity: 0.6,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 18,
  }
});
