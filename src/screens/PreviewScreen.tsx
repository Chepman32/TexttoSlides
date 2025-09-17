import React, { useState, useRef } from 'react';
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
  Platform,
} from 'react-native';

// Create animated FlatList component
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImageService from '../services/ImageService';
import FeedbackService from '../services/FeedbackService';

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
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRefs = useRef<View[]>([]);
  const { width: screenWidth } = Dimensions.get('window');
  const slideSize = Math.min(screenWidth - 40, 350);
  
  const handleExport = async () => {
    if (isExporting) return;
    
    FeedbackService.buttonTap();
    setIsExporting(true);
    
    try {
      // Check and request photo library permissions
      const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
      const permissionStatus = await check(permission);
      
      if (permissionStatus !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Please grant photo library access to save your slides.',
            [{ text: 'OK' }]
          );
          setIsExporting(false);
          return;
        }
      }
      const exportedImages: string[] = [];
      
      for (let i = 0; i < slides.length; i++) {
        const slideRef = slideRefs.current[i];
        if (slideRef) {
          try {
            // Try using tmpfile approach with better error handling
            const uri = await captureRef(slideRef, {
              format: 'jpg',
              quality: 0.9,
              result: 'tmpfile',
            });
            
            console.log('Captured slide', i + 1, 'at:', uri);
            
            // Wait a moment for file system to catch up
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Check if file exists
            const fileExists = await RNFS.exists(uri);
            console.log('File exists:', fileExists, 'at path:', uri);
            
            if (!fileExists) {
              console.error('Captured file does not exist:', uri);
              continue;
            }
            
            // Get file stats to verify it's not empty
            const stats = await RNFS.stat(uri);
            console.log('File stats:', stats);
            
            if (stats.size === 0) {
              console.error('Captured file is empty:', uri);
              continue;
            }
            
            // Save to Photos using CameraRoll
            const savedImage = await CameraRoll.save(uri, { type: 'photo' });
            console.log('Saved to Photos:', savedImage);
            exportedImages.push(savedImage);
            
          } catch (captureError) {
            console.error('Error capturing slide', i + 1, ':', captureError);
            // Continue with other slides even if one fails
          }
        }
      }
      
      FeedbackService.success();
      Alert.alert(
        'Export Complete',
        `Successfully exported ${exportedImages.length} slides to your Photos app!`,
        [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]
      );
      
    } catch (error) {
      console.error('Export error:', error);
      FeedbackService.error();
      Alert.alert('Export Failed', 'Failed to export slides. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderSlide = ({ item, index }: { item: any; index: number }) => (
    <View 
      ref={(ref) => {
        if (ref) slideRefs.current[index] = ref;
      }}
      style={[styles.slideContainer, { width: slideSize, height: slideSize }]}>
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.imageBackground}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.plainBackground} />
      )}
      
      <View 
        style={[
          styles.textOverlay, 
          {
            left: item.position?.x || 50,
            top: item.position?.y || 50,
            backgroundColor: item.backgroundColor || 'rgba(0,0,0,0.5)',
          }
        ]}>
        <Text style={[
          styles.slideText, 
          { 
            fontSize: item.fontSize || 24,
            color: item.color || '#FFFFFF',
            textAlign: item.textAlign || 'center',
            fontWeight: item.fontWeight || 'bold',
          }
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Preview</Text>
        <Text style={styles.slideIndicator}>
          Slide {currentSlideIndex + 1} of {slides.length}
        </Text>
      </View>
      
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
            snapToInterval={300}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No slides to preview</Text>
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
        style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
        onPress={handleExport}
        disabled={isExporting}>
        <Text style={styles.exportButtonText}>
          {isExporting ? 'Exporting...' : 'Export Slides'}
        </Text>
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
    maxWidth: '80%',
  },
  slideText: {
    color: '#fff',
    fontWeight: 'bold',
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
});

export default PreviewScreen;