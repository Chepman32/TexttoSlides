import React from 'react';
import {
  Group,
  Text as SkText,
  BlurMask,
  type SkFont,
} from '@shopify/react-native-skia';

interface BloomPassProps {
  text: string;
  x: number;
  baselineY: number;
  font: SkFont;
  textColor: string;
  threshold: number; // 0-1
  radius: number;
  intensity: number; // 0-1
}

export const BloomPass: React.FC<BloomPassProps> = ({
  text,
  x,
  baselineY,
  font,
  textColor,
  threshold,
  radius,
  intensity,
}) => {
  // Limit radius to reasonable bounds
  const safeRadius = Math.min(radius, 30);
  const safeIntensity = Math.max(0.1, Math.min(1, intensity));

  return (
    <Group>
      {/* Bloom halo - large blurred version */}
      <Group>
        <BlurMask blur={safeRadius} style="outer" />
        <SkText
          text={text}
          x={x}
          y={baselineY}
          font={font}
          color={textColor}
          opacity={safeIntensity * 0.5}
        />
      </Group>

      {/* Main text */}
      <SkText
        text={text}
        x={x}
        y={baselineY}
        font={font}
        color={textColor}
        opacity={1}
      />
    </Group>
  );
};
