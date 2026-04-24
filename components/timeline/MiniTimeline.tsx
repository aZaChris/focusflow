import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, typography } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WIDGET_WIDTH = SCREEN_WIDTH - 40; // Simuliamo la larghezza di un widget
const HOUR_WIDTH = WIDGET_WIDTH / 4; // Mostriamo 4 ore alla volta

interface MiniTimelineProps {
  compact?: boolean;
}

/**
 * MiniTimeline: Versione ottimizzata per Widget e Live Activities.
 * Si concentra sull'immediato futuro (prossime 4 ore).
 */
export default function MiniTimeline({ compact = false }: MiniTimelineProps) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Mock delle attività vicine
  const upcomingActivities = [
    { start: currentHour + 0.5, duration: 1, title: 'Focus', color: colors.activities.purple },
    { start: currentHour + 2.5, duration: 0.5, title: 'Break', color: colors.activities.teal },
  ];

  const currentTimePosition = (currentMinutes / 60) * HOUR_WIDTH;

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* BACKGROUND GRID (4 ore) */}
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4].map((h) => (
          <View key={h} style={[styles.hourMarker, { left: h * HOUR_WIDTH }]}>
            <Text style={styles.hourLabel}>{currentHour + h}:00</Text>
            <View style={styles.tick} />
          </View>
        ))}

        {/* ATTIVITÀ PROSSIME */}
        {upcomingActivities.map((act, index) => {
          const relativeStart = (act.start - currentHour) * HOUR_WIDTH;
          return (
            <View 
              key={index}
              style={[
                styles.activityBar,
                { 
                  left: relativeStart, 
                  width: act.duration * HOUR_WIDTH,
                  backgroundColor: act.color 
                }
              ]}
            >
              {!compact && <Text style={styles.activityTitle} numberOfLines={1}>{act.title}</Text>}
            </View>
          );
        })}

        {/* LINEA TEMPO REALE (Sempre all'inizio o quasi) */}
        <View style={[styles.nowIndicator, { left: currentTimePosition }]}>
          <View style={styles.nowDot} />
          <View style={styles.nowLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 15,
    height: 100,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compactContainer: {
    height: 60,
    padding: 10,
    borderRadius: 12,
  },
  grid: {
    height: 40,
    width: '100%',
    position: 'relative',
  },
  hourMarker: {
    position: 'absolute',
    height: '100%',
    alignItems: 'center',
  },
  hourLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tick: {
    width: 1,
    height: 10,
    backgroundColor: colors.border,
  },
  activityBar: {
    position: 'absolute',
    top: 15,
    height: 20,
    borderRadius: 6,
    paddingHorizontal: 6,
    justifyContent: 'center',
    zIndex: 1,
  },
  activityTitle: {
    color: colors.bg,
    fontSize: 10,
    fontWeight: 'bold',
  },
  nowIndicator: {
    position: 'absolute',
    top: 10,
    bottom: -10,
    zIndex: 10,
    alignItems: 'center',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginBottom: -2,
  },
  nowLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.accent,
  }
});
