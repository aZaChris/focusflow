import React, { useEffect, useState } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';
import { useTheme } from '../../context/ThemeContext';

/**
 * DEFINIZIONE DEI FRAME DI ANIMAZIONE (8x8 Pixel Grid)
 * 1: Rappresenta un pixel colorato (colore primario del tema)
 * 0: Rappresenta uno spazio vuoto (trasparente)
 */

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

/**
 * PixelCharacter: Il protagonista della timeline.
 * Disegna un personaggio in pixel-art generato proceduralmente tramite Rect di Skia.
 * L'animazione è gestita tramite un timer React che alterna i frame.
 */
export default function PixelCharacter({ x, y }: { x: number; y: number }) {
  const { theme } = useTheme();
  const [frame, setFrame] = useState(0);
  const frames = [frame1, frame2];
  
  // Dimensione di ogni singolo "pixel" del personaggio
  const PIXEL_SIZE = 3; 

  const charHeight = 8 * PIXEL_SIZE; // Altezza logica: 24px
  const charWidth = 8 * PIXEL_SIZE;

  /**
   * Effetto di animazione: Alterna i frame ogni 250ms per creare 
   * l'illusione della camminata infinita.
   */
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
                /**
                 * POSIZIONAMENTO:
                 * x: Centriamo il personaggio rispetto alla coordinata X passata.
                 * y: Usiamo la coordinata Y come "linea di terra", sottraendo l'altezza del personaggio.
                 */
                x={x - (charWidth / 2) + colIdx * PIXEL_SIZE} 
                y={y - charHeight + rowIdx * PIXEL_SIZE} 
                width={PIXEL_SIZE} 
                height={PIXEL_SIZE} 
                color={theme.colors.primary} 
              />
            );
          }
          return null;
        })
      )}
    </Group>
  );
}
