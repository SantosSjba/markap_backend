import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig, envValidationSchema } from './config';
import { DatabaseModule } from './infrastructure/database';
import { HttpModule } from './infrastructure/http';
import { StorageModule } from './infrastructure/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,  // ignore vars not declared in the schema
        abortEarly: false,   // report ALL missing vars at once, not just the first
      },
    }),

    // Infrastructure modules
    DatabaseModule,
    StorageModule,
    HttpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
