import { Group, Rect } from '@shopify/react-native-skia';
import { useTheme } from '../../context/ThemeContext';

interface ActivityBlockProps {
  y: number;
  width: number;
  color: string;
  completed: boolean;
  title?: string;
}

/**
 * ActivityBlock: Rappresenta visivamente un'attività sulla timeline.
 * Disegnato come un rettangolo con bordi illuminati in stile pixel-art.
 */
export default function ActivityBlock({ y, width, color, completed }: ActivityBlockProps) {
  const { theme } = useTheme();
  const height = 28;
  const opacity = completed ? 1.0 : 0.6;
  const x = 0; // Il blocco viene disegnato a 0 e spostato dal Group superiore tramite matrice

  return (
    <Group opacity={opacity}>
      {/* Corpo principale dell'attività */}
      <Rect x={x} y={y - height} width={width} height={height} color={color} />
      
      {/* Bordi laterali (Dettaglio estetico) */}
      <Rect x={x} y={y - height} width={2} height={height} color="#ffffff88" />
      <Rect x={x + width - 2} y={y - height} width={2} height={height} color="#ffffff88" />

      {/* Bordo superiore (Effetto luce) */}
      <Rect x={x} y={y - height} width={width} height={3} color="#ffffff44" />
      
      {/* Angoli "trasparenti" per estetica 8-bit (usano il colore dello sfondo) */}
      <Rect x={x} y={y - height} width={2} height={2} color={theme.colors.background} />
      <Rect x={x + width - 2} y={y - height} width={2} height={2} color={theme.colors.background} />
      <Rect x={x} y={y - 2} width={2} height={2} color={theme.colors.background} />
      <Rect x={x + width - 2} y={y - 2} width={2} height={2} color={theme.colors.background} />
    </Group>
  );
}
