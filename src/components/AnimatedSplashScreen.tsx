/**
 * Animated Splash Screen with Triangle Particle Effect
 * - Breaks the app icon into ~500 triangle particles
 * - Particles animate from random positions to form the icon (1 sec)
 * - Icon zooms in rapidly (0.5 sec) then dismisses
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import {
  Canvas,
  useImage,
  ImageShader,
  Vertices,
  vec,
  useValue,
  runTiming,
  Easing,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing as REasing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ICON_SIZE = 200;
const GRID_SIZE = 22; // ~22x22 grid = ~484 cells = ~968 triangles
const ANIMATION_DURATION = 1000; // 1 second for assembly
const ZOOM_DURATION = 500; // 0.5 seconds for zoom

interface Triangle {
  finalVertices: [number, number, number, number, number, number];
  texCoords: [number, number, number, number, number, number];
  startVertices: [number, number, number, number, number, number];
}

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

// Interpolate helper
const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const image = useImage(
    require('../assets/icons/appIcon/icon_2_white_blue_1024.png'),
  );
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Generate triangles for the mesh
  const triangles = useMemo(() => {
    const result: Triangle[] = [];
    const cellSize = ICON_SIZE / GRID_SIZE;
    const offsetX = (SCREEN_WIDTH - ICON_SIZE) / 2;
    const offsetY = (SCREEN_HEIGHT - ICON_SIZE) / 2;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;

        // Texture coordinates (0-1 range)
        const u0 = col / GRID_SIZE;
        const v0 = row / GRID_SIZE;
        const u1 = (col + 1) / GRID_SIZE;
        const v1 = (row + 1) / GRID_SIZE;

        // Generate random start positions (scattered around screen)
        const generateRandomStart = (): [number, number] => {
          const angle = Math.random() * Math.PI * 2;
          const distance =
            SCREEN_WIDTH * 0.8 + Math.random() * SCREEN_WIDTH * 0.5;
          return [
            SCREEN_WIDTH / 2 + Math.cos(angle) * distance,
            SCREEN_HEIGHT / 2 + Math.sin(angle) * distance,
          ];
        };

        // Triangle 1 (top-left)
        const s1_0 = generateRandomStart();
        const s1_1 = generateRandomStart();
        const s1_2 = generateRandomStart();
        result.push({
          finalVertices: [x, y, x + cellSize, y, x, y + cellSize],
          texCoords: [u0, v0, u1, v0, u0, v1],
          startVertices: [s1_0[0], s1_0[1], s1_1[0], s1_1[1], s1_2[0], s1_2[1]],
        });

        // Triangle 2 (bottom-right)
        const s2_0 = generateRandomStart();
        const s2_1 = generateRandomStart();
        const s2_2 = generateRandomStart();
        result.push({
          finalVertices: [
            x + cellSize,
            y,
            x + cellSize,
            y + cellSize,
            x,
            y + cellSize,
          ],
          texCoords: [u1, v0, u1, v1, u0, v1],
          startVertices: [s2_0[0], s2_0[1], s2_1[0], s2_1[1], s2_2[0], s2_2[1]],
        });
      }
    }
    return result;
  }, []);

  // Compute current vertices based on progress
  const { vertices, textures, indices } = useMemo(() => {
    const verts: ReturnType<typeof vec>[] = [];
    const texs: ReturnType<typeof vec>[] = [];
    const inds: number[] = [];

    triangles.forEach((triangle, index) => {
      const baseIndex = index * 3;

      for (let i = 0; i < 6; i += 2) {
        const x = lerp(
          triangle.startVertices[i],
          triangle.finalVertices[i],
          assemblyProgress,
        );
        const y = lerp(
          triangle.startVertices[i + 1],
          triangle.finalVertices[i + 1],
          assemblyProgress,
        );
        verts.push(vec(x, y));
        texs.push(vec(triangle.texCoords[i], triangle.texCoords[i + 1]));
      }

      inds.push(baseIndex, baseIndex + 1, baseIndex + 2);
    });

    return { vertices: verts, textures: texs, indices: inds };
  }, [triangles, assemblyProgress]);

  const handleAnimationComplete = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  useEffect(() => {
    // Assembly animation using requestAnimationFrame for smooth updates
    const startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAssemblyProgress(eased);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    // After assembly, zoom in
    scale.value = withDelay(
      ANIMATION_DURATION,
      withTiming(15, {
        duration: ZOOM_DURATION,
        easing: REasing.in(REasing.cubic),
      }),
    );

    // Fade out during zoom
    opacity.value = withDelay(
      ANIMATION_DURATION + ZOOM_DURATION * 0.3,
      withTiming(
        0,
        {
          duration: ZOOM_DURATION * 0.7,
          easing: REasing.linear,
        },
        finished => {
          if (finished) {
            runOnJS(handleAnimationComplete)();
          }
        },
      ),
    );

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [scale, opacity, handleAnimationComplete]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!image) {
    return (
      <View style={styles.container}>
        <View style={styles.background} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <Animated.View style={[styles.canvasContainer, animatedContainerStyle]}>
        <Canvas style={styles.canvas}>
          <Vertices vertices={vertices} textures={textures} indices={indices}>
            <ImageShader
              image={image}
              fit="fill"
              rect={{ x: 0, y: 0, width: 1, height: 1 }}
            />
          </Vertices>
        </Canvas>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  canvasContainer: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});

export default AnimatedSplashScreen;
