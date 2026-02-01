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
});

export type EnvConfig = ReturnType<typeof envConfig>;
