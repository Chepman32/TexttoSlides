import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Text as SkiaText,
  useFont,
  vec,
  Group,
  LinearGradient,
  Rect,
  useClock,
  useValue,
  Skia,
} from '@shopify/react-native-skia';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';

type RootStackParamList = {
  Home: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Particle system for explosion effect
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const AnimatedSplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const particlesProgress = useSharedValue(0);
  const backgroundGradientProgress = useSharedValue(0);

  // Particle system state
  const particles = useSharedValue<Particle[]>([]);

  // Initialize particles for explosion effect
  const initializeParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const colors = ['#007AFF', '#34C759', '#FF3B30', '#FFCC00', '#FF9500', '#AF52DE'];

    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = 3 + Math.random() * 5;
      newParticles.push({
        x: screenWidth / 2,
        y: screenHeight / 2 - 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 1,
        maxLife: 1,
      });
    }
    return newParticles;
  }, []);

  const navigateToHome = useCallback(() => {
    navigation.replace('Home' as any);
  }, [navigation]);

  useEffect(() => {
    // Logo entrance animation
    logoScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 20, stiffness: 200 })
    );

    // Logo rotation animation
    logoRotation.value = withSequence(
      withTiming(Math.PI * 2, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
    );

    // Text fade in
    textOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));

    // Background gradient animation
    backgroundGradientProgress.value = withTiming(1, {
      duration: 2000,
      easing: Easing.inOut(Easing.ease)
    });

    // Particle explosion after 1.5 seconds
    setTimeout(() => {
      particles.value = initializeParticles();
      particlesProgress.value = withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.cubic)
      });
    }, 1500);

    // Navigate after animation completes
    setTimeout(() => {
      runOnJS(navigateToHome)();
    }, 3000);
  }, []);

  // Update particles physics
  const updateParticles = () => {
    const currentParticles = particles.value;
    if (currentParticles.length === 0) return [];

    const progress = particlesProgress.value;

    return currentParticles.map(p => ({
      ...p,
      x: p.x + p.vx * progress * 10,
      y: p.y + p.vy * progress * 10 + (progress * progress * 5), // Add gravity
      life: 1 - progress,
    }));
  };

  // Animated container style
  const containerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      particlesProgress.value,
      [0.7, 1],
      [1, 0]
    );

    return {
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Animated gradient background */}
        <Rect x={0} y={0} width={screenWidth} height={screenHeight}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(screenWidth, screenHeight)}
            colors={['#E8F4FF', '#D0E7FF']}
          />
        </Rect>

        {/* Logo group with animations */}
        <Group
          transform={[
            { translateX: screenWidth / 2 },
            { translateY: screenHeight / 2 - 100 },
          ]}>

          {/* Main logo circle */}
          <Circle cx={0} cy={0} r={60}>
            <LinearGradient
              start={vec(-60, -60)}
              end={vec(60, 60)}
              colors={['#007AFF', '#00C7BE']}
            />
          </Circle>

          {/* Inner decorative circles */}
          <Circle cx={0} cy={0} r={45} color="rgba(255,255,255,0.3)" />
          <Circle cx={0} cy={0} r={30} color="rgba(255,255,255,0.2)" />

          {/* Logo text */}
          <SkiaText
            x={-25}
            y={8}
            text="T2S"
            color="white"
          />
        </Group>

        {/* App title */}
        <SkiaText
          x={screenWidth / 2 - 80}
          y={screenHeight / 2 + 20}
          text="Text to Slides"
          color="#007AFF"
          familyName="Arial"
          size={32}
          style="bold"
        />

        {/* Subtitle */}
        <SkiaText
          x={screenWidth / 2 - 120}
          y={screenHeight / 2 + 50}
          text="Create beautiful presentations"
          color="#666666"
          familyName="Arial"
          size={16}
        />

        {/* Particle explosion effect */}
        {updateParticles().map((particle, index) => (
          <Circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r={particle.size * particle.life}
            color={particle.color}
            opacity={particle.life}
          />
        ))}
      </Canvas>

      <Animated.View style={[styles.overlay, containerStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  canvas: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});

export default AnimatedSplashScreen;