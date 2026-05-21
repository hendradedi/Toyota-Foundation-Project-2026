import { Router, Request, Response, NextFunction } from 'express';
import neighborhoodController from '../controllers/neighborhood.controller';

const router = Router();

/**
 * @route   GET /api/neighborhoods/by-code/:code
 * @desc    Get neighborhood info by registration code (public)
 * @access  Public
 */
router.get('/by-code/:code', (req: Request, res: Response, next: NextFunction) =>
  neighborhoodController.getNeighborhoodByCode(req, res).catch(next)
);

/**
 * @route   GET /api/neighborhoods/:id/registration-code
 * @desc    Get registration code for a neighborhood
 * @access  Private - Admin/RT Leader (enforced by gateway)
 */
router.get('/:id/registration-code', (req: Request, res: Response, next: NextFunction) =>
  neighborhoodController.getRegistrationCode(req, res).catch(next)
);

/**
 * @route   POST /api/neighborhoods/:id/generate-code
 * @desc    Generate registration code for neighborhood
 * @access  Private - Admin/RT Leader (enforced by gateway)
 */
router.post('/:id/generate-code', (req: Request, res: Response, next: NextFunction) =>
  neighborhoodController.generateRegistrationCode(req, res).catch(next)
);

/**
 * @route   GET /api/neighborhoods/:id/user-count
 * @desc    Get user count for neighborhood
 * @access  Private - Admin/RT Leader (enforced by gateway)
 */
router.get('/:id/user-count', (req: Request, res: Response, next: NextFunction) =>
  neighborhoodController.getUserCount(req, res).catch(next)
);

export default router;
