import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
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
import { smartSplit, optimizeForSlides } from '../utils/textUtils';
import FeedbackService from '../services/FeedbackService';

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

  // Optimize text and split using advanced algorithms
  const optimizedText = optimizeForSlides(text);
  const textSlides = smartSplit(optimizedText, 3); // Default to 3 slides

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

  // Undo/Redo history management
  const [, setHistory] = useState<Slide[][]>([initialSlides]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isRestoringFromHistory = useRef(false);

  const currentSlide = slides[currentSlideIndex];
  const { width: screenWidth } = Dimensions.get('window');
  const slideSize = Math.min(screenWidth - 40, 350);

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
  const sliderTranslateY = useSharedValue(0);
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
          Alert.alert(
            'Resume Project',
            'Would you like to resume your previous project?',
            [
              {
                text: 'No',
                onPress: () => StorageService.clearCurrentProject(),
                style: 'cancel',
              },
              {
                text: 'Yes',
                onPress: () => {
                  if (savedProject.slides) {
                    setSlides(savedProject.slides);
                  }
                  projectId.current = savedProject.id;
                },
              },
            ],
          );
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
      const sliderHeight = 200;
      const progress = (currentSlide.fontSize - 12) / (72 - 12);
      const newPosition = -progress * sliderHeight;
      sliderTranslateY.value = withSpring(newPosition);

      console.log('Slider initialized:', {
        fontSize: currentSlide.fontSize,
        progress,
        newPosition,
      });
    }
  }, [currentSlideIndex, currentSlide, sliderTranslateY]);

  // Mark changes for auto-save
  useEffect(() => {
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

      slide.fontSize = Math.max(12, Math.min(48, slide.fontSize + change));
      // Update the shared value for gesture handling
      currentFontSize.value = slide.fontSize;
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
        slide.fontSize = Math.max(12, Math.min(72, newFontSize));
        // Update the shared value for gesture handling
        currentFontSize.value = slide.fontSize;
        newSlides[currentSlideIndex] = slide;
        addToHistory(newSlides);
        setHasUnsavedChanges(true);
        console.log('Font size updated to:', slide.fontSize);
        return newSlides;
      });
    },
    [currentSlideIndex, addToHistory, currentFontSize],
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
      const maxY = Math.max(0, slideSize - estimatedTextHeight);

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
        12,
        Math.min(48, currentFontSize.value * scale.value),
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
      const sliderHeight = 200; // Height of the slider track
      const newY = sliderStartY.value + event.translationY;

      // Constrain the slider movement within bounds
      const constrainedY = Math.max(-sliderHeight, Math.min(0, newY));
      sliderTranslateY.value = constrainedY;
    })
    .onEnd(() => {
      // Calculate final font size based on slider position
      const sliderHeight = 200;
      // Convert from negative range (-200 to 0) to positive range (0 to 1)
      const progress = Math.abs(sliderTranslateY.value) / sliderHeight;
      const fontSize = Math.round(12 + progress * (72 - 12));

      console.log('Slider gesture ended:', {
        sliderTranslateY: sliderTranslateY.value,
        progress,
        fontSize,
      });

      // Update font size only when gesture ends
      if (updateFontSize) {
        runOnJS(updateFontSize)(fontSize);
      }

      // Snap to final position
      sliderTranslateY.value = withSpring(sliderTranslateY.value);
    })
    .runOnJS(true);

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

  const sliderThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: sliderTranslateY.value }],
    };
  });

  const sliderTrackFillStyle = useAnimatedStyle(() => {
    const sliderHeight = 200;
    const progress = Math.abs(sliderTranslateY.value) / sliderHeight;
    return {
      height: `${progress * 100}%`,
    };
  });


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
      const slide = newSlides[currentSlideIndex];
      slide.textAlign = align;
      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });
  };

  const handleTextColorChange = (color: string) => {
    FeedbackService.buttonTap();
    const newSlides = [...slides];
    const slide = newSlides[currentSlideIndex];
    slide.color = color;
    newSlides[currentSlideIndex] = slide;

    setSlides(newSlides);
    addToHistory(newSlides);
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
          paddingTop: Math.max(insets.top, 20),
          backgroundColor: themeDefinition.colors.background,
        },
      ]}
    >
      {/* Auto-save indicator */}
      {hasUnsavedChanges && (
        <View style={styles.autoSaveIndicator}>
          <Text
            style={[
              styles.autoSaveText,
              { color: themeDefinition.colors.text },
            ]}
          >
            Saving...
          </Text>
        </View>
      )}

      {/* Slide preview area */}
      <View style={styles.editorContainer}>
        <View
          style={[styles.slidePreview, { width: slideSize, height: slideSize }]}
        >
          {currentSlide.image ? (
            <Image
              source={{ uri: currentSlide.image }}
              style={styles.imageBackground}
              resizeMode="cover"
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
                    // Add wrapping to prevent text from overflowing
                  },
                ]}
              >
                {currentSlide.text}
              </Text>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>

      {/* Navigation arrows overlayed on slide */}
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

      {/* Vertical font size slider on the left */}
      <View style={styles.fontSizeSlider}>
        <GestureDetector gesture={sliderGesture}>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderTrackBackground} />
            <Animated.View
              style={[styles.sliderTrackFill, sliderTrackFillStyle]}
            />
            <Animated.View
              style={[
                styles.sliderThumb,
                sliderThumbStyle,
                {
                  top: `${((currentSlide.fontSize - 12) / (72 - 12)) * 100}%`,
                },
                styles.sliderThumbPosition,
              ]}
            />
          </View>
        </GestureDetector>
        <Text style={styles.fontSizeLabel}>{currentSlide.fontSize}</Text>
      </View>

      {/* Minimalistic bottom controls */}
      <View style={styles.minimalControls}>
        {/* Text alignment controls */}
        <View style={styles.alignmentControls}>
          <TouchableOpacity
            style={[
              styles.alignmentButton,
              currentSlide.textAlign === 'left' && styles.activeAlignmentButton,
            ]}
            onPress={() => {
              FeedbackService.buttonTap();
              handleTextAlignChange('left');
            }}
          >
            <Text
              style={[
                styles.alignmentIcon,
                currentSlide.textAlign === 'left' && styles.activeAlignmentIcon,
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
            // Cycle through colors
            const colors = [
              '#FFFFFF',
              '#000000',
              '#FF0000',
              '#FFFF00',
              '#00FF00',
              '#00FFFF',
              '#FF00FF',
            ];
            const currentIndex = colors.indexOf(currentSlide.color);
            const nextIndex = (currentIndex + 1) % colors.length;
            handleTextColorChange(colors[nextIndex]);
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
            currentSlide.fontWeight === 'bold' && styles.activeFontWeightButton,
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
              currentSlide.fontWeight === 'bold' && styles.activeFontWeightIcon,
            ]}
          >
            A
          </Text>
        </TouchableOpacity>

        {/* Background opacity toggle */}
        <TouchableOpacity
          style={styles.opacityButton}
          onPress={() => {
            FeedbackService.buttonTap();
            // Cycle through opacity levels
            const opacities = [0, 0.25, 0.5, 0.75, 1];
            const currentOpacity = parseFloat(
              currentSlide.backgroundColor.split(',')[3].replace(')', ''),
            );
            const currentIndex = opacities.indexOf(currentOpacity);
            const nextIndex = (currentIndex + 1) % opacities.length;
            handleBackgroundOpacityChange(opacities[nextIndex]);
          }}
        >
          <Text style={styles.opacityIcon}>◐</Text>
        </TouchableOpacity>
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
    left: 10,
    top: '50%',
    marginTop: -30,
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },
  navArrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -30,
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navArrowText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  // Vertical font size slider
  fontSizeSlider: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -100,
    width: 50, // Increased width for better touch target
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)', // Add subtle background for better visibility
    borderRadius: 25,
  },
  sliderTrack: {
    width: 6,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    position: 'relative',
  },
  sliderTrackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  sliderTrackFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    left: -7,
  },
  fontSizeLabel: {
    position: 'absolute',
    bottom: -30,
    left: -10,
    right: -10,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 2,
  },

  // Minimalistic bottom controls
  minimalControls: {
    position: 'absolute',
    top: 370, // Position right under the slide preview (350 + 20)
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
  autoSaveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  autoSaveText: {
    fontSize: 12,
    color: '#fff',
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
  sliderThumbPosition: {
    top: '50%',
    marginTop: -10,
  },
});

export default EditorScreen;
