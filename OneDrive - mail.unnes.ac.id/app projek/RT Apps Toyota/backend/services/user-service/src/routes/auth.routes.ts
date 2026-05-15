import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { loginSchema, registerSchema, refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke tokens
 * @access  Private
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email
 * @access  Public
 */
router.post('/verify-email', authController.verifyEmail);

export default router;
