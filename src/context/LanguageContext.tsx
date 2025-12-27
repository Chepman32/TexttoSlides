import React, { createContext, useContext, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { usePreferences } from '../hooks/usePreferences';
import {
  translations,
  Language,
  SUPPORTED_LANGUAGES,
} from '../i18n/translations';

export type { Language };
export { SUPPORTED_LANGUAGES };

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: translations,
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: typeof i18n.t;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { preferences, updatePreferences } = usePreferences();

  const setLanguage = (language: Language) => {
    updatePreferences({ language });
    i18n.changeLanguage(language);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage: preferences.language,
        setLanguage,
        t: i18n.t,
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
