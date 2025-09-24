import React, { useMemo, forwardRef, ReactNode } from 'react';
import { Dimensions, View, Text as RNText, StyleSheet } from 'react-native';
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

  const shadowConfig = useMemo(() => {
    switch (composition.shadow) {
      case 'low':
        return { blur: 4, dx: 2, dy: 2, color: themeDefinition.colors.shadow };
      case 'med':
        return { blur: 8, dx: 4, dy: 4, color: themeDefinition.colors.shadow };
      case 'high':
        return { blur: 16, dx: 8, dy: 8, color: themeDefinition.colors.shadow };
      default:
        return null;
    }
  }, [composition.shadow, themeDefinition.colors.shadow]);

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
          {shadowConfig && (
            <>
              <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
              <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
            </>
          )}
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
        </Group>
      );
    } else if (layout === 'vertical') {
      // Vertical layout
      elements.push(
        <Group key="vertical-images">
          {shadowConfig && (
            <>
              <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
              <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
            </>
          )}
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
        </Group>
      );
    } else if (layout === 'slider') {
      // Slider reveal layout - show both images with a mask
      const sliderPosition = canvasWidth / 2; // Default to middle, could be interactive later

      elements.push(
        <Group key="slider-images">
          {shadowConfig && (
            <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
          )}
          {/* Base image (Before) */}
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
          {/* Overlay image (After) with clipping */}
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
        </Group>
      );
    } else if (layout === 'stacked') {
      // Stacked with label bar
      const barHeight = 40;
      const adjustedImageHeight = canvasHeight - barHeight;

      elements.push(
        <Group key="stacked-images">
          {shadowConfig && (
            <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
          )}
          {/* Main image (After on top) */}
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
        </Group>
      );
    }

    return elements;
  };

  const renderLabels = () => {
    if (!composition.labels.show) return null;

    const { textBefore, textAfter, fontSize, position, margin } = composition.labels;

    const labelStyle = {
      position: 'absolute' as const,
      fontSize: fontSize,
      fontWeight: composition.labels.fontWeight.toLowerCase() as any,
      color: composition.labels.color,
      backgroundColor: themeDefinition.colors.labelBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      textAlign: 'center' as const,
      textAlignVertical: 'center' as const,
    };

    if (layout === 'side') {
      // Labels for side by side layout
      const beforeX = position.includes('l') ? margin : imageWidth - margin - 60;
      const afterX = position.includes('l') ? imageWidth + composition.spacing + margin : canvasWidth - margin - 60;
      const y = position.includes('t') ? margin : imageHeight - margin - 30;

      return (
        <>
          <RNText
            style={[
              labelStyle,
              {
                left: beforeX,
                top: y,
              }
            ]}
          >
            {textBefore}
          </RNText>
          <RNText
            style={[
              labelStyle,
              {
                left: afterX,
                top: y,
              }
            ]}
          >
            {textAfter}
          </RNText>
        </>
      );
    } else if (layout === 'vertical') {
      // Labels for vertical layout
      const x = position.includes('l') ? margin : canvasWidth - margin - 60;
      const beforeY = position.includes('t') ? margin : imageHeight - margin - 30;
      const afterY = position.includes('t') ? imageHeight + composition.spacing + margin : canvasHeight - margin - 30;

      return (
        <>
          <RNText
            style={[
              labelStyle,
              {
                left: x,
                top: beforeY,
              }
            ]}
          >
            {textBefore}
          </RNText>
          <RNText
            style={[
              labelStyle,
              {
                left: x,
                top: afterY,
              }
            ]}
          >
            {textAfter}
          </RNText>
        </>
      );
    } else if (layout === 'stacked') {
      // Labels in the bottom bar
      const beforeLabelY = canvasHeight - 40;

      return (
        <>
          <RNText
            style={[
              labelStyle,
              {
                left: 50,
                top: beforeLabelY,
              }
            ]}
          >
            {textBefore}
          </RNText>
          <RNText
            style={[
              labelStyle,
              {
                right: 50,
                top: beforeLabelY,
              }
            ]}
          >
            {textAfter}
          </RNText>
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