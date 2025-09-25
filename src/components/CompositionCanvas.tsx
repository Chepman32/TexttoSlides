import React, { useMemo, forwardRef, ReactNode } from 'react';
import { Dimensions, View, Text as RNText, StyleSheet } from 'react-native';
import { renderTextEffects, needsMultipleLayers } from '../utils/textEffectsRenderer';
import { Canvas, Image, useImage, Group, RoundedRect, Shadow } from '@shopify/react-native-skia';
import { CompositionState } from '../types/composer';
import { useTheme } from '../context/ThemeContext';

interface CompositionCanvasProps {
  composition: CompositionState;
}

const { width: screenWidth } = Dimensions.get('window');
const canvasWidth = screenWidth - 32; // 16px margin on each side

const CompositionCanvas = forwardRef<any, CompositionCanvasProps>(({ composition }, ref) => {
  const { themeDefinition } = useTheme();

  const imageA = useImage(composition.photoAUri || '');
  const imageB = useImage(composition.photoBUri || '');

  // Note: Labels are now rendered as React Native Text overlaid on the canvas

  const { canvasHeight, imageWidth, imageHeight, layout } = useMemo(() => {
    let calculatedCanvasHeight = 400;
    let calculatedImageWidth = canvasWidth;
    let calculatedImageHeight = 300;

    // Calculate dimensions based on aspect ratio and layout
    if (composition.aspect !== 'free') {
      switch (composition.aspect) {
        case '1:1':
          calculatedCanvasHeight = canvasWidth;
          calculatedImageWidth = canvasWidth;
          calculatedImageHeight = canvasWidth;
          break;
        case '4:3':
          calculatedCanvasHeight = (canvasWidth * 3) / 4;
          calculatedImageHeight = calculatedCanvasHeight;
          break;
        case '16:9':
          calculatedCanvasHeight = (canvasWidth * 9) / 16;
          calculatedImageHeight = calculatedCanvasHeight;
          break;
      }
    }

    // Adjust for layout
    const calculatedLayout = composition.layout;
    if (calculatedLayout === 'vertical') {
      // For vertical layout, each image takes half the height
      calculatedImageHeight = (calculatedCanvasHeight - composition.spacing) / 2;
    } else if (calculatedLayout === 'side') {
      // For side-by-side, each image takes half the width
      calculatedImageWidth = (canvasWidth - composition.spacing) / 2;
    }

    return { canvasHeight: calculatedCanvasHeight, imageWidth: calculatedImageWidth, imageHeight: calculatedImageHeight, layout: calculatedLayout };
  }, [composition.aspect, composition.layout, composition.spacing]);

  // Text effects will be handled directly on the label text components

  const renderImages = () => {
    if (!imageA || !imageB) {
      // Render placeholder rectangles if images aren't loaded
      return (
        <Group key="placeholders">
          <RoundedRect
            x={0}
            y={0}
            width={layout === 'side' ? imageWidth : canvasWidth}
            height={layout === 'vertical' ? imageHeight : canvasHeight}
            r={composition.cornerRadius}
            color={themeDefinition.colors.border}
          />
          {layout === 'side' && (
            <RoundedRect
              x={imageWidth + composition.spacing}
              y={0}
              width={imageWidth}
              height={imageHeight}
              r={composition.cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
          {layout === 'vertical' && (
            <RoundedRect
              x={0}
              y={imageHeight + composition.spacing}
              width={imageWidth}
              height={imageHeight}
              r={composition.cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
        </Group>
      );
    }

    const elements: ReactNode[] = [];
    const cornerRadius = composition.cornerRadius;

    if (layout === 'side') {
      // Side by side layout
      elements.push(
        <Group key="side-images">
          {/* Before image (left) */}
          {imageA && (
            <Group clip={{ x: 0, y: 0, width: imageWidth, height: imageHeight, rx: cornerRadius, ry: cornerRadius }}>
              <Image
                image={imageA}
                fit="cover"
                x={0}
                y={0}
                width={imageWidth}
                height={imageHeight}
              />
            </Group>
          )}
          {/* After image (right) */}
          {imageB && (
            <Group clip={{ x: imageWidth + composition.spacing, y: 0, width: imageWidth, height: imageHeight, rx: cornerRadius, ry: cornerRadius }}>
              <Image
                image={imageB}
                fit="cover"
                x={imageWidth + composition.spacing}
                y={0}
                width={imageWidth}
                height={imageHeight}
              />
            </Group>
          )}

          {/* Fallback placeholders if images are missing */}
          {!imageA && (
            <RoundedRect
              x={0}
              y={0}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
          {!imageB && (
            <RoundedRect
              x={imageWidth + composition.spacing}
              y={0}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
        </Group>
      );
    } else if (layout === 'vertical') {
      // Vertical layout
      elements.push(
        <Group key="vertical-images">
          {/* Before image (top) */}
          {imageA && (
            <Group clip={{ x: 0, y: 0, width: imageWidth, height: imageHeight, rx: cornerRadius, ry: cornerRadius }}>
              <Image
                image={imageA}
                fit="cover"
                x={0}
                y={0}
                width={imageWidth}
                height={imageHeight}
              />
            </Group>
          )}
          {/* After image (bottom) */}
          {imageB && (
            <Group clip={{ x: 0, y: imageHeight + composition.spacing, width: imageWidth, height: imageHeight, rx: cornerRadius, ry: cornerRadius }}>
              <Image
                image={imageB}
                fit="cover"
                x={0}
                y={imageHeight + composition.spacing}
                width={imageWidth}
                height={imageHeight}
              />
            </Group>
          )}

          {/* Fallback placeholders if images are missing */}
          {!imageA && (
            <RoundedRect
              x={0}
              y={0}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
          {!imageB && (
            <RoundedRect
              x={0}
              y={imageHeight + composition.spacing}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
        </Group>
      );
    } else if (layout === 'slider') {
      // Slider reveal layout - show both images with a mask
      const sliderPosition = canvasWidth / 2; // Default to middle, could be interactive later

      elements.push(
        <Group key="slider-images">
          {/* Base image (Before) */}
          {imageA && (
            <Group clip={{ x: 0, y: 0, width: canvasWidth, height: canvasHeight, rx: cornerRadius, ry: cornerRadius }}>
              <Image
                image={imageA}
                fit="cover"
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
              />
            </Group>
          )}
          {/* Overlay image (After) with clipping */}
          {imageB && (
            <Group clip={{ x: 0, y: 0, width: sliderPosition, height: canvasHeight, rx: cornerRadius, ry: cornerRadius }}>
              <Image
                image={imageB}
                fit="cover"
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
              />
            </Group>
          )}

          {/* Fallback placeholders if images are missing */}
          {!imageA && (
            <RoundedRect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              r={cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
        </Group>
      );
    } else if (layout === 'stacked') {
      // Stacked with label bar
      const barHeight = 40;
      const adjustedImageHeight = canvasHeight - barHeight;

      elements.push(
        <Group key="stacked-images">
          {/* Main image (After on top) */}
          {imageB ? (
            <Group clip={{ x: 0, y: 0, width: canvasWidth, height: adjustedImageHeight, rx: cornerRadius, ry: cornerRadius }}>
              <Image
                image={imageB}
                fit="cover"
                x={0}
                y={0}
                width={canvasWidth}
                height={adjustedImageHeight}
              />
            </Group>
          ) : (
            <RoundedRect
              x={0}
              y={0}
              width={canvasWidth}
              height={adjustedImageHeight}
              r={cornerRadius}
              color={themeDefinition.colors.border}
            />
          )}
          {/* Label bar */}
          <RoundedRect
            x={0}
            y={adjustedImageHeight}
            width={canvasWidth}
            height={barHeight}
            r={0}
            color={composition.background.colors[0] || themeDefinition.colors.surface}
          />
          {/* Small before image in the bar */}
          {imageA ? (
            <Group clip={{ x: 8, y: adjustedImageHeight + 8, width: barHeight - 16, height: barHeight - 16, rx: 4, ry: 4 }}>
              <Image
                image={imageA}
                fit="cover"
                x={8}
                y={adjustedImageHeight + 8}
                width={barHeight - 16}
                height={barHeight - 16}
              />
            </Group>
          ) : (
            <RoundedRect
              x={8}
              y={adjustedImageHeight + 8}
              width={barHeight - 16}
              height={barHeight - 16}
              r={4}
              color={themeDefinition.colors.border}
            />
          )}
        </Group>
      );
    }

    return elements;
  };

  const renderLabels = () => {
    if (!composition.labels.show) return null;

    const { textBefore, textAfter, fontSize, position, margin, textEffects = [] } = composition.labels;

    // Render text effects
    const effectStyles = renderTextEffects(textEffects);
    const hasMultipleLayers = needsMultipleLayers(textEffects);

    // Map font weight to proper React Native values
    const getFontWeight = (weight: string) => {
      switch (weight) {
        case 'Regular':
          return '400';
        case 'Medium':
          return '500';
        case 'Bold':
          return '700';
        default:
          return '400';
      }
    };

    const labelPaddingHorizontal = 8;
    const labelPaddingVertical = 4;

    const labelStyle = {
      position: 'absolute' as const,
      fontSize: fontSize,
      fontWeight: getFontWeight(composition.labels.fontWeight) as any,
      color: composition.labels.color,
      backgroundColor: themeDefinition.colors.labelBg,
      paddingHorizontal: labelPaddingHorizontal,
      paddingVertical: labelPaddingVertical,
      borderRadius: 4,
      textAlign: 'center' as const,
      textAlignVertical: 'center' as const,
      ...effectStyles.textStyle, // Apply text effects
    };

    const renderTextWithEffects = (text: string, style: any) => {
      if (!hasMultipleLayers) {
        return (
          <RNText style={style}>
            {text}
          </RNText>
        );
      }

      // Render multiple layers for complex effects
      return (
        <View style={{ position: 'relative' }}>
          {effectStyles.shadowStyle && (
            <RNText style={[style, effectStyles.shadowStyle, { opacity: 0.6 }]}>
              {text}
            </RNText>
          )}
          {effectStyles.glowStyle && (
            <RNText style={[style, effectStyles.glowStyle, { opacity: 0.8 }]}>
              {text}
            </RNText>
          )}
          <RNText style={style}>
            {text}
          </RNText>
        </View>
      );
    };

    if (layout === 'side') {
      // Labels for side by side layout
      const estimatedLabelHeight = fontSize + labelPaddingVertical * 2; // fontSize + padding
      const availableWidth = Math.max(
        imageWidth - margin * 2,
        fontSize + labelPaddingHorizontal * 2
      );
      const y = (position === 'tl' || position === 'tr')
        ? margin
        : Math.max(margin, imageHeight - estimatedLabelHeight - margin);

      const beforePositionStyle = (position === 'tl' || position === 'bl')
        ? {
          left: margin,
          textAlign: 'left' as const,
        }
        : {
          right: canvasWidth - imageWidth + margin,
          textAlign: 'right' as const,
        };

      const afterPositionStyle = (position === 'tl' || position === 'bl')
        ? {
          left: imageWidth + composition.spacing + margin,
          textAlign: 'left' as const,
        }
        : {
          right: margin,
          textAlign: 'right' as const,
        };

      return (
        <>
          {renderTextWithEffects(textBefore, [
            labelStyle,
            {
              top: y,
              maxWidth: availableWidth,
              ...beforePositionStyle,
            }
          ])}
          {renderTextWithEffects(textAfter, [
            labelStyle,
            {
              top: y,
              maxWidth: availableWidth,
              ...afterPositionStyle,
            }
          ])}
        </>
      );
    } else if (layout === 'vertical') {
      // Labels for vertical layout
      const estimatedLabelHeight = fontSize + labelPaddingVertical * 2; // fontSize + padding
      const maxWidth = Math.max(
        canvasWidth - margin * 2,
        fontSize + labelPaddingHorizontal * 2
      );
      const beforeY = (position === 'tl' || position === 'tr')
        ? margin
        : Math.max(margin, imageHeight - estimatedLabelHeight - margin);
      const afterY = (position === 'tl' || position === 'tr')
        ? imageHeight + composition.spacing + margin
        : Math.max(imageHeight + composition.spacing + margin, canvasHeight - estimatedLabelHeight - margin);

      const horizontalPositionStyle = (position === 'tl' || position === 'bl')
        ? {
          left: margin,
          textAlign: 'left' as const,
        }
        : {
          right: margin,
          textAlign: 'right' as const,
        };

      return (
        <>
          {renderTextWithEffects(textBefore, [
            labelStyle,
            {
              top: beforeY,
              maxWidth: maxWidth,
              ...horizontalPositionStyle,
            }
          ])}
          {renderTextWithEffects(textAfter, [
            labelStyle,
            {
              top: afterY,
              maxWidth: maxWidth,
              ...horizontalPositionStyle,
            }
          ])}
        </>
      );
    } else if (layout === 'stacked') {
      // Labels in the bottom bar
      const estimatedLabelHeight = fontSize + 16; // fontSize + padding
      const barHeight = 40;
      const beforeLabelY = canvasHeight - Math.max(barHeight, estimatedLabelHeight + 8);
      const maxLabelWidth = (canvasWidth / 2) - 20;

      return (
        <>
          {renderTextWithEffects(textBefore, [
            labelStyle,
            {
              left: 10,
              top: beforeLabelY,
              maxWidth: maxLabelWidth,
            }
          ])}
          {renderTextWithEffects(textAfter, [
            labelStyle,
            {
              right: 10,
              top: beforeLabelY,
              maxWidth: maxLabelWidth,
            }
          ])}
        </>
      );
    }

    return null;
  };

  const renderBackground = () => {
    if (composition.background.type === 'transparent') return null;

    return (
      <RoundedRect
        x={0}
        y={0}
        width={canvasWidth}
        height={canvasHeight}
        r={0}
        color={composition.background.colors[0] || themeDefinition.colors.canvasBg}
      />
    );
  };

  const renderFrame = () => {
    if (!composition.frame?.on) return null;

    return (
      <RoundedRect
        x={0}
        y={0}
        width={canvasWidth}
        height={canvasHeight}
        r={composition.cornerRadius + composition.frame.thickness}
        style="stroke"
        strokeWidth={composition.frame.thickness}
        color={composition.frame.color}
      />
    );
  };

  const renderWatermark = () => {
    if (!composition.watermarkOn) return null;

    // Simple watermark using a rounded rectangle overlay
    return (
      <Group key="watermark">
        <RoundedRect
          x={canvasWidth - 120}
          y={12}
          width={110}
          height={24}
          r={12}
          color={themeDefinition.colors.watermark}
          opacity={0.3}
        />
        <RoundedRect
          x={canvasWidth - 115}
          y={16}
          width={100}
          height={16}
          r={8}
          color={themeDefinition.colors.watermark}
          opacity={0.5}
        />
      </Group>
    );
  };

  return (
    <View style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}>
      <Canvas ref={ref} style={{ width: canvasWidth, height: canvasHeight }}>
        {renderBackground()}
        {renderImages()}
        {renderFrame()}
        {renderWatermark()}
      </Canvas>
      {renderLabels()}
    </View>
  );
});

CompositionCanvas.displayName = 'CompositionCanvas';

export default CompositionCanvas;
