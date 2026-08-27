/** Secure password policy shared by signup client + server validation. */

export interface PasswordRequirement {
  id: 'minLength' | 'uppercase' | 'lowercase' | 'number' | 'special';
  labelKey: string;
  test: (password: string) => boolean;
}

const SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9]/;

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'minLength',
    labelKey: 'auth.password.req.minLength',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    labelKey: 'auth.password.req.uppercase',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    labelKey: 'auth.password.req.lowercase',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    labelKey: 'auth.password.req.number',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    labelKey: 'auth.password.req.special',
    test: (password) => SPECIAL_CHAR_PATTERN.test(password),
  },
];

/** At least 8 chars, upper, lower, digit, and special character. */
export const SECURE_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const SECURE_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character';

export function evaluatePasswordRequirements(password: string): Record<
  PasswordRequirement['id'],
  boolean
> {
  const value = String(password || '');
  return {
    minLength: PASSWORD_REQUIREMENTS[0]!.test(value),
    uppercase: PASSWORD_REQUIREMENTS[1]!.test(value),
    lowercase: PASSWORD_REQUIREMENTS[2]!.test(value),
    number: PASSWORD_REQUIREMENTS[3]!.test(value),
    special: PASSWORD_REQUIREMENTS[4]!.test(value),
  };
}

export function isSecurePassword(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(String(password || '')));
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return String(password || '') === String(confirmPassword || '') && password.length > 0;
}
