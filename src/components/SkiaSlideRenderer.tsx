/**
 * Skia-based Slide Renderer Component
 * Provides advanced graphics rendering for slides using React Native Skia
 */

import React from 'react';
import { View, Text, Platform, Dimensions } from 'react-native';
import GraphicsService from '../services/GraphicsService';
import type { SlideFontId } from '../constants/fonts';
import {
  DEFAULT_SLIDE_FONT_ID,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  LEGACY_SYSTEM_FONT_ID,
} from '../constants/fonts';

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
    fontFamily?: string;
    fontId?: SlideFontId;
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
  const platformKey = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'default';
  const legacyFontId = slide.fontId === LEGACY_SYSTEM_FONT_ID
    ? DEFAULT_SLIDE_FONT_ID
    : slide.fontId;
  const fontOption = legacyFontId
    ? getSlideFontById(legacyFontId)
    : getSlideFontByFamily(slide.fontFamily);
  const resolvedFontFamily = resolveFontFamilyForPlatform(fontOption, platformKey);

  // For now, render a simple fallback until Skia is properly configured
  return (
    <View style={{ width: slideSize, height: slideSize, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ 
        fontSize: slide.fontSize, 
        color: slide.color, 
        textAlign: slide.textAlign,
        fontWeight: resolvedFontFamily ? undefined : slide.fontWeight,
        fontFamily: resolvedFontFamily,
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
