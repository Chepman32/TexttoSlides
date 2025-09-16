import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ImageSelectionScreen from '../screens/ImageSelectionScreen';
import EditorScreen from '../screens/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UpgradeScreen from '../screens/UpgradeScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ImageSelection: { text: string };
  Editor: { text: string; images: string[] };
  Preview: { slides: any[] };
  Settings: undefined;
  Upgrade: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ImageSelection" component={ImageSelectionScreen} />
        <Stack.Screen name="Editor" component={EditorScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Upgrade" component={UpgradeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;