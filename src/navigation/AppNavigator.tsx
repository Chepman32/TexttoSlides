import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import StorageService from '../services/StorageService';
import ComposerScreen from '../screens/ComposerScreen';
import PreviewScreen from '../screens/PreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UpgradeScreen from '../screens/UpgradeScreen';

import { CompositionState } from '../types/composer';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Composer: { photoA?: string; photoB?: string };
  Templates: { currentComposition: CompositionState };
  ExportResult: { composition: CompositionState; exportPath: string };
  Settings: undefined;
  Paywall: undefined;
  Onboarding: undefined;
  Legal: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  useEffect(() => {
    // Initialize storage on app start
    StorageService.loadCurrentProject();
    StorageService.isFirstLaunch();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,

          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Composer"
          component={ComposerScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Templates"
          component={PreviewScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Templates',
            headerBackTitle: 'Cancel',
          }}
        />
        <Stack.Screen
          name="ExportResult"
          component={PreviewScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Export',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            title: 'Settings',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Paywall"
          component={UpgradeScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Pro',
            headerBackTitle: 'Cancel',
          }}
        />
        <Stack.Screen
          name="Onboarding"
          component={HomeScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Legal"
          component={SettingsScreen}
          options={{
            headerShown: true,
            title: 'Legal',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
