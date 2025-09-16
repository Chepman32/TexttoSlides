import React, { createContext, useContext, ReactNode } from 'react';
import { usePreferences } from '../hooks/usePreferences';

export type Theme = 'light' | 'dark' | 'solar' | 'mono';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  primary: string;
  border: string;
  notification: string;
}

export interface ThemeDefinition {
  name: Theme;
  colors: ThemeColors;
}

export const themes: Record<Theme, ThemeDefinition> = {
  light: {
    name: 'light',
    colors: {
      background: '#ffffff',
      card: '#ffffff',
      text: '#000000',
      primary: '#007AFF',
      border: '#dcdcdc',
      notification: '#ff3b30',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#121212',
      card: '#1e1e1e',
      text: '#ffffff',
      primary: '#0a84ff',
      border: '#2c2c2e',
      notification: '#ff453a',
    },
  },
  solar: {
    name: 'solar',
    colors: {
      background: '#fdf6e3',
      card: '#eee8d5',
      text: '#373529',
      primary: '#b58900',
      border: '#93a1a1',
      notification: '#dc322f',
    },
  },
  mono: {
    name: 'mono',
    colors: {
      background: '#f0f0f0',
      card: '#e0e0e0',
      text: '#000000',
      primary: '#666666',
      border: '#cccccc',
      notification: '#333333',
    },
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  themeDefinition: ThemeDefinition;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences } = usePreferences();
  
  const setTheme = (theme: Theme) => {
    updatePreferences({ theme });
  };

  const themeDefinition = themes[preferences.theme];

  return (
    <ThemeContext.Provider value={{ currentTheme: preferences.theme, themeDefinition, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;