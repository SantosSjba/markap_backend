import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { StorageModule } from '../../../../shared/infrastructure/storage/storage.module';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository';
import { RENTAL_FINANCIAL_CONFIG_REPOSITORY } from '../../domain/repositories/rental-financial-config.repository';
import { RENTAL_REPOSITORY } from '../../domain/repositories/rental.repository';
import { REPORT_REPOSITORY } from '../../domain/repositories/report.repository';
import { PaymentPrismaRepository } from './repositories/payment-prisma.repository';
import { RentalFinancialConfigPrismaRepository } from './repositories/rental-financial-config-prisma.repository';
import { RentalPrismaRepository } from './repositories/rental-prisma.repository';
import { ReportPrismaRepository } from './repositories/report-prisma.repository';
@Module({
  imports: [StorageModule, PrismaModule],
  controllers: [],
  providers: [
    {
      provide: RENTAL_REPOSITORY,
      useClass: RentalPrismaRepository,
    },
    {
      provide: RENTAL_FINANCIAL_CONFIG_REPOSITORY,
      useClass: RentalFinancialConfigPrismaRepository,
    },
    {
      provide: REPORT_REPOSITORY,
      useClass: ReportPrismaRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentPrismaRepository,
    },
  ],
  exports: [
    RENTAL_REPOSITORY,
    RENTAL_FINANCIAL_CONFIG_REPOSITORY,
    REPORT_REPOSITORY,
    PAYMENT_REPOSITORY,
  ],
})
export class RentalsPersistenceModule {}
