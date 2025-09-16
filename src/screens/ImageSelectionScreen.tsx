import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ImageService from '../services/ImageService';
import FeedbackService from '../services/FeedbackService';
import { smartSplit, getOptimalSlideCount, optimizeForSlides } from '../utils/textUtils';

type RootStackParamList = {
  Home: undefined;
  ImageSelection: { text: string };
  Editor: { text: string; images: string[] };
};

type ImageSelectionRouteProp = RouteProp<RootStackParamList, 'ImageSelection'>;
type ImageSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'Editor'>;

const ImageSelectionScreen: React.FC = () => {
  const route = useRoute<ImageSelectionRouteProp>();
  const navigation = useNavigation<ImageSelectionNavigationProp>();
  const { text } = route.params;
  
  // For now, we'll use placeholder images
  // In a real app, we would integrate with image picker libraries
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // Optimize text for slides and split using advanced algorithms
  const optimizedText = optimizeForSlides(text);
  const optimalSlideCount = getOptimalSlideCount(optimizedText);
  const slides = smartSplit(optimizedText, optimalSlideCount);
  const requiredImages = slides.length;

  const handleSelectImage = async (index: number) => {
    FeedbackService.buttonTap();
    
    try {
      const imageUri = await ImageService.showImagePickerOptions();
      
      if (imageUri) {
        // Process the image to ensure it's optimized for slides
        const processedUri = await ImageService.processImage(imageUri, {
          width: 1080,
          height: 1080,
          quality: 0.8,
        });
        
        if (processedUri) {
          const newImages = [...selectedImages];
          newImages[index] = processedUri;
          setSelectedImages(newImages);
          FeedbackService.success();
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      FeedbackService.error();
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleUsePlainBackground = (index: number) => {
    FeedbackService.buttonTap();
    const newImages = [...selectedImages];
    newImages[index] = ''; // Empty string for plain background
    setSelectedImages(newImages);
    FeedbackService.success();
  };

  const handleContinue = () => {
    FeedbackService.buttonTap();
    
    if (selectedImages.length < requiredImages) {
      FeedbackService.error();
      Alert.alert('Error', `Please select ${requiredImages} images for your slides`);
      return;
    }
    
    FeedbackService.success();
    // Navigate to editor with text and selected images
    navigation.navigate('Editor', { text, images: selectedImages });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Images</Text>
      <Text style={styles.subtitle}>
        Choose background images for your {requiredImages} slide{requiredImages > 1 ? 's' : ''}
      </Text>
      
      <ScrollView style={styles.content}>
        {slides.map((slideText, index) => (
          <View key={index} style={styles.slideContainer}>
            <Text style={styles.slideTitle}>Slide {index + 1}</Text>
            <Text style={styles.slidePreview} numberOfLines={3}>
              {slideText}
            </Text>
            
            <View style={styles.imageOptions}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleSelectImage(index)}>
                <Text style={styles.imageButtonText}>Select Image</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.imageButton, styles.plainButton]}
                onPress={() => handleUsePlainBackground(index)}>
                <Text style={styles.imageButtonText}>Plain Background</Text>
              </TouchableOpacity>
            </View>
            
            {selectedImages[index] ? (
              <View style={styles.imagePreview}>
                {selectedImages[index] ? (
                  <Image 
                    source={{ uri: selectedImages[index] }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.plainBackgroundPreview}>
                    <Text style={styles.plainBackgroundText}>Plain Background</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={[
          styles.continueButton, 
          selectedImages.length === requiredImages && styles.continueButtonEnabled
        ]} 
        onPress={handleContinue}
        disabled={selectedImages.length !== requiredImages}>
        <Text style={styles.continueButtonText}>Continue to Editor</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  slideContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slidePreview: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
  },
  plainButton: {
    backgroundColor: '#f0f0f0',
  },
  imageButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  selectedText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: 'bold',
  },
  imagePreview: {
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  plainBackgroundPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plainBackgroundText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#ccc',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#007AFF',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ImageSelectionScreen;