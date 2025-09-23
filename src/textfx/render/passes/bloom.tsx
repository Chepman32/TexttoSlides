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
  const safeRadius = Math.min(radius, 32);
  const safeIntensity = Math.max(0.3, Math.min(1, intensity));

  // Generate vibrant bloom colors based on the text color
  const bloomColors = [
    '#FF6B35', // Orange
    '#F7931E', // Yellow-orange
    '#FF1493', // Deep pink
    '#00BFFF', // Deep sky blue
    '#32CD32', // Lime green
  ];

  return (
    <Group>
      {/* Outermost bloom layer - largest and most diffuse */}
      <Group>
        <BlurMask blur={safeRadius * 2} style="outer" />
        <SkText
          text={text}
          x={x}
          y={baselineY}
          font={font}
          color={bloomColors[0]} // Orange
          opacity={safeIntensity * 0.3}
        />
      </Group>

      {/* Second bloom layer - pink/magenta */}
      <Group>
        <BlurMask blur={safeRadius * 1.5} style="outer" />
        <SkText
          text={text}
          x={x}
          y={baselineY}
          font={font}
          color={bloomColors[2]} // Deep pink
          opacity={safeIntensity * 0.4}
        />
      </Group>

      {/* Third bloom layer - blue/cyan */}
      <Group>
        <BlurMask blur={safeRadius * 1.2} style="outer" />
        <SkText
          text={text}
          x={x}
          y={baselineY}
          font={font}
          color={bloomColors[3]} // Deep sky blue
          opacity={safeIntensity * 0.5}
        />
      </Group>

      {/* Inner bloom layer - warm orange */}
      <Group>
        <BlurMask blur={safeRadius * 0.8} style="outer" />
        <SkText
          text={text}
          x={x}
          y={baselineY}
          font={font}
          color={bloomColors[1]} // Yellow-orange
          opacity={safeIntensity * 0.6}
        />
      </Group>

      {/* Core text with slight glow */}
      <Group>
        <BlurMask blur={safeRadius * 0.3} style="outer" />
        <SkText
          text={text}
          x={x}
          y={baselineY}
          font={font}
          color="#FFFFFF"
          opacity={0.9}
        />
      </Group>

      {/* Final sharp text on top */}
      <SkText
        text={text}
        x={x}
        y={baselineY}
        font={font}
        color="#FFFFFF"
        opacity={1}
      />
    </Group>
  );
};
