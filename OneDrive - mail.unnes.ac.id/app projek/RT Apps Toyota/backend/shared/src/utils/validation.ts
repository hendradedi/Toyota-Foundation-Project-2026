import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Phone validation (supports Indonesian and Thai formats)
export const phoneSchema = z
  .string()
  .regex(
    /^(\+62|62|0)[0-9]{9,12}$|^(\+66|66|0)[0-9]{8,9}$/,
    'Invalid phone number format'
  );

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Date validation
export const dateSchema = z.string().datetime('Invalid date format');

// Coordinate validation
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Language validation
export const languageSchema = z.enum(['id', 'th', 'en']);

// Neighborhood type validation
export const neighborhoodTypeSchema = z.enum(['RT', 'Muban']);

// Helper function to validate data against schema
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Helper function to safely validate data
export const safeValidate = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

// Format validation errors for API response
export const formatValidationErrors = (error: z.ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
};
