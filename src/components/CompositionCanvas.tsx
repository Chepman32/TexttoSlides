import React, { useMemo, forwardRef, ReactNode } from 'react';
import { Dimensions, View, Text as RNText } from 'react-native';
import {
  renderTextEffects,
  needsMultipleLayers,
} from '../utils/textEffectsRenderer';
import {
  Canvas,
  Image,
  useImage,
  Group,
  RoundedRect,
  Path,
  Skia,
  LinearGradient,
  vec,
  SkImage,
} from '@shopify/react-native-skia';
import { CompositionState, ImageOffset } from '../types/composer';
import { useTheme } from '../context/ThemeContext';

interface CompositionCanvasProps {
  composition: CompositionState;
  onPanImage?: (imageKey: 'A' | 'B', offset: ImageOffset) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const canvasWidth = screenWidth - 32; // 16px margin on each side

const degToRad = (angle: number) => (angle * Math.PI) / 180;

// Helper to calculate image position for "cover" fit with offset support
// Returns the position and scale to draw the image, with offset clamped to keep image within bounds
const calculateCoverFitPosition = (
  image: SkImage | null,
  containerWidth: number,
  containerHeight: number,
  containerX: number = 0,
  containerY: number = 0,
  offset: ImageOffset = { x: 0, y: 0 },
) => {
  if (!image) return null;

  const imgWidth = image.width();
  const imgHeight = image.height();

  // Calculate scale to cover the container
  const scaleX = containerWidth / imgWidth;
  const scaleY = containerHeight / imgHeight;
  const scale = Math.max(scaleX, scaleY);

  // Scaled dimensions
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Calculate how much the image can be panned (in scaled coordinates)
  // This is the maximum distance the image can move from center while still covering the container
  const maxOffsetX = Math.max(0, (scaledWidth - containerWidth) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - containerHeight) / 2);

  // Clamp offset to valid range - image must always cover the container
  const clampedOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x));
  const clampedOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y));

  // Calculate centered position (where image would be without offset)
  const centeredX = containerX + (containerWidth - scaledWidth) / 2;
  const centeredY = containerY + (containerHeight - scaledHeight) / 2;

  return {
    x: centeredX + clampedOffsetX,
    y: centeredY + clampedOffsetY,
    width: scaledWidth,
    height: scaledHeight,
    maxOffsetX,
    maxOffsetY,
  };
};

