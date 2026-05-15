import { z } from 'zod';

/**
 * Order Item Schema
 */
export const orderItemSchema = z.object({
  product_id: z.number().int().positive('Product ID must be positive'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive'),
});

/**
 * Order Creation Schema
 */
export const orderCreationSchema = z.object({
  user_id: z.number().int().positive('User ID must be positive'),
  business_id: z.number().int().positive('Business ID must be positive'),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  delivery_method: z.enum(['delivery', 'pickup']).default('delivery'),
  delivery_address: z.string().min(10, 'Delivery address is required').max(200).optional(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number').optional(),
  notes: z.string().max(200).optional(),
  payment_method: z.enum(['cod', 'bank_transfer', 'e_wallet']).default('cod'),
});

/**
 * Order Status Update Schema
 */
export const orderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'ready',
    'completed',
    'cancelled',
    'refunded'
  ]),
  notes: z.string().max(200).optional(),
});

/**
 * Order Query Schema
 */
export const orderQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  user_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  business_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'ready',
    'completed',
    'cancelled',
    'refunded'
  ]).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_by: z.enum(['date_asc', 'date_desc', 'total_asc', 'total_desc']).default('date_desc'),
});

/**
 * Order Update Schema
 */
export const orderUpdateSchema = z.object({
  delivery_address: z.string().min(10).max(200).optional(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/).optional(),
  notes: z.string().max(200).optional(),
  delivery_method: z.enum(['delivery', 'pickup']).optional(),
});

// Export types
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderCreationInput = z.infer<typeof orderCreationSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
