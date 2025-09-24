import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Canvas, Image, useImage, Text, Skia, Rect, Group, RoundedRect, Shadow } from '@shopify/react-native-skia';
import { CompositionState } from '../types/composer';
import { useTheme } from '../context/ThemeContext';

interface CompositionCanvasProps {
  composition: CompositionState;
}

const { width: screenWidth } = Dimensions.get('window');
const canvasWidth = screenWidth - 32; // 16px margin on each side

const CompositionCanvas: React.FC<CompositionCanvasProps> = ({ composition }) => {
  const { themeDefinition } = useTheme();

  const imageA = useImage(composition.photoAUri || '');
  const imageB = useImage(composition.photoBUri || '');

  const { canvasHeight, imageWidth, imageHeight, layout } = useMemo(() => {
    let canvasHeight = 400;
    let imageWidth = canvasWidth;
    let imageHeight = 300;

    // Calculate dimensions based on aspect ratio and layout
    if (composition.aspect !== 'free') {
      switch (composition.aspect) {
        case '1:1':
          canvasHeight = canvasWidth;
          imageWidth = canvasWidth;
          imageHeight = canvasWidth;
          break;
        case '4:3':
          canvasHeight = (canvasWidth * 3) / 4;
          imageHeight = canvasHeight;
          break;
        case '16:9':
          canvasHeight = (canvasWidth * 9) / 16;
          imageHeight = canvasHeight;
          break;
      }
    }

    // Adjust for layout
    const layout = composition.layout;
    if (layout === 'vertical') {
      // For vertical layout, each image takes half the height
      imageHeight = (canvasHeight - composition.spacing) / 2;
    } else if (layout === 'side') {
      // For side-by-side, each image takes half the width
      imageWidth = (canvasWidth - composition.spacing) / 2;
    }

    return { canvasHeight, imageWidth, imageHeight, layout };
  }, [composition.aspect, composition.layout, composition.spacing, canvasWidth]);

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
    if (!imageA || !imageB) return null;

    const elements: JSX.Element[] = [];
    const cornerRadius = composition.cornerRadius;

    if (layout === 'side') {
      // Side by side layout
      const leftImageRect = Rect.Create(0, 0, imageWidth, imageHeight);
      const rightImageRect = Rect.Create(imageWidth + composition.spacing, 0, imageWidth, imageHeight);

      elements.push(
        <Group key="side-images">
          {shadowConfig && (
            <>
              <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
              <Shadow blur={shadowConfig.blur} dx={shadowConfig.dx} dy={shadowConfig.dy} color={shadowConfig.color} />
            </>
          )}
          <Group>
            <RoundedRect
              x={0}
              y={0}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
            />
            <Image
              image={imageA}
              fit="cover"
              x={0}
              y={0}
              width={imageWidth}
              height={imageHeight}
            />
          </Group>
          <Group>
            <RoundedRect
              x={imageWidth + composition.spacing}
              y={0}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
            />
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
          <Group>
            <RoundedRect
              x={0}
              y={0}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
            />
            <Image
              image={imageA}
              fit="cover"
              x={0}
              y={0}
              width={imageWidth}
              height={imageHeight}
            />
          </Group>
          <Group>
            <RoundedRect
              x={0}
              y={imageHeight + composition.spacing}
              width={imageWidth}
              height={imageHeight}
              r={cornerRadius}
            />
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
          <Group>
            <RoundedRect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              r={cornerRadius}
            />
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
          <Group>
            <RoundedRect
              x={0}
              y={0}
              width={sliderPosition}
              height={canvasHeight}
              r={cornerRadius}
            />
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
          <Group>
            <RoundedRect
              x={0}
              y={0}
              width={canvasWidth}
              height={adjustedImageHeight}
              r={cornerRadius}
            />
            <Image
              image={imageB}
              fit="cover"
              x={0}
              y={0}
              width={canvasWidth}
              height={adjustedImageHeight}
            />
          </Group>
          {/* Label bar with before image thumbnail */}
          <Rect
            x={0}
            y={adjustedImageHeight}
            width={canvasWidth}
            height={barHeight}
            color={composition.background.colors[0] || themeDefinition.colors.surface}
          />
          {/* Small before image in the bar */}
          <Group>
            <RoundedRect
              x={8}
              y={adjustedImageHeight + 8}
              width={barHeight - 16}
              height={barHeight - 16}
              r={4}
            />
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

    const elements: JSX.Element[] = [];
    const { textBefore, textAfter, fontSize, color, position, margin, fontWeight } = composition.labels;

    if (layout === 'side') {
      // Labels for side by side layout
      const beforeX = position.includes('l') ? margin : imageWidth - margin;
      const afterX = position.includes('l') ? imageWidth + composition.spacing + margin : canvasWidth - margin;
      const y = position.includes('t') ? margin + fontSize : imageHeight - margin;

      elements.push(
        <Group key="side-labels">
          {/* Before label background */}
          <RoundedRect
            x={beforeX - 8}
            y={y - fontSize}
            width={textBefore.length * (fontSize * 0.6) + 16}
            height={fontSize + 8}
            r={4}
            color={composition.labels.show ? themeDefinition.colors.labelBg : 'transparent'}
          />
          {/* After label background */}
          <RoundedRect
            x={afterX - 8}
            y={y - fontSize}
            width={textAfter.length * (fontSize * 0.6) + 16}
            height={fontSize + 8}
            r={4}
            color={composition.labels.show ? themeDefinition.colors.labelBg : 'transparent'}
          />
        </Group>
      );
    } else if (layout === 'vertical') {
      // Labels for vertical layout
      const x = position.includes('l') ? margin : canvasWidth - margin;
      const beforeY = position.includes('t') ? margin + fontSize : imageHeight - margin;
      const afterY = position.includes('t') ? imageHeight + composition.spacing + margin + fontSize : canvasHeight - margin;

      elements.push(
        <Group key="vertical-labels">
          {/* Before label background */}
          <RoundedRect
            x={x - 8}
            y={beforeY - fontSize}
            width={textBefore.length * (fontSize * 0.6) + 16}
            height={fontSize + 8}
            r={4}
            color={themeDefinition.colors.labelBg}
          />
          {/* After label background */}
          <RoundedRect
            x={x - 8}
            y={afterY - fontSize}
            width={textAfter.length * (fontSize * 0.6) + 16}
            height={fontSize + 8}
            r={4}
            color={themeDefinition.colors.labelBg}
          />
        </Group>
      );
    } else if (layout === 'stacked') {
      // Labels in the bottom bar
      const beforeLabelY = canvasHeight - 20;
      const afterLabelY = canvasHeight - 20;

      elements.push(
        <Group key="stacked-labels">
          {/* Before label background */}
          <RoundedRect
            x={42}
            y={beforeLabelY - fontSize / 2 - 4}
            width={textBefore.length * (fontSize * 0.6) + 16}
            height={fontSize + 8}
            r={4}
            color={themeDefinition.colors.labelBg}
          />
          {/* After label background */}
          <RoundedRect
            x={canvasWidth - textAfter.length * (fontSize * 0.6) - 24}
            y={afterLabelY - fontSize / 2 - 4}
            width={textAfter.length * (fontSize * 0.6) + 16}
            height={fontSize + 8}
            r={4}
            color={themeDefinition.colors.labelBg}
          />
        </Group>
      );
    }

    return elements;
  };

  const renderBackground = () => {
    if (composition.background.type === 'transparent') return null;

    return (
      <Rect
        x={0}
        y={0}
        width={canvasWidth}
        height={canvasHeight}
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

    // Create a simple text watermark
    const font = Skia.Font(Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(new Uint8Array())), 12);

    return (
      <Text
        x={canvasWidth - 100}
        y={20}
        text="Before/After"
        font={font}
        color={themeDefinition.colors.watermark}
        opacity={0.5}
      />
    );
  };

  return (
    <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
      {renderBackground()}
      {renderImages()}
      {renderLabels()}
      {renderFrame()}
      {renderWatermark()}
    </Canvas>
  );
};

export default CompositionCanvas;