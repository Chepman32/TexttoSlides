import React, { useState } from 'react';
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

type RootStackParamList = {
  ImageSelection: { text: string };
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ImageSelection'>;

const HomeScreen: React.FC = () => {
  const [text, setText] = useState('');
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleGenerateSlides = () => {
    if (text.trim().length === 0) {
      Alert.alert('Error', 'Please enter some text to generate slides');
      return;
    }

    // Navigate to image selection screen with the text
    navigation.navigate('ImageSelection', { text });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const estimatedSlides = estimateSlideCount(text);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.title}>Text to Slides</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Enter your text below to generate slides</Text>
        
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Enter your text here..."
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {text.trim().length > 0 
              ? `Characters: ${text.trim().length} | Estimated slides: ${estimatedSlides}` 
              : 'Start typing to see character count and estimated slides'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateSlides}>
          <Text style={styles.generateButtonText}>Generate Slides</Text>
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