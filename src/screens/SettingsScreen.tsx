import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Image,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { themes, Theme } from '../context/ThemeContext';
import { usePreferences } from '../hooks/usePreferences';
import FeedbackService from '../services/FeedbackService';
import IAPService from '../services/IAPService';

const { AppIconManager } = NativeModules;

type RootStackParamList = {
  Upgrade: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upgrade'>;

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
];

const appIcons: { iconName: string | null; name: string; source: any }[] = [
  { iconName: 'AppIconCoral', name: 'Coral', source: require('../assets/icons/appIcon/icon_coral_1024.png') },
  { iconName: 'AppIconBlue', name: 'Blue', source: require('../assets/icons/appIcon/icon_blue_1024.png') },
  { iconName: 'AppIconDark', name: 'Dark', source: require('../assets/icons/appIcon/icon_dark_1024.png') },
  { iconName: 'AppIconFuchsia', name: 'Fuchsia', source: require('../assets/icons/appIcon/icon_fuchsia_1024.png') },
  { iconName: 'AppIconSolar', name: 'Solar', source: require('../assets/icons/appIcon/icon_solar_1024.png') },
  { iconName: 'AppIconTeal', name: 'Teal', source: require('../assets/icons/appIcon/icon_teal_1024.png') },
  { iconName: null, name: 'Default', source: require('../assets/icons/appIcon/icon_coral_1024.png') },
];

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { currentTheme, setTheme, themeDefinition } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { preferences, updatePreferences } = usePreferences();

  const [showLanguageModal, setShowLanguageModal] = React.useState(false);
  const [showAppIconModal, setShowAppIconModal] = React.useState(false);
  const [isProUser, setIsProUser] = React.useState(false);

  useEffect(() => {
    IAPService.isPro().then(setIsProUser);
  }, []);

  const handleThemeChange = (theme: Theme) => {
    FeedbackService.buttonTap();
    setTheme(theme);
  };

  const handleLanguageChange = (language: Language) => {
    FeedbackService.buttonTap();
    setLanguage(language);
    setShowLanguageModal(false);
    FeedbackService.success();
  };

  const handleAppIconChange = async (iconName: string | null) => {
    FeedbackService.buttonTap();
    try {
      await AppIconManager.changeIcon(iconName);
      updatePreferences({ appIcon: iconName || 'default' });
      setShowAppIconModal(false);
      FeedbackService.success();
      Alert.alert('Success', 'App icon changed successfully!');
    } catch (error) {
      console.error('Failed to change app icon:', error);
      Alert.alert('Error', 'Failed to change app icon. Please try again.');
    }
  };


  const handleUpgrade = () => {
    navigation.navigate('Upgrade');
  };

  const handleRestorePurchases = async () => {
    FeedbackService.buttonTap();
    try {
      const restored = await IAPService.restorePurchases();
      if (restored) {
        setIsProUser(true);
        Alert.alert('Success', 'Purchases restored successfully!');
        FeedbackService.success();
      } else {
        Alert.alert('No Purchases', 'No previous purchases found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const currentLanguageName = languages.find(l => l.code === currentLanguage)?.nativeName || currentLanguage;
  const currentAppIcon = appIcons.find(icon => icon.iconName === preferences.appIcon) || appIcons[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
      <Text style={[styles.title, { color: themeDefinition.colors.text }]}>{t('settings_title')}</Text>
      
      {/* Theme Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeDefinition.colors.text }]}>{t('settings_theme')}</Text>
        <View style={styles.themeOptions}>
          {Object.values(themes).map((theme) => (
            <TouchableOpacity
              key={theme.name}
              style={[
                styles.themeOption,
                currentTheme === theme.name && styles.selectedTheme,
                { backgroundColor: theme.colors.card }
              ]}
              onPress={() => handleThemeChange(theme.name as Theme)}>
              <Text style={[styles.themeText, { color: theme.colors.text }]}>
                {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeDefinition.colors.text }]}>{t('settings_language')}</Text>
        <TouchableOpacity
          style={[styles.settingRow, { borderBottomColor: themeDefinition.colors.border }]}
          onPress={() => setShowLanguageModal(true)}>
          <Text style={[styles.settingLabel, { color: themeDefinition.colors.text }]}>{t('settings_language')}</Text>
          <Text style={[styles.settingValue, { color: themeDefinition.colors.text }]}>
            {currentLanguageName} ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Icon Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeDefinition.colors.text }]}>App Icon</Text>
        <TouchableOpacity
          style={[styles.settingRow, { borderBottomColor: themeDefinition.colors.border }]}
          onPress={() => setShowAppIconModal(true)}>
          <Text style={[styles.settingLabel, { color: themeDefinition.colors.text }]}>App Icon</Text>
          <View style={styles.iconPreview}>
            <Image source={currentAppIcon.source} style={styles.iconImage} />
            <Text style={[styles.settingValue, { color: themeDefinition.colors.text }]}>
              {currentAppIcon.name} ›
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Upgrade Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeDefinition.colors.text }]}>Premium</Text>
        {isProUser ? (
          <View style={styles.proSection}>
            <Text style={styles.proText}>✓ Pro Version Active</Text>
            <TouchableOpacity
              style={[styles.restoreButton, { backgroundColor: themeDefinition.colors.card }]}
              onPress={handleRestorePurchases}>
              <Text style={[styles.restoreButtonText, { color: themeDefinition.colors.text }]}>{t('settings_restore')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: themeDefinition.colors.primary }]}
            onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>{t('settings_upgrade')}</Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeDefinition.colors.card }]}>
            <Text style={[styles.modalTitle, { color: themeDefinition.colors.text }]}>
              {t('settings_language')}
            </Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    { borderBottomColor: themeDefinition.colors.border },
                    currentLanguage === item.code && styles.selectedLanguage
                  ]}
                  onPress={() => handleLanguageChange(item.code)}>
                  <View>
                    <Text style={[styles.languageName, { color: themeDefinition.colors.text }]}>
                      {item.nativeName}
                    </Text>
                    <Text style={[styles.languageSubtitle, { color: themeDefinition.colors.text + '99' }]}>
                      {item.name}
                    </Text>
                  </View>
                  {currentLanguage === item.code && (
                    <Text style={{ color: themeDefinition.colors.primary, fontSize: 20 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeDefinition.colors.primary }]}
              onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalCloseButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* App Icon Selection Modal */}
      <Modal
        visible={showAppIconModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppIconModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeDefinition.colors.card }]}>
            <Text style={[styles.modalTitle, { color: themeDefinition.colors.text }]}>
              Choose App Icon
            </Text>
            <FlatList
              data={appIcons}
              numColumns={2}
              keyExtractor={(item) => item.iconName || item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    { backgroundColor: themeDefinition.colors.background },
                    preferences.appIcon === item.iconName && styles.selectedIcon
                  ]}
                  onPress={() => handleAppIconChange(item.iconName)}>
                  <Image source={item.source} style={styles.iconOptionImage} />
                  <Text style={[styles.iconOptionText, { color: themeDefinition.colors.text }]}>
                    {item.name}
                  </Text>
                  {preferences.appIcon === item.iconName && (
                    <Text style={{ color: themeDefinition.colors.primary, fontSize: 16, marginTop: 4 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.iconGrid}
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeDefinition.colors.primary }]}
              onPress={() => setShowAppIconModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  themeOption: {
    width: '48%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: '#007AFF',
  },
  themeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  proSection: {
    alignItems: 'center',
  },
  proText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  restoreButtonText: {
    color: '#333',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  selectedLanguage: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  modalCloseButton: {
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconImage: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  iconGrid: {
    padding: 10,
  },
  iconOption: {
    flex: 1,
    margin: 8,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedIcon: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  iconOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconOptionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default SettingsScreen;