/**
 * i18n Middleware
 * Express middleware for language detection and translation injection
 */

import { Request, Response, NextFunction } from 'express';
import { i18nService } from './service';
import { Language, TranslationOptions } from './types';
import logger from '../utils/logger';

/**
 * Extended Request with i18n support
 */
export interface I18nRequest extends Request {
  language: Language;
  t: (key: string, options?: Omit<TranslationOptions, 'language'>) => string;
  formatDateTime: (date: Date, options?: any) => string;
  formatNumber: (value: number, options?: any) => string;
}

/**
 * i18n middleware options
 */
export interface I18nMiddlewareOptions {
  cookieName?: string;
  queryParam?: string;
  headerName?: string;
}

/**
 * Create i18n middleware
 */
export const i18nMiddleware = (options: I18nMiddlewareOptions = {}) => {
  const {
    cookieName = 'language',
    queryParam = 'lang',
    headerName = 'accept-language',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const i18nReq = req as I18nRequest;

    // Detect language from multiple sources (priority order)
    let detectedLanguage: Language | null = null;

    // 1. Query parameter (highest priority)
    if (req.query[queryParam]) {
      const queryLang = String(req.query[queryParam]);
      if (i18nService.isLanguageSupported(queryLang)) {
        detectedLanguage = queryLang as Language;
        logger.debug(`Language detected from query: ${detectedLanguage}`);
      }
    }

    // 2. Cookie
    if (!detectedLanguage && req.cookies && req.cookies[cookieName]) {
      const cookieLang = req.cookies[cookieName];
      if (i18nService.isLanguageSupported(cookieLang)) {
        detectedLanguage = cookieLang as Language;
        logger.debug(`Language detected from cookie: ${detectedLanguage}`);
      }
    }

    // 3. Accept-Language header
    if (!detectedLanguage) {
      const acceptLanguage = req.headers[headerName] as string | undefined;
      const detection = i18nService.detectLanguage(acceptLanguage);
      detectedLanguage = detection.language;
      logger.debug(`Language detected from header: ${detectedLanguage} (confidence: ${detection.confidence})`);
    }

    // Set language on request
    i18nReq.language = detectedLanguage;

    // Add translation function to request
    i18nReq.t = (key: string, options?: Omit<TranslationOptions, 'language'>) => {
      return i18nService.translate(key, {
        ...options,
        language: i18nReq.language,
      });
    };

    // Add date formatting function
    i18nReq.formatDateTime = (date: Date, options: any = {}) => {
      return i18nService.formatDateTime(date, {
        ...options,
        language: i18nReq.language,
      });
    };

    // Add number formatting function
    i18nReq.formatNumber = (value: number, options: any = {}) => {
      return i18nService.formatNumber(value, {
        ...options,
        language: i18nReq.language,
      });
    };

    // Set language cookie if not present
    if (!req.cookies || !req.cookies[cookieName]) {
      res.cookie(cookieName, detectedLanguage, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    // Set Content-Language header
    res.setHeader('Content-Language', detectedLanguage);

    next();
  };
};

/**
 * Language switcher middleware
 * Handles language switching requests
 */
export const languageSwitcher = (options: I18nMiddlewareOptions = {}) => {
  const { cookieName = 'language' } = options;

  return (req: Request, res: Response) => {
    const { language } = req.body;

    if (!language || !i18nService.isLanguageSupported(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unsupported language',
        data: {
          supportedLanguages: i18nService.getSupportedLanguages(),
        },
      });
    }

    // Set language cookie
    res.cookie(cookieName, language, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax',
    });

    logger.info(`Language switched to: ${language}`);

    return res.json({
      success: true,
      message: 'Language updated successfully',
      data: {
        language,
        metadata: i18nService.getLanguageMetadata(language as Language),
      },
    });
  };
};

/**
 * Get available languages endpoint
 */
export const getLanguages = (_req: Request, res: Response) => {
  const languages = i18nService.getSupportedLanguages().map((lang) => {
    const metadata = i18nService.getLanguageMetadata(lang);
    return {
      ...metadata,
    };
  });

  return res.json({
    success: true,
    data: languages,
  });
};
