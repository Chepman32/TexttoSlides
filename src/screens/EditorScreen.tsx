import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import StorageService, { ProjectState } from '../services/StorageService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { smartSplit, optimizeForSlides, getOptimalSlideCount } from '../utils/textUtils';
import FeedbackService from '../services/FeedbackService';

const SLIDER_HEIGHT = 200;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 72;

type RootStackParamList = {
  Home: undefined;
  Editor: { text: string; images: string[] };
  Preview: { slides: any[] };
};

type EditorRouteProp = RouteProp<RootStackParamList, 'Editor'>;
type EditorNavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

// Enhanced slide type with more properties
type Slide = {
  id: number;
  text: string;
  image: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
};

const EditorScreen: React.FC = () => {
  const route = useRoute<EditorRouteProp>();
  const navigation = useNavigation<EditorNavigationProp>();
  const { text, images } = route.params;
  const insets = useSafeAreaInsets();
  const { themeDefinition } = useTheme();
  const {} = useLanguage();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectId = useRef<string>(`project_${Date.now()}`);
  const isRestoringFromStorage = useRef(false);

  // Optimize text and split using the same algorithm as ImageSelectionScreen
  const optimizedText = optimizeForSlides(text);
  const optimalSlideCount = getOptimalSlideCount(optimizedText);
  const textSlides = smartSplit(optimizedText, optimalSlideCount);

  // Create slides with enhanced properties
  const initialSlides: Slide[] =
    textSlides.length > 0
      ? textSlides.map((slideText, index) => ({
          id: index,
          text: slideText,
          image: images[index] || '',
          position: { x: 50, y: 100 },
          fontSize: 24,
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.5)',
          textAlign: 'center',
          fontWeight: 'bold',
        }))
      : [
          {
            id: 0,
            text: 'No text provided',
            image: '',
            position: { x: 50, y: 100 },
            fontSize: 24,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0,0,0,0.5)',
            textAlign: 'center',
            fontWeight: 'bold',
          },
        ];

  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isColorPaletteVisible, setColorPaletteVisible] = useState(false);
  const [isOpacityPaletteVisible, setOpacityPaletteVisible] = useState(false);

  // Undo/Redo history management
  const [, setHistory] = useState<Slide[][]>([initialSlides]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isRestoringFromHistory = useRef(false);

  const currentSlide = slides[currentSlideIndex];
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const slideSize = Math.min(screenWidth * 0.99, screenWidth - 10); // Use 99% of screen width

  const overlayPaddingHorizontal = Math.max(12, currentSlide?.fontSize * 0.5 || 0);
  const overlayPaddingVertical = Math.max(8, currentSlide?.fontSize * 0.35 || 0);
  const overlayBorderRadius = Math.min(
    Math.max(12, currentSlide?.fontSize * 0.6 || 0),
    30,
  );
  
  // Calculate available height for image container
  const headerHeight = Math.max(insets.top, 20) + 60; // Safe area + title height
  const previewButtonHeight = 80; // Height for preview button + margins
  const availableHeight = screenHeight - headerHeight - previewButtonHeight;
  const imageContainerHeight = availableHeight; // Use available height without minimum constraint

  // Animated values for drag and drop (must be declared at the top level)
  const translateX = useSharedValue(currentSlide?.position?.x || 50);
  const translateY = useSharedValue(currentSlide?.position?.y || 100);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // Store current slide properties in shared values to access in gesture
  const currentFontSize = useSharedValue(currentSlide?.fontSize || 24);
  const currentTextLength = useSharedValue(currentSlide?.text?.length || 0);

  // Pinch and rotate gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  // Font size slider gesture values
  const sliderTranslateY = useSharedValue(
    (() => {
      const progress = currentSlide
        ? (currentSlide.fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)
        : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      return (1 - clampedProgress) * SLIDER_HEIGHT;
    })(),
  );
  const sliderStartY = useSharedValue(0);

  // Auto-save functionality
  const saveProject = useCallback(async () => {
    const projectState: ProjectState = {
      id: projectId.current,
      text,
      slides,
      images,
      lastModified: new Date().toISOString(),
      isCompleted: false,
    };

    try {
      await StorageService.saveCurrentProject(projectState);
      console.log('Project auto-saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to auto-save project:', error);
    }
  }, [text, slides, images]);

  // Set up auto-save
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set up new auto-save timer (save after 5 seconds of no changes)
    if (hasUnsavedChanges) {
      autoSaveTimer.current = setTimeout(() => {
        saveProject();
      }, 5000);
    }

    // Cleanup on unmount
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, saveProject]);

  // Load saved project if exists
  useEffect(() => {
    const loadSavedProject = async () => {
      try {
        const savedProject = await StorageService.loadCurrentProject();
        if (savedProject && !savedProject.isCompleted) {
          if (savedProject.slides && savedProject.slides.length > 0) {
            isRestoringFromStorage.current = true;
            isRestoringFromHistory.current = true;
            setSlides(savedProject.slides);
            setHistory([savedProject.slides]);
            setHistoryIndex(0);
            setCurrentSlideIndex(0);
            setTimeout(() => {
              isRestoringFromHistory.current = false;
            }, 0);
          }
          projectId.current = savedProject.id;
        } else {
          StorageService.clearCurrentProject();
        }
      } catch (error) {
        console.error('Failed to load saved project:', error);
      }
    };

    loadSavedProject();
  }, []);

  // Update animated values when slide changes
  useEffect(() => {
    if (currentSlide) {
      translateX.value = withSpring(currentSlide.position.x);
      translateY.value = withSpring(currentSlide.position.y);
      currentFontSize.value = currentSlide.fontSize;
      currentTextLength.value = currentSlide.text.length;
      scale.value = 1;
      savedScale.value = 1;
      rotation.value = 0;
      savedRotation.value = 0;
    }
  }, [
    currentSlideIndex,
    currentSlide,
    translateX,
    translateY,
    currentFontSize,
    currentTextLength,
    scale,
    savedScale,
    rotation,
    savedRotation,
  ]);

  // Initialize slider position when slide changes
  useEffect(() => {
    if (currentSlide) {
      const progress =
        (currentSlide.fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE);
      const clampedProgress = Math.max(0, Math.min(1, progress));
      sliderTranslateY.value = withSpring((1 - clampedProgress) * SLIDER_HEIGHT);

      console.log('Slider initialized:', {
        fontSize: currentSlide.fontSize,
        progress: clampedProgress,
        newPosition: (1 - clampedProgress) * SLIDER_HEIGHT,
      });
    }
  }, [currentSlideIndex, currentSlide, sliderTranslateY]);

  // Mark changes for auto-save
  useEffect(() => {
    if (isRestoringFromStorage.current) {
      isRestoringFromStorage.current = false;
      setHasUnsavedChanges(false);
      return;
    }
    setHasUnsavedChanges(true);
  }, [slides]);

  // Add to history function
  const addToHistory = useCallback(
    (newSlides: Slide[]) => {
      console.log(
        'addToHistory called, isRestoring:',
        isRestoringFromHistory.current,
      );
      if (!isRestoringFromHistory.current) {
        setHistory(prevHistory => {
          const currentIndex = historyIndex;
          const newHistory = prevHistory.slice(0, currentIndex + 1);
          newHistory.push(newSlides);
          console.log(
            'History updated, new length:',
            newHistory.length,
            'current index:',
            currentIndex,
          );

          // Keep history limited to 20 items
          if (newHistory.length > 20) {
            newHistory.shift();
            setHistoryIndex(19);
          } else {
            setHistoryIndex(newHistory.length - 1);
          }

          return newHistory;
        });
      }
    },
    [historyIndex],
  );

  // Function to update slide position (needs to be called from JS thread)
  const updateSlidePosition = (x: number, y: number) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (slide) {
        slide.position = { x, y };
        newSlides[currentSlideIndex] = slide;
        addToHistory(newSlides);
      }
      return newSlides;
    });
  };

  const handleFontSizeChange = (change: number) => {
    FeedbackService.textResize();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];

      const clampedFontSize = Math.max(
        MIN_FONT_SIZE,
        Math.min(MAX_FONT_SIZE, slide.fontSize + change),
      );
      slide.fontSize = clampedFontSize;
      // Update the shared value for gesture handling
      currentFontSize.value = slide.fontSize;
      sliderTranslateY.value = withSpring(
        (1 - (clampedFontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) *
          SLIDER_HEIGHT,
      );
      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });
  };

  const updateFontSize = useCallback(
    (newFontSize: number) => {
      console.log('updateFontSize called with:', newFontSize);
      FeedbackService.textResize();
      setSlides(prevSlides => {
        const newSlides = [...prevSlides];
        const slide = newSlides[currentSlideIndex];
        const clampedFontSize = Math.max(
          MIN_FONT_SIZE,
          Math.min(MAX_FONT_SIZE, newFontSize),
        );
        slide.fontSize = clampedFontSize;
        // Update the shared value for gesture handling
        currentFontSize.value = slide.fontSize;
        sliderTranslateY.value = withSpring(
          (1 -
            (clampedFontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) *
            SLIDER_HEIGHT,
        );
        newSlides[currentSlideIndex] = slide;
        addToHistory(newSlides);
        setHasUnsavedChanges(true);
        console.log('Font size updated to:', slide.fontSize);
        return newSlides;
      });
    },
    [currentSlideIndex, addToHistory, currentFontSize, sliderTranslateY],
  );

  const panGesture = Gesture.Pan()
    .onStart(_ => {
      // Store the current position as starting point
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate(event => {
      // Calculate new position based on translation from start
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;

      // Calculate text dimensions based on font size and text length
      // More accurate estimation for text bounds
      const textPadding = 20;
      const fontSize = currentFontSize.value;
      const textLength = currentTextLength.value;

      const charsPerLine = Math.max(
        1,
        Math.floor((slideSize * 0.9) / (fontSize * 0.6)),
      );
      const numberOfLines = Math.ceil(textLength / charsPerLine);
      const estimatedTextWidth = Math.min(
        slideSize * 0.9, // Max 90% of slide width
        textLength < charsPerLine
          ? textLength * fontSize * 0.6
          : slideSize * 0.9,
      );
      const estimatedTextHeight = numberOfLines * fontSize * 1.2 + textPadding;

      // Ensure text container stays within slide boundaries
      const minX = 0;
      const minY = 0;
      const maxX = Math.max(0, slideSize - estimatedTextWidth);
      const maxY = Math.max(0, imageContainerHeight - estimatedTextHeight);

      // Apply constraints to keep text fully within bounds
      const constrainedX = Math.max(minX, Math.min(maxX, newX));
      const constrainedY = Math.max(minY, Math.min(maxY, newY));

      translateX.value = constrainedX;
      translateY.value = constrainedY;
    })
    .onEnd(() => {
      // Update slide position using runOnJS
      runOnJS(updateSlidePosition)(translateX.value, translateY.value);
    })
    .runOnJS(true);

  // Pinch gesture for scaling
  const pinchGesture = Gesture.Pinch()
    .onUpdate(event => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Update font size based on scale
      const newFontSize = Math.max(
        MIN_FONT_SIZE,
        Math.min(MAX_FONT_SIZE, currentFontSize.value * scale.value),
      );
      runOnJS(handleFontSizeChange)(newFontSize - currentFontSize.value);
      scale.value = withSpring(1);
      savedScale.value = 1;
    })
    .runOnJS(true);

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onUpdate(event => {
      rotation.value = savedRotation.value + event.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    })
    .runOnJS(true);

  // Font size slider gesture
  const sliderGesture = Gesture.Pan()
    .onStart(() => {
      sliderStartY.value = sliderTranslateY.value;
    })
    .onUpdate(event => {
      const newY = sliderStartY.value + event.translationY;

      // Constrain the slider movement within bounds
      const constrainedY = Math.max(0, Math.min(SLIDER_HEIGHT, newY));
      sliderTranslateY.value = constrainedY;

      // Update font size continuously while dragging
      const progress = 1 - constrainedY / SLIDER_HEIGHT;
      const liveFontSize = Math.round(
        MIN_FONT_SIZE + progress * (MAX_FONT_SIZE - MIN_FONT_SIZE),
      );
      if (updateFontSize) {
        runOnJS(updateFontSize)(liveFontSize);
      }
    })
    .onEnd(() => {
      // Calculate final font size based on slider position
      const progress = 1 - sliderTranslateY.value / SLIDER_HEIGHT;
      const fontSize = Math.round(
        MIN_FONT_SIZE + progress * (MAX_FONT_SIZE - MIN_FONT_SIZE),
      );

      // Update font size only when gesture ends
      if (updateFontSize) {
        runOnJS(updateFontSize)(fontSize);
      }

      // Snap to final position
      sliderTranslateY.value = withSpring(sliderTranslateY.value);
    })
    .runOnJS(true)
    .shouldCancelWhenOutside(false);

  // Compose all gestures
  const composed = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture),
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}rad` },
      ],
    };
  });

  const sliderThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sliderTranslateY.value - 12 }], // Adjusted for larger thumb
  }));


  // Safety check for currentSlide
  if (!currentSlide) {
    return (
      <View style={styles.container}>
        <Text style={styles.navButtonText}>No slides available</Text>
        <Text style={styles.navButtonSubtext}>
          Please check your input text.
        </Text>
      </View>
    );
  }

  const handleFontWeightChange = (newWeight: 'normal' | 'bold') => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      slide.fontWeight = newWeight;
      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      setHasUnsavedChanges(true);
      return newSlides;
    });
  };

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const existingSlide = newSlides[currentSlideIndex];
      if (!existingSlide) {
        return prevSlides;
      }

      const slide = { ...existingSlide };
      slide.textAlign = align;

      const fontSize = slide.fontSize;
      const textLength = slide.text.length;
      const textPadding = 20;
      const charsPerLine = Math.max(
        1,
        Math.floor((slideSize * 0.9) / (fontSize * 0.6)),
      );
      const numberOfLines = Math.ceil(textLength / charsPerLine);
      const estimatedTextWidth = Math.min(
        slideSize * 0.9,
        textLength < charsPerLine
          ? textLength * fontSize * 0.6
          : slideSize * 0.9,
      );
      const estimatedTextHeight = numberOfLines * fontSize * 1.2 + textPadding;

      let newX = slide.position.x;
      if (align === 'left') {
        newX = 0;
      } else if (align === 'center') {
        newX = Math.max(0, (slideSize - estimatedTextWidth) / 2);
      } else {
        newX = Math.max(0, slideSize - estimatedTextWidth);
      }

      const maxY = Math.max(0, imageContainerHeight - estimatedTextHeight);
      const newY = Math.max(0, Math.min(maxY, slide.position.y));

      slide.position = { x: newX, y: newY };
      newSlides[currentSlideIndex] = slide;

      translateX.value = withSpring(newX);
      translateY.value = withSpring(newY);

      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
  };

  const handleTextColorChange = (color: string) => {
    FeedbackService.buttonTap();
    const newSlides = [...slides];
    const slide = newSlides[currentSlideIndex];
    slide.color = color;
    newSlides[currentSlideIndex] = slide;

    setSlides(newSlides);
    addToHistory(newSlides);
    setColorPaletteVisible(false);
  };

  const handleBackgroundOpacityChange = (opacity: number) => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      slide.backgroundColor = `rgba(0,0,0,${opacity})`;
      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });
  };

  const handlePreview = async () => {
    FeedbackService.buttonTap();

    // Save before preview
    await saveProject();

    // Mark project as completed
    const projectState: ProjectState = {
      id: projectId.current,
      text,
      slides,
      images,
      lastModified: new Date().toISOString(),
      isCompleted: true,
    };
    await StorageService.saveCurrentProject(projectState);

    navigation.navigate('Preview', { slides });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeDefinition.colors.background,
        },
      ]}
    >
      {/* Slide preview area */}
      <View style={styles.editorContainer}>
        <View
          style={[styles.slidePreview, { width: slideSize, height: imageContainerHeight }]}
        >
          {currentSlide.image ? (
            <Image
              source={{ uri: currentSlide.image }}
              style={styles.imageBackground}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.plainBackground} />
          )}

          <GestureDetector gesture={composed}>
            <Animated.View
              style={[
                styles.textOverlay,
                animatedStyle,
                {
                  backgroundColor: currentSlide.backgroundColor,
                  maxWidth: slideSize * 0.9, // Limit max width to 90% of slide
                  paddingHorizontal: overlayPaddingHorizontal,
                  paddingVertical: overlayPaddingVertical,
                  borderRadius: overlayBorderRadius,
                },
              ]}
            >
              <Text
                style={[
                  styles.slideText,
                  {
                    fontSize: currentSlide.fontSize,
                    color: currentSlide.color,
                    textAlign: currentSlide.textAlign,
                    fontWeight: currentSlide.fontWeight,
                    lineHeight: currentSlide.fontSize * 1.2,
                    // Add wrapping to prevent text from overflowing
                  },
                ]}
              >
                {currentSlide.text}
              </Text>
            </Animated.View>
          </GestureDetector>

          {/* Vertical font size slider on the left */}
          <GestureDetector gesture={sliderGesture}>
            <View
              style={[
                styles.fontSizeSlider,
                { top: Math.max(10, (imageContainerHeight - SLIDER_HEIGHT) / 2) },
              ]}
            >
              <View style={styles.sliderTrack}>
                <Animated.View
                  style={[
                    styles.sliderThumb,
                    sliderThumbStyle,
                  ]}
                />
              </View>
            </View>
          </GestureDetector>
        </View>
      </View>

      {/* Slide indicator */}
      {slides.length > 1 && (
        <View style={styles.slideIndicator}>
          <Text style={styles.slideIndicatorText}>
            {currentSlideIndex + 1} / {slides.length}
          </Text>
        </View>
      )}

      {/* Navigation arrows overlayed on slide */}
      {slides.length > 1 && (
        <>
          <TouchableOpacity
            style={[
              styles.navArrowLeft,
              currentSlideIndex === 0 && styles.navArrowDisabled,
            ]}
            onPress={() => {
              if (currentSlideIndex > 0) {
                FeedbackService.slideTransition();
                setCurrentSlideIndex(currentSlideIndex - 1);
              }
            }}
            disabled={currentSlideIndex === 0}
          >
            <Text style={styles.navArrowText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navArrowRight,
              currentSlideIndex === slides.length - 1 && styles.navArrowDisabled,
            ]}
            onPress={() => {
              if (currentSlideIndex < slides.length - 1) {
                FeedbackService.slideTransition();
                setCurrentSlideIndex(currentSlideIndex + 1);
              }
            }}
            disabled={currentSlideIndex === slides.length - 1}
          >
            <Text style={styles.navArrowText}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Minimalistic bottom controls */}
      <View style={[styles.minimalControls, { top: imageContainerHeight - 60 }]}>
        {!isColorPaletteVisible && !isOpacityPaletteVisible ? (
          <>
            {/* Text alignment controls */}
            <View style={styles.alignmentControls}>
              <TouchableOpacity
                style={[
                  styles.alignmentButton,
                  currentSlide.textAlign === 'left' &&
                    styles.activeAlignmentButton,
                ]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  handleTextAlignChange('left');
                }}
              >
                <Text
                  style={[
                    styles.alignmentIcon,
                    currentSlide.textAlign === 'left' &&
                      styles.activeAlignmentIcon,
                  ]}
                >
                  ≡
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.alignmentButton,
                  currentSlide.textAlign === 'center' &&
                    styles.activeAlignmentButton,
                ]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  handleTextAlignChange('center');
                }}
              >
                <Text
                  style={[
                    styles.alignmentIcon,
                    currentSlide.textAlign === 'center' &&
                      styles.activeAlignmentIcon,
                  ]}
                >
                  ☰
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.alignmentButton,
                  currentSlide.textAlign === 'right' &&
                    styles.activeAlignmentButton,
                ]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  handleTextAlignChange('right');
                }}
              >
                <Text
                  style={[
                    styles.alignmentIcon,
                    currentSlide.textAlign === 'right' &&
                      styles.activeAlignmentIcon,
                  ]}
                >
                  ≡
                </Text>
              </TouchableOpacity>
            </View>

            {/* Color picker */}
            <TouchableOpacity
              style={styles.colorPickerButton}
              onPress={() => {
                FeedbackService.buttonTap();
                setColorPaletteVisible(true);
                setOpacityPaletteVisible(false); // Hide opacity palette if visible
              }}
            >
              <View
                style={[styles.colorWheel, { backgroundColor: currentSlide.color }]}
              />
            </TouchableOpacity>

            {/* Font weight toggle */}
            <TouchableOpacity
              style={[
                styles.fontWeightButton,
                currentSlide.fontWeight === 'bold' &&
                  styles.activeFontWeightButton,
              ]}
              onPress={() => {
                FeedbackService.buttonTap();
                handleFontWeightChange(
                  currentSlide.fontWeight === 'bold' ? 'normal' : 'bold',
                );
              }}
            >
              <Text
                style={[
                  styles.fontWeightIcon,
                  currentSlide.fontWeight === 'bold' &&
                    styles.activeFontWeightIcon,
                ]}
              >
                A
              </Text>
            </TouchableOpacity>

            {/* Background opacity picker */}
            <TouchableOpacity
              style={styles.opacityButton}
              onPress={() => {
                FeedbackService.buttonTap();
                setOpacityPaletteVisible(true);
                setColorPaletteVisible(false); // Hide color palette if visible
              }}
            >
              <Text style={styles.opacityIcon}>◐</Text>
            </TouchableOpacity>
          </>
        ) : isColorPaletteVisible ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.colorPaletteScrollContainer}
            contentContainerStyle={styles.colorPaletteContainer}
          >
            {['#FFFFFF', '#000000', '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFA500', '#8A2BE2', '#FFD700', '#0033A0', '#008080', '#BFFF00', '#FF7F50', '#800000', '#4B0082', '#808080'].map(
              color => {
                const borderColor = currentSlide.color === color ? '#FFFFFF' : 'rgba(255,255,255,0.3)';
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: color,
                        borderColor,
                      },
                    ]}
                    onPress={() => handleTextColorChange(color)}
                  />
                );
              },
            )}
          </ScrollView>
        ) : (
          <View style={styles.opacityPaletteContainer}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(opacity => {
              const currentOpacity = parseFloat(
                currentSlide.backgroundColor.split(',')[3].replace(')', ''),
              );
              const borderColor = Math.abs(currentOpacity - opacity) < 0.01 ? '#FFFFFF' : 'rgba(255,255,255,0.3)';
              return (
                <TouchableOpacity
                  key={opacity}
                  style={[
                    styles.opacityOption,
                    {
                      backgroundColor: `rgba(0,0,0,${opacity})`,
                      borderColor,
                    },
                  ]}
                  onPress={() => {
                    handleBackgroundOpacityChange(opacity);
                    setOpacityPaletteVisible(false);
                  }}
                />
              );
            })}
          </View>
        )}
      </View>
      {/* Preview button */}
      <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
        <Text style={styles.previewButtonText}>Preview Slides</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  slidePreview: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
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
  navArrowLeft: {
    position: 'absolute',
    left: 5,
    top: '50%',
    marginTop: -30,
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  navArrowRight: {
    position: 'absolute',
    right: 5,
    top: '50%',
    marginTop: -30,
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navArrowText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  slideIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 20,
  },
  slideIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Vertical font size slider
  fontSizeSlider: {
    position: 'absolute',
    left: 10,
    width: 50, // Increased width for better touch target
    height: SLIDER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)', // Add subtle background for better visibility
    borderRadius: 25,
    zIndex: 5,
  },
  sliderTrack: {
    width: 8, // Increased width for better visibility
    height: SLIDER_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.4)', // Slightly more visible
    borderRadius: 4,
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    width: 24, // Slightly larger for better touch target
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    left: -8, // Adjusted for wider track
  },

  // Minimalistic bottom controls
  minimalControls: {
    position: 'absolute',
    top: 360, // Position right under the slide preview (350 + 20)
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },

  // Alignment controls
  alignmentControls: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  alignmentButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  activeAlignmentButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  alignmentIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'bold',
  },
  activeAlignmentIcon: {
    color: '#FFFFFF',
  },

  // Color picker
  colorPickerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  colorWheel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  // Font weight button
  fontWeightButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeFontWeightButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.8)',
  },
  fontWeightIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'normal',
  },
  activeFontWeightIcon: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Opacity button
  opacityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  opacityIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  colorPaletteScrollContainer: {
    maxWidth: '100%',
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  opacityPaletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  opacityOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  previewButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  navButtonSubtext: {
    fontSize: 16,
    marginTop: 10,
    color: '#fff',
    textAlign: 'center',
  },
});

export default EditorScreen;
