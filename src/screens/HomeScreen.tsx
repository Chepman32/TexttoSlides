import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();

  const [hasInProgressComposition, setHasInProgressComposition] = useState(false);

  useEffect(() => {
    // TODO: Check for saved composition
    // For now, just set to false
    setHasInProgressComposition(false);
  }, []);

  const pickTwoPhotos = () => {
    FeedbackService.buttonTap();
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
        selectionLimit: 2, // Allow picking 2 photos at once if supported
      },
      response => {
        if (response.didCancel || response.errorMessage) return;

        const assets = response.assets;
        if (assets && assets.length >= 1) {
          // Navigate to Composer with first photo
          const photoA = assets[0]?.uri;
          const photoB = assets[1]?.uri; // May be undefined if only one selected
          navigation.navigate('Composer', { photoA, photoB });
        }
      }
    );
  };

  const continueEditing = () => {
    FeedbackService.buttonTap();
    navigation.navigate('Composer', {});
  };

  const handleSettings = () => {
    FeedbackService.buttonTap();
    navigation.navigate('Settings');
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeDefinition.colors.bg },
      ]}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeDefinition.colors.textPrimary }]}>
            {t('appName')}
          </Text>
          <TouchableOpacity
            onPress={handleSettings}
            style={styles.settingsButton}
          >
            <Text style={[styles.settingsButtonText, { color: themeDefinition.colors.textPrimary }]}>
              ⚙️
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Continue editing section */}
          {hasInProgressComposition && (
            <View style={[styles.continueSection, { backgroundColor: themeDefinition.colors.surface }]}>
              <Text style={[styles.continueTitle, { color: themeDefinition.colors.textPrimary }]}>
                {t('home_continueEditing')}
              </Text>
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: themeDefinition.colors.accent }]}
                onPress={continueEditing}
              >
                <Text style={styles.continueButtonText}>
                  {t('continue')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Primary action */}
          <View style={styles.mainSection}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: themeDefinition.colors.accent }]}
              onPress={pickTwoPhotos}
            >
              <View style={styles.primaryButtonContent}>
                <Text style={styles.primaryButtonIcon}>📸</Text>
                <Text style={styles.primaryButtonText}>
                  {t('pickTwoPhotos')}
                </Text>
                <Text style={styles.primaryButtonSubtext}>
                  {t('home_tip')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent templates section */}
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: themeDefinition.colors.textPrimary }]}>
              {t('home_recentTemplates')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesContainer}
            >
              {/* Template placeholders */}
              {[1, 2, 3].map(index => (
                <TouchableOpacity
                  key={index}
                  style={[styles.templateCard, { backgroundColor: themeDefinition.colors.surface }]}
                  onPress={() => {
                    FeedbackService.buttonTap();
                    // TODO: Navigate to templates or apply template
                  }}
                >
                  <View style={[styles.templatePreview, { backgroundColor: themeDefinition.colors.border }]}>
                    <Text style={[styles.templatePreviewText, { color: themeDefinition.colors.textSecondary }]}>
                      Preview
                    </Text>
                  </View>
                  <Text style={[styles.templateName, { color: themeDefinition.colors.textSecondary }]}>
                    Template {index}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tip card */}
          <View style={[styles.tipCard, { backgroundColor: themeDefinition.colors.surface }]}>
            <View style={styles.tipContent}>
              <Text style={styles.tipIcon}>💡</Text>
              <View style={styles.tipText}>
                <Text style={[styles.tipTitle, { color: themeDefinition.colors.textPrimary }]}>
                  Pro Tip
                </Text>
                <Text style={[styles.tipDescription, { color: themeDefinition.colors.textSecondary }]}>
                  Choose photos with similar lighting and composition for the best before/after effect
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  continueSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainSection: {
    marginBottom: 32,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButtonContent: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryButtonIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  primaryButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  templatesContainer: {
    paddingRight: 20,
  },
  templateCard: {
    width: 120,
    marginRight: 16,
    borderRadius: 12,
    padding: 12,
  },
  templatePreview: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  templatePreviewText: {
    fontSize: 12,
    fontWeight: '500',
  },
  templateName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  tipCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;