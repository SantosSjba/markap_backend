import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentFacade } from './application/facades/payment.facade';
import { RentalFacade } from './application/facades/rental.facade';
import { PAYMENT_PORT } from './application/ports/payment.port';
import { RentalDocumentPort } from './application/ports/rental-document.port';
import { RENTAL_PORT } from './application/ports/rental.port';
import { RentalDocumentsService } from './application/services/rental-documents.service';
import { GetPaymentStatsUseCase } from './application/use-cases/payments/get-payment-stats.use-case';
import { ListOverduePaymentsUseCase } from './application/use-cases/payments/list-overdue-payments.use-case';
import { ListPaymentHistoryUseCase } from './application/use-cases/payments/list-payment-history.use-case';
import { ListPendingPaymentsUseCase } from './application/use-cases/payments/list-pending-payments.use-case';
import { RegisterPaymentUseCase } from './application/use-cases/payments/register-payment.use-case';
import { CancelRentalUseCase } from './application/use-cases/rentals/cancel-rental.use-case';
import { CreateRentalUseCase } from './application/use-cases/rentals/create-rental.use-case';
import { GetRentalByIdUseCase } from './application/use-cases/rentals/get-rental-by-id.use-case';
import { GetRentalFinancialBreakdownUseCase } from './application/use-cases/rentals/get-rental-financial-breakdown.use-case';
import { GetRentalFinancialConfigUseCase } from './application/use-cases/rentals/get-rental-financial-config.use-case';
import { GetRentalStatsUseCase } from './application/use-cases/rentals/get-rental-stats.use-case';
import { ListRentalsUseCase } from './application/use-cases/rentals/list-rentals.use-case';
import { UpdateRentalUseCase } from './application/use-cases/rentals/update-rental.use-case';
import { UpsertRentalFinancialConfigUseCase } from './application/use-cases/rentals/upsert-rental-financial-config.use-case';
import { GetActiveClientsReportUseCase } from './application/use-cases/reports/get-active-clients-report.use-case';
import { GetContractStatusSummaryUseCase } from './application/use-cases/reports/get-contract-status-summary.use-case';
import { GetContractsExpiringUseCase } from './application/use-cases/reports/get-contracts-expiring.use-case';
import { GetFinancialDistributionReportUseCase } from './application/use-cases/reports/get-financial-distribution-report.use-case';
import { GetMonthlyMetricsUseCase } from './application/use-cases/reports/get-monthly-metrics.use-case';
import { GetPropertiesWithoutContractUseCase } from './application/use-cases/reports/get-properties-without-contract.use-case';
import { GetRentalsByMonthUseCase } from './application/use-cases/reports/get-rentals-by-month.use-case';
import { GetReportsSummaryUseCase } from './application/use-cases/reports/get-reports-summary.use-case';
import { RentalDocumentAdapter } from './infrastructure/persistence/rental-document.adapter';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { RentalsController } from './presentation/controllers/rentals.controller';
import { ReportsController } from './presentation/controllers/reports.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule, NotificationsModule],
  controllers: [RentalsController, ReportsController, PaymentsController],
  providers: [
    RentalDocumentsService,
    { provide: RentalDocumentPort, useClass: RentalDocumentAdapter },
    CreateRentalUseCase,
    ListRentalsUseCase,
    GetRentalStatsUseCase,
    GetRentalByIdUseCase,
    UpdateRentalUseCase,
    GetRentalFinancialConfigUseCase,
    UpsertRentalFinancialConfigUseCase,
    GetRentalFinancialBreakdownUseCase,
    CancelRentalUseCase,
    GetReportsSummaryUseCase,
    GetContractsExpiringUseCase,
    GetPropertiesWithoutContractUseCase,
    GetActiveClientsReportUseCase,
    GetContractStatusSummaryUseCase,
    GetMonthlyMetricsUseCase,
    GetRentalsByMonthUseCase,
    GetFinancialDistributionReportUseCase,
    GetPaymentStatsUseCase,
    ListPendingPaymentsUseCase,
    RegisterPaymentUseCase,
    ListPaymentHistoryUseCase,
    ListOverduePaymentsUseCase,
    { provide: PAYMENT_PORT, useClass: PaymentFacade },
    { provide: RENTAL_PORT, useClass: RentalFacade },
  ],
  exports: [],
})
export class RentalsModule {}
