/**
 * i18n Routes
 * Endpoints for language management and translation
 */

import { Router, Request, Response } from 'express';
import {
  i18nMiddleware,
  languageSwitcher,
  getLanguages,
  I18nRequest,
} from '@rt-muban/shared/src/i18n/middleware';
import { i18nService } from '@rt-muban/shared/src/i18n/service';
import { Language, TranslationNamespace } from '@rt-muban/shared/src/i18n/types';
import logger from '@rt-muban/shared/src/utils/logger';

const router = Router();

/**
 * GET /api/i18n/languages
 * Get list of supported languages
 */
router.get('/languages', getLanguages);

/**
 * POST /api/i18n/switch
 * Switch language
 */
router.post('/switch', languageSwitcher());

/**
 * GET /api/i18n/current
 * Get current language and metadata
 */
router.get('/current', (req: Request, res: Response) => {
  const i18nReq = req as I18nRequest;
  const language = i18nReq.language;
  const metadata = i18nService.getLanguageMetadata(language);

  return res.json({
    success: true,
    data: {
      language,
      metadata,
    },
  });
});

/**
 * GET /api/i18n/translate/:namespace/:key
 * Translate a specific key
 */
router.get('/translate/:namespace/:key', (req: Request, res: Response) => {
  const i18nReq = req as I18nRequest;
  const { namespace, key } = req.params;
  const { count } = req.query;

  // Validate namespace
  if (!Object.values(TranslationNamespace).includes(namespace as TranslationNamespace)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid namespace',
      data: {
        supportedNamespaces: Object.values(TranslationNamespace),
      },
    });
  }

  try {
    const translation = i18nService.translate(key, {
      language: i18nReq.language,
      namespace: namespace as TranslationNamespace,
      count: count ? parseInt(count as string) : undefined,
    });

    return res.json({
      success: true,
      data: {
        key,
        namespace,
        language: i18nReq.language,
        translation,
      },
    });
  } catch (error) {
    logger.error('Translation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to translate',
      error: {
        code: 'TRANSLATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/i18n/format/date
 * Format date according to language
 */
router.post('/format/date', (req: Request, res: Response) => {
  const i18nReq = req as I18nRequest;
  const { date, format, includeTime } = req.body;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required',
    });
  }

  try {
    const dateObj = new Date(date);
    const formatted = i18nService.formatDateTime(dateObj, {
      language: i18nReq.language,
      format: format || 'medium',
      includeTime: includeTime || false,
    });

    return res.json({
      success: true,
      data: {
        original: date,
        formatted,
        language: i18nReq.language,
      },
    });
  } catch (error) {
    logger.error('Date formatting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to format date',
      error: {
        code: 'DATE_FORMAT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/i18n/format/number
 * Format number according to language
 */
router.post('/format/number', (req: Request, res: Response) => {
  const i18nReq = req as I18nRequest;
  const { value, style, currency, minimumFractionDigits, maximumFractionDigits } = req.body;

  if (value === undefined || value === null) {
    return res.status(400).json({
      success: false,
      message: 'Value is required',
    });
  }

  try {
    const formatted = i18nService.formatNumber(value, {
      language: i18nReq.language,
      style: style || 'decimal',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    return res.json({
      success: true,
      data: {
        original: value,
        formatted,
        language: i18nReq.language,
      },
    });
  } catch (error) {
    logger.error('Number formatting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to format number',
      error: {
        code: 'NUMBER_FORMAT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/i18n/namespaces
 * Get list of available translation namespaces
 */
router.get('/namespaces', (_req: Request, res: Response) => {
  const namespaces = Object.values(TranslationNamespace).map((ns) => ({
    code: ns,
    name: ns.replace(/_/g, ' ').toUpperCase(),
  }));

  return res.json({
    success: true,
    data: namespaces,
  });
});

export default router;
