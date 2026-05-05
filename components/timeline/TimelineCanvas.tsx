import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Canvas, Rect, Group, Line, vec, Skia } from '@shopify/react-native-skia';
import PixelCharacter from './PixelCharacter';
import ActivityBlock from './ActivityBlock';
import { useTheme } from '../../context/ThemeContext';
import Animated, { useSharedValue, useDerivedValue, useAnimatedStyle } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

/**
 * COSTANTI DI LAYOUT DELLA TIMELINE
 * GROUND_Y: L'altezza del terreno su cui cammina il personaggio.
 * PRESENT_X: La posizione orizzontale fissa del personaggio (il "Presente").
 * TICK_SPACING: Quanti pixel corrispondono a un'ora di tempo (600px/h).
 */
const CANVAS_HEIGHT = 350;
const GROUND_Y = 270;
const PRESENT_X = width * 0.38; 
const TICK_SPACING = 600; 

interface TimelineProps {
  habits?: any[];
}

/**
 * TimelineCanvas: Il cuore grafico di FocusFlow.
 * Utilizza Shopify Skia per il rendering ad alte prestazioni e Reanimated per le animazioni fluide.
 * La timeline scorre in tempo reale sotto i piedi del personaggio.
 */
export default function TimelineCanvas({ habits = [] }: TimelineProps) {
  const { theme } = useTheme();
  
  // Valore condiviso che rappresenta l'ora decimale corrente (es. 14.5 = 14:30)
  const currentTime = useSharedValue(new Date().getHours() + (new Date().getMinutes() / 60) + (new Date().getSeconds() / 3600));

  // Loop di aggiornamento: mantiene il tempo sincronizzato ogni secondo
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      currentTime.value = now.getHours() + (now.getMinutes() / 60) + (now.getSeconds() / 3600);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const matrix = useDerivedValue(() => Skia.Matrix());

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* 
          STRATO SKIA (GPU):
          Gestisce lo sfondo, il terreno, i blocchi attività e il personaggio animato.
      */}
      <Canvas style={styles.canvas}>
        {/* Sfondo Notturno/Spazio */}
        <Rect x={0} y={0} width={width} height={CANVAS_HEIGHT} color={theme.colors.background} />
        
        {/* Stelle Parallasse (Elementi decorativi) */}
        <Rect x={width * 0.1} y={30} width={4} height={4} color="#ffffff55" />
        <Rect x={width * 0.4} y={80} width={6} height={6} color="#ffffff88" />
        <Rect x={width * 0.7} y={40} width={4} height={4} color="#ffffff44" />
        
        {/* Linea del terreno e riempimento inferiore */}
        <Line 
          p1={vec(0, GROUND_Y)} 
          p2={vec(width, GROUND_Y)} 
          color={theme.colors.border} 
          strokeWidth={4} 
        />
        <Rect x={0} y={GROUND_Y + 1} width={width} height={CANVAS_HEIGHT - GROUND_Y} color={theme.colors.surface2} />

        {/* Gruppo Blocchi Attività: Ogni blocco si muove in base al tempo corrente */}
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
                  color={habit.is_completed ? theme.colors.activities.teal : theme.colors.activities.purple} 
                  completed={habit.is_completed} 
                />
              );
            })
          }
        </Group>

        {/* Linea verticale indicatrice del "Adesso" */}
        <Line
          p1={vec(PRESENT_X, 0)}
          p2={vec(PRESENT_X, CANVAS_HEIGHT)}
          color="#ffffff11"
          strokeWidth={2}
        />

        {/* Personaggio Pixel-Art animato */}
        <PixelCharacter x={PRESENT_X} y={GROUND_Y} />
      </Canvas>

      {/* 
          STRATO UI (REACT NATIVE):
          Gestisce le etichette di testo (ore e titoli) che devono essere 
          perfettamente leggibili e non renderizzate via GPU per massima nitidezza.
      */}
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

/**
 * AnimatedActivityBlock: Gestisce la posizione dinamica del blocco attività.
 * Calcola l'offset X in base alla differenza tra l'ora del blocco e l'ora corrente.
 */
function AnimatedActivityBlock({ habitDecimalTime, currentTime, PRESENT_X, GROUND_Y, duration, color, completed }: any) {
  const matrix = useDerivedValue(() => {
    const timeDiff = habitDecimalTime - currentTime.value;
    const xPos = PRESENT_X + (timeDiff * TICK_SPACING);
    const m = Skia.Matrix();
    m.translate(xPos, 0);
    return m;
  });

  const blockWidth = (duration / 60) * TICK_SPACING;

  return (
    <Group matrix={matrix}>
      <ActivityBlock 
        y={GROUND_Y} 
        width={blockWidth} 
        color={color} 
        completed={completed} 
      />
    </Group>
  );
}

/**
 * AnimatedHourLabel: Etichetta oraria che scorre in sincronia con la timeline.
 */
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

/**
 * AnimatedTitleLabel: Titolo dell'attività fluttuante sopra il blocco corrispondente.
 */
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
  }
});
