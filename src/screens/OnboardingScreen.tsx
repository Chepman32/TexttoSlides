import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import FeedbackService from '../services/FeedbackService';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type OnboardingNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

const ONBOARDING_SLIDES = [
  {
    image: require('../assets/images/onboarding/01_show-your-glow-up_1536x2304.png'),
  },
  {
    image: require('../assets/images/onboarding/02_slide-to-reveal-the-magic_1536x2304.png'),
  },
  {
    image: require('../assets/images/onboarding/03_your-transformation-your-style_1536x2304.png'),
  },
  {
    image: require('../assets/images/onboarding/05_drag-drop-perfect_1536x2304.png'),
  },
  {
    image: require('../assets/images/onboarding/06_templates-for-the-impatient_1536x2304.png'),
  },
  {
    image: require('../assets/images/onboarding/08_pick-up-where-you-left-off_1536x2304.png'),
  },
  {
    image: require('../assets/images/onboarding/09_export-in-4k-flex-in-style_1536x2304.png'),
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  // Animated gradient opacity for crossfade effect
  const gradientOpacity = useSharedValue(0);

  useEffect(() => {
    gradientOpacity.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const gradient1Style = useAnimatedStyle(() => ({
    opacity: 1 - gradientOpacity.value,
  }));

  const gradient2Style = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleComplete = () => {
    FeedbackService.buttonTap();
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {ONBOARDING_SLIDES.map((slide, index) => (
          <View key={index} style={styles.slideContainer}>
            <Image
              source={slide.image}
              style={styles.slideImage}
              resizeMode="contain"
            />
          </View>
        ))}
      </ScrollView>

      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 16 }]}
          onPress={handleComplete}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Page Indicators */}
      <View
        style={[styles.indicatorContainer, { bottom: isLastSlide ? 120 : 50 }]}
      >
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      {/* Get Started Button */}
      {isLastSlide && (
        <TouchableOpacity
          style={[
            styles.getStartedButtonContainer,
            { bottom: insets.bottom },
          ]}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <View style={styles.getStartedButton}>
            {/* Gradient Layer 1 - Purple to Blue */}
            <Animated.View style={[StyleSheet.absoluteFill, gradient1Style]}>
              <LinearGradient
                colors={['#A855F7', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Gradient Layer 2 - Pink to Cyan */}
            <Animated.View style={[StyleSheet.absoluteFill, gradient2Style]}>
              <LinearGradient
                colors={['#EC4899', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Text style={styles.getStartedText}>Get Started</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  indicatorContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
  },
  getStartedButtonContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
  },
  getStartedButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default OnboardingScreen;
