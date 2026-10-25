import { type ExecutionContext, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import {
  AUTH_RATE_LIMIT_MESSAGE,
  type AuthRateLimitConfig,
  type AuthRateLimitPolicy,
  DEFAULT_AUTH_RATE_LIMITS,
} from '../../../config/auth-rate-limit.config';
import { AUTH_RATE_LIMIT_POLICY } from '../../presentation/decorators/auth-rate-limit.decorator';

/** Políticas por IP y ruta; el almacén estándar cuenta intentos dentro de esta instancia. */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, Reflector],
      useFactory: (
        config: ConfigService,
        reflector: Reflector,
      ): ThrottlerModuleOptions => {
        const policies =
          config.get<AuthRateLimitConfig>('authRateLimit') ??
          DEFAULT_AUTH_RATE_LIMITS;
        const resolve = (context: ExecutionContext) =>
          policies[
            reflector.get<AuthRateLimitPolicy>(
              AUTH_RATE_LIMIT_POLICY,
              context.getHandler(),
            ) ?? 'login'
          ];
        return {
          throttlers: [
            {
              name: 'default',
              limit: (context) => resolve(context).limit,
              ttl: (context) => resolve(context).ttl,
              blockDuration: (context) => resolve(context).ttl,
            },
          ],
          errorMessage: AUTH_RATE_LIMIT_MESSAGE,
        };
      },
    }),
  ],
  providers: [ThrottlerGuard],
  exports: [ThrottlerModule, ThrottlerGuard],
})
export class AuthRateLimitModule {}
