import React from 'react';
import {
  Group,
  Text as SkText,
  BlurMask,
  type SkFont,
} from '@shopify/react-native-skia';

interface SoftShadowPassProps {
  text: string;
  x: number;
  baselineY: number;
  font: SkFont;
  textColor: string;
  shadowColor: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export const SoftShadowPass: React.FC<SoftShadowPassProps> = ({
  text,
  x,
  baselineY,
  font,
  textColor,
  shadowColor,
  offsetX,
  offsetY,
  blur,
}) => {
  return (
    <Group>
      {/* Shadow: blurred and offset */}
      <Group>
        <BlurMask blur={blur} style="outer" />
        <SkText
          text={text}
          x={x + offsetX}
          y={baselineY + offsetY}
          font={font}
          color={shadowColor}
        />
      </Group>

      {/* Main text */}
      <SkText text={text} x={x} y={baselineY} font={font} color={textColor} />
    </Group>
  );
};
