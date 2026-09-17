import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color as tokenColor } from '@/theme/tokens';

// Handoff README: "recreate with your icon library or react-native-svg" —
// small hand-drawn line-icon set rather than a new icon-library dependency,
// since react-native-svg is already required for the mood/habits charts.
export type IconName =
  | 'chevronRight'
  | 'check'
  | 'mic'
  | 'x'
  | 'play'
  | 'tabToday'
  | 'tabHabits'
  | 'tabReflect'
  | 'tabSettings';

export function Icon({ name, size = 22, color = tokenColor.text, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const };
  switch (name) {
    case 'chevronRight':
      return (
        <Svg {...common}>
          <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'mic':
      return (
        <Svg {...common}>
          <Rect x="9" y="2" width="6" height="11" rx="3" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M5 10a7 7 0 0 0 14 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M12 19v3M8 22h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...common}>
          <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'play':
      return (
        <Svg {...common}>
          <Path d="M6 4l14 8-14 8V4z" fill={color} />
        </Svg>
      );
    case 'tabToday':
      return (
        <Svg {...common}>
          <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M3 9.5h18M8 3v4M16 3v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'tabHabits':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M8.5 12.5l2.3 2.3L15.5 9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'tabReflect':
      return (
        <Svg {...common}>
          <Path
            d="M12 20.5s-7-4.2-9.3-8.5C1 8.7 2.4 5.4 5.7 5.4c2 0 3.4 1.2 4.3 2.5.9-1.3 2.3-2.5 4.3-2.5 3.3 0 4.7 3.3 3 6.6-2.3 4.3-9.3 8.5-9.3 8.5z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'tabSettings':
      return (
        <Svg {...common}>
          <Path d="M4 6h9M4 12h3M4 18h13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M17 6h3M9 12h11M20 18h0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="15" cy="6" r="2" fill={tokenColor.background} stroke={color} strokeWidth={strokeWidth} />
          <Circle cx="7" cy="12" r="2" fill={tokenColor.background} stroke={color} strokeWidth={strokeWidth} />
          <Circle cx="16" cy="18" r="2" fill={tokenColor.background} stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
  }
}
