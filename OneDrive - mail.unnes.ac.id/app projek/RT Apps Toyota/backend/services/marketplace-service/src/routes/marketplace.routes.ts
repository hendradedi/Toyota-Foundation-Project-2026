import { Router } from 'express';
import { validate, validateQuery } from '../middleware/validation.middleware';
import {
  businessRegistrationSchema,
  businessUpdateSchema,
  businessQuerySchema,
  businessStatusSchema,
  productCreationSchema,
  productUpdateSchema,
  productQuerySchema,
  productStockSchema,
} from '../schemas/marketplace.schema';
import {
  registerBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  updateBusinessStatus,
  getBusinessStats,
} from '../controllers/business.controller';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getProductsByBusiness,
} from '../controllers/product.controller';

const router = Router();

// ============================================
// BUSINESS ENDPOINTS
// ============================================

/**
 * @route   POST /api/marketplace/businesses
 * @desc    Register a new business
 * @access  Private
 */
router.post('/businesses', validate(businessRegistrationSchema), registerBusiness);

/**
 * @route   GET /api/marketplace/businesses
 * @desc    Get all businesses with pagination and filtering
 * @access  Public
 */
router.get('/businesses', validateQuery(businessQuerySchema), getBusinesses);

/**
 * @route   GET /api/marketplace/businesses/:id
 * @desc    Get business by ID
 * @access  Public
 */
router.get('/businesses/:id', getBusinessById);

/**
 * @route   PUT /api/marketplace/businesses/:id
 * @desc    Update business information
 * @access  Private
 */
router.put('/businesses/:id', validate(businessUpdateSchema), updateBusiness);

/**
 * @route   PATCH /api/marketplace/businesses/:id/status
 * @desc    Update business status (activate/deactivate)
 * @access  Private
 */
router.patch('/businesses/:id/status', validate(businessStatusSchema), updateBusinessStatus);

/**
 * @route   GET /api/marketplace/businesses/:id/stats
 * @desc    Get business statistics
 * @access  Private
 */
router.get('/businesses/:id/stats', getBusinessStats);

// ============================================
// PRODUCT ENDPOINTS
// ============================================

/**
 * @route   POST /api/marketplace/products
 * @desc    Create a new product
 * @access  Private
 */
router.post('/products', validate(productCreationSchema), createProduct);

/**
 * @route   GET /api/marketplace/products
 * @desc    Get all products with pagination and filtering
 * @access  Public
 */
router.get('/products', validateQuery(productQuerySchema), getProducts);

/**
 * @route   GET /api/marketplace/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/products/:id', getProductById);

/**
 * @route   PUT /api/marketplace/products/:id
 * @desc    Update product information
 * @access  Private
 */
router.put('/products/:id', validate(productUpdateSchema), updateProduct);

/**
 * @route   PATCH /api/marketplace/products/:id/stock
 * @desc    Update product stock
 * @access  Private
 */
router.patch('/products/:id/stock', validate(productStockSchema), updateProductStock);

/**
 * @route   DELETE /api/marketplace/products/:id
 * @desc    Delete product
 * @access  Private
 */
router.delete('/products/:id', deleteProduct);

/**
 * @route   GET /api/marketplace/businesses/:businessId/products
 * @desc    Get products by business
 * @access  Public
 */
router.get('/businesses/:businessId/products', getProductsByBusiness);

export default router;
