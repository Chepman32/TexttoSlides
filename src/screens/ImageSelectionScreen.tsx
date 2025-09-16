import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

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
  
  // Split text into slides (simplified logic)
  const splitTextIntoSlides = (inputText: string): string[] => {
    // Simple split by paragraphs or sentences
    const paragraphs = inputText.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.length > 0 ? paragraphs : [inputText];
  };
  
  const slides = splitTextIntoSlides(text);
  const requiredImages = slides.length;

  const handleSelectImage = (index: number) => {
    // In a real app, this would open the image picker
    Alert.alert(
      'Image Selection',
      'In a complete implementation, this would open the image picker to select a background image for this slide.',
      [{ text: 'OK' }]
    );
    
    // For demo purposes, we'll just add a placeholder
    const newImages = [...selectedImages];
    newImages[index] = `https://picsum.photos/400/400?random=${index}`;
    setSelectedImages(newImages);
  };

  const handleUsePlainBackground = (index: number) => {
    const newImages = [...selectedImages];
    newImages[index] = ''; // Empty string for plain background
    setSelectedImages(newImages);
  };

  const handleContinue = () => {
    if (selectedImages.length < requiredImages) {
      Alert.alert('Error', `Please select ${requiredImages} images for your slides`);
      return;
    }
    
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
              <Text style={styles.selectedText}>
                {selectedImages[index] ? 'Image selected' : 'Plain background selected'}
              </Text>
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