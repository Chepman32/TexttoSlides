import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useFont } from '@shopify/react-native-skia';
import { EffectPipeline } from '../render/pipeline';
import { exportCanvasToPng } from '../export/exportImage';
import type { EffectInstance } from '../types';

export const NeonDemo: React.FC = () => {
  const pipelineRef = useRef<{ snapshot: () => any }>(null);

  // Load a font from available assets
  const font = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Bold.ttf'),
    48,
  );

  const neonEffect: EffectInstance = {
    id: 'neon',
    enabled: true,
    values: {
      innerColor: '#FFFFFF',
      glowColor: '#00E5FF',
      glowRadius: 18,
      strokeWidth: 2,
      strokeColor: '#7DF9FF',
    },
  };

  const handleExport = async () => {
    try {
      const path = await exportCanvasToPng(pipelineRef, '/tmp/neon-test');
      Alert.alert('Success', `Exported to: ${path}`);
    } catch (error) {
      Alert.alert('Error', `Export failed: ${error}`);
    }
  };

  if (!font) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading font...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <EffectPipeline
          ref={pipelineRef}
          text="NEON GLOW"
          x={50}
          baselineY={100}
          font={font}
          width={300}
          height={200}
          effects={[neonEffect]}
          background="#000000"
        />
      </View>

      <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
        <Text style={styles.exportButtonText}>Export PNG</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  canvasContainer: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  exportButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00E5FF',
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
