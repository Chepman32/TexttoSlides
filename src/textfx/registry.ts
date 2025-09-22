import { EffectSpec } from './types';

export const EFFECTS_REGISTRY: Record<string, EffectSpec> = {
  neon: {
    id: 'neon',
    name: 'Neon / Glow',
    params: [
      { key: 'innerColor', type: 'color', default: '#FFFFFF' },
      { key: 'glowColor', type: 'color', default: '#00E5FF' },
      {
        key: 'glowRadius',
        type: 'number',
        min: 1,
        max: 64,
        step: 1,
        default: 18,
        unit: 'px',
      },
      {
        key: 'strokeWidth',
        type: 'number',
        min: 0,
        max: 16,
        step: 0.5,
        default: 2,
        unit: 'px',
      },
      { key: 'strokeColor', type: 'color', default: '#7DF9FF' },
    ],
  },
  softShadow: {
    id: 'softShadow',
    name: 'Soft Shadow',
    params: [
      { key: 'shadowColor', type: 'color', default: 'rgba(0,0,0,0.6)' },
      {
        key: 'offsetX',
        type: 'number',
        min: -50,
        max: 50,
        step: 1,
        default: 8,
        unit: 'px',
      },
      {
        key: 'offsetY',
        type: 'number',
        min: -50,
        max: 50,
        step: 1,
        default: 12,
        unit: 'px',
      },
      {
        key: 'blur',
        type: 'number',
        min: 0,
        max: 40,
        step: 1,
        default: 18,
        unit: 'px',
      },
    ],
  },
  longShadow: {
    id: 'longShadow',
    name: 'Long Shadow',
    params: [
      { key: 'shadowColor', type: 'color', default: 'rgba(0,0,0,0.7)' },
      {
        key: 'length',
        type: 'number',
        min: 4,
        max: 120,
        step: 4,
        default: 24,
        unit: 'px',
      },
      {
        key: 'angle',
        type: 'number',
        min: 0,
        max: 360,
        step: 5,
        default: 135,
        unit: '°',
      },
      {
        key: 'fade',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.6,
      },
    ],
  },
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    params: [
      {
        key: 'threshold',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.6,
      },
      {
        key: 'radius',
        type: 'number',
        min: 0,
        max: 50,
        step: 1,
        default: 16,
        unit: 'px',
      },
      {
        key: 'intensity',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.75,
      },
    ],
  },
};

export function getEffectDisplayName(id: string): string {
  return EFFECTS_REGISTRY[id]?.name || id; // never empty
}

export function getEffectSpec(id: string): EffectSpec | undefined {
  return EFFECTS_REGISTRY[id];
}
