import React, { useEffect, useState } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { colors } from '../../constants/theme';

// Semplice ciclo di camminata a 2 frame (estetica 8-bit)
const frame1 = [
  "00111100",
  "01111110",
  "11011011",
  "11111111",
  "01111110",
  "00100100",
  "01100110",
  "01100110",
];

const frame2 = [
  "00111100",
  "01111110",
  "11011011",
  "11111111",
  "01111110",
  "00110000",
  "00111000",
  "00011000",
];

export default function PixelCharacter({ x, y }: { x: number; y: number }) {
  const [frame, setFrame] = useState(0);
  const frames = [frame1, frame2];
  const PIXEL_SIZE = 3; 

  const charHeight = 8 * PIXEL_SIZE; // 24px logical height
  const charWidth = 8 * PIXEL_SIZE;

  // Animazione camminata
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const currentGrid = frames[frame];

  return (
    <Group>
      {currentGrid.map((row, rowIdx) => 
        row.split('').map((cell, colIdx) => {
          if (cell === "1") {
            return (
              <Rect 
                key={`${rowIdx}-${colIdx}`}
                // Posizioniamo il personaggio usando X centrale e Y come base a terra
                x={x - (charWidth / 2) + colIdx * PIXEL_SIZE} 
                y={y - charHeight + rowIdx * PIXEL_SIZE} 
                width={PIXEL_SIZE} 
                height={PIXEL_SIZE} 
                color={colors.accent} 
              />
            );
          }
          return null;
        })
      )}
    </Group>
  );
}
