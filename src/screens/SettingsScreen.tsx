import React from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { themes, Theme } from '../context/ThemeContext';
import { usePreferences } from '../hooks/usePreferences';
import FeedbackService from '../services/FeedbackService';
import StorageService from '../services/StorageService';

const { AppIconManager } = NativeModules;

const languages: {
  code: Language;
  name: string;
  nativeName: string;
  flag: any;
}[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: require('../assets/icons/flags/en.png'),
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: require('../assets/icons/flags/zh.png'),
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: require('../assets/icons/flags/ja.png'),
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: require('../assets/icons/flags/ko.png'),
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: require('../assets/icons/flags/de.png'),
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: require('../assets/icons/flags/fr.png'),
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: require('../assets/icons/flags/es.png'),
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: require('../assets/icons/flags/pt-BR.png'),
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: require('../assets/icons/flags/ar.png'),
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: require('../assets/icons/flags/ru.png'),
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: require('../assets/icons/flags/it.png'),
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: require('../assets/icons/flags/nl.png'),
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: require('../assets/icons/flags/tr.png'),
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: require('../assets/icons/flags/th.png'),
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: require('../assets/icons/flags/vi.png'),
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: require('../assets/icons/flags/id.png'),
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: require('../assets/icons/flags/pl.png'),
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: require('../assets/icons/flags/uk.png'),
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: require('../assets/icons/flags/hi.png'),
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: require('../assets/icons/flags/he.png'),
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: require('../assets/icons/flags/sv.png'),
  },
  {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    flag: require('../assets/icons/flags/no.png'),
  },
  {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    flag: require('../assets/icons/flags/da.png'),
  },
  {
    code: 'fi',
    name: 'Finnish',
    nativeName: 'Suomi',
    flag: require('../assets/icons/flags/fi.png'),
  },
  {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    flag: require('../assets/icons/flags/cs.png'),
  },
  {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    flag: require('../assets/icons/flags/hu.png'),
  },
  {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    flag: require('../assets/icons/flags/ro.png'),
  },
  {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    flag: require('../assets/icons/flags/el.png'),
  },
  {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    flag: require('../assets/icons/flags/ms.png'),
  },
  {
    code: 'fil',
    name: 'Filipino',
    nativeName: 'Filipino',
    flag: require('../assets/icons/flags/fil.png'),
  },
];

const appIcons: { iconName: string | null; nameKey: string; source: any }[] = [
  {
    iconName: null,
    nameKey: 'app_icon_default',
    source: require('../assets/icons/appIcon/icon_2_white_blue_1024.png'),
  },
  {
    iconName: 'AppIconBlueDark',
    nameKey: 'app_icon_blue_dark',
    source: require('../assets/icons/appIcon/icon_1_blue_dark_1024.png'),
  },
  {
    iconName: 'AppIconYellow',
    nameKey: 'app_icon_yellow',
    source: require('../assets/icons/appIcon/icon_3_yellow_1024.png'),
  },
  {
    iconName: 'AppIconGray',
    nameKey: 'app_icon_gray',
    source: require('../assets/icons/appIcon/icon_4_gray_1024.png'),
  },
];

