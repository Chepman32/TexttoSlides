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
import OnboardingScreen from '../screens/OnboardingScreen';
import { i18n, useLanguage } from '../context/LanguageContext';

import { CompositionState } from '../types/composer';
import { Template } from '../constants/templates';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Composer: {
    photoA?: string;
    photoB?: string;
    template?: Template;
    useTemplate?: boolean;
    showTemplates?: boolean;
    projectId?: string;
    savedComposition?: CompositionState;
  };
  Templates: { currentComposition: CompositionState };
  ExportResult: { composition: CompositionState; exportPath: string };
  Settings: undefined;
  Paywall: undefined;
  Onboarding: undefined;
  Legal: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  // Subscribe to language changes to trigger re-render of navigation options
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    // Initialize storage on app start
    StorageService.loadCurrentProject();
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
          options={() => ({
            presentation: 'modal',
            headerShown: true,
            title: i18n.t('templates_title'),
            headerBackTitle: i18n.t('cancel'),
          })}
        />
        <Stack.Screen
          name="ExportResult"
          component={PreviewScreen}
          options={() => ({
            presentation: 'modal',
            headerShown: true,
            title: i18n.t('export_title'),
            headerBackTitle: i18n.t('back'),
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={() => ({
            headerShown: true,
            title: i18n.t('settings'),
            headerBackTitle: i18n.t('back'),
          })}
        />
        <Stack.Screen
          name="Paywall"
          component={UpgradeScreen}
          options={() => ({
            presentation: 'modal',
            headerShown: true,
            title: i18n.t('pro'),
            headerBackTitle: i18n.t('cancel'),
          })}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Legal"
          component={SettingsScreen}
          options={() => ({
            headerShown: true,
            title: i18n.t('legal'),
            headerBackTitle: i18n.t('back'),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
