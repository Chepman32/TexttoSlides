import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
  Easing,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import FeedbackService from '../services/FeedbackService';

interface LiquidGlassButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  animated?: boolean;
}

export default function LiquidGlassButton({
  title,
  onPress,
  style,
  animated = false,
}: LiquidGlassButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -400,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated, translateX]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    FeedbackService.buttonTap();
    onPress();
  };

  const renderGradientSvg = (id: string) => (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={`grad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
          <Stop offset="30%" stopColor="#818cf8" stopOpacity="1" />
          <Stop offset="60%" stopColor="#a78bfa" stopOpacity="1" />
          <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id={`shine_${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#grad_${id})`} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#shine_${id})`} />
    </Svg>
  );

  const renderAnimatedGradientSvg = () => (
    <Svg width={800} height="100%">
      <Defs>
        <LinearGradient id="animGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
          <Stop offset="12.5%" stopColor="#6d9ffa" stopOpacity="1" />
          <Stop offset="25%" stopColor="#818cf8" stopOpacity="1" />
          <Stop offset="37.5%" stopColor="#a78bfa" stopOpacity="1" />
          <Stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
          <Stop offset="62.5%" stopColor="#a78bfa" stopOpacity="1" />
          <Stop offset="75%" stopColor="#818cf8" stopOpacity="1" />
          <Stop offset="87.5%" stopColor="#6d9ffa" stopOpacity="1" />
          <Stop offset="100%" stopColor="#60a5fa" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="800" height="100%" fill="url(#animGrad)" />
    </Svg>
  );

  const renderShineOverlay = (id: string) => (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient
          id={`shineOver_${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={`url(#shineOver_${id})`}
      />
    </Svg>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
    >
      <Animated.View
        style={[styles.container, style, { transform: [{ scale }], opacity }]}
      >
        <View style={styles.glassContainer}>
          {!animated && renderGradientSvg('static')}
          {animated && (
            <>
              <View style={styles.animatedGradientContainer}>
                <Animated.View
                  style={[
                    styles.movingGradient,
                    { transform: [{ translateX }] },
                  ]}
                >
                  {renderAnimatedGradientSvg()}
                </Animated.View>
              </View>
              {renderShineOverlay('anim')}
            </>
          )}
          <View style={styles.border} />
          <Text style={styles.text}>{title}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  glassContainer: {
    height: 56,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  animatedGradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  movingGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 800,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
});
