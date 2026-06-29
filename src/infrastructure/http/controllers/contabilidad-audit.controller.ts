import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadAuditOperationsService } from '../../../application/services/contabilidad-audit-operations.service';

@ApiTags('Contabilidad — Auditoría')
@Controller('contabilidad-audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadAuditController {
  constructor(private readonly audit: ContabilidadAuditOperationsService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Consultar log de auditoría contable' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listLogs(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audit.list(applicationSlug, legalEntityId, {
      entityType,
      action,
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
