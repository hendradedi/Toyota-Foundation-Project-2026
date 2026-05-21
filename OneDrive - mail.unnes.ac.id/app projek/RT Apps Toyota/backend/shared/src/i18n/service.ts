/**
 * i18n Service
 * Core internationalization service for translation management
 */

import {
  Language,
  TranslationNamespace,
  Translation,
  TranslationOptions,
  I18nConfig,
  DEFAULT_I18N_CONFIG,
  LanguageDetectionResult,
  LANGUAGE_METADATA,
  DateTimeFormatOptions,
  NumberFormatOptions,
} from './types';
import logger from '../utils/logger';

/**
 * i18n Service Class
 */
export class I18nService {
  private config: I18nConfig;
  private translations: Map<string, Translation>;
  private cache: Map<string, string>;

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = { ...DEFAULT_I18N_CONFIG, ...config };
    this.translations = new Map();
    this.cache = new Map();
    
    logger.info('i18n Service initialized', {
      defaultLanguage: this.config.defaultLanguage,
      supportedLanguages: this.config.supportedLanguages,
    });
  }

  /**
   * Load translations for a specific language and namespace
   */
  public loadTranslations(
    language: Language,
    namespace: TranslationNamespace,
    translations: Translation
  ): void {
    const key = this.getResourceKey(language, namespace);
    this.translations.set(key, translations);
    logger.debug(`Loaded translations for ${language}:${namespace}`);
  }

  /**
   * Translate a key
   */
  public translate(
    key: string,
    options: TranslationOptions = {}
  ): string {
    const {
      language = this.config.defaultLanguage,
      namespace = TranslationNamespace.COMMON,
      interpolation = {},
      count,
    } = options;

    // Check cache first
    const cacheKey = this.getCacheKey(key, language, namespace, count);
    const cached = this.cache.get(cacheKey);
    if (cached && Object.keys(interpolation).length === 0) {
      return cached;
    }

    // Get translation
    let translation = this.getTranslation(key, language, namespace, count);

    // Fallback to default language if not found
    if (!translation && language !== this.config.defaultLanguage) {
      translation = this.getTranslation(key, this.config.defaultLanguage, namespace, count);
    }

    // Fallback to fallback language if still not found
    if (!translation && language !== this.config.fallbackLanguage) {
      translation = this.getTranslation(key, this.config.fallbackLanguage, namespace, count);
    }

    // Fallback to key if no translation found
    if (!translation) {
      logger.warn(`Translation not found: ${namespace}:${key} (${language})`);
      translation = key;
    }

    // Apply interpolation
    if (Object.keys(interpolation).length > 0) {
      translation = this.interpolate(translation, interpolation);
    }

    // Cache the result (without interpolation)
    if (Object.keys(interpolation).length === 0) {
      this.cache.set(cacheKey, translation);
    }

    return translation;
  }

  /**
   * Translate with shorthand
   */
  public t(key: string, options?: TranslationOptions): string {
    return this.translate(key, options);
  }

  /**
   * Get translation from storage
   */
  private getTranslation(
    key: string,
    language: Language,
    namespace: TranslationNamespace,
    count?: number
  ): string | null {
    const resourceKey = this.getResourceKey(language, namespace);
    const resource = this.translations.get(resourceKey);

    if (!resource) {
      return null;
    }

    // Handle pluralization
    if (count !== undefined) {
      const pluralKey = this.getPluralKey(key, count, language);
      const pluralTranslation = this.getNestedValue(resource, pluralKey);
      if (pluralTranslation) {
        return pluralTranslation;
      }
    }

    // Get regular translation
    return this.getNestedValue(resource, key);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Translation, path: string): string | null {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Interpolate variables in translation
   */
  private interpolate(
    translation: string,
    variables: Record<string, string | number>
  ): string {
    let result = translation;
    const { prefix, suffix } = this.config.interpolation;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `${prefix}${key}${suffix}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return result;
  }

  /**
   * Get plural key based on count and language rules
   */
  private getPluralKey(key: string, count: number, language: Language): string {
    const form = this.getPluralForm(count, language);
    return `${key}_${form}`;
  }

  /**
   * Get plural form for a count
   */
  private getPluralForm(count: number, language: Language): string {
    // Indonesian: no pluralization (use 'other' for all)
    if (language === Language.INDONESIAN) {
      return 'other';
    }

    // Thai: no pluralization (use 'other' for all)
    if (language === Language.THAI) {
      return 'other';
    }

    // English: standard pluralization
    if (language === Language.ENGLISH) {
      if (count === 0) return 'zero';
      if (count === 1) return 'one';
      return 'other';
    }

    return 'other';
  }

  /**
   * Detect language from request headers
   */
  public detectLanguage(acceptLanguage?: string): LanguageDetectionResult {
    if (!acceptLanguage) {
      return {
        language: this.config.defaultLanguage,
        confidence: 1.0,
        source: 'default',
      };
    }

    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return {
          code: code.split('-')[0].toLowerCase(),
          quality: parseFloat(q),
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find first supported language
    for (const { code, quality } of languages) {
      const language = this.normalizeLanguageCode(code);
      if (language && this.config.supportedLanguages.includes(language)) {
        return {
          language,
          confidence: quality,
          source: 'header',
        };
      }
    }

    return {
      language: this.config.defaultLanguage,
      confidence: 1.0,
      source: 'default',
    };
  }

  /**
   * Normalize language code
   */
  private normalizeLanguageCode(code: string): Language | null {
    const normalized = code.toLowerCase();
    
    if (normalized === 'id' || normalized === 'in') return Language.INDONESIAN;
    if (normalized === 'th') return Language.THAI;
    if (normalized === 'en') return Language.ENGLISH;
    
    return null;
  }

  /**
   * Format date/time according to language
   */
  public formatDateTime(
    date: Date,
    options: DateTimeFormatOptions
  ): string {
    const { language, format = 'medium', includeTime = false } = options;

    try {
      const locale = this.getLocaleString(language);
      const formatOptions: Intl.DateTimeFormatOptions = {
        dateStyle: format,
      };

      if (includeTime) {
        formatOptions.timeStyle = format;
      }

      return new Intl.DateTimeFormat(locale, formatOptions).format(date);
    } catch (error) {
      logger.error('Date formatting error:', error);
      return date.toISOString();
    }
  }

  /**
   * Format number according to language
   */
  public formatNumber(
    value: number,
    options: NumberFormatOptions
  ): string {
    const {
      language,
      style = 'decimal',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    } = options;

    try {
      const locale = this.getLocaleString(language);
      const formatOptions: Intl.NumberFormatOptions = {
        style,
        minimumFractionDigits,
        maximumFractionDigits,
      };

      if (style === 'currency') {
        formatOptions.currency = currency || LANGUAGE_METADATA[language].currencyCode;
      }

      return new Intl.NumberFormat(locale, formatOptions).format(value);
    } catch (error) {
      logger.error('Number formatting error:', error);
      return value.toString();
    }
  }

  /**
   * Get locale string for Intl API
   */
  private getLocaleString(language: Language): string {
    switch (language) {
      case Language.INDONESIAN:
        return 'id-ID';
      case Language.THAI:
        return 'th-TH';
      case Language.ENGLISH:
        return 'en-US';
      default:
        return 'en-US';
    }
  }

  /**
   * Get resource key
   */
  private getResourceKey(language: Language, namespace: TranslationNamespace): string {
    return `${language}:${namespace}`;
  }

  /**
   * Get cache key
   */
  private getCacheKey(
    key: string,
    language: Language,
    namespace: TranslationNamespace,
    count?: number
  ): string {
    return `${language}:${namespace}:${key}${count !== undefined ? `:${count}` : ''}`;
  }

  /**
   * Clear translation cache
   */
  public clearCache(): void {
    this.cache.clear();
    logger.debug('Translation cache cleared');
  }

  /**
   * Get supported languages
   */
  public getSupportedLanguages(): Language[] {
    return this.config.supportedLanguages;
  }

  /**
   * Check if language is supported
   */
  public isLanguageSupported(language: string): boolean {
    const normalized = this.normalizeLanguageCode(language);
    return normalized !== null && this.config.supportedLanguages.includes(normalized);
  }

  /**
   * Get language metadata
   */
  public getLanguageMetadata(language: Language) {
    return LANGUAGE_METADATA[language];
  }
}

// Export singleton instance
export const i18nService = new I18nService();
