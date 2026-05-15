import { Router } from 'express';
import { validate, validateQuery } from '../middleware/validation.middleware';
import {
  orderCreationSchema,
  orderStatusSchema,
  orderQuerySchema,
  orderUpdateSchema,
} from '../schemas/order.schema';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  getOrderStats,
} from '../controllers/order.controller';

const router = Router();

/**
 * @route   POST /api/marketplace/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', validate(orderCreationSchema), createOrder);

/**
 * @route   GET /api/marketplace/orders
 * @desc    Get orders with pagination and filtering
 * @access  Private
 */
router.get('/', validateQuery(orderQuerySchema), getOrders);

/**
 * @route   GET /api/marketplace/orders/stats
 * @desc    Get order statistics
 * @access  Private
 */
router.get('/stats', getOrderStats);

/**
 * @route   GET /api/marketplace/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', getOrderById);

/**
 * @route   PUT /api/marketplace/orders/:id
 * @desc    Update order information (pending orders only)
 * @access  Private
 */
router.put('/:id', validate(orderUpdateSchema), updateOrder);

/**
 * @route   PATCH /api/marketplace/orders/:id/status
 * @desc    Update order status
 * @access  Private
 */
router.patch('/:id/status', validate(orderStatusSchema), updateOrderStatus);

/**
 * @route   POST /api/marketplace/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.post('/:id/cancel', cancelOrder);

export default router;
