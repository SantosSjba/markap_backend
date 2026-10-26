import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { APPLICATION_ACCESS } from '../../shared/application/ports/application-access.port';
import { ApplicationAccessService } from './application/services/application-access.service';
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: APPLICATION_ACCESS, useClass: ApplicationAccessService },
  ],
  exports: [APPLICATION_ACCESS],
})
export class ApplicationAccessModule {}
