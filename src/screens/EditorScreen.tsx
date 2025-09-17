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

// Create animated ScrollView component
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
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

  // Function to update slide position (needs to be called from JS thread)
  const updateSlidePosition = (x: number, y: number) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (slide) {
        slide.position = { x, y };
        newSlides[currentSlideIndex] = slide;
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
      return newSlides;
    });
  };

  const handleTextColorChange = (color: string) => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      slide.color = color;
      newSlides[currentSlideIndex] = slide;
      return newSlides;
    });
  };

  const handleBackgroundOpacityChange = (opacity: number) => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      slide.backgroundColor = `rgba(0,0,0,${opacity})`;
      newSlides[currentSlideIndex] = slide;
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
      return newSlides;
    });

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
      if (autoLayout.color) slide.color = autoLayout.color;
      if (autoLayout.backgroundColor) slide.backgroundColor = autoLayout.backgroundColor;
      if (autoLayout.textAlign) slide.textAlign = autoLayout.textAlign;
      if (autoLayout.fontWeight) slide.fontWeight = autoLayout.fontWeight;
      
      newSlides[currentSlideIndex] = slide;
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: themeDefinition.colors.background }]}>
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
      
      {/* Slide navigation */}
      <View style={styles.slideNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => {
            FeedbackService.slideTransition();
            setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
          }}
          disabled={currentSlideIndex === 0}>
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => {
            FeedbackService.slideTransition();
            setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1));
          }}
          disabled={currentSlideIndex === slides.length - 1}>
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
      
      {/* Template and Auto-layout buttons */}
      <View style={styles.templateControls}>
        <TouchableOpacity 
          style={styles.templateButton}
          onPress={() => setShowTemplates(!showTemplates)}>
          <Text style={styles.templateButtonText}>Templates</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.templateButton}
          onPress={handleAutoLayout}>
          <Text style={styles.templateButtonText}>Auto Layout</Text>
        </TouchableOpacity>
      </View>


      {/* Template selection */}
      {showTemplates && (
        <View style={styles.templateSelector}>
          <Text style={styles.controlsTitle}>Choose Template</Text>
          <AnimatedScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TemplateService.getInstance().getTemplates().map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateOption}
                onPress={() => handleApplyTemplate(template.id)}>
                <Text style={styles.templateOptionText}>{template.name}</Text>
                <Text style={styles.templateOptionDesc}>{template.description}</Text>
              </TouchableOpacity>
            ))}
          </AnimatedScrollView>
        </View>
      )}

      {/* Text controls */}
      <AnimatedScrollView style={styles.controlsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.controlsTitle}>Text Size</Text>
        <View style={styles.sizeControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleFontSizeChange(-2)}>
            <Text style={styles.controlButtonText}>A-</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleFontSizeChange(2)}>
            <Text style={styles.controlButtonText}>A+</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.controlsTitle}>Text Alignment</Text>
        <View style={styles.alignControls}>
          <TouchableOpacity 
            style={[styles.controlButton, currentSlide.textAlign === 'left' && styles.activeControlButton]}
            onPress={() => handleTextAlignChange('left')}>
            <Text style={styles.controlButtonText}>L</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, currentSlide.textAlign === 'center' && styles.activeControlButton]}
            onPress={() => handleTextAlignChange('center')}>
            <Text style={styles.controlButtonText}>C</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, currentSlide.textAlign === 'right' && styles.activeControlButton]}
            onPress={() => handleTextAlignChange('right')}>
            <Text style={styles.controlButtonText}>R</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.controlsTitle}>Text Color</Text>
        <View style={styles.colorControls}>
          {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorButton, { backgroundColor: color }, currentSlide.color === color && styles.activeColorButton]}
              onPress={() => handleTextColorChange(color)}
            />
          ))}
        </View>
        
        <Text style={styles.controlsTitle}>Background Opacity</Text>
        <View style={styles.opacityControls}>
          {[0, 0.2, 0.4, 0.6, 0.8].map((opacity) => (
            <TouchableOpacity
              key={opacity}
              style={[styles.opacityButton, { backgroundColor: `rgba(0,0,0,${opacity})` }]}
              onPress={() => handleBackgroundOpacityChange(opacity)}
            />
          ))}
        </View>
      </AnimatedScrollView>
      
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
    justifyContent: 'center',
    padding: 20,
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
    maxWidth: '90%', // Increased from 80% to 90%
    // Add these properties to better contain text
    overflow: 'hidden',
  },
  slideText: {
    color: '#fff',
    fontWeight: 'bold',
    // Add these properties to better handle text wrapping
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  slideNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  navButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
  },
  navButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  templateControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  templateButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    flex: 1,
  },
  templateButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  activeButton: {
    backgroundColor: '#34C759',
  },
  templateSelector: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  templateOption: {
    backgroundColor: '#fff',
    padding: 15,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 120,
  },
  templateOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  templateOptionDesc: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    maxHeight: 200,
    padding: 20,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  sizeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  alignControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  colorControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  opacityControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  controlButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    margin: 5,
    borderRadius: 5,
    minWidth: 50,
  },
  activeControlButton: {
    backgroundColor: '#007AFF',
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  activeColorButton: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  opacityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  controlButtonText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewButton: {
    backgroundColor: '#34C759',
    padding: 15,
    margin: 20,
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