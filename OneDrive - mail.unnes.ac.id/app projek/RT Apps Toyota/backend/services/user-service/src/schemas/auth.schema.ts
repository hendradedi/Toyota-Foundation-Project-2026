import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from '@rt-muban/shared/src/utils/validation';

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().optional(),
    phone: phoneSchema.optional(),
    languagePreference: z.enum(['id', 'th', 'en']).default('id'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().optional(),
    phone: phoneSchema.optional(),
    languagePreference: z.enum(['id', 'th', 'en']).optional(),
    timezone: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export type RegisterRequest = z.infer<typeof registerSchema>['body'];
export type LoginRequest = z.infer<typeof loginSchema>['body'];
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>['body'];
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>['body'];
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>['body'];
