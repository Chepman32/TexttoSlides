import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
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
import TemplateService from '../services/TemplateService';

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
  const { t } = useLanguage();
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const projectId = useRef<string>(`project_${Date.now()}`);
  
  // Optimize text and split using advanced algorithms
  const optimizedText = optimizeForSlides(text);
  const textSlides = smartSplit(optimizedText, 3); // Default to 3 slides
  
  // Create slides with enhanced properties
  const initialSlides: Slide[] = textSlides.length > 0 
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
    : [{
        id: 0,
        text: 'No text provided',
        image: '',
        position: { x: 50, y: 100 },
        fontSize: 24,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.5)',
        textAlign: 'center',
        fontWeight: 'bold',
      }];
  
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Undo/Redo history management
  const [history, setHistory] = useState<Slide[][]>([initialSlides]);
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
                style: 'cancel'
              },
              {
                text: 'Yes',
                onPress: () => {
                  if (savedProject.slides) {
                    setSlides(savedProject.slides);
                  }
                  projectId.current = savedProject.id;
                }
              }
            ]
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
  }, [currentSlideIndex, currentSlide, translateX, translateY, currentFontSize, currentTextLength, scale, savedScale, rotation, savedRotation]);

  // Mark changes for auto-save
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [slides]);

  // Add to history function
  const addToHistory = useCallback((newSlides: Slide[]) => {
    console.log('addToHistory called, isRestoring:', isRestoringFromHistory.current);
    if (!isRestoringFromHistory.current) {
      setHistory(prevHistory => {
        const currentIndex = historyIndex;
        const newHistory = prevHistory.slice(0, currentIndex + 1);
        newHistory.push(newSlides);
        console.log('History updated, new length:', newHistory.length, 'current index:', currentIndex);

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
  }, []);

  // Undo function
  const handleUndo = () => {
    console.log('Undo pressed, current index:', historyIndex, 'history length:', history.length);
    if (historyIndex > 0) {
      FeedbackService.buttonTap();
      const newIndex = historyIndex - 1;
      console.log('Undoing to index:', newIndex);
      isRestoringFromHistory.current = true;
      setHistoryIndex(newIndex);
      setSlides(history[newIndex]);
      setTimeout(() => {
        isRestoringFromHistory.current = false;
        console.log('Undo complete, restoring flag cleared');
      }, 0);
    } else {
      console.log('Cannot undo, at beginning of history');
    }
  };

  // Redo function
  const handleRedo = () => {
    console.log('Redo pressed, current index:', historyIndex, 'history length:', history.length);
    if (historyIndex < history.length - 1) {
      FeedbackService.buttonTap();
      const newIndex = historyIndex + 1;
      console.log('Redoing to index:', newIndex);
      isRestoringFromHistory.current = true;
      setHistoryIndex(newIndex);
      setSlides(history[newIndex]);
      setTimeout(() => {
        isRestoringFromHistory.current = false;
        console.log('Redo complete, restoring flag cleared');
      }, 0);
    } else {
      console.log('Cannot redo, at end of history');
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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

  const panGesture = Gesture.Pan()
    .onStart((_) => {
      // Store the current position as starting point
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Calculate new position based on translation from start
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;

      // Calculate text dimensions based on font size and text length
      // More accurate estimation for text bounds
      const textPadding = 20;
      const fontSize = currentFontSize.value;
      const textLength = currentTextLength.value;

      const charsPerLine = Math.max(1, Math.floor((slideSize * 0.9) / (fontSize * 0.6)));
      const numberOfLines = Math.ceil(textLength / charsPerLine);
      const estimatedTextWidth = Math.min(
        slideSize * 0.9, // Max 90% of slide width
        textLength < charsPerLine
          ? textLength * fontSize * 0.6
          : slideSize * 0.9
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
    });

  // Pinch gesture for scaling
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Update font size based on scale
      const newFontSize = Math.max(12, Math.min(48, currentFontSize.value * scale.value));
      runOnJS(handleFontSizeChange)(newFontSize - currentFontSize.value);
      scale.value = withSpring(1);
      savedScale.value = 1;
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onUpdate((event) => {
      rotation.value = savedRotation.value + event.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  // Compose all gestures
  const composed = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture)
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

  // Safety check for currentSlide
  if (!currentSlide) {
    return (
      <View style={styles.container}>
        <Text style={styles.navButtonText}>No slides available</Text>
        <Text style={[styles.navButtonText, { fontSize: 16, marginTop: 10 }]}>Please check your input text.</Text>
      </View>
    );
  }

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

  const handleApplyTemplate = (templateId: string) => {
    FeedbackService.buttonTap();
    const template = TemplateService.getInstance().applyTemplate(templateId, currentSlide.text);

    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];

      if (template.position) slide.position = template.position;
      if (template.fontSize) slide.fontSize = template.fontSize;
      // Don't override the user's chosen color
      // if (template.color) slide.color = template.color;
      if (template.backgroundColor) slide.backgroundColor = template.backgroundColor;
      if (template.textAlign) slide.textAlign = template.textAlign;
      if (template.fontWeight) slide.fontWeight = template.fontWeight;

      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });

    setShowTemplates(false);
    FeedbackService.success();
  };

  const handleAutoLayout = () => {
    FeedbackService.buttonTap();
    const autoLayout = TemplateService.getInstance().autoLayout({
      slideWidth: slideSize,
      slideHeight: slideSize,
      textLength: currentSlide.text.length,
      imagePresent: !!currentSlide.image,
    });

    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];

      if (autoLayout.position) slide.position = autoLayout.position;
      if (autoLayout.fontSize) slide.fontSize = autoLayout.fontSize;
      // Don't override the user's chosen color
      // if (autoLayout.color) slide.color = autoLayout.color;
      if (autoLayout.backgroundColor) slide.backgroundColor = autoLayout.backgroundColor;
      if (autoLayout.textAlign) slide.textAlign = autoLayout.textAlign;
      if (autoLayout.fontWeight) slide.fontWeight = autoLayout.fontWeight;

      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });

    FeedbackService.success();
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), backgroundColor: themeDefinition.colors.background }]}>
      {/* Auto-save indicator */}
      {hasUnsavedChanges && (
        <View style={styles.autoSaveIndicator}>
          <Text style={[styles.autoSaveText, { color: themeDefinition.colors.text }]}>
            Saving...
          </Text>
        </View>
      )}

      {/* Slide preview area */}
      <View style={styles.editorContainer}>
        <View style={[styles.slidePreview, { width: slideSize, height: slideSize }]}>
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
                }
              ]}>
              <Text style={[
                styles.slideText,
                {
                  fontSize: currentSlide.fontSize,
                  color: currentSlide.color,
                  textAlign: currentSlide.textAlign,
                  fontWeight: currentSlide.fontWeight,
                  // Add wrapping to prevent text from overflowing
                  flexWrap: 'wrap',
                }
              ]}>
                {currentSlide.text}
              </Text>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
      
      {/* Navigation arrows overlayed on slide */}
      <TouchableOpacity
        style={[styles.navArrowLeft, currentSlideIndex === 0 && styles.navArrowDisabled]}
        onPress={() => {
          if (currentSlideIndex > 0) {
            FeedbackService.slideTransition();
            setCurrentSlideIndex(currentSlideIndex - 1);
          }
        }}
        disabled={currentSlideIndex === 0}>
        <Text style={styles.navArrowText}>‹</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navArrowRight, currentSlideIndex === slides.length - 1 && styles.navArrowDisabled]}
        onPress={() => {
          if (currentSlideIndex < slides.length - 1) {
            FeedbackService.slideTransition();
            setCurrentSlideIndex(currentSlideIndex + 1);
          }
        }}
        disabled={currentSlideIndex === slides.length - 1}>
        <Text style={styles.navArrowText}>›</Text>
      </TouchableOpacity>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Template and action buttons */}
        <View style={styles.templateButtons}>
          <TouchableOpacity
            style={[styles.templateButton, !canUndo && styles.disabledButton]}
            onPress={handleUndo}
            disabled={!canUndo}>
            <Text style={styles.templateIcon}>↶</Text>
            <Text style={styles.templateButtonText}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.templateButton, !canRedo && styles.disabledButton]}
            onPress={handleRedo}
            disabled={!canRedo}>
            <Text style={styles.templateIcon}>↷</Text>
            <Text style={styles.templateButtonText}>Redo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => setShowTemplates(!showTemplates)}>
            <Text style={styles.templateIcon}>📄</Text>
            <Text style={styles.templateButtonText}>Template</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateButton}
            onPress={handleAutoLayout}>
            <Text style={styles.templateIcon}>✨</Text>
            <Text style={styles.templateButtonText}>Auto</Text>
          </TouchableOpacity>
        </View>

        {/* Template selector (shown when template button is pressed) */}
        {showTemplates && (
          <ScrollView horizontal style={styles.templateSelector} showsHorizontalScrollIndicator={false}>
            {['minimal', 'bold', 'elegant', 'playful', 'professional'].map((templateId) => (
              <TouchableOpacity
                key={templateId}
                style={styles.templateOption}
                onPress={() => handleApplyTemplate(templateId)}>
                <Text style={styles.templateOptionText}>{templateId.charAt(0).toUpperCase() + templateId.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Text color selector */}
        <View style={styles.colorSection}>
          <Text style={styles.sectionLabel}>Text color</Text>
          <View style={styles.colorControls}>
            {['#FFFFFF', '#000000', '#FF0000', '#FFFF00', '#00FF00'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  currentSlide.color === color && styles.activeColorButton
                ]}
                onPress={() => handleTextColorChange(color)}
              />
            ))}
          </View>
        </View>

        {/* Background opacity selector */}
        <View style={styles.opacitySection}>
          <Text style={styles.sectionLabel}>Background opacity</Text>
          <View style={styles.opacityControls}>
            {[0, 0.25, 0.5, 0.75, 1].map((opacity) => (
              <TouchableOpacity
                key={opacity}
                style={[
                  styles.opacityButton,
                  { backgroundColor: `rgba(0,0,0,${opacity})` },
                  currentSlide.backgroundColor === `rgba(0,0,0,${opacity})` && styles.activeOpacityButton
                ]}
                onPress={() => handleBackgroundOpacityChange(opacity)}
              />
            ))}
          </View>
        </View>
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
  bottomControls: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  templateButtons: {
    flexDirection: 'row',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledButton: {
    opacity: 0.4,
    backgroundColor: '#f5f5f5',
  },
  templateIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  templateSelector: {
    marginBottom: 15,
    maxHeight: 50,
  },
  templateOption: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  templateOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  colorSection: {
    marginBottom: 15,
  },
  opacitySection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  colorControls: {
    flexDirection: 'row',
  },
  opacityControls: {
    flexDirection: 'row',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  activeColorButton: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  opacityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  activeOpacityButton: {
    borderColor: '#007AFF',
    borderWidth: 3,
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
});

export default EditorScreen;