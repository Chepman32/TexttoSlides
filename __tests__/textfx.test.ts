import { getEffectDisplayName, getEffectSpec } from '../src/textfx/registry';
import type { EffectInstance } from '../src/textfx/types';

describe('Text Effects Registry', () => {
  test('getEffectDisplayName returns name for known effects', () => {
    expect(getEffectDisplayName('neon')).toBe('Neon / Glow');
  });

  test('getEffectDisplayName returns id for unknown effects', () => {
    expect(getEffectDisplayName('unknown-effect')).toBe('unknown-effect');
  });

  test('getEffectDisplayName never returns empty string', () => {
    expect(getEffectDisplayName('')).toBe('');
    expect(getEffectDisplayName('   ')).toBe('   ');
  });

  test('getEffectSpec returns spec for known effects', () => {
    const spec = getEffectSpec('neon');
    expect(spec).toBeDefined();
    expect(spec?.id).toBe('neon');
    expect(spec?.name).toBe('Neon / Glow');
    expect(spec?.params).toHaveLength(5);
  });

  test('getEffectSpec returns undefined for unknown effects', () => {
    expect(getEffectSpec('unknown-effect')).toBeUndefined();
  });
});

describe('Effect Instance Serialization', () => {
  test('effect instance can be serialized and deserialized', () => {
    const effect: EffectInstance = {
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

    const serialized = JSON.stringify(effect);
    const deserialized = JSON.parse(serialized) as EffectInstance;

    expect(deserialized.id).toBe(effect.id);
    expect(deserialized.enabled).toBe(effect.enabled);
    expect(deserialized.values).toEqual(effect.values);
  });
});
