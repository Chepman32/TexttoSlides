import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ImageService from '../services/ImageService';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';
import { smartSplit, getOptimalSlideCount, optimizeForSlides } from '../utils/textUtils';
import { useLanguage } from '../context/LanguageContext';

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
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  // Initialize selectedImages array with empty slots for each slide
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const hasRestoredImages = React.useRef(false);
  
  // Optimize text for slides and split using advanced algorithms
  const optimizedText = optimizeForSlides(text);
  const optimalSlideCount = getOptimalSlideCount(optimizedText);
  let slides = smartSplit(optimizedText, optimalSlideCount);

  // Ensure we always have at least one slide
  if (!slides || slides.length === 0) {
    slides = [optimizedText || text || 'No content'];
  }

  const requiredImages = slides.length;

  useEffect(() => {
    if (hasRestoredImages.current) {
      return;
    }

    let isActive = true;

    const restoreImages = async () => {
      try {
        const savedProject = await StorageService.loadCurrentProject();
        if (
          !isActive ||
          !savedProject ||
          savedProject.isCompleted ||
          !savedProject.slides ||
          savedProject.slides.length === 0
        ) {
          return;
        }

        const restoredImages = Array.from({ length: requiredImages }, (_, idx) => {
          const savedSlide = savedProject.slides?.[idx];
          if (!savedSlide) {
            return '';
          }
          return savedSlide.image ?? '';
        });

        if (restoredImages.some(image => image !== '')) {
          hasRestoredImages.current = true;
          setSelectedImages(restoredImages);
        }
      } catch (error) {
        console.error('Failed to restore selected images:', error);
      }
    };

    restoreImages();

    return () => {
      isActive = false;
    };
  }, [requiredImages]);

  const handleSelectImage = async (index: number) => {
    FeedbackService.buttonTap();

    try {
      // First try to get permission by directly calling pickFromGallery
      const imageUri = await ImageService.pickFromGallery();

      if (imageUri) {
        console.log('Selected image URI:', imageUri);
        const newImages = [...selectedImages];
        newImages[index] = imageUri;
        setSelectedImages(newImages);
        FeedbackService.success();

        // Try to process the image in the background (optional)
        ImageService.processImage(imageUri, {
          width: 1080,
          height: 1080,
          quality: 0.8,
        }).then(processedUri => {
          if (processedUri) {
            console.log('Processed image URI:', processedUri);
            // Update with processed image if successful
            const updatedImages = [...selectedImages];
            if (updatedImages[index] === imageUri) {
              updatedImages[index] = processedUri;
              setSelectedImages(updatedImages);
            }
          }
        }).catch(err => {
          console.log('Image processing failed, using original:', err);
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      FeedbackService.error();
      Alert.alert(t('image_selection_error_title'), t('image_selection_error_select_failed'));
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

    // Count how many images have been selected (not empty)
    const selectedCount = selectedImages.filter(img => img !== '').length;

    if (selectedCount < requiredImages) {
      FeedbackService.error();
      Alert.alert(t('image_selection_error_title'), t('image_selection_error', { count: requiredImages }));
      return;
    }
    
    FeedbackService.success();
    // Navigate to editor with text and selected images
    navigation.navigate('Editor', { text, images: selectedImages });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.subtitle}>
        {t('image_selection_subtitle', { count: requiredImages, plural: requiredImages > 1 ? 's' : '' })}
      </Text>
      
      <ScrollView style={styles.content}>
        {slides.map((slideText, index) => (
          <View key={index} style={styles.slideContainer}>
            <Text style={styles.slideTitle}>{t('image_selection_slide', { number: index + 1 })}</Text>
            <Text style={styles.slidePreview} numberOfLines={3}>
              {slideText}
            </Text>
            
            <View style={styles.imageOptions}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleSelectImage(index)}>
                <Text style={styles.imageButtonText}>{t('image_selection_select_image')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.imageButton, styles.plainButton]}
                onPress={() => handleUsePlainBackground(index)}>
                <Text style={styles.imageButtonText}>{t('image_selection_plain_background')}</Text>
              </TouchableOpacity>
            </View>
            
            {selectedImages[index] !== '' ? (
              <View style={styles.imagePreview}>
                {selectedImages[index] !== '' ? (
                  <Image
                    source={{ uri: selectedImages[index] }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.plainBackgroundPreview}>
                    <Text style={styles.plainBackgroundText}>{t('image_selection_plain_background')}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyImagePreview}>
                <Text style={styles.emptyImageText}>{t('image_selection_no_image')}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          selectedImages.filter(img => img !== '').length === requiredImages && styles.continueButtonEnabled
        ]}
        onPress={handleContinue}
        disabled={selectedImages.filter(img => img !== '').length !== requiredImages}>
        <Text style={styles.continueButtonText}>{t('image_selection_continue')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  slideContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
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
    backgroundColor: '#666',
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
  emptyImagePreview: {
    marginTop: 10,
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyImageText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#ccc',
    padding: 15,
    margin: 8,
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
