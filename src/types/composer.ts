import { TextEffectInstance } from '../constants/textEffects';

export type LayoutType =
  | 'side'
  | 'vertical'
  | 'slider'
  | 'stacked'
  | 'diagonal'
  | 'polaroid'
  | 'deviceMockup';

export interface LabelStyle {
  textBefore: string;
  textAfter: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'Regular' | 'Medium' | 'Bold';
  color: string;
  stroke?: {
    width: number;
    color: string;
  };
  textEffects?: TextEffectInstance[];
  position: 'tl' | 'tr' | 'bl' | 'br';
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

export interface CompositionState {
  photoAUri?: string;
  photoBUri?: string;
  layout: LayoutType;
  spacing: number;
  cornerRadius: number;
  aspect: 'free' | '1:1' | '3:2' | '4:3' | '16:9';
  labels: LabelStyle;
  background: BackgroundConfig;
  frame?: FrameConfig;
  watermarkOn: boolean;
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
