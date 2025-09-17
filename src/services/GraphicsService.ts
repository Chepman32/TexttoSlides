/**
 * Advanced Graphics Service using React Native Skia
 * Provides advanced graphics rendering capabilities for slides
 */

import { Skia, SkiaView, useDrawCallback } from '@shopify/react-native-skia';
import { Dimensions } from 'react-native';

export interface GraphicsOptions {
  width: number;
  height: number;
  backgroundColor?: string;
  gradient?: {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  blur?: number;
  shadow?: {
    color: string;
    offset: { x: number; y: number };
    blur: number;
  };
}

export interface TextGraphicsOptions {
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: number;
  lineHeight?: number;
  shadow?: {
    color: string;
    offset: { x: number; y: number };
    blur: number;
  };
  stroke?: {
    color: string;
    width: number;
  };
}

class GraphicsService {
  private static instance: GraphicsService;

  public static getInstance(): GraphicsService {
    if (!GraphicsService.instance) {
      GraphicsService.instance = new GraphicsService();
    }
    return GraphicsService.instance;
  }

  /**
   * Create a Skia canvas for advanced graphics
   */
  public createCanvas(options: GraphicsOptions) {
    const { width, height, backgroundColor = '#FFFFFF' } = options;
    
    return {
      width,
      height,
      backgroundColor,
      ...options,
    };
  }

  /**
   * Generate gradient background
   */
  public createGradientBackground(options: GraphicsOptions) {
    const { width, height, gradient } = options;
    
    if (!gradient) {
      return null;
    }

    // This would be implemented with Skia's gradient shader
    // For now, we'll return the configuration
    return {
      type: 'gradient',
      colors: gradient.colors,
      start: gradient.start,
      end: gradient.end,
      width,
      height,
    };
  }

  /**
   * Create text with advanced styling
   */
  public createStyledText(options: TextGraphicsOptions) {
    const {
      text,
      position,
      fontSize,
      color,
      fontFamily = 'System',
      fontWeight = 'normal',
      textAlign = 'center',
      maxWidth,
      lineHeight = fontSize * 1.2,
      shadow,
      stroke,
    } = options;

    return {
      text,
      position,
      fontSize,
      color,
      fontFamily,
      fontWeight,
      textAlign,
      maxWidth,
      lineHeight,
      shadow,
      stroke,
    };
  }

  /**
   * Apply blur effect
   */
  public applyBlur(blurRadius: number) {
    return {
      type: 'blur',
      radius: blurRadius,
    };
  }

  /**
   * Apply shadow effect
   */
  public applyShadow(shadowOptions: {
    color: string;
    offset: { x: number; y: number };
    blur: number;
  }) {
    return {
      type: 'shadow',
      ...shadowOptions,
    };
  }

  /**
   * Create a slide with advanced graphics
   */
  public createAdvancedSlide(options: {
    width: number;
    height: number;
    backgroundImage?: string;
    backgroundGradient?: {
      colors: string[];
      start: { x: number; y: number };
      end: { x: number; y: number };
    };
    text: TextGraphicsOptions;
    effects?: {
      blur?: number;
      shadow?: {
        color: string;
        offset: { x: number; y: number };
        blur: number;
      };
    };
  }) {
    const { width, height, text, effects } = options;

    return {
      width,
      height,
      backgroundImage: options.backgroundImage,
      backgroundGradient: options.backgroundGradient,
      text: this.createStyledText(text),
      effects: effects || {},
    };
  }

  /**
   * Generate predefined graphic styles
   */
  public getPredefinedStyles() {
    return {
      modern: {
        backgroundGradient: {
          colors: ['#667eea', '#764ba2'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        },
        textShadow: {
          color: 'rgba(0,0,0,0.3)',
          offset: { x: 2, y: 2 },
          blur: 4,
        },
      },
      elegant: {
        backgroundGradient: {
          colors: ['#f093fb', '#f5576c'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        },
        textShadow: {
          color: 'rgba(255,255,255,0.3)',
          offset: { x: 1, y: 1 },
          blur: 3,
        },
      },
      minimal: {
        backgroundColor: '#FFFFFF',
        textStroke: {
          color: '#000000',
          width: 1,
        },
      },
      dramatic: {
        backgroundGradient: {
          colors: ['#2C3E50', '#34495E'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        },
        textShadow: {
          color: 'rgba(0,0,0,0.8)',
          offset: { x: 3, y: 3 },
          blur: 6,
        },
        blur: 0.5,
      },
    };
  }

  /**
   * Apply a predefined style to a slide
   */
  public applyPredefinedStyle(styleName: keyof ReturnType<typeof this.getPredefinedStyles>, slide: any) {
    const styles = this.getPredefinedStyles();
    const style = styles[styleName];

    if (!style) {
      return slide;
    }

    return {
      ...slide,
      ...style,
    };
  }

  /**
   * Create animated graphics (placeholder for future implementation)
   */
  public createAnimatedGraphics(options: {
    duration: number;
    animationType: 'fade' | 'slide' | 'scale' | 'rotate';
    properties: any;
  }) {
    return {
      type: 'animation',
      ...options,
    };
  }

  /**
   * Export graphics to different formats
   */
  public exportGraphics(canvas: any, format: 'png' | 'jpg' | 'svg' = 'png') {
    // This would use Skia's export capabilities
    return {
      format,
      data: null, // Would contain actual image data
    };
  }

  /**
   * Get optimal text positioning for graphics
   */
  public getOptimalTextPosition(options: {
    slideWidth: number;
    slideHeight: number;
    textLength: number;
    hasBackgroundImage: boolean;
    styleName?: string;
  }) {
    const { slideWidth, slideHeight, textLength, hasBackgroundImage, styleName } = options;
    
    let position = { x: slideWidth * 0.1, y: slideHeight * 0.3 };
    let fontSize = 24;
    let color = '#FFFFFF';

    // Adjust based on style
    if (styleName === 'minimal') {
      color = '#000000';
      position = { x: slideWidth * 0.2, y: slideHeight * 0.4 };
    }

    // Adjust based on text length
    if (textLength > 200) {
      fontSize = 18;
      position = { x: slideWidth * 0.1, y: slideHeight * 0.2 };
    } else if (textLength < 50) {
      fontSize = 32;
      position = { x: slideWidth * 0.2, y: slideHeight * 0.4 };
    }

    // Adjust based on background
    if (!hasBackgroundImage && styleName !== 'minimal') {
      color = '#333333';
    }

    return {
      position,
      fontSize,
      color,
    };
  }
}

export default GraphicsService;
