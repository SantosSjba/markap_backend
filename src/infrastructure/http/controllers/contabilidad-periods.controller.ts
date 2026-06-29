import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadPeriodOperationsService } from '../../../application/services/contabilidad-period-operations.service';
import type {
  CreateContabilidadCostCenterInput,
  UpdateContabilidadCostCenterInput,
} from '@domain/repositories/contabilidad-period.repository';

@ApiTags('Contabilidad — Periodos y centros de costo')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadPeriodsController {
  constructor(private readonly operations: ContabilidadPeriodOperationsService) {}

  @Get('contabilidad-periods')
  @ApiOperation({ summary: 'Listar periodos del año (crea los 12 meses si faltan)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  listPeriods(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('year') year?: string,
    @Query('legalEntityId') legalEntityId?: string,
  ) {
    const y = year ? Number(year) : undefined;
    return this.operations.listPeriods(applicationSlug, y, legalEntityId);
  }

  @Patch('contabilidad-periods/:id/status')
  @ApiOperation({ summary: 'Abrir o cerrar periodo contable' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  setPeriodStatus(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: 'OPEN' | 'CLOSED' },
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.operations.setPeriodStatus(applicationSlug, id, body.status, req.user?.sub ?? null);
  }

  @Get('contabilidad-cost-centers')
  @ApiOperation({ summary: 'Listar centros de costo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'search', required: false })
  listCostCenters(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('search') search?: string,
  ) {
    return this.operations.listCostCenters(applicationSlug, search);
  }

  @Post('contabilidad-cost-centers')
  @ApiOperation({ summary: 'Crear centro de costo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createCostCenter(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateContabilidadCostCenterInput,
  ) {
    return this.operations.createCostCenter(applicationSlug, body);
  }

  @Patch('contabilidad-cost-centers/:id')
  @ApiOperation({ summary: 'Actualizar centro de costo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateCostCenter(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateContabilidadCostCenterInput,
  ) {
    return this.operations.updateCostCenter(applicationSlug, id, body);
  }

  @Patch('contabilidad-cost-centers/:id/deactivate')
  @ApiOperation({ summary: 'Desactivar centro de costo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deactivateCostCenter(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
  ) {
    return this.operations.deactivateCostCenter(applicationSlug, id);
  }
}
