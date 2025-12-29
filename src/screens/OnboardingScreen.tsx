import React, { useState, useRef, useMemo } from 'react';
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
import LiquidGlassButton from '../components/LiquidGlassButton';
import { useLanguage } from '../context/LanguageContext';
import { getOnboardingImage } from '../utils/onboardingImages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type OnboardingNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t, currentLanguage } = useLanguage();

  // Generate slides with language-specific images
  const onboardingSlides = useMemo(() => [
    { image: getOnboardingImage(1, currentLanguage) },
    { image: getOnboardingImage(2, currentLanguage) },
    { image: getOnboardingImage(3, currentLanguage) },
    { image: getOnboardingImage(4, currentLanguage) },
    { image: getOnboardingImage(5, currentLanguage) },
  ], [currentLanguage]);

  const isLastSlide = currentIndex === onboardingSlides.length - 1;

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
        {onboardingSlides.map((slide, index) => (
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
          <Text style={styles.skipText}>{t('skip')}</Text>
        </TouchableOpacity>
      )}

      {/* Page Indicators */}
      <View
        style={[styles.indicatorContainer, { bottom: isLastSlide ? 120 : 50 }]}
      >
        {onboardingSlides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      {/* Get Started Button */}
      {isLastSlide && (
        <View
          style={[
            styles.getStartedButtonContainer,
            { bottom: insets.bottom + 50 },
          ]}
        >
          <LiquidGlassButton
            title={t('get_started')}
            onPress={handleComplete}
            animated={true}
          />
        </View>
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
});

export default OnboardingScreen;
