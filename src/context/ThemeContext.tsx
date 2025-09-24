import React, { createContext, useContext, ReactNode } from 'react';
import { usePreferences } from '../hooks/usePreferences';

export type Theme = 'light' | 'dark' | 'solar' | 'mono';

export interface ThemeColors {
  bg: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  shadow: string;
  canvasBg: string;
  labelBg: string;
  labelText: string;
  watermark: string;
  notification: string;
  // Additional properties for compatibility
  background: string;
  card: string;
  text: string;
  primary: string;
}

export interface ThemeDefinition {
  name: Theme;
  colors: ThemeColors;
}

export const themes: Record<Theme, ThemeDefinition> = {
  light: {
    name: 'light',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      accent: '#2563EB',
      border: '#E2E8F0',
      shadow: 'rgba(15, 23, 42, 0.1)',
      canvasBg: '#FFFFFF',
      labelBg: 'rgba(255,255,255,0.8)',
      labelText: '#0F172A',
      watermark: 'rgba(15,23,42,0.08)',
      notification: '#ff3b30',
      // Additional properties for compatibility
      background: '#F8FAFC',
      card: '#FFFFFF',
      text: '#0F172A',
      primary: '#2563EB',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      bg: '#0B1020',
      surface: '#111827',
      textPrimary: '#E5E7EB',
      textSecondary: '#9CA3AF',
      accent: '#60A5FA',
      border: '#1F2937',
      shadow: 'rgba(0,0,0,0.5)',
      canvasBg: '#0B1020',
      labelBg: 'rgba(17,24,39,0.7)',
      labelText: '#F3F4F6',
      watermark: 'rgba(229,231,235,0.08)',
      notification: '#ff453a',
      // Additional properties for compatibility
      background: '#0B1020',
      card: '#111827',
      text: '#E5E7EB',
      primary: '#60A5FA',
    },
  },
  solar: {
    name: 'solar',
    colors: {
      bg: '#FFF8E1',
      surface: '#FFFCF2',
      textPrimary: '#4E342E',
      textSecondary: '#6D4C41',
      accent: '#F59E0B',
      border: '#FFE0A3',
      shadow: 'rgba(78,52,46,0.1)',
      canvasBg: '#FFFAE8',
      labelBg: 'rgba(255, 240, 200, 0.85)',
      labelText: '#4E342E',
      watermark: 'rgba(78,52,46,0.08)',
      notification: '#dc322f',
      // Additional properties for compatibility
      background: '#FFF8E1',
      card: '#FFFCF2',
      text: '#4E342E',
      primary: '#F59E0B',
    },
  },
  mono: {
    name: 'mono',
    colors: {
      bg: '#F3F3F3',
      surface: '#FFFFFF',
      textPrimary: '#1F1F1F',
      textSecondary: '#6B6B6B',
      accent: '#8A8A8A',
      border: '#D9D9D9',
      shadow: 'rgba(0,0,0,0.08)',
      canvasBg: '#FFFFFF',
      labelBg: 'rgba(255,255,255,0.9)',
      labelText: '#1F1F1F',
      watermark: 'rgba(0,0,0,0.06)',
      notification: '#333333',
      // Additional properties for compatibility
      background: '#F3F3F3',
      card: '#FFFFFF',
      text: '#1F1F1F',
      primary: '#8A8A8A',
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