const SettingsScreen: React.FC = () => {
  const { currentTheme, setTheme, themeDefinition } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { preferences, updatePreferences } = usePreferences();

  const [showLanguageModal, setShowLanguageModal] = React.useState(false);
  const [showAppIconModal, setShowAppIconModal] = React.useState(false);

  // App is now completely free - no need to check pro status

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
      // Check if we're in a development environment or simulator
      if (
        __DEV__ &&
        (!AppIconManager || typeof AppIconManager.changeIcon !== 'function')
      ) {
        // In development/simulator, just update the preference
        console.warn(
          'AppIconManager not available in simulator. Only updating preference.',
        );
        updatePreferences({ appIcon: iconName || 'default' });
        setShowAppIconModal(false);
        FeedbackService.success();
        Alert.alert(t('development_mode'), t('app_icon_dev_message'));
        return;
      }

      // Check if AppIconManager is available on device
      if (!AppIconManager || typeof AppIconManager.changeIcon !== 'function') {
        throw new Error(
          'Icon changing is not available on this device or iOS version.',
        );
      }

      await AppIconManager.changeIcon(iconName);
      updatePreferences({ appIcon: iconName || 'default' });
      setShowAppIconModal(false);
      FeedbackService.success();
      Alert.alert(t('success'), t('app_icon_success'));
    } catch (error) {
      console.error('Failed to change app icon:', error);
      const errorMessage = error.message || t('app_icon_error');
      Alert.alert(t('error'), errorMessage);
    }
  };

  const currentLanguageName =
    languages.find(l => l.code === currentLanguage)?.nativeName ||
    currentLanguage;
  const currentLanguageFlag = languages.find(
    l => l.code === currentLanguage,
  )?.flag;
  const currentAppIcon =
    appIcons.find(icon => icon.iconName === preferences.appIcon) || appIcons[0];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeDefinition.colors.background },
      ]}
    >
      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.title, { color: themeDefinition.colors.text }]}>
          {t('settings_title')}
        </Text>

        {/* Theme Selection */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: themeDefinition.colors.text },
            ]}
          >
            {t('settings_theme')}
          </Text>
          <View style={styles.themeOptions}>
            {Object.values(themes).map(theme => (
              <TouchableOpacity
                key={theme.name}
                style={[
                  styles.themeOption,
                  currentTheme === theme.name && styles.selectedTheme,
                  { backgroundColor: theme.colors.card },
                ]}
                onPress={() => handleThemeChange(theme.name as Theme)}
              >
                <Text style={[styles.themeText, { color: theme.colors.text }]}>
                  {t(theme.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: themeDefinition.colors.text },
            ]}
          >
            {t('settings_language')}
          </Text>
          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: themeDefinition.colors.border },
            ]}
            onPress={() => setShowLanguageModal(true)}
          >
            <Text
              style={[
                styles.settingLabel,
                { color: themeDefinition.colors.text },
              ]}
            >
              {t('settings_language')}
            </Text>
            <View style={styles.iconPreview}>
              {currentLanguageFlag && (
                <Image source={currentLanguageFlag} style={styles.flagIcon} />
              )}
              <Text
                style={[
                  styles.settingValue,
                  { color: themeDefinition.colors.text },
                ]}
              >
                {currentLanguageName} ›
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Icon Selection */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: themeDefinition.colors.text },
            ]}
          >
            {t('app_icon')}
          </Text>
          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: themeDefinition.colors.border },
            ]}
            onPress={() => setShowAppIconModal(true)}
          >
            <Text
              style={[
                styles.settingLabel,
                { color: themeDefinition.colors.text },
              ]}
            >
              {t('app_icon')}
            </Text>
            <View style={styles.iconPreview}>
              <Image source={currentAppIcon.source} style={styles.iconImage} />
              <Text
                style={[
                  styles.settingValue,
                  { color: themeDefinition.colors.text },
                ]}
              >
                {t(currentAppIcon.nameKey)} ›
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App is now completely free - no premium section needed */}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.modalContent,
              { backgroundColor: themeDefinition.colors.card },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: themeDefinition.colors.text },
              ]}
            >
              {t('settings_language')}
            </Text>
            <FlatList
              data={languages}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    { borderBottomColor: themeDefinition.colors.border },
                    currentLanguage === item.code && styles.selectedLanguage,
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <View style={styles.languageRow}>
                    <Image source={item.flag} style={styles.flagIcon} />
                    <View>
                      <Text
                        style={[
                          styles.languageName,
                          { color: themeDefinition.colors.text },
                        ]}
                      >
                        {item.nativeName}
                      </Text>
                      <Text
                        style={[
                          styles.languageSubtitle,
                          { color: themeDefinition.colors.text + '99' },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                  </View>
                  {currentLanguage === item.code && (
                    <Text
                      style={{
                        color: themeDefinition.colors.primary,
                        fontSize: 20,
                      }}
                    >
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                { backgroundColor: themeDefinition.colors.primary },
              ]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* App Icon Selection Modal */}
      <Modal
        visible={showAppIconModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppIconModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowAppIconModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.modalContent,
              { backgroundColor: themeDefinition.colors.card },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: themeDefinition.colors.text },
              ]}
            >
              {t('app_icon')}
            </Text>
            <FlatList
              data={appIcons}
              numColumns={2}
              keyExtractor={item => item.iconName || item.nameKey}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    { backgroundColor: themeDefinition.colors.background },
                    preferences.appIcon === item.iconName &&
                      styles.selectedIcon,
                  ]}
                  onPress={() => handleAppIconChange(item.iconName)}
                >
                  <Image source={item.source} style={styles.iconOptionImage} />
                  <Text
                    style={[
                      styles.iconOptionText,
                      { color: themeDefinition.colors.text },
                    ]}
                  >
                    {t(item.nameKey)}
                  </Text>
                  {preferences.appIcon === item.iconName && (
                    <Text
                      style={{
                        color: themeDefinition.colors.primary,
                        fontSize: 16,
                        marginTop: 4,
                      }}
                    >
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.iconGrid}
            />
            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                { backgroundColor: themeDefinition.colors.primary },
              ]}
              onPress={() => setShowAppIconModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
    maxHeight: '84%',
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
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
    borderRadius: 2,
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
