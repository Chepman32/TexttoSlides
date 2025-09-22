import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TextEffectsRenderer } from '../textfx/integration/TextEffectsRenderer';
import { EffectListItem } from '../textfx/ui/EffectListItem';
import { getEffectSpec } from '../textfx/registry';
import type { EffectInstance } from '../textfx/types';

const TextEffectsTestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [effects, setEffects] = useState<EffectInstance[]>([
    {
      id: 'neon',
      enabled: true,
      values: {
        innerColor: '#FFFFFF',
        glowColor: '#00E5FF',
        glowRadius: 18,
        strokeWidth: 2,
        strokeColor: '#7DF9FF',
      },
    },
  ]);

  const [selectedEffectIndex, setSelectedEffectIndex] = useState<number | null>(
    null,
  );

  const handleToggleEffect = (index: number) => {
    setEffects(prev =>
      prev.map((effect, i) =>
        i === index ? { ...effect, enabled: !effect.enabled } : effect,
      ),
    );
  };

  const handleEditEffect = (index: number) => {
    setSelectedEffectIndex(selectedEffectIndex === index ? null : index);
  };

  const handleRemoveEffect = (index: number) => {
    setEffects(prev => prev.filter((_, i) => i !== index));
    if (selectedEffectIndex === index) {
      setSelectedEffectIndex(null);
    }
  };

  const handleAddNeonEffect = () => {
    const newEffect: EffectInstance = {
      id: 'neon',
      enabled: true,
      values: {
        innerColor: '#FFFFFF',
        glowColor: '#FF00FF',
        glowRadius: 24,
        strokeWidth: 3,
        strokeColor: '#FF69B4',
      },
    };
    setEffects(prev => [...prev, newEffect]);
  };

  const handleParameterChange = (index: number, key: string, value: any) => {
    setEffects(prev =>
      prev.map((effect, i) =>
        i === index
          ? { ...effect, values: { ...effect.values, [key]: value } }
          : effect,
      ),
    );
  };

  const selectedEffect =
    selectedEffectIndex !== null ? effects[selectedEffectIndex] : null;
  const selectedSpec = selectedEffect ? getEffectSpec(selectedEffect.id) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Text Effects Test</Text>
      </View>

      {/* Renderer */}
      <View style={styles.rendererContainer}>
        <TextEffectsRenderer
          text="NEON GLOW"
          fontSize={32}
          effects={effects}
          width={350}
          height={120}
        />
      </View>

      {/* Controls */}
      <ScrollView style={styles.controlsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Effects</Text>
          {effects.length === 0 ? (
            <Text style={styles.emptyText}>No effects applied</Text>
          ) : (
            effects.map((effect, index) => (
              <EffectListItem
                key={index}
                effect={effect}
                isSelected={selectedEffectIndex === index}
                onToggle={() => handleToggleEffect(index)}
                onEdit={() => handleEditEffect(index)}
                onRemove={() => handleRemoveEffect(index)}
              />
            ))
          )}
        </View>

        {/* Parameter Editor */}
        {selectedEffect && selectedSpec && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit {selectedSpec.name}</Text>
            {selectedSpec.params.map(param => (
              <View key={param.key} style={styles.paramRow}>
                <Text style={styles.paramLabel}>{param.key}</Text>
                {param.type === 'number' && (
                  <View style={styles.numberControls}>
                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => {
                        const currentValue =
                          Number(selectedEffect.values[param.key]) ||
                          param.default;
                        const newValue = Math.max(
                          param.min,
                          currentValue - (param.step || 1),
                        );
                        handleParameterChange(
                          selectedEffectIndex!,
                          param.key,
                          newValue,
                        );
                      }}
                    >
                      <Text style={styles.adjustButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.paramValue}>
                      {selectedEffect.values[param.key] || param.default}
                    </Text>
                    <TouchableOpacity
                      style={styles.adjustButton}
                      onPress={() => {
                        const currentValue =
                          Number(selectedEffect.values[param.key]) ||
                          param.default;
                        const newValue = Math.min(
                          param.max,
                          currentValue + (param.step || 1),
                        );
                        handleParameterChange(
                          selectedEffectIndex!,
                          param.key,
                          newValue,
                        );
                      }}
                    >
                      <Text style={styles.adjustButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Add Effect Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNeonEffect}
        >
          <Text style={styles.addButtonText}>Add Neon Effect</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },
  rendererContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111111',
  },
  controlsContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paramLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  paramValue: {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 60,
    textAlign: 'center',
  },
  numberControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TextEffectsTestScreen;
