import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  TextInput,
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
import { CompositionState, LayoutType, LabelStyle } from '../types/composer';
import { RootStackParamList } from '../navigation/AppNavigator';
import { defaultTemplates, applyTemplate, Template } from '../constants/templates';
import { TextEffectInstance, createTextEffectInstance, SUPPORTED_TEXT_EFFECT_TYPES, getTextEffectDefinition } from '../constants/textEffects';
import CompositionCanvas from '../components/CompositionCanvas';
import VerticalPager from '../components/VerticalPager';

type ComposerRouteProp = RouteProp<RootStackParamList, 'Composer'>;
type ComposerNavigationProp = StackNavigationProp<RootStackParamList, 'ExportResult'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ComposerScreen: React.FC = () => {
  const route = useRoute<ComposerRouteProp>();
  const navigation = useNavigation<ComposerNavigationProp>();
  const insets = useSafeAreaInsets();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();

  // Canvas ref for export
  const canvasRef = useRef<any>(null);

  // Initialize composition state
  const [composition, setComposition] = useState<CompositionState>({
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
    watermarkOn: true, // Will be controlled by Pro status
  });

  // Active tool panel state
  const [activePanel, setActivePanel] = useState<'layout' | 'labels' | 'style' | 'export'>('layout');

  // Text editing modal state
  const [showTextModal, setShowTextModal] = useState(false);
  const [editingField, setEditingField] = useState<'before' | 'after' | null>(null);
  const [tempText, setTempText] = useState('');

  // Undo/Redo functionality
  const [history, setHistory] = useState<CompositionState[]>([composition]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addToHistory = useCallback((newComposition: CompositionState) => {
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
  }, [historyIndex]);

  const updateComposition = useCallback((updates: Partial<CompositionState>) => {
    setComposition(prev => {
      const newComposition = { ...prev, ...updates };
      addToHistory(newComposition);
      return newComposition;
    });
  }, [addToHistory]);

  // Apply template if provided in route params
  useEffect(() => {
    if (route.params?.template && route.params?.useTemplate) {
      const templateComposition = applyTemplate(composition, route.params.template);
      setComposition(templateComposition);
      setHistory([templateComposition]);
      setHistoryIndex(0);
    }
  }, [route.params?.template, route.params?.useTemplate]);

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

        const uri = response.assets?.[0]?.uri;
        if (uri) {
          FeedbackService.buttonTap();
          updateComposition(
            isPhotoA
              ? { photoAUri: uri }
              : { photoBUri: uri }
          );
        }
      }
    );
  };

  const swapPhotos = () => {
    FeedbackService.buttonTap();
    updateComposition({
      photoAUri: composition.photoBUri,
      photoBUri: composition.photoAUri,
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
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Required', 'Please grant storage permission to save photos');
          return;
        }
      }

      Alert.alert(
        'Export Started',
        'Capturing your before/after composition...',
        [{ text: 'OK' }]
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
      Alert.alert('Success!', 'Your before/after photo has been saved to Photos');

    } catch (error) {
      console.error('Export error:', error);
      FeedbackService.error();
      Alert.alert('Error', `Failed to export photo: ${error.message || 'Please try again.'}`);
    }
  };

  const setLayout = (layout: LayoutType) => {
    FeedbackService.buttonTap();
    updateComposition({ layout });
  };

  const setAspectRatio = (aspect: CompositionState['aspect']) => {
    FeedbackService.buttonTap();
    updateComposition({ aspect });
  };

  const toggleTextEffect = (effectType: string) => {
    FeedbackService.buttonTap();
    const currentEffects = composition.labels.textEffects || [];
    const existingEffectIndex = currentEffects.findIndex(effect => effect.type === effectType);

    let newEffects: TextEffectInstance[];
    if (existingEffectIndex >= 0) {
      // Remove existing effect
      newEffects = currentEffects.filter((_, index) => index !== existingEffectIndex);
    } else {
      // Add new effect
      const newEffect = createTextEffectInstance(effectType as any);
      newEffects = [...currentEffects, newEffect];
    }

    updateLabels({ textEffects: newEffects });
  };

  const updateLabels = (labelUpdates: Partial<LabelStyle>) => {
    updateComposition({
      labels: { ...composition.labels, ...labelUpdates }
    });
  };

  const openTextEditor = (field: 'before' | 'after') => {
    const currentText = field === 'before' ? composition.labels.textBefore : composition.labels.textAfter;
    setTempText(currentText);
    setEditingField(field);
    setShowTextModal(true);
  };

  const saveTextEdit = () => {
    if (editingField === 'before') {
      updateLabels({ textBefore: tempText });
    } else if (editingField === 'after') {
      updateLabels({ textAfter: tempText });
    }
    setShowTextModal(false);
    setEditingField(null);
    FeedbackService.success();
  };

  const cancelTextEdit = () => {
    setShowTextModal(false);
    setEditingField(null);
    setTempText('');
  };

  const canvasHeight = screenHeight * 0.45;

  const applyTemplateToComposition = (template: Template) => {
    FeedbackService.buttonTap();
    const newComposition = applyTemplate(composition, template);
    setComposition(newComposition);
    addToHistory(newComposition);
  };

  const renderLayoutPanel = () => (
    <VerticalPager style={styles.toolPanel} contentContainerStyle={styles.toolPanelContent}>
      {/* Templates Section */}
      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          Templates
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templatesHorizontalContainer}
        >
          {defaultTemplates.slice(0, 4).map(template => (
            <TouchableOpacity
              key={template.id}
              style={[styles.editorTemplateCard, { backgroundColor: themeDefinition.colors.surface }]}
              onPress={() => applyTemplateToComposition(template)}
            >
              <View style={[
                styles.editorTemplatePreview,
                { backgroundColor: template.preview.backgroundColor }
              ]}>
                <View style={styles.editorTemplatePreviewContent}>
                  {template.preview.layout === 'side' ? (
                    <View style={styles.editorPreviewSide}>
                      <View style={[styles.editorPreviewBox, { backgroundColor: template.preview.accentColor + '40' }]} />
                      <View style={[styles.editorPreviewBox, { backgroundColor: template.preview.accentColor + '60' }]} />
                    </View>
                  ) : (
                    <View style={styles.editorPreviewVertical}>
                      <View style={[styles.editorPreviewBox, { backgroundColor: template.preview.accentColor + '40' }]} />
                      <View style={[styles.editorPreviewBox, { backgroundColor: template.preview.accentColor + '60' }]} />
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.editorTemplateName, { color: themeDefinition.colors.textPrimary }]}>
                {template.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          {t('layout')}
        </Text>
        <View style={styles.layoutButtons}>
          {([
            { key: 'side', label: t('composer_layoutSideBySide') },
            { key: 'vertical', label: t('composer_layoutVertical') },
            { key: 'slider', label: t('composer_layoutSlider') },
            { key: 'stacked', label: t('composer_layoutStacked') },
          ] as const).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.layoutButton,
                composition.layout === key && styles.activeLayoutButton,
                { borderColor: themeDefinition.colors.border }
              ]}
              onPress={() => setLayout(key)}
            >
              <Text style={[
                styles.layoutButtonText,
                { color: composition.layout === key ? themeDefinition.colors.accent : themeDefinition.colors.textSecondary }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          {t('composer_aspectRatio')}
        </Text>
        <View style={styles.aspectButtons}>
          {([
            { key: 'free', label: t('composer_cropFree') },
            { key: '1:1', label: t('composer_crop1to1') },
            { key: '4:3', label: t('composer_crop4to3') },
            { key: '16:9', label: t('composer_crop16to9') },
          ] as const).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.aspectButton,
                composition.aspect === key && styles.activeAspectButton,
                { borderColor: themeDefinition.colors.border }
              ]}
              onPress={() => setAspectRatio(key)}
            >
              <Text style={[
                styles.aspectButtonText,
                { color: composition.aspect === key ? themeDefinition.colors.accent : themeDefinition.colors.textSecondary }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Text Effects Section */}
      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          Text Effects
        </Text>
        <View style={styles.textEffectsContainer}>
          {SUPPORTED_TEXT_EFFECT_TYPES.map(effectType => {
            const definition = getTextEffectDefinition(effectType);
            const isActive = composition.labels.textEffects?.some(effect => effect.type === effectType);

            return (
              <TouchableOpacity
                key={effectType}
                style={[
                  styles.textEffectButton,
                  isActive && styles.activeTextEffectButton,
                  {
                    borderColor: isActive ? themeDefinition.colors.accent : themeDefinition.colors.border,
                    backgroundColor: isActive ? themeDefinition.colors.accent + '20' : themeDefinition.colors.surface
                  }
                ]}
                onPress={() => toggleTextEffect(effectType)}
              >
                <Text style={[
                  styles.textEffectButtonText,
                  { color: isActive ? themeDefinition.colors.accent : themeDefinition.colors.textPrimary }
                ]}>
                  {definition?.name || effectType}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </VerticalPager>
  );

  const renderLabelsPanel = () => (
    <VerticalPager style={styles.toolPanel} contentContainerStyle={styles.toolPanelContent}>
      <View style={styles.toolSection}>
        <View style={styles.toggleRow}>
          <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
            {t('labels_toggle')}
          </Text>
          <TouchableOpacity
            style={[
              styles.toggle,
              composition.labels.show && styles.activeToggle,
              { borderColor: themeDefinition.colors.border }
            ]}
            onPress={() => updateLabels({ show: !composition.labels.show })}
          >
            <View style={[
              styles.toggleThumb,
              composition.labels.show && styles.activeToggleThumb,
              { backgroundColor: composition.labels.show ? themeDefinition.colors.accent : themeDefinition.colors.border }
            ]} />
          </TouchableOpacity>
        </View>
      </View>

      {composition.labels.show && (
        <>
          {/* Text Content */}
          <View style={styles.toolSection}>
            <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
              {t('labels_beforeText')}
            </Text>
            <TouchableOpacity
              style={[styles.textInput, { borderColor: themeDefinition.colors.border }]}
              onPress={() => {
                FeedbackService.buttonTap();
                openTextEditor('before');
              }}
            >
              <Text style={[styles.textInputText, { color: themeDefinition.colors.textPrimary }]}>
                {composition.labels.textBefore}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary, marginTop: 16 }]}>
              {t('labels_afterText')}
            </Text>
            <TouchableOpacity
              style={[styles.textInput, { borderColor: themeDefinition.colors.border }]}
              onPress={() => {
                FeedbackService.buttonTap();
                openTextEditor('after');
              }}
            >
              <Text style={[styles.textInputText, { color: themeDefinition.colors.textPrimary }]}>
                {composition.labels.textAfter}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Font Size */}
          <View style={styles.toolSection}>
            <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
              {t('labels_size')} ({composition.labels.fontSize}px)
            </Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={[styles.sliderButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  updateLabels({ fontSize: Math.max(12, composition.labels.fontSize - 2) });
                }}
              >
                <Text style={[styles.sliderButtonText, { color: themeDefinition.colors.textPrimary }]}>
                  -
                </Text>
              </TouchableOpacity>
              <Slider
                style={styles.slider}
                minimumValue={12}
                maximumValue={48}
                value={composition.labels.fontSize}
                onValueChange={(value) => {
                  updateLabels({ fontSize: Math.round(value) });
                }}
                onSlidingComplete={() => {
                  FeedbackService.buttonTap();
                }}
                minimumTrackTintColor={themeDefinition.colors.accent}
                maximumTrackTintColor={themeDefinition.colors.border}
                thumbStyle={{ backgroundColor: themeDefinition.colors.accent }}
                trackStyle={{ borderRadius: 2 }}
                step={1}
              />
              <TouchableOpacity
                style={[styles.sliderButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  updateLabels({ fontSize: Math.min(48, composition.labels.fontSize + 2) });
                }}
              >
                <Text style={[styles.sliderButtonText, { color: themeDefinition.colors.textPrimary }]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Font Weight */}
          <View style={styles.toolSection}>
            <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
              {t('labels_weight')}
            </Text>
            <View style={styles.weightButtons}>
              {(['Regular', 'Medium', 'Bold'] as const).map(weight => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.weightButton,
                    composition.labels.fontWeight === weight && styles.activeWeightButton,
                    {
                      borderColor: themeDefinition.colors.border,
                      backgroundColor: composition.labels.fontWeight === weight ? themeDefinition.colors.accent : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    updateLabels({ fontWeight: weight });
                  }}
                >
                  <Text style={[
                    styles.weightButtonText,
                    {
                      color: composition.labels.fontWeight === weight ? '#FFFFFF' : themeDefinition.colors.textSecondary,
                      fontWeight: weight === 'Bold' ? 'bold' : weight === 'Medium' ? '600' : 'normal'
                    }
                  ]}>
                    {weight}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Color */}
          <View style={styles.toolSection}>
            <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
              {t('labels_color')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorOptions}>
                {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      composition.labels.color === color && { borderWidth: 3, borderColor: themeDefinition.colors.accent }
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

          {/* Position */}
          <View style={styles.toolSection}>
            <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
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
                    composition.labels.position === key && styles.activePositionButton,
                    {
                      borderColor: themeDefinition.colors.border,
                      backgroundColor: composition.labels.position === key ? themeDefinition.colors.accent : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    updateLabels({ position: key as any });
                  }}
                >
                  <Text style={[
                    styles.positionButtonText,
                    { color: composition.labels.position === key ? '#FFFFFF' : themeDefinition.colors.textSecondary }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
    </VerticalPager>
  );

  const renderStylePanel = () => (
    <VerticalPager style={styles.toolPanel} contentContainerStyle={styles.toolPanelContent}>
      {/* Background Section */}
      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          Background
        </Text>
        <View style={styles.backgroundOptions}>
          {[
            { type: 'solid', color: '#FFFFFF', label: 'White' },
            { type: 'solid', color: '#F8FAFC', label: 'Light' },
            { type: 'solid', color: '#111827', label: 'Dark' },
            { type: 'solid', color: '#FFF8E1', label: 'Warm' },
            { type: 'gradient', colors: ['#EDE9FE', '#DDD6FE'], label: 'Purple' },
            { type: 'gradient', colors: ['#FEF3C7', '#FDE68A'], label: 'Gold' },
            { type: 'transparent', color: 'transparent', label: 'None' },
          ].map((bg, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.backgroundOption,
                {
                  backgroundColor: bg.type === 'gradient' ? bg.colors[0] : bg.color,
                  borderColor: themeDefinition.colors.border,
                },
                composition.background.type === bg.type &&
                composition.background.colors[0] === (bg.colors?.[0] || bg.color) &&
                { borderWidth: 2, borderColor: themeDefinition.colors.accent }
              ]}
              onPress={() => {
                FeedbackService.buttonTap();
                updateComposition({
                  background: {
                    type: bg.type as any,
                    colors: bg.colors || [bg.color],
                    direction: bg.type === 'gradient' ? 'vertical' : undefined,
                  }
                });
              }}
            >
              {bg.type === 'gradient' && (
                <View style={[
                  styles.gradientPreview,
                  { backgroundColor: bg.colors[1] }
                ]} />
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
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          Frame
        </Text>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: themeDefinition.colors.textPrimary }]}>
            Show Frame
          </Text>
          <TouchableOpacity
            style={[
              styles.toggle,
              {
                backgroundColor: composition.frame.on ? themeDefinition.colors.accent : 'transparent',
                borderColor: composition.frame.on ? themeDefinition.colors.accent : themeDefinition.colors.border,
              }
            ]}
            onPress={() => {
              FeedbackService.buttonTap();
              updateComposition({
                frame: { ...composition.frame, on: !composition.frame.on }
              });
            }}
          >
            <View style={[
              styles.toggleKnob,
              {
                backgroundColor: composition.frame.on ? '#FFFFFF' : themeDefinition.colors.border,
                transform: [{ translateX: composition.frame.on ? 18 : 0 }]
              }
            ]} />
          </TouchableOpacity>
        </View>

        {composition.frame.on && (
          <>
            <Text style={[styles.toolSectionSubtitle, { color: themeDefinition.colors.textPrimary }]}>
              Frame Color
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorOptions}>
                {['#000000', '#FFFFFF', '#2563EB', '#7C3AED', '#F59E0B', '#059669', '#DC2626'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      composition.frame.color === color && { borderWidth: 3, borderColor: themeDefinition.colors.accent }
                    ]}
                    onPress={() => {
                      FeedbackService.buttonTap();
                      updateComposition({
                        frame: { ...composition.frame, color }
                      });
                    }}
                  />
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.toolSectionSubtitle, { color: themeDefinition.colors.textPrimary }]}>
              Frame Thickness ({composition.frame.thickness}px)
            </Text>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={[styles.sliderButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  updateComposition({
                    frame: { ...composition.frame, thickness: Math.max(1, composition.frame.thickness - 1) }
                  });
                }}
              >
                <Text style={[styles.sliderButtonText, { color: themeDefinition.colors.textPrimary }]}>-</Text>
              </TouchableOpacity>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={8}
                value={composition.frame.thickness}
                onValueChange={(value) => {
                  updateComposition({
                    frame: { ...composition.frame, thickness: Math.round(value) }
                  });
                }}
                onSlidingComplete={() => FeedbackService.buttonTap()}
                minimumTrackTintColor={themeDefinition.colors.accent}
                maximumTrackTintColor={themeDefinition.colors.border}
                thumbStyle={{ backgroundColor: themeDefinition.colors.accent }}
                step={1}
              />
              <TouchableOpacity
                style={[styles.sliderButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  updateComposition({
                    frame: { ...composition.frame, thickness: Math.min(8, composition.frame.thickness + 1) }
                  });
                }}
              >
                <Text style={[styles.sliderButtonText, { color: themeDefinition.colors.textPrimary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Corner Radius Section */}
      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          Corner Radius ({composition.cornerRadius}px)
        </Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[styles.sliderButton, { backgroundColor: themeDefinition.colors.surface }]}
            onPress={() => {
              FeedbackService.buttonTap();
              updateComposition({
                cornerRadius: Math.max(0, composition.cornerRadius - 2)
              });
            }}
          >
            <Text style={[styles.sliderButtonText, { color: themeDefinition.colors.textPrimary }]}>-</Text>
          </TouchableOpacity>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={32}
            value={composition.cornerRadius}
            onValueChange={(value) => {
              updateComposition({ cornerRadius: Math.round(value) });
            }}
            onSlidingComplete={() => FeedbackService.buttonTap()}
            minimumTrackTintColor={themeDefinition.colors.accent}
            maximumTrackTintColor={themeDefinition.colors.border}
            thumbStyle={{ backgroundColor: themeDefinition.colors.accent }}
            step={2}
          />
          <TouchableOpacity
            style={[styles.sliderButton, { backgroundColor: themeDefinition.colors.surface }]}
            onPress={() => {
              FeedbackService.buttonTap();
              updateComposition({
                cornerRadius: Math.min(32, composition.cornerRadius + 2)
              });
            }}
          >
            <Text style={[styles.sliderButtonText, { color: themeDefinition.colors.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </VerticalPager>
  );

  const renderExportPanel = () => (
    <VerticalPager style={styles.toolPanel} contentContainerStyle={styles.toolPanelContent}>
      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          {t('export_title')}
        </Text>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: themeDefinition.colors.accent }]}
          onPress={exportToPhotos}
        >
          <Text style={styles.exportButtonText}>{t('saveToPhotos')}</Text>
        </TouchableOpacity>
      </View>
    </VerticalPager>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeDefinition.colors.bg }]}>
      {/* Top toolbar */}
      <View style={[styles.topToolbar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: themeDefinition.colors.textPrimary }]}>
            ← {t('cancel')}
          </Text>
        </TouchableOpacity>

        <View style={styles.topActions}>
          {composition.photoAUri && composition.photoBUri && (
            <TouchableOpacity
              style={[styles.swapButton, { borderColor: themeDefinition.colors.border }]}
              onPress={swapPhotos}
            >
              <Text style={[styles.swapButtonText, { color: themeDefinition.colors.textSecondary }]}>
                {t('composer_swap')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.templateButton, { borderColor: themeDefinition.colors.border }]}
            onPress={() => {
              // TODO: Navigate to Templates
              Alert.alert('Templates', 'Templates coming soon!');
            }}
          >
            <Text style={[styles.templateButtonText, { color: themeDefinition.colors.textSecondary }]}>
              {t('composer_template')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas area */}
      <View style={[styles.canvasContainer, { height: canvasHeight }]}>
        {(!composition.photoAUri || !composition.photoBUri) ? (
          <View style={[styles.photoPlaceholder, { borderColor: themeDefinition.colors.border }]}>
            <Text style={[styles.placeholderText, { color: themeDefinition.colors.textSecondary }]}>
              {composition.layout === 'side' ? 'Select Before & After Photos' :
               composition.layout === 'vertical' ? 'Select Before (Top) & After (Bottom) Photos' :
               composition.layout === 'stacked' ? 'Select Before & After Photos' :
               t('pickTwoPhotos')}
            </Text>
            <View style={composition.layout === 'side' ? styles.photoButtonsSide : styles.photoButtons}>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => pickPhoto(true)}
              >
                <Text style={[styles.photoButtonText, { color: themeDefinition.colors.textPrimary }]}>
                  {composition.photoAUri ? '✓ Before' : 'Pick Before'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => pickPhoto(false)}
              >
                <Text style={[styles.photoButtonText, { color: themeDefinition.colors.textPrimary }]}>
                  {composition.photoBUri ? '✓ After' : 'Pick After'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View ref={canvasRef} collapsable={false} style={{ alignItems: 'center' }}>
            <CompositionCanvas composition={composition} />
          </View>
        )}
      </View>

      {/* Tool selector */}
      <View style={[styles.toolSelector, { backgroundColor: themeDefinition.colors.surface }]}>
        {(['layout', 'labels', 'style', 'export'] as const).map(panel => (
          <TouchableOpacity
            key={panel}
            style={[
              styles.toolTab,
              activePanel === panel && styles.activeToolTab,
              activePanel === panel && { backgroundColor: themeDefinition.colors.accent }
            ]}
            onPress={() => {
              FeedbackService.buttonTap();
              setActivePanel(panel);
            }}
          >
            <Text style={[
              styles.toolTabText,
              { color: activePanel === panel ? '#FFFFFF' : themeDefinition.colors.textSecondary }
            ]}>
              {t(panel)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tool panel */}
      <View style={styles.toolPanelContainer}>
        {activePanel === 'layout' && renderLayoutPanel()}
        {activePanel === 'labels' && renderLabelsPanel()}
        {activePanel === 'style' && renderStylePanel()}
        {activePanel === 'export' && renderExportPanel()}
      </View>

      {/* Text Editing Modal */}
      <Modal
        visible={showTextModal}
        animationType="slide"
        transparent={true}
        onRequestClose={cancelTextEdit}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeDefinition.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: themeDefinition.colors.textPrimary }]}>
              {editingField === 'before' ? t('labels_beforeText') : t('labels_afterText')}
            </Text>
            <TextInput
              style={[styles.modalTextInput, {
                borderColor: themeDefinition.colors.border,
                backgroundColor: themeDefinition.colors.bg,
                color: themeDefinition.colors.textPrimary
              }]}
              value={tempText}
              onChangeText={setTempText}
              placeholder={editingField === 'before' ? t('before') : t('after')}
              placeholderTextColor={themeDefinition.colors.textSecondary}
              multiline
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: themeDefinition.colors.border }]}
                onPress={cancelTextEdit}
              >
                <Text style={[styles.modalButtonText, { color: themeDefinition.colors.textPrimary }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: themeDefinition.colors.accent }]}
                onPress={saveTextEdit}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {t('apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 16,
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
    paddingBottom: 32,
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
  layoutButtons: {
    gap: 8,
  },
  layoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeLayoutButton: {
    // borderColor and backgroundColor will be set dynamically
  },
  layoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  editorTemplateName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
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
