import { z } from 'zod';

/**
 * SOS Alert Creation Schema
 */
export const sosAlertSchema = z.object({
  user_id: z.number().int().positive('User ID must be positive'),
  alert_type: z.enum(['emergency', 'accident', 'theft', 'medical', 'fire', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(10).max(200).optional(),
  }),
  contact_phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number').optional(),
  is_verified: z.boolean().default(false),
});

/**
 * SOS Alert Update Schema
 */
export const sosAlertUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'responding', 'resolved', 'cancelled']).optional(),
  description: z.string().min(10).max(500).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(10).max(200),
  }).optional(),
  contact_phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/).optional(),
  is_verified: z.boolean().optional(),
});

/**
 * SOS Alert Query Schema
 */
export const sosAlertQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.enum(['pending', 'confirmed', 'responding', 'resolved', 'cancelled']).optional(),
  alert_type: z.enum(['emergency', 'accident', 'theft', 'medical', 'fire', 'other']).optional(),
  user_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_by: z.enum(['date_asc', 'date_desc']).default('date_desc'),
});

/**
 * SOS Alert Response Schema
 */
export const sosAlertResponseSchema = z.object({
  status: z.enum(['confirmed', 'responding', 'resolved', 'cancelled']),
  notes: z.string().max(500).optional(),
  responder_id: z.number().int().positive().optional(),
});

/**
 * SOS Broadcast Schema
 */
export const sosBroadcastSchema = z.object({
  alert_id: z.number().int().positive(),
  message: z.string().min(10).max(1000),
  recipients: z.array(z.number().int().positive()).optional(), // If empty, broadcast to all nearby residents
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

// Export types
export type SOSAlertInput = z.infer<typeof sosAlertSchema>;
export type SOSAlertUpdateInput = z.infer<typeof sosAlertUpdateSchema>;
export type SOSAlertQueryInput = z.infer<typeof sosAlertQuerySchema>;
export type SOSAlertResponseInput = z.infer<typeof sosAlertResponseSchema>;
export type SOSBroadcastInput = z.infer<typeof sosBroadcastSchema>;
