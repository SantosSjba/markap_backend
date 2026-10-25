import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './composition/api.module';
import { envConfig, validateEnvironment } from './config/env.config';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { LoggingModule } from './shared/infrastructure/logging/logging.module';
import { StorageModule } from './shared/infrastructure/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validate: validateEnvironment,
    }),

    LoggingModule,

    // Infrastructure modules
    DatabaseModule,
    StorageModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
