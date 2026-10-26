import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AUDIT_RECORDER } from '../src/shared/application/ports/audit-recorder.port';
import { AUTH_PORT } from '../src/modules/identity/application/ports/auth.port';
import { AuthController } from '../src/modules/identity/presentation/controllers/auth.controller';
import { AuthRateLimitModule } from '../src/shared/infrastructure/security/auth-rate-limit.module';
import { AllExceptionsFilter } from '../src/shared/presentation/filters/http-exception.filter';
import { AdminGuard } from '../src/shared/presentation/guards/admin.guard';
import { JwtAuthGuard } from '../src/shared/presentation/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../src/shared/presentation/pipes/zod-validation.pipe';

@Controller('probe')
class UnrestrictedController {
  @Get() get() {
    return { status: 'ok' };
  }
}
const credentials = { email: 'client@example.com', password: 'password123' };

describe('límites de intentos en las rutas reales de autenticación', () => {
  let app: NestExpressApplication<Server>;
  const auth = {
    login: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    auth.login.mockRejectedValue(
      new UnauthorizedException('Credenciales inválidas'),
    );
    auth.requestPasswordReset.mockResolvedValue(undefined);
    auth.resetPassword.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              authRateLimit: {
                login: { limit: 2, ttl: 1000 },
                forgotPassword: { limit: 1, ttl: 5000 },
                resetPassword: { limit: 1, ttl: 5000 },
              },
            }),
          ],
        }),
        AuthRateLimitModule,
      ],
      controllers: [AuthController, UnrestrictedController],
      providers: [
        { provide: AUDIT_RECORDER, useValue: { record: jest.fn() } },
        { provide: AUTH_PORT, useValue: auth },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication<NestExpressApplication<Server>>();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');
  });
  afterEach(async () => {
    await app.close();
  });
  it('bloquea con 429 antes de ejecutar la autenticación, informa Retry-After y permite reintentar al vencer', async () => {
    for (const ip of ['198.51.100.1', '198.51.100.2'])
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-forwarded-for', ip)
        .send(credentials)
        .expect(401);
    const blocked = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-forwarded-for', '198.51.100.3')
      .send(credentials)
      .expect(429);
    expect(auth.login).toHaveBeenCalledTimes(2);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect(JSON.stringify(blocked.body)).toContain('Demasiados intentos');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(credentials)
      .expect(401);
    expect(auth.login).toHaveBeenCalledTimes(3);
  });
  it('mantiene contadores independientes para login, solicitud y confirmación de recuperación', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: credentials.email })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: credentials.email })
      .expect(429);
    const reset = {
      email: credentials.email,
      code: '123456',
      newPassword: 'ValidPassword123',
    };
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send(reset)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send(reset)
      .expect(429);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(credentials)
      .expect(401);
    expect(auth.requestPasswordReset).toHaveBeenCalledTimes(1);
    expect(auth.resetPassword).toHaveBeenCalledTimes(1);
    expect(auth.login).toHaveBeenCalledTimes(1);
  });
  it('separa clientes cuando la conexión procede de un proxy explícitamente confiable', async () => {
    app.set('trust proxy', 'loopback');
    for (const ip of ['198.51.100.10', '198.51.100.20'])
      for (let i = 0; i < 2; i++)
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .set('x-forwarded-for', ip)
          .send(credentials)
          .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-forwarded-for', '198.51.100.10')
      .send(credentials)
      .expect(429);
    expect(auth.login).toHaveBeenCalledTimes(4);
  });
  it('no aplica el limitador de autenticación a otras rutas', async () => {
    for (let i = 0; i < 4; i++)
      await request(app.getHttpServer()).get('/api/probe').expect(200);
  });
});
