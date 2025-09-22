import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFont } from '@shopify/react-native-skia';
import { EffectPipeline } from '../render/pipeline';
import type { EffectInstance } from '../types';

interface TextEffectsRendererProps {
  text: string;
  fontSize: number;
  effects: EffectInstance[];
  width: number;
  height: number;
  onSnapshot?: (snapshot: any) => void;
}

export const TextEffectsRenderer: React.FC<TextEffectsRendererProps> = ({
  text,
  fontSize,
  effects,
  width,
  height,
  onSnapshot,
}) => {
  const pipelineRef = useRef<{ snapshot: () => any }>(null);

  // Load font based on fontSize
  const font = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Bold.ttf'),
    fontSize,
  );

  React.useEffect(() => {
    if (onSnapshot && pipelineRef.current) {
      const snapshot = pipelineRef.current.snapshot();
      onSnapshot(snapshot);
    }
  }, [text, fontSize, effects, onSnapshot]);

  if (!font) {
    return <View style={[styles.container, { width, height }]} />;
  }

  // Calculate text positioning
  const x = 20; // Left padding
  const baselineY = fontSize + 20; // Top padding + font size

  return (
    <View style={[styles.container, { width, height }]}>
      <EffectPipeline
        ref={pipelineRef}
        text={text}
        x={x}
        baselineY={baselineY}
        font={font}
        width={width}
        height={height}
        effects={effects}
        background="#000000"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
