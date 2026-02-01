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
  // Add more configuration as needed
  // jwt: {
  //   secret: process.env.JWT_SECRET,
  //   expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // },
});

export type EnvConfig = ReturnType<typeof envConfig>;
