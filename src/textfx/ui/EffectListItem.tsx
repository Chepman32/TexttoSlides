import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getEffectDisplayName } from '../registry';
import type { EffectInstance } from '../types';

interface EffectListItemProps {
  effect: EffectInstance;
  isSelected?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export const EffectListItem: React.FC<EffectListItemProps> = ({
  effect,
  isSelected = false,
  onToggle,
  onEdit,
  onRemove,
}) => {
  const displayName = getEffectDisplayName(effect.id);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          effect.enabled && styles.toggleButtonEnabled,
        ]}
        onPress={onToggle}
      >
        <Text
          style={[
            styles.toggleText,
            effect.enabled && styles.toggleTextEnabled,
          ]}
        >
          {effect.enabled ? 'On' : 'Off'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.content} onPress={onEdit}>
        <Text style={styles.name}>{displayName}</Text>
        {isSelected && <Text style={styles.editingBadge}>Editing</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  containerSelected: {
    backgroundColor: 'rgba(0,255,204,0.12)',
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonEnabled: {
    backgroundColor: 'rgba(0,255,204,0.2)',
    borderColor: 'rgba(0,255,204,0.8)',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  toggleTextEnabled: {
    color: '#00FFCC',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editingBadge: {
    color: '#00FFCC',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
