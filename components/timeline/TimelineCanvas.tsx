import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import { Canvas, Rect, Group, Line, vec, Skia, useFont, Text as SkiaText } from '@shopify/react-native-skia';
import PixelCharacter from './PixelCharacter';
import ActivityBlock from './ActivityBlock';
import { colors } from '../../constants/theme';
import Animated, { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue, useAnimatedStyle } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CANVAS_HEIGHT = 350;
const GROUND_Y = 270;
const PRESENT_X = width * 0.38; 
const TICK_SPACING = 600; // Pixel per ora (deve corrispondere a quello dei blocchi)

interface TimelineProps {
  habits?: any[];
}

export default function TimelineCanvas({ habits = [] }: TimelineProps) {
  const currentTime = useSharedValue(new Date().getHours() + (new Date().getMinutes() / 60) + (new Date().getSeconds() / 3600));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      currentTime.value = now.getHours() + (now.getMinutes() / 60) + (now.getSeconds() / 3600);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const matrix = useDerivedValue(() => {
    const m = Skia.Matrix();
    return m;
  });

  if (!Canvas) return null;

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  console.log("TimelineCanvas render - Habits count:", habits.length);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Rect x={0} y={0} width={width} height={CANVAS_HEIGHT} color={colors.bg} />
        
        {/* Stelle parallasse statiche */}
        <Rect x={width * 0.1} y={30} width={4} height={4} color="#ffffff55" />
        <Rect x={width * 0.4} y={80} width={6} height={6} color="#ffffff88" />
        <Rect x={width * 0.7} y={40} width={4} height={4} color="#ffffff44" />
        
        <Line 
          p1={vec(0, GROUND_Y)} 
          p2={vec(width, GROUND_Y)} 
          color={colors.border} 
          strokeWidth={4} 
        />
        <Rect x={0} y={GROUND_Y + 1} width={width} height={CANVAS_HEIGHT - GROUND_Y} color={colors.surface2} />

        {/* Griglia delle ore reale */}
        <Group matrix={matrix}>
          {habits
            .filter(habit => habit.scheduled_time)
            .map((habit, index) => {
              const [hours, minutes] = habit.scheduled_time.split(':').map(Number);
              const habitDecimalTime = hours + (minutes / 60);

              return (
                <AnimatedActivityBlock 
                  key={habit.id || index}
                  habitDecimalTime={habitDecimalTime}
                  currentTime={currentTime}
                  PRESENT_X={PRESENT_X}
                  GROUND_Y={GROUND_Y}
                  duration={habit.duration_minutes}
                  color={habit.is_completed ? colors.activities.teal : colors.activities.purple} 
                  completed={habit.is_completed} 
                />
              );
            })
          }
        </Group>

        <Line
          p1={vec(PRESENT_X, 0)}
          p2={vec(PRESENT_X, CANVAS_HEIGHT)}
          color="#ffffff11"
          strokeWidth={2}
        />

        <PixelCharacter x={PRESENT_X} y={GROUND_Y} />
      </Canvas>

      {/* LIVELLO TESTO (REACT NATIVE) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {hoursArray.map((h) => (
          <AnimatedHourLabel 
            key={h} 
            hour={h} 
            currentTime={currentTime} 
            PRESENT_X={PRESENT_X} 
            GROUND_Y={GROUND_Y} 
          />
        ))}
        {habits
          .filter(habit => habit.scheduled_time)
          .map((habit, index) => {
            const [h, m] = habit.scheduled_time.split(':').map(Number);
            const habitDecimalTime = h + (m / 60);
            return (
              <AnimatedTitleLabel 
                key={habit.id || index}
                title={habit.title}
                habitDecimalTime={habitDecimalTime}
                currentTime={currentTime}
                PRESENT_X={PRESENT_X}
                GROUND_Y={GROUND_Y}
              />
            );
          })
        }
      </View>
    </View>
  );
}

function AnimatedActivityBlock({ habitDecimalTime, currentTime, PRESENT_X, GROUND_Y, duration, color, completed }: any) {
  const matrix = useDerivedValue(() => {
    const timeDiff = habitDecimalTime - currentTime.value;
    const xPos = PRESENT_X + (timeDiff * TICK_SPACING);
    const m = Skia.Matrix();
    m.translate(xPos, 0);
    return m;
  });

  const width = (duration / 60) * TICK_SPACING;

  return (
    <Group matrix={matrix}>
      <ActivityBlock 
        y={GROUND_Y} 
        width={width} 
        color={color} 
        completed={completed} 
      />
    </Group>
  );
}

function AnimatedHourLabel({ hour, currentTime, PRESENT_X, GROUND_Y }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    const timeDiff = hour - currentTime.value;
    const xPos = PRESENT_X + (timeDiff * TICK_SPACING);
    return {
      transform: [{ translateX: xPos }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute', left: 0, top: GROUND_Y + 15 }]}>
      <Text style={styles.hourText}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
    </Animated.View>
  );
}

function AnimatedTitleLabel({ title, habitDecimalTime, currentTime, PRESENT_X, GROUND_Y }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    const timeDiff = habitDecimalTime - currentTime.value;
    const xPos = PRESENT_X + (timeDiff * TICK_SPACING);
    return {
      transform: [{ translateX: xPos }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute', left: 0, top: GROUND_Y - 70 }]}>
      <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CANVAS_HEIGHT,
    width: '100%',
  },
  canvas: {
    flex: 1,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    paddingLeft: 10,
    letterSpacing: 0.5,
  },
  hourText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: -18, 
  },
  fallback: {
    height: CANVAS_HEIGHT,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fallbackText: {
    color: colors.muted
  }
});
