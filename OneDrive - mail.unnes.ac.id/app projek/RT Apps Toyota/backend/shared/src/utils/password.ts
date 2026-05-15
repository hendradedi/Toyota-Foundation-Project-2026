import bcrypt from 'bcrypt';
import { config } from '../config';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(config.auth.bcryptRounds);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const validatePasswordStrength = (password: string): boolean => {
  if (password.length < config.auth.passwordMinLength) {
    return false;
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return false;
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }

  return true;
};

export const generateRandomPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>';
  const all = uppercase + lowercase + numbers + symbols;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};
