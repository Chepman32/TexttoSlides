import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { estimateSlideCount } from '../utils/textUtils';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';

type RootStackParamList = {
  ImageSelection: { text: string };
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ImageSelection'>;

const HomeScreen: React.FC = () => {
  const [text, setText] = useState('');
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();

  // Load last saved text if any
  useEffect(() => {
    StorageService.loadCurrentProject().then(project => {
      if (project && !project.isCompleted && project.text) {
        setText(project.text);
      }
    });
  }, []);

  const handleGenerateSlides = () => {
    if (text.trim().length === 0) {
      FeedbackService.error();
      Alert.alert(t('home_error_empty'), '');
      return;
    }

    FeedbackService.buttonTap();
    // Navigate to image selection screen with the text
    navigation.navigate('ImageSelection', { text });
  };

  const handleSettings = () => {
    FeedbackService.buttonTap();
    navigation.navigate('Settings');
  };

  const estimatedSlides = estimateSlideCount(text);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { borderBottomColor: themeDefinition.colors.border }]}>
        <Text style={[styles.title, { color: themeDefinition.colors.text }]}>{t('app_name')}</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: themeDefinition.colors.text }]}>
          {t('home_subtitle')}
        </Text>

        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: themeDefinition.colors.card,
              color: themeDefinition.colors.text,
              borderColor: themeDefinition.colors.border,
            }
          ]}
          multiline
          placeholder={t('home_placeholder')}
          placeholderTextColor={themeDefinition.colors.text + '66'}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: themeDefinition.colors.text }]}>
            {text.trim().length > 0
              ? `${t('home_character_count', { count: text.trim().length })} | Estimated slides: ${estimatedSlides}`
              : t('home_start_typing')}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.generateButton,
            text.trim().length > 0
              ? { backgroundColor: '#007AFF' }
              : { backgroundColor: '#ccc' }
          ]}
          onPress={handleGenerateSlides}
          disabled={text.trim().length === 0}>
          <Text style={[
            styles.generateButtonText,
            text.trim().length === 0 && { color: '#999' }
          ]}>{t('home_generate_button')}</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
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
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  infoContainer: {
    marginVertical: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;