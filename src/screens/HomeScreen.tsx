import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import { RootStackParamList } from '../navigation/AppNavigator';
import StorageService, { ProjectState } from '../services/StorageService';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const [recentProjects, setRecentProjects] = useState<ProjectState[]>([]);

  const loadRecentProjects = useCallback(async () => {
    try {
      const projects = await StorageService.getRecentProjects();
      setRecentProjects(projects); // Show all projects (up to 10)
    } catch (error) {
      console.error('Error loading recent projects:', error);
    }
  }, []);

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  useFocusEffect(
    useCallback(() => {
      loadRecentProjects();
    }, [loadRecentProjects])
  );

  const handleSettings = () => {
    FeedbackService.buttonTap();
    navigation.navigate('Settings');
  };

  const pickTwoPhotos = () => {
    FeedbackService.buttonTap();
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
        selectionLimit: 2,
      },
      response => {
        if (response.didCancel || response.errorMessage) return;

        const assets = response.assets;
        if (assets && assets.length >= 1) {
          const photoA = assets[0]?.uri;
          const photoB = assets[1]?.uri;
          navigation.navigate('Composer', { photoA, photoB });
        }
      }
    );
  };

  const handleFromCamera = () => {
    FeedbackService.buttonTap();
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
      },
      response => {
        if (response.didCancel || response.errorMessage) return;

        const asset = response.assets?.[0];
        if (asset?.uri) {
          navigation.navigate('Composer', { photoA: asset.uri });
        }
      }
    );
  };

  const handleFromGallery = () => {
    FeedbackService.buttonTap();
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
        selectionLimit: 2,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) return;

        const assets = response.assets;
        if (assets && assets.length >= 1) {
          const photoA = assets[0]?.uri;
          const photoB = assets[1]?.uri;
          navigation.navigate('Composer', { photoA, photoB });
        }
      }
    );
  };

  const handleFromFiles = () => {
    FeedbackService.buttonTap();
    // For now, use image library as fallback for file picker
    // TODO: Implement proper file picker with DocumentPicker when available
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
        selectionLimit: 2,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) return;

        const assets = response.assets;
        if (assets && assets.length >= 1) {
          const photoA = assets[0]?.uri;
          const photoB = assets[1]?.uri;
          navigation.navigate('Composer', { photoA, photoB });
        }
      }
    );
  };

  const handleUseLastPhoto = () => {
    FeedbackService.buttonTap();
    // TODO: Implement logic to get last used photo from storage
    Alert.alert(
      'Use Last Photo',
      'This feature will remember your last used photo. For now, please select photos from Gallery or Camera.',
      [{ text: 'OK' }]
    );
  };

  const handleTemplate = () => {
    FeedbackService.buttonTap();
    // Navigate to composer without photos to show template selection
    navigation.navigate('Composer', { showTemplates: true });
  };

  const handleRecentProject = async (projectId: string) => {
    FeedbackService.buttonTap();
    try {
      const project = recentProjects.find(p => p.id === projectId);
      if (project) {
        // Load the project and navigate to composer
        // Pass the first two images as photoA and photoB if available, plus the project ID
        const photoA = project.images?.[0];
        const photoB = project.images?.[1];
        navigation.navigate('Composer', { photoA, photoB, projectId: project.id });
      }
    } catch (error) {
      console.error('Error opening recent project:', error);
      Alert.alert('Error', 'Failed to open project. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Canvas style={StyleSheet.absoluteFillObject}>
        <Rect x={0} y={0} width={screenWidth} height={screenHeight}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, screenHeight)}
            colors={['#E6E6FA', '#87CEEB', '#DDA0DD']}
          />
        </Rect>
      </Canvas>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Before/After</Text>
            <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
              <Image
                source={require('../assets/icons/settings-gear.png')}
                style={styles.settingsIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Main Card */}
          <View style={styles.mainCard}>
            <View style={styles.cameraIconContainer}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>

            <Text style={styles.mainTitle}>{t('pick_two_photos')}</Text>

            <Text style={styles.subtitle}>
              Pick two photos to create{'\n'}amazing before/after
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleFromCamera}>
              <View style={[styles.actionIcon, { backgroundColor: '#696969' }]}>
                <Text style={styles.actionIconText}>📷</Text>
              </View>
              <Text style={styles.actionLabel}>{t('from_camera')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleFromGallery}>
              <View style={[styles.actionIcon, { backgroundColor: '#666666' }]}>
                <Text style={styles.actionIconText}>📁</Text>
              </View>
              <Text style={styles.actionLabel}>{t('gallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleFromFiles}>
              <View style={[styles.actionIcon, { backgroundColor: '#20B2AA' }]}>
                <Text style={styles.actionIconText}>📄</Text>
              </View>
              <Text style={styles.actionLabel}>From{'\n'}Files</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleUseLastPhoto}>
              <View style={[styles.actionIcon, { backgroundColor: '#4169E1' }]}>
                <Text style={styles.actionIconText}>↻</Text>
              </View>
              <Text style={styles.actionLabel}>Use{'\n'}Last</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleTemplate}>
              <View style={[styles.actionIcon, { backgroundColor: '#9370DB' }]}>
                <Text style={styles.actionIconText}>⏱</Text>
              </View>
              <Text style={styles.actionLabel}>{t('templates')}</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>{t('recent_projects')}</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.projectsScrollContainer}
                style={styles.projectsScroll}
              >
                {recentProjects.map((project, index) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.projectCard}
                    onPress={() => handleRecentProject(project.id)}
                  >
                    <View style={styles.projectImage}>
                      {/* Show project thumbnail if available, otherwise show placeholder */}
                      {project.images && project.images[0] ? (
                        <Image
                          source={{ uri: project.images[0] }}
                          style={styles.projectImagePlaceholder}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[
                          styles.projectImagePlaceholder,
                          { backgroundColor: ['#98FB98', '#87CEEB', '#DDA0DD', '#FFB6C1', '#98D8E8', '#F0E68C', '#DEB887', '#D8BFD8', '#F5DEB3', '#B0E0E6'][index % 10] }
                        ]} />
                      )}
                    </View>
                    <Text style={styles.projectTitle} numberOfLines={1}>
                      {project.text || `Project ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Pro Tip */}
          <View style={styles.proTipSection}>
            <View style={styles.proTipContent}>
              <Text style={styles.proTipIcon}>💡</Text>
              <View style={styles.proTipText}>
                <Text style={styles.proTipTitle}>Pro Tip</Text>
                <Text style={styles.proTipDescription}>
                  Choose photos with similar lighting and compositionn for the best before/after effect
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    width: 28,
    height: 28,
    tintColor: '#666666',
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 24,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  cameraIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cameraIcon: {
    fontSize: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
  },
  actionButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 24,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 18,
    color: 'white',
  },
  actionLabel: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 16,
  },
  recentSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  projectsScroll: {
    flexGrow: 0,
  },
  projectsScrollContainer: {
    paddingRight: 24,
  },
  projectCard: {
    alignItems: 'center',
    width: 100,
    marginRight: 16,
  },
  projectImage: {
    width: 80,
    height: 60,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  projectImagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  projectTitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  proTipSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  proTipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  proTipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  proTipText: {
    flex: 1,
  },
  proTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  proTipDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default HomeScreen;