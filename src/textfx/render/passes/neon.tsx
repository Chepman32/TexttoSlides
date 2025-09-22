import React from 'react';
import {
  Group,
  Text as SkText,
  BlurMask,
  type SkFont,
} from '@shopify/react-native-skia';

interface NeonPassProps {
  text: string;
  x: number;
  baselineY: number;
  font: SkFont;
  innerColor: string;
  glowColor: string;
  glowRadius: number;
  strokeWidth: number;
  strokeColor: string;
}

export const NeonPass: React.FC<NeonPassProps> = ({
  text,
  x,
  baselineY,
  font,
  innerColor,
  glowColor,
  glowRadius,
  strokeWidth,
  strokeColor,
}) => {
  return (
    <Group>
      {/* Outer glow: largest blur */}
      <Group>
        <BlurMask blur={glowRadius * 1.5} style="outer" />
        <SkText text={text} x={x} y={baselineY} font={font} color={glowColor} />
      </Group>

      {/* Middle glow: medium blur */}
      <Group>
        <BlurMask blur={glowRadius} style="outer" />
        <SkText text={text} x={x} y={baselineY} font={font} color={glowColor} />
      </Group>

      {/* Inner glow: small blur */}
      <Group>
        <BlurMask blur={glowRadius * 0.5} style="outer" />
        <SkText text={text} x={x} y={baselineY} font={font} color={glowColor} />
      </Group>

      {/* Core text */}
      <SkText text={text} x={x} y={baselineY} font={font} color={innerColor} />
    </Group>
  );
};
