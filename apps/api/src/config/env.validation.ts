import * as Joi from 'joi';

const WEAK_JWT_SECRETS = [
  'change-me-in-production-use-a-long-random-string',
  'change-me-refresh-secret-use-a-different-long-string',
  'replace-with-a-long-random-production-secret-at-least-32-chars',
  'replace-with-a-different-long-random-refresh-secret-32+',
  'secret',
  'changeme',
];

function jwtSecretSchema() {
  return Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .min(32)
      .invalid(...WEAK_JWT_SECRETS)
      .required()
      .messages({
        'any.invalid': 'JWT secrets must not use example/placeholder values in production',
        'string.min': 'JWT secrets must be at least 32 characters in production',
      }),
    otherwise: Joi.string().required(),
  });
}

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().default(3001),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  JWT_SECRET: jwtSecretSchema(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: jwtSecretSchema(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  /** Optional dedicated secret for signed lesson video URLs; falls back to JWT_SECRET. */
  JWT_ACCESS_SECRET: Joi.string().min(32).optional(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  /**
   * When true (and NODE_ENV is not production), OTP codes are returned as `devCode`
   * and logged. Forbidden in production. Defaults to true in non-production for local DX.
   */
  OTP_DEV_EXPOSE: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().valid('false', '').optional(),
    otherwise: Joi.string().valid('true', 'false').default('true'),
  }),
  TRUST_PROXY: Joi.string().valid('true', 'false').optional(),
  /** Force cookie SameSite override ('none' required when API+Web sit on different sites). */
  COOKIE_SAMESITE: Joi.string().valid('none', 'lax', 'strict').optional(),
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),
  APP_URL: Joi.string().optional(),
});
