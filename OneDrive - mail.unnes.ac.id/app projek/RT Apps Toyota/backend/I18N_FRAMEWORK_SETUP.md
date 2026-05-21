# Phase 3.4: i18n Framework Setup

## Overview

The i18n (Internationalization) Framework provides comprehensive language support for RT Apps Toyota, supporting three languages: **Indonesian (id)**, **Thai (th)**, and **English (en)**. This framework enables dynamic language switching, translation management, and locale-aware formatting.

## Architecture

### Components

1. **i18n Types** ([`backend/shared/src/i18n/types.ts`](backend/shared/src/i18n/types.ts))
   - TypeScript interfaces for all i18n components
   - Language definitions, translation namespaces, configuration types

2. **i18n Service** ([`backend/shared/src/i18n/service.ts`](backend/shared/src/i18n/service.ts))
   - Core translation engine
   - Language detection and switching
   - Date/number formatting
   - Translation caching

3. **i18n Middleware** ([`backend/shared/src/i18n/middleware.ts`](backend/shared/src/i18n/middleware.ts))
   - Express middleware for language detection
   - Request/response language handling
   - Language switching endpoints

4. **Translation Loader** ([`backend/shared/src/i18n/loader.ts`](backend/shared/src/i18n/loader.ts))
   - Load translation files from JSON
   - Directory scanning and validation
   - Translation export utilities

5. **Translation Files** ([`backend/locales/`](backend/locales/))
   - JSON files for each language and namespace
   - Organized by language code and namespace

## Supported Languages

| Language | Code | Native Name | Direction | Date Format | Currency |
|----------|------|-------------|-----------|-------------|----------|
| Indonesian | `id` | Bahasa Indonesia | LTR | DD/MM/YYYY | IDR (Rp) |
| Thai | `th` | ภาษาไทย | LTR | DD/MM/YYYY | THB (฿) |
| English | `en` | English | LTR | MM/DD/YYYY | USD ($) |

## Translation Namespaces

| Namespace | Description | Example Keys |
|-----------|-------------|--------------|
| `common` | Common UI elements | `app.name`, `common.welcome`, `navigation.home` |
| `auth` | Authentication messages | `auth.login`, `auth.register`, `auth.forgotPassword` |
| `user` | User management | `user.profile`, `user.settings`, `user.roles` |
| `sos` | SOS alerts | `sos.alert`, `sos.emergency`, `sos.response` |
| `patrol` | Patrol management | `patrol.shift`, `patrol.schedule`, `patrol.report` |
| `marketplace` | Marketplace features | `marketplace.product`, `marketplace.order`, `marketplace.business` |
| `waste_bank` | Waste banking | `waste_bank.deposit`, `waste_bank.points`, `waste_bank.category` |
| `neighborhood` | Neighborhood management | `neighborhood.resident`, `neighborhood.household`, `neighborhood.facility` |
| `notifications` | System notifications | `notifications.alert`, `notifications.message`, `notifications.reminder` |
| `errors` | Error messages | `errors.validation`, `errors.auth`, `errors.server` |
| `validation` | Form validation | `validation.required`, `validation.email`, `validation.minLength` |

## Installation & Setup

### 1. Add i18n Middleware to API Gateway

Update [`backend/api-gateway/src/index.ts`](backend/api-gateway/src/index.ts) to include i18n middleware:

```typescript
import { i18nMiddleware } from '@rt-muban/shared/src/i18n/middleware';
import i18nRoutes from './routes/i18n.routes';

// Add i18n middleware (before routes)
this.app.use(i18nMiddleware());

// Add i18n routes
this.app.use(`${apiPrefix}/i18n`, i18nRoutes);
```

### 2. Initialize Translations

Add translation initialization to your server startup:

```typescript
import { initializeTranslations } from '@rt-muban/shared/src/i18n/loader';

async function startServer() {
  // Initialize translations
  await initializeTranslations();
  
  // Start server...
}
```

### 3. Create Translation Files

Translation files follow the pattern: `{language}.{namespace}.json`

Example: [`backend/locales/id.common.json`](backend/locales/id.common.json)

```json
{
  "app": {
    "name": "RT Apps Toyota",
    "tagline": "Aplikasi Manajemen RT Modern"
  },
  "common": {
    "welcome": "Selamat datang",
    "hello": "Halo"
  }
}
```

## Usage Examples

### 1. Using i18n in Controllers

```typescript
import { i18nService } from '@rt-muban/shared/src/i18n/service';
import { TranslationNamespace } from '@rt-muban/shared/src/i18n/types';

export const createAlert = async (req: Request, res: Response) => {
  // Get translation
  const alertMessage = i18nService.translate('sos.alert.created', {
    language: 'id',
    namespace: TranslationNamespace.SOS,
    interpolation: { alertNumber: 'ALERT-001' }
  });
  
  // Format date
  const formattedDate = i18nService.formatDateTime(new Date(), {
    language: 'id',
    format: 'medium',
    includeTime: true
  });
  
  // Format number
  const formattedPoints = i18nService.formatNumber(1500, {
    language: 'id',
    style: 'decimal'
  });
};
```

### 2. Using i18n Middleware in Routes

```typescript
import { i18nMiddleware, I18nRequest } from '@rt-muban/shared/src/i18n/middleware';

// Apply middleware to route
router.get('/dashboard', i18nMiddleware(), (req: Request, res: Response) => {
  const i18nReq = req as I18nRequest;
  
  // Use translation function from request
  const welcomeMessage = i18nReq.t('common.welcome');
  const formattedDate = i18nReq.formatDateTime(new Date());
  
  res.json({
    message: welcomeMessage,
    date: formattedDate,
    language: i18nReq.language
  });
});
```

