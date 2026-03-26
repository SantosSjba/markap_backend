import * as Joi from 'joi';

/**
 * Joi validation schema for all environment variables.
 * Used by ConfigModule to fail fast at startup with a clear error
 * if any required variable is missing or has an invalid value.
 */
export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().positive().default(3000),

  // Database – required, no fallback
  DATABASE_URL: Joi.string().uri().required(),

  // JWT – secret is required; expiry has a safe default
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.number().integer().positive().default(3600),

  // Frontend – required for CORS (must be a valid URL)
  FRONTEND_URL: Joi.string().uri().required(),

  // Mail – optional; if omitted, emails print to console in dev
  MAIL_HOST: Joi.string().default('smtp.gmail.com'),
  MAIL_PORT: Joi.number().integer().positive().default(587),
  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().default('"MARKAP" <noreply@markap.com>'),

  // Password reset
  PASSWORD_RESET_EXPIRES_MINUTES: Joi.number()
    .integer()
    .positive()
    .default(15),
  PASSWORD_RESET_GERENCIA_EMAIL: Joi.string()
    .email()
    .default('sistemas@markaphomes.com'),
});

/**
 * Environment configuration
 * Add your environment variables here
 */
export const envConfig = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10), // en segundos (1 hora por defecto)
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || '"MARKAP" <noreply@markap.com>',
  },
  passwordReset: {
    codeExpiresInMinutes: parseInt(
      process.env.PASSWORD_RESET_EXPIRES_MINUTES || '15',
      10
    ),
    codeLength: 6,
    /** Correo de sistemas: todos los códigos de recuperación se envían aquí para validación por administradores */
    gerenciaEmail:
      process.env.PASSWORD_RESET_GERENCIA_EMAIL || 'sistemas@markaphomes.com',
  },
});

export type EnvConfig = ReturnType<typeof envConfig>;
