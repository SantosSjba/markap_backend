import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { PropertyFacade } from './application/facades/property.facade';
import { PropertyLookupPort } from './application/ports/property-lookup.port';
import { PROPERTY_PORT } from './application/ports/property.port';
import { PropertyLookupsService } from './application/services/property-lookups.service';
import { CreatePropertyUseCase } from './application/use-cases/properties/create-property.use-case';
import { DeletePropertyUseCase } from './application/use-cases/properties/delete-property.use-case';
import { GetPropertyByIdUseCase } from './application/use-cases/properties/get-property-by-id.use-case';
import { GetPropertyStatsUseCase } from './application/use-cases/properties/get-property-stats.use-case';
import { ListPropertiesUseCase } from './application/use-cases/properties/list-properties.use-case';
import { UpdatePropertyListingStatusUseCase } from './application/use-cases/properties/update-property-listing-status.use-case';
import { UpdatePropertyUseCase } from './application/use-cases/properties/update-property.use-case';
import { UploadPropertyMediaUseCase } from './application/use-cases/properties/upload-property-media.use-case';
import { PropertyLookupAdapter } from './infrastructure/persistence/property-lookup.adapter';
import { PropertiesController } from './presentation/controllers/properties.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule],
  controllers: [PropertiesController],
  providers: [
    PropertyLookupsService,
    UploadPropertyMediaUseCase,
    { provide: PropertyLookupPort, useClass: PropertyLookupAdapter },
    CreatePropertyUseCase,
    GetPropertyByIdUseCase,
    ListPropertiesUseCase,
    GetPropertyStatsUseCase,
    UpdatePropertyUseCase,
    UpdatePropertyListingStatusUseCase,
    DeletePropertyUseCase,
    { provide: PROPERTY_PORT, useClass: PropertyFacade },
  ],
  exports: [],
})
export class PropertiesModule {}
