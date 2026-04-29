import { Group, Rect, Line, vec } from '@shopify/react-native-skia';
import { colors } from '../../constants/theme';

interface ActivityBlockProps {
  y: number;
  width: number;
  color: string;
  completed: boolean;
  title?: string;
}

export default function ActivityBlock({ y, width, color, completed, title }: ActivityBlockProps) {
  const height = 28;
  const opacity = completed ? 1.0 : 0.6;
  const x = 0; // Il blocco viene disegnato a 0 e spostato dal Group superiore

  return (
    <Group opacity={opacity}>
      {/* Corpo principale */}
      <Rect x={x} y={y - height} width={width} height={height} color={color} />
      
      {/* Bordi laterali (Inizio e Fine) */}
      <Rect x={x} y={y - height} width={2} height={height} color="#ffffff88" />
      <Rect x={x + width - 2} y={y - height} width={2} height={height} color="#ffffff88" />

      {/* Bordo superiore illuminato */}
      <Rect x={x} y={y - height} width={width} height={3} color="#ffffff44" />
      
      {/* Angoli tagliati pixel-art */}
      <Rect x={x} y={y - height} width={2} height={2} color={colors.bg} />
      <Rect x={x + width - 2} y={y - height} width={2} height={2} color={colors.bg} />
      <Rect x={x} y={y - 2} width={2} height={2} color={colors.bg} />
      <Rect x={x + width - 2} y={y - 2} width={2} height={2} color={colors.bg} />
    </Group>
  );
}
