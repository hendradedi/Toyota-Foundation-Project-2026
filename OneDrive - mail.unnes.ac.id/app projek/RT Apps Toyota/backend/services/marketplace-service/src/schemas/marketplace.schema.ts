import { z } from 'zod';

/**
 * Business Registration Schema
 */
export const businessRegistrationSchema = z.object({
  name: z.string().min(3, 'Business name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  category: z.enum([
    'food_beverage',
    'grocery',
    'services',
    'handicraft',
    'agriculture',
    'other'
  ]),
  owner_id: z.number().int().positive(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number'),
  address: z.string().min(10).max(200),
  operating_hours: z.string().optional(),
  delivery_available: z.boolean().default(false),
  pickup_available: z.boolean().default(true),
});

/**
 * Business Update Schema
 */
export const businessUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  category: z.enum([
    'food_beverage',
    'grocery',
    'services',
    'handicraft',
    'agriculture',
    'other'
  ]).optional(),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/).optional(),
  address: z.string().min(10).max(200).optional(),
  operating_hours: z.string().optional(),
  delivery_available: z.boolean().optional(),
  pickup_available: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Product Creation Schema
 */
export const productCreationSchema = z.object({
  business_id: z.number().int().positive(),
  name: z.string().min(3, 'Product name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  category: z.string().min(2).max(50),
  price: z.number().positive('Price must be positive'),
  unit: z.string().min(1).max(20), // e.g., 'kg', 'pcs', 'liter'
  stock_quantity: z.number().int().nonnegative('Stock cannot be negative'),
  min_order: z.number().int().positive().default(1),
  max_order: z.number().int().positive().optional(),
  image_url: z.string().url().optional(),
  is_available: z.boolean().default(true),
});

/**
 * Product Update Schema
 */
export const productUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  category: z.string().min(2).max(50).optional(),
  price: z.number().positive().optional(),
  unit: z.string().min(1).max(20).optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  min_order: z.number().int().positive().optional(),
  max_order: z.number().int().positive().optional(),
  image_url: z.string().url().optional(),
  is_available: z.boolean().optional(),
});

/**
 * Business Query Schema
 */
export const businessQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  category: z.enum([
    'food_beverage',
    'grocery',
    'services',
    'handicraft',
    'agriculture',
    'other'
  ]).optional(),
  is_active: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  search: z.string().optional(),
  delivery_available: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

/**
 * Product Query Schema
 */
export const productQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  business_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  category: z.string().optional(),
  is_available: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  search: z.string().optional(),
  min_price: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  max_price: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  sort_by: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest']).default('newest'),
});

/**
 * Business Status Update Schema
 */
export const businessStatusSchema = z.object({
  is_active: z.boolean(),
  reason: z.string().min(10).max(200).optional(),
});

/**
 * Product Stock Update Schema
 */
export const productStockSchema = z.object({
  stock_quantity: z.number().int().nonnegative(),
  reason: z.string().min(5).max(200).optional(),
});

// Export types
export type BusinessRegistrationInput = z.infer<typeof businessRegistrationSchema>;
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;
export type ProductCreationInput = z.infer<typeof productCreationSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type BusinessQueryInput = z.infer<typeof businessQuerySchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type BusinessStatusInput = z.infer<typeof businessStatusSchema>;
export type ProductStockInput = z.infer<typeof productStockSchema>;
