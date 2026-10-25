import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { PROPERTY_REPOSITORY } from '../../domain/repositories/property.repository';
import { PropertyPrismaRepository } from './repositories/property-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: PROPERTY_REPOSITORY,
      useClass: PropertyPrismaRepository,
    },
  ],
  exports: [PROPERTY_REPOSITORY],
})
export class PropertiesPersistenceModule {}
