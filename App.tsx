/**
 * Snapduo Mobile App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import IAPService from './src/services/IAPService';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    // Initialize IAP service
    IAPService.init();

    // Cleanup on unmount
    return () => {
      IAPService.endConnection();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <View style={styles.container}>
              <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={false}
              />
              <AppNavigator />
              {showSplash && (
                <AnimatedSplashScreen
                  onAnimationComplete={handleSplashComplete}
                />
              )}
            </View>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
