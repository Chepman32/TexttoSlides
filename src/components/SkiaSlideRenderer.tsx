/**
 * Skia-based Slide Renderer Component
 * Provides advanced graphics rendering for slides using React Native Skia
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Dimensions } from 'react-native';
import GraphicsService from '../services/GraphicsService';

interface SkiaSlideRendererProps {
  slide: {
    id: number;
    text: string;
    image?: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    backgroundColor: string;
    textAlign: 'left' | 'center' | 'right';
    fontWeight: 'normal' | 'bold';
  };
  width?: number;
  height?: number;
  styleName?: string;
}

const SkiaSlideRenderer: React.FC<SkiaSlideRendererProps> = ({
  slide,
  width = 350,
  height = 350,
  styleName = 'modern',
}) => {
  const graphicsService = GraphicsService.getInstance();
  const { width: screenWidth } = Dimensions.get('window');
  const slideSize = Math.min(screenWidth - 40, width);

  // For now, render a simple fallback until Skia is properly configured
  return (
    <View style={{ width: slideSize, height: slideSize, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ 
        fontSize: slide.fontSize, 
        color: slide.color, 
        textAlign: slide.textAlign,
        fontWeight: slide.fontWeight,
        backgroundColor: slide.backgroundColor,
        padding: 10,
        borderRadius: 5,
      }}>
        {slide.text}
      </Text>
    </View>
  );
};

export default SkiaSlideRenderer;
