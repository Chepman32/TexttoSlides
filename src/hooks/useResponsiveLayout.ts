import { useWindowDimensions, Platform } from 'react-native';
import { useMemo } from 'react';

export interface ResponsiveLayout {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isPhone: boolean;
  // Responsive sizing helpers
  horizontalPadding: number;
  maxContentWidth: number;
  cardBorderRadius: number;
  fontSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    title: number;
  };
}

const TABLET_MIN_WIDTH = 768;

export const useResponsiveLayout = (): ResponsiveLayout => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const isTablet = Math.min(width, height) >= TABLET_MIN_WIDTH;
    const isPhone = !isTablet;

    // Responsive padding - more padding on tablets
    const horizontalPadding = isTablet ? 40 : 24;

    // Max content width to prevent overly wide layouts on large iPads
    const maxContentWidth = isTablet ? Math.min(width - 80, 900) : width - 48;

    // Larger border radius on tablets
    const cardBorderRadius = isTablet ? 28 : 20;

    // Responsive font sizes
    const fontSize = {
      small: isTablet ? 14 : 12,
      medium: isTablet ? 18 : 16,
      large: isTablet ? 22 : 18,
      xlarge: isTablet ? 28 : 24,
      title: isTablet ? 38 : 32,
    };

    return {
      width,
      height,
      isLandscape,
      isTablet,
      isPhone,
      horizontalPadding,
      maxContentWidth,
      cardBorderRadius,
      fontSize,
    };
  }, [width, height]);
};

// Helper to get canvas dimensions that work well on all devices
export const useCanvasDimensions = (
  aspectRatio: '1:1' | '9:16' | '16:9' = '1:1',
) => {
  const { width, height, isTablet, isLandscape } = useResponsiveLayout();

  return useMemo(() => {
    const padding = isTablet ? 80 : 32;
    const maxWidth = width - padding;
    const maxHeight = height * 0.6; // Use 60% of screen height max

    let canvasWidth: number;
    let canvasHeight: number;

    switch (aspectRatio) {
      case '1:1':
        canvasWidth = Math.min(maxWidth, maxHeight);
        canvasHeight = canvasWidth;
        break;
      case '9:16':
        canvasHeight = Math.min(maxHeight, maxWidth * (16 / 9));
        canvasWidth = canvasHeight * (9 / 16);
        break;
      case '16:9':
        canvasWidth = Math.min(maxWidth, maxHeight * (16 / 9));
        canvasHeight = canvasWidth * (9 / 16);
        break;
      default:
        canvasWidth = Math.min(maxWidth, maxHeight);
        canvasHeight = canvasWidth;
    }

    // On tablets in landscape, limit canvas size for better UX
    if (isTablet && isLandscape) {
      const maxTabletSize = Math.min(width * 0.5, 600);
      if (canvasWidth > maxTabletSize) {
        const scale = maxTabletSize / canvasWidth;
        canvasWidth *= scale;
        canvasHeight *= scale;
      }
    }

    return {
      canvasWidth: Math.round(canvasWidth),
      canvasHeight: Math.round(canvasHeight),
    };
  }, [width, height, isTablet, isLandscape, aspectRatio]);
};

export default useResponsiveLayout;
