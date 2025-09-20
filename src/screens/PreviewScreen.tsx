import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Create animated FlatList component
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import FeedbackService from '../services/FeedbackService';
import ExportService from '../services/ExportService';
import IAPService from '../services/IAPService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  DEFAULT_SLIDE_FONT_ID,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  LEGACY_SYSTEM_FONT_ID,
} from '../constants/fonts';

type RootStackParamList = {
  Home: undefined;
  Editor: { text: string; images: string[] };
  Preview: { slides: any[] };
};

type PreviewRouteProp = RouteProp<RootStackParamList, 'Preview'>;
type PreviewNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const PreviewScreen: React.FC = () => {
  const route = useRoute<PreviewRouteProp>();
  const navigation = useNavigation<PreviewNavigationProp>();
  const { slides } = route.params;
  const insets = useSafeAreaInsets();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRefs = useRef<View[]>([]);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const slideSize = Math.min(screenWidth * 0.99, screenWidth - 10); // Use 99% of screen width
  
  // Calculate available height for image container
  const headerHeight = Math.max(insets.top, 20) + 60; // Safe area + title height
  const exportButtonHeight = 100; // Height for export button + margins
  const availableHeight = screenHeight - headerHeight - exportButtonHeight;
  const imageContainerHeight = availableHeight; // Use available height without minimum constraint

  useEffect(() => {
    IAPService.isPro().then(setIsProUser);
  }, []);
  
  const handleExport = async () => {
    if (isExporting) return;

    FeedbackService.buttonTap();
    setIsExporting(true);

    try {
      // Use the ExportService to handle export with watermark
      const result = await ExportService.exportSlides(
        slides,
        slideRefs.current.map(ref => ({ current: ref })),
        {
          addWatermark: !isProUser,
          watermarkText: 'Made with Text to Slides',
          watermarkPosition: 'bottomRight',
          quality: 0.9,
          format: 'png',
          resolution: 1080,
        }
      );

      if (result.success && result.savedPaths.length > 0) {
        FeedbackService.success();
        ExportService.showExportSuccess(result.savedPaths.length);

      } else {
        FeedbackService.error();
        Alert.alert(
          t('preview_export') + ' Failed',
          result.error || 'Failed to export slides. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      FeedbackService.error();
      Alert.alert(
        t('preview_export') + ' Failed',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderSlide = ({ item, index }: { item: any; index: number }) => {
    const fontSize = item.fontSize || 24;
    const platformKey = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'default';
    const legacyFontId = item.fontId === LEGACY_SYSTEM_FONT_ID
      ? DEFAULT_SLIDE_FONT_ID
      : item.fontId;
    const fontOption = legacyFontId
      ? getSlideFontById(legacyFontId)
      : getSlideFontByFamily(item.fontFamily);
    const resolvedFontFamily = resolveFontFamilyForPlatform(fontOption, platformKey);
    const paddingHorizontal = Math.max(12, fontSize * 0.5);
    const paddingVertical = Math.max(8, fontSize * 0.35);
    const borderRadius = Math.min(Math.max(12, fontSize * 0.6), 30);

    return (
      <View
        ref={(ref) => {
          if (ref) slideRefs.current[index] = ref;
        }}
        style={[styles.slideContainer, { width: slideSize, height: imageContainerHeight }]}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.imageBackground}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.plainBackground, { backgroundColor: themeDefinition.colors.card }]} />
        )}

        <View
          style={[
            styles.textOverlay,
            {
              left: item.position?.x || 50,
              top: item.position?.y || 50,
              backgroundColor: item.backgroundColor || 'rgba(0,0,0,0.5)',
              paddingHorizontal,
              paddingVertical,
              borderRadius,
              maxWidth: slideSize * 0.9,
            },
          ]}
        >
          <Text
            style={[
              styles.slideText,
              {
                fontSize,
                color: item.color || '#FFFFFF',
                textAlign: item.textAlign || 'center',
                fontWeight: resolvedFontFamily ? undefined : item.fontWeight || 'bold',
                fontFamily: resolvedFontFamily,
                lineHeight: fontSize * 1.35,
              },
            ]}
          >
            {item.text}
          </Text>
        </View>

        {/* Watermark preview for free users */}
        {!isProUser && (
          <View style={styles.watermarkPreview}>
            <Text style={styles.watermarkText}>Made with Text to Slides</Text>
          </View>
        )}
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: themeDefinition.colors.background }]}>
      <View style={styles.previewContainer}>
        {slides.length > 0 ? (
          <AnimatedFlatList
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            decelerationRate="fast"
            snapToInterval={slideSize + 20}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeDefinition.colors.text }]}>{t('preview_empty')}</Text>
          </View>
        )}
      </View>
      
      {/* Slide indicators */}
      <View style={styles.indicatorsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentSlideIndex && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
      
      {/* Export button */}
      <TouchableOpacity
        style={[
          styles.exportButton,
          { backgroundColor: isExporting ? themeDefinition.colors.border : '#34C759' },
          isExporting && styles.exportButtonDisabled
        ]}
        onPress={handleExport}
        disabled={isExporting}>
        {isExporting ? (
          <View style={styles.exportingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[styles.exportButtonText, { marginLeft: 10 }]}>Exporting...</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.exportButtonText}>
              {t('preview_export')}
            </Text>
            {!isProUser && (
              <Text style={styles.watermarkNotice}>Includes watermark</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 10,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  plainBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
  },
  textOverlay: {
    position: 'absolute',
    padding: 10,
    borderRadius: 5,
    maxWidth: '90%',
    overflow: 'hidden',
  },
  slideText: {
    color: '#fff',
    fontWeight: 'bold',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#007AFF',
  },
  exportButton: {
    backgroundColor: '#34C759',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  watermarkPreview: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.5)',
    fontStyle: 'italic',
  },
  exportingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkNotice: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default PreviewScreen;
