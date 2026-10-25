import { z } from 'zod';
import { DEFAULT_AUTH_RATE_LIMITS } from './auth-rate-limit.config';
import { isTrustedProxyConfiguration } from './trusted-proxy.config';

const positiveInteger = z.coerce.number().int().positive();
const requiredText = z.string().min(1);
const proxyText = z.string();
const trustedProxy = proxyText.refine(isTrustedProxyConfiguration, {
  error: 'Indica direcciones o redes de proxy explícitas.',
});
/** Configuración validada al arrancar; permite variables de sistema adicionales. */
export const envValidationSchema = z
  .looseObject({
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .optional(),
    LOG_PRETTY: z
      .preprocess(
        (value) =>
          value === 'true' ? true : value === 'false' ? false : value,
        z.boolean(),
      )
      .default(false),
    APP_VERSION: z.string().min(1).optional(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: positiveInteger.default(3000),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: positiveInteger.default(3600),
    FRONTEND_URL: requiredText,
    TRUST_PROXY: z.union([z.literal('false'), trustedProxy]).optional(),
    AUTH_LOGIN_LIMIT: positiveInteger.default(
      DEFAULT_AUTH_RATE_LIMITS.login.limit,
    ),
    AUTH_LOGIN_TTL_MS: positiveInteger
      .max(2_147_483_647)
      .default(DEFAULT_AUTH_RATE_LIMITS.login.ttl),
    AUTH_FORGOT_PASSWORD_LIMIT: positiveInteger.default(
      DEFAULT_AUTH_RATE_LIMITS.forgotPassword.limit,
    ),
    AUTH_FORGOT_PASSWORD_TTL_MS: positiveInteger
      .max(2_147_483_647)
      .default(DEFAULT_AUTH_RATE_LIMITS.forgotPassword.ttl),
    AUTH_RESET_PASSWORD_LIMIT: positiveInteger.default(
      DEFAULT_AUTH_RATE_LIMITS.resetPassword.limit,
    ),
    AUTH_RESET_PASSWORD_TTL_MS: positiveInteger
      .max(2_147_483_647)
      .default(DEFAULT_AUTH_RATE_LIMITS.resetPassword.ttl),
    RENTAL_ALERTS_ENABLED: z
      .preprocess(
        (value) =>
          value === 'true' ? true : value === 'false' ? false : value,
        z.boolean(),
      )
      .default(true),
    RENTAL_ALERTS_INTERVAL_MS: positiveInteger
      .max(2_147_483_647)
      .default(21_600_000),
    MAIL_HOST: requiredText.default('smtp.gmail.com'),
    MAIL_PORT: positiveInteger.default(587),
    MAIL_USER: z.string().default(''),
    MAIL_PASSWORD: z.string().default(''),
    MAIL_FROM: requiredText.default('"MARKAP" <noreply@markap.com>'),
    PASSWORD_RESET_EXPIRES_MINUTES: positiveInteger.default(15),
    PASSWORD_RESET_GERENCIA_EMAIL: z
      .email()
      .default('sistemas@markaphomes.com'),
    MINIO_ENDPOINT: z.url(),
    MINIO_ACCESS_KEY: requiredText,
    MINIO_SECRET_KEY: requiredText,
    MINIO_BUCKET: requiredText.default('markap'),
    MINIO_REGION: requiredText.default('us-east-1'),
    MINIO_USE_SSL: z
      .preprocess(
        (value) => (typeof value === 'string' ? value.toLowerCase() : value),
        z.union([
          z.boolean(),
          z.enum(['true', 'false']).transform((value) => value === 'true'),
        ]),
      )
      .default(true),
    API_PUBLIC_URL: z.url().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.LOG_PRETTY)
      ctx.addIssue({
        code: 'custom',
        path: ['LOG_PRETTY'],
        message: 'En producción los logs deben emitirse como JSON.',
      });
  });

export class EnvironmentValidationError extends Error {
  readonly name = 'EnvironmentValidationError';
  readonly code = 'INVALID_CONFIGURATION';
  constructor(
    readonly invalidFields: string[],
    issues: string,
  ) {
    super('Configuración de entorno inválida: ' + issues);
  }
}

export function validateEnvironment(input: Record<string, unknown>) {
  const result = envValidationSchema.safeParse(input);
  if (!result.success) {
    // Solo nombres de variables y reglas: nunca imprimir secretos ni valores recibidos.
    throw new EnvironmentValidationError(
      [...new Set(result.error.issues.map((issue) => issue.path.join('.')))],
      result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.code}`)
        .join('; '),
    );
  }
  return result.data;
}

/**
 * Environment configuration
 * Add your environment variables here
 */
export const envConfig = () => {
  const env = validateEnvironment(process.env);
  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV || 'development',
    database: {
      url: env.DATABASE_URL,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN, // en segundos (1 hora por defecto)
    },
    http: {
      trustProxy:
        env.TRUST_PROXY === 'false' ? false : (env.TRUST_PROXY ?? false),
    },
    authRateLimit: {
      login: { limit: env.AUTH_LOGIN_LIMIT, ttl: env.AUTH_LOGIN_TTL_MS },
      forgotPassword: {
        limit: env.AUTH_FORGOT_PASSWORD_LIMIT,
        ttl: env.AUTH_FORGOT_PASSWORD_TTL_MS,
      },
      resetPassword: {
        limit: env.AUTH_RESET_PASSWORD_LIMIT,
        ttl: env.AUTH_RESET_PASSWORD_TTL_MS,
      },
    },
    rentalAlerts: {
      enabled: env.RENTAL_ALERTS_ENABLED,
      intervalMs: env.RENTAL_ALERTS_INTERVAL_MS,
    },
    frontend: {
      url: env.FRONTEND_URL || 'http://localhost:5173',
    },
    mail: {
      host: env.MAIL_HOST || 'smtp.gmail.com',
      port: env.MAIL_PORT,
      user: env.MAIL_USER || '',
      password: env.MAIL_PASSWORD || '',
      from: env.MAIL_FROM || '"MARKAP" <noreply@markap.com>',
    },
    passwordReset: {
      codeExpiresInMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
      codeLength: 6,
      /** Correo de sistemas: todos los códigos de recuperación se envían aquí para validación por administradores */
      gerenciaEmail:
        env.PASSWORD_RESET_GERENCIA_EMAIL || 'sistemas@markaphomes.com',
    },
    storage: {
      endpoint: env.MINIO_ENDPOINT || '',
      accessKey: env.MINIO_ACCESS_KEY || '',
      secretKey: env.MINIO_SECRET_KEY || '',
      bucket: env.MINIO_BUCKET || 'markap',
      region: env.MINIO_REGION || 'us-east-1',
      useSsl: env.MINIO_USE_SSL,
    },
    apiPublicUrl: env.API_PUBLIC_URL || '',
  };
};

export type EnvConfig = ReturnType<typeof envConfig>;