### 3. Language Switching

```javascript
// Switch language via API
fetch('/api/i18n/switch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ language: 'th' })
});

// Get available languages
fetch('/api/i18n/languages')
  .then(res => res.json())
  .then(data => console.log(data));
```

## API Endpoints

### Language Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/i18n/languages` | Get list of supported languages |
| POST | `/api/i18n/switch` | Switch current language |
| GET | `/api/i18n/current` | Get current language metadata |
| GET | `/api/i18n/namespaces` | Get available translation namespaces |

### Translation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/i18n/translate/{namespace}/{key}` | Translate specific key |
| POST | `/api/i18n/format/date` | Format date according to language |
| POST | `/api/i18n/format/number` | Format number according to language |

## Language Detection Priority

The framework detects language in the following order:

1. **Query Parameter** (`?lang=id`) - Highest priority
2. **Cookie** (`language=th`) - User preference
3. **Accept-Language Header** - Browser setting
4. **Default Language** (`id`) - Fallback

## Translation File Structure

```
backend/locales/
├── id.common.json          # Indonesian common translations
├── id.auth.json           # Indonesian authentication
├── id.sos.json            # Indonesian SOS alerts
├── th.common.json         # Thai common translations
├── th.auth.json          # Thai authentication
├── en.common.json         # English common translations
└── en.auth.json          # English authentication
```

## Best Practices

### 1. Use Namespace Organization
- Group related translations by feature/module
- Keep common UI elements in `common` namespace
- Separate business logic translations by service

### 2. Implement Fallback Strategy
- Always provide fallback translations
- Use English as ultimate fallback language
- Log missing translations for monitoring

### 3. Cache Translations
- Enable translation caching for performance
- Clear cache when translations are updated
- Use CDN for static translation files in production

### 4. Handle Pluralization
```json
{
  "item": {
    "item_one": "1 item",
    "item_other": "{{count}} items"
  }
}
```

### 5. Use Interpolation
```json
{
  "welcome": "Welcome, {{name}}!",
  "points": "You have {{points}} points"
}
```

## Integration with Frontend

### React Example

```typescript
import { useState, useEffect } from 'react';
import { i18nService } from '@rt-muban/shared/src/i18n';

function Dashboard() {
  const [language, setLanguage] = useState('id');
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    // Load translations
    i18nService.loadTranslations(language, 'common', translations);
  }, [language]);

  const switchLanguage = (lang: string) => {
    setLanguage(lang);
    // Update cookie
    document.cookie = `language=${lang}; path=/; max-age=31536000`;
  };

  return (
    <div>
      <h1>{i18nService.translate('app.name', { language })}</h1>
      <button onClick={() => switchLanguage('id')}>ID</button>
      <button onClick={() => switchLanguage('th')}>TH</button>
      <button onClick={() => switchLanguage('en')}>EN</button>
    </div>
  );
}
```

## Testing

### Unit Tests

```typescript
import { i18nService } from './service';
import { Language } from './types';

describe('i18nService', () => {
  beforeEach(() => {
    i18nService.clearCache();
  });

  test('should translate key', () => {
    const translation = i18nService.translate('common.welcome', {
      language: Language.INDONESIAN
    });
    expect(translation).toBe('Selamat datang');
  });

  test('should fallback to default language', () => {
    const translation = i18nService.translate('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
  });
});
```

## Performance Considerations

1. **Caching**: Translation results are cached by default
2. **Lazy Loading**: Load translations only when needed
3. **CDN**: Serve static translation files via CDN
4. **Compression**: Use gzip for JSON translation files
5. **Tree Shaking**: Import only needed namespaces

## Deployment

### Environment Variables

```bash
# i18n Configuration
I18N_DEFAULT_LANGUAGE=id
I18N_SUPPORTED_LANGUAGES=id,th,en
I18N_FALLBACK_LANGUAGE=en
I18N_CACHE_ENABLED=true
I18N_CACHE_TTL=3600
```

### Docker Configuration

```dockerfile
# Copy translation files
COPY backend/locales /app/locales

# Set language environment
ENV LANG=id_ID.UTF-8
ENV LC_ALL=id_ID.UTF-8
```

## Monitoring & Maintenance

### Health Checks

```typescript
// Check translation availability
const health = await i18nService.healthCheck();

// Monitor missing translations
const missing = await i18nService.getMissingTranslations();
```

### Logging

```typescript
// Log language detection
logger.info('Language detected', { language, source });

// Log missing translations
logger.warn('Translation missing', { key, namespace, language });
```

## Next Steps

1. **Phase 3.5**: Complete translation files for all namespaces
2. **Frontend Integration**: Add i18n to React components
3. **Database Localization**: Store multilingual content in database
4. **Admin Interface**: Translation management UI
5. **Automated Testing**: i18n test coverage

## Conclusion

The i18n Framework provides a robust foundation for multilingual support in RT Apps Toyota. With support for Indonesian, Thai, and English, the system can serve diverse communities while maintaining consistent user experience across languages.

The framework is designed to be:
- **Extensible**: Easy to add new languages
- **Performant**: Caching and lazy loading
- **Maintainable**: Organized namespace structure
- **Developer-friendly**: TypeScript support and clear APIs
