import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import { colors, typography } from '../../constants/theme';

const { width } = Dimensions.get('window');
const HOUR_WIDTH = 80; // Larghezza di ogni ora sulla timeline
const TIMELINE_HEIGHT = 160;

/**
 * TimelineCanvas: Una visualizzazione interattiva del tempo.
 * Versione ottimizzata per Expo Go (senza Skia) ma con design premium.
 */
interface TimelineProps {
  habits?: any[];
}

export default function TimelineCanvas({ habits = [] }: TimelineProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Calcola la posizione del tempo corrente
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentTimePosition = currentHour * HOUR_WIDTH;

  useEffect(() => {
    // Autoscroll verso l'ora corrente all'avvio
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: currentTimePosition - width / 2 + HOUR_WIDTH / 2,
        animated: true,
      });
    }, 500);
  }, [currentTimePosition]);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.dayText}>Timeline di Oggi</Text>
        <View style={styles.nowBadge}>
          <Text style={styles.nowBadgeText}>LIVE</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Griglia delle Ore */}
        {Array.from({ length: 25 }).map((_, i) => (
          <View key={i} style={[styles.hourColumn, { width: HOUR_WIDTH }]}>
            <Text style={styles.hourText}>{i}:00</Text>
            <View style={styles.gridLine} />
          </View>
        ))}

        {/* Abitudini Reali */}
        {habits.map((habit, index) => {
          const habitDate = new Date(habit.created_at);
          const habitHour = habitDate.getHours() + habitDate.getMinutes() / 60;
          
          return (
            <View 
              key={habit.id || index} 
              style={[
                styles.activityBlock, 
                { 
                  left: habitHour * HOUR_WIDTH, 
                  width: 120, // Larghezza fissa per le abitudini
                  backgroundColor: habit.is_completed ? colors.activities.teal + '33' : colors.surface2,
                  borderColor: habit.is_completed ? colors.activities.teal : colors.border,
                }
              ]}
            >
              <Text style={[styles.activityTitle, { color: habit.is_completed ? colors.activities.teal : colors.text }]}>
                {habit.icon || '✨'} {habit.title}
              </Text>
            </View>
          );
        })}

        {/* Indicatore Tempo Reale */}
        <View style={[styles.currentTimeLine, { left: currentTimePosition }]}>
          <View style={styles.currentTimeDot} />
          <View style={styles.currentTimeGlow} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    height: TIMELINE_HEIGHT + 60,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  dayText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: typography.sans,
  },
  nowBadge: {
    backgroundColor: colors.activities.red + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.activities.red,
  },
  nowBadgeText: {
    color: colors.activities.red,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scrollView: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  contentContainer: {
    height: TIMELINE_HEIGHT,
    paddingHorizontal: 20,
  },
  hourColumn: {
    height: '100%',
    alignItems: 'flex-start',
    paddingTop: 15,
  },
  hourText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  gridLine: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border,
  },
  activityBlock: {
    position: 'absolute',
    top: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    padding: 10,
    justifyContent: 'center',
    zIndex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  currentTimeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.accent,
    zIndex: 10,
  },
  currentTimeDot: {
    position: 'absolute',
    top: 40,
    left: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  currentTimeGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -10,
    width: 22,
    backgroundColor: colors.accentDim,
    opacity: 0.2,
  }
});
