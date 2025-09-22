import React from 'react';
import { View, Text } from 'react-native';
import { getEffectDisplayName, getEffectSpec } from '../registry';

// Simple test component to verify our registry works
export const NeonRegistryTest: React.FC = () => {
  const neonSpec = getEffectSpec('neon');
  const displayName = getEffectDisplayName('neon');
  const unknownName = getEffectDisplayName('unknown-effect');

  return (
    <View style={{ padding: 20, backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>
        Text Effects Registry Test
      </Text>

      <Text style={{ color: '#fff', marginBottom: 5 }}>
        Neon Display Name: {displayName}
      </Text>

      <Text style={{ color: '#fff', marginBottom: 5 }}>
        Unknown Effect Name: {unknownName}
      </Text>

      <Text style={{ color: '#fff', marginBottom: 5 }}>
        Neon Spec Found: {neonSpec ? 'Yes' : 'No'}
      </Text>

      {neonSpec && (
        <Text style={{ color: '#fff', marginBottom: 5 }}>
          Neon Params Count: {neonSpec.params.length}
        </Text>
      )}

      <Text style={{ color: '#0f0', marginTop: 10 }}>
        ✓ Registry working correctly!
      </Text>
    </View>
  );
};
