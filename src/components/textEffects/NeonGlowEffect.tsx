import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TextStyle, View } from 'react-native';

const AnimatedText = Animated.createAnimatedComponent(Text);

export interface NeonGlowEffectProps {
  text: string;
  fontSize: number;
  glowColor: string;
  intensity: number;
  spread: number;
  fontFamily?: string;
  fontWeight?: TextStyle['fontWeight'];
  textAlign?: TextStyle['textAlign'];
  lineHeight?: number;
  pulse?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const NeonGlowEffect: React.FC<NeonGlowEffectProps> = ({
  text,
  fontSize,
  glowColor,
  intensity,
  spread,
  fontFamily,
  fontWeight,
  textAlign = 'center',
  lineHeight,
  pulse = false,
}) => {
  const resolvedLineHeight = useMemo(() => lineHeight ?? fontSize * 1.35, [lineHeight, fontSize]);
  const baseGlow = useMemo(() => clamp(0.35 + intensity * 0.45, 0.25, 0.95), [intensity]);
  const glowValue = useRef(new Animated.Value(baseGlow)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    glowValue.setValue(baseGlow);

    if (!pulse) {
      animationRef.current?.stop();
      animationRef.current = null;
      return;
    }

    const minOpacity = clamp(baseGlow - 0.2, 0.15, 0.9);
    const maxOpacity = clamp(baseGlow + 0.2, 0.3, 0.98);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowValue, {
          toValue: maxOpacity,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowValue, {
          toValue: minOpacity,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animationRef.current?.stop();
    animationRef.current = animation;
    animation.start();

    return () => {
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [baseGlow, pulse, glowValue]);

  const midOpacity = useMemo(
    () =>
      glowValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, clamp(baseGlow + 0.25, 0.4, 1)],
      }),
    [glowValue, baseGlow],
  );

  const innerOpacity = useMemo(
    () =>
      glowValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, clamp(baseGlow + 0.35, 0.5, 1)],
      }),
    [glowValue, baseGlow],
  );

  const baseTextStyle: TextStyle = {
    fontSize,
    fontFamily,
    fontWeight,
    textAlign,
    lineHeight: resolvedLineHeight,
    includeFontPadding: false,
  };

  return (
    <View pointerEvents="none" style={styles.container}>
      <AnimatedText
        style={[
          styles.layer,
          baseTextStyle,
          {
            color: glowColor,
            opacity: glowValue,
            textShadowColor: glowColor,
            textShadowRadius: spread * 1.4,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {text}
      </AnimatedText>
      <AnimatedText
        style={[
          styles.layer,
          baseTextStyle,
          {
            color: glowColor,
            opacity: midOpacity,
            textShadowColor: glowColor,
            textShadowRadius: spread,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {text}
      </AnimatedText>
      <AnimatedText
        style={[
          styles.layer,
          baseTextStyle,
          {
            color: '#FFFFFF',
            opacity: innerOpacity,
            textShadowColor: glowColor,
            textShadowRadius: Math.max(2, spread * 0.45),
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {text}
      </AnimatedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    position: 'absolute',
    width: '100%',
  },
});

export default NeonGlowEffect;
