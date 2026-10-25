import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../shared/infrastructure/database/prisma.module';
import { PRODUCCION_CONFIG_REPOSITORY } from '../../domain/repositories/produccion-config.repository';
import { PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY } from '../../domain/repositories/produccion-extra-cost-catalog.repository';
import { PRODUCCION_FURNITURE_COSTING_REPOSITORY } from '../../domain/repositories/produccion-furniture-costing.repository';
import { PRODUCCION_FURNITURE_REPOSITORY } from '../../domain/repositories/produccion-furniture.repository';
import { PRODUCCION_LABOR_RATE_REPOSITORY } from '../../domain/repositories/produccion-labor-rate.repository';
import { PRODUCCION_MATERIAL_REPOSITORY } from '../../domain/repositories/produccion-material.repository';
import { PRODUCCION_PURCHASE_ORDER_REPOSITORY } from '../../domain/repositories/produccion-purchase-order.repository';
import { PRODUCCION_REPORTS_REPOSITORY } from '../../domain/repositories/produccion-reports.repository';
import {
  PRODUCCION_DELIVERY_REPOSITORY,
  PRODUCCION_ORDER_REPOSITORY,
  PRODUCCION_QUOTATION_REPOSITORY,
} from '../../domain/repositories/produccion-sales.repository';
import { PRODUCCION_SUPPLIER_REPOSITORY } from '../../domain/repositories/produccion-supplier.repository';
import { PRODUCCION_WORK_ORDER_REPOSITORY } from '../../domain/repositories/produccion-work-order.repository';
import { ProduccionConfigPrismaRepository } from './repositories/produccion-config-prisma.repository';
import { ProduccionExtraCostCatalogPrismaRepository } from './repositories/produccion-extra-cost-catalog-prisma.repository';
import { ProduccionFurnitureCostingPrismaRepository } from './repositories/produccion-furniture-costing-prisma.repository';
import { ProduccionFurniturePrismaRepository } from './repositories/produccion-furniture-prisma.repository';
import { ProduccionLaborRatePrismaRepository } from './repositories/produccion-labor-rate-prisma.repository';
import { ProduccionMaterialPrismaRepository } from './repositories/produccion-material-prisma.repository';
import { ProduccionPurchaseOrderPrismaRepository } from './repositories/produccion-purchase-order-prisma.repository';
import { ProduccionReportsPrismaRepository } from './repositories/produccion-reports-prisma.repository';
import {
  ProduccionDeliveryPrismaRepository,
  ProduccionOrderPrismaRepository,
  ProduccionQuotationPrismaRepository,
} from './repositories/produccion-sales-prisma.repository';
import { ProduccionSupplierPrismaRepository } from './repositories/produccion-supplier-prisma.repository';
import { ProduccionWorkOrderPrismaRepository } from './repositories/produccion-work-order-prisma.repository';
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: PRODUCCION_FURNITURE_REPOSITORY,
      useClass: ProduccionFurniturePrismaRepository,
    },
    {
      provide: PRODUCCION_LABOR_RATE_REPOSITORY,
      useClass: ProduccionLaborRatePrismaRepository,
    },
    {
      provide: PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY,
      useClass: ProduccionExtraCostCatalogPrismaRepository,
    },
    {
      provide: PRODUCCION_FURNITURE_COSTING_REPOSITORY,
      useClass: ProduccionFurnitureCostingPrismaRepository,
    },
    {
      provide: PRODUCCION_MATERIAL_REPOSITORY,
      useClass: ProduccionMaterialPrismaRepository,
    },
    {
      provide: PRODUCCION_SUPPLIER_REPOSITORY,
      useClass: ProduccionSupplierPrismaRepository,
    },
    {
      provide: PRODUCCION_PURCHASE_ORDER_REPOSITORY,
      useClass: ProduccionPurchaseOrderPrismaRepository,
    },
    {
      provide: PRODUCCION_WORK_ORDER_REPOSITORY,
      useClass: ProduccionWorkOrderPrismaRepository,
    },
    {
      provide: PRODUCCION_ORDER_REPOSITORY,
      useClass: ProduccionOrderPrismaRepository,
    },
    {
      provide: PRODUCCION_QUOTATION_REPOSITORY,
      useClass: ProduccionQuotationPrismaRepository,
    },
    {
      provide: PRODUCCION_DELIVERY_REPOSITORY,
      useClass: ProduccionDeliveryPrismaRepository,
    },
    {
      provide: PRODUCCION_REPORTS_REPOSITORY,
      useClass: ProduccionReportsPrismaRepository,
    },
    {
      provide: PRODUCCION_CONFIG_REPOSITORY,
      useClass: ProduccionConfigPrismaRepository,
    },
  ],
  exports: [
    PRODUCCION_FURNITURE_REPOSITORY,
    PRODUCCION_LABOR_RATE_REPOSITORY,
    PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY,
    PRODUCCION_FURNITURE_COSTING_REPOSITORY,
    PRODUCCION_MATERIAL_REPOSITORY,
    PRODUCCION_SUPPLIER_REPOSITORY,
    PRODUCCION_PURCHASE_ORDER_REPOSITORY,
    PRODUCCION_WORK_ORDER_REPOSITORY,
    PRODUCCION_ORDER_REPOSITORY,
    PRODUCCION_QUOTATION_REPOSITORY,
    PRODUCCION_DELIVERY_REPOSITORY,
    PRODUCCION_REPORTS_REPOSITORY,
    PRODUCCION_CONFIG_REPOSITORY,
  ],
})
export class ProduccionPersistenceModule {}