const CompositionCanvas = forwardRef<any, CompositionCanvasProps>(
  ({ composition }, ref) => {
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
        calculatedImageHeight =
          (calculatedCanvasHeight - composition.spacing) / 2;
      } else if (calculatedLayout === 'side') {
        // For side-by-side, each image takes half the width
        calculatedImageWidth = (canvasWidth - composition.spacing) / 2;
      }

      if (calculatedLayout === 'deviceMockup') {
        // Device mockup layout uses its own sizing for screens
        calculatedImageWidth = canvasWidth * 0.42;
        calculatedImageHeight = canvasHeight * 0.88;
      }

      // Add extra space for below-image labels
      let labelAreaHeight = 0;
      if (
        composition.labels.show &&
        composition.labels.position === 'belowCenter'
      ) {
        labelAreaHeight =
          composition.labels.fontSize + 16 + composition.labels.margin;
      }

      return {
        canvasHeight: calculatedCanvasHeight + labelAreaHeight,
        imageWidth: calculatedImageWidth,
        imageHeight: calculatedImageHeight,
        layout: calculatedLayout,
        labelAreaHeight,
      };
    }, [
      composition.aspect,
      composition.layout,
      composition.spacing,
      composition.labels.show,
      composition.labels.position,
      composition.labels.fontSize,
      composition.labels.margin,
    ]);

    const canvasCornerRadius = composition.cornerRadius;
    const clipRect = useMemo(() => {
      if (canvasCornerRadius <= 0) {
        return undefined;
      }

      return {
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        rx: canvasCornerRadius,
        ry: canvasCornerRadius,
      };
    }, [canvasHeight, canvasCornerRadius]);

    const deviceMetrics = useMemo(() => {
      if (composition.layout !== 'deviceMockup') {
        return null;
      }

      const deviceWidth = canvasWidth * 0.42;
      const deviceHeight = canvasHeight * 0.9;
      const spacing = composition.spacing;
      const totalWidth = deviceWidth * 2 + spacing;
      const startX = (canvasWidth - totalWidth) / 2;
      const deviceY = (canvasHeight - deviceHeight) / 2;

      const bezelX = deviceWidth * 0.068;
      const bezelY = deviceHeight * 0.082;
      const screenWidth = deviceWidth - bezelX * 2;
      const screenHeight = deviceHeight - bezelY * 2;
      const notchWidth = screenWidth * 0.52;
      const notchHeight = deviceHeight * 0.085;
      const notchRadius = notchHeight / 2;
      const notchY = bezelY - notchHeight * 0.45;

      return {
        deviceWidth,
        deviceHeight,
        deviceY,
        leftX: startX,
        rightX: startX + deviceWidth + spacing,
        bezelX,
        bezelY,
        screenWidth,
        screenHeight,
        notch: {
          x: (deviceWidth - notchWidth) / 2,
          y: notchY,
          width: notchWidth,
          height: notchHeight,
          radius: notchRadius,
        },
      };
    }, [canvasHeight, canvasWidth, composition.layout, composition.spacing]);

    const renderImages = () => {
      if (layout !== 'deviceMockup' && (!imageA || !imageB)) {
        // Render placeholder rectangles if images aren't loaded
        return (
          <Group key="placeholders">
            <RoundedRect
              x={0}
              y={0}
              width={layout === 'side' ? imageWidth : canvasWidth}
              height={
                layout === 'side' || layout === 'vertical'
                  ? imageHeight
                  : canvasHeight
              }
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
      const cornerRadius = canvasCornerRadius;

      if (layout === 'side') {
        // Side by side layout
        // Get offsets (default to 0,0 if not set)
        const offsetA = composition.photoAOffset || { x: 0, y: 0 };
        const offsetB = composition.photoBOffset || { x: 0, y: 0 };

        // Calculate cover fit positions with clamped offsets
        const imageAPos = calculateCoverFitPosition(
          imageA,
          imageWidth,
          imageHeight,
          0,
          0,
          offsetA,
        );
        const imageBPos = calculateCoverFitPosition(
          imageB,
          imageWidth,
          imageHeight,
          imageWidth + composition.spacing,
          0,
          offsetB,
        );

        elements.push(
          <Group key="side-images">
            {/* Before image (left) */}
            {imageA && imageAPos && (
              <Group
                clip={{
                  x: 0,
                  y: 0,
                  width: imageWidth,
                  height: imageHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
                <Image
                  image={imageA}
                  x={imageAPos.x}
                  y={imageAPos.y}
                  width={imageAPos.width}
                  height={imageAPos.height}
                />
              </Group>
            )}
            {/* After image (right) */}
            {imageB && imageBPos && (
              <Group
                clip={{
                  x: imageWidth + composition.spacing,
                  y: 0,
                  width: imageWidth,
                  height: imageHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
                <Image
                  image={imageB}
                  x={imageBPos.x}
                  y={imageBPos.y}
                  width={imageBPos.width}
                  height={imageBPos.height}
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
          </Group>,
        );
      } else if (layout === 'deviceMockup') {
        if (!deviceMetrics) {
          return elements;
        }

        const {
          deviceWidth,
          deviceHeight,
          deviceY,
          leftX,
          rightX,
          bezelX,
          bezelY,
          screenWidth,
          screenHeight,
          notch,
        } = deviceMetrics;

        const deviceRadius = deviceWidth * 0.22;
        const screenRadius = screenWidth * 0.22;
        const shadowOffset = deviceWidth * 0.038;
        const bodyColor = '#11141B';
        const notchColor = '#0C0F15';
        const placeholderColor = themeDefinition.colors.border;

        // Get offsets for device mockup
        const offsetA = composition.photoAOffset || { x: 0, y: 0 };
        const offsetB = composition.photoBOffset || { x: 0, y: 0 };

        const deviceConfigs = [
          {
            key: 'device-before',
            image: imageA,
            offset: offsetA,
            topLeftX: leftX,
            rotation: -6,
            isLeft: true,
          },
          {
            key: 'device-after',
            image: imageB,
            offset: offsetB,
            topLeftX: rightX,
            rotation: 6,
            isLeft: false,
          },
        ];

        const buildDevice = (
          key: string,
          image: ReturnType<typeof useImage>,
          offset: ImageOffset,
          topLeftX: number,
          rotationDeg: number,
          isLeft: boolean = false,
        ) => {
          const originX = topLeftX + deviceWidth / 2;
          const originY = deviceY + deviceHeight / 2;

          // Adjust notch position - left device gets centered and lowered, right stays original
          const leftNotchY = bezelY + screenHeight * 0.28;
          const rightNotchY = bezelY + screenHeight * 0.18;
          const adjustedNotchY = isLeft ? leftNotchY : rightNotchY;

          const leftNotchHorizontalOffset = deviceWidth * 0.0;
          const rightNotchHorizontalOffset = deviceWidth * 0.12;
          const adjustedNotchX = isLeft
            ? notch.x - leftNotchHorizontalOffset
            : notch.x + rightNotchHorizontalOffset;

          // Calculate cover fit position with offset for the screen area
          const imagePos = calculateCoverFitPosition(
            image,
            screenWidth,
            screenHeight,
            bezelX,
            bezelY,
            offset,
          );

          return (
            <Group
              key={key}
              transform={[
                { translateX: originX },
                { translateY: originY },
                { rotate: degToRad(rotationDeg) },
                { translateX: -deviceWidth / 2 },
                { translateY: -deviceHeight / 2 },
              ]}
            >
              <RoundedRect
                x={shadowOffset}
                y={shadowOffset}
                width={deviceWidth}
                height={deviceHeight}
                r={deviceRadius}
                color="rgba(0, 0, 0, 0.25)"
                opacity={0.35}
              />
              <RoundedRect
                x={0}
                y={0}
                width={deviceWidth}
                height={deviceHeight}
                r={deviceRadius}
                color={bodyColor}
              />
              <RoundedRect
                x={0}
                y={0}
                width={deviceWidth}
                height={deviceHeight}
                r={deviceRadius}
                style="stroke"
                strokeWidth={deviceWidth * 0.015}
                color="rgba(255,255,255,0.04)"
              />
              <RoundedRect
                x={adjustedNotchX}
                y={adjustedNotchY}
                width={notch.width}
                height={notch.height}
                r={notch.radius}
                color={notchColor}
              />
              <RoundedRect
                x={adjustedNotchX + notch.width * 0.32}
                y={adjustedNotchY + notch.height * 0.24}
                width={notch.width * 0.2}
                height={notch.height * 0.5}
                r={notch.height * 0.25}
                color="rgba(0,0,0,0.35)"
              />
              <Group
                clip={{
                  x: bezelX,
                  y: bezelY,
                  width: screenWidth,
                  height: screenHeight,
                  rx: screenRadius,
                  ry: screenRadius,
                }}
              >
                {image && imagePos ? (
                  <Image
                    image={image}
                    x={imagePos.x}
                    y={imagePos.y}
                    width={imagePos.width}
                    height={imagePos.height}
                  />
                ) : (
                  <RoundedRect
                    x={bezelX}
                    y={bezelY}
                    width={screenWidth}
                    height={screenHeight}
                    r={screenRadius}
                    color={placeholderColor}
                  />
                )}
              </Group>
            </Group>
          );
        };

        elements.push(
          <Group key="device-mockup">
            {deviceConfigs.map(config =>
              buildDevice(
                config.key,
                config.image,
                config.offset,
                config.topLeftX,
                config.rotation,
                config.isLeft,
              ),
            )}
          </Group>,
        );
      } else if (layout === 'vertical') {
        // Vertical layout
        // Get offsets (default to 0,0 if not set)
        const offsetA = composition.photoAOffset || { x: 0, y: 0 };
        const offsetB = composition.photoBOffset || { x: 0, y: 0 };

        // Calculate cover fit positions with clamped offsets
        const imageAPos = calculateCoverFitPosition(
          imageA,
          imageWidth,
          imageHeight,
          0,
          0,
          offsetA,
        );
        const imageBPos = calculateCoverFitPosition(
          imageB,
          imageWidth,
          imageHeight,
          0,
          imageHeight + composition.spacing,
          offsetB,
        );

        elements.push(
          <Group key="vertical-images">
            {/* Before image (top) */}
            {imageA && imageAPos && (
              <Group
                clip={{
                  x: 0,
                  y: 0,
                  width: imageWidth,
                  height: imageHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
                <Image
                  image={imageA}
                  x={imageAPos.x}
                  y={imageAPos.y}
                  width={imageAPos.width}
                  height={imageAPos.height}
                />
              </Group>
            )}
            {/* After image (bottom) */}
            {imageB && imageBPos && (
              <Group
                clip={{
                  x: 0,
                  y: imageHeight + composition.spacing,
                  width: imageWidth,
                  height: imageHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
                <Image
                  image={imageB}
                  x={imageBPos.x}
                  y={imageBPos.y}
                  width={imageBPos.width}
                  height={imageBPos.height}
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
          </Group>,
        );
      } else if (layout === 'slider') {
        // Slider reveal layout - show both images with a mask
        const sliderPos = composition.sliderPosition ?? 0.5;
        const sliderX = canvasWidth * sliderPos;
        const offsetA = composition.photoAOffset || { x: 0, y: 0 };
        const offsetB = composition.photoBOffset || { x: 0, y: 0 };

        // Calculate cover fit positions with clamped offsets
        const imageAPos = calculateCoverFitPosition(
          imageA,
          canvasWidth,
          canvasHeight,
          0,
          0,
          offsetA,
        );
        const imageBPos = calculateCoverFitPosition(
          imageB,
          canvasWidth,
          canvasHeight,
          0,
          0,
          offsetB,
        );

        elements.push(
          <Group key="slider-images">
            {/* Base image (Before - right side) */}
            {imageA && imageAPos && (
              <Group
                clip={{
                  x: 0,
                  y: 0,
                  width: canvasWidth,
                  height: canvasHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
                <Image
                  image={imageA}
                  x={imageAPos.x}
                  y={imageAPos.y}
                  width={imageAPos.width}
                  height={imageAPos.height}
                />
              </Group>
            )}
            {/* Overlay image (After - left side) with clipping */}
            {imageB && imageBPos && (
              <Group
                clip={{
                  x: 0,
                  y: 0,
                  width: sliderX,
                  height: canvasHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
                <Image
                  image={imageB}
                  x={imageBPos.x}
                  y={imageBPos.y}
                  width={imageBPos.width}
                  height={imageBPos.height}
                />
              </Group>
            )}

            {/* Slider line */}
            <RoundedRect
              x={sliderX - 2}
              y={0}
              width={4}
              height={canvasHeight}
              r={2}
              color="#FFFFFF"
              opacity={0.9}
            />
            {/* Slider handle */}
            <RoundedRect
              x={sliderX - 16}
              y={canvasHeight / 2 - 24}
              width={32}
              height={48}
              r={16}
              color="#FFFFFF"
            />
            {/* Handle arrows */}
            <Path
              path={`M ${sliderX - 6} ${canvasHeight / 2 - 6} L ${
                sliderX - 10
              } ${canvasHeight / 2} L ${sliderX - 6} ${canvasHeight / 2 + 6}`}
              color="#333333"
              style="stroke"
              strokeWidth={2}
            />
            <Path
              path={`M ${sliderX + 6} ${canvasHeight / 2 - 6} L ${
                sliderX + 10
              } ${canvasHeight / 2} L ${sliderX + 6} ${canvasHeight / 2 + 6}`}
              color="#333333"
              style="stroke"
              strokeWidth={2}
            />

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
          </Group>,
        );
      } else if (layout === 'stacked') {
        // Stacked with label bar
        const barHeight = 40;
        const adjustedImageHeight = canvasHeight - barHeight;

        elements.push(
          <Group key="stacked-images">
            {/* Main image (After on top) */}
            {imageB ? (
              <Group
                clip={{
                  x: 0,
                  y: 0,
                  width: canvasWidth,
                  height: adjustedImageHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
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
              color={
                composition.background.colors[0] ||
                themeDefinition.colors.surface
              }
            />
            {/* Small before image in the bar */}
            {imageA ? (
              <Group
                clip={{
                  x: 8,
                  y: adjustedImageHeight + 8,
                  width: barHeight - 16,
                  height: barHeight - 16,
                  rx: 4,
                  ry: 4,
                }}
              >
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
          </Group>,
        );
      } else if (layout === 'polaroid') {
        const baseSize = Math.min(canvasWidth, canvasHeight);
        const polaroidWidth = baseSize * 0.55;
        const polaroidHeight = baseSize * 0.58;
        const sidePadding = polaroidWidth * 0.06;
        const topPadding = polaroidHeight * 0.05;
        const bottomPadding = polaroidHeight * 0.15;
        const photoWidth = polaroidWidth - sidePadding * 2;
        const photoHeight = polaroidHeight - topPadding - bottomPadding;
        const photoX = -polaroidWidth / 2 + sidePadding;
        const photoY = -polaroidHeight / 2 + topPadding;
        const tapeHeight = polaroidHeight * 0.14;
        const tapeWidth = polaroidWidth * 0.7;
        const tapeColor = '#D7B37A';
        const tapeHighlightColor = '#E9CAA0';
        const shadowOffset = baseSize * 0.02;
        const cardRadius = 16;
        const photoRadius = 10;

        // Get offsets for polaroid
        const offsetA = composition.photoAOffset || { x: 0, y: 0 };
        const offsetB = composition.photoBOffset || { x: 0, y: 0 };

        const buildPolaroid = (
          key: string,
          image: ReturnType<typeof useImage>,
          offset: ImageOffset,
          centerX: number,
          centerY: number,
          rotationDeg: number,
          tapeConfig: { shiftX: number; shiftY: number; rotationDeg: number },
        ) => {
          // Calculate cover fit position with offset for the photo area
          const imagePos = calculateCoverFitPosition(
            image,
            photoWidth,
            photoHeight,
            photoX,
            photoY,
            offset,
          );

          return (
            <Group
              key={key}
              transform={[
                { translateX: centerX },
                { translateY: centerY },
                { rotate: degToRad(rotationDeg) },
              ]}
            >
              <RoundedRect
                x={-polaroidWidth / 2 + shadowOffset}
                y={-polaroidHeight / 2 + shadowOffset}
                width={polaroidWidth}
                height={polaroidHeight}
                r={cardRadius}
                color="rgba(0,0,0,0.14)"
                opacity={0.35}
              />
              <RoundedRect
                x={-polaroidWidth / 2}
                y={-polaroidHeight / 2}
                width={polaroidWidth}
                height={polaroidHeight}
                r={cardRadius}
                color="#FFFFFF"
              />
              <RoundedRect
                x={-polaroidWidth / 2}
                y={-polaroidHeight / 2}
                width={polaroidWidth}
                height={polaroidHeight}
                r={cardRadius}
                style="stroke"
                strokeWidth={2}
                color="rgba(0,0,0,0.08)"
              />
              <Group
                clip={{
                  x: photoX,
                  y: photoY,
                  width: photoWidth,
                  height: photoHeight,
                  rx: photoRadius,
                  ry: photoRadius,
                }}
              >
                {image && imagePos ? (
                  <Image
                    image={image}
                    x={imagePos.x}
                    y={imagePos.y}
                    width={imagePos.width}
                    height={imagePos.height}
                  />
                ) : (
                  <RoundedRect
                    x={photoX}
                    y={photoY}
                    width={photoWidth}
                    height={photoHeight}
                    r={photoRadius}
                    color="#111111"
                  />
                )}
              </Group>
              <RoundedRect
                x={photoX}
                y={photoY}
                width={photoWidth}
                height={photoHeight}
                r={photoRadius}
                style="stroke"
                strokeWidth={2}
                color="rgba(0,0,0,0.12)"
              />
              <Group
                transform={[
                  { translateX: tapeConfig.shiftX },
                  {
                    translateY:
                      -polaroidHeight / 2 + tapeHeight / 2 + tapeConfig.shiftY,
                  },
                  { rotate: degToRad(tapeConfig.rotationDeg) },
                ]}
              >
                <RoundedRect
                  x={-tapeWidth / 2}
                  y={-tapeHeight / 2}
                  width={tapeWidth}
                  height={tapeHeight}
                  r={6}
                  color={tapeColor}
                  opacity={0.9}
                />
                <RoundedRect
                  x={-tapeWidth * 0.45}
                  y={-tapeHeight / 2 + 3}
                  width={tapeWidth * 0.9}
                  height={tapeHeight / 2}
                  r={4}
                  color={tapeHighlightColor}
                  opacity={0.35}
                />
              </Group>
            </Group>
          );
        };

        const offsetX = baseSize * 0.18;
        const offsetY = baseSize * 0.02;

        return [
          buildPolaroid(
            'before-polaroid',
            imageA,
            offsetA,
            canvasWidth / 2 - offsetX,
            canvasHeight / 2 - offsetY,
            -8,
            {
              shiftX: -polaroidWidth * 0.08,
              shiftY: -tapeHeight * 0.4,
              rotationDeg: -6,
            },
          ),
          buildPolaroid(
            'after-polaroid',
            imageB,
            offsetB,
            canvasWidth / 2 + offsetX,
            canvasHeight / 2 + offsetY,
            5,
            {
              shiftX: polaroidWidth * 0.05,
              shiftY: -tapeHeight * 0.35,
              rotationDeg: 8,
            },
          ),
        ];
      } else if (layout === 'diagonal') {
        // Diagonal split layout - images split along diagonal line from top-left to bottom-right
        // Using separate clipped groups for each triangle
        const offsetA = composition.photoAOffset || { x: 0, y: 0 };
        const offsetB = composition.photoBOffset || { x: 0, y: 0 };

        // Calculate cover fit positions with clamped offsets
        const imageAPos = calculateCoverFitPosition(
          imageA,
          canvasWidth,
          canvasHeight,
          0,
          0,
          offsetA,
        );
        const imageBPos = calculateCoverFitPosition(
          imageB,
          canvasWidth,
          canvasHeight,
          0,
          0,
          offsetB,
        );

        const topLeftTrianglePath = Skia.Path.Make();
        topLeftTrianglePath.moveTo(0, 0);
        topLeftTrianglePath.lineTo(canvasWidth, 0);
        topLeftTrianglePath.lineTo(0, canvasHeight);
        topLeftTrianglePath.close();

        const bottomRightTrianglePath = Skia.Path.Make();
        bottomRightTrianglePath.moveTo(canvasWidth, 0);
        bottomRightTrianglePath.lineTo(canvasWidth, canvasHeight);
        bottomRightTrianglePath.lineTo(0, canvasHeight);
        bottomRightTrianglePath.close();

        elements.push(
          <Group key="diagonal-images">
            {/* Before image (top-left triangle) */}
            {imageA && imageAPos && (
              <Group clip={topLeftTrianglePath}>
                <Image
                  image={imageA}
                  x={imageAPos.x}
                  y={imageAPos.y}
                  width={imageAPos.width}
                  height={imageAPos.height}
                />
              </Group>
            )}

            {/* After image (bottom-right triangle) */}
            {imageB && imageBPos && (
              <Group clip={bottomRightTrianglePath}>
                <Image
                  image={imageB}
                  x={imageBPos.x}
                  y={imageBPos.y}
                  width={imageBPos.width}
                  height={imageBPos.height}
                />
              </Group>
            )}

            {/* Diagonal divider line */}
            <Path
              path={`M ${canvasWidth} 0 L 0 ${canvasHeight}`}
              color="#FFFFFF"
              style="stroke"
              strokeWidth={3}
            />

            {/* Fallback placeholders if images are missing */}
            {!imageA && (
              <Path
                path={topLeftTrianglePath}
                color={themeDefinition.colors.border}
              />
            )}
            {!imageB && (
              <Path
                path={bottomRightTrianglePath}
                color={themeDefinition.colors.surface}
              />
            )}
          </Group>,
        );
      } else if (layout === 'diagonalStacked') {
        // Diagonal stacked layout - two overlapping photos arranged diagonally
        const offsetA = composition.photoAOffset || { x: 0, y: 0 };
        const offsetB = composition.photoBOffset || { x: 0, y: 0 };

        // Photo dimensions - each photo takes about 65% of canvas
        const photoWidth = canvasWidth * 0.65;
        const photoHeight = canvasHeight * 0.65;

        // Positions - before photo top-left, after photo bottom-right
        const beforeX = canvasWidth * 0.02;
        const beforeY = canvasHeight * 0.02;
        const afterX = canvasWidth * 0.33;
        const afterY = canvasHeight * 0.33;

        // Frame settings
        const frameThickness = composition.frame?.on
          ? composition.frame.thickness
          : 0;
        const frameColor = composition.frame?.color || '#9CA3AF';
        const shadowOffset = 4;
        const shadowBlur = 8;

        // Calculate cover fit positions
        const imageAPos = calculateCoverFitPosition(
          imageA,
          photoWidth,
          photoHeight,
          beforeX,
          beforeY,
          offsetA,
        );
        const imageBPos = calculateCoverFitPosition(
          imageB,
          photoWidth,
          photoHeight,
          afterX,
          afterY,
          offsetB,
        );

        const buildStackedPhoto = (
          key: string,
          image: ReturnType<typeof useImage>,
          imagePos: {
            x: number;
            y: number;
            width: number;
            height: number;
          } | null,
          x: number,
          y: number,
          rotation: number,
        ) => {
          const originX = x + photoWidth / 2;
          const originY = y + photoHeight / 2;

          return (
            <Group
              key={key}
              transform={[
                { translateX: originX },
                { translateY: originY },
                { rotate: degToRad(rotation) },
                { translateX: -photoWidth / 2 },
                { translateY: -photoHeight / 2 },
              ]}
            >
              {/* Shadow */}
              <RoundedRect
                x={shadowOffset}
                y={shadowOffset}
                width={photoWidth}
                height={photoHeight}
                r={cornerRadius}
                color="rgba(0, 0, 0, 0.3)"
              />
              {/* Frame/border */}
              {frameThickness > 0 && (
                <RoundedRect
                  x={-frameThickness}
                  y={-frameThickness}
                  width={photoWidth + frameThickness * 2}
                  height={photoHeight + frameThickness * 2}
                  r={cornerRadius}
                  color={frameColor}
                />
              )}
              {/* Photo */}
              <Group
                clip={{
                  x: 0,
                  y: 0,
                  width: photoWidth,
                  height: photoHeight,
                  rx: cornerRadius,
                  ry: cornerRadius,
                }}
              >
                {image && imagePos ? (
                  <Image
                    image={image}
                    x={imagePos.x - x}
                    y={imagePos.y - y}
                    width={imagePos.width}
                    height={imagePos.height}
                  />
                ) : (
                  <RoundedRect
                    x={0}
                    y={0}
                    width={photoWidth}
                    height={photoHeight}
                    r={cornerRadius}
                    color={themeDefinition.colors.border}
                  />
                )}
              </Group>
            </Group>
          );
        };

        elements.push(
          <Group key="diagonal-stacked">
            {/* Before photo (top-left, slight rotation) */}
            {buildStackedPhoto(
              'before-photo',
              imageA,
              imageAPos,
              beforeX,
              beforeY,
              -3,
            )}
            {/* After photo (bottom-right, slight rotation) */}
            {buildStackedPhoto(
              'after-photo',
              imageB,
              imageBPos,
              afterX,
              afterY,
              3,
            )}
          </Group>,
        );
      }

      return elements;
    };

    const renderLabels = () => {
      // Special case: Always show labels for polaroid layout regardless of show setting
      if (layout === 'polaroid') {
        const { textBefore, textAfter } = composition.labels;
        const baseSize = Math.min(canvasWidth, canvasHeight);
        const offsetX = baseSize * 0.18;
        const offsetY = baseSize * 0.02;
        const polaroidHeight = baseSize * 0.58;
        const beforePolaroidCenterX = canvasWidth / 2 - offsetX;
        const afterPolaroidCenterX = canvasWidth / 2 + offsetX;
        const beforePolaroidCenterY = canvasHeight / 2 - offsetY;
        const afterPolaroidCenterY = canvasHeight / 2 + offsetY;

        // Calculate tape positions (same as in buildPolaroid)
        const tapeHeight = polaroidHeight * 0.14;
        const beforeTapeY =
          beforePolaroidCenterY -
          polaroidHeight / 2 +
          tapeHeight / 2 -
          tapeHeight * 0.4;
        const afterTapeY =
          afterPolaroidCenterY -
          polaroidHeight / 2 +
          tapeHeight / 2 -
          tapeHeight * 0.35;
        const beforeTapeX = beforePolaroidCenterX - baseSize * 0.55 * 0.08; // polaroidWidth * 0.08
        const afterTapeX = afterPolaroidCenterX + baseSize * 0.55 * 0.05; // polaroidWidth * 0.05

        return (
          <>
            <RNText
              style={{
                position: 'absolute' as const,
                left: beforeTapeX - 55,
                top: beforeTapeY - 10,
                color: composition.labels.color || '#FFFFFF',
                fontSize: composition.labels.fontSize || 22,
                fontWeight: 'bold',
                textAlign: 'center',
                minWidth: 50,
                zIndex: 999,
                transform: [{ rotate: '-15deg' }],
              }}
            >
              {textBefore}
            </RNText>
            <RNText
              style={{
                position: 'absolute' as const,
                left: afterTapeX - 25,
                top: afterTapeY - 15,
                color: composition.labels.color || '#FFFFFF',
                fontSize: composition.labels.fontSize || 22,
                fontWeight: 'bold',
                textAlign: 'center',
                minWidth: 50,
                zIndex: 999,
                transform: [{ rotate: '10deg' }],
              }}
            >
              {textAfter}
            </RNText>
          </>
        );
      }

      if (!composition.labels.show) return null;

      const {
        textBefore,
        textAfter,
        fontSize,
        position,
        margin,
        textEffects = [],
      } = composition.labels;

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

      // Default colors: black text on white background for most templates
      // Device mockup and polaroid have their own special styling
      const defaultTextColor = '#000000';
      const defaultBackgroundColor = '#FFFFFF';

      const labelStyle = {
        fontSize: fontSize,
        fontWeight: getFontWeight(composition.labels.fontWeight) as any,
        color: composition.labels.color || defaultTextColor,
        backgroundColor:
          composition.labels.backgroundColor || defaultBackgroundColor,
        paddingHorizontal: labelPaddingHorizontal,
        paddingVertical: labelPaddingVertical,
        borderRadius: 4,
        ...effectStyles.textStyle, // Apply text effects
      };

      const renderTextWithEffects = (text: string, style: any) => {
        if (!hasMultipleLayers) {
          return (
            <RNText
              style={style}
              numberOfLines={1}
              ellipsizeMode="clip"
              allowFontScaling={false}
            >
              {text}
            </RNText>
          );
        }

        // Render multiple layers for complex effects while keeping overlap aligned
        return (
          <View style={{ position: 'relative' }}>
            {effectStyles.shadowStyle && (
              <RNText
                style={[style, effectStyles.shadowStyle, { opacity: 0.6 }]}
                numberOfLines={1}
                ellipsizeMode="clip"
                allowFontScaling={false}
              >
                {text}
              </RNText>
            )}
            {effectStyles.glowStyle && (
              <RNText
                style={[style, effectStyles.glowStyle, { opacity: 0.8 }]}
                numberOfLines={1}
                ellipsizeMode="clip"
                allowFontScaling={false}
              >
                {text}
              </RNText>
            )}
            <RNText
              style={style}
              numberOfLines={1}
              ellipsizeMode="clip"
              allowFontScaling={false}
            >
              {text}
            </RNText>
          </View>
        );
      };

      const isTop = position === 'tl' || position === 'tr';
      const isLeft = position === 'tl' || position === 'bl';
      const containerPadding = Math.max(0, margin);
      const anchorHorizontalStyle = isLeft
        ? { left: containerPadding }
        : { right: containerPadding };
      const textAlignment = isLeft ? 'left' : 'right';

      if (layout === 'side') {
        // Check for belowCenter position - labels outside/below images
        if (position === 'belowCenter') {
          const belowCenterLabelStyle = {
            ...labelStyle,
            backgroundColor: 'transparent',
            paddingHorizontal: 0,
            paddingVertical: 0,
          };

          return (
            <>
              {/* Before label - centered below left image */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: imageHeight + margin,
                  left: 0,
                  width: imageWidth,
                  alignItems: 'center',
                }}
              >
                {renderTextWithEffects(textBefore, [
                  belowCenterLabelStyle,
                  { textAlign: 'center' as const },
                ])}
              </View>

              {/* After label - centered below right image */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: imageHeight + margin,
                  left: imageWidth + composition.spacing,
                  width: imageWidth,
                  alignItems: 'center',
                }}
              >
                {renderTextWithEffects(textAfter, [
                  belowCenterLabelStyle,
                  { textAlign: 'center' as const },
                ])}
              </View>
            </>
          );
        }

        // Labels for side by side layout (overlaid on images)
        const baseContainerStyle = {
          position: 'absolute' as const,
          top: 0,
          width: imageWidth,
          height: imageHeight,
        };

        return (
          <>
            <View
              pointerEvents="none"
              style={[baseContainerStyle, { left: 0 }]}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  [isTop ? 'top' : 'bottom']: containerPadding,
                  ...anchorHorizontalStyle,
                }}
              >
                {renderTextWithEffects(textBefore, [
                  labelStyle,
                  { textAlign: textAlignment as const },
                ])}
              </View>
            </View>
            <View
              pointerEvents="none"
              style={[
                baseContainerStyle,
                { left: imageWidth + composition.spacing },
              ]}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  [isTop ? 'top' : 'bottom']: containerPadding,
                  ...anchorHorizontalStyle,
                }}
              >
                {renderTextWithEffects(textAfter, [
                  labelStyle,
                  { textAlign: textAlignment as const },
                ])}
              </View>
            </View>
          </>
        );
      } else if (layout === 'deviceMockup') {
        if (!deviceMetrics) return null;

        const { deviceWidth, deviceHeight, deviceY, leftX, rightX, notch } =
          deviceMetrics;
        const containerBase = {
          position: 'absolute' as const,
          top: deviceY,
          width: deviceWidth,
          height: deviceHeight,
        };

        const labelWrapperStyle = {
          position: 'absolute' as const,
          top: notch.y,
          width: '100%',
          alignItems: 'center' as const,
        };

        // Fixed font size for device mockup labels - not adjustable
        const deviceMockupFontSize = 19;

        const deviceLabelStyle = {
          ...labelStyle,
          fontSize: deviceMockupFontSize,
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          paddingVertical: 0,
          textAlign: 'center' as const,
          color: '#E9EEFF',
        };

        const dynamicIslandStyle = {
          width: notch.width,
          height: notch.height,
          borderRadius: notch.radius,
          backgroundColor: 'rgba(12, 15, 21, 0.94)',
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          paddingHorizontal: Math.max(6, notch.width * 0.12),
        };

        const labelOffsetX = -8; // shift labels left
        const labelOffsetY = 6; // shift labels down

        const deviceLabelConfigs = [
          {
            key: 'before',
            text: textBefore,
            left: leftX + labelOffsetX,
            rotation: -6,
            isLeft: true,
          },
          {
            key: 'after',
            text: textAfter,
            left: rightX + labelOffsetX,
            rotation: 6,
            isLeft: false,
          },
        ];

        return (
          <>
            {deviceLabelConfigs.map(config => {
              const adjustedLabelY = config.isLeft
                ? notch.y - deviceHeight * 0.05 + labelOffsetY
                : notch.y + labelOffsetY;

              return (
                <View
                  key={config.key}
                  pointerEvents="none"
                  style={[containerBase, { left: config.left }]}
                >
                  <View
                    pointerEvents="none"
                    style={[
                      {
                        position: 'absolute' as const,
                        top: adjustedLabelY,
                        width: '100%',
                        alignItems: 'center' as const,
                      },
                      {
                        transform: [
                          { translateX: deviceWidth / 2 },
                          { translateY: notch.height / 2 },
                          { rotate: `${config.rotation}deg` },
                          { translateX: -deviceWidth / 2 },
                          { translateY: -notch.height / 2 },
                        ],
                      },
                    ]}
                  >
                    <View style={dynamicIslandStyle}>
                      {renderTextWithEffects(config.text, [
                        deviceLabelStyle,
                        {
                          maxWidth:
                            notch.width - Math.max(12, notch.width * 0.24),
                        },
                      ])}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        );
      } else if (layout === 'vertical') {
        // Labels for vertical layout
        const baseContainerStyle = {
          position: 'absolute' as const,
          left: 0,
          width: canvasWidth,
          height: imageHeight,
        };

        return (
          <>
            <View pointerEvents="none" style={[baseContainerStyle, { top: 0 }]}>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  [isTop ? 'top' : 'bottom']: containerPadding,
                  ...anchorHorizontalStyle,
                }}
              >
                {renderTextWithEffects(textBefore, [
                  labelStyle,
                  { textAlign: textAlignment as const },
                ])}
              </View>
            </View>
            <View
              pointerEvents="none"
              style={[
                baseContainerStyle,
                { top: imageHeight + composition.spacing },
              ]}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  [isTop ? 'top' : 'bottom']: containerPadding,
                  ...anchorHorizontalStyle,
                }}
              >
                {renderTextWithEffects(textAfter, [
                  labelStyle,
                  { textAlign: textAlignment as const },
                ])}
              </View>
            </View>
          </>
        );
      } else if (layout === 'stacked') {
        // Labels in the bottom bar
        const estimatedLabelHeight = fontSize + 16; // fontSize + padding
        const barHeight = 40;
        const beforeLabelY =
          canvasHeight - Math.max(barHeight, estimatedLabelHeight + 8);
        const maxLabelWidth = canvasWidth / 2 - 20;

        return (
          <>
            {renderTextWithEffects(textBefore, [
              labelStyle,
              {
                left: 10,
                top: beforeLabelY,
                maxWidth: maxLabelWidth,
                textAlign: 'left' as const,
              },
            ])}
            {renderTextWithEffects(textAfter, [
              labelStyle,
              {
                right: 10,
                top: beforeLabelY,
                maxWidth: maxLabelWidth,
                textAlign: 'right' as const,
              },
            ])}
          </>
        );
      } else if (layout === 'diagonal') {
        // Labels for diagonal layout - Before in top-left, After in bottom-right
        const margin = composition.labels.margin;

        return (
          <>
            {renderTextWithEffects(textBefore, [
              labelStyle,
              {
                position: 'absolute' as const,
                top: margin,
                left: margin,
                textAlign: 'left' as const,
              },
            ])}
            {renderTextWithEffects(textAfter, [
              labelStyle,
              {
                position: 'absolute' as const,
                bottom: margin,
                right: margin,
                textAlign: 'right' as const,
              },
            ])}
          </>
        );
      } else if (layout === 'diagonalStacked') {
        // Labels for diagonal stacked layout - position relative to each photo
        const photoWidth = canvasWidth * 0.65;
        const photoHeight = canvasHeight * 0.65;
        const beforeX = canvasWidth * 0.02;
        const beforeY = canvasHeight * 0.02;
        const afterX = canvasWidth * 0.33;
        const afterY = canvasHeight * 0.33;

        // Calculate label positions based on position setting
        const getBeforeLabelStyle = () => {
          const baseStyle: any = { position: 'absolute' as const };

          // Vertical position
          if (position === 'tl' || position === 'tr') {
            baseStyle.top = beforeY + containerPadding;
          } else {
            // For bottom positions, place at the bottom of the Before photo
            baseStyle.top =
              beforeY + photoHeight - fontSize - containerPadding - 8;
          }

          // Horizontal position
          if (position === 'tl' || position === 'bl') {
            baseStyle.left = beforeX + containerPadding;
            baseStyle.textAlign = 'left';
          } else {
            // For right positions, place at the right edge of the visible area (before After photo starts)
            baseStyle.right = canvasWidth - afterX + containerPadding;
            baseStyle.textAlign = 'right';
          }

          return baseStyle;
        };

        const getAfterLabelStyle = () => {
          const baseStyle: any = { position: 'absolute' as const };

          // Vertical position
          if (position === 'tl' || position === 'tr') {
            baseStyle.top = afterY + containerPadding;
          } else {
            baseStyle.top =
              afterY + photoHeight - containerPadding - fontSize - 8;
          }

          // Horizontal position
          if (position === 'tl' || position === 'bl') {
            baseStyle.left = afterX + containerPadding;
            baseStyle.textAlign = 'left';
          } else {
            baseStyle.right =
              canvasWidth - (afterX + photoWidth) + containerPadding;
            baseStyle.textAlign = 'right';
          }

          return baseStyle;
        };

        const beforeLabelStyle = getBeforeLabelStyle();
        const afterLabelStyle = getAfterLabelStyle();

        return (
          <>
            {renderTextWithEffects(textBefore, [labelStyle, beforeLabelStyle])}
            {renderTextWithEffects(textAfter, [labelStyle, afterLabelStyle])}
          </>
        );
      } else if (layout === 'slider') {
        // Labels for slider reveal layout - Before on right side, After on left side
        const sliderPos = composition.sliderPosition ?? 0.5;
        const sliderX = canvasWidth * sliderPos;

        return (
          <>
            {/* After label (left side of slider) */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute' as const,
                top: 0,
                left: 0,
                width: sliderX,
                height: canvasHeight,
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  [isTop ? 'top' : 'bottom']: containerPadding,
                  left: containerPadding,
                }}
              >
                {renderTextWithEffects(textAfter, [
                  labelStyle,
                  { textAlign: 'left' as const },
                ])}
              </View>
            </View>
            {/* Before label (right side of slider) */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute' as const,
                top: 0,
                left: sliderX,
                width: canvasWidth - sliderX,
                height: canvasHeight,
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  [isTop ? 'top' : 'bottom']: containerPadding,
                  right: containerPadding,
                }}
              >
                {renderTextWithEffects(textBefore, [
                  labelStyle,
                  { textAlign: 'right' as const },
                ])}
              </View>
            </View>
          </>
        );
      }

      return null;
    };

    const renderBackground = () => {
      if (composition.background.type === 'transparent') return null;

      if (composition.background.type === 'gradient') {
        const colors = composition.background.colors.length
          ? composition.background.colors
          : [themeDefinition.colors.canvasBg, themeDefinition.colors.canvasBg];
        const direction = composition.background.direction || 'vertical';
        let start = vec(0, 0);
        let end = vec(0, canvasHeight);

        switch (direction) {
          case 'horizontal':
            start = vec(0, 0);
            end = vec(canvasWidth, 0);
            break;
          case 'diagonal':
            start = vec(0, 0);
            end = vec(canvasWidth, canvasHeight);
            break;
          case 'vertical':
          default:
            start = vec(0, 0);
            end = vec(0, canvasHeight);
            break;
        }

        return (
          <RoundedRect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            r={canvasCornerRadius}
          >
            <LinearGradient start={start} end={end} colors={colors} />
          </RoundedRect>
        );
      }

      return (
        <RoundedRect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          r={canvasCornerRadius}
          color={
            composition.background.colors[0] || themeDefinition.colors.canvasBg
          }
        />
      );
    };

    const renderFrame = () => {
      if (!composition.frame?.on) return null;

      // Stroke is drawn centered on the path, so offset by half the stroke width
      // to keep the frame fully inside the canvas
      const strokeOffset = composition.frame.thickness / 2;

      return (
        <RoundedRect
          x={strokeOffset}
          y={strokeOffset}
          width={canvasWidth - composition.frame.thickness}
          height={canvasHeight - composition.frame.thickness}
          r={composition.cornerRadius}
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
      <View
        style={{
          width: canvasWidth,
          height: canvasHeight,
          position: 'relative',
        }}
      >
        <Canvas
          ref={ref}
          style={{ width: canvasWidth, height: canvasHeight }}
          pointerEvents="none"
        >
          <Group clip={clipRect}>
            {renderBackground()}
            {renderImages()}
            {renderWatermark()}
          </Group>
          {renderFrame()}
        </Canvas>
        {renderLabels()}
      </View>
    );
  },
);

CompositionCanvas.displayName = 'CompositionCanvas';

export default CompositionCanvas;
