import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Canvas, Rect, Group, Line, vec } from '@shopify/react-native-skia';
// Usa lo state React standard per l'animazione base Skia se Reanimated dà problemi di compatibilità,
// ma qui applichiamo un approccio statico iniziale per garantire il rendering della scena.
import PixerCharacter from './PixelCharacter';
import ActivityBlock from './ActivityBlock';
import { colors } from '../../constants/theme';
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CANVAS_HEIGHT = 200;
const GROUND_Y = CANVAS_HEIGHT - 30;
const PRESENT_X = width * 0.38; // L'ancora del momento presente

export default function TimelineCanvas() {
  const timeOffset = useSharedValue(0);

  useEffect(() => {
    // Scorrimento infinito verso sinistra per simulare il passaggio del tempo
    timeOffset.value = withRepeat(
      withTiming(-1000, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  return (
    <Canvas style={styles.canvas}>
      {/* Sfondo del Cielo Notturno */}
      <Rect x={0} y={0} width={width} height={CANVAS_HEIGHT} color={colors.bg} />
      
      {/* Stelle in parallasse */}
      <Rect x={width * 0.1} y={30} width={2} height={2} color="#ffffff55" />
      <Rect x={width * 0.4} y={60} width={3} height={3} color="#ffffff88" />
      <Rect x={width * 0.7} y={20} width={2} height={2} color="#ffffff44" />
      <Rect x={width * 0.9} y={80} width={2} height={2} color="#ffffff33" />
      
      {/* Linea del Suolo in stile pixel */}
      <Line 
        p1={vec(0, GROUND_Y)} 
        p2={vec(width, GROUND_Y)} 
        color={colors.border} 
        strokeWidth={3} 
      />
      <Rect x={0} y={GROUND_Y + 1} width={width} height={CANVAS_HEIGHT - GROUND_Y} color={colors.surface2} />

      {/* @ts-ignore - Skia expects specific derived values context or object but accepts sharedvalue implicitly in this version */}
      <Group transform={[{ translateX: timeOffset }]}>
        {/* Attività Mockate Scorrevoli */}
        <ActivityBlock x={PRESENT_X - 120} y={GROUND_Y} width={100} color={colors.activities.teal} completed={true} />
        <ActivityBlock x={PRESENT_X + 20} y={GROUND_Y} width={150} color={colors.activities.coral} completed={false} />
        <ActivityBlock x={PRESENT_X + 190} y={GROUND_Y} width={90} color={colors.activities.purple} completed={false} />
      </Group>

      {/* Raggio "Ora" (Linea guida semi-trasparente) */}
      <Line
        p1={vec(PRESENT_X, 0)}
        p2={vec(PRESENT_X, CANVAS_HEIGHT)}
        color="#ffffff11"
        strokeWidth={2}
      />

      {/* Il Personaggio Principale "Ora" */}
      <PixerCharacter x={PRESENT_X} y={GROUND_Y} />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: CANVAS_HEIGHT,
  },
});
