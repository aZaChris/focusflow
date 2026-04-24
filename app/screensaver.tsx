import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../constants/theme';
import TimelineCanvas from '../components/timeline/TimelineCanvas';

/**
 * Screensaver Mode: Una dashboard "Always-On" per il focus.
 * Mostra l'ora e la timeline in un formato ad alta visibilità.
 */
export default function ScreensaverScreen() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* HEADER: OROLOGIO E DATA */}
      <View style={styles.header}>
        <Text style={styles.clockText}>{formatTime(time)}</Text>
        <Text style={styles.dateText}>{formatDate(time)}</Text>
      </View>

      {/* CENTER: TIMELINE (Riutilizziamo il componente esistente) */}
      <View style={styles.timelineContainer}>
        <TimelineCanvas />
      </View>

      {/* FOOTER: MESSAGGIO MOTIVAZIONALE O FOCUS ATTUALE */}
      <View style={styles.footer}>
        <View style={styles.focusPill}>
          <Feather name="zap" size={18} color={colors.accent} />
          <Text style={styles.focusText}>MODALITÀ FOCUS ATTIVA</Text>
        </View>
      </View>

      {/* TASTO CHIUDI (Invisibile o discreto) */}
      <TouchableOpacity 
        style={styles.exitBtn} 
        onPress={() => router.back()}
        activeOpacity={0.6}
      >
        <Feather name="x" size={24} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Nero assoluto per risparmio energetico/focus
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  clockText: {
    color: colors.text,
    fontSize: 100,
    fontWeight: '200', // Sottile e moderno
    fontFamily: typography.sans,
    letterSpacing: -2,
  },
  dateText: {
    color: colors.accent,
    fontSize: 18,
    fontFamily: typography.sans,
    textTransform: 'capitalize',
    marginTop: -10,
    opacity: 0.8,
  },
  timelineContainer: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 240, 74, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.accentDim,
  },
  focusText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 2,
  },
  exitBtn: {
    position: 'absolute',
    top: 50,
    right: 30,
    padding: 10,
  }
});
