import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

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
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const handleExport = () => {
    Alert.alert(
      'Export Slides',
      'In a complete implementation, this would export your slides to your device gallery.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
            Alert.alert('Success', 'Slides exported successfully!');
            navigation.navigate('Home');
          }
        }
      ]
    );
  };

  const renderSlide = ({ item }: { item: any; index: number }) => (
    <View style={styles.slideContainer}>
      {item.image ? (
        <View style={styles.imageBackground} />
      ) : (
        <View style={styles.plainBackground} />
      )}
      
      <View 
        style={[
          styles.textOverlay, 
          {
            left: item.position?.x || 50,
            top: item.position?.y || 50,
          }
        ]}>
        <Text style={[styles.slideText, { fontSize: item.fontSize || 24 }]}>
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
          <FlatList
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
      <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
        <Text style={styles.exportButtonText}>Export Slides</Text>
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
    width: 300,
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 10,
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