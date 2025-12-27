import * as RNLocalize from 'react-native-localize';
import { Language, SUPPORTED_LANGUAGES } from '../i18n/translations';

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

    // Handle special cases for language variants
    // Norwegian: 'nb' (Bokmål) or 'nn' (Nynorsk) -> 'no'
    if (languageCode === 'nb' || languageCode === 'nn') {
      return 'no';
    }

    // Filipino: 'tl' (Tagalog) -> 'fil'
    if (languageCode === 'tl') {
      return 'fil';
    }

    // Hebrew: 'iw' (old code) -> 'he'
    if (languageCode === 'iw') {
      return 'he';
    }

    // Indonesian: 'in' (old code) -> 'id'
    if (languageCode === 'in') {
      return 'id';
    }
  }

  // Default to English if no match found
  return 'en';
};

export default getDeviceLanguage;
