import React from 'react';
import { Group, Text as SkText, type SkFont } from '@shopify/react-native-skia';

interface LongShadowPassProps {
  text: string;
  x: number;
  baselineY: number;
  font: SkFont;
  textColor: string;
  shadowColor: string;
  length: number;
  angle: number; // in degrees
  fade: number; // 0-1
}

export const LongShadowPass: React.FC<LongShadowPassProps> = ({
  text,
  x,
  baselineY,
  font,
  textColor,
  shadowColor,
  length,
  angle,
  fade,
}) => {
  // Convert angle to radians
  const angleRad = (angle * Math.PI) / 180;

  // Calculate number of shadow layers (limit for performance)
  const steps = Math.min(15, Math.max(3, Math.round(length / 6)));

  // Calculate step offsets (limit shadow length to reasonable bounds)
  const maxLength = Math.min(length, 60); // Cap at 60px
  const stepX = (Math.cos(angleRad) * maxLength) / steps;
  const stepY = (Math.sin(angleRad) * maxLength) / steps;

  const baseOpacity = 0.7;

  return (
    <Group>
      {/* Shadow layers */}
      {Array.from({ length: steps }).map((_, index) => {
        const opacity = baseOpacity * Math.pow(1 - fade, index);
        const offsetX = stepX * (index + 1);
        const offsetY = stepY * (index + 1);

        return (
          <SkText
            key={index}
            text={text}
            x={x + offsetX}
            y={baselineY + offsetY}
            font={font}
            color={shadowColor}
            opacity={opacity}
          />
        );
      })}

      {/* Main text */}
      <SkText text={text} x={x} y={baselineY} font={font} color={textColor} />
    </Group>
  );
};
