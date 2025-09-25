import { CompositionState } from '../types/composer';
import { createTextEffectInstance } from './textEffects';

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: {
    backgroundColor: string;
    accentColor: string;
    layout: 'side' | 'vertical' | 'stacked' | 'slider';
    hasFrame: boolean;
  };
  composition: Partial<CompositionState>;
}

export const defaultTemplates: Template[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design',
    preview: {
      backgroundColor: '#FFFFFF',
      accentColor: '#2563EB',
      layout: 'side',
      hasFrame: false,
    },
    composition: {
      layout: 'side',
      spacing: 12,
      cornerRadius: 8,
      aspect: 'free',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 16,
        fontWeight: 'Bold',
        color: '#000000',
        position: 'bl',
        margin: 12,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'solid',
        colors: ['#FFFFFF'],
      },
      frame: {
        on: false,
        thickness: 2,
        color: '#E5E7EB',
      },
      watermarkOn: true,
    },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated with frames',
    preview: {
      backgroundColor: '#F8FAFC',
      accentColor: '#7C3AED',
      layout: 'side',
      hasFrame: true,
    },
    composition: {
      layout: 'side',
      spacing: 20,
      cornerRadius: 16,
      aspect: '1:1',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 18,
        fontWeight: 'Bold',
        color: '#1F2937',
        position: 'tc',
        margin: 20,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'solid',
        colors: ['#F8FAFC'],
      },
      frame: {
        on: true,
        thickness: 3,
        color: '#7C3AED',
      },
      watermarkOn: true,
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High contrast and striking',
    preview: {
      backgroundColor: '#111827',
      accentColor: '#F59E0B',
      layout: 'vertical',
      hasFrame: true,
    },
    composition: {
      layout: 'vertical',
      spacing: 16,
      cornerRadius: 12,
      aspect: '4:3',
      labels: {
        textBefore: 'BEFORE',
        textAfter: 'AFTER',
        fontFamily: 'System',
        fontSize: 20,
        fontWeight: 'Bold',
        color: '#F59E0B',
        position: 'tc',
        margin: 16,
        show: true,
        textEffects: [createTextEffectInstance('longShadow')],
      },
      background: {
        type: 'solid',
        colors: ['#111827'],
      },
      frame: {
        on: true,
        thickness: 4,
        color: '#F59E0B',
      },
      watermarkOn: true,
    },
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional before/after',
    preview: {
      backgroundColor: '#FFFFFF',
      accentColor: '#059669',
      layout: 'stacked',
      hasFrame: false,
    },
    composition: {
      layout: 'stacked',
      spacing: 8,
      cornerRadius: 8,
      aspect: '16:9',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 16,
        fontWeight: 'Bold',
        color: '#FFFFFF',
        position: 'bl',
        margin: 12,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'solid',
        colors: ['#FFFFFF'],
      },
      frame: {
        on: false,
        thickness: 2,
        color: '#E5E7EB',
      },
      watermarkOn: true,
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary gradient design',
    preview: {
      backgroundColor: '#EDE9FE',
      accentColor: '#8B5CF6',
      layout: 'side',
      hasFrame: false,
    },
    composition: {
      layout: 'side',
      spacing: 16,
      cornerRadius: 20,
      aspect: '1:1',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 18,
        fontWeight: 'Bold',
        color: '#8B5CF6',
        position: 'bc',
        margin: 16,
        show: true,
        textEffects: [createTextEffectInstance('neonGlow')],
      },
      background: {
        type: 'gradient',
        colors: ['#EDE9FE', '#DDD6FE'],
        direction: 'diagonal',
      },
      frame: {
        on: false,
        thickness: 2,
        color: '#8B5CF6',
      },
      watermarkOn: true,
    },
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Perfect for social media',
    preview: {
      backgroundColor: '#FAFAFA',
      accentColor: '#E1306C',
      layout: 'vertical',
      hasFrame: false,
    },
    composition: {
      layout: 'vertical',
      spacing: 8,
      cornerRadius: 12,
      aspect: '1:1',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 16,
        fontWeight: 'Bold',
        color: '#262626',
        position: 'tl',
        margin: 12,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'solid',
        colors: ['#FAFAFA'],
      },
      frame: {
        on: false,
        thickness: 1,
        color: '#DBDBDB',
      },
      watermarkOn: true,
    },
  },
];

// Function to apply template to current composition
export const applyTemplate = (
  currentComposition: CompositionState,
  template: Template
): CompositionState => {
  return {
    ...currentComposition,
    ...template.composition,
    // Preserve the actual images
    photoAUri: currentComposition.photoAUri,
    photoBUri: currentComposition.photoBUri,
    // Merge labels to preserve custom text if user has set it
    labels: {
      ...template.composition.labels,
      textBefore: currentComposition.labels.textBefore || template.composition.labels?.textBefore || 'Before',
      textAfter: currentComposition.labels.textAfter || template.composition.labels?.textAfter || 'After',
      textEffects: template.composition.labels?.textEffects || [],
    },
  };
};