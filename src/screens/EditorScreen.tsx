import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  Editor: { text: string; images: string[] };
  Preview: { slides: any[] };
};

type EditorRouteProp = RouteProp<RootStackParamList, 'Editor'>;
type EditorNavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

// Simple slide type
type Slide = {
  id: number;
  text: string;
  image: string;
  position: { x: number; y: number };
  fontSize: number;
};

const EditorScreen: React.FC = () => {
  const route = useRoute<EditorRouteProp>();
  const navigation = useNavigation<EditorNavigationProp>();
  const { text, images } = route.params;
  
  // Split text into slides
  const splitTextIntoSlides = (inputText: string): string[] => {
    const paragraphs = inputText.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.length > 0 ? paragraphs : [inputText];
  };
  
  const textSlides = splitTextIntoSlides(text);
  
  // Create slides with text and images
  const initialSlides: Slide[] = textSlides.map((slideText, index) => ({
    id: index,
    text: slideText,
    image: images[index] || '',
    position: { x: 50, y: 50 },
    fontSize: 24,
  }));
  
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  const currentSlide = slides[currentSlideIndex];

  const handleMoveText = (direction: 'up' | 'down' | 'left' | 'right') => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      
      switch (direction) {
        case 'up':
          slide.position.y = Math.max(0, slide.position.y - 10);
          break;
        case 'down':
          slide.position.y = Math.min(300, slide.position.y + 10);
          break;
        case 'left':
          slide.position.x = Math.max(0, slide.position.x - 10);
          break;
        case 'right':
          slide.position.x = Math.min(300, slide.position.x + 10);
          break;
      }
      
      newSlides[currentSlideIndex] = slide;
      return newSlides;
    });
  };

  const handleFontSizeChange = (change: number) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      
      slide.fontSize = Math.max(12, Math.min(48, slide.fontSize + change));
      newSlides[currentSlideIndex] = slide;
      return newSlides;
    });
  };

  const handlePreview = () => {
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
        <View style={styles.slidePreview}>
          {currentSlide.image ? (
            <View style={styles.imageBackground} />
          ) : (
            <View style={styles.plainBackground} />
          )}
          
          <View 
            style={[
              styles.textOverlay, 
              {
                left: currentSlide.position.x,
                top: currentSlide.position.y,
              }
            ]}>
            <Text style={[styles.slideText, { fontSize: currentSlide.fontSize }]}>
              {currentSlide.text}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Slide navigation */}
      <View style={styles.slideNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
          disabled={currentSlideIndex === 0}>
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
          disabled={currentSlideIndex === slides.length - 1}>
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
      
      {/* Text controls */}
      <View style={styles.controlsContainer}>
        <Text style={styles.controlsTitle}>Text Position</Text>
        <View style={styles.positionControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleMoveText('up')}>
            <Text style={styles.controlButtonText}>↑</Text>
          </TouchableOpacity>
          
          <View style={styles.horizontalControls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => handleMoveText('left')}>
              <Text style={styles.controlButtonText}>←</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => handleMoveText('right')}>
              <Text style={styles.controlButtonText}>→</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleMoveText('down')}>
            <Text style={styles.controlButtonText}>↓</Text>
          </TouchableOpacity>
        </View>
        
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
    width: 300,
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  plainBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
  },
  textOverlay: {
    position: 'absolute',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 5,
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
  controlsContainer: {
    padding: 20,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  positionControls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  horizontalControls: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  sizeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    margin: 5,
    borderRadius: 5,
    minWidth: 50,
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