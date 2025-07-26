/**
 * Password security utilities for enhanced authentication
 */

// SHA-1 hash function for HaveIBeenPwned API
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Check if a password has been compromised in known data breaches
 * Uses the HaveIBeenPwned API with k-anonymity model
 */
export async function checkPasswordBreach(password: string): Promise<{ 
  isCompromised: boolean; 
  occurrences?: number; 
  error?: string 
}> {
  try {
    // Get SHA-1 hash of password
    const hash = await sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Query HaveIBeenPwned API with first 5 characters of hash
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Gaming-Platform-Security-Check'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check password breach status');
    }

    const data = await response.text();
    const hashes = data.split('\n');

    // Look for our hash suffix in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return {
          isCompromised: true,
          occurrences: parseInt(count.trim(), 10)
        };
      }
    }

    return { isCompromised: false };
  } catch (error) {
    console.error('Password breach check failed:', error);
    return { 
      isCompromised: false, 
      error: 'Unable to verify password security' 
    };
  }
}

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for better UX
} as const;

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  issues: string[];
  score: number; // 0-100
} {
  const issues: string[] = [];
  let score = 0;

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    issues.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 25;
    // Bonus for longer passwords
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  // Character type checks
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    issues.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 20;
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 15;
  }

  // Avoid common patterns
  if (/^(.)\1+$/.test(password)) {
    issues.push('Password cannot be all the same character');
    score = Math.max(0, score - 30);
  }

  if (/123456|password|qwerty|abc123/i.test(password)) {
    issues.push('Password contains common patterns');
    score = Math.max(0, score - 25);
  }

  return {
    isValid: issues.length === 0,
    issues,
    score: Math.min(100, score)
  };
}

/**
 * Generate secure random OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  // Use crypto.getRandomValues for secure random generation
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    otp += digits[randomArray[i] % digits.length];
  }
  
  return otp;
}

/**
 * OTP configuration settings
 */
export const OTP_CONFIG = {
  // Recommended: 3 minutes for improved security
  expiryMinutes: 3,
  length: 6,
  maxAttempts: 3,
  cooldownMinutes: 15, // After max attempts reached
} as const;