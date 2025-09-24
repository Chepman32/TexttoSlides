export type LayoutType = 'side' | 'vertical' | 'slider' | 'stacked';

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
  shadow?: {
    dx: number;
    dy: number;
    blur: number;
    color: string;
  };
  position: 'tl' | 'tr' | 'bl' | 'br';
  margin: number;
  show: boolean;
}

export interface BackgroundConfig {
  type: 'transparent' | 'solid' | 'gradient';
  colors: string[];
  angle?: number;
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
  shadow: 'none' | 'low' | 'med' | 'high';
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