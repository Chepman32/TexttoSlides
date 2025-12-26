import { CompositionState } from '../types/composer';
import { createTextEffectInstance } from './textEffects';

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: {
    backgroundColor: string;
    accentColor: string;
    layout:
      | 'side'
      | 'vertical'
      | 'slider'
      | 'polaroid'
      | 'deviceMockup'
      | 'diagonal';
    hasFrame: boolean;
  };
  composition: Partial<CompositionState>;
}

export const defaultTemplates: Template[] = [
  {
    id: 'side-by-side',
    name: 'Side by Side',
    description: 'Classic horizontal comparison',
    preview: {
      backgroundColor: '#F5F5F5',
      accentColor: '#3B82F6',
      layout: 'side',
      hasFrame: false,
    },
    composition: {
      layout: 'side',
      spacing: 12,
      cornerRadius: 12,
      aspect: 'free',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 18,
        fontWeight: 'Bold',
        color: '#1F2937',
        position: 'bl',
        margin: 12,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'solid',
        colors: ['#F5F5F5'],
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
    id: 'horizontal-split',
    name: 'Horizontal Split',
    description: 'Top and bottom comparison',
    preview: {
      backgroundColor: '#FAFAFA',
      accentColor: '#10B981',
      layout: 'vertical',
      hasFrame: false,
    },
    composition: {
      layout: 'vertical',
      spacing: 12,
      cornerRadius: 12,
      aspect: '4:3',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 18,
        fontWeight: 'Bold',
        color: '#1F2937',
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
        thickness: 2,
        color: '#E5E7EB',
      },
      watermarkOn: true,
    },
  },
  {
    id: 'slider-reveal',
    name: 'Slider Reveal',
    description: 'Interactive slider comparison',
    preview: {
      backgroundColor: '#111827',
      accentColor: '#EC4899',
      layout: 'slider',
      hasFrame: false,
    },
    composition: {
      layout: 'slider',
      spacing: 0,
      cornerRadius: 16,
      aspect: '1:1',
      sliderPosition: 0.5,
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
        colors: ['#111827'],
      },
      frame: {
        on: false,
        thickness: 2,
        color: '#EC4899',
      },
      watermarkOn: true,
    },
  },

  {
    id: 'device-showcase',
    name: 'Device Showcase',
    description: 'Phones with before/after comparison',
    preview: {
      backgroundColor: '#E6E1D8',
      accentColor: '#4C627E',
      layout: 'deviceMockup',
      hasFrame: false,
    },
    composition: {
      layout: 'deviceMockup',
      spacing: 16,
      cornerRadius: 48,
      aspect: '1:1',
      labels: {
        textBefore: 'BEFORE',
        textAfter: 'AFTER',
        fontFamily: 'System',
        fontSize: 14,
        fontWeight: 'Bold',
        color: '#E9EEFF',
        position: 'tl',
        margin: 16,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'gradient',
        colors: ['#E4DED4', '#F0ECE5'],
        direction: 'vertical',
      },
      frame: {
        on: false,
        thickness: 2,
        color: '#FFFFFF',
        padding: 0,
      },
      watermarkOn: false,
    },
  },
  {
    id: 'polaroid-collage',
    name: 'Polaroid Collage',
    description: 'Layered polaroids with tape accents',
    preview: {
      backgroundColor: '#C8C9CE',
      accentColor: '#1F1F1F',
      layout: 'polaroid',
      hasFrame: false,
    },
    composition: {
      layout: 'polaroid',
      spacing: 0,
      cornerRadius: 32,
      aspect: '1:1',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 24,
        fontWeight: 'Bold',
        color: '#FFFFFF',
        position: 'bl',
        margin: 16,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'gradient',
        colors: ['#F2F2F5', '#B7B8BE'],
        direction: 'diagonal',
      },
      frame: {
        on: false,
        thickness: 2,
        color: '#FFFFFF',
      },
      watermarkOn: false,
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
    id: 'diagonal',
    name: 'Diagonal',
    description: 'Split images diagonally',
    preview: {
      backgroundColor: '#1F2937',
      accentColor: '#10B981',
      layout: 'diagonal',
      hasFrame: true,
    },
    composition: {
      layout: 'diagonal',
      spacing: 0,
      cornerRadius: 12,
      aspect: '1:1',
      labels: {
        textBefore: 'BEFORE',
        textAfter: 'AFTER',
        fontFamily: 'System',
        fontSize: 18,
        fontWeight: 'Bold',
        color: '#FFFFFF',
        position: 'bl',
        margin: 16,
        show: true,
        textEffects: [createTextEffectInstance('dropShadow')],
      },
      background: {
        type: 'solid',
        colors: ['#1F2937'],
      },
      frame: {
        on: true,
        thickness: 3,
        color: '#10B981',
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
    id: 'photo-restoration',
    name: 'Photo Restoration',
    description: 'Clean restoration style with labels below images',
    preview: {
      backgroundColor: '#FFFFFF',
      accentColor: '#1F2937',
      layout: 'side',
      hasFrame: false,
    },
    composition: {
      layout: 'side',
      spacing: 24,
      cornerRadius: 0,
      aspect: 'free',
      labels: {
        textBefore: 'Before',
        textAfter: 'After',
        fontFamily: 'System',
        fontSize: 18,
        fontWeight: 'Bold',
        color: '#1F2937',
        position: 'belowCenter',
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
        thickness: 0,
        color: '#E5E7EB',
        padding: 0,
      },
      watermarkOn: false,
    },
  },
];

// Function to apply template to current composition
export const applyTemplate = (
  currentComposition: CompositionState,
  template: Template,
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
      textBefore:
        currentComposition.labels.textBefore ||
        template.composition.labels?.textBefore ||
        'Before',
      textAfter:
        currentComposition.labels.textAfter ||
        template.composition.labels?.textAfter ||
        'After',
      textEffects: template.composition.labels?.textEffects || [],
    },
  };
};
