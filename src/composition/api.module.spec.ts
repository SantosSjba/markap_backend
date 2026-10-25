import { ConfigModule } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { NotificationsService } from '../modules/notifications/application/services/notifications.service';
import { RentalAlertsScheduler } from '../modules/notifications/infrastructure/scheduling/rental-alerts.scheduler';
import { NotificationsGateway } from '../modules/notifications/presentation/gateways/notifications.gateway';
import { PrismaService } from '../shared/infrastructure/database/prisma/prisma.service';
import { LoggingModule } from '../shared/infrastructure/logging/logging.module';
import { MinioObjectStorageService } from '../shared/infrastructure/storage/minio-object-storage.service';
import { ApiModule } from './api.module';

it('resuelve el grafo completo de módulos sin conexiones externas', async () => {
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          () => ({
            jwt: { secret: 'test-jwt-secret-at-least-16', expiresIn: 3600 },
          }),
        ],
      }),
      LoggingModule,
      ApiModule,
    ],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(MinioObjectStorageService)
    .useValue({})
    .overrideProvider(RentalAlertsScheduler)
    .useValue({})
    .compile();
  expect(module.get(NotificationsService)).toBeDefined();
  expect(module.get(NotificationsGateway)).toBeDefined();
  const app = module.createNestApplication();
  await app.init();
  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test').setVersion('1').build(),
    ),
  );
  expect(Object.keys(document.paths).length).toBeGreaterThan(100);
  expect(document.components?.schemas?.LoginDto).toMatchObject({
    properties: { email: { type: 'string' }, password: { type: 'string' } },
  });
  await app.close();
});
