export type SlideFontId =
  | 'archivo_black_regular'
  | 'fira_sans_regular'
  | 'fira_sans_semibold'
  | 'homemade_apple_regular';

export interface SlideFontOption {
  id: SlideFontId;
  label: string;
  sample?: string;
  fontFamily?: string;
  iosFontFamily?: string | string[];
  androidFontFamily?: string | string[];
  supportsWeightToggle?: boolean;
}

export const LEGACY_SYSTEM_FONT_ID = 'system' as unknown as SlideFontId;

export const SLIDE_FONT_OPTIONS: SlideFontOption[] = [
  {
    id: 'archivo_black_regular',
    label: 'Archivo Black',
    fontFamily: 'ArchivoBlack-Regular',
    iosFontFamily: ['Archivo Black', 'ArchivoBlack-Regular', 'Archivo Black Regular'],
    androidFontFamily: 'ArchivoBlack-Regular',
    sample: 'Archivo',
    supportsWeightToggle: false,
  },
  {
    id: 'fira_sans_regular',
    label: 'Fira Sans Regular',
    fontFamily: 'FiraSans-Regular',
    iosFontFamily: ['Fira Sans', 'FiraSans-Regular', 'Fira Sans Regular'],
    androidFontFamily: 'FiraSans-Regular',
    sample: 'Regular',
    supportsWeightToggle: false,
  },
  {
    id: 'fira_sans_semibold',
    label: 'Fira Sans SemiBold',
    fontFamily: 'FiraSans-SemiBold',
    iosFontFamily: ['Fira Sans SemiBold', 'FiraSans-SemiBold'],
    androidFontFamily: 'FiraSans-SemiBold',
    sample: 'SemiBold',
    supportsWeightToggle: false,
  },
  {
    id: 'homemade_apple_regular',
    label: 'Homemade Apple',
    fontFamily: 'HomemadeApple-Regular',
    iosFontFamily: ['Homemade Apple', 'HomemadeApple-Regular', 'Homemade Apple Regular'],
    androidFontFamily: 'HomemadeApple-Regular',
    sample: 'Homemade',
    supportsWeightToggle: false,
  },
];

const pickFont = (value?: string | string[]): string | undefined => {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
};

export const DEFAULT_SLIDE_FONT_ID: SlideFontId = 'fira_sans_regular';

export const getSlideFontById = (id: SlideFontId): SlideFontOption => {
  const fallback =
    SLIDE_FONT_OPTIONS.find(option => option.id === DEFAULT_SLIDE_FONT_ID) ||
    SLIDE_FONT_OPTIONS[0];
  return SLIDE_FONT_OPTIONS.find(option => option.id === id) || fallback;
};

export const getSlideFontByFamily = (fontFamily?: string): SlideFontOption => {
  if (!fontFamily) {
    return getSlideFontById(DEFAULT_SLIDE_FONT_ID);
  }
  const matches = (option: SlideFontOption) => {
    const candidates: (string | undefined)[] = [
      option.fontFamily,
      ...(Array.isArray(option.iosFontFamily)
        ? option.iosFontFamily
        : option.iosFontFamily
          ? [option.iosFontFamily]
          : []),
      ...(Array.isArray(option.androidFontFamily)
        ? option.androidFontFamily
        : option.androidFontFamily
          ? [option.androidFontFamily]
          : []),
    ];
    return candidates.filter(Boolean).some(candidate => candidate === fontFamily);
  };

  return SLIDE_FONT_OPTIONS.find(matches) || getSlideFontById(DEFAULT_SLIDE_FONT_ID);
};

export const resolveFontFamilyForPlatform = (
  option: SlideFontOption,
  platform: 'ios' | 'android' | 'default' = 'default',
): string | undefined => {
  if (!option) {
    return undefined;
  }

  if (platform === 'ios') {
    return pickFont(option.iosFontFamily) ?? pickFont(option.fontFamily);
  }

  if (platform === 'android') {
    return pickFont(option.androidFontFamily) ?? pickFont(option.fontFamily);
  }

  return pickFont(option.fontFamily);
};
