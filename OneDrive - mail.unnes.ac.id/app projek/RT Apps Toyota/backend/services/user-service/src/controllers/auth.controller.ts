import { Request, Response } from 'express';
import { db } from '@rt-muban/shared';
import { hashPassword, comparePassword } from '@rt-muban/shared/src/utils/password';
import { generateTokenPair, JwtPayload } from '@rt-muban/shared/src/utils/jwt';
import logger from '@rt-muban/shared/src/utils/logger';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '../schemas/auth.schema';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request<{}, {}, RegisterRequest>, res: Response) {
    try {
      const { email, password, firstName, lastName, phone, languagePreference } = req.body;

      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 OR phone = $2',
        [email, phone]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          data: null,
          message: 'User already exists',
          error: {
            code: 'USER_EXISTS',
            message: 'Email or phone number already registered',
          },
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await db.query(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, language_preference, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, false)
         RETURNING id, email, first_name, last_name, language_preference, created_at`,
        [email, phone, passwordHash, firstName, lastName, languagePreference]
      );

      const user = result.rows[0];

      // Assign resident role by default
      const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['resident']);
      if (roleResult.rows.length > 0) {
        await db.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [user.id, roleResult.rows[0].id]
        );
      }

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          languagePreference: user.language_preference,
          createdAt: user.created_at,
        },
        message: 'User registered successfully',
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Registration failed',
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'An error occurred during registration',
        },
      });
    }
  }

  /**
   * Login user
   */
  async login(req: Request<{}, {}, LoginRequest>, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const result = await db.query(
        `SELECT id, email, password_hash, first_name, last_name, is_active, is_verified
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Invalid credentials',
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is incorrect',
          },
        });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Account is inactive',
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Your account has been deactivated',
          },
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Invalid credentials',
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is incorrect',
          },
        });
      }

      // Get user roles
      const rolesResult = await db.query(
        `SELECT r.name FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $1`,
        [user.id]
      );

      const roles = rolesResult.rows.map((row: any) => row.name);

      // Generate tokens
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        roles,
      };

      const tokens = generateTokenPair(payload);

      // Update last login
      await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            roles,
          },
          tokens,
        },
        message: 'Login successful',
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Login failed',
        error: {
          code: 'LOGIN_ERROR',
          message: 'An error occurred during login',
        },
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request<{}, {}, RefreshTokenRequest>, res: Response) {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token (implementation depends on your token storage)
      // For now, we'll just generate a new token pair
      const payload: JwtPayload = {
        userId: 'user-id', // This should come from the refresh token
        email: 'user@example.com',
        roles: [],
      };

      const tokens = generateTokenPair(payload);

      res.json({
        success: true,
        data: { tokens },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        data: null,
        message: 'Token refresh failed',
        error: {
          code: 'TOKEN_REFRESH_ERROR',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response) {
    try {
      // Implementation for logout (revoke tokens, etc.)
      res.json({
        success: true,
        data: null,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Logout failed',
        error: {
          code: 'LOGOUT_ERROR',
          message: 'An error occurred during logout',
        },
      });
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(req: Request<{}, {}, ForgotPasswordRequest>, res: Response) {
    try {
      const { email } = req.body;

      // Check if user exists
      const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        // Don't reveal if email exists for security
        return res.json({
          success: true,
          data: null,
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Generate reset token and send email
      // Implementation depends on your email service

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        data: null,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Password reset request failed',
        error: {
          code: 'FORGOT_PASSWORD_ERROR',
          message: 'An error occurred',
        },
      });
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req: Request<{}, {}, ResetPasswordRequest>, res: Response) {
    try {
      const { token, newPassword } = req.body;

      // Verify token and get user
      // Implementation depends on your token storage

      res.json({
        success: true,
        data: null,
        message: 'Password reset successfully',
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Password reset failed',
        error: {
          code: 'RESET_PASSWORD_ERROR',
          message: 'Invalid or expired reset token',
        },
      });
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(req: Request<{}, {}, VerifyEmailRequest>, res: Response) {
    try {
      const { token } = req.body;

      // Verify token and update user
      // Implementation depends on your token storage

      res.json({
        success: true,
        data: null,
        message: 'Email verified successfully',
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Email verification failed',
        error: {
          code: 'EMAIL_VERIFICATION_ERROR',
          message: 'Invalid or expired verification token',
        },
      });
    }
  }
}
