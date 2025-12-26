import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  PermissionsAndroid,
  Platform,
  TextInput,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Image,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { captureRef } from 'react-native-view-shot';
import Slider from '@react-native-community/slider';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import StorageService, { ProjectState } from '../services/StorageService';
import {
  CompositionState,
  LayoutType,
  LabelStyle,
  ImageOffset,
} from '../types/composer';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  defaultTemplates,
  applyTemplate,
  Template,
} from '../constants/templates';
import {
  TextEffectInstance,
  createTextEffectInstance,
  SUPPORTED_TEXT_EFFECT_TYPES,
  getTextEffectDefinition,
} from '../constants/textEffects';
import CompositionCanvas from '../components/CompositionCanvas';
import VerticalPager from '../components/VerticalPager';

// Export icons
const InstagramIcon = require('../assets/icons/export/Instagram.png');
const XIcon = require('../assets/icons/export/X.png');
const GalleryIcon = require('../assets/icons/export/Gallery.png');
const ShareIcon = require('../assets/icons/export/Share.png');

type ComposerRouteProp = RouteProp<RootStackParamList, 'Composer'>;
type ComposerNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ExportResult'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ComposerScreen: React.FC = () => {
  const route = useRoute<ComposerRouteProp>();
  const navigation = useNavigation<ComposerNavigationProp>();
  const insets = useSafeAreaInsets();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();

  // Function to get translated template name
  const getTemplateNameKey = (templateId: string) => {
    const templateNameMap: { [key: string]: string } = {
      'side-by-side': 'composer_layoutSideBySide',
      'horizontal-split': 'horizontal_split',
      'diagonal-split': 'composer_layoutDiagonal',
      'slider-reveal': 'composer_layoutSlider',
      'stacked-bar': 'composer_layoutStacked',
      'device-showcase': 'device_showcase',
      'polaroid-collage': 'polaroid_collage',
      minimal: 'minimal',
      elegant: 'elegant',
      bold: 'bold',
      diagonal: 'composer_layoutDiagonal',
      modern: 'modern',
    };
    return templateNameMap[templateId] || templateId;
  };

  // Function to get translated text effect name
  const getTextEffectNameKey = (effectType: string) => {
    const effectNameMap: { [key: string]: string } = {
      softShadow: 'soft_shadow',
      neonGlow: 'neon_glow',
      longShadow: 'long_shadow',
      bloom: 'bloom',
      letterpress: 'letterpress',
    };
    return effectNameMap[effectType] || effectType;
  };

  // Canvas ref for export
  const canvasRef = useRef<any>(null);

  // Initialize composition state - use saved composition if reopening a project
  const [composition, setComposition] = useState<CompositionState>(() => {
    // If we have a saved composition from a reopened project, use it
    if (route.params?.savedComposition) {
      return {
        ...route.params.savedComposition,
        // Ensure photos are set from params if composition doesn't have them
        photoAUri:
          route.params.savedComposition.photoAUri || route.params?.photoA,
        photoBUri:
          route.params.savedComposition.photoBUri || route.params?.photoB,
      };
    }
    // Otherwise use defaults
    return {
      photoAUri: route.params?.photoA,
      photoBUri: route.params?.photoB,
      layout: 'side',
      spacing: 12,
      cornerRadius: 16,
      aspect: 'free',
      labels: {
        textBefore: t('before'),
        textAfter: t('after'),
        fontFamily: 'System',
        fontSize: 24,
        fontWeight: 'Bold',
        color: '#000000',
        position: 'bl',
        margin: 16,
        show: true,
        textEffects: [],
      },
      background: {
        type: 'solid',
        colors: ['#FFFFFF'],
      },
      frame: {
        on: false,
        thickness: 4,
        color: '#000000',
        padding: 8,
      },
      watermarkOn: true,
    };
  });

  // Active tool panel state
  const [activePanel, setActivePanel] = useState<
    'layout' | 'labels' | 'style' | 'export'
  >('layout');

  // Selected template ID for highlighting
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  // Project ID for saving to recent projects - use existing ID if reopening project
  const [projectId] = useState(
    () =>
      route.params?.projectId ||
      `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );

  // Text editing modal state (removed - now using inline TextInput)

  // Undo/Redo functionality
  const [history, setHistory] = useState<CompositionState[]>([composition]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addToHistory = useCallback(
    (newComposition: CompositionState) => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newComposition);
        // Limit history to 20 items
        if (newHistory.length > 20) {
          newHistory.shift();
          setHistoryIndex(19);
        } else {
          setHistoryIndex(newHistory.length - 1);
        }
        return newHistory;
      });
    },
    [historyIndex],
  );

  const updateComposition = useCallback(
    (updates: Partial<CompositionState>) => {
      setComposition(prev => {
        const newComposition = { ...prev, ...updates };
        addToHistory(newComposition);
        return newComposition;
      });
    },
    [addToHistory],
  );

  // Track which image is being panned and the starting offset
  const panningImageRef = useRef<'A' | 'B' | null>(null);
  const startOffsetRef = useRef<ImageOffset>({ x: 0, y: 0 });
  const compositionRef = useRef(composition);

  // Keep compositionRef in sync
  useEffect(() => {
    compositionRef.current = composition;
  }, [composition]);

  // Track if we're dragging the slider handle
  const isDraggingSliderRef = useRef(false);
  const sliderStartPositionRef = useRef(0.5);

  // Calculate max offset for image panning based on cover fit
  const calculateMaxOffset = (
    imgWidth: number,
    imgHeight: number,
    containerWidth: number,
    containerHeight: number,
  ) => {
    if (!imgWidth || !imgHeight) return { maxX: 0, maxY: 0 };
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const scale = Math.max(scaleX, scaleY);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    return {
      maxX: Math.max(0, (scaledWidth - containerWidth) / 2),
      maxY: Math.max(0, (scaledHeight - containerHeight) / 2),
    };
  };

  // Pan responder for image panning and slider dragging
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only respond to pan if there's significant movement
          return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        },
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const comp = compositionRef.current;
          const { locationX, locationY } = evt.nativeEvent;
          const canvasWidth = screenWidth - 32;

          // Check if this is a slider layout
          if (comp.layout === 'slider') {
            const sliderPos = comp.sliderPosition ?? 0.5;
            const sliderX = canvasWidth * sliderPos;
            // Check if touch is within 30px of the slider line - drag slider
            if (Math.abs(locationX - sliderX) < 30) {
              isDraggingSliderRef.current = true;
              sliderStartPositionRef.current = sliderPos;
              panningImageRef.current = null;
              return;
            }
            // Otherwise, pan the image based on touch position:
            // Left of slider → pan imageB (After)
            // Right of slider → pan imageA (Before)
            isDraggingSliderRef.current = false;
            if (locationX < sliderX) {
              panningImageRef.current = 'B';
              startOffsetRef.current = comp.photoBOffset || { x: 0, y: 0 };
            } else {
              panningImageRef.current = 'A';
              startOffsetRef.current = comp.photoAOffset || { x: 0, y: 0 };
            }
            return;
          }

          isDraggingSliderRef.current = false;

          // Determine which image was touched based on position
          if (comp.layout === 'side') {
            // Side by side - left half is A, right half is B
            const imageWidth = (canvasWidth - comp.spacing) / 2;
            if (locationX < imageWidth) {
              panningImageRef.current = 'A';
              startOffsetRef.current = comp.photoAOffset || { x: 0, y: 0 };
            } else if (locationX > imageWidth + comp.spacing) {
              panningImageRef.current = 'B';
              startOffsetRef.current = comp.photoBOffset || { x: 0, y: 0 };
            }
          } else if (comp.layout === 'vertical') {
            // Vertical - top half is A, bottom half is B
            const canvasHeight = canvasWidth; // Approximate for 1:1 aspect
            const imageHeight = (canvasHeight - comp.spacing) / 2;
            if (locationY < imageHeight) {
              panningImageRef.current = 'A';
              startOffsetRef.current = comp.photoAOffset || { x: 0, y: 0 };
            } else if (locationY > imageHeight + comp.spacing) {
              panningImageRef.current = 'B';
              startOffsetRef.current = comp.photoBOffset || { x: 0, y: 0 };
            }
          } else if (comp.layout === 'diagonal') {
            // Diagonal - top-left triangle is A, bottom-right triangle is B
            // The diagonal line goes from top-right (canvasWidth, 0) to bottom-left (0, canvasHeight)
            // Point is in top-left triangle if: locationY < canvasHeight - (locationX * canvasHeight / canvasWidth)
            let canvasHeight = canvasWidth;
            if (comp.aspect !== 'free') {
              switch (comp.aspect) {
                case '1:1':
                  canvasHeight = canvasWidth;
                  break;
                case '4:3':
                  canvasHeight = (canvasWidth * 3) / 4;
                  break;
                case '16:9':
                  canvasHeight = (canvasWidth * 9) / 16;
                  break;
              }
            }
            const diagonalY =
              canvasHeight - (locationX * canvasHeight) / canvasWidth;
            if (locationY < diagonalY) {
              panningImageRef.current = 'A';
              startOffsetRef.current = comp.photoAOffset || { x: 0, y: 0 };
            } else {
              panningImageRef.current = 'B';
              startOffsetRef.current = comp.photoBOffset || { x: 0, y: 0 };
            }
          } else if (comp.layout === 'polaroid') {
            // Polaroid - left polaroid is A, right polaroid is B
            // Simple left/right split at center
            if (locationX < canvasWidth / 2) {
              panningImageRef.current = 'A';
              startOffsetRef.current = comp.photoAOffset || { x: 0, y: 0 };
            } else {
              panningImageRef.current = 'B';
              startOffsetRef.current = comp.photoBOffset || { x: 0, y: 0 };
            }
          } else if (comp.layout === 'deviceMockup') {
            // Device mockup - left device is A, right device is B
            // Simple left/right split at center
            if (locationX < canvasWidth / 2) {
              panningImageRef.current = 'A';
              startOffsetRef.current = comp.photoAOffset || { x: 0, y: 0 };
            } else {
              panningImageRef.current = 'B';
              startOffsetRef.current = comp.photoBOffset || { x: 0, y: 0 };
            }
          } else {
            // For other layouts, default to image A
            panningImageRef.current = 'A';
            startOffsetRef.current = comp.photoAOffset || { x: 0, y: 0 };
          }
        },
        onPanResponderMove: (
          _evt: GestureResponderEvent,
          gestureState: PanResponderGestureState,
        ) => {
          const canvasWidth = screenWidth - 32;

          // Handle slider dragging
          if (isDraggingSliderRef.current) {
            const deltaPosition = gestureState.dx / canvasWidth;
            const newPosition = Math.max(
              0.1,
              Math.min(0.9, sliderStartPositionRef.current + deltaPosition),
            );

            setComposition(prev => ({
              ...prev,
              sliderPosition: newPosition,
            }));
            return;
          }

          if (!panningImageRef.current) return;

          const comp = compositionRef.current;

          // Calculate canvas height based on aspect ratio (same logic as CompositionCanvas)
          let canvasHeight = canvasWidth;
          if (comp.aspect !== 'free') {
            switch (comp.aspect) {
              case '1:1':
                canvasHeight = canvasWidth;
                break;
              case '4:3':
                canvasHeight = (canvasWidth * 3) / 4;
                break;
              case '16:9':
                canvasHeight = (canvasWidth * 9) / 16;
                break;
              case '3:2':
                canvasHeight = (canvasWidth * 2) / 3;
                break;
            }
          }

          // Calculate container dimensions based on layout
          let containerWidth = canvasWidth;
          let containerHeight = canvasHeight;

          if (comp.layout === 'vertical') {
            // Each image takes half the height
            containerHeight = (canvasHeight - comp.spacing) / 2;
          } else if (comp.layout === 'side') {
            // Each image takes half the width
            containerWidth = (canvasWidth - comp.spacing) / 2;
          } else if (comp.layout === 'polaroid') {
            // Polaroid photo area dimensions
            const baseSize = Math.min(canvasWidth, canvasHeight);
            const polaroidWidth = baseSize * 0.55;
            const polaroidHeight = baseSize * 0.58;
            const sidePadding = polaroidWidth * 0.06;
            const topPadding = polaroidHeight * 0.05;
            const bottomPadding = polaroidHeight * 0.15;
            containerWidth = polaroidWidth - sidePadding * 2;
            containerHeight = polaroidHeight - topPadding - bottomPadding;
          } else if (comp.layout === 'deviceMockup') {
            // Device screen dimensions
            const deviceWidth = canvasWidth * 0.42;
            const deviceHeight = canvasHeight * 0.9;
            const bezelX = deviceWidth * 0.068;
            const bezelY = deviceHeight * 0.082;
            containerWidth = deviceWidth - bezelX * 2;
            containerHeight = deviceHeight - bezelY * 2;
          }
          // slider and diagonal use full canvas dimensions

          let newOffset: ImageOffset = {
            x: startOffsetRef.current.x + gestureState.dx,
            y: startOffsetRef.current.y + gestureState.dy,
          };

          // Clamp offset to image bounds
          const dims =
            panningImageRef.current === 'A'
              ? comp.photoADimensions
              : comp.photoBDimensions;
          if (dims?.width && dims?.height) {
            const { maxX, maxY } = calculateMaxOffset(
              dims.width,
              dims.height,
              containerWidth,
              containerHeight,
            );
            newOffset = {
              x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
              y: Math.max(-maxY, Math.min(maxY, newOffset.y)),
            };
          }

          // Update the appropriate image offset without adding to history (too many updates)
          setComposition(prev => ({
            ...prev,
            ...(panningImageRef.current === 'A'
              ? { photoAOffset: newOffset }
              : { photoBOffset: newOffset }),
          }));
        },
        onPanResponderRelease: () => {
          isDraggingSliderRef.current = false;
          panningImageRef.current = null;
        },
      }),
    [],
  );

  // Save project to recent projects when images are present
  const saveToRecentProjects = useCallback(
    async (comp: CompositionState, captureThumbnail: boolean = false) => {
      try {
        // Only save if at least one image is present
        if (comp.photoAUri || comp.photoBUri) {
          const images: string[] = [];
          if (comp.photoAUri) images.push(comp.photoAUri);
          if (comp.photoBUri) images.push(comp.photoBUri);

          let thumbnail: string | undefined;

          // Capture thumbnail if canvas is ready and requested
          if (captureThumbnail && canvasRef.current) {
            try {
              thumbnail = await captureRef(canvasRef, {
                format: 'png',
                quality: 0.5,
                width: 200,
                height: 200,
              });
            } catch (thumbError) {
              console.log('Could not capture thumbnail:', thumbError);
            }
          }

          const projectState: ProjectState = {
            id: projectId,
            text: `${comp.labels.textBefore} / ${comp.labels.textAfter}`,
            slides: [],
            images,
            thumbnail,
            composition: comp, // Save full composition state
            lastModified: new Date().toISOString(),
            isCompleted: false,
          };

          await StorageService.saveCurrentProject(projectState);
        }
      } catch (error) {
        console.error('Error saving to recent projects:', error);
      }
    },
    [projectId],
  );

  // Apply template if provided in route params
  useEffect(() => {
    if (route.params?.template && route.params?.useTemplate) {
      const templateComposition = applyTemplate(
        composition,
        route.params.template,
      );
      setComposition(templateComposition);
      setHistory([templateComposition]);
      setHistoryIndex(0);
    }
  }, [route.params?.template, route.params?.useTemplate]);

  // Auto-save to recent projects when composition changes and has images
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToRecentProjects(composition, true); // Capture thumbnail on save
    }, 1500); // Debounce saves by 1.5 seconds to allow canvas to render

    return () => clearTimeout(timer);
  }, [composition, saveToRecentProjects]);

  // Save immediately on mount if images are provided via route params
  useEffect(() => {
    if (route.params?.photoA || route.params?.photoB) {
      // Delay initial save to allow canvas to render
      const timer = setTimeout(() => {
        saveToRecentProjects(composition, true);
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const pickPhoto = (isPhotoA: boolean) => {
    launchImageLibrary(
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
          FeedbackService.buttonTap();
          const dimensions = {
            width: asset.width || 0,
            height: asset.height || 0,
          };
          updateComposition(
            isPhotoA
              ? {
                  photoAUri: asset.uri,
                  photoADimensions: dimensions,
                  photoAOffset: { x: 0, y: 0 },
                }
              : {
                  photoBUri: asset.uri,
                  photoBDimensions: dimensions,
                  photoBOffset: { x: 0, y: 0 },
                },
          );
        }
      },
    );
  };

  const swapPhotos = () => {
    FeedbackService.buttonTap();
    // Swap URIs, dimensions, and offsets together
    // Create new offset objects to avoid reference issues
    const newPhotoAOffset = composition.photoBOffset
      ? { x: composition.photoBOffset.x, y: composition.photoBOffset.y }
      : { x: 0, y: 0 };
    const newPhotoBOffset = composition.photoAOffset
      ? { x: composition.photoAOffset.x, y: composition.photoAOffset.y }
      : { x: 0, y: 0 };

    updateComposition({
      photoAUri: composition.photoBUri,
      photoBUri: composition.photoAUri,
      photoADimensions: composition.photoBDimensions,
      photoBDimensions: composition.photoADimensions,
      photoAOffset: newPhotoAOffset,
      photoBOffset: newPhotoBOffset,
    });
  };

  const exportToPhotos = async () => {
    try {
      FeedbackService.buttonTap();

      if (!composition.photoAUri || !composition.photoBUri) {
        Alert.alert('Error', 'Please select both photos first');
        return;
      }

      if (!canvasRef.current) {
        Alert.alert('Error', 'Canvas not ready. Please try again.');
        return;
      }

      // Request permissions for saving to Photos
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Please grant storage permission to save photos',
          );
          return;
        }
      }

      Alert.alert(
        'Export Started',
        'Capturing your before/after composition...',
        [{ text: 'OK' }],
      );

      // Capture the canvas as an image
      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // Save to Camera Roll
      await CameraRoll.saveAsset(uri, { type: 'photo', album: 'Before-After' });

      FeedbackService.success();
      Alert.alert(
        'Success!',
        'Your before/after photo has been saved to Photos',
      );
    } catch (error) {
      console.error('Export error:', error);
      FeedbackService.error();
      Alert.alert(
        'Error',
        `Failed to export photo: ${error.message || 'Please try again.'}`,
      );
    }
  };

  // Helper function to capture canvas and return URI
  const captureCanvas = async (): Promise<string | null> => {
    if (!composition.photoAUri || !composition.photoBUri) {
      Alert.alert('Error', 'Please select both photos first');
      return null;
    }

    if (!canvasRef.current) {
      Alert.alert('Error', 'Canvas not ready. Please try again.');
      return null;
    }

    try {
      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      return uri;
    } catch (error) {
      console.error('Capture error:', error);
      return null;
    }
  };

  const shareToInstagram = async () => {
    try {
      FeedbackService.buttonTap();
      const uri = await captureCanvas();
      if (!uri) return;

      // First save to gallery
      await CameraRoll.saveAsset(uri, { type: 'photo', album: 'Before-After' });

      // Try to open Instagram
      const instagramUrl =
        'instagram://library?AssetPath=' + encodeURIComponent(uri);
      const canOpen = await Linking.canOpenURL('instagram://');

      if (canOpen) {
        await Linking.openURL(instagramUrl);
        FeedbackService.success();
        Alert.alert(
          'Photo Saved',
          'Your photo has been saved. Select it from your gallery in Instagram.',
        );
      } else {
        FeedbackService.success();
        Alert.alert(
          'Photo Saved',
          'Photo saved to gallery. Open Instagram and select it from your gallery.',
        );
      }
    } catch (error: any) {
      console.error('Instagram share error:', error);
      FeedbackService.error();
      Alert.alert('Error', 'Failed to share to Instagram.');
    }
  };

  const shareToX = async () => {
    try {
      FeedbackService.buttonTap();
      const uri = await captureCanvas();
      if (!uri) return;

      // First save to gallery
      await CameraRoll.saveAsset(uri, { type: 'photo', album: 'Before-After' });

      // Try to open X/Twitter
      const canOpen = await Linking.canOpenURL('twitter://');

      if (canOpen) {
        await Linking.openURL('twitter://post');
        FeedbackService.success();
        Alert.alert(
          'Photo Saved',
          'Your photo has been saved. Attach it from your gallery in X.',
        );
      } else {
        FeedbackService.success();
        Alert.alert(
          'Photo Saved',
          'Photo saved to gallery. Open X and attach it from your gallery.',
        );
      }
    } catch (error: any) {
      console.error('X share error:', error);
      FeedbackService.error();
      Alert.alert('Error', 'Failed to share to X.');
    }
  };

  const saveToGallery = async () => {
    try {
      FeedbackService.buttonTap();
      const uri = await captureCanvas();
      if (!uri) return;

      // Request permissions for saving to Photos
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Please grant storage permission to save photos',
          );
          return;
        }
      }

      await CameraRoll.saveAsset(uri, { type: 'photo', album: 'Before-After' });
      FeedbackService.success();
    } catch (error: any) {
      console.error('Gallery save error:', error);
      FeedbackService.error();
      Alert.alert('Error', 'Failed to save to Gallery');
    }
  };

  const openShareMenu = async () => {
    try {
      FeedbackService.buttonTap();
      const uri = await captureCanvas();
      if (!uri) return;

      // Use native share sheet
      await Share.share({
        url: uri,
      });
      FeedbackService.success();
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
        FeedbackService.error();
        Alert.alert('Error', 'Failed to open share menu');
      }
    }
  };

  const setAspectRatio = (aspect: CompositionState['aspect']) => {
    FeedbackService.buttonTap();
    updateComposition({ aspect });
  };

  const toggleTextEffect = (effectType: string) => {
    FeedbackService.buttonTap();
    const currentEffects = composition.labels.textEffects || [];
    const existingEffectIndex = currentEffects.findIndex(
      effect => effect.type === effectType,
    );

    let newEffects: TextEffectInstance[];
    if (existingEffectIndex >= 0) {
      // Remove existing effect
      newEffects = currentEffects.filter(
        (_, index) => index !== existingEffectIndex,
      );
    } else {
      // Add new effect
      const newEffect = createTextEffectInstance(effectType as any);
      newEffects = [...currentEffects, newEffect];
    }

    updateLabels({ textEffects: newEffects });
  };

  const updateLabels = (labelUpdates: Partial<LabelStyle>) => {
    updateComposition({
      labels: { ...composition.labels, ...labelUpdates },
    });
  };

  // Modal-based text editing functions removed - now using inline TextInput

  const canvasHeight = screenHeight * 0.45;

  const applyTemplateToComposition = (template: Template) => {
    FeedbackService.buttonTap();
    const newComposition = applyTemplate(composition, template);
    setComposition(newComposition);
    setSelectedTemplateId(template.id);
    addToHistory(newComposition);
  };

  // Helper function to render template preview miniature
  const renderTemplatePreview = (template: Template) => {
    const { layout, accentColor } = template.preview;

    switch (layout) {
      case 'side':
        return (
          <View style={styles.editorPreviewSide}>
            <View
              style={[
                styles.editorPreviewBox,
                { backgroundColor: accentColor + '40' },
              ]}
            />
            <View
              style={[
                styles.editorPreviewBox,
                { backgroundColor: accentColor + '60' },
              ]}
            />
          </View>
        );
      case 'vertical':
        return (
          <View style={styles.editorPreviewVertical}>
            <View
              style={[
                styles.editorPreviewBox,
                { backgroundColor: accentColor + '40' },
              ]}
            />
            <View
              style={[
                styles.editorPreviewBox,
                { backgroundColor: accentColor + '60' },
              ]}
            />
          </View>
        );
      case 'diagonal':
        return (
          <View style={styles.editorPreviewDiagonal}>
            <View
              style={[
                styles.editorPreviewDiagonalTop,
                { borderBottomColor: '#60A5FA' },
              ]}
            />
            <View
              style={[
                styles.editorPreviewDiagonalBottom,
                { borderTopColor: '#F472B6' },
              ]}
            />
          </View>
        );
      case 'slider':
        return (
          <View style={styles.editorPreviewSlider}>
            <View
              style={[
                styles.editorPreviewSliderLeft,
                { backgroundColor: accentColor + '40' },
              ]}
            />
            <View
              style={[
                styles.editorPreviewSliderRight,
                { backgroundColor: accentColor + '70' },
              ]}
            />
            <View style={styles.editorPreviewSliderHandle} />
          </View>
        );
      case 'stacked':
        return (
          <View style={styles.editorPreviewStacked}>
            <View
              style={[
                styles.editorPreviewStackedMain,
                { backgroundColor: accentColor + '60' },
              ]}
            />
            <View
              style={[
                styles.editorPreviewStackedBar,
                { backgroundColor: accentColor + '30' },
              ]}
            >
              <View
                style={[
                  styles.editorPreviewStackedThumb,
                  { backgroundColor: accentColor + '80' },
                ]}
              />
            </View>
          </View>
        );
      case 'polaroid':
        return (
          <View style={styles.editorPreviewPolaroid}>
            <View
              style={[
                styles.editorPreviewPolaroidCard,
                styles.editorPreviewPolaroidCardLeft,
              ]}
            >
              <View style={styles.editorPreviewPolaroidPhoto} />
              <View
                style={[styles.editorPreviewTape, styles.editorPreviewTapeLeft]}
              >
                <View style={styles.editorPreviewTapeHighlight} />
              </View>
            </View>
            <View
              style={[
                styles.editorPreviewPolaroidCard,
                styles.editorPreviewPolaroidCardRight,
              ]}
            >
              <View style={styles.editorPreviewPolaroidPhoto} />
              <View
                style={[
                  styles.editorPreviewTape,
                  styles.editorPreviewTapeRight,
                ]}
              >
                <View style={styles.editorPreviewTapeHighlight} />
              </View>
            </View>
          </View>
        );
      case 'deviceMockup':
        return (
          <View style={styles.editorPreviewDevice}>
            {[0, 1].map(index => (
              <View key={index} style={styles.editorPreviewPhone}>
                <View style={styles.editorPreviewPhoneNotch} />
                <View
                  style={[
                    styles.editorPreviewPhoneScreen,
                    {
                      backgroundColor:
                        accentColor + (index === 0 ? '40' : '70'),
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        );
      default:
        return (
          <View style={styles.editorPreviewVertical}>
            <View
              style={[
                styles.editorPreviewBox,
                { backgroundColor: accentColor + '40' },
              ]}
            />
            <View
              style={[
                styles.editorPreviewBox,
                { backgroundColor: accentColor + '60' },
              ]}
            />
          </View>
        );
    }
  };

  const renderLayoutPanel = () => (
    <VerticalPager
      style={styles.toolPanel}
      contentContainerStyle={styles.toolPanelContent}
    >
      {/* Templates Section */}
      <View style={styles.toolSection}>
        <Text
          style={[
            styles.toolSectionTitle,
            { color: themeDefinition.colors.textPrimary },
          ]}
        >
          Templates
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templatesHorizontalContainer}
        >
          {defaultTemplates.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.editorTemplateCard,
                selectedTemplateId === template.id &&
                  styles.activeEditorTemplateCard,
                { backgroundColor: themeDefinition.colors.surface },
              ]}
              onPress={() => applyTemplateToComposition(template)}
            >
              <View
                style={[
                  styles.editorTemplatePreview,
                  { backgroundColor: template.preview.backgroundColor },
                ]}
              >
                <View style={styles.editorTemplatePreviewContent}>
                  {renderTemplatePreview(template)}
                </View>
              </View>
              <Text
                style={[
                  styles.editorTemplateName,
                  { color: themeDefinition.colors.textPrimary },
                ]}
              >
                {t(getTemplateNameKey(template.id))}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.toolSection}>
        <Text
          style={[
            styles.toolSectionTitle,
            { color: themeDefinition.colors.textPrimary },
          ]}
        >
          {t('composer_aspectRatio')}
        </Text>
        <View style={styles.aspectButtons}>
          {(
            [
              { key: 'free', label: t('composer_cropFree') },
              { key: '1:1', label: t('composer_crop1to1') },
              { key: '4:3', label: t('composer_crop4to3') },
              { key: '16:9', label: t('composer_crop16to9') },
            ] as const
          ).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.aspectButton,
                composition.aspect === key && styles.activeAspectButton,
                { borderColor: themeDefinition.colors.border },
              ]}
              onPress={() => setAspectRatio(key)}
            >
              <Text
                style={[
                  styles.aspectButtonText,
                  {
                    color:
                      composition.aspect === key
                        ? themeDefinition.colors.accent
                        : themeDefinition.colors.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </VerticalPager>
  );

  const renderLabelsPanel = () => (
    <VerticalPager
      style={styles.toolPanel}
      contentContainerStyle={styles.toolPanelContent}
      pageCount={3}
    >
      {/* === SECTION 1: Toggle & Text Content === */}
      <View style={styles.pageSection}>
        <View style={styles.toolSection}>
          <View style={styles.toggleRow}>
            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              {t('labels_toggle')}
            </Text>
            <TouchableOpacity
              style={[
                styles.toggle,
                composition.labels.show && styles.activeToggle,
                { borderColor: themeDefinition.colors.border },
              ]}
              onPress={() => updateLabels({ show: !composition.labels.show })}
            >
              <View
                style={[
                  styles.toggleThumb,
                  composition.labels.show && styles.activeToggleThumb,
                  {
                    backgroundColor: composition.labels.show
                      ? themeDefinition.colors.accent
                      : themeDefinition.colors.border,
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {composition.labels.show && (
          <View style={styles.toolSection}>
            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              {t('labels_beforeText')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textInputText,
                {
                  borderColor: themeDefinition.colors.border,
                  color: themeDefinition.colors.textPrimary,
                  backgroundColor: themeDefinition.colors.surface,
                },
              ]}
              value={composition.labels.textBefore}
              onChangeText={text => updateLabels({ textBefore: text })}
              placeholder="Enter before text"
              placeholderTextColor={themeDefinition.colors.textSecondary}
              multiline
              maxLength={50}
            />

            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary, marginTop: 16 },
              ]}
            >
              {t('labels_afterText')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textInputText,
                {
                  borderColor: themeDefinition.colors.border,
                  color: themeDefinition.colors.textPrimary,
                  backgroundColor: themeDefinition.colors.surface,
                },
              ]}
              value={composition.labels.textAfter}
              onChangeText={text => updateLabels({ textAfter: text })}
              placeholder="Enter after text"
              placeholderTextColor={themeDefinition.colors.textSecondary}
              multiline
              maxLength={50}
            />
          </View>
        )}
      </View>

      {/* === SECTION 2: Font Size, Weight & Colors === */}
      {composition.labels.show && (
        <View style={styles.pageSection}>
          {/* Font Size - hidden for device mockup (fixed at 19px) */}
          {composition.layout !== 'deviceMockup' && (
            <View style={styles.toolSection}>
              <Text
                style={[
                  styles.toolSectionTitle,
                  { color: themeDefinition.colors.textPrimary },
                ]}
              >
                {t('labels_size')} ({composition.labels.fontSize}px)
              </Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={[
                    styles.sliderButton,
                    { backgroundColor: themeDefinition.colors.surface },
                  ]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    updateLabels({
                      fontSize: Math.max(12, composition.labels.fontSize - 2),
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.sliderButtonText,
                      { color: themeDefinition.colors.textPrimary },
                    ]}
                  >
                    -
                  </Text>
                </TouchableOpacity>
                <Slider
                  style={styles.slider}
                  minimumValue={12}
                  maximumValue={48}
                  value={composition.labels.fontSize}
                  onValueChange={value => {
                    updateLabels({ fontSize: Math.round(value) });
                  }}
                  onSlidingComplete={() => {
                    FeedbackService.buttonTap();
                  }}
                  minimumTrackTintColor={themeDefinition.colors.accent}
                  maximumTrackTintColor={themeDefinition.colors.border}
                  thumbStyle={{
                    backgroundColor: themeDefinition.colors.accent,
                  }}
                  trackStyle={{ borderRadius: 2 }}
                  step={1}
                />
                <TouchableOpacity
                  style={[
                    styles.sliderButton,
                    { backgroundColor: themeDefinition.colors.surface },
                  ]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    updateLabels({
                      fontSize: Math.min(48, composition.labels.fontSize + 2),
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.sliderButtonText,
                      { color: themeDefinition.colors.textPrimary },
                    ]}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Font Weight */}
          <View style={styles.toolSection}>
            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              {t('labels_weight')}
            </Text>
            <View style={styles.weightButtons}>
              {(['Regular', 'Medium', 'Bold'] as const).map(weight => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.weightButton,
                    composition.labels.fontWeight === weight &&
                      styles.activeWeightButton,
                    {
                      borderColor: themeDefinition.colors.border,
                      backgroundColor:
                        composition.labels.fontWeight === weight
                          ? themeDefinition.colors.accent
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    updateLabels({ fontWeight: weight });
                  }}
                >
                  <Text
                    style={[
                      styles.weightButtonText,
                      {
                        color:
                          composition.labels.fontWeight === weight
                            ? '#FFFFFF'
                            : themeDefinition.colors.textSecondary,
                        fontWeight:
                          weight === 'Bold'
                            ? 'bold'
                            : weight === 'Medium'
                            ? '600'
                            : 'normal',
                      },
                    ]}
                  >
                    {weight}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Color */}
          <View style={styles.toolSection}>
            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              {t('labels_color')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorOptions}>
                {[
                  '#FFFFFF',
                  '#000000',
                  '#FF0000',
                  '#00FF00',
                  '#0000FF',
                  '#FFFF00',
                  '#FF00FF',
                  '#00FFFF',
                ].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      composition.labels.color === color && {
                        borderWidth: 3,
                        borderColor: themeDefinition.colors.accent,
                      },
                    ]}
                    onPress={() => {
                      FeedbackService.buttonTap();
                      updateLabels({ color });
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Label Background Color */}
          <View style={styles.toolSection}>
            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              {t('labels_background') || 'Background'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorOptions}>
                {/* Transparent option */}
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    styles.transparentOption,
                    !composition.labels.backgroundColor && {
                      borderWidth: 3,
                      borderColor: themeDefinition.colors.accent,
                    },
                  ]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    updateLabels({ backgroundColor: undefined });
                  }}
                >
                  <View style={styles.transparentPattern} />
                </TouchableOpacity>
                {[
                  'rgba(0,0,0,0.5)',
                  'rgba(255,255,255,0.5)',
                  'rgba(0,0,0,0.8)',
                  'rgba(255,255,255,0.8)',
                  '#000000',
                  '#FFFFFF',
                  '#FF0000',
                  '#0000FF',
                ].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      composition.labels.backgroundColor === color && {
                        borderWidth: 3,
                        borderColor: themeDefinition.colors.accent,
                      },
                    ]}
                    onPress={() => {
                      FeedbackService.buttonTap();
                      updateLabels({ backgroundColor: color });
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* === SECTION 3: Position & Effects === */}
      {composition.labels.show && (
        <View style={styles.pageSection}>
          {/* Position */}
          <View style={styles.toolSection}>
            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              {t('labels_position')}
            </Text>
            <View style={styles.positionGrid}>
              {[
                { key: 'tl', label: 'Top Left' },
                { key: 'tr', label: 'Top Right' },
                { key: 'bl', label: 'Bottom Left' },
                { key: 'br', label: 'Bottom Right' },
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.positionButton,
                    composition.labels.position === key &&
                      styles.activePositionButton,
                    {
                      borderColor: themeDefinition.colors.border,
                      backgroundColor:
                        composition.labels.position === key
                          ? themeDefinition.colors.accent
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    updateLabels({ position: key as any });
                  }}
                >
                  <Text
                    style={[
                      styles.positionButtonText,
                      {
                        color:
                          composition.labels.position === key
                            ? '#FFFFFF'
                            : themeDefinition.colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Effects Section */}
          <View style={styles.toolSection}>
            <Text
              style={[
                styles.toolSectionTitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              {t('text_effects')}
            </Text>
            <View style={styles.textEffectsContainer}>
              {SUPPORTED_TEXT_EFFECT_TYPES.map(effectType => {
                const definition = getTextEffectDefinition(effectType);
                const isActive = composition.labels.textEffects?.some(
                  effect => effect.type === effectType,
                );

                return (
                  <TouchableOpacity
                    key={effectType}
                    style={[
                      styles.textEffectButton,
                      isActive && styles.activeTextEffectButton,
                      {
                        borderColor: isActive
                          ? themeDefinition.colors.accent
                          : themeDefinition.colors.border,
                        backgroundColor: isActive
                          ? themeDefinition.colors.accent + '20'
                          : themeDefinition.colors.surface,
                      },
                    ]}
                    onPress={() => toggleTextEffect(effectType)}
                  >
                    <Text
                      style={[
                        styles.textEffectButtonText,
                        {
                          color: isActive
                            ? themeDefinition.colors.accent
                            : themeDefinition.colors.textPrimary,
                        },
                      ]}
                    >
                      {t(getTextEffectNameKey(effectType))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </VerticalPager>
  );

  const renderStylePanel = () => (
    <VerticalPager
      style={styles.toolPanel}
      contentContainerStyle={styles.toolPanelContent}
    >
      {/* Background Section */}
      <View style={styles.toolSection}>
        <Text
          style={[
            styles.toolSectionTitle,
            { color: themeDefinition.colors.textPrimary },
          ]}
        >
          Background
        </Text>
        <View style={styles.backgroundOptions}>
          {[
            { type: 'solid', color: '#FFFFFF', label: 'White' },
            { type: 'solid', color: '#F8FAFC', label: 'Light' },
            { type: 'solid', color: '#111827', label: 'Dark' },
            { type: 'solid', color: '#FFF8E1', label: 'Warm' },
            {
              type: 'gradient',
              colors: ['#EDE9FE', '#DDD6FE'],
              label: 'Purple',
            },
            { type: 'gradient', colors: ['#FEF3C7', '#FDE68A'], label: 'Gold' },
            { type: 'transparent', color: 'transparent', label: 'None' },
          ].map((bg, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.backgroundOption,
                {
                  backgroundColor:
                    bg.type === 'gradient' ? bg.colors[0] : bg.color,
                  borderColor: themeDefinition.colors.border,
                },
                composition.background.type === bg.type &&
                  composition.background.colors[0] ===
                    (bg.colors?.[0] || bg.color) && {
                    borderWidth: 2,
                    borderColor: themeDefinition.colors.accent,
                  },
              ]}
              onPress={() => {
                FeedbackService.buttonTap();
                updateComposition({
                  background: {
                    type: bg.type as any,
                    colors: bg.colors || [bg.color],
                    direction: bg.type === 'gradient' ? 'vertical' : undefined,
                  },
                });
              }}
            >
              {bg.type === 'gradient' && (
                <View
                  style={[
                    styles.gradientPreview,
                    { backgroundColor: bg.colors[1] },
                  ]}
                />
              )}
              {bg.type === 'transparent' && (
                <View style={styles.transparentPattern} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Frame Section */}
      <View style={styles.toolSection}>
        <Text
          style={[
            styles.toolSectionTitle,
            { color: themeDefinition.colors.textPrimary },
          ]}
        >
          Frame
        </Text>
        <View style={styles.toggleRow}>
          <Text
            style={[
              styles.toggleLabel,
              { color: themeDefinition.colors.textPrimary },
            ]}
          >
            Show Frame
          </Text>
          <TouchableOpacity
            style={[
              styles.toggle,
              {
                backgroundColor: composition.frame.on
                  ? themeDefinition.colors.accent
                  : 'transparent',
                borderColor: composition.frame.on
                  ? themeDefinition.colors.accent
                  : themeDefinition.colors.border,
              },
            ]}
            onPress={() => {
              FeedbackService.buttonTap();
              updateComposition({
                frame: { ...composition.frame, on: !composition.frame.on },
              });
            }}
          >
            <View
              style={[
                styles.toggleKnob,
                {
                  backgroundColor: composition.frame.on
                    ? '#FFFFFF'
                    : themeDefinition.colors.border,
                  transform: [{ translateX: composition.frame.on ? 18 : 0 }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {composition.frame.on && (
          <>
            <Text
              style={[
                styles.toolSectionSubtitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              Frame Color
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorOptions}>
                {[
                  '#000000',
                  '#FFFFFF',
                  '#2563EB',
                  '#7C3AED',
                  '#F59E0B',
                  '#059669',
                  '#DC2626',
                ].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      composition.frame.color === color && {
                        borderWidth: 3,
                        borderColor: themeDefinition.colors.accent,
                      },
                    ]}
                    onPress={() => {
                      FeedbackService.buttonTap();
                      updateComposition({
                        frame: { ...composition.frame, color },
                      });
                    }}
                  />
                ))}
              </View>
            </ScrollView>

            <Text
              style={[
                styles.toolSectionSubtitle,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              Frame Thickness ({composition.frame.thickness}px)
            </Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={[
                  styles.sliderButton,
                  { backgroundColor: themeDefinition.colors.surface },
                ]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  updateComposition({
                    frame: {
                      ...composition.frame,
                      thickness: Math.max(1, composition.frame.thickness - 1),
                    },
                  });
                }}
              >
                <Text
                  style={[
                    styles.sliderButtonText,
                    { color: themeDefinition.colors.textPrimary },
                  ]}
                >
                  -
                </Text>
              </TouchableOpacity>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={8}
                value={composition.frame.thickness}
                onValueChange={value => {
                  updateComposition({
                    frame: {
                      ...composition.frame,
                      thickness: Math.round(value),
                    },
                  });
                }}
                onSlidingComplete={() => FeedbackService.buttonTap()}
                minimumTrackTintColor={themeDefinition.colors.accent}
                maximumTrackTintColor={themeDefinition.colors.border}
                thumbStyle={{ backgroundColor: themeDefinition.colors.accent }}
                step={1}
              />
              <TouchableOpacity
                style={[
                  styles.sliderButton,
                  { backgroundColor: themeDefinition.colors.surface },
                ]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  updateComposition({
                    frame: {
                      ...composition.frame,
                      thickness: Math.min(8, composition.frame.thickness + 1),
                    },
                  });
                }}
              >
                <Text
                  style={[
                    styles.sliderButtonText,
                    { color: themeDefinition.colors.textPrimary },
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Corner Radius Section */}
      <View style={styles.toolSection}>
        <Text
          style={[
            styles.toolSectionTitle,
            { color: themeDefinition.colors.textPrimary },
          ]}
        >
          Corner Radius ({composition.cornerRadius}px)
        </Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[
              styles.sliderButton,
              { backgroundColor: themeDefinition.colors.surface },
            ]}
            onPress={() => {
              FeedbackService.buttonTap();
              updateComposition({
                cornerRadius: Math.max(0, composition.cornerRadius - 2),
              });
            }}
          >
            <Text
              style={[
                styles.sliderButtonText,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              -
            </Text>
          </TouchableOpacity>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={32}
            value={composition.cornerRadius}
            onValueChange={value => {
              updateComposition({ cornerRadius: Math.round(value) });
            }}
            onSlidingComplete={() => FeedbackService.buttonTap()}
            minimumTrackTintColor={themeDefinition.colors.accent}
            maximumTrackTintColor={themeDefinition.colors.border}
            thumbStyle={{ backgroundColor: themeDefinition.colors.accent }}
            step={2}
          />
          <TouchableOpacity
            style={[
              styles.sliderButton,
              { backgroundColor: themeDefinition.colors.surface },
            ]}
            onPress={() => {
              FeedbackService.buttonTap();
              updateComposition({
                cornerRadius: Math.min(32, composition.cornerRadius + 2),
              });
            }}
          >
            <Text
              style={[
                styles.sliderButtonText,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </VerticalPager>
  );

  const renderExportPanel = () => (
    <VerticalPager
      style={styles.toolPanel}
      contentContainerStyle={styles.toolPanelContent}
    >
      <View style={styles.toolSection}>
        <Text
          style={[
            styles.toolSectionTitle,
            { color: themeDefinition.colors.textPrimary },
          ]}
        >
          {t('export_title')}
        </Text>
        <View style={styles.exportButtonsGrid}>
          <TouchableOpacity
            style={[
              styles.exportGridButton,
              { backgroundColor: themeDefinition.colors.surface },
            ]}
            onPress={shareToInstagram}
          >
            <Image source={InstagramIcon} style={styles.exportIcon} />
            <Text
              style={[
                styles.exportGridButtonText,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              Instagram
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportGridButton,
              { backgroundColor: themeDefinition.colors.surface },
            ]}
            onPress={shareToX}
          >
            <Image source={XIcon} style={styles.exportIcon} />
            <Text
              style={[
                styles.exportGridButtonText,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              X
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportGridButton,
              { backgroundColor: themeDefinition.colors.surface },
            ]}
            onPress={saveToGallery}
          >
            <Image source={GalleryIcon} style={styles.exportIcon} />
            <Text
              style={[
                styles.exportGridButtonText,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportGridButton,
              { backgroundColor: themeDefinition.colors.surface },
            ]}
            onPress={openShareMenu}
          >
            <Image source={ShareIcon} style={styles.exportIcon} />
            <Text
              style={[
                styles.exportGridButtonText,
                { color: themeDefinition.colors.textPrimary },
              ]}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </VerticalPager>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeDefinition.colors.bg }]}
    >
      {/* Top toolbar */}
      <View style={[styles.topToolbar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text
            style={[
              styles.backButton,
              { color: themeDefinition.colors.textPrimary },
            ]}
          >
            ← {t('back')}
          </Text>
        </TouchableOpacity>

        <View style={styles.topActions}>
          {composition.photoAUri && composition.photoBUri && (
            <TouchableOpacity
              style={[
                styles.swapButton,
                { borderColor: themeDefinition.colors.border },
              ]}
              onPress={swapPhotos}
            >
              <Text
                style={[
                  styles.swapButtonText,
                  { color: themeDefinition.colors.textSecondary },
                ]}
              >
                {t('composer_swap')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.templateButton,
              { borderColor: themeDefinition.colors.border },
            ]}
            onPress={() => {
              // TODO: Navigate to Templates
              Alert.alert('Templates', 'Templates coming soon!');
            }}
          >
            <Text
              style={[
                styles.templateButtonText,
                { color: themeDefinition.colors.textSecondary },
              ]}
            >
              {t('composer_template')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas area */}
      <View
        style={[
          styles.canvasContainer,
          { height: canvasHeight, borderRadius: composition.cornerRadius },
        ]}
      >
        {!composition.photoAUri || !composition.photoBUri ? (
          <View
            style={[
              styles.photoPlaceholder,
              {
                borderColor: themeDefinition.colors.border,
                borderRadius: composition.cornerRadius,
              },
            ]}
          >
            <Text
              style={[
                styles.placeholderText,
                { color: themeDefinition.colors.textSecondary },
              ]}
            >
              {composition.layout === 'side' ||
              composition.layout === 'deviceMockup'
                ? 'Select Before & After Photos'
                : composition.layout === 'vertical'
                ? 'Select Before (Top) & After (Bottom) Photos'
                : composition.layout === 'stacked'
                ? 'Select Before & After Photos'
                : composition.layout === 'polaroid'
                ? 'Select two photos for the collage'
                : t('pickTwoPhotos')}
            </Text>
            <View
              style={
                composition.layout === 'side' ||
                composition.layout === 'deviceMockup'
                  ? styles.photoButtonsSide
                  : styles.photoButtons
              }
            >
              <TouchableOpacity
                style={[
                  styles.photoButton,
                  { backgroundColor: themeDefinition.colors.surface },
                ]}
                onPress={() => pickPhoto(true)}
              >
                <Text
                  style={[
                    styles.photoButtonText,
                    { color: themeDefinition.colors.textPrimary },
                  ]}
                >
                  {composition.photoAUri
                    ? t('before_selected')
                    : t('pick_before')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.photoButton,
                  { backgroundColor: themeDefinition.colors.surface },
                ]}
                onPress={() => pickPhoto(false)}
              >
                <Text
                  style={[
                    styles.photoButtonText,
                    { color: themeDefinition.colors.textPrimary },
                  ]}
                >
                  {composition.photoBUri
                    ? t('after_selected')
                    : t('pick_after')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            ref={canvasRef}
            collapsable={false}
            style={{
              alignItems: 'center',
              borderRadius: composition.cornerRadius,
              overflow: 'hidden',
            }}
            {...panResponder.panHandlers}
          >
            <CompositionCanvas composition={composition} />
          </View>
        )}
      </View>

      {/* Tool selector */}
      <View
        style={[
          styles.toolSelector,
          { backgroundColor: themeDefinition.colors.surface },
        ]}
      >
        {(['layout', 'labels', 'style', 'export'] as const).map(panel => (
          <TouchableOpacity
            key={panel}
            style={[
              styles.toolTab,
              activePanel === panel && styles.activeToolTab,
              activePanel === panel && {
                backgroundColor: themeDefinition.colors.accent,
              },
            ]}
            onPress={() => {
              FeedbackService.buttonTap();
              setActivePanel(panel);
            }}
          >
            <Text
              style={[
                styles.toolTabText,
                {
                  color:
                    activePanel === panel
                      ? '#FFFFFF'
                      : themeDefinition.colors.textSecondary,
                },
              ]}
            >
              {t(panel)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tool panel */}
      <View
        style={[styles.toolPanelContainer, { paddingBottom: insets.bottom }]}
      >
        {activePanel === 'layout' && renderLayoutPanel()}
        {activePanel === 'labels' && renderLabelsPanel()}
        {activePanel === 'style' && renderStylePanel()}
        {activePanel === 'export' && renderExportPanel()}
      </View>

      {/* Modal removed - now using inline TextInput components */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 18,
    fontWeight: '500',
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  swapButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  swapButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  templateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  canvasContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  photoButtonsSide: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  photoButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toolSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  toolTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToolTab: {
    // backgroundColor will be set dynamically
  },
  toolTabText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  toolPanelContainer: {
    flex: 1,
    marginTop: 8,
  },
  toolPanel: {
    flex: 1,
    paddingHorizontal: 16,
  },
  toolPanelContent: {
    paddingVertical: 8,
    paddingBottom: 100, // Extra padding to ensure content is reachable above home indicator
  },
  toolSection: {
    marginBottom: 24,
  },
  toolSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
  },
  activeToggle: {
    // borderColor will be set dynamically
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignSelf: 'flex-start',
  },
  activeToggleThumb: {
    alignSelf: 'flex-end',
  },
  aspectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aspectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  activeAspectButton: {
    // styles set dynamically
  },
  aspectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textEffectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textEffectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  activeTextEffectButton: {
    // styles set dynamically
  },
  textEffectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  exportButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exportButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  exportGridButton: {
    width: '47%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  exportGridButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Label controls styles
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  textInputText: {
    fontSize: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  weightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weightButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeWeightButton: {
    // backgroundColor set dynamically
  },
  weightButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  transparentOption: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  transparentPattern: {
    width: '100%',
    height: '100%',
    backgroundColor: '#CCCCCC',
    // Checkerboard pattern simulated with diagonal stripes
    borderWidth: 0,
  },
  pageSection: {
    marginBottom: 16,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePositionButton: {
    // backgroundColor set dynamically
  },
  positionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Template styles for editor
  templatesHorizontalContainer: {
    paddingRight: 16,
  },
  editorTemplateCard: {
    width: 80,
    marginRight: 12,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  editorTemplatePreview: {
    width: 50,
    height: 40,
    borderRadius: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  editorTemplatePreviewContent: {
    width: '100%',
    height: '100%',
    padding: 2,
  },
  editorPreviewSide: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    gap: 1,
  },
  editorPreviewVertical: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    gap: 1,
  },
  editorPreviewBox: {
    flex: 1,
    borderRadius: 2,
  },
  editorPreviewDevice: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  editorPreviewPhone: {
    width: 22,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#121418',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  editorPreviewPhoneScreen: {
    width: '72%',
    height: '78%',
    borderRadius: 6,
    backgroundColor: '#4C627E',
  },
  editorPreviewPhoneNotch: {
    position: 'absolute',
    top: 2,
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0C0F15',
  },
  editorPreviewPolaroid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  editorPreviewPolaroidCard: {
    position: 'absolute',
    width: 46,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 6,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  editorPreviewPolaroidCardLeft: {
    left: 6,
    top: 6,
    transform: [{ rotate: '-9deg' }],
  },
  editorPreviewPolaroidCardRight: {
    right: 6,
    bottom: 6,
    transform: [{ rotate: '5deg' }],
    zIndex: 1,
  },
  editorPreviewPolaroidPhoto: {
    width: '68%',
    height: '58%',
    borderRadius: 5,
    backgroundColor: '#1F1F1F',
    marginTop: 4,
    marginBottom: 8,
  },
  editorPreviewTape: {
    position: 'absolute',
    top: -4,
    height: 9,
    width: 32,
    borderRadius: 3,
    backgroundColor: '#D7B37A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  editorPreviewTapeHighlight: {
    width: '80%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  editorPreviewTapeLeft: {
    left: 2,
    transform: [{ rotate: '-6deg' }],
  },
  editorPreviewTapeRight: {
    right: 2,
    transform: [{ rotate: '8deg' }],
  },
  editorTemplateName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeEditorTemplateCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  // Diagonal preview styles
  editorPreviewDiagonal: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 2,
  },
  editorPreviewDiagonalTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 46,
    borderBottomWidth: 36,
    borderLeftColor: 'transparent',
    borderBottomColor: '#000',
  },
  editorPreviewDiagonalBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: 46,
    borderTopWidth: 36,
    borderRightColor: 'transparent',
    borderTopColor: '#000',
  },
  // Slider preview styles
  editorPreviewSlider: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
  },
  editorPreviewSliderLeft: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  editorPreviewSliderRight: {
    flex: 1,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  editorPreviewSliderHandle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
    marginLeft: -1,
  },
  // Stacked preview styles
  editorPreviewStacked: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    borderRadius: 2,
    overflow: 'hidden',
  },
  editorPreviewStackedMain: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  editorPreviewStackedBar: {
    height: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  editorPreviewStackedThumb: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  // Style panel specific styles
  backgroundOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backgroundOption: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  transparentPattern: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
  },
  toolSectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default ComposerScreen;
