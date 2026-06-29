import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadLegalEntityOperationsService } from '../../../application/services/contabilidad-legal-entity-operations.service';

@ApiTags('Contabilidad — Entidades legales')
@Controller('contabilidad-legal-entities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadLegalEntitiesController {
  constructor(private readonly legalEntities: ContabilidadLegalEntityOperationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar entidades legales (RUC) del módulo contable' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  list(@Query('applicationSlug') applicationSlug?: string) {
    return this.legalEntities.list(applicationSlug);
  }
}
