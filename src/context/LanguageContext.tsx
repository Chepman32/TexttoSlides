import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
} from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { usePreferences } from '../hooks/usePreferences';
import {
  translations,
  Language,
  SUPPORTED_LANGUAGES,
} from '../i18n/translations';
import { getDeviceLanguage } from '../utils/deviceLanguage';

export type { Language };
export { SUPPORTED_LANGUAGES };

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: translations,
  lng: getDeviceLanguage(), // Use device language as initial default
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

// Export i18n instance for use in navigation and other non-component contexts
export { i18n };

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { preferences, updatePreferences } = usePreferences();
  const [, forceUpdate] = useState(0);

  // Sync i18n language whenever preferences.language changes
  useEffect(() => {
    i18n.changeLanguage(preferences.language).then(() => {
      // Force re-render after language change to update all translations
      forceUpdate(n => n + 1);
    });
  }, [preferences.language]);

  const setLanguage = (language: Language) => {
    updatePreferences({ language });
    // i18n will update automatically via useEffect
  };

  // Wrap t function to ensure it uses current language
  const t = useCallback((key: string) => i18n.t(key), [preferences.language]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage: preferences.language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
