import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './config';
import { DatabaseModule } from './infrastructure/database';
import { HttpModule } from './infrastructure/http';

@Module({
  imports: [
    // Configuration module - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),

    // Infrastructure modules
    DatabaseModule,
    HttpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
