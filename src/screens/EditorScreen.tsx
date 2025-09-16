import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { smartSplit, optimizeForSlides } from '../utils/textUtils';
import FeedbackService from '../services/FeedbackService';
import TemplateService from '../services/TemplateService';
import GraphicsService from '../services/GraphicsService';
import SkiaSlideRenderer from '../components/SkiaSlideRenderer';

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
  
  // Optimize text and split using advanced algorithms
  const optimizedText = optimizeForSlides(text);
  const textSlides = smartSplit(optimizedText, 3); // Default to 3 slides
  
  // Create slides with enhanced properties
  const initialSlides: Slide[] = textSlides.map((slideText, index) => ({
    id: index,
    text: slideText,
    image: images[index] || '',
    position: { x: 50, y: 100 },
    fontSize: 24,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    fontWeight: 'bold',
  }));
  
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [useAdvancedGraphics, setUseAdvancedGraphics] = useState(false);
  const [graphicsStyle, setGraphicsStyle] = useState<'modern' | 'elegant' | 'minimal' | 'dramatic'>('modern');
  
  const currentSlide = slides[currentSlideIndex];
  const { width: screenWidth } = Dimensions.get('window');
  const slideSize = Math.min(screenWidth - 40, 350);

  // Animated values for drag and drop
  const translateX = useSharedValue(currentSlide.position.x);
  const translateY = useSharedValue(currentSlide.position.y);

  // Update animated values when slide changes
  useEffect(() => {
    translateX.value = withSpring(currentSlide.position.x);
    translateY.value = withSpring(currentSlide.position.y);
  }, [currentSlideIndex, currentSlide.position.x, currentSlide.position.y]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
      // Remove the worklet call that was causing issues
      // FeedbackService.textDrag();
    },
    onActive: (event, context) => {
      const newX = context.startX + event.translationX;
      const newY = context.startY + event.translationY;
      
      // Constrain to slide bounds
      const maxX = slideSize - 200; // Approximate text width
      const maxY = slideSize - 100; // Approximate text height
      
      translateX.value = Math.max(0, Math.min(maxX, newX));
      translateY.value = Math.max(0, Math.min(maxY, newY));
    },
    onEnd: () => {
      // Update slide position
      setSlides(prevSlides => {
        const newSlides = [...prevSlides];
        const slide = newSlides[currentSlideIndex];
        slide.position = {
          x: translateX.value,
          y: translateY.value,
        };
        newSlides[currentSlideIndex] = slide;
        return newSlides;
      });
      // Remove the worklet call that was causing issues
      // FeedbackService.success();
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const handleFontSizeChange = (change: number) => {
    FeedbackService.textResize();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      
      slide.fontSize = Math.max(12, Math.min(48, slide.fontSize + change));
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
    const template = TemplateService.applyTemplate(templateId, currentSlide.text);
    
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      
      if (template.position) slide.position = template.position;
      if (template.fontSize) slide.fontSize = template.fontSize;
      if (template.color) slide.color = template.color;
      if (template.backgroundColor) slide.backgroundColor = template.backgroundColor;
      if (template.textAlign) slide.textAlign = template.textAlign;
      if (template.fontWeight) slide.fontWeight = template.fontWeight;
      
      newSlides[currentSlideIndex] = slide;
      return newSlides;
    });
    
    setShowTemplates(false);
    FeedbackService.success();
  };

  const handleAutoLayout = () => {
    FeedbackService.buttonTap();
    const autoLayout = TemplateService.autoLayout({
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

  const handlePreview = () => {
    FeedbackService.buttonTap();
    navigation.navigate('Preview', { slides });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Slide Editor</Text>
        <Text style={styles.slideIndicator}>
          Slide {currentSlideIndex + 1} of {slides.length}
        </Text>
      </View>
      
      {/* Slide preview area */}
      <View style={styles.editorContainer}>
        {useAdvancedGraphics ? (
          <SkiaSlideRenderer
            slide={currentSlide}
            width={slideSize}
            height={slideSize}
            styleName={graphicsStyle}
          />
        ) : (
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
            
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View 
                style={[
                  styles.textOverlay, 
                  animatedStyle,
                  {
                    backgroundColor: currentSlide.backgroundColor,
                  }
                ]}>
                <Text style={[
                  styles.slideText, 
                  { 
                    fontSize: currentSlide.fontSize,
                    color: currentSlide.color,
                    textAlign: currentSlide.textAlign,
                    fontWeight: currentSlide.fontWeight,
                  }
                ]}>
                  {currentSlide.text}
                </Text>
              </Animated.View>
            </PanGestureHandler>
          </View>
        )}
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
        
        <TouchableOpacity 
          style={[styles.templateButton, useAdvancedGraphics && styles.activeButton]}
          onPress={() => setUseAdvancedGraphics(!useAdvancedGraphics)}>
          <Text style={styles.templateButtonText}>Skia Graphics</Text>
        </TouchableOpacity>
      </View>

      {/* Graphics style selection */}
      {useAdvancedGraphics && (
        <View style={styles.graphicsStyleSelector}>
          <Text style={styles.controlsTitle}>Graphics Style</Text>
          <View style={styles.styleOptions}>
            {(['modern', 'elegant', 'minimal', 'dramatic'] as const).map((style) => (
              <TouchableOpacity
                key={style}
                style={[styles.styleOption, graphicsStyle === style && styles.activeStyleOption]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  setGraphicsStyle(style);
                }}>
                <Text style={styles.styleOptionText}>{style.charAt(0).toUpperCase() + style.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Template selection */}
      {showTemplates && (
        <View style={styles.templateSelector}>
          <Text style={styles.controlsTitle}>Choose Template</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TemplateService.getTemplates().map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateOption}
                onPress={() => handleApplyTemplate(template.id)}>
                <Text style={styles.templateOptionText}>{template.name}</Text>
                <Text style={styles.templateOptionDesc}>{template.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Text controls */}
      <ScrollView style={styles.controlsContainer} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
      
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  slideIndicator: {
    fontSize: 16,
    color: '#666',
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
    maxWidth: '80%',
  },
  slideText: {
    color: '#fff',
    fontWeight: 'bold',
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
  graphicsStyleSelector: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  styleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  styleOption: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 60,
  },
  activeStyleOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  styleOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
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
});

export default EditorScreen;