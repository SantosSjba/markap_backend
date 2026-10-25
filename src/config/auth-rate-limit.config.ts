export type AuthRateLimitPolicy = 'login' | 'forgotPassword' | 'resetPassword';
export interface RateLimitRule {
  limit: number;
  ttl: number;
}
export type AuthRateLimitConfig = Record<AuthRateLimitPolicy, RateLimitRule>;
export const DEFAULT_AUTH_RATE_LIMITS: AuthRateLimitConfig = {
  login: { limit: 10, ttl: 60_000 },
  forgotPassword: { limit: 3, ttl: 900_000 },
  resetPassword: { limit: 5, ttl: 900_000 },
};
export const AUTH_RATE_LIMIT_MESSAGE =
  'Demasiados intentos. Espera antes de volver a intentarlo.';
