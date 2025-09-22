import React from 'react';
import { Canvas, Group, useCanvasRef } from '@shopify/react-native-skia';
import type { EffectInstance } from '../types';
import { NeonPass } from './passes/neon';
import { SoftShadowPass } from './passes/softShadow';
import { LongShadowPass } from './passes/longShadow';
import { BloomPass } from './passes/bloom';

export interface TextRenderProps {
  text: string;
  x: number;
  baselineY: number;
  font: import('@shopify/react-native-skia').SkFont;
  width: number;
  height: number;
  effects: EffectInstance[];
  textColor?: string;
  background?: string;
}

export const EffectPipeline = React.forwardRef<
  { snapshot: () => any },
  TextRenderProps
>(function EffectPipeline(
  {
    text,
    x,
    baselineY,
    font,
    width,
    height,
    effects,
    textColor = '#FFFFFF',
    background,
  },
  ref,
) {
  const canvasRef = useCanvasRef();

  React.useImperativeHandle(ref, () => ({
    snapshot: () => canvasRef.current?.makeImageSnapshot(),
  }));

  return (
    <Canvas
      ref={canvasRef}
      style={{ width, height, backgroundColor: 'transparent' }}
    >
      <Group>
        {effects.map(e => {
          if (!e.enabled) return null;

          switch (e.id) {
            case 'neon':
              return (
                <NeonPass
                  key="neon"
                  text={text}
                  x={x}
                  baselineY={baselineY}
                  font={font}
                  innerColor={String(e.values.innerColor)}
                  glowColor={String(e.values.glowColor)}
                  glowRadius={Number(e.values.glowRadius)}
                  strokeWidth={Number(e.values.strokeWidth)}
                  strokeColor={String(e.values.strokeColor)}
                />
              );
            case 'softShadow':
              return (
                <SoftShadowPass
                  key="softShadow"
                  text={text}
                  x={x}
                  baselineY={baselineY}
                  font={font}
                  textColor={textColor}
                  shadowColor={String(e.values.shadowColor)}
                  offsetX={Number(e.values.offsetX)}
                  offsetY={Number(e.values.offsetY)}
                  blur={Number(e.values.blur)}
                />
              );
            case 'longShadow':
              return (
                <LongShadowPass
                  key="longShadow"
                  text={text}
                  x={x}
                  baselineY={baselineY}
                  font={font}
                  textColor={textColor}
                  shadowColor={String(e.values.shadowColor)}
                  length={Number(e.values.length)}
                  angle={Number(e.values.angle)}
                  fade={Number(e.values.fade)}
                />
              );
            case 'bloom':
              return (
                <BloomPass
                  key="bloom"
                  text={text}
                  x={x}
                  baselineY={baselineY}
                  font={font}
                  textColor={textColor}
                  threshold={Number(e.values.threshold)}
                  radius={Number(e.values.radius)}
                  intensity={Number(e.values.intensity)}
                />
              );
            default:
              return null;
          }
        })}
      </Group>
    </Canvas>
  );
});
