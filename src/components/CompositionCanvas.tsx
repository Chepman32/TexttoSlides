import React, { useMemo, forwardRef, ReactNode } from 'react';
import { Dimensions, View, Text as RNText } from 'react-native';
import { renderTextEffects, needsMultipleLayers } from '../utils/textEffectsRenderer';
import { Canvas, Image, useImage, Group, RoundedRect, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import { CompositionState } from '../types/composer';
import { useTheme } from '../context/ThemeContext';

interface CompositionCanvasProps {
  composition: CompositionState;
}

const { width: screenWidth } = Dimensions.get('window');
const canvasWidth = screenWidth - 32; // 16px margin on each side

const degToRad = (angle: number) => (angle * Math.PI) / 180;

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

    if (calculatedLayout === 'deviceMockup') {
      // Device mockup layout uses its own sizing for screens
      calculatedImageWidth = canvasWidth * 0.42;
      calculatedImageHeight = canvasHeight * 0.88;
    }

    return { canvasHeight: calculatedCanvasHeight, imageWidth: calculatedImageWidth, imageHeight: calculatedImageHeight, layout: calculatedLayout };
  }, [composition.aspect, composition.layout, composition.spacing]);

  // Text effects will be handled directly on the label text components

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
            height={layout === 'side' || layout === 'vertical' ? imageHeight : canvasHeight}
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

      const deviceConfigs = [
        { key: 'device-before', image: imageA, topLeftX: leftX, rotation: -6, isLeft: true },
        { key: 'device-after', image: imageB, topLeftX: rightX, rotation: 6, isLeft: false },
      ];

      const buildDevice = (
        key: string,
        image: ReturnType<typeof useImage>,
        topLeftX: number,
        rotationDeg: number,
        isLeft: boolean = false
      ) => {
        const originX = topLeftX + deviceWidth / 2;
        const originY = deviceY + deviceHeight / 2;

        // Keep both notches identical vertically but offset horizontally so rotations still look centered
        const loweredNotchY = bezelY + screenHeight * 0.18;
        const adjustedNotchY = loweredNotchY;
        const notchHorizontalOffset = deviceWidth * 0.12;
        const adjustedNotchX = isLeft ? notch.x - notchHorizontalOffset : notch.x + notchHorizontalOffset;

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
              {image ? (
                <Image
                  image={image}
                  fit="cover"
                  x={bezelX}
                  y={bezelY}
                  width={screenWidth}
                  height={screenHeight}
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
            buildDevice(config.key, config.image, config.topLeftX, config.rotation, config.isLeft)
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

      const buildPolaroid = (
        key: string,
        image: ReturnType<typeof useImage>,
        centerX: number,
        centerY: number,
        rotationDeg: number,
        tapeConfig: { shiftX: number; shiftY: number; rotationDeg: number }
      ) => (
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
            {image ? (
              <Image
                image={image}
                fit="cover"
                x={photoX}
                y={photoY}
                width={photoWidth}
                height={photoHeight}
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
              { translateY: -polaroidHeight / 2 + tapeHeight / 2 + tapeConfig.shiftY },
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

      const offsetX = baseSize * 0.18;
      const offsetY = baseSize * 0.02;

      return [
        buildPolaroid(
          'before-polaroid',
          imageA,
          canvasWidth / 2 - offsetX,
          canvasHeight / 2 - offsetY,
          -8,
          {
            shiftX: -polaroidWidth * 0.08,
            shiftY: -tapeHeight * 0.4,
            rotationDeg: -6,
          }
        ),
        buildPolaroid(
          'after-polaroid',
          imageB,
          canvasWidth / 2 + offsetX,
          canvasHeight / 2 + offsetY,
          5,
          {
            shiftX: polaroidWidth * 0.05,
            shiftY: -tapeHeight * 0.35,
            rotationDeg: 8,
          }
        ),
      ];
    } else if (layout === 'diagonal') {
      // Diagonal split layout - images split along diagonal line from top-left to bottom-right
      // Using separate clipped groups for each triangle
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
          {imageA && (
            <Group clip={topLeftTrianglePath}>
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

          {/* After image (bottom-right triangle) */}
          {imageB && (
            <Group clip={bottomRightTrianglePath}>
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
        </Group>
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
      const beforeTapeY = beforePolaroidCenterY - (polaroidHeight / 2) + (tapeHeight / 2) - (tapeHeight * 0.4);
      const afterTapeY = afterPolaroidCenterY - (polaroidHeight / 2) + (tapeHeight / 2) - (tapeHeight * 0.35);
      const beforeTapeX = beforePolaroidCenterX - (baseSize * 0.55 * 0.08); // polaroidWidth * 0.08
      const afterTapeX = afterPolaroidCenterX + (baseSize * 0.55 * 0.05); // polaroidWidth * 0.05

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
      fontSize: fontSize,
      fontWeight: getFontWeight(composition.labels.fontWeight) as any,
      color: composition.labels.color,
      backgroundColor: themeDefinition.colors.labelBg,
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
      // Labels for side by side layout
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
            style={[
              baseContainerStyle,
              { left: 0 },
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

      const { deviceWidth, deviceHeight, deviceY, leftX, rightX, notch } = deviceMetrics;
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

      const dynamicFontSize = Math.max(12, Math.round(fontSize * 0.9));

      const deviceLabelStyle = {
        ...labelStyle,
        fontSize: dynamicFontSize,
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

      const deviceLabelConfigs = [
        { key: 'before', text: textBefore, left: leftX, rotation: -6, isLeft: true },
        { key: 'after', text: textAfter, left: rightX, rotation: 6, isLeft: false },
      ];

      return (
        <>
          {deviceLabelConfigs.map(config => {
            const adjustedLabelY = config.isLeft ? notch.y - deviceHeight * 0.05 : notch.y;

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
                      { maxWidth: notch.width - Math.max(12, notch.width * 0.24) },
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
          <View
            pointerEvents="none"
            style={[
              baseContainerStyle,
              { top: 0 },
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
              textAlign: 'left' as const,
            }
          ])}
          {renderTextWithEffects(textAfter, [
            labelStyle,
            {
              right: 10,
              top: beforeLabelY,
              maxWidth: maxLabelWidth,
              textAlign: 'right' as const,
            }
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
            }
          ])}
          {renderTextWithEffects(textAfter, [
            labelStyle,
            {
              position: 'absolute' as const,
              bottom: margin,
              right: margin,
              textAlign: 'right' as const,
            }
          ])}
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
});

CompositionCanvas.displayName = 'CompositionCanvas';

export default CompositionCanvas;
