import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View, Text } from 'react-native';
import { Canvas, Rect, Group, Line, vec } from '@shopify/react-native-skia';
import PixelCharacter from './PixelCharacter';
import ActivityBlock from './ActivityBlock';
import { colors } from '../../constants/theme';
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

/**
 * Dimensioni e costanti di layout per il Canvas.
 */
const { width } = Dimensions.get('window');
const CANVAS_HEIGHT = 200;
const GROUND_Y = CANVAS_HEIGHT - 30; // Posizione Y del terreno
const PRESENT_X = width * 0.38;       // Punto X che rappresenta il momento attuale ("Ora")

/**
 * TimelineCanvas: Un componente grafico avanzato basato su React Native Skia.
 * Rappresenta visivamente il trascorrere del tempo come un mondo a scorrimento laterale
 * dove le attività sono blocchi sul terreno e l'utente è un personaggio pixel-art.
 */
export default function TimelineCanvas() {
  /**
   * timeOffset: SharedValue di Reanimated per gestire lo scorrimento fluido dello sfondo.
   * Viene utilizzato per traslare il gruppo delle attività.
   */
  const timeOffset = useSharedValue(0);

  useEffect(() => {
    // Avvia l'animazione di scorrimento infinito in loop
    if (timeOffset) {
      timeOffset.value = withRepeat(
        withTiming(-1000, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, []);

  /**
   * Fallback: Se il modulo Canvas di Skia non è pronto (es. durante build native incomplete),
   * mostriamo un rettangolo segnaposto per evitare crash dell'intera app.
   */
  if (!Canvas) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={{ color: colors.muted }}>Grafica Skia non disponibile</Text>
      </View>
    );
  }

  return (
    <Canvas style={styles.canvas}>
      {/* 🌌 SFONDO: Cielo notturno profondo */}
      <Rect x={0} y={0} width={width} height={CANVAS_HEIGHT} color={colors.bg} />
      
      {/* ✨ STELLE: Elementi statici per dare profondità */}
      <Rect x={width * 0.1} y={30} width={2} height={2} color="#ffffff55" />
      <Rect x={width * 0.4} y={60} width={3} height={3} color="#ffffff88" />
      <Rect x={width * 0.7} y={20} width={2} height={2} color="#ffffff44" />
      <Rect x={width * 0.9} y={80} width={2} height={2} color="#ffffff33" />
      
      {/* 🌱 TERRENO: Linea di base e riempimento inferiore */}
      <Line 
        p1={vec(0, GROUND_Y)} 
        p2={vec(width, GROUND_Y)} 
        color={colors.border} 
        strokeWidth={3} 
      />
      <Rect x={0} y={GROUND_Y + 1} width={width} height={CANVAS_HEIGHT - GROUND_Y} color={colors.surface2} />

      {/* 🏃‍♂️ ATTIVITÀ SCORREVOLI: 
          Questo gruppo si muove nel tempo per simulare l'avanzamento della giornata. */}
      {/* @ts-ignore - Skia accetta SharedValue in modo implicito nelle trasformazioni */}
      <Group transform={[{ translateX: timeOffset }]}>
        {/* Rappresentazione dei blocchi di attività passate, presenti e future */}
        <ActivityBlock x={PRESENT_X - 120} y={GROUND_Y} width={100} color={colors.activities.teal} completed={true} />
        <ActivityBlock x={PRESENT_X + 20} y={GROUND_Y} width={150} color={colors.activities.coral} completed={false} />
        <ActivityBlock x={PRESENT_X + 190} y={GROUND_Y} width={90} color={colors.activities.purple} completed={false} />
      </Group>

      {/* 🏛 INDICATORE TEMPORALE: Una linea sottile che marca il presente */}
      <Line
        p1={vec(PRESENT_X, 0)}
        p2={vec(PRESENT_X, CANVAS_HEIGHT)}
        color="#ffffff11"
        strokeWidth={2}
      />

      {/* 🎭 AVATAR: Il personaggio principale che rappresenta la posizione dell'utente nel tempo */}
      <PixelCharacter x={PRESENT_X} y={GROUND_Y} />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: CANVAS_HEIGHT,
  },
  fallbackContainer: { 
    height: CANVAS_HEIGHT, 
    backgroundColor: colors.surface, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});
