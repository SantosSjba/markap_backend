import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../database/prisma.module';
import { AUDIT_RECORDER } from '../../application/ports/audit-recorder.port';
import { AuditService } from './audit.service';
import { AuditContextInterceptor } from './audit-context.interceptor';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    AuditService,
    { provide: AUDIT_RECORDER, useExisting: AuditService },
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
  ],
  exports: [AUDIT_RECORDER],
})
export class AuditModule {}
