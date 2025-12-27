import React, { useState, useRef } from 'react';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const ONBOARDING_SLIDES = [
  { image: require('../assets/images/onboarding/01_show-your-glow-up_1536x2304.png') },
  { image: require('../assets/images/onboarding/02_slide-to-reveal-the-magic_1536x2304.png') },
  { image: require('../assets/images/onboarding/03_your-transformation-your-style_1536x2304.png') },
  { image: require('../assets/images/onboarding/05_drag-drop-perfect_1536x2304.png') },
  { image: require('../assets/images/onboarding/06_templates-for-the-impatient_1536x2304.png') },
  { image: require('../assets/images/onboarding/08_pick-up-where-you-left-off_1536x2304.png') },
  { image: require('../assets/images/onboarding/09_export-in-4k-flex-in-style_1536x2304.png') },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

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
            <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
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
      <View style={[styles.indicatorContainer, { bottom: isLastSlide ? 120 : 50 }]}>
        {ONBOARDING_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Get Started Button */}
      {isLastSlide && (
        <TouchableOpacity
          style={[styles.getStartedButton, { bottom: insets.bottom + 50 }]}
          onPress={handleComplete}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
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
  getStartedButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  getStartedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
