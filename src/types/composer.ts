import { TextEffectInstance } from '../constants/textEffects';

export type LayoutType =
  | 'side'
  | 'vertical'
  | 'slider'
  | 'stacked'
  | 'diagonal'
  | 'polaroid'
  | 'deviceMockup'
  | 'diagonalStacked';

export interface LabelStyle {
  textBefore: string;
  textAfter: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'Regular' | 'Medium' | 'Bold';
  color: string;
  backgroundColor?: string; // Background color for labels (transparent if not set)
  stroke?: {
    width: number;
    color: string;
  };
  textEffects?: TextEffectInstance[];
  position: 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'belowCenter';
  margin: number;
  show: boolean;
}

export interface BackgroundConfig {
  type: 'transparent' | 'solid' | 'gradient';
  colors: string[];
  angle?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
}

export interface FrameConfig {
  on: boolean;
  thickness: number;
  color: string;
  padding: number;
}

export interface ImageOffset {
  x: number;
  y: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export type ImageFilterType = 'none' | 'sepia' | 'vintage' | 'grayscale';

export interface ImageFilterConfig {
  type: ImageFilterType;
  intensity?: number; // 0-1, for future use
  customMatrix?: number[]; // Allow custom 20-value matrices
}

export interface ImageFiltersConfig {
  photoA?: ImageFilterConfig; // Filter for Before image
  photoB?: ImageFilterConfig; // Filter for After image
}

export interface CompositionState {
  photoAUri?: string;
  photoBUri?: string;
  photoAOffset?: ImageOffset; // Pan offset for image A
  photoBOffset?: ImageOffset; // Pan offset for image B
  photoADimensions?: ImageDimensions; // Original dimensions of image A
  photoBDimensions?: ImageDimensions; // Original dimensions of image B
  layout: LayoutType;
  spacing: number;
  cornerRadius: number;
  aspect: 'free' | '1:1' | '3:2' | '4:3' | '16:9';
  labels: LabelStyle;
  background: BackgroundConfig;
  frame?: FrameConfig;
  watermarkOn: boolean;
  sliderPosition?: number; // 0-1, position of slider divider (0.5 = middle)
  imageFilters?: ImageFiltersConfig;
}

export interface Template {
  id: string;
  name: string;
  category: 'featured' | 'minimal' | 'framed' | 'social';
  isPro: boolean;
  thumbnail?: string;
  composition: Partial<CompositionState>;
}

export interface ExportConfig {
  width: number;
  height: number;
  format: 'png' | 'jpg';
  quality?: number;
}

export interface UndoRedoState {
  past: CompositionState[];
  present: CompositionState;
  future: CompositionState[];
}
