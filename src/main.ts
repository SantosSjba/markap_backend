import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { mkdir } from 'fs/promises';
import { join } from 'path';

async function bootstrap() {
  // Ensure base uploads directory exists before any request is served
  const uploadsDir = join(process.cwd(), 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

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

  const document = SwaggerModule.createDocument(app, config);

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation (Scalar): http://localhost:${port}/docs`);
  console.log(`📄 Swagger UI: http://localhost:${port}/api-docs`);
}

bootstrap();
