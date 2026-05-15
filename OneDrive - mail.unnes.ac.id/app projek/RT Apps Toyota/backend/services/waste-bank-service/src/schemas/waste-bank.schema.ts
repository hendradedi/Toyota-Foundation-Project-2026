import { z } from 'zod';
import { uuidSchema } from '@rt-muban/shared/src/utils/validation';

export const createDepositSchema = z.object({
  body: z.object({
    wasteCategoryId: uuidSchema,
    quantity: z.number().positive('Quantity must be a positive number'),
    collectionDate: z.string().datetime('Invalid collection date format'),
    notes: z.string().max(500).optional(),
  }),
});

export const updateDepositSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'scheduled', 'collected', 'completed', 'cancelled']),
    collectedBy: uuidSchema.optional(),
    collectedAt: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().max(500).optional(),
    unitOfMeasurement: z.string().min(1, 'Unit of measurement is required'),
    pointsPerUnit: z.number().positive('Points per unit must be positive'),
  }),
});

export const createCollectionScheduleSchema = z.object({
  body: z.object({
    neighborhoodId: uuidSchema,
    scheduledDate: z.string().datetime('Invalid scheduled date format'),
    collectorId: uuidSchema.optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const redeemPointsSchema = z.object({
  body: z.object({
    userId: uuidSchema,
    points: z.number().positive('Points must be positive'),
    description: z.string().max(500).optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
  }),
});

export const transferPointsSchema = z.object({
  body: z.object({
    fromUserId: uuidSchema,
    toUserId: uuidSchema,
    points: z.number().positive('Points must be positive'),
    description: z.string().max(500).optional(),
  }),
});

export type CreateDepositRequest = z.infer<typeof createDepositSchema>['body'];
export type UpdateDepositRequest = z.infer<typeof updateDepositSchema>['body'];
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>['body'];
export type CreateCollectionScheduleRequest = z.infer<typeof createCollectionScheduleSchema>['body'];
export type RedeemPointsRequest = z.infer<typeof redeemPointsSchema>['body'];
export type TransferPointsRequest = z.infer<typeof transferPointsSchema>['body'];
