import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { VENTAS_COMPLIANCE_REPOSITORY } from '../../domain/repositories/ventas-compliance.repository';
import { VENTAS_CONFIG_REPOSITORY } from '../../domain/repositories/ventas-config.repository';
import { VENTAS_FINANZAS_REPOSITORY } from '../../domain/repositories/ventas-finanzas.repository';
import { VENTAS_REPORTS_REPOSITORY } from '../../domain/repositories/ventas-reports.repository';
import { VENTAS_SALES_REPOSITORY } from '../../domain/repositories/ventas-sales.repository';
import { VentasCompliancePrismaRepository } from './repositories/ventas-compliance-prisma.repository';
import { VentasConfigPrismaRepository } from './repositories/ventas-config-prisma.repository';
import { VentasFinanzasPrismaRepository } from './repositories/ventas-finanzas-prisma.repository';
import { VentasReportsPrismaRepository } from './repositories/ventas-reports-prisma.repository';
import { VentasSalesPrismaRepository } from './repositories/ventas-sales-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: VENTAS_SALES_REPOSITORY,
      useClass: VentasSalesPrismaRepository,
    },
    {
      provide: VENTAS_FINANZAS_REPOSITORY,
      useClass: VentasFinanzasPrismaRepository,
    },
    {
      provide: VENTAS_REPORTS_REPOSITORY,
      useClass: VentasReportsPrismaRepository,
    },
    {
      provide: VENTAS_CONFIG_REPOSITORY,
      useClass: VentasConfigPrismaRepository,
    },
    {
      provide: VENTAS_COMPLIANCE_REPOSITORY,
      useClass: VentasCompliancePrismaRepository,
    },
  ],
  exports: [
    VENTAS_SALES_REPOSITORY,
    VENTAS_FINANZAS_REPOSITORY,
    VENTAS_REPORTS_REPOSITORY,
    VENTAS_CONFIG_REPOSITORY,
    VENTAS_COMPLIANCE_REPOSITORY,
  ],
})
export class VentasPersistenceModule {}
