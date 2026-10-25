import { Module } from '@nestjs/common';
import { BudgetSpreadsheetPort } from '../shared/application/ports/budget-spreadsheet.port';
import { BusinessReferencePort } from '../shared/application/ports/business-reference.port';
import { CatalogQueryPort } from '../shared/application/ports/catalog-query.port';
import { PersistenceErrorPort } from '../shared/application/ports/persistence-error.port';
import { CatalogQueriesService } from '../shared/application/services/catalog-queries.service';
import { HashService } from '../shared/domain/services/hash.service';
import { MailService } from '../shared/domain/services/mail.service';
import { DatabaseModule } from '../shared/infrastructure/database/database.module';
import { PrismaBusinessReferenceAdapter } from '../shared/infrastructure/persistence/prisma-business-reference.adapter';
import { PrismaCatalogQueryAdapter } from '../shared/infrastructure/persistence/prisma-catalog-query.adapter';
import { PrismaErrorAdapter } from '../shared/infrastructure/persistence/prisma-error.adapter';
import { TokenModule } from '../shared/infrastructure/security/token.module';
import { BcryptHashService } from '../shared/infrastructure/services/bcrypt-hash.service';
import { NodemailerMailService } from '../shared/infrastructure/services/nodemailer-mail.service';
import { BudgetSpreadsheetAdapter } from '../shared/infrastructure/spreadsheets/budget-spreadsheet.adapter';
import { StorageModule } from '../shared/infrastructure/storage/storage.module';
import { GenArchivosController } from '../shared/presentation/controllers/gen-archivos.controller';
import { HealthController } from '../shared/presentation/controllers/health.controller';
import { AdminGuard } from '../shared/presentation/guards/admin.guard';
import { JwtAuthGuard } from '../shared/presentation/guards/jwt-auth.guard';
import { WsJwtGuard } from '../shared/presentation/guards/ws-jwt.guard';
@Module({
  imports: [DatabaseModule, StorageModule, TokenModule],
  controllers: [HealthController, GenArchivosController],
  providers: [
    CatalogQueriesService,
    { provide: CatalogQueryPort, useClass: PrismaCatalogQueryAdapter },
    { provide: PersistenceErrorPort, useClass: PrismaErrorAdapter },
    { provide: BudgetSpreadsheetPort, useClass: BudgetSpreadsheetAdapter },
    {
      provide: BusinessReferencePort,
      useClass: PrismaBusinessReferenceAdapter,
    },
    {
      provide: HashService,
      useClass: BcryptHashService,
    },
    {
      provide: MailService,
      useClass: NodemailerMailService,
    },
    JwtAuthGuard,
    AdminGuard,
    WsJwtGuard,
  ],
  exports: [
    CatalogQueriesService,
    PersistenceErrorPort,
    BudgetSpreadsheetPort,
    BusinessReferencePort,
    HashService,
    TokenModule,
    MailService,
    JwtAuthGuard,
    AdminGuard,
    WsJwtGuard,
  ],
})
export class RuntimeModule {}
