import { z } from 'zod';

/**
 * Shift Creation Schema
 */
export const shiftCreationSchema = z.object({
  user_id: z.number().int().positive('User ID must be positive'),
  neighborhood_id: z.number().int().positive('Neighborhood ID must be positive'),
  shift_type: z.enum(['morning', 'afternoon', 'night', 'full_day']),
  start_time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'Invalid datetime format (YYYY-MM-DD HH:MM:SS)'),
  end_time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'Invalid datetime format (YYYY-MM-DD HH:MM:SS)'),
  notes: z.string().max(200).optional(),
});

/**
 * Shift Update Schema
 */
export const shiftUpdateSchema = z.object({
  user_id: z.number().int().positive().optional(),
  neighborhood_id: z.number().int().positive().optional(),
  shift_type: z.enum(['morning', 'afternoon', 'night', 'full_day']).optional(),
  start_time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().max(200).optional(),
});

/**
 * Shift Query Schema
 */
export const shiftQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  user_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  neighborhood_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  shift_type: z.enum(['morning', 'afternoon', 'night', 'full_day']).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_by: z.enum(['date_asc', 'date_desc', 'user_asc', 'user_desc']).default('date_asc'),
});

/**
 * Shift Status Update Schema
 */
export const shiftStatusSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled']),
  notes: z.string().max(200).optional(),
});

/**
 * Patrol Check-in Schema
 */
export const patrolCheckinSchema = z.object({
  shift_id: z.number().int().positive('Shift ID must be positive'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(10).max(200).optional(),
  }),
  notes: z.string().max(200).optional(),
  photos: z.array(z.string().url()).optional(),
});

/**
 * Patrol Report Schema
 */
export const patrolReportSchema = z.object({
  shift_id: z.number().int().positive('Shift ID must be positive'),
  incidents: z.array(z.object({
    type: z.enum(['suspicious', 'accident', 'damage', 'noise', 'other']),
    description: z.string().min(10).max(500),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      address: z.string().min(10).max(200).optional(),
    }),
    severity: z.enum(['low', 'medium', 'high']).default('low'),
    action_taken: z.string().max(200).optional(),
  })).optional(),
  observations: z.string().max(1000).optional(),
  recommendations: z.string().max(500).optional(),
  completed_at: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/).optional(),
});

// Export types
export type ShiftCreationInput = z.infer<typeof shiftCreationSchema>;
export type ShiftUpdateInput = z.infer<typeof shiftUpdateSchema>;
export type ShiftQueryInput = z.infer<typeof shiftQuerySchema>;
export type ShiftStatusInput = z.infer<typeof shiftStatusSchema>;
export type PatrolCheckinInput = z.infer<typeof patrolCheckinSchema>;
export type PatrolReportInput = z.infer<typeof patrolReportSchema>;
