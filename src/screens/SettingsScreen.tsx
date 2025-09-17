import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { themes, Theme } from '../context/ThemeContext';

type RootStackParamList = {
  Upgrade: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upgrade'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { currentTheme, setTheme } = useTheme();
  const { currentLanguage } = useLanguage();
  
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);
  const [isProUser, _setIsProUser] = React.useState(false);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language Selection',
      'In a complete implementation, this would allow you to select from available languages.',
      [{ text: 'OK' }]
    );
  };

  const handleUpgrade = () => {
    navigation.navigate('Upgrade');
  };

  const handleRestorePurchases = () => {
    Alert.alert(
      'Restore Purchases',
      'In a complete implementation, this would restore your previous purchases.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
      <Text style={styles.title}>Settings</Text>
      
      {/* Theme Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
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
        <Text style={styles.sectionTitle}>Language</Text>
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleLanguageChange}>
          <Text style={styles.settingLabel}>Language</Text>
          <Text style={styles.settingValue}>
            {currentLanguage.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Sound and Haptics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Haptics</Text>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
          />
        </View>
      </View>
      
      {/* Upgrade Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium</Text>
        {isProUser ? (
          <View style={styles.proSection}>
            <Text style={styles.proText}>Pro Version Active</Text>
            <TouchableOpacity 
              style={styles.restoreButton}
              onPress={handleRestorePurchases}>
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
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
});

export default SettingsScreen;