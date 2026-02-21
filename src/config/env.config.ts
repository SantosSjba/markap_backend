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
    /** Correo de gerencia: todos los códigos de recuperación se envían aquí */
    gerenciaEmail:
      process.env.PASSWORD_RESET_GERENCIA_EMAIL || 'gerencia.markap@gmail.com',
  },
});

export type EnvConfig = ReturnType<typeof envConfig>;
