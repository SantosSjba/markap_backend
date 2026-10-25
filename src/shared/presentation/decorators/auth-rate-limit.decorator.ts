import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  type AuthRateLimitPolicy,
  AUTH_RATE_LIMIT_MESSAGE,
} from '../../../config/auth-rate-limit.config';

export const AUTH_RATE_LIMIT_POLICY = 'auth:rate-limit-policy';
/** Solo las rutas que declaran esta política consumen intentos del limitador. */
export function AuthRateLimit(policy: AuthRateLimitPolicy) {
  return applyDecorators(
    SetMetadata(AUTH_RATE_LIMIT_POLICY, policy),
    UseGuards(ThrottlerGuard),
    ApiResponse({ status: 429, description: AUTH_RATE_LIMIT_MESSAGE }),
  );
}
