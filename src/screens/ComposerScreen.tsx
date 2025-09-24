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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import { CompositionState, LayoutType, LabelStyle } from '../types/composer';
import { RootStackParamList } from '../navigation/AppNavigator';
import CompositionCanvas from '../components/CompositionCanvas';

type ComposerRouteProp = RouteProp<RootStackParamList, 'Composer'>;
type ComposerNavigationProp = StackNavigationProp<RootStackParamList, 'ExportResult'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ComposerScreen: React.FC = () => {
  const route = useRoute<ComposerRouteProp>();
  const navigation = useNavigation<ComposerNavigationProp>();
  const insets = useSafeAreaInsets();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();

  // Initialize composition state
  const [composition, setComposition] = useState<CompositionState>({
    photoAUri: route.params?.photoA,
    photoBUri: route.params?.photoB,
    layout: 'side',
    spacing: 12,
    cornerRadius: 16,
    shadow: 'low',
    aspect: 'free',
    labels: {
      textBefore: t('before'),
      textAfter: t('after'),
      fontFamily: 'System',
      fontSize: 24,
      fontWeight: 'Bold',
      color: '#FFFFFF',
      position: 'bl',
      margin: 16,
      show: true,
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

  const setLayout = (layout: LayoutType) => {
    FeedbackService.buttonTap();
    updateComposition({ layout });
  };

  const setAspectRatio = (aspect: CompositionState['aspect']) => {
    FeedbackService.buttonTap();
    updateComposition({ aspect });
  };

  const setShadow = (shadow: CompositionState['shadow']) => {
    FeedbackService.buttonTap();
    updateComposition({ shadow });
  };

  const updateLabels = (labelUpdates: Partial<LabelStyle>) => {
    updateComposition({
      labels: { ...composition.labels, ...labelUpdates }
    });
  };

  const canvasHeight = screenHeight * 0.45;

  const renderLayoutPanel = () => (
    <ScrollView style={styles.toolPanel} showsVerticalScrollIndicator={false}>
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

      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          {t('composer_shadow')}
        </Text>
        <View style={styles.shadowButtons}>
          {([
            { key: 'none', label: t('composer_shadowNone') },
            { key: 'low', label: t('composer_shadowLow') },
            { key: 'med', label: t('composer_shadowMed') },
            { key: 'high', label: t('composer_shadowHigh') },
          ] as const).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.shadowButton,
                composition.shadow === key && styles.activeShadowButton,
                { borderColor: themeDefinition.colors.border }
              ]}
              onPress={() => setShadow(key)}
            >
              <Text style={[
                styles.shadowButtonText,
                { color: composition.shadow === key ? themeDefinition.colors.accent : themeDefinition.colors.textSecondary }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderLabelsPanel = () => (
    <ScrollView style={styles.toolPanel} showsVerticalScrollIndicator={false}>
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
                // TODO: Open text editor modal
                FeedbackService.buttonTap();
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
                // TODO: Open text editor modal
                FeedbackService.buttonTap();
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
              <View style={[styles.sliderTrack, { backgroundColor: themeDefinition.colors.border }]}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      backgroundColor: themeDefinition.colors.accent,
                      width: `${((composition.labels.fontSize - 12) / (48 - 12)) * 100}%`
                    }
                  ]}
                />
              </View>
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
    </ScrollView>
  );

  const renderStylePanel = () => (
    <ScrollView style={styles.toolPanel} showsVerticalScrollIndicator={false}>
      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          {t('style_background')}
        </Text>
        {/* TODO: Add background controls */}
      </View>
    </ScrollView>
  );

  const renderExportPanel = () => (
    <ScrollView style={styles.toolPanel} showsVerticalScrollIndicator={false}>
      <View style={styles.toolSection}>
        <Text style={[styles.toolSectionTitle, { color: themeDefinition.colors.textPrimary }]}>
          {t('export_title')}
        </Text>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: themeDefinition.colors.accent }]}
          onPress={() => {
            // TODO: Implement export
            Alert.alert('Export', 'Export functionality coming soon!');
          }}
        >
          <Text style={styles.exportButtonText}>{t('saveToPhotos')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
              {t('pickTwoPhotos')}
            </Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => pickPhoto(true)}
              >
                <Text style={[styles.photoButtonText, { color: themeDefinition.colors.textPrimary }]}>
                  {composition.photoAUri ? 'Change Before' : 'Pick Before'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: themeDefinition.colors.surface }]}
                onPress={() => pickPhoto(false)}
              >
                <Text style={[styles.photoButtonText, { color: themeDefinition.colors.textPrimary }]}>
                  {composition.photoBUri ? 'Change After' : 'Pick After'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CompositionCanvas composition={composition} />
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
  shadowButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shadowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  activeShadowButton: {
    // styles set dynamically
  },
  shadowButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
});

export default ComposerScreen;