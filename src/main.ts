import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import 'dotenv/config';
import { mkdir } from 'fs/promises';
import { Logger, PinoLogger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { join } from 'path';
import pino from 'pino';
import { AppModule } from './app.module';
import { createLoggerOptions } from './shared/infrastructure/logging/logger.config';
import { AllExceptionsFilter } from './shared/presentation/filters/http-exception.filter';
import { ZodValidationPipe } from './shared/presentation/pipes/zod-validation.pipe';
// Calendar math and legacy `setHours` must use Peru time (no DST).
process.env.TZ = process.env.TZ || 'America/Lima';

async function bootstrap() {
  // Ensure base uploads directory exists before any request is served
  const uploadsDir = join(process.cwd(), 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    abortOnError: false,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.set(
    'trust proxy',
    app.get(ConfigService).getOrThrow<string | boolean>('http.trustProxy'),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  // Serve uploaded files as static assets under /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Global prefix for all routes (optional)
  app.setGlobalPrefix('api');

  // Enable CORS for frontend communication
  // FRONTEND_URL supports multiple origins separated by commas:
  // e.g. "http://localhost:5173,https://admin.markaphomes.com"
  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
    exposedHeaders: [
      'X-Request-Id',
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Markap API')
    .setDescription('Documentación de la API de Markap')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Endpoints de estado del sistema')
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  // Scalar API Reference - Modern API documentation UI
  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: 'purple',
    }),
  );

  // Also expose raw OpenAPI JSON at /api-json
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: '/api-json',
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, process.env.HOST || '0.0.0.0');

  const logger = await app.resolve(PinoLogger);
  logger.setContext('Bootstrap');
  logger.info(
    {
      event: 'application.started',
      port,
      apiPrefix: '/api',
      documentation: {
        scalar: '/docs',
        swagger: '/api-docs',
        openapi: '/api-json',
      },
    },
    'API iniciada',
  );
}

bootstrap().catch((error: unknown) => {
  const logger = pino(
    createLoggerOptions({
      ...process.env,
      LOG_PRETTY: 'false',
      LOG_LEVEL: 'fatal',
    }),
    pino.destination({ dest: 2, sync: true }),
  );
  logger.fatal(
    { event: 'application.startup.failed', context: 'Bootstrap', err: error },
    'No se pudo iniciar la API',
  );
  process.exit(1);
});
