import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  neighborhoodId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const signOptions: SignOptions = {
  expiresIn: config.jwt.expiry,
};

const refreshSignOptions: SignOptions = {
  expiresIn: config.jwt.refreshExpiry,
};

const verifyOptions: VerifyOptions = {};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, signOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, refreshSignOptions);
};

export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.secret, verifyOptions) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, verifyOptions) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload | null;
  } catch (error) {
    return null;
  }
};
