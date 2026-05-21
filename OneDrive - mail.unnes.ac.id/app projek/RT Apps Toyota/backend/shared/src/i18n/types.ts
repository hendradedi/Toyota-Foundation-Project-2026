/**
 * i18n Types
 * Type definitions for internationalization system
 */

/**
 * Supported languages
 */
export enum Language {
  INDONESIAN = 'id',
  THAI = 'th',
  ENGLISH = 'en',
}

/**
 * Language metadata
 */
export interface LanguageMetadata {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currencyCode: string;
  currencySymbol: string;
}

/**
 * Translation namespace
 */
export enum TranslationNamespace {
  COMMON = 'common',
  AUTH = 'auth',
  USER = 'user',
  SOS = 'sos',
  PATROL = 'patrol',
  MARKETPLACE = 'marketplace',
  WASTE_BANK = 'waste_bank',
  NEIGHBORHOOD = 'neighborhood',
  NOTIFICATIONS = 'notifications',
  ERRORS = 'errors',
  VALIDATION = 'validation',
}

/**
 * Translation key structure
 */
export interface TranslationKey {
  namespace: TranslationNamespace;
  key: string;
  defaultValue?: string;
}

/**
 * Translation data structure
 */
export interface Translation {
  [key: string]: string | Translation;
}

/**
 * Language resource
 */
export interface LanguageResource {
  language: Language;
  namespace: TranslationNamespace;
  translations: Translation;
}

/**
 * i18n configuration
 */
export interface I18nConfig {
  defaultLanguage: Language;
  supportedLanguages: Language[];
  fallbackLanguage: Language;
  namespaces: TranslationNamespace[];
  interpolation: {
    prefix: string;
    suffix: string;
  };
}

/**
 * Translation options
 */
export interface TranslationOptions {
  language?: Language;
  namespace?: TranslationNamespace;
  interpolation?: Record<string, string | number>;
  count?: number;
  context?: string;
}

/**
 * Pluralization rules
 */
export interface PluralizationRule {
  language: Language;
  rule: (count: number) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
}

/**
 * Date/Time formatting options
 */
export interface DateTimeFormatOptions {
  language: Language;
  format?: 'short' | 'medium' | 'long' | 'full';
  includeTime?: boolean;
}

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  language: Language;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  language: Language;
  confidence: number;
  source: 'header' | 'cookie' | 'query' | 'default';
}

/**
 * Translation cache entry
 */
export interface TranslationCacheEntry {
  key: string;
  language: Language;
  namespace: TranslationNamespace;
  value: string;
  timestamp: Date;
}

/**
 * Language metadata map
 */
export const LANGUAGE_METADATA: Record<Language, LanguageMetadata> = {
  [Language.INDONESIAN]: {
    code: Language.INDONESIAN,
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currencyCode: 'IDR',
    currencySymbol: 'Rp',
  },
  [Language.THAI]: {
    code: Language.THAI,
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currencyCode: 'THB',
    currencySymbol: '฿',
  },
  [Language.ENGLISH]: {
    code: Language.ENGLISH,
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'hh:mm A',
    currencyCode: 'USD',
    currencySymbol: '$',
  },
};

/**
 * Default i18n configuration
 */
export const DEFAULT_I18N_CONFIG: I18nConfig = {
  defaultLanguage: Language.INDONESIAN,
  supportedLanguages: [Language.INDONESIAN, Language.THAI, Language.ENGLISH],
  fallbackLanguage: Language.ENGLISH,
  namespaces: Object.values(TranslationNamespace),
  interpolation: {
    prefix: '{{',
    suffix: '}}',
  },
};
