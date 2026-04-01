import React from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { colors } from '../../constants/theme';

interface ActivityBlockProps {
  x: number;
  y: number;
  width: number;
  color: string;
  completed: boolean;
}

export default function ActivityBlock({ x, y, width, color, completed }: ActivityBlockProps) {
  const height = 28;
  const opacity = completed ? 1.0 : 0.5;

  return (
    <Group opacity={opacity}>
      {/* Corpo principale */}
      <Rect x={x} y={y - height} width={width} height={height} color={color} />
      
      {/* Bordo superiore illuminato */}
      <Rect x={x} y={y - height} width={width} height={3} color="#ffffff44" />
      
      {/* Estetica pixel 8-bit (angoli "tagliati") */}
      <Rect x={x} y={y - height} width={2} height={2} color={colors.bg} />
      <Rect x={x + width - 2} y={y - height} width={2} height={2} color={colors.bg} />
      <Rect x={x} y={y - 2} width={2} height={2} color={colors.bg} />
      <Rect x={x + width - 2} y={y - 2} width={2} height={2} color={colors.bg} />
    </Group>
  );
}
