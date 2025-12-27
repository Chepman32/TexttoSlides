import * as RNLocalize from 'react-native-localize';
import { Language } from '../context/LanguageContext';

// Supported languages in the app
const SUPPORTED_LANGUAGES: Language[] = [
  'en',
  'ru',
  'es',
  'de',
  'fr',
  'pt',
  'ja',
  'zh',
  'ko',
  'uk',
];

/**
 * Gets the device's preferred language and maps it to a supported app language.
 * Falls back to 'en' if no supported language is found.
 */
export const getDeviceLanguage = (): Language => {
  const locales = RNLocalize.getLocales();

  if (locales.length === 0) {
    return 'en';
  }

  // Try to find a matching supported language
  for (const locale of locales) {
    // First try exact match with language code (e.g., 'en', 'ru')
    const languageCode = locale.languageCode.toLowerCase() as Language;
    if (SUPPORTED_LANGUAGES.includes(languageCode)) {
      return languageCode;
    }
  }

  // Default to English if no match found
  return 'en';
};

export default getDeviceLanguage;
