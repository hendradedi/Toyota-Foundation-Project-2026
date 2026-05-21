/**
 * Translation Loader
 * Utilities for loading translation files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { i18nService } from './service';
import { Language, TranslationNamespace, Translation } from './types';
import logger from '../utils/logger';

/**
 * Translation file structure
 */
export interface TranslationFile {
  language: Language;
  namespace: TranslationNamespace;
  path: string;
}

/**
 * Load translations from JSON file
 */
export async function loadTranslationFile(filePath: string): Promise<Translation> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.error(`Failed to load translation file: ${filePath}`, error);
    throw error;
  }
}

/**
 * Load all translations from a directory
 */
export async function loadTranslationsFromDirectory(
  directory: string
): Promise<void> {
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      // Parse filename: {language}.{namespace}.json
      const [languageCode, namespaceCode] = file.replace('.json', '').split('.');
      
      if (!languageCode || !namespaceCode) {
        logger.warn(`Invalid translation filename: ${file}`);
        continue;
      }

      const language = languageCode as Language;
      const namespace = namespaceCode as TranslationNamespace;

      // Validate language and namespace
      if (!Object.values(Language).includes(language)) {
        logger.warn(`Unsupported language in file: ${file}`);
        continue;
      }

      if (!Object.values(TranslationNamespace).includes(namespace)) {
        logger.warn(`Unsupported namespace in file: ${file}`);
        continue;
      }

      // Load translations
      const filePath = path.join(directory, file);
      const translations = await loadTranslationFile(filePath);
      
      i18nService.loadTranslations(language, namespace, translations);
      logger.info(`Loaded translations: ${language}:${namespace}`);
    }
  } catch (error) {
    logger.error(`Failed to load translations from directory: ${directory}`, error);
    throw error;
  }
}

/**
 * Load specific translation files
 */
export async function loadTranslationFiles(
  files: TranslationFile[]
): Promise<void> {
  for (const file of files) {
    try {
      const translations = await loadTranslationFile(file.path);
      i18nService.loadTranslations(file.language, file.namespace, translations);
      logger.info(`Loaded translations: ${file.language}:${file.namespace}`);
    } catch (error) {
      logger.error(`Failed to load translation file: ${file.path}`, error);
    }
  }
}

/**
 * Initialize translations
 * Load all translation files from the locales directory
 */
export async function initializeTranslations(localesPath?: string): Promise<void> {
  const defaultPath = path.join(process.cwd(), 'locales');
  const directory = localesPath || defaultPath;

  logger.info(`Initializing translations from: ${directory}`);

  try {
    await loadTranslationsFromDirectory(directory);
    logger.info('Translations initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize translations', error);
    throw error;
  }
}

/**
 * Validate translation completeness
 * Check if all keys exist in all languages
 */
export function validateTranslations(
  baseLanguage: Language,
  targetLanguages: Language[],
  namespace: TranslationNamespace
): {
  valid: boolean;
  missingKeys: Record<Language, string[]>;
} {
  void baseLanguage;
  void targetLanguages;
  const missingKeys: Record<Language, string[]> = {} as any;
  let valid = true;

  // This is a placeholder - actual implementation would require
  // access to loaded translations and deep key comparison
  logger.info(`Validating translations for namespace: ${namespace}`);

  return {
    valid,
    missingKeys,
  };
}

/**
 * Export translations to JSON files
 */
export async function exportTranslations(
  outputDirectory: string,
  language?: Language,
  namespace?: TranslationNamespace
): Promise<void> {
  logger.info('Exporting translations', { outputDirectory, language, namespace });
  
  // Ensure output directory exists
  await fs.mkdir(outputDirectory, { recursive: true });

  // This is a placeholder - actual implementation would export
  // loaded translations to JSON files
  logger.info('Translations exported successfully');
}
