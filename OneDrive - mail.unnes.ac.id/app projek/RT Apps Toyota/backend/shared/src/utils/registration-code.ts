/**
 * Utility functions for generating and validating registration codes
 */

/**
 * Generate a unique registration code for neighborhoods
 * Format: RT/MUBAN + 6 random alphanumeric characters
 * Example: RT-A1B2C3, MUBAN-X9Y8Z7
 */
export const generateRegistrationCode = (prefix: string = 'RT'): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  
  // Add 6 random alphanumeric characters
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

/**
 * Generate registration code with retry logic to ensure uniqueness
 * @param prefix - Code prefix (RT or MUBAN)
 * @param checkExists - Function to check if code already exists
 * @param maxAttempts - Maximum retry attempts
 */
export const generateUniqueRegistrationCode = async (
  prefix: string = 'RT',
  checkExists: (code: string) => Promise<boolean>,
  maxAttempts: number = 5
): Promise<string> => {
  let attempts = 0;
  let code = generateRegistrationCode(prefix);
  
  while (attempts < maxAttempts) {
    const exists = await checkExists(code);
    if (!exists) {
      return code;
    }
    
    // Regenerate if duplicate
    code = generateRegistrationCode(prefix);
    attempts++;
  }
  
  throw new Error(`Failed to generate unique registration code after ${maxAttempts} attempts`);
};

/**
 * Validate registration code format
 */
export const isValidRegistrationCodeFormat = (code: string): boolean => {
  // Format: RT-XXXXXX or MUBAN-XXXXXX (where X is alphanumeric)
  const pattern = /^(RT|MUBAN)-[A-Z0-9]{6}$/;
  return pattern.test(code);
};
