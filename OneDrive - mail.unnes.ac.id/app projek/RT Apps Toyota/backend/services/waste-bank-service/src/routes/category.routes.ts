import { Router } from 'express';
import { WasteCategoryController } from '../controllers/waste-category.controller';

const router = Router();
const categoryController = new WasteCategoryController();

/**
 * @route   GET /api/waste-bank/categories
 * @desc    Get all active waste categories
 * @access  Public
 */
router.get('/', categoryController.getAll);

/**
 * @route   GET /api/waste-bank/categories/:id
 * @desc    Get waste category by ID
 * @access  Public
 */
router.get('/:id', categoryController.getById);

/**
 * @route   POST /api/waste-bank/categories
 * @desc    Create a new waste category
 * @access  Private (Admin only)
 */
router.post('/', categoryController.create);

/**
 * @route   PUT /api/waste-bank/categories/:id
 * @desc    Update waste category
 * @access  Private (Admin only)
 */
router.put('/:id', categoryController.update);

/**
 * @route   DELETE /api/waste-bank/categories/:id
 * @desc    Delete waste category (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', categoryController.delete);

export default router;
