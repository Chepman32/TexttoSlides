import { TextStyle } from 'react-native';
import { TextEffectInstance } from '../constants/textEffects';

export interface TextEffectStyles {
  textStyle: TextStyle;
  shadowStyle?: TextStyle;
  glowStyle?: TextStyle;
}

/**
 * Converts text effects into React Native TextStyle objects
 */
export const renderTextEffects = (effects: TextEffectInstance[]): TextEffectStyles => {
  let baseStyle: TextStyle = {};
  let shadowStyle: TextStyle = {};
  let glowStyle: TextStyle = {};

  effects.forEach(effect => {
    if (!effect.enabled) return;

    switch (effect.type) {
      case 'neonGlow':
        const glowColor = effect.parameters.glowColor || '#00FFFF';
        const intensity = effect.parameters.intensity || 0.8;

        baseStyle = {
          ...baseStyle,
          textShadowColor: glowColor,
          textShadowRadius: 8 * intensity,
          textShadowOffset: { width: 0, height: 0 },
        };

        // Create a glow effect with multiple shadows (simulated)
        glowStyle = {
          position: 'absolute',
          textShadowColor: glowColor,
          textShadowRadius: 16 * intensity,
          textShadowOffset: { width: 0, height: 0 },
        };
        break;

      case 'longShadow':
        const length = effect.parameters.length || 24;
        const angle = effect.parameters.angle || 135;
        const shadowColor = effect.parameters.shadowColor || 'rgba(0,0,0,0.3)';

        // Convert angle to x,y offset
        const radians = (angle * Math.PI) / 180;
        const offsetX = Math.cos(radians) * (length / 4);
        const offsetY = Math.sin(radians) * (length / 4);

        baseStyle = {
          ...baseStyle,
          textShadowColor: shadowColor,
          textShadowRadius: 2,
          textShadowOffset: { width: offsetX, height: offsetY },
        };

        // Long shadow effect with multiple layers (simulated with single shadow)
        shadowStyle = {
          position: 'absolute',
          textShadowColor: shadowColor,
          textShadowRadius: length / 8,
          textShadowOffset: { width: offsetX * 2, height: offsetY * 2 },
        };
        break;

      case 'softShadow':
        const softShadowColor = effect.parameters.shadowColor || 'rgba(0,0,0,0.6)';
        const offset = effect.parameters.offset || { x: 2, y: 2 };
        const blur = effect.parameters.blur || 4;

        baseStyle = {
          ...baseStyle,
          textShadowColor: softShadowColor,
          textShadowRadius: blur,
          textShadowOffset: { width: offset.x, height: offset.y },
        };
        break;

      case 'bloom':
        const bloomColor = effect.parameters.color || '#FFFFFF';
        const bloomRadius = effect.parameters.radius || 16;
        const bloomIntensity = effect.parameters.intensity || 0.8;

        baseStyle = {
          ...baseStyle,
          textShadowColor: bloomColor,
          textShadowRadius: bloomRadius * bloomIntensity,
          textShadowOffset: { width: 0, height: 0 },
        };

        glowStyle = {
          position: 'absolute',
          textShadowColor: bloomColor,
          textShadowRadius: bloomRadius * bloomIntensity * 1.5,
          textShadowOffset: { width: 0, height: 0 },
        };
        break;

      case 'letterpress':
        // Letterpress effect with inset shadow
        baseStyle = {
          ...baseStyle,
          textShadowColor: 'rgba(255,255,255,0.8)',
          textShadowRadius: 1,
          textShadowOffset: { width: 0, height: 1 },
        };
        break;

      default:
        break;
    }
  });

  return {
    textStyle: baseStyle,
    shadowStyle: Object.keys(shadowStyle).length > 0 ? shadowStyle : undefined,
    glowStyle: Object.keys(glowStyle).length > 0 ? glowStyle : undefined,
  };
};

/**
 * Check if any effect needs multiple text layers
 */
export const needsMultipleLayers = (effects: TextEffectInstance[]): boolean => {
  return effects.some(effect =>
    effect.enabled && ['neonGlow', 'longShadow', 'bloom'].includes(effect.type)
  );
